// Raid Player Class
class RaidPlayer {
    constructor(config) {
        this.id = config.id;
        this.x = config.x;
        this.y = config.y;
        this.skin = config.skin;
        this.health = config.health;
        this.maxHealth = config.health;
        this.isPlayer = config.isPlayer || false;
        this.index = config.index || 0;
        
        this.speed = PLAYER_SPEED;
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 0.8;
        this.friction = 0.9;
        
        this.abilities = this.initializeAbilities();
        this.hitEffects = [];
        
        // Freeze effect status
        this.isFrozen = false;
        this.frozenUntil = 0;
        
        this.loadImage();
    }
    
    loadImage() {
        this.image = new Image();
        this.image.src = `../Loading Screen/${this.skin}`;
    }
    
    initializeAbilities() {
        // Initialize abilities based on character skin
        switch(this.skin) {
            case 'Shinnok.png':
                return {
                    q: new BurstBlast(),
                    r: new BonePrison()
                };
            case 'Mai.png':
                return {
                    q: new FanToss(),
                    r: new BlazingAura()
                };
            case 'Julia.png':
                return {
                    q: new WindPush(),
                    r: new TeamHeal()
                };
            case 'Lili.png':
                return {
                    q: new DashingKick(),
                    r: new ExecuteKick()
                };
            default:
                return {
                    q: new DashingKick(),
                    r: new ExecuteKick()
                };
        }
    }
    
    update(deltaTime, gameState) {
        // Update abilities cooldowns
        if (this.abilities) {
            for (const key in this.abilities) {
                if (this.abilities[key] && typeof this.abilities[key].update === 'function') {
                    this.abilities[key].update(deltaTime);
                }
            }
        }
        
        // Check frozen status
        if (this.isFrozen) {
            const now = performance.now();
            if (now >= this.frozenUntil) {
                this.isFrozen = false;
            } else {
                // If frozen, don't update movement
                return;
            }
        }
        
        // If player is dead, don't update movement
        if (this.health <= 0) return;
        
        // Player controlled by user (index 0)
        if (this.isPlayer && this.index === 0) {
            this.updatePlayerMovement(gameState.keys);
        } else {
            // AI movement for other players
            this.updateAIMovement(gameState);
        }
    }
    
    updatePlayerMovement(keys) {
        let targetVelX = 0;
        let targetVelY = 0;
        
        if ((keys.w || keys.s) && (keys.a || keys.d)) {
            this.speed = PLAYER_SPEED * 0.707; // Diagonal movement
        } else {
            this.speed = PLAYER_SPEED;
        }
        
        if (keys.d) targetVelX = this.speed;
        if (keys.a) targetVelX = -this.speed;
        if (keys.s) targetVelY = this.speed;
        if (keys.w) targetVelY = -this.speed;
        
        this.velocity.x += (targetVelX - this.velocity.x) * this.acceleration;
        this.velocity.y += (targetVelY - this.velocity.y) * this.acceleration;
        
        if (!keys.a && !keys.d) this.velocity.x *= this.friction;
        if (!keys.w && !keys.s) this.velocity.y *= this.friction;
        
        if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Keep player within canvas bounds
        this.restrictToCanvas();
    }
    
    updateAIMovement(gameState) {
        // Simple AI movement: try to maintain optimal distance from boss
        const boss = gameState.boss;
        if (!boss) return;
        
        const dx = boss.x - this.x;
        const dy = boss.y - this.y;
        const distanceToBoss = Math.sqrt(dx * dx + dy * dy);
        
        const optimalDistance = 350; // Optimal fighting distance
        const moveSpeed = 1; // Slower than player
        
        if (distanceToBoss > optimalDistance + 20) {
            // Move closer to boss
            this.x += (dx / distanceToBoss) * moveSpeed;
            this.y += (dy / distanceToBoss) * moveSpeed;
        } else if (distanceToBoss < optimalDistance - 20) {
            // Move away from boss
            this.x -= (dx / distanceToBoss) * moveSpeed;
            this.y -= (dy / distanceToBoss) * moveSpeed;
        }
        
        // Occasionally use abilities
        if (Math.random() < 0.01) { // 1% chance per frame
            this.useRandomAbility(gameState);
        }
        
        // Keep AI within canvas bounds
        this.restrictToCanvas();
    }
    
