// Raid Ability System

class Ability {
    constructor(name, cooldown, icon) {
        this.name = name;
        this.cooldown = cooldown * 1000; // Convert to milliseconds
        this.currentCooldown = 0;
        this.isOnCooldown = false;
        this.icon = icon || null;
        this.lastUsedTime = 0;
    }

    use(player, gameState) {
        if (this.isOnCooldown) return false;
        
        // Record usage time
        this.lastUsedTime = performance.now();
        this.isOnCooldown = true;
        this.currentCooldown = this.cooldown;
        
        // Execute ability-specific action
        this.execute(player, gameState);
        
        return true;
    }
    
    execute(player, gameState) {
        // To be overridden by specific abilities
        console.log(`Using ability: ${this.name}`);
    }
    
    update(deltaTime) {
        if (this.isOnCooldown) {
            this.currentCooldown -= deltaTime;
            
            if (this.currentCooldown <= 0) {
                this.isOnCooldown = false;
                this.currentCooldown = 0;
            }
        }
    }
    
    getCooldownPercent() {
        if (!this.isOnCooldown) return 0;
        return this.currentCooldown / this.cooldown;
    }
}

// Dashing Kick (Q) - Lili
class DashingKick extends Ability {
    constructor() {
        super("Dashing Kick", 5); // 5 seconds cooldown
        this.damage = 40;
        this.range = 200;
        this.dashDuration = 300; // milliseconds
        this.hitboxWidth = 50;
        this.isDashing = false;
        this.dashStartTime = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
    }
    
    execute(player, gameState) {
        // Calculate dash direction towards boss
        const boss = gameState.boss;
        if (!boss) return false;
        
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Set dash target
        this.dashStartX = player.x;
        this.dashStartY = player.y;
        this.dashTargetX = player.x + dirX * this.range;
        this.dashTargetY = player.y + dirY * this.range;
        
        // Start dash
        this.isDashing = true;
        this.dashStartTime = performance.now();
        
        // Check if boss is in range for immediate damage
        if (distance <= this.range + boss.sizeMultiplier * 30) {
            boss.health -= this.damage;
            this.createHitEffect(boss);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update dash animation
        if (this.isDashing) {
            const now = performance.now();
            const elapsed = now - this.dashStartTime;
            
            if (elapsed >= this.dashDuration) {
                this.isDashing = false;
            }
        }
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500
            });
        }
    }
}

// Execute Kick (R) - Lili
class ExecuteKick extends Ability {
    constructor() {
        super("Execute Kick", 15); // 15 seconds cooldown
        this.damage = 80;
        this.range = 150;
        this.executeDamageMultiplier = 2.0; // Double damage below 30% HP
        this.executeThreshold = 0.3; // 30% HP threshold
    }
    
    execute(player, gameState) {
        // Find boss
        const boss = gameState.boss;
        if (!boss) return false;
        
        // Check distance to boss
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If boss in range, deal damage
        if (distance <= this.range + boss.sizeMultiplier * 30) {
            // Check if boss is below execute threshold
            let damageAmount = this.damage;
            
            if (boss.health / boss.maxHealth <= this.executeThreshold) {
                damageAmount *= this.executeDamageMultiplier;
                
                // Create larger hit effect for execute
                this.createLargeHitEffect(boss);
            } else {
                // Create normal hit effect
                this.createHitEffect(boss);
            }
            
            // Apply damage
            boss.health -= damageAmount;
        }
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500
            });
        }
    }
    
    createLargeHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 800,
                isExecute: true
            });
        }
    }
}

// Burst Blast (Q) - Shinnok
class BurstBlast extends Ability {
    constructor() {
        super("Burst Blast", 8); // 8 seconds cooldown
        this.damage = 60;
        this.range = 400;
        this.radius = 100;
        this.projectileSpeed = 10;
        this.activeProjectiles = [];
        this.blastEffects = [];
    }
    
    execute(player, gameState) {
        // Calculate projectile direction towards boss
        const boss = gameState.boss;
        if (!boss) return false;
        
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Create and launch projectile
        const projectile = {
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            playerId: player.id,
            distance: 0,
            maxDistance: this.range,
            startTime: performance.now()
        };
        
        this.activeProjectiles.push(projectile);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update projectiles
        this.activeProjectiles = this.activeProjectiles.filter(projectile => {
            // Move projectile
            projectile.x += projectile.dirX * this.projectileSpeed;
            projectile.y += projectile.dirY * this.projectileSpeed;
            
            // Update distance traveled
            projectile.distance += this.projectileSpeed;
            
            // Check if projectile has reached max range
            if (projectile.distance >= projectile.maxDistance) {
                this.createBlastEffect(projectile);
                return false;
            }
            
            return true;
        });
        
        // Update blast effects
        this.blastEffects = this.blastEffects.filter(effect => {
            const elapsed = performance.now() - effect.startTime;
            return elapsed <= effect.duration;
        });
    }
    
    createBlastEffect(projectile) {
        this.blastEffects.push({
            x: projectile.x,
            y: projectile.y,
            startTime: performance.now(),
            duration: 500
        });
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500
            });
        }
    }
}

// Bone Prison (R) - Shinnok
class BonePrison extends Ability {
    constructor() {
        super("Bone Prison", 20); // 20 seconds cooldown
        this.damage = 50;
        this.range = 300;
        this.radius = 150;
        this.duration = 3000; // 3 seconds
        this.activeEffects = [];
    }
    
