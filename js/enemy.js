class Enemy extends Character {
    constructor(config = {}) {
        // Set default Y position to 746 if not specified
        config.y = config.y || 746;
        super(config);
        
        // Enemy specific properties
        this.health = config.health || 100;
        this.maxHealth = this.health;
        this.damage = config.damage || 10;
        this.isInvincible = false;
        this.invincibilityFrames = 0;
        this.invincibilityDuration = 30; // frames of invincibility after taking damage
        
        // Movement behavior
        this.patrolPoints = config.patrolPoints || [];
        this.currentPatrolIndex = 0;
        this.patrolWaitTime = 0;
        this.patrolWaitDuration = 60; // frames to wait at patrol points
        this.detectionRange = config.detectionRange || 300;
        this.aggroRange = config.aggroRange || 150;
        this.isAggressive = false;
        this.target = null;
        
        // State management
        this.state = 'idle';
        this.lastState = 'idle';
        this.stateTimer = 0;
        this.stateDuration = 120; // frames before considering state change
        
        // Movement patterns
        this.movementPattern = config.movementPattern || 'patrol'; // 'patrol', 'chase', 'random'
        this.randomMoveTimer = 0;
        this.randomMoveInterval = 90; // frames between random movement decisions

        this.spriteConfig = {
            frameWidth: 341,
            frameHeight: 341,
            cols: 3,
            rows: 3,
            animations: {
                idle: { row: 0, frames: [0, 1, 2], speed: 15 },
                walk: { row: 1, frames: [0, 1, 2], speed: 8 },
                run: { row: 2, frames: [0, 1, 2], speed: 6 },
                // Optionally, combine walk/run for more frames:
                // walk: { frames: [ {row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:2,col:0}, {row:2,col:1}, {row:2,col:2} ], speed: 8 },
                // run: { frames: [ {row:1,col:0}, {row:1,col:1}, {row:1,col:2}, {row:2,col:0}, {row:2,col:1}, {row:2,col:2} ], speed: 6 },
            }
        };

        this.shootCooldown = 0;
        this.shootInterval = 90; // frames between shots
        this.kiteDistance = 300; // preferred distance to keep from player
        this.allowedY = [774, 746, 718]; // Updated Y positions
        this.targetY = this.y;
    }

    update(inputManager, player) {
        // Update invincibility frames
        if (this.isInvincible) {
            this.invincibilityFrames--;
            if (this.invincibilityFrames <= 0) {
                this.isInvincible = false;
            }
        }

        // AI logic only uses player position, not input or state
        this.kiteAndMove(player);
        this.shootCooldown--;
        if (this.shootCooldown <= 0 && player) {
            this.shootAtPlayer(player);
            this.shootCooldown = this.shootInterval;
        }
        
        // Update animation state based on movement
        if (Math.abs(this.x - this.lastX) > 0.1 || Math.abs(this.y - this.lastY) > 0.1) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
        
        // Store last position for movement detection
        this.lastX = this.x;
        this.lastY = this.y;
        
        this.updateAnimation();
        super.update(); // No inputManager for AI
    }

    kiteAndMove(player) {
        if (!player) return;
        // Kiting logic: maintain kiteDistance from player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let moveX = 0, moveY = 0;
        
        // Calculate movement
        if (distance < this.kiteDistance - 20) {
            // Too close, move away
            moveX = -dx / distance;
        } else if (distance > this.kiteDistance + 40) {
            // Too far, move closer
            moveX = dx / distance;
        }
        
        // Check for wall collision before moving horizontally
        const newX = this.x + moveX * this.speed;
        if (newX >= 0 && newX <= 19200 && !this.checkWallCollision(newX, this.y)) {
            this.x = newX;
        }
        
        // For y, pick a random allowedY if too close to player
        if (Math.abs(dy) < 10) {
            // Pick a new targetY different from current
            const otherYs = this.allowedY.filter(y => y !== this.y);
            this.targetY = otherYs[Math.floor(Math.random() * otherYs.length)];
        } else {
            // Move toward player's y, but only to allowedY
            this.targetY = this.getNearestAllowedY(player.y);
        }
        
        // Move toward targetY and ensure we stay at allowed Y positions
        if (Math.abs(this.y - this.targetY) > 1) {
            moveY = this.y < this.targetY ? 1 : -1;
            let newY = this.y + moveY * this.speed;
            this.y = this.getNearestAllowedY(newY);
        } else {
            this.y = this.getNearestAllowedY(this.y);
        }
        
        // Update direction
        this.direction = (this.x < player.x) ? 'right' : 'left';
    }

    handleMovement(player) {
        // Overridden by kiteAndMove
    }

    handlePatrolMovement() {
        if (this.patrolPoints.length === 0) return;

        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const distanceToTarget = Math.sqrt(
            Math.pow(this.x - targetPoint.x, 2) + 
            Math.pow(this.y - targetPoint.y, 2)
        );

        if (distanceToTarget < 5) {
            // Reached patrol point
            this.patrolWaitTime++;
            if (this.patrolWaitTime >= this.patrolWaitDuration) {
                this.patrolWaitTime = 0;
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
                this.state = 'idle';
            }
        } else {
            // Move towards patrol point
            this.state = 'walk';
            const dx = targetPoint.x - this.x;
            const dy = targetPoint.y - this.y;
            const angle = Math.atan2(dy, dx);
            const newX = this.x + Math.cos(angle) * this.speed;
            const newY = this.y + Math.sin(angle) * this.speed;
            
            // Check wall collision before moving
            if (!this.checkWallCollision(newX, this.y)) {
                this.x = newX;
            }
            if (!this.checkWallCollision(this.x, newY)) {
                this.y = newY;
            }
        }
    }

    handleChaseMovement(player, distanceToPlayer) {
        if (distanceToPlayer <= this.aggroRange) {
            this.isAggressive = true;
        } else if (distanceToPlayer > this.detectionRange) {
            this.isAggressive = false;
        }

        if (this.isAggressive) {
            this.state = 'run';
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            const newX = this.x + Math.cos(angle) * this.runSpeed;
            const newY = this.y + Math.sin(angle) * this.runSpeed;
            
            // Check wall collision before moving
            if (!this.checkWallCollision(newX, this.y)) {
                this.x = newX;
            }
            if (!this.checkWallCollision(this.x, newY)) {
                this.y = newY;
            }
        } else {
            this.handlePatrolMovement();
        }
    }

    handleRandomMovement() {
        this.randomMoveTimer++;
        
        if (this.randomMoveTimer >= this.randomMoveInterval) {
            this.randomMoveTimer = 0;
            
            // Randomly decide to move or stay idle
            if (Math.random() < 0.7) { // 70% chance to move
                const randomAngle = Math.random() * Math.PI * 2;
                const moveDistance = 50 + Math.random() * 100;
                this.targetX = this.x + Math.cos(randomAngle) * moveDistance;
                this.targetY = this.y + Math.sin(randomAngle) * moveDistance;
                this.state = 'walk';
            } else {
                this.state = 'idle';
            }
        }

        if (this.state === 'walk' && this.targetX !== undefined) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.state = 'idle';
                this.targetX = undefined;
                this.targetY = undefined;
            } else {
                const angle = Math.atan2(dy, dx);
                const newX = this.x + Math.cos(angle) * this.speed;
                const newY = this.y + Math.sin(angle) * this.speed;
                
                // Check wall collision before moving
                if (!this.checkWallCollision(newX, this.y)) {
                    this.x = newX;
                }
                if (!this.checkWallCollision(this.x, newY)) {
                    this.y = newY;
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return false;
        
        this.health -= amount;
        this.isInvincible = true;
        this.invincibilityFrames = this.invincibilityDuration;
        
        // Flash effect when taking damage
        this.state = 'hurt';
        setTimeout(() => {
            if (this.health > 0) {
                this.state = this.lastState;
            } else {
                this.state = 'death';
            }
        }, 200);

        return this.health <= 0;
    }

    getDistanceTo(target) {
        return Math.sqrt(
            Math.pow(this.x - target.x, 2) + 
            Math.pow(this.y - target.y, 2)
        );
    }

    considerStateChange(player) {
        if (!player) return;

        const distanceToPlayer = this.getDistanceTo(player);
        
        // Store current state before potential change
        this.lastState = this.state;

        // Consider different states based on distance and conditions
        if (distanceToPlayer <= this.aggroRange) {
            this.movementPattern = 'chase';
        } else if (this.patrolPoints.length > 0) {
            this.movementPattern = 'patrol';
        } else {
            this.movementPattern = 'random';
        }
    }

    render(ctx, camera = null) {
        // Flash effect when invincible
        if (this.isInvincible && Math.floor(this.invincibilityFrames / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Call parent render
        super.render(ctx, camera);

        // Reset alpha
        ctx.globalAlpha = 1.0;

        // Draw health bar if damaged
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx, camera);
        }
    }

    drawHealthBar(ctx, camera) {
        const barWidth = 50;
        const barHeight = 5;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 10;

        // Apply camera offset if present
        const drawX = camera ? x - camera.x : x;
        const drawY = camera ? y - camera.y : y;

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(drawX, drawY, barWidth, barHeight);

        // Draw health
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillStyle = this.health > this.maxHealth * 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(drawX, drawY, healthWidth, barHeight);
    }

    loadSpriteSheet(path) {
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            console.log('Enemy sprite sheet loaded:', path);
            // Do NOT call processSprite for enemy
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load enemy sprite sheet:', path);
        };
        this.spriteSheet.src = path;
    }

    shootAtPlayer(player) {
        // Try to get gameManager from window or global
        let gm = window.gameManager || (typeof gameManager !== 'undefined' ? gameManager : null);
        if (!gm) {
            console.warn('No gameManager found for adding projectile');
            return;
        }
        // Fire an ice ball toward the player's current position
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const vx = dx / dist;
        const vy = dy / dist;
        const proj = new Projectile({
            x: this.x,
            y: this.y,
            vx,
            vy,
            radius: 16,
            speed: 7,
            color: 'rgba(100,200,255,0.9)',
            owner: this
        });
        gm.addProjectile(proj);
    }

    getNearestAllowedY(y) {
        let minDist = Math.abs(y - this.allowedY[0]);
        let closestY = this.allowedY[0];
        for (let i = 1; i < this.allowedY.length; i++) {
            const dist = Math.abs(y - this.allowedY[i]);
            if (dist < minDist) {
                minDist = dist;
                closestY = this.allowedY[i];
            }
        }
        return closestY;
    }
} 