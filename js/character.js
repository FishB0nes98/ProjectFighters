class Character {
    constructor(config = {}) {
        // Character properties
        this.x = config.x || 400;
        this.y = config.y || 760; // Default spawn at Y=760 (ground level)
        this.width = config.width || 64;
        this.height = config.height || 64;
        this.speed = config.speed || 2;
        this.runSpeed = config.runSpeed || 4;
        this.state = 'idle';
        this.direction = 'right';
        this.frame = 0;
        this.frameTimer = 0;
        this.isCrouching = false;
        this.isRunning = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 15; // Duration of attack animation in frames
        
        // Health and damage properties
        this.health = config.health || 100;
        this.maxHealth = this.health;
        this.isInvincible = false;
        this.invincibilityFrames = 0;
        this.invincibilityDuration = 30;
        this.damage = config.damage || 10;
        this.hitEffects = []; // For visual feedback when taking damage
        
        // Add jump properties
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpStrength = -15; // Negative because Y increases downward
        this.gravity = 0.8;
        this.groundY = 760; // Default ground level
        
        // Sprite configuration
        this.spriteSheet = null;
        this.spriteConfig = {
            frameWidth: 341,  // Exact frame size from 1024x1024 spritesheet
            frameHeight: 341, // Exact frame size from 1024x1024 spritesheet
            cols: 3,
            rows: 3,
            animations: {
                idle: { row: 0, frames: [0], speed: 1 },
                walk: { row: 0, frames: [0, 1, 2], speed: 8 },
                run: { row: 1, frames: [0, 1, 2], speed: 6 },
                crouch: { row: 2, frames: [0], speed: 1 },
                crouchWalk: { row: 2, frames: [0, 1, 2], speed: 10 },
                attack: { 
                    // Alternating between 3rd sprite (row 0, col 2) and 9th sprite (row 2, col 2)
                    frames: [
                        { row: 0, col: 2 }, // 3rd sprite
                        { row: 2, col: 2 }, // 9th sprite
                        { row: 0, col: 2 }, // 3rd sprite
                        { row: 2, col: 2 }  // 9th sprite
                    ], 
                    speed: 8 
                },
                attackHeavy: { 
                    // Heavy attack uses 9th sprite primarily with 3rd sprite accent
                    frames: [
                        { row: 2, col: 2 }, // 9th sprite
                        { row: 0, col: 2 }, // 3rd sprite
                        { row: 2, col: 2 }, // 9th sprite
                        { row: 2, col: 2 }  // 9th sprite
                    ], 
                    speed: 10 
                },
                jump: {
                    frames: [ { row: 2, col: 2 } ],
                    speed: 8
                }
            }
        };
        
        // Load sprite sheet if provided
        if (config.spriteSheetPath) {
            this.loadSpriteSheet(config.spriteSheetPath);
        }
        
        this.attackSpriteSheet = null;
        if (config.attackSpriteSheetPath) {
            this.loadAttackSpriteSheet(config.attackSpriteSheetPath);
        }
        
        this.idleSpriteSheet = null;
        this.idleSwitchTimer = 0;
        this.idleSwitchInterval = 40; // Switch every 30 frames
        if (config.idleSpriteSheetPath) {
            this.loadIdleSpriteSheet(config.idleSpriteSheetPath);
        }
        
        // Ability properties
        this.abilities = {
            q: new DaggerThrow(), // Add dagger throw ability
            e: new ButterflyTrail(), // Add butterfly trail ability
            r: new ExecuteAttack() // Add execute attack ability
        };
        this.activeDagger = null; // Track active dagger for teleport
        this.butterflyTrail = null; // Track active butterfly trail
        this.isDashingExecute = false; // Track if currently dashing for R
        this.executeDashData = null; // Store dash state
        
        // No longer using lane system - platform-based movement only
    }
    
    loadSpriteSheet(path) {
        this.spriteSheet = new Image();
        this.spriteSheet.onload = () => {
            console.log('Character sprite sheet loaded:', path);
            // Process the sprite sheet to remove blue background
            this.processSprite();
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load character sprite sheet:', path);
        };
        this.spriteSheet.src = path;
    }
    
    processSprite() {
        // Create a canvas to process the sprite
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.spriteSheet.width;
        canvas.height = this.spriteSheet.height;
        
        // Draw the original sprite
        ctx.drawImage(this.spriteSheet, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Remove blue background - more comprehensive detection
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip if already transparent
            if (a === 0) continue;
            
            // Multiple blue background detection methods
            const isBlueBackground = 
                // Method 1: Blue is significantly higher than red and green
                (b > r + 20 && b > g + 20 && b > 80) ||
                // Method 2: Specific blue color ranges (common in pixel art)
                (r >= 45 && r <= 95 && g >= 130 && g <= 180 && b >= 200 && b <= 255) ||
                // Method 3: Grayish-blue backgrounds
                (r >= 80 && r <= 120 && g >= 120 && g <= 160 && b >= 160 && b <= 200 && 
                 Math.abs(r - g) < 30 && b > r + 20) ||
                // Method 4: Light blue backgrounds
                (r >= 150 && g >= 180 && b >= 220 && b > r + 30);
            
            if (isBlueBackground) {
                // Make pixel transparent
                data[i + 3] = 0;
            }
        }
        
        // Put the processed image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Create a new image from the processed canvas
        this.processedSprite = new Image();
        this.processedSprite.src = canvas.toDataURL();
        
        console.log('Sprite background removed');
    }
    
    loadAttackSpriteSheet(path) {
        this.attackSpriteSheet = new Image();
        this.attackSpriteSheet.onload = () => {
            console.log('Attack sprite sheet loaded:', path);
        };
        this.attackSpriteSheet.onerror = () => {
            console.error('Failed to load attack sprite sheet:', path);
        };
        this.attackSpriteSheet.src = path;
    }
    
    loadIdleSpriteSheet(path) {
        this.idleSpriteSheet = new Image();
        this.idleSpriteSheet.onload = () => {
            console.log('Idle sprite sheet loaded:', path);
        };
        this.idleSpriteSheet.onerror = () => {
            console.error('Failed to load idle sprite sheet:', path);
        };
        this.idleSpriteSheet.src = path;
    }
    
    update(inputManager, extraData = {}) {
        if (!inputManager) return;
        // Handle input and movement
        this.handleInput(inputManager, extraData);
        
        // Update jump physics with platform collision
        if (this.isJumping) {
            this.jumpVelocity += this.gravity;
            const newY = this.y + this.jumpVelocity;
            
            // Check for wall collision during vertical movement
            if (this.checkWallCollision(this.x, newY)) {
                // Hit a wall during jump/fall - stop movement
                this.isJumping = false;
                this.jumpVelocity = 0;
                // Stay at current position
        } else {
                // Check for platform collision during jump
                const landingPlatform = this.checkPlatformCollision(this.x, newY);
                
                if (landingPlatform && this.jumpVelocity > 0) {
                    // Land on platform
                    this.y = landingPlatform.y - this.height / 2;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                } else if (newY >= this.groundY) {
                    // Land on default ground
                    this.y = this.groundY;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                } else {
                    // Continue jumping/falling
                    this.y = newY;
                }
            }
        } else {
            // Apply gravity when not on a platform
            const onPlatform = this.checkPlatformCollision(this.x, this.y);
            
            if (!onPlatform) {
                // Not on any platform - check if we need to fall
                if (this.y != this.groundY) {
                    // Not at ground level - start falling
                    this.isJumping = true;
                    this.jumpVelocity = this.y < this.groundY ? 1 : 0; // Start with small downward velocity if above ground
                }
            }
        }
        // Update animation frame
        this.updateAnimation();
        // Idle switch timer
        if (this.state === 'idle') {
            this.idleSwitchTimer++;
            if (this.idleSwitchTimer > this.idleSwitchInterval * 2) {
                this.idleSwitchTimer = 0;
            }
        } else {
            this.idleSwitchTimer = 0;
        }
        
        // Update invincibility frames
        if (this.isInvincible) {
            this.invincibilityFrames--;
            if (this.invincibilityFrames <= 0) {
                this.isInvincible = false;
            }
        }
        
        // Update hit effects
        const currentTime = performance.now();
        this.hitEffects = this.hitEffects.filter(effect => 
            currentTime - effect.startTime < effect.duration
        );
        
        // Handle ability inputs
        if (inputManager.isKeyPressed('q') || inputManager.isKeyPressed('Q')) {
            if (this.abilities.q) {
                this.abilities.q.execute(this, window.gameManager);
            }
        }
        
        // Handle E ability (Butterfly Trail)
        if (inputManager.isKeyPressed('e') || inputManager.isKeyPressed('E')) {
            if (this.abilities.e) {
                this.abilities.e.execute(this, window.gameManager);
            }
        }
        
        // Handle R ability (Execute Attack)
        if (inputManager.isKeyPressed('r') || inputManager.isKeyPressed('R')) {
            if (this.abilities.r) {
                this.abilities.r.execute(this, window.gameManager);
            }
        }
        
        // Update butterfly trail if active
        if (this.butterflyTrail) {
            this.butterflyTrail.update();
            if (this.butterflyTrail.isExpired()) {
                this.butterflyTrail = null;
            }
        }
        
        // Update execute dash if active
        if (this.isDashingExecute && this.executeDashData) {
            this.abilities.r.updateDash(this, window.gameManager);
        }
    }
    
    handleInput(inputManager, extraData = {}) {
        let moving = false;
        let dx = 0;
        
        // Handle attack input (mouse click) - highest priority
        if (extraData.isAttacking && !this.isAttacking) {
            // Start attack
            this.isAttacking = true;
            this.attackTimer = 0;
            this.frame = 0;
            this.frameTimer = 0;
            
            // Determine attack type based on current state
            if (this.isRunning) {
                this.state = 'attackHeavy';
            } else {
                this.state = 'attack';
            }
            return;
        }
        
        // Update attack timer
        if (this.isAttacking) {
            this.attackTimer++;
            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackTimer = 0;
            } else {
                return;
            }
        }
        
        // Handle jump input (space key)
        const spacePressed = inputManager.isKeyPressed(' ') || inputManager.isKeyPressed('Space');
        if (spacePressed && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpStrength;
        }
        
        // W/S no longer used for movement
        
        // Check for crouch and run
        this.isCrouching = inputManager.isKeyPressed('c') || inputManager.isKeyPressed('C');
        const shiftPressed = inputManager.isKeyPressed('shift') || inputManager.isKeyPressed('Shift');
        this.isRunning = !this.isCrouching && shiftPressed;
        
        // Movement input
        const leftPressed = inputManager.isKeyPressed('a') || inputManager.isKeyPressed('A') || inputManager.isKeyPressed('ArrowLeft');
        const rightPressed = inputManager.isKeyPressed('d') || inputManager.isKeyPressed('D') || inputManager.isKeyPressed('ArrowRight');
        
        // Calculate horizontal movement
        if (leftPressed && !rightPressed) {
            dx = -1;
            this.direction = 'left';
            moving = true;
        } else if (rightPressed && !leftPressed) {
            dx = 1;
            this.direction = 'right';
            moving = true;
        }
        // If both keys are pressed or neither, no movement (dx = 0, moving = false)
        
        // Apply horizontal movement with collision detection
        if (dx !== 0) {
            const baseSpeed = this.isCrouching ? this.speed * 0.5 : this.speed;
            const finalSpeed = this.isRunning ? this.runSpeed : baseSpeed;
            const newX = this.x + dx * finalSpeed;
            
            // Check for wall collisions
            if (!this.checkWallCollision(newX, this.y) && newX >= 0 && newX <= 19200) {
                this.x = newX;
            }
        }
        
        // Determine animation state
        if (!this.isAttacking) {
            if (this.isJumping) {
                this.state = 'jump';
            } else if (this.isCrouching) {
                this.state = moving ? 'crouchWalk' : 'crouch';
            } else if (moving) {
                this.state = this.isRunning ? 'run' : 'walk';
            } else {
                this.state = 'idle';
            }
        }
    }
    
    updateAnimation() {
        const anim = this.spriteConfig.animations[this.state];
        if (!anim) return;
        
        this.frameTimer++;
        if (this.frameTimer >= anim.speed) {
            this.frameTimer = 0;
            this.frame = (this.frame + 1) % anim.frames.length;
        }
    }
    
    render(ctx, camera = null) {
        // Draw shadow first
        this.drawShadow(ctx, this.x, this.y);
        // Calculate screen position
        const screenX = this.x - (camera ? camera.x : 0);
        const screenY = this.y - (camera ? camera.y : 0);
        // If dashing, ONLY draw the 2nd idle.png sprite and return
        if (this.isDashingExecute && this.idleSpriteSheet) {
            ctx.save();
            if (this.direction === 'left') {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.idleSpriteSheet,
                    this.spriteConfig.frameWidth * 1, 0,
                    this.spriteConfig.frameWidth, this.spriteConfig.frameHeight,
                    -screenX - this.width / 2, screenY - this.height / 2,
                    this.width, this.height
                );
            } else {
                ctx.drawImage(
                    this.idleSpriteSheet,
                    this.spriteConfig.frameWidth * 1, 0,
                    this.spriteConfig.frameWidth, this.spriteConfig.frameHeight,
                    screenX - this.width / 2, screenY - this.height / 2,
                    this.width, this.height
                );
            }
            ctx.restore();
            return;
        }
        
        // Draw butterfly trail zone if active
        if (this.butterflyTrail) {
            this.butterflyTrail.render(ctx, camera);
            
            // Apply speed boost if character is in the zone
            if (this.butterflyTrail.isInZone(this.x, this.y)) {
                // Store original speeds if not already stored
                if (!this.originalSpeeds) {
                    this.originalSpeeds = {
                        speed: this.speed,
                        runSpeed: this.runSpeed
                    };
                }
                // Apply speed boost to all movement types
                this.speed = this.originalSpeeds.speed * this.butterflyTrail.speedBoost;
                this.runSpeed = this.originalSpeeds.runSpeed * this.butterflyTrail.speedBoost;
            } else {
                // Restore original speeds when leaving the zone
                if (this.originalSpeeds) {
                    this.speed = this.originalSpeeds.speed;
                    this.runSpeed = this.originalSpeeds.runSpeed;
                    this.originalSpeeds = null;
                }
            }
        }
        
        // Draw character sprite
        ctx.save();
        
        // Apply hit effect if any
        if (this.hitEffects.length > 0) {
            const effect = this.hitEffects[this.hitEffects.length - 1];
            const timeSinceStart = performance.now() - effect.startTime;
            const progress = timeSinceStart / effect.duration;
            
            if (effect.isHeal) {
                // Green flash for healing
                ctx.globalAlpha = 0.5 * (1 - progress);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            } else {
                // Red flash for damage
                ctx.globalAlpha = 0.5 * (1 - progress);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            }
            
            // Draw flash effect
            ctx.fillRect(screenX - this.width/2, screenY - this.height/2, this.width, this.height);
        }
        
        // Flash effect when invincible
        if (this.isInvincible && Math.floor(this.invincibilityFrames / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Use processed sprite if available, otherwise fall back to original
        let spriteToUse = this.processedSprite || this.spriteSheet;
        if ((this.state === 'attack' || this.state === 'attackHeavy') && this.attackSpriteSheet) {
            spriteToUse = this.attackSpriteSheet;
        }
        if (!spriteToUse || !ctx) return;
        
        // Get current animation and frame
        const anim = this.spriteConfig.animations[this.state];
        if (!anim) return;
        
        let col, row;
        
        // Idle animation alternates between idle.png and main sprite sheet
        if (this.state === 'idle' && this.idleSpriteSheet) {
            if (this.idleSwitchTimer < this.idleSwitchInterval) {
                spriteToUse = this.idleSpriteSheet;
            } else {
                spriteToUse = this.processedSprite || this.spriteSheet;
            }
        }
        
        // For idle, always use first sprite (row 0, col 0)
        if (this.state === 'idle' && this.idleSpriteSheet && spriteToUse === this.idleSpriteSheet) {
            col = 0;
            row = 0;
        } else if (this.state === 'jump') {
            // Always use sprite 9 (row 2, col 2) for jump
            col = 2;
            row = 1;
        } else if (this.state === 'attack' || this.state === 'attackHeavy') {
            // Attack animations use row/col objects
            const frameData = anim.frames[this.frame];
            if (frameData && typeof frameData === 'object') {
                col = frameData.col;
                row = frameData.row;
            } else {
                // Fallback to standard format
                const frameIndex = anim.frames[this.frame] || 0;
                col = frameIndex % this.spriteConfig.cols;
                row = anim.row || 0;
            }
        } else {
            // Standard animations use frame indices
            const frameIndex = anim.frames[this.frame];
            col = frameIndex % this.spriteConfig.cols;
            row = anim.row;
        }
        
        const sx = col * this.spriteConfig.frameWidth;
        const sy = row * this.spriteConfig.frameHeight;
        
        // Flip sprite for left direction
        if (this.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(
                spriteToUse,
                sx, sy,
                this.spriteConfig.frameWidth, this.spriteConfig.frameHeight,
                -screenX - this.width/2, screenY - this.height/2,
                this.width, this.height
            );
        } else {
            ctx.drawImage(
                spriteToUse,
                sx, sy,
                this.spriteConfig.frameWidth, this.spriteConfig.frameHeight,
                screenX - this.width/2, screenY - this.height/2,
                this.width, this.height
            );
        }
        
        ctx.restore();
    }
    
    drawShadow(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + this.height/2 - 5, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Boundary checking
    constrainToBounds(width, height) {
        this.x = Math.max(this.width/2, Math.min(width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(height - this.height/2, this.y));
    }
    
    // Get character bounds for collision detection
    getBounds() {
        const narrowWidth = this.width * 0.6; // Use same narrow width for consistency
        return {
            x: this.x - narrowWidth/2,
            y: this.y - this.height/2,
            width: narrowWidth,
            height: this.height,
            centerX: this.x,
            centerY: this.y
        };
    }
    
    // Set position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    // Get current state info
    getState() {
        return {
            state: this.state,
            direction: this.direction,
            frame: this.frame,
            position: { x: this.x, y: this.y },
            isCrouching: this.isCrouching,
            isRunning: this.isRunning,
            isAttacking: this.isAttacking,
            attackTimer: this.attackTimer
        };
    }
    
    takeDamage(amount) {
        if (this.isInvincible || this.health <= 0) return false;
        
        // Apply damage
        this.health = Math.max(0, this.health - amount);
        
        // Set invincibility
        this.isInvincible = true;
        this.invincibilityFrames = this.invincibilityDuration;
        
        // Add hit effect
        this.hitEffects.push({
            startTime: performance.now(),
            duration: 500
        });
        
        // Update state
        this.state = 'hurt';
        setTimeout(() => {
            if (this.health > 0) {
                this.state = 'idle';
            } else {
                this.state = 'death';
                this.onDeath();
            }
        }, 200);
        
        return this.health <= 0;
    }
    
    heal(amount) {
        if (this.health <= 0) return false; // Can't heal if dead
        
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        const actualHeal = this.health - oldHealth;
        
        // Add heal effect
        this.hitEffects.push({
            startTime: performance.now(),
            duration: 500,
            isHeal: true
        });
        
        return actualHeal > 0;
    }
    
    onDeath() {
        // Override this in subclasses if needed
        console.log('Character died');
    }
    
    // Helper method to get nearest allowed Y position
    getNearestAllowedY(y) {
        let closestY = this.allowedY[0];
        let minDist = Math.abs(y - this.allowedY[0]);
        for (let i = 1; i < this.allowedY.length; i++) {
            const dist = Math.abs(y - this.allowedY[i]);
            if (dist < minDist) {
                minDist = dist;
                closestY = this.allowedY[i];
            }
        }
        return closestY;
    }
    
    // Check for platform collision (for landing/standing on platforms)
    checkPlatformCollision(x, y) {
        if (!window.gameManager || !window.gameManager.stageManager) {
            return null;
        }
        
        const boundaries = window.gameManager.stageManager.getStageBoundaries();
        // Use same narrower collision box for consistency
        const narrowWidth = this.width * 0.6;
        const characterBottom = y + this.height / 2;
        const characterLeft = x - narrowWidth / 2;
        const characterRight = x + narrowWidth / 2;
        
        // Find the highest platform the character is standing on
        let standingPlatform = null;
        let highestPlatformY = this.groundY;
        
        for (const boundary of boundaries) {
            // Check all solid boundaries that can be stood on (including walls)
            if (['platform', 'ground', 'ice_platform', 'lava_platform', 'weak_platform', 'pit_cover', 'wall', 'ice_wall', 'pillar', 'arena_wall', 'ceiling', 'stalactite', 'crystal', 'ramp_up', 'ramp_down'].includes(boundary.type)) {
                // Check if character is standing on top of the platform
                if (characterBottom >= boundary.y - 10 && // Allow character to be slightly above platform
                    characterBottom <= boundary.y + 20 && // Allow some overlap
                    characterRight > boundary.x + 5 && // Character must be mostly over the platform (adjusted for narrow hitbox)
                    characterLeft < boundary.x + boundary.width - 5) {
                    // This platform is under the character - check if it's the highest one
                    if (boundary.y <= highestPlatformY) {
                        standingPlatform = boundary;
                        highestPlatformY = boundary.y;
                    }
                }
            }
        }
        return standingPlatform;
    }
    
    // Check for wall collision (for horizontal movement blocking)
    checkWallCollision(x, y) {
        if (!window.gameManager || !window.gameManager.stageManager) {
            return false;
        }
        
        const boundaries = window.gameManager.stageManager.getStageBoundaries();
        // Use narrower collision box for better gameplay feel
        const narrowWidth = this.width * 0.6; // Use 60% of actual width for collision
        const characterTop = y - this.height / 2 + 2;
        const characterBottom = y + this.height / 2 - 2;
        const characterLeft = x - narrowWidth / 2;
        const characterRight = x + narrowWidth / 2;
        
        for (const boundary of boundaries) {
            // Check all boundary types for collision
            if (['wall', 'ice_wall', 'pillar', 'arena_wall', 'ceiling', 'stalactite', 'crystal'].includes(boundary.type)) {
                // These act as solid walls that block movement completely from all directions
                if (characterRight > boundary.x && 
                    characterLeft < boundary.x + boundary.width &&
                    characterBottom > boundary.y && 
                    characterTop < boundary.y + boundary.height) {
                    return true;
                }
            }
            // For platforms and ramps, only block if character is trying to move through them from the side
            else if (['platform', 'ice_platform', 'lava_platform', 'weak_platform', 'ramp_up', 'ramp_down', 'pit_cover'].includes(boundary.type)) {
                // Only block horizontal movement if character is at the same height as the platform
                if (characterRight > boundary.x && 
                    characterLeft < boundary.x + boundary.width &&
                    characterTop < boundary.y + boundary.height && 
                    characterBottom > boundary.y) {
                    // Only block if character is mostly inside the platform (not just touching the top)
                    const overlapY = Math.min(characterBottom, boundary.y + boundary.height) - Math.max(characterTop, boundary.y);
                    if (overlapY > this.height * 0.2) { // Reduced from 0.3 to 0.2 for more strict collision
                        return true;
                    }
                }
            }
            // Hazards block movement but also cause damage
            else if (['hazard'].includes(boundary.type)) {
                if (characterRight > boundary.x && 
                    characterLeft < boundary.x + boundary.width &&
                    characterBottom > boundary.y && 
                    characterTop < boundary.y + boundary.height) {
                    // Could add damage here if needed
                    return true;
                }
            }
        }
        return false;
    }
}

// Dagger Throw Ability
class DaggerThrow {
    constructor() {
        this.cooldown = 10000; // 10 seconds in milliseconds
        this.lastUsed = 0;
        this.projectileSpeed = 12;
        this.range = 200;
        this.damage = 20;
        this.hitboxRadius = 20; // X radius
        this.hitboxHeight = 40; // Y radius
        this.canTeleport = false; // Track if teleport is available
        this.activeProjectile = null; // Track the active projectile
        this.hitEnemy = null; // Track enemy that was hit
        this.teleportTimeout = null; // Track teleport timeout
        this.abilityContainer = null; // Reference to ability container
    }
    
    canUse() {
        return Date.now() - this.lastUsed >= this.cooldown;
    }
    
    clearTeleport() {
        this.canTeleport = false;
        this.hitEnemy = null;
        if (this.activeProjectile) {
            this.activeProjectile.startFadeOut();
            setTimeout(() => {
                if (this.activeProjectile) {
                    this.activeProjectile.active = false;
                    this.activeProjectile = null;
                }
            }, 300);
        }
        if (this.teleportTimeout) {
            clearTimeout(this.teleportTimeout);
            this.teleportTimeout = null;
        }
    }
    
    setAbilityContainer(container) {
        this.abilityContainer = container;
    }
    
    execute(character, gameManager) {
        if (!gameManager) return;
        
        // Check for teleport first, regardless of cooldown
        if (this.canTeleport) {
            // Clear the teleport timeout since we're using it
            if (this.teleportTimeout) {
                clearTimeout(this.teleportTimeout);
                this.teleportTimeout = null;
            }
            
            // Start fade out of the dagger if it exists
            if (this.activeProjectile) {
                this.activeProjectile.startFadeOut();
            }
            
            // Teleport to either hit enemy or dagger location
            if (this.hitEnemy && this.hitEnemy.active) {
                character.x = this.hitEnemy.x;
                character.y = this.hitEnemy.y;
            } else if (character.activeDagger) {
                character.x = character.activeDagger.x;
                character.y = character.activeDagger.y;
            }
            
            // Clear references after teleport
            setTimeout(() => {
                if (this.activeProjectile) {
                    this.activeProjectile.active = false;
                    this.activeProjectile = null;
                }
                character.activeDagger = null;
                this.canTeleport = false;
                this.hitEnemy = null;
            }, 300); // Wait for fade out to complete
            
            // Update ability container if available
            if (this.abilityContainer) {
                this.abilityContainer.classList.add('on-cooldown');
                setTimeout(() => {
                    if (this.abilityContainer) {
                        this.abilityContainer.classList.remove('on-cooldown');
                    }
                }, this.cooldown);
            }
            
            return;
        }
        
        // If we can't throw a new dagger yet, return
        if (!this.canUse()) return;
        
        // Clear any existing teleport state
        this.clearTeleport();
        
        // Calculate direction based on character facing
        const dirX = character.direction === 'right' ? 1 : -1;
        const dirY = 0; // No vertical movement
        
        // Create dagger projectile
        const dagger = new DaggerProjectile({
            x: character.x,
            y: character.y,
            dirX: dirX,
            dirY: dirY,
            speed: this.projectileSpeed,
            range: this.range,
            damage: this.damage,
            hitboxRadius: this.hitboxRadius,
            hitboxHeight: this.hitboxHeight,
            owner: character,
            onLand: () => {
                // Enable teleport when dagger lands
                this.canTeleport = true;
                // Set timeout to clear teleport after 10 seconds
                this.teleportTimeout = setTimeout(() => {
                    this.clearTeleport();
                }, this.cooldown);
            },
            onHit: (enemy) => {
                // Store hit enemy and enable teleport
                this.hitEnemy = enemy;
                this.canTeleport = true;
                // Set timeout to clear teleport after 10 seconds
                this.teleportTimeout = setTimeout(() => {
                    this.clearTeleport();
                }, this.cooldown);
            }
        });
        
        // Add to game manager
        gameManager.addProjectile(dagger);
        
        // Update cooldown and store references
        this.lastUsed = Date.now();
        this.activeProjectile = dagger;
        character.activeDagger = dagger;
        
        // Update ability container if available
        if (this.abilityContainer) {
            this.abilityContainer.classList.add('on-cooldown');
            setTimeout(() => {
                if (this.abilityContainer) {
                    this.abilityContainer.classList.remove('on-cooldown');
                }
            }, this.cooldown);
        }
    }
}

// Dagger Projectile
class DaggerProjectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.dirX = config.dirX;
        this.dirY = config.dirY;
        this.speed = config.speed;
        this.range = config.range;
        this.damage = config.damage;
        this.hitboxRadius = config.hitboxRadius;
        this.hitboxHeight = config.hitboxHeight;
        this.owner = config.owner;
        this.onLand = config.onLand;
        this.onHit = config.onHit;
        this.distance = 0;
        this.active = true;
        this.rotation = 0;
        this.landed = false;
        this.landEffect = null;
        this.fadeOutTimer = null; // For smooth fade out
        this.hasHitEnemy = false; // Track if we've hit an enemy
    }
    
    update() {
        if (!this.active) return;
        
        if (this.fadeOutTimer) {
            // Handle fade out animation
            const progress = (Date.now() - this.fadeOutTimer.startTime) / this.fadeOutTimer.duration;
            if (progress >= 1) {
                this.active = false;
                return;
            }
        }
        
        if (!this.landed && !this.hasHitEnemy) {
            // Move projectile (daggers pass through walls)
            this.x += this.dirX * this.speed;
            this.y += this.dirY * this.speed;
            
            // Update distance and rotation
            this.distance += this.speed;
            this.rotation += 0.2;
            
            // Check if reached max range
            if (this.distance >= this.range) {
                this.land();
            }
        } else if (this.landEffect) {
            // Update landing effect
            const now = Date.now();
            const progress = (now - this.landEffect.startTime) / this.landEffect.duration;
            
            if (progress >= 1) {
                // Reset effect for next flash
                this.landEffect = {
                    startTime: now,
                    duration: 500, // Flash every 500ms
                    alpha: 0.7
                };
            }
        }
    }
    
    land() {
        if (!this.hasHitEnemy) {
            this.landed = true;
            this.landEffect = {
                startTime: Date.now(),
                duration: 500, // Flash every 500ms
                alpha: 0.7
            };
            if (this.onLand) this.onLand();
        }
    }
    
    hitEnemy(enemy) {
        if (!this.hasHitEnemy) {
            this.hasHitEnemy = true;
            this.landed = true;
            this.landEffect = {
                startTime: Date.now(),
                duration: 500,
                alpha: 0.7
            };
            if (this.onHit) this.onHit(enemy);
        }
    }
    
    startFadeOut() {
        if (!this.fadeOutTimer) {
            this.fadeOutTimer = {
                startTime: Date.now(),
                duration: 300 // 300ms fade out
            };
        }
    }
    
    render(ctx, camera) {
        if (!this.active) return;
        
        let drawX = this.x, drawY = this.y;
        if (camera) {
            drawX -= camera.x;
            drawY -= camera.y;
        }
        
        // Calculate fade out alpha if fading
        let alpha = 1;
        if (this.fadeOutTimer) {
            const progress = (Date.now() - this.fadeOutTimer.startTime) / this.fadeOutTimer.duration;
            alpha = Math.max(0, 1 - progress);
        }
        
        if (!this.landed) {
            // Draw flying dagger
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(drawX, drawY);
            ctx.rotate(this.rotation);
            
            // Draw purple-pink dagger
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(-5, 0, 20, 0);
            gradient.addColorStop(0, '#ff69b4'); // Pink
            gradient.addColorStop(1, '#9370db'); // Purple
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        } else if (this.landEffect) {
            // Draw landed dagger with flash effect
            const progress = (Date.now() - this.landEffect.startTime) / this.landEffect.duration;
            const flashAlpha = Math.sin(progress * Math.PI) * this.landEffect.alpha * alpha;
            
            ctx.save();
            ctx.translate(drawX, drawY);
            
            // Draw flash effect
            ctx.globalAlpha = flashAlpha;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ff69b4';
            ctx.fill();
            
            // Draw dagger
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(20, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(-5, 0, 20, 0);
            gradient.addColorStop(0, '#ff69b4'); // Pink
            gradient.addColorStop(1, '#9370db'); // Purple
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            radius: this.hitboxRadius,
            height: this.hitboxHeight
        };
    }

}

// Butterfly Trail Ability
class ButterflyTrail {
    constructor() {
        this.cooldown = 12000; // 12 seconds cooldown
        this.lastUsed = 0;
        this.duration = 5000; // 5 seconds duration
        this.speedBoost = 1.5; // 50% speed boost
        this.zoneWidth = 500; // Width of the butterfly zone
        this.butterflies = []; // Array to store butterfly particles
        this.startTime = 0;
        this.isActive = false;
        this.abilityContainer = null; // Reference to ability container
        this.character = null; // Store reference to character
    }

    canUse() {
        return Date.now() - this.lastUsed >= this.cooldown;
    }

    execute(character, gameManager) {
        if (!this.canUse()) return;

        this.lastUsed = Date.now();
        this.startTime = Date.now();
        this.isActive = true;
        this.character = character; // Store character reference

        // Create butterfly trail zone
        const zoneX = character.direction === 'right' ? character.x : character.x - this.zoneWidth;
        character.butterflyTrail = new ButterflyZone({
            x: zoneX,
            y: character.y,
            width: this.zoneWidth,
            height: 200,
            duration: this.duration,
            speedBoost: this.speedBoost,
            direction: character.direction,
            onExpire: () => {
                // Reset character speed when zone expires
                if (this.character && this.character.originalSpeeds) {
                    this.character.speed = this.character.originalSpeeds.speed;
                    this.character.runSpeed = this.character.originalSpeeds.runSpeed;
                    this.character.originalSpeeds = null;
                }
            }
        });

        // Add butterflies
        for (let i = 0; i < 20; i++) {
            this.butterflies.push(new Butterfly({
                x: zoneX + Math.random() * this.zoneWidth,
                y: character.y - 100 + Math.random() * 200,
                direction: character.direction
            }));
        }

        // Update ability container if available
        if (this.abilityContainer) {
            this.abilityContainer.classList.add('on-cooldown');
            setTimeout(() => {
                if (this.abilityContainer) {
                    this.abilityContainer.classList.remove('on-cooldown');
                }
            }, this.cooldown);
        }
    }

    update() {
        if (!this.isActive) return;

        // Update butterflies
        this.butterflies.forEach(butterfly => butterfly.update());

        // Remove expired butterflies
        this.butterflies = this.butterflies.filter(butterfly => !butterfly.isExpired());

        // Check if ability duration has expired
        if (Date.now() - this.startTime >= this.duration) {
            this.isActive = false;
            this.butterflies = [];
            // Clear any remaining butterflies and effects
            if (this.butterflies.length > 0) {
                this.butterflies.forEach(butterfly => butterfly.active = false);
                this.butterflies = [];
            }
            // Reset character speed if still in zone
            if (this.character && this.character.originalSpeeds) {
                this.character.speed = this.character.originalSpeeds.speed;
                this.character.runSpeed = this.character.originalSpeeds.runSpeed;
                this.character.originalSpeeds = null;
            }
        }
    }

    setAbilityContainer(container) {
        this.abilityContainer = container;
    }

    render(ctx, camera) {
        if (!this.isActive) return;

        // Render butterflies
        this.butterflies.forEach(butterfly => butterfly.render(ctx, camera));
    }
}

class ButterflyZone {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.duration = config.duration;
        this.speedBoost = config.speedBoost;
        this.direction = config.direction;
        this.startTime = Date.now();
        this.alpha = 0.5; // Increased from 0.3 to 0.5 for better visibility
        this.onExpire = config.onExpire; // Callback for when zone expires
    }

    isExpired() {
        const expired = Date.now() - this.startTime >= this.duration;
        if (expired && this.onExpire) {
            this.onExpire();
        }
        return expired;
    }

    isInZone(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y - this.height/2 && y <= this.y + this.height/2;
    }

    update() {
        // No update needed for zone
    }

    render(ctx, camera) {
        if (this.isExpired()) return;

        const screenX = this.x - (camera ? camera.x : 0);
        const screenY = this.y - (camera ? camera.y : 0);

        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Create gradient for zone with stronger pink colors
        const gradient = ctx.createLinearGradient(
            screenX, screenY - this.height/2,
            screenX + this.width, screenY + this.height/2
        );
        gradient.addColorStop(0, 'rgba(255, 105, 180, 0.4)'); // Stronger pink
        gradient.addColorStop(0.5, 'rgba(255, 182, 193, 0.6)'); // Stronger light pink
        gradient.addColorStop(1, 'rgba(255, 105, 180, 0.4)'); // Stronger pink
        
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY - this.height/2, this.width, this.height);
        
        // Add stronger sparkle effect
        const time = Date.now() / 1000;
        for (let i = 0; i < 8; i++) { // Increased from 5 to 8 sparkles
            const sparkleX = screenX + Math.sin(time + i) * this.width/2 + this.width/2;
            const sparkleY = screenY + Math.cos(time + i) * this.height/2;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2); // Increased size from 2 to 3
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Increased opacity from 0.5 to 0.7
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Butterfly {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.direction = config.direction;
        this.speed = 1 + Math.random() * 2;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.1;
        this.amplitude = 20 + Math.random() * 30;
        this.frequency = 0.02 + Math.random() * 0.03;
        this.startTime = Date.now();
        this.lifeTime = 2000 + Math.random() * 3000; // 2-5 seconds lifetime
        this.scale = 0.5 + Math.random() * 0.5;
        this.wingAngle = 0;
        this.wingSpeed = 0.1 + Math.random() * 0.2;
    }

    update() {
        // Update position with wave motion
        this.angle += this.angleSpeed;
        this.x += this.direction === 'right' ? this.speed : -this.speed;
        this.y += Math.sin(this.angle) * this.amplitude * this.frequency;
        
        // Update wing animation
        this.wingAngle += this.wingSpeed;
    }

    isExpired() {
        return Date.now() - this.startTime >= this.lifeTime;
    }

    render(ctx, camera) {
        if (this.isExpired()) return;

        const screenX = this.x - (camera ? camera.x : 0);
        const screenY = this.y - (camera ? camera.y : 0);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(this.scale, this.scale);
        
        // Draw butterfly wings
        const wingSpread = Math.sin(this.wingAngle) * 0.5 + 0.5; // 0 to 1
        const wingAngle = Math.PI * 0.25 * wingSpread; // 0 to PI/4
        
        // Left wing
        ctx.save();
        ctx.rotate(-wingAngle);
        this.drawWing(ctx, -1);
        ctx.restore();
        
        // Right wing
        ctx.save();
        ctx.rotate(wingAngle);
        this.drawWing(ctx, 1);
        ctx.restore();
        
        // Draw body
        ctx.beginPath();
        ctx.moveTo(-2, -6);
        ctx.lineTo(2, -6);
        ctx.lineTo(1, 6);
        ctx.lineTo(-1, 6);
        ctx.closePath();
        
        const bodyGradient = ctx.createLinearGradient(0, -6, 0, 6);
        bodyGradient.addColorStop(0, '#FF1493'); // Deep pink
        bodyGradient.addColorStop(1, '#FF69B4'); // Hot pink
        
        ctx.fillStyle = bodyGradient;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 5;
        ctx.strokeStyle = '#FFB6C1';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawWing(ctx, side) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            side * 15, -10,
            side * 25, -5,
            side * 30, 0
        );
        ctx.bezierCurveTo(
            side * 25, 5,
            side * 15, 10,
            0, 0
        );
        
        const wingGradient = ctx.createRadialGradient(
            side * 15, 0, 0,
            side * 15, 0, 30
        );
        wingGradient.addColorStop(0, '#FFB6C1'); // Light pink
        wingGradient.addColorStop(1, '#FF69B4'); // Hot pink
        
        ctx.fillStyle = wingGradient;
        ctx.fill();
        
        // Add wing details
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            side * 10, -5,
            side * 20, -2,
            side * 25, 0
        );
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Add ExecuteAttack ability class
class ExecuteAttack {
    constructor() {
        this.cooldown = 25000; // 25 seconds
        this.lastUsed = 0;
        this.dashDistance = 250;
        this.dashDuration = 200; // ms, slightly longer for visible dash
        this.damage = 80;
        this.hitEnemy = null;
        this.abilityContainer = null;
    }
    canUse() {
        return Date.now() - this.lastUsed >= this.cooldown;
    }
    setAbilityContainer(container) {
        this.abilityContainer = container;
    }
    execute(character, gameManager) {
        if (!this.canUse() || character.isDashingExecute) return;
        // Start dash
        character.isDashingExecute = true;
        const dir = character.direction === 'right' ? 1 : -1;
        character.executeDashData = {
            startX: character.x,
            startY: character.y,
            dir,
            dashStart: performance.now(),
            hit: false
        };
        this.lastUsed = Date.now();
        // UI feedback
        if (this.abilityContainer) {
            this.abilityContainer.classList.add('on-cooldown');
            setTimeout(() => {
                if (this.abilityContainer) this.abilityContainer.classList.remove('on-cooldown');
            }, this.cooldown);
        }
    }
    updateDash(character, gameManager) {
        if (!character.isDashingExecute || !character.executeDashData) return;
        const dash = character.executeDashData;
        const elapsed = performance.now() - dash.dashStart;
        const progress = Math.min(elapsed / this.dashDuration, 1);
        // Use 2nd sprite from idle.png
        character.state = 'executeDash';
        
        // Calculate new position
        const moveX = dash.dir * this.dashDistance * progress;
        const newX = dash.startX + moveX;
        
        // Check for wall collision during dash
        if (character.checkWallCollision(newX, character.y)) {
            // Hit a wall - stop dash immediately
            character.isDashingExecute = false;
            character.executeDashData = null;
            character.state = 'idle';
            return;
        }
        
        // Move character smoothly
        character.x = newX;
        
        // Check collision with enemies (first only)
        if (!dash.hit && gameManager && gameManager.enemies) {
            for (const enemy of gameManager.enemies) {
                if (!enemy || enemy.health <= 0) continue;
                // Simple collision: overlap in X and vertical proximity
                if (Math.abs(character.x - enemy.x) < character.width && Math.abs(character.y - enemy.y) < 30) {
                    const isDead = enemy.takeDamage(this.damage);
                    if (isDead) gameManager.removeEnemy(enemy);
                    dash.hit = true;
                    break;
                }
            }
        }
        // End dash
        if (progress >= 1) {
            character.isDashingExecute = false;
            character.executeDashData = null;
            character.state = 'idle';
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character;
} 