    execute(player, gameState) {
        // Target boss directly
        const boss = gameState.boss;
        if (!boss) return false;
        
        // Create bone prison effect
        const effect = {
            x: boss.x,
            y: boss.y,
            startTime: performance.now(),
            duration: this.duration,
            damage: this.damage,
            radius: this.radius,
            targetId: boss.id
        };
        
        this.activeEffects.push(effect);
        
        // Apply initial damage
        boss.health -= this.damage;
        this.createHitEffect(boss);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            const elapsed = performance.now() - effect.startTime;
            return elapsed <= effect.duration;
        });
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500
            });
        }
    }
}

// Fan Toss (Q) - Mai
class FanToss extends Ability {
    constructor() {
        super("Fan Toss", 6); // 6 seconds cooldown
        this.damage = 45;
        this.range = 350;
        this.projectileSpeed = 12;
        this.activeProjectiles = [];
    }
    
    execute(player, gameState) {
        // Calculate projectile direction towards boss
        const boss = gameState.boss;
        if (!boss) return false;
        
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Create and launch projectile
        const projectile = {
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            playerId: player.id,
            distance: 0,
            maxDistance: this.range,
            startTime: performance.now(),
            rotation: 0
        };
        
        this.activeProjectiles.push(projectile);
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update projectiles
        this.activeProjectiles = this.activeProjectiles.filter(projectile => {
            // Move projectile
            projectile.x += projectile.dirX * this.projectileSpeed;
            projectile.y += projectile.dirY * this.projectileSpeed;
            
            // Update distance traveled
            projectile.distance += this.projectileSpeed;
            
            // Update rotation
            projectile.rotation += 0.2;
            
            // Check if projectile has reached max range
            if (projectile.distance >= projectile.maxDistance) {
                return false;
            }
            
            return true;
        });
    }
    
    checkProjectileCollisions(gameState) {
        const boss = gameState.boss;
        if (!boss) return;
        
        // Check collision with boss
        this.activeProjectiles = this.activeProjectiles.filter(projectile => {
            const dx = boss.x - projectile.x;
            const dy = boss.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= boss.sizeMultiplier * 30) {
                // Apply damage
                boss.health -= this.damage;
                
                // Create hit effect
                this.createHitEffect(boss);
                
                return false;
            }
            
            return true;
        });
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500
            });
        }
    }
}

// Blazing Aura (R) - Mai
class BlazingAura extends Ability {
    constructor() {
        super("Blazing Aura", 25); // 25 seconds cooldown
        this.damage = 15;
        this.range = 200;
        this.duration = 10000; // 10 seconds
        this.tickInterval = 1000; // Damage every second
        this.isActive = false;
        this.activationTime = 0;
        this.lastTickTime = 0;
    }
    
    execute(player, gameState) {
        this.isActive = true;
        this.activationTime = performance.now();
        this.lastTickTime = performance.now();
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Check if aura is still active
        if (this.isActive) {
            const elapsed = performance.now() - this.activationTime;
            
            if (elapsed >= this.duration) {
                this.isActive = false;
            }
        }
    }
    
    applyAuraEffects(player, gameState) {
        if (!this.isActive) return;
        
        const now = performance.now();
        
        // Apply damage on tick interval
        if (now - this.lastTickTime >= this.tickInterval) {
            this.lastTickTime = now;
            
            // Apply damage to boss if in range
            const boss = gameState.boss;
            if (!boss) return;
            
            const dx = boss.x - player.x;
            const dy = boss.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range + boss.sizeMultiplier * 30) {
                // Apply damage
                boss.health -= this.damage;
                
                // Create hit effect
                this.createHitEffect(boss);
            }
        }
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 300,
                isFire: true
            });
        }
    }
}

// Wind Push (Q) - Julia
class WindPush extends Ability {
    constructor() {
        super("Wind Push", 7); // 7 seconds cooldown
        this.damage = 35;
        this.range = 250;
        this.pushDistance = 150;
        this.effectDuration = 500; // milliseconds
        this.activeEffects = [];
    }
    
    execute(player, gameState) {
        // Calculate direction towards boss
        const boss = gameState.boss;
        if (!boss) return false;
        
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if boss is in range
        if (distance <= this.range + boss.sizeMultiplier * 30) {
            // Apply damage
            boss.health -= this.damage;
            
            // Create wind push effect
            this.activeEffects.push({
                x: player.x,
                y: player.y,
                targetX: boss.x,
                targetY: boss.y,
                startTime: performance.now(),
                duration: this.effectDuration
            });
            
            // Create hit effect
            this.createHitEffect(boss);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            const elapsed = performance.now() - effect.startTime;
            return elapsed <= effect.duration;
        });
    }
    
    createHitEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 500,
                isWind: true
            });
        }
    }
}

// Team Heal (R) - Julia
class TeamHeal extends Ability {
    constructor() {
        super("Team Heal", 30); // 30 seconds cooldown
        this.healAmount = 80;
        this.radius = 300;
        this.effectDuration = 2000; // 2 seconds
        this.activeEffects = [];
    }
    
    execute(player, gameState) {
        // Create heal effect
        const effect = {
            x: player.x,
            y: player.y,
            startTime: performance.now(),
            duration: this.effectDuration
        };
        
        this.activeEffects.push(effect);
        
        // Apply healing to all players in range
        gameState.players.forEach(targetPlayer => {
            const dx = targetPlayer.x - player.x;
            const dy = targetPlayer.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.radius) {
                // Apply healing
                targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + this.healAmount);
                
                // Create heal effect
                this.createHealEffect(targetPlayer);
            }
        });
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            const elapsed = performance.now() - effect.startTime;
            return elapsed <= effect.duration;
        });
    }
    
    createHealEffect(target) {
        if (target.hitEffects) {
            target.hitEffects.push({
                x: target.x,
                y: target.y,
                startTime: performance.now(),
                duration: 1000,
                isHeal: true
            });
        }
    }
} 