    restrictToCanvas() {
        // Get the canvas element
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Arena center and radius (matching the one defined in raid-renderer.js)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const arenaRadius = 900; // This should match the arena radius in raid-renderer.js
        
        // Calculate distance from player to center
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // If player is outside the arena circle, move them back inside
        if (distanceFromCenter > arenaRadius - 30) { // 30px buffer for player size
            // Calculate the angle from center to player
            const angle = Math.atan2(dy, dx);
            
            // Set player position to be on the arena boundary
            this.x = centerX + Math.cos(angle) * (arenaRadius - 30);
            this.y = centerY + Math.sin(angle) * (arenaRadius - 30);
            
            // Optional: add some "bounce back" effect to velocity
            this.velocity.x *= -0.3;
            this.velocity.y *= -0.3;
        }
    }
    
    useRandomAbility(gameState) {
        // Randomly use Q or R ability
        const abilityKey = Math.random() < 0.5 ? 'q' : 'r';
        
        if (this.abilities && this.abilities[abilityKey] && !this.abilities[abilityKey].isOnCooldown) {
            this.abilities[abilityKey].use(this, gameState);
        }
    }
    
    draw(ctx) {
        if (this.health <= 0) {
            // Draw dead player (gray tint)
            ctx.globalAlpha = 0.5;
        }
        
        if (this.image && this.image.complete) {
            // Draw player
            const width = PLAYER_SIZE.width;
            const height = PLAYER_SIZE.height;
            
            // Center the player
            const x = this.x - width / 2;
            const y = this.y - height / 2;
            
            // Draw frozen effect if player is frozen
            if (this.isFrozen) {
                // Draw freeze aura
                ctx.beginPath();
                ctx.arc(this.x, this.y, width / 1.8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 230, 255, 0.3)';
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, width / 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(150, 200, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw player with blue tint
                ctx.globalAlpha = this.health <= 0 ? 0.4 : 0.85;
                ctx.drawImage(this.image, x, y, width, height);
                
                // Draw ice crystal effects
                this.drawFrozenCrystals(ctx, x, y, width, height);
            } else {
                ctx.drawImage(this.image, x, y, width, height);
            }
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Draw hit effects
        this.drawHitEffects(ctx);
    }
    
    drawFrozenCrystals(ctx, x, y, width, height) {
        // Create ice crystal effects on the frozen player
        const now = performance.now();
        
        // Draw several small ice crystals on the player
        for (let i = 0; i < 5; i++) {
            const offsetX = (i - 2) * (width / 4);
            const offsetY = -5 - (i % 3) * 5;
            
            // Crystal shape
            ctx.beginPath();
            ctx.moveTo(x + width/2 + offsetX, y + height/4 + offsetY);
            ctx.lineTo(x + width/2 + offsetX - 5, y + height/4 + offsetY - 10);
            ctx.lineTo(x + width/2 + offsetX, y + height/4 + offsetY - 20);
            ctx.lineTo(x + width/2 + offsetX + 5, y + height/4 + offsetY - 10);
            ctx.closePath();
            
            // Crystal fill
            const pulse = 0.7 + Math.sin(now / 300 + i) * 0.3;
            ctx.fillStyle = `rgba(200, 240, 255, ${pulse})`;
            ctx.fill();
            
            // Crystal outline
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    drawHitEffects(ctx) {
        // Draw hit effects
        this.hitEffects = this.hitEffects.filter(effect => {
            const elapsed = performance.now() - effect.startTime;
            if (elapsed > effect.duration) return false;
            
            const alpha = 1 - elapsed / effect.duration;
            const size = 20 + elapsed / 25;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.fill();
            
            return true;
        });
    }
    
    takeDamage(amount) {
        if (this.health <= 0) return; // Already dead
        
        this.health = Math.max(0, this.health - amount);
        
        // Create hit effect
        this.hitEffects.push({
            startTime: performance.now(),
            duration: 500
        });
    }
} 