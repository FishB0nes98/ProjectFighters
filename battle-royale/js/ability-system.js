// Ability System for Battle Royale

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
        this.lastUsedTime = Date.now();
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

class DashingKick extends Ability {
    constructor() {
        super("Dashing Kick", 4); // 4 seconds cooldown
        this.damage = 45;
        this.dashDistance = 200; // Distance to dash in pixels
        this.dashDuration = 250; // Duration of dash in milliseconds
        this.isDashing = false;
        this.dashStartTime = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.hitboxWidth = 40; // Width of the dash hitbox
        this.affectedPlayers = new Set(); // Track players hit by this dash instance
    }
    
    // Draw the ability icon directly on canvas
    drawIcon(ctx, x, y, size) {
        // Draw red background
        ctx.fillStyle = '#ff3a3a';
        ctx.fillRect(x, y, size, size);
        
        // Draw arrow
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size / 10;
        ctx.lineCap = 'round';
        
        // Draw arrow shaft
        ctx.beginPath();
        ctx.moveTo(x + size * 0.25, y + size * 0.5);
        ctx.lineTo(x + size * 0.75, y + size * 0.5);
        ctx.stroke();
        
        // Draw arrow head
        ctx.beginPath();
        ctx.moveTo(x + size * 0.75, y + size * 0.5);
        ctx.lineTo(x + size * 0.6, y + size * 0.3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.75, y + size * 0.5);
        ctx.lineTo(x + size * 0.6, y + size * 0.7);
        ctx.stroke();
        
        // Draw "leg" symbol
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + size * 0.3, y + size * 0.65, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.65);
        ctx.lineTo(x + size * 0.5, y + size * 0.75);
        ctx.stroke();
    }
    
    execute(player, gameState) {
        if (this.isDashing) return;
        
        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;
        
        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );
            
            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            }
        } else {
            // Fallback to keyboard direction if mouse position is not available
            // If using keyboard movement, use WASD direction
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;
            
            // If no direction keys pressed, use player's last movement direction or face forward
            if (dirX === 0 && dirY === 0) {
                if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
                    dirX = player.velocity.x > 0 ? 1 : -1;
                } else {
                    dirY = player.velocity.y > 0 ? 1 : -1;
                }
            }
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            } else {
                // Default to forward direction if no movement
                dirY = -1;
            }
        }
        
        // Set dash parameters
        this.isDashing = true;
        this.dashStartTime = Date.now();
        this.dashStartX = player.x;
        this.dashStartY = player.y;
        this.dashTargetX = player.x + (dirX * this.dashDistance);
        this.dashTargetY = player.y + (dirY * this.dashDistance);
        this.affectedPlayers.clear();
        
        // Store the dash direction for collision detection
        this.dashDirX = dirX;
        this.dashDirY = dirY;
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'dashingKick',
                playerId: player.id,
                startX: this.dashStartX,
                startY: this.dashStartY,
                targetX: this.dashTargetX,
                targetY: this.dashTargetY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    updateDash(player, gameState, deltaTime) {
        if (!this.isDashing) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.dashStartTime;
        
        if (elapsedTime >= this.dashDuration) {
            // Dash complete
            this.isDashing = false;
            
            // Ensure player reached final position
            player.x = this.dashTargetX;
            player.y = this.dashTargetY;
            
            return;
        }
        
        // Track the last position before movement for collision detection
        const lastX = player.x;
        const lastY = player.y;
        
        // Calculate current position along the dash path
        const progress = elapsedTime / this.dashDuration;
        const newX = this.dashStartX + (this.dashTargetX - this.dashStartX) * progress;
        const newY = this.dashStartY + (this.dashTargetY - this.dashStartY) * progress;
        
        // Update player position - allow passing through obstacles
        player.x = newX;
        player.y = newY;
        
        // Check for collisions with other players (using line segment collision)
        this.checkLineCollisions(player, gameState, lastX, lastY, newX, newY);
    }
    
    // Check collision using line segments (works better for fast movement)
    checkLineCollisions(player, gameState, startX, startY, endX, endY) {
        // Check collision with each player
        for (const id in gameState.players) {
            // Skip if already hit this player in this dash or it's the player using the ability
            if (this.affectedPlayers.has(id) || id === player.id) continue;
            
            const targetPlayer = gameState.players[id];
            
            // Use point-to-line distance to detect collisions with moving dash
            const distance = this.pointToLineDistance(
                targetPlayer.x, targetPlayer.y,  // Target player position
                startX, startY,                  // Dash start
                endX, endY                       // Dash end
            );
            
            // If within hitbox range, apply damage
            if (distance <= this.hitboxWidth) {
                // Mark player as affected to prevent multiple hits
                this.affectedPlayers.add(id);
                
                // Apply damage with egg collection multiplier if available
                let damageAmount = this.damage;
                if (player.eggStats && player.eggStats.damageMultiplier) {
                    damageAmount = Math.round(this.damage * player.eggStats.damageMultiplier);
                }
                
                // Apply damage using global takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, damageAmount, player);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - damageAmount);
                }
                
                // Visual effect for hit
                this.createHitEffect(targetPlayer);
            }
        }
    }
    
    // Calculate point to line segment distance
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        // Handle zero length line segments
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));
        
        const xx = x1 + param * C;
        const yy = y1 + param * D;
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    createHitEffect(targetPlayer) {
        // Add a hit flag to the player for rendering
        targetPlayer.hitEffect = {
            time: Date.now(),
            duration: 300 // 300ms effect
        };
    }
    
    renderDashEffect(ctx, player, mapRenderer) {
        if (!this.isDashing) return;
        
        // Render dash trail effect
        const screenStart = mapRenderer.worldToScreen(this.dashStartX, this.dashStartY);
        const screenEnd = mapRenderer.worldToScreen(player.x, player.y);
        
        // Draw dash trail
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(screenStart.x, screenStart.y);
        ctx.lineTo(screenEnd.x, screenEnd.y);
        ctx.stroke();
        
        // Draw hitbox area (line width)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = this.hitboxWidth * 2 * mapRenderer.camera.zoom;
        ctx.beginPath();
        ctx.moveTo(screenStart.x, screenStart.y);
        ctx.lineTo(screenEnd.x, screenEnd.y);
        ctx.stroke();
        
        // Draw circular effect at player position
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(screenEnd.x, screenEnd.y, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

// New Execute Kick ability for Lili
class ExecuteKick extends Ability {
    constructor() {
        super("Execute Kick", 12); // 12 seconds cooldown
        this.damage = 80;
        this.range = 150; // Range in pixels
        this.shieldBreakThreshold = 40; // Shield value below which it breaks completely
        this.icon = 'assets/abilities/execute-kick.svg'; // Use SVG file
    }
    
    use(player, gameState) {
        if (this.isOnCooldown) return false;
        
        // Only record the time of use; don't set cooldown yet
        this.lastUsedTime = Date.now();
        
        // Execute ability-specific action - returns true if a target was hit
        const targetHit = this.execute(player, gameState);
        
        // Only set cooldown if we hit a target
        if (targetHit) {
            this.isOnCooldown = true;
            this.currentCooldown = this.cooldown;
        }
        
        return true;
    }
    
    execute(player, gameState) {
        // Find closest player within range
        let closestPlayer = null;
        let closestDistance = this.range;
        
        for (const id in gameState.players) {
            if (id === player.id) continue; // Skip self
            
            const targetPlayer = gameState.players[id];
            const dx = targetPlayer.x - player.x;
            const dy = targetPlayer.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestPlayer = targetPlayer;
                closestDistance = distance;
            }
        }
        
        // If no player in range, don't use ability
        if (!closestPlayer) {
            // Reset cooldown since no target found
            this.isOnCooldown = false;
            return false;
        }
        
        // Apply damage with egg collection multiplier if available
        let damageAmount = this.damage;
        if (player.eggStats && player.eggStats.damageMultiplier) {
            damageAmount = Math.round(this.damage * player.eggStats.damageMultiplier);
        }
        
        let shieldBroken = false;
        
        // Check if target has shield
        if (closestPlayer.shield > 0) {
            // Break shield completely if below threshold
            if (closestPlayer.shield <= this.shieldBreakThreshold) {
                closestPlayer.shield = 0;
                shieldBroken = true;
                this.createShieldBreakEffect(closestPlayer);
            } else {
                // Otherwise just damage shield
                closestPlayer.shield = Math.max(0, closestPlayer.shield - damageAmount * 0.75);
                this.createDamageEffect(closestPlayer);
            }
        } else {
            // No shield, apply full damage using takeDamage
            if (typeof window.takeDamage === 'function') {
                window.takeDamage(closestPlayer, damageAmount, player);
            } else {
                // Fallback to direct health modification if takeDamage is not available
                closestPlayer.health = Math.max(0, closestPlayer.health - damageAmount);
            }
            this.createDamageEffect(closestPlayer);
        }
        
        // Broadcast ability effect to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'executeKick',
                playerId: player.id,
                targetId: closestPlayer.id,
                shieldBroken: shieldBroken,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
            
            // Update target player's stats in the database
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/players/${closestPlayer.id}`).update({
                health: closestPlayer.health,
                shield: closestPlayer.shield
            });
        }
        
        return true;
    }
    
    // Create visual shield break effect
    createShieldBreakEffect(target) {
        // Create shield shatter effect
        const shieldShatter = {
            x: target.x,
            y: target.y,
            startTime: Date.now(),
            duration: 800,
            color: 'rgba(50, 150, 255, 0.8)',
            fragments: []
        };
        
        // Create 12 shield fragments
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            shieldShatter.fragments.push({
                angle: angle,
                speed: speed,
                size: 5 + Math.random() * 10
            });
        }
        
        // Add effect to global effects array if it exists
        if (typeof window.effects !== 'undefined') {
            window.effects.push({
                ...shieldShatter,
                update: function() {
                    const elapsed = Date.now() - this.startTime;
                    return elapsed < this.duration;
                },
                render: function(ctx, camera) {
                    const elapsed = Date.now() - this.startTime;
                    const progress = elapsed / this.duration;
                    const alpha = 1 - progress;
                    
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    
                    for (const fragment of this.fragments) {
                        const distance = fragment.speed * progress * 100;
                        const x = this.x + Math.cos(fragment.angle) * distance;
                        const y = this.y + Math.sin(fragment.angle) * distance;
                        
                        ctx.fillStyle = this.color;
                        ctx.fillRect(
                            x - camera.x - fragment.size/2,
                            y - camera.y - fragment.size/2,
                            fragment.size,
                            fragment.size
                        );
                    }
                    
                    ctx.restore();
                }
            });
        }
    }
    
    // Create visual damage effect
    createDamageEffect(target) {
        if (typeof window.effects !== 'undefined') {
            window.effects.push({
                x: target.x,
                y: target.y,
                startTime: Date.now(),
                duration: 800,
                update: function() {
                    const elapsed = Date.now() - this.startTime;
                    return elapsed < this.duration;
                },
                render: function(ctx, camera) {
                    const elapsed = Date.now() - this.startTime;
                    const progress = elapsed / this.duration;
                    const alpha = 1 - progress;
                    const size = 40 + progress * 60;
                    
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(
                        this.x - camera.x,
                        this.y - camera.y,
                        size,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                    
                    // Display damage text
                    ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        '80',
                        this.x - camera.x,
                        this.y - camera.y - 20 - progress * 20
                    );
                    
                    ctx.restore();
                }
            });
        }
    }
}

class WindPush extends Ability {
    constructor() {
        super("Wind Push", 2); // 2 seconds cooldown
        this.damage = 25; // Base damage
        this.increasedDamage = 60; // Damage for third consecutive hit
        this.pushDistance = 100; // How far to push the enemy
        this.pushDuration = 300; // How long the push lasts in ms
        this.range = 200; // Range of the ability
        this.width = 80; // Width of the T shape
        this.hitCounts = {}; // Track how many times each player was hit
        this.lastHitTime = {}; // Track last hit time for combo tracking
        this.comboTimeout = 5000; // Time window for combo counter (5 seconds)
        this.stackVisuals = {}; // Visual indicators for stacks
        this.impactEffects = []; // Array to store impact effects
        this.tShapeEffect = null; // Store the T-shape visualization
    }
    
    // Draw the ability icon directly on canvas
    drawIcon(ctx, x, y, size) {
        // Draw green background for wind
        ctx.fillStyle = '#3cb371';
        ctx.fillRect(x, y, size, size);
        
        // Draw wind lines (wavy lines)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size / 15;
        ctx.lineCap = 'round';
        
        // Draw horizontal wind lines
        for (let i = 0; i < 3; i++) {
            const yPos = y + size * (0.3 + i * 0.2);
            
            ctx.beginPath();
            ctx.moveTo(x + size * 0.2, yPos);
            ctx.quadraticCurveTo(
                x + size * 0.4, yPos - size * 0.05,
                x + size * 0.6, yPos
            );
            ctx.quadraticCurveTo(
                x + size * 0.8, yPos + size * 0.05,
                x + size * 0.9, yPos
            );
            ctx.stroke();
        }
        
        // Draw T shape overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = size / 12;
        
        // Vertical part of T
        ctx.beginPath();
        ctx.moveTo(x + size/2, y + size * 0.3);
        ctx.lineTo(x + size/2, y + size * 0.7);
        ctx.stroke();
        
        // Horizontal part of T
        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.3);
        ctx.lineTo(x + size * 0.7, y + size * 0.3);
        ctx.stroke();
    }
    
    execute(player, gameState) {
        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;
        
        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );
            
            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            }
        } else {
            // Fallback to keyboard direction
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;
            
            // If no direction keys pressed, use player's last movement direction or face forward
            if (dirX === 0 && dirY === 0) {
                if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
                    dirX = player.velocity.x > 0 ? 1 : -1;
                } else {
                    dirY = player.velocity.y > 0 ? 1 : -1;
                }
            }
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            } else {
                // Default to forward direction if no movement
                dirY = -1;
            }
        }
        
        // Calculate perpendicular direction for T shape
        const perpDirX = -dirY;
        const perpDirY = dirX;
        
        // Store affected players for this use of the ability
        const affectedPlayers = new Set();
        
        // Create T-shape visualization effect before checking impact
        this.createTShapeEffect(player, gameState.mapRenderer, dirX, dirY, perpDirX, perpDirY);
        
        // Check players in the straight line (vertical part of T)
        this.checkPlayersInLine(player, gameState, player.x, player.y, 
            player.x + dirX * this.range, player.y + dirY * this.range, 
            affectedPlayers);
        
        // Check players in the perpendicular line (horizontal part of T) - at the tip of the main line
        const tipX = player.x + dirX * this.range;
        const tipY = player.y + dirY * this.range;
        
        this.checkPlayersInLine(player, gameState, 
            tipX - perpDirX * (this.width/2), tipY - perpDirY * (this.width/2),
            tipX + perpDirX * (this.width/2), tipY + perpDirY * (this.width/2), 
            affectedPlayers);
        
        // Create wind effect
        this.createWindEffect(player, gameState.mapRenderer, dirX, dirY, perpDirX, perpDirY);
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'windPush',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                dirX: dirX,
                dirY: dirY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    checkPlayersInLine(player, gameState, startX, startY, endX, endY, affectedPlayers) {
        for (const id in gameState.players) {
            // Skip self
            if (id === player.id) continue;
            // Skip already affected players in this cast
            if (affectedPlayers.has(id)) continue;
            
            const targetPlayer = gameState.players[id];
            
            // Calculate distance to the line
            const distance = this.pointToLineDistance(
                targetPlayer.x, targetPlayer.y,
                startX, startY,
                endX, endY
            );
            
            // Check if in range of the line
            if (distance <= this.width/2) {
                // Mark as affected to prevent double-hits
                affectedPlayers.add(id);
                
                // Update hit counter for this target
                const now = Date.now();
                if (!this.hitCounts[id]) {
                    this.hitCounts[id] = 1;
                    this.lastHitTime[id] = now;
                } else {
                    // Check if this hit is within the combo timeout
                    if (now - this.lastHitTime[id] < this.comboTimeout) {
                        this.hitCounts[id]++;
                    } else {
                        // Reset combo if timeout expired
                        this.hitCounts[id] = 1;
                    }
                    this.lastHitTime[id] = now;
                }
                
                // Create or update the stack visual
                this.updateStackVisual(id, targetPlayer, this.hitCounts[id]);
                
                // Check if this is the third hit (for increased damage)
                let damageAmount = this.damage;
                let isThirdHit = false;
                if (this.hitCounts[id] >= 3) {
                    damageAmount = this.increasedDamage;
                    isThirdHit = true;
                    // Reset counter after third hit
                    this.hitCounts[id] = 0;
                    
                    // Remove stack visual after consuming stacks
                    delete this.stackVisuals[id];
                    
                    // Visual feedback for third hit
                    this.createCriticalHitEffect(targetPlayer, isThirdHit, damageAmount);
                }
                
                // Apply damage with egg collection multiplier if available
                if (player.eggStats && player.eggStats.damageMultiplier) {
                    damageAmount = Math.round(damageAmount * player.eggStats.damageMultiplier);
                }
                
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, damageAmount, player);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - damageAmount);
                }
                
                // Apply push effect
                this.pushPlayer(player, targetPlayer);
                
                // Create hit effect with damage information
                this.createHitEffect(targetPlayer, isThirdHit, damageAmount);
            }
        }
    }
    
    pushPlayer(sourcePlayer, targetPlayer) {
        // Calculate push direction (away from the source player)
        const dx = targetPlayer.x - sourcePlayer.x;
        const dy = targetPlayer.y - sourcePlayer.y;
        
        // Normalize direction
        const length = Math.sqrt(dx * dx + dy * dy);
        let pushDirX = 0;
        let pushDirY = 0;
        
        if (length > 0) {
            pushDirX = dx / length;
            pushDirY = dy / length;
        } else {
            // If players are on top of each other, push in a random direction
            const angle = Math.random() * Math.PI * 2;
            pushDirX = Math.cos(angle);
            pushDirY = Math.sin(angle);
        }
        
        // Set up push animation
        targetPlayer.pushEffect = {
            startTime: Date.now(),
            duration: this.pushDuration,
            startX: targetPlayer.x,
            startY: targetPlayer.y,
            targetX: targetPlayer.x + pushDirX * this.pushDistance,
            targetY: targetPlayer.y + pushDirY * this.pushDistance,
            dirX: pushDirX,
            dirY: pushDirY
        };
    }
    
    updatePushEffects(player, gameState, deltaTime) {
        if (!player.pushEffect) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - player.pushEffect.startTime;
        
        if (elapsedTime >= player.pushEffect.duration) {
            // Push complete
            player.pushEffect = null;
            return;
        }
        
        // Calculate current position along the push path
        const progress = elapsedTime / player.pushEffect.duration;
        const newX = player.pushEffect.startX + (player.pushEffect.targetX - player.pushEffect.startX) * progress;
        const newY = player.pushEffect.startY + (player.pushEffect.targetY - player.pushEffect.startY) * progress;
        
        // Check if the new position is walkable
        if (gameState.mapGenerator && gameState.mapGenerator.isWalkable(newX, newY)) {
            player.x = newX;
            player.y = newY;
        } else {
            // If not walkable, stop the push effect
            player.pushEffect = null;
        }
    }
    
    createWindEffect(player, mapRenderer, dirX, dirY, perpDirX, perpDirY) {
        // Store reference to game state for rendering
        this.gameState = player.gameState;
        
        if (!player.windEffects) {
            player.windEffects = [];
        }
        
        // Create effect for the main line (vertical part of T)
        for (let i = 0; i < 10; i++) {
            const distance = (i / 10) * this.range;
            const x = player.x + dirX * distance;
            const y = player.y + dirY * distance;
            
            // Add some randomness to particle positions
            const offsetX = (Math.random() - 0.5) * this.width * 0.5;
            const offsetY = (Math.random() - 0.5) * this.width * 0.5;
            
            player.windEffects.push({
                x: x + offsetX,
                y: y + offsetY,
                size: 5 + Math.random() * 5,
                alpha: 0.8,
                startTime: Date.now(),
                duration: 300 + Math.random() * 200
            });
        }
        
        // Create effect for the perpendicular line (horizontal part of T)
        const tipX = player.x + dirX * this.range;
        const tipY = player.y + dirY * this.range;
        
        for (let i = -5; i <= 5; i++) {
            const offset = (i / 5) * (this.width/2);
            const x = tipX + perpDirX * offset;
            const y = tipY + perpDirY * offset;
            
            // Add some randomness
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            
            player.windEffects.push({
                x: x + offsetX,
                y: y + offsetY,
                size: 5 + Math.random() * 5,
                alpha: 0.8,
                startTime: Date.now(),
                duration: 300 + Math.random() * 200
            });
        }
    }
    
    createHitEffect(targetPlayer, isThirdHit = false, damage = this.damage) {
        // Create a hit effect to show impact
        targetPlayer.hitEffect = {
            time: Date.now(),
            duration: 300
        };
        
        // Create wind impact effect with damage information
        this.createWindImpactEffect(targetPlayer.x, targetPlayer.y, isThirdHit, damage);
    }
    
    createCriticalHitEffect(targetPlayer, isThirdHit = false, damage = this.damage) {
        // Create a more intense hit effect for critical hits
        targetPlayer.criticalHitEffect = {
            time: Date.now(),
            duration: 400,
            particles: [],
            isThirdHit: isThirdHit,
            damage: damage
        };
        
        // Create particles that explode outward
        const particleCount = 12 + Math.floor(Math.random() * 8) + (isThirdHit ? 8 : 0);
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 1 + Math.random() * 2 + (isThirdHit ? 0.5 : 0);
            
            targetPlayer.criticalHitEffect.particles.push({
                dirX: Math.cos(angle),
                dirY: Math.sin(angle),
                size: 3 + Math.random() * 5
            });
        }
    }
    
    renderWindEffects(ctx, player, mapRenderer) {
        if (!player.windEffects) return;
        
        ctx.save();
        
        const now = Date.now();
        
        // Remove expired effects
        player.windEffects = player.windEffects.filter(effect => {
            const elapsed = now - effect.startTime;
            return elapsed < effect.duration;
        });
        
        // Render remaining effects
        for (const effect of player.windEffects) {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;
            const alpha = 1 - progress;
            
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            ctx.fillStyle = `rgba(200, 255, 200, ${alpha * effect.alpha})`;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render stack counters
        this.renderStackVisuals(ctx, { players: player.gameState?.players, mapRenderer });
        
        ctx.restore();
    }
    
    renderCriticalHitEffects(ctx, player, mapRenderer) {
        if (!player.criticalHitEffect) return;
        
        const now = Date.now();
        const elapsed = now - player.criticalHitEffect.time;
        
        if (elapsed >= player.criticalHitEffect.duration) {
            player.criticalHitEffect = null;
            return;
        }
        
        const progress = elapsed / player.criticalHitEffect.duration;
        const screenPos = mapRenderer.worldToScreen(player.x, player.y);
        
        ctx.save();
        
        // Render particles
        for (const particle of player.criticalHitEffect.particles) {
            // Update particle position
            const particleX = screenPos.x + particle.dirX * progress * 100;
            const particleY = screenPos.y + particle.dirY * progress * 100;
            
            // Calculate particle alpha based on life and progress
            const particleLife = 1 - progress;
            
            // Render particle
            ctx.fillStyle = `rgba(255, 255, 0, ${particleLife})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particle.size * particleLife, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Render critical hit text
        if (progress < 0.5) {
            // Make text grow and fade
            const textSize = 14 + progress * 10;
            const textAlpha = 1 - progress * 2;
            
            ctx.font = `bold ${textSize}px Arial`;
            ctx.fillStyle = `rgba(255, 220, 0, ${textAlpha})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CRITICAL', screenPos.x, screenPos.y - 40);
        }
        
        ctx.restore();
    }
    
    // Helper for distance calculation
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // If the line is just a point, return distance to the point
        const length2 = dx*dx + dy*dy;
        if (length2 === 0) {
            const dpx = px - x1;
            const dpy = py - y1;
            return Math.sqrt(dpx*dpx + dpy*dpy);
        }
        
        // Calculate projection scalar
        const t = ((px - x1) * dx + (py - y1) * dy) / length2;
        
        // Check if projection is outside the line segment
        if (t < 0) {
            // Beyond the x1,y1 end of the segment
            const dpx = px - x1;
            const dpy = py - y1;
            return Math.sqrt(dpx*dpx + dpy*dpy);
        } else if (t > 1) {
            // Beyond the x2,y2 end of the segment
            const dpx = px - x2;
            const dpy = py - y2;
            return Math.sqrt(dpx*dpx + dpy*dpy);
        } else {
            // Projection falls on the segment
            const projx = x1 + t * dx;
            const projy = y1 + t * dy;
            const dpx = px - projx;
            const dpy = py - projy;
            return Math.sqrt(dpx*dpx + dpy*dpy);
        }
    }
    
    // Add a new method to update stack visuals
    updateStackVisual(playerId, player, stacks) {
        if (stacks <= 0) {
            delete this.stackVisuals[playerId];
            return;
        }
        
        this.stackVisuals[playerId] = {
            time: Date.now(),
            duration: this.comboTimeout,
            stacks: stacks
        };
    }
    
    // Add a new method to render stack counters
    renderStackVisuals(ctx, gameState) {
        if (!gameState || !gameState.mapRenderer || !gameState.players) return;
        
        const now = Date.now();
        
        for (const playerId in this.stackVisuals) {
            const visual = this.stackVisuals[playerId];
            // Skip if the player ID doesn't exist in the players object
            if (!gameState.players || !gameState.players[playerId]) {
                delete this.stackVisuals[playerId];
                delete this.hitCounts[playerId];
                continue;
            }
            
            const player = gameState.players[playerId];
            
            // Skip if the player reference is null or undefined
            if (!player) {
                delete this.stackVisuals[playerId];
                delete this.hitCounts[playerId];
                continue;
            }
            
            const elapsed = now - visual.time;
            if (elapsed >= visual.duration) {
                delete this.stackVisuals[playerId];
                delete this.hitCounts[playerId];
                continue;
            }
            
            // Calculate remaining time percentage
            const timeRemaining = 1 - (elapsed / visual.duration);
            
            // Get screen position
            const screenPos = gameState.mapRenderer.worldToScreen(player.x, player.y);
            
            ctx.save();
            
            // Draw stack counter
            ctx.fillStyle = `rgba(255, 215, 0, ${0.7 * timeRemaining + 0.3})`;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            const radius = 15;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y - 60, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw stack number
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(visual.stacks.toString(), screenPos.x, screenPos.y - 60);
            
            ctx.restore();
        }
    }
    
    // New method to create T-shape visualization
    createTShapeEffect(player, mapRenderer, dirX, dirY, perpDirX, perpDirY) {
        // End point of the main line (tip of T)
        const tipX = player.x + dirX * this.range;
        const tipY = player.y + dirY * this.range;
        
        // Points for the T-shape horizontal line
        const leftX = tipX - perpDirX * (this.width/2);
        const leftY = tipY - perpDirY * (this.width/2);
        const rightX = tipX + perpDirX * (this.width/2);
        const rightY = tipY + perpDirY * (this.width/2);
        
        // Store T-shape effect data with timestamp
        this.tShapeEffect = {
            startTime: Date.now(),
            duration: 500, // 500ms duration for the effect
            playerX: player.x,
            playerY: player.y,
            tipX: tipX,
            tipY: tipY,
            leftX: leftX, 
            leftY: leftY,
            rightX: rightX,
            rightY: rightY,
            dirX: dirX,
            dirY: dirY
        };
    }
    
    // New method to create wind impact effect at hit locations
    createWindImpactEffect(x, y, isThirdHit = false, damage = this.damage) {
        // Create a new impact effect
        const effect = {
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 800, // 800ms duration
            isThirdHit: isThirdHit, // Flag for third hit visuals
            damage: damage, // Store actual damage for display
            particles: []
        };
        
        // Generate particles for the effect
        const particleCount = 12 + Math.floor(Math.random() * 8) + (isThirdHit ? 8 : 0); // More particles for third hit
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5 + (isThirdHit ? 0.5 : 0); // Faster particles for third hit
            const size = 3 + Math.random() * 8 + (isThirdHit ? 2 : 0); // Larger particles for third hit
            
            effect.particles.push({
                dirX: Math.cos(angle),
                dirY: Math.sin(angle),
                speed: speed,
                size: size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                alpha: 0.7 + Math.random() * 0.3,
                color: isThirdHit ? 
                    `rgba(${180 + Math.random() * 75}, ${215 + Math.random() * 40}, ${50 + Math.random() * 50}, 1)` : 
                    `rgba(${120 + Math.random() * 50}, ${230 + Math.random() * 25}, ${150 + Math.random() * 50}, 1)`
            });
        }
        
        // Add effect to the array
        this.impactEffects.push(effect);
    }
    
    // Render all visual effects for Wind Push
    renderWindPushEffects(ctx, mapRenderer) {
        if (!ctx || !mapRenderer) return;
        
        // Render T-shape visualization
        this.renderTShapeEffect(ctx, mapRenderer);
        
        // Render impact effects
        this.renderImpactEffects(ctx, mapRenderer);
        
        // Create a safe gameState object for renderStackVisuals
        const gameState = {
            players: this.gameState && this.gameState.players ? this.gameState.players : {},
            mapRenderer: mapRenderer,
            currentPlayer: this.gameState ? this.gameState.currentPlayer : null
        };
        
        // Render stack counters with the safe gameState
        this.renderStackVisuals(ctx, gameState);
    }
    
    // New method to render the T-shape visualization
    renderTShapeEffect(ctx, mapRenderer) {
        if (!this.tShapeEffect) return;
        
        const now = Date.now();
        const elapsed = now - this.tShapeEffect.startTime;
        
        // Remove effect if expired
        if (elapsed >= this.tShapeEffect.duration) {
            this.tShapeEffect = null;
            return;
        }
        
        // Calculate effect progress
        const progress = elapsed / this.tShapeEffect.duration;
        const alpha = 1 - progress;
        
        ctx.save();
        
        // Get screen positions for all points
        const startPos = mapRenderer.worldToScreen(this.tShapeEffect.playerX, this.tShapeEffect.playerY);
        const tipPos = mapRenderer.worldToScreen(this.tShapeEffect.tipX, this.tShapeEffect.tipY);
        const leftPos = mapRenderer.worldToScreen(this.tShapeEffect.leftX, this.tShapeEffect.leftY);
        const rightPos = mapRenderer.worldToScreen(this.tShapeEffect.rightX, this.tShapeEffect.rightY);
        
        // Draw the T-shape with a wind-like effect
        ctx.strokeStyle = `rgba(200, 255, 200, ${alpha * 0.7})`;
        ctx.lineWidth = 8 + (1 - progress) * 10; // Line gets thinner as effect fades
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw main line (vertical part of T)
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(tipPos.x, tipPos.y);
        ctx.stroke();
        
        // Draw horizontal line (top of T)
        ctx.beginPath();
        ctx.moveTo(leftPos.x, leftPos.y);
        ctx.lineTo(rightPos.x, rightPos.y);
        ctx.stroke();
        
        // Add wind particle effects along the lines
        const particleCount = 6;
        const particleAlpha = alpha * 0.6;
        
        // Particles along main line
        for (let i = 0; i < particleCount; i++) {
            const t = (i / particleCount) * (1 - progress * 0.5) + progress * 0.5;
            const x = startPos.x + (tipPos.x - startPos.x) * t;
            const y = startPos.y + (tipPos.y - startPos.y) * t;
            const size = 10 * (1 - progress);
            
            ctx.fillStyle = `rgba(200, 255, 200, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Particles along horizontal line
        for (let i = 0; i < particleCount / 2; i++) {
            const t = i / (particleCount / 2);
            const x = leftPos.x + (rightPos.x - leftPos.x) * t;
            const y = leftPos.y + (rightPos.y - leftPos.y) * t;
            const size = 8 * (1 - progress);
            
            ctx.fillStyle = `rgba(200, 255, 200, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // New method to render wind impact effects
    renderImpactEffects(ctx, mapRenderer) {
        const now = Date.now();
        
        // Filter out expired effects
        this.impactEffects = this.impactEffects.filter(effect => {
            const elapsed = now - effect.startTime;
            return elapsed < effect.duration;
        });
        
        // Render each active effect
        for (const effect of this.impactEffects) {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;
            
            // Get screen position for the effect
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            ctx.save();
            
            // Render each particle
            for (const particle of effect.particles) {
                const fadeIn = Math.min(progress * 10, 1);
                const fadeOut = 1 - Math.max(0, (progress - 0.7) * 3.3);
                const alpha = fadeIn * fadeOut * particle.alpha;
                
                // Calculate position based on direction and progress
                const distance = particle.speed * progress * 150;
                const particleX = screenPos.x + particle.dirX * distance;
                const particleY = screenPos.y + particle.dirY * distance;
                
                // Particle rotation
                const rotation = particle.rotation + particle.rotationSpeed * elapsed;
                
                // Draw wind particle - use a leaf-like or wind-like shape
                ctx.save();
                ctx.translate(particleX, particleY);
                ctx.rotate(rotation);
                
                // Use the particle's color with proper alpha
                const colorParts = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
                if (colorParts) {
                    const [_, r, g, b] = colorParts;
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                } else {
                    // Fallback if regex fails
                    ctx.fillStyle = effect.isThirdHit ? 
                        `rgba(255, 215, 0, ${alpha})` : 
                        `rgba(120, 230, 150, ${alpha})`;
                }
                
                // Draw a curved shape to represent wind
                ctx.beginPath();
                ctx.moveTo(-particle.size/2, 0);
                ctx.quadraticCurveTo(
                    0, -particle.size,
                    particle.size/2, 0
                );
                ctx.quadraticCurveTo(
                    0, particle.size/2,
                    -particle.size/2, 0
                );
                ctx.fill();
                
                ctx.restore();
            }
            
            // Draw impact circle
            const circleAlpha = Math.max(0, 0.5 - progress * 0.5);
            const circleSize = 20 + progress * 80;
            
            ctx.strokeStyle = effect.isThirdHit ? 
                `rgba(255, 215, 0, ${circleAlpha})` : 
                `rgba(120, 230, 150, ${circleAlpha})`;
            ctx.lineWidth = 3 * (1 - progress);
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, circleSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw damage text
            const textAlpha = Math.max(0, 1 - progress * 2);
            const yOffset = -20 - progress * 30;
            
            if (effect.isThirdHit) {
                ctx.fillStyle = `rgba(255, 215, 0, ${textAlpha})`;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(effect.damage.toString(), screenPos.x, screenPos.y + yOffset);
                
                // Add special critical hit text for third hits
                if (progress < 0.3) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.8 - progress * 2.5)})`;
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText('CRITICAL!', screenPos.x, screenPos.y + yOffset - 20);
                }
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(effect.damage.toString(), screenPos.x, screenPos.y + yOffset);
            }
            
            ctx.restore();
        }
    }
}

class TeamHeal extends Ability {
    constructor() {
        super("Team Heal", 40); // 40 seconds cooldown
        this.healAmount = 200; // Full heal
        this.radius = 500; // Large radius to heal teammates
        this.particleEffects = {};
    }
    
    // Draw the ability icon directly on canvas
    drawIcon(ctx, x, y, size) {
        // Draw blue background for healing
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(x, y, size, size);
        
        // Draw heart symbol
        ctx.fillStyle = 'white';
        const heartSize = size * 0.6;
        const heartX = x + size/2 - heartSize/2;
        const heartY = y + size/2 - heartSize/2;
        
        ctx.beginPath();
        // Left curve of heart
        ctx.moveTo(heartX + heartSize/2, heartY + heartSize * 0.75);
        ctx.bezierCurveTo(
            heartX + heartSize/2, heartY + heartSize * 0.75,
            heartX, heartY + heartSize * 0.5,
            heartX, heartY + heartSize * 0.25
        );
        ctx.bezierCurveTo(
            heartX, heartY,
            heartX + heartSize * 0.25, heartY,
            heartX + heartSize/2, heartY + heartSize * 0.25
        );
        
        // Right curve of heart
        ctx.bezierCurveTo(
            heartX + heartSize * 0.75, heartY,
            heartX + heartSize, heartY,
            heartX + heartSize, heartY + heartSize * 0.25
        );
        ctx.bezierCurveTo(
            heartX + heartSize, heartY + heartSize * 0.5,
            heartX + heartSize/2, heartY + heartSize * 0.75,
            heartX + heartSize/2, heartY + heartSize * 0.75
        );
        ctx.fill();
        
        // Draw plus symbol inside heart
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = size / 15;
        ctx.beginPath();
        ctx.moveTo(x + size/2, y + size * 0.35);
        ctx.lineTo(x + size/2, y + size * 0.65);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.35, y + size/2);
        ctx.lineTo(x + size * 0.65, y + size/2);
        ctx.stroke();
    }
    
    execute(player, gameState) {
        let healedPlayers = 0;
        
        // Heal all teammates including self
        for (const id in gameState.players) {
            const targetPlayer = gameState.players[id];
            
            // Skip dead players
            if (targetPlayer.health <= 0) continue;
            
            // Calculate distance
            const dx = targetPlayer.x - player.x;
            const dy = targetPlayer.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Heal if within radius
            if (distance <= this.radius) {
                const oldHealth = targetPlayer.health;
                targetPlayer.health = 200; // Full heal
                
                // Create heal effect
                this.createHealEffect(targetPlayer);
                
                // Track healed players
                healedPlayers++;
            }
        }
        
        // Always heal self
        if (healedPlayers === 0) {
            player.health = 200;
            this.createHealEffect(player);
        }
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'teamHeal',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    createHealEffect(targetPlayer) {
        // Create healing particles effect
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            const size = 3 + Math.random() * 5;
            const lifetime = 1000 + Math.random() * 1000;
            
            particles.push({
                dirX: Math.cos(angle),
                dirY: Math.sin(angle),
                speed: speed,
                size: size,
                alpha: 0.7 + Math.random() * 0.3,
                lifetime: lifetime,
                x: 0,
                y: 0
            });
        }
        
        this.particleEffects[targetPlayer.id] = {
            time: Date.now(),
            duration: 2000,
            particles: particles
        };
    }
    
    renderHealEffects(ctx, gameState) {
        if (!gameState.mapRenderer) return;
        
        const now = Date.now();
        
        for (const playerId in this.particleEffects) {
            const effect = this.particleEffects[playerId];
            const player = gameState.players[playerId] || (playerId === gameState.currentPlayer?.id ? gameState.currentPlayer : null);
            
            if (!player) {
                delete this.particleEffects[playerId];
                continue;
            }
            
            const elapsed = now - effect.time;
            if (elapsed >= effect.duration) {
                delete this.particleEffects[playerId];
                continue;
            }
            
            const screenPos = gameState.mapRenderer.worldToScreen(player.x, player.y);
            const progress = elapsed / effect.duration;
            
            ctx.save();
            
            for (const particle of effect.particles) {
                const particleProgress = progress;
                const distance = particle.speed * particleProgress * 100;
                const fadeIn = Math.min(particleProgress * 5, 1);
                const fadeOut = 1 - Math.max(0, (particleProgress - 0.7) * 3.3);
                const alpha = fadeIn * fadeOut * particle.alpha;
                
                const particleX = screenPos.x + particle.dirX * distance;
                const particleY = screenPos.y + particle.dirY * distance - 20 * particleProgress;
                
                ctx.fillStyle = `rgba(100, 255, 100, ${alpha})`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, particle.size * (1 - particleProgress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Render healing text
            if (progress < 0.6) {
                // Make text grow and fade
                const textSize = 14 + progress * 8;
                const textAlpha = Math.min(progress * 2, 1) * (1 - Math.max(0, (progress - 0.4) * 5));
                
                ctx.font = `bold ${textSize}px Arial`;
                ctx.fillStyle = `rgba(100, 255, 100, ${textAlpha})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+HEAL', screenPos.x, screenPos.y - 40);
            }
            
            ctx.restore();
        }
    }
}

class BurstBlast extends Ability {
    constructor() {
        super("Burst Blast", 6); // 6 seconds cooldown
        this.range = 500; // Range in pixels
        this.radius = 150; // Area of effect radius
        this.projectileSpeed = 12; // Speed of the projectile
        this.projectileSize = 15; // Size of the projectile
        this.hitBoxPadding = 60; // Increased padding for more reliable hit detection
        this.baseDamage = 40; // Base damage
        this.damageIncrement = 4; // Additional damage per hit
        this.hitCount = 0; // Track successful hits for damage scaling
        this.activeProjectiles = []; // Track active projectiles
        this.blastEffects = []; // Track blast visual effects
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw purple background
        ctx.fillStyle = '#8a2be2';
        ctx.fillRect(x, y, size, size);
        
        // Draw blast circle
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size / 12;
        ctx.beginPath();
        ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw radiating lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerX = x + size * 0.5 + Math.cos(angle) * size * 0.2;
            const innerY = y + size * 0.5 + Math.sin(angle) * size * 0.2;
            const outerX = x + size * 0.5 + Math.cos(angle) * size * 0.4;
            const outerY = y + size * 0.5 + Math.sin(angle) * size * 0.4;
            
            ctx.beginPath();
            ctx.moveTo(innerX, innerY);
            ctx.lineTo(outerX, outerY);
            ctx.stroke();
        }
    }
    
    execute(player, gameState) {
        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;
        
        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );
            
            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            }
        } else {
            // Fallback to keyboard direction
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;
            
            // If no direction keys pressed, use player's last movement direction or face forward
            if (dirX === 0 && dirY === 0) {
                if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
                    dirX = player.velocity.x > 0 ? 1 : -1;
                } else {
                    dirY = player.velocity.y > 0 ? 1 : -1;
                }
            }
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            } else {
                // Default to forward direction if no movement
                dirY = -1;
            }
        }
        
        // Create and launch projectile
        const projectile = {
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            playerId: player.id,
            distance: 0,
            maxDistance: this.range,
            startTime: Date.now(),
            sourcePlayer: player
        };
        
        this.activeProjectiles.push(projectile);
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'burstBlastLaunch',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                dirX: dirX,
                dirY: dirY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update all active projectiles
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Move projectile
            projectile.x += projectile.dirX * this.projectileSpeed;
            projectile.y += projectile.dirY * this.projectileSpeed;
            
            // Update total distance traveled
            projectile.distance += this.projectileSpeed;
            
            // Remove if traveled max distance
            if (projectile.distance >= projectile.maxDistance) {
                this.handleProjectileImpact(projectile, null);
                this.activeProjectiles.splice(i, 1);
            }
        }
    }
    
    checkProjectileCollisions(gameState) {
        if (!gameState || !gameState.players) return;
        
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Update projectile position based on time elapsed
            const currentTime = Date.now();
            const timeElapsed = currentTime - projectile.startTime;
            const moveSpeed = 0.5; // Speed in pixels per millisecond
            
            // Calculate new position
            const newX = projectile.x + (projectile.dirX * moveSpeed * timeElapsed);
            const newY = projectile.y + (projectile.dirY * moveSpeed * timeElapsed);
            
            // Check collision with world objects using mapGenerator
            if (window.mapGenerator && !window.mapGenerator.isWalkable(newX, newY)) {
                // Create blast effect at collision point
                this.createBlastEffect({
                    x: projectile.x,
                    y: projectile.y
                }, projectile.sourcePlayer);
                
                this.activeProjectiles.splice(i, 1);
                continue;
            }
            
            // Update projectile position if no collision with world
            projectile.distance += moveSpeed * timeElapsed;
            projectile.x = newX;
            projectile.y = newY;
            projectile.startTime = currentTime;
            
            // Check collision with each player
            for (const id in gameState.players) {
                // Skip if it's the projectile owner
                if (id === projectile.playerId) continue;
                
                const targetPlayer = gameState.players[id];
                const dx = targetPlayer.x - projectile.x;
                const dy = targetPlayer.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Enlarged hit detection radius
                if (distance <= this.projectileSize + this.hitBoxPadding) {
                    if (this instanceof BurstBlast) {
                        this.handleProjectileImpact(projectile, targetPlayer, gameState);
                    } else if (this instanceof BonePrison) {
                        this.rootPlayer(targetPlayer, projectile, gameState);
                    }
                    
                    this.activeProjectiles.splice(i, 1);
                    return; // Return after removing the projectile to avoid invalid array access
                }
            }
            
            // Check collision with current player (if exists)
            if (gameState.currentPlayer && projectile.playerId !== gameState.currentPlayer.id) {
                const currentPlayer = gameState.currentPlayer;
                const dx = currentPlayer.x - projectile.x;
                const dy = currentPlayer.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.projectileSize + this.hitBoxPadding) {
                    if (this instanceof BurstBlast) {
                        this.handleProjectileImpact(projectile, currentPlayer, gameState);
                    } else if (this instanceof BonePrison) {
                        this.rootPlayer(currentPlayer, projectile, gameState);
                    }
                    
                    this.activeProjectiles.splice(i, 1);
                    return; // Return after removing the projectile to avoid invalid array access
                }
            }
        }
    }
    
    handleProjectileImpact(projectile, hitTarget, gameState) {
        // Find source player
        let sourcePlayer = null;
        
        if (gameState) {
            if (gameState.currentPlayer && gameState.currentPlayer.id === projectile.playerId) {
                sourcePlayer = gameState.currentPlayer;
            } else if (gameState.players && gameState.players[projectile.playerId]) {
                sourcePlayer = gameState.players[projectile.playerId];
            }
        }
        
        // Create blast at impact point
        this.createBlastEffect({
            x: projectile.x,
            y: projectile.y
        }, sourcePlayer);
        
        if (!gameState) return;
        
        // Track affected players for this instance
        const affectedPlayers = new Set();
        
        // Calculate current damage with hit bonuses
        let currentDamage = this.baseDamage;
        if (sourcePlayer && sourcePlayer.id === gameState.currentPlayer?.id) {
            currentDamage = this.baseDamage + (this.hitCount * this.damageIncrement);
        }
        
        // Apply damage multiplier if player has egg stats
        if (sourcePlayer && sourcePlayer.eggStats && sourcePlayer.eggStats.damageMultiplier) {
            currentDamage = Math.round(currentDamage * sourcePlayer.eggStats.damageMultiplier);
        }
        
        // Find all players within radius and apply damage
        for (const id in gameState.players) {
            if (id === projectile.playerId) continue; // Skip self
            
            const targetPlayer = gameState.players[id];
            const dx = targetPlayer.x - projectile.x;
            const dy = targetPlayer.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.radius) {
                // Add to affected players
                affectedPlayers.add(id);
                
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, currentDamage, sourcePlayer);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - currentDamage);
                }
                
                // Create hit effect
                this.createHitEffect(targetPlayer);
                
                // Increment hit counter for the local player only
                if (gameState.currentPlayer && gameState.currentPlayer.id === projectile.playerId) {
                    this.hitCount++;
                    
                    // Show notification for hit count milestones
                    if (this.hitCount % 5 === 0) {
                        this.displayPassiveNotification(this.hitCount);
                    }
                }
            }
        }
        
        // Also check current player if they're within blast radius
        if (gameState.currentPlayer && gameState.currentPlayer.id !== projectile.playerId) {
            const currentPlayer = gameState.currentPlayer;
            const dx = currentPlayer.x - projectile.x;
            const dy = currentPlayer.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.radius) {
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(currentPlayer, currentDamage, sourcePlayer);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    currentPlayer.health = Math.max(0, currentPlayer.health - currentDamage);
                }
                this.createHitEffect(currentPlayer);
            }
        }
        
        // Broadcast explosion to other players if in multiplayer
        if (sourcePlayer && gameState.currentLobby && !gameState.isBotsGame && 
            sourcePlayer.id === gameState.currentPlayer?.id) {
            
            const abilityData = {
                type: 'burstBlastImpact',
                playerId: projectile.playerId,
                sourceX: projectile.x,
                sourceY: projectile.y,
                damage: currentDamage,
                hitCount: this.hitCount,
                timestamp: Date.now(),
                affectedPlayers: Array.from(affectedPlayers)
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    createBlastEffect(position, sourcePlayer) {
        // Get current damage value if it's the source player
        let currentDamage = this.baseDamage;
        if (sourcePlayer) {
            currentDamage = this.baseDamage + (this.hitCount * this.damageIncrement);
        }
        
        const effect = {
            x: position.x,
            y: position.y,
            radius: this.radius,
            startTime: Date.now(),
            duration: 500,
            currentDamage: currentDamage,
        };
        
        this.blastEffects.push(effect);
        
        // Clean up old effects
        setTimeout(() => {
            const index = this.blastEffects.indexOf(effect);
            if (index !== -1) {
                this.blastEffects.splice(index, 1);
            }
        }, effect.duration + 100);
    }
    
    createHitEffect(targetPlayer) {
        // Create hit effect on target
        targetPlayer.hitEffect = {
            time: Date.now(),
            duration: 300
        };
    }
    
    renderProjectiles(ctx, mapRenderer) {
        ctx.save();
        
        for (const projectile of this.activeProjectiles) {
            const screenPos = mapRenderer.worldToScreen(projectile.x, projectile.y);
            
            // Debug visualization of hit area
            const hitRadius = (this.projectileSize + this.hitBoxPadding) * mapRenderer.camera.zoom;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, hitRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw purple energy orb
            ctx.fillStyle = '#8a2be2';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            
            // Draw the projectile
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.projectileSize * mapRenderer.camera.zoom, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw glowing inner core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, (this.projectileSize * 0.4) * mapRenderer.camera.zoom, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw trailing particles
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 5; i++) {
                const trailDist = (i + 1) * 5;
                const trailX = screenPos.x - projectile.dirX * trailDist * mapRenderer.camera.zoom;
                const trailY = screenPos.y - projectile.dirY * trailDist * mapRenderer.camera.zoom;
                const size = (this.projectileSize * 0.8 - i * 1.5) * mapRenderer.camera.zoom;
                
                if (size <= 0) continue;
                
                ctx.fillStyle = '#8a2be2';
                ctx.globalAlpha = 0.7 - (i * 0.13);
                ctx.beginPath();
                ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
    
    renderBlastEffects(ctx, mapRenderer) {
        const now = Date.now();
        
        for (const effect of this.blastEffects) {
            const elapsed = now - effect.startTime;
            if (elapsed > effect.duration) continue;
            
            const progress = elapsed / effect.duration;
            const alpha = 1 - progress;
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            // Draw expanding circle
            ctx.save();
            
            // Calculate screen radius - handle missing worldToScreenDistance function
            let screenRadius;
            if (typeof mapRenderer.worldToScreenDistance === 'function') {
                screenRadius = mapRenderer.worldToScreenDistance(effect.radius * progress);
            } else {
                // Fallback calculation if worldToScreenDistance is not available
                screenRadius = (effect.radius * progress) * mapRenderer.camera.zoom;
            }
            
            // Circle gradient
            const gradient = ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, screenRadius
            );
            
            gradient.addColorStop(0, `rgba(138, 43, 226, ${alpha * 0.8})`); // Purple center
            gradient.addColorStop(0.7, `rgba(138, 43, 226, ${alpha * 0.3})`);
            gradient.addColorStop(1, `rgba(138, 43, 226, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                screenPos.x, screenPos.y,
                screenRadius,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Show damage number above effect
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 3;
            ctx.fillText(
                `${effect.currentDamage}`,
                screenPos.x,
                screenPos.y - 20 - (progress * 30)
            );
            
            ctx.restore();
        }
    }
    
    displayPassiveNotification(hitCount) {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const currentDamage = this.baseDamage + (hitCount * this.damageIncrement);
            
            const notification = document.createElement("div");
            notification.textContent = `Burst Blast: ${hitCount} hits | Damage now: ${currentDamage}`;
            notification.style.position = "absolute";
            notification.style.top = "30%";
            notification.style.left = "50%";
            notification.style.transform = "translate(-50%, -50%)";
            notification.style.backgroundColor = "rgba(138, 43, 226, 0.8)";
            notification.style.color = "white";
            notification.style.padding = "10px 20px";
            notification.style.borderRadius = "5px";
            notification.style.fontFamily = "Arial, sans-serif";
            notification.style.fontWeight = "bold";
            notification.style.fontSize = "16px";
            notification.style.zIndex = "1000";
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transition = "opacity 1s";
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 1000);
            }, 3000);
        }
    }
    
    renderPassiveDisplay(ctx, player) {
        // Display Shinnok's passive in the top-left corner when playing as Shinnok
        if (!player) return;
        
        // Calculate current damage
        const currentDamage = this.baseDamage + (this.hitCount * this.damageIncrement);
        
        const x = 10;
        const y = 60; // Position below health/mana
        const width = 200;
        const height = 30;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        // Label
        ctx.fillStyle = 'rgba(138, 43, 226, 0.9)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`PASSIVE: Burst Damage`, x + 5, y + 15);
        
        // Hit counter and current damage
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${this.hitCount} hits | Damage: ${currentDamage}`, x + 5, y + 28);
    }
}

class BonePrison extends Ability {
    constructor() {
        super("Bone Prison", 13); // 13 seconds cooldown
        this.range = 300; // Range in pixels
        this.rootDuration = 3000; // Root duration in milliseconds
        this.projectileSpeed = 12; // Speed of the projectile
        this.projectileSize = 20; // Increased projectile size for better hit detection
        this.hitBoxPadding = 60; // Increased padding for more reliable hit detection
        this.activeProjectiles = []; // Track active projectiles
        this.prisonEffects = []; // Track active prison effects
        this.blastEffects = []; // Add this for blast effects
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw dark background
        ctx.fillStyle = '#444444';
        ctx.fillRect(x, y, size, size);
        
        // Draw bone jail
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size / 15;
        
        // Draw vertical bones (jail bars)
        for (let i = 0; i < 5; i++) {
            const posX = x + size * (0.2 + i * 0.15);
            
            // Bone shape
            ctx.beginPath();
            ctx.moveTo(posX, y + size * 0.2);
            ctx.lineTo(posX, y + size * 0.8);
            ctx.stroke();
            
            // Bone knobs
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.ellipse(posX, y + size * 0.2, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(posX, y + size * 0.8, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw horizontal connecting bones
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y + size * 0.25);
        ctx.lineTo(x + size * 0.8, y + size * 0.25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y + size * 0.75);
        ctx.lineTo(x + size * 0.8, y + size * 0.75);
        ctx.stroke();
    }
    
    execute(player, gameState) {
        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;
        
        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );
            
            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            }
        } else {
            // Fallback to keyboard direction
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;
            
            // If no direction keys pressed, use player's last movement direction or face forward
            if (dirX === 0 && dirY === 0) {
                if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
                    dirX = player.velocity.x > 0 ? 1 : -1;
                } else {
                    dirY = player.velocity.y > 0 ? 1 : -1;
                }
            }
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            } else {
                // Default to forward direction if no movement
                dirY = -1;
            }
        }
        
        // Create and launch projectile
        const projectile = {
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            playerId: player.id,
            distance: 0,
            maxDistance: this.range,
            startTime: Date.now(),
            sourcePlayer: player
        };
        
        this.activeProjectiles.push(projectile);
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'bonePrisonLaunch',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                dirX: dirX,
                dirY: dirY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Only update prison effects, projectiles are handled by checkProjectileCollisions
        for (let i = this.prisonEffects.length - 1; i >= 0; i--) {
            const effect = this.prisonEffects[i];
            
            if (Date.now() - effect.startTime >= this.rootDuration) {
                // Release player from root
                if (effect.targetPlayer) {
                    effect.targetPlayer.isRooted = false;
                }
                
                this.prisonEffects.splice(i, 1);
            }
        }
    }
    
    checkProjectileCollisions(gameState) {
        if (!gameState || !gameState.players) return;
        
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            
            // Update projectile position based on time elapsed
            const currentTime = Date.now();
            const timeElapsed = currentTime - projectile.startTime;
            const moveSpeed = 0.5; // Speed in pixels per millisecond
            
            // Calculate new position
            const newX = projectile.x + (projectile.dirX * moveSpeed * timeElapsed);
            const newY = projectile.y + (projectile.dirY * moveSpeed * timeElapsed);
            
            // Check collision with world objects using mapGenerator
            if (window.mapGenerator && !window.mapGenerator.isWalkable(newX, newY)) {
                // Create hit effect at collision point
                this.createHitEffect({
                    x: projectile.x,
                    y: projectile.y
                });
                
                // Add a prison effect at the collision point
                const prisonEffect = {
                    x: projectile.x,
                    y: projectile.y,
                    startTime: Date.now()
                };
                this.prisonEffects.push(prisonEffect);
                
                this.activeProjectiles.splice(i, 1);
                continue;
            }
            
            // Update projectile position if no collision with world
            projectile.distance += moveSpeed * timeElapsed;
            projectile.x = newX;
            projectile.y = newY;
            projectile.startTime = currentTime;
            
            // Check collision with each player
            for (const id in gameState.players) {
                // Skip if it's the projectile owner
                if (id === projectile.playerId) continue;
                
                const targetPlayer = gameState.players[id];
                const dx = targetPlayer.x - projectile.x;
                const dy = targetPlayer.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Enlarged hit detection radius
                if (distance <= this.projectileSize + this.hitBoxPadding) {
                    if (this instanceof BurstBlast) {
                        this.handleProjectileImpact(projectile, targetPlayer, gameState);
                    } else if (this instanceof BonePrison) {
                        this.rootPlayer(targetPlayer, projectile, gameState);
                    }
                    
                    this.activeProjectiles.splice(i, 1);
                    return; // Return after removing the projectile to avoid invalid array access
                }
            }
            
            // Check collision with current player (if exists)
            if (gameState.currentPlayer && projectile.playerId !== gameState.currentPlayer.id) {
                const currentPlayer = gameState.currentPlayer;
                const dx = currentPlayer.x - projectile.x;
                const dy = currentPlayer.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.projectileSize + this.hitBoxPadding) {
                    if (this instanceof BurstBlast) {
                        this.handleProjectileImpact(projectile, currentPlayer, gameState);
                    } else if (this instanceof BonePrison) {
                        this.rootPlayer(currentPlayer, projectile, gameState);
                    }
                    
                    this.activeProjectiles.splice(i, 1);
                    return; // Return after removing the projectile to avoid invalid array access
                }
            }
        }
    }
    
    rootPlayer(targetPlayer, projectile, gameState) {
        // Apply root effect
        targetPlayer.isRooted = true;
        
        // Create visual effect
        const prisonEffect = {
            targetId: targetPlayer.id,
            targetPlayer: targetPlayer,
            x: targetPlayer.x,
            y: targetPlayer.y,
            startTime: Date.now()
        };
        
        this.prisonEffects.push(prisonEffect);
        
        // Create hit effect
        this.createHitEffect(targetPlayer);
        
        // Ensure root effect gets removed after duration
        setTimeout(() => {
            if (targetPlayer) {
                targetPlayer.isRooted = false;
            }
        }, this.rootDuration);
        
        // Broadcast hit to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'bonePrisonHit',
                playerId: projectile.playerId,
                targetId: targetPlayer.id,
                targetX: targetPlayer.x,
                targetY: targetPlayer.y,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    createHitEffect(targetPlayer) {
        // Create hit effect on target
        targetPlayer.hitEffect = {
            time: Date.now(),
            duration: 500
        };
    }
    
    renderProjectiles(ctx, mapRenderer) {
        ctx.save();
        
        for (const projectile of this.activeProjectiles) {
            const screenPos = mapRenderer.worldToScreen(projectile.x, projectile.y);
            
            // Debug visualization of hit area
            const hitRadius = (this.projectileSize + this.hitBoxPadding) * mapRenderer.camera.zoom;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, hitRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw bone projectile
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#8a2be2';
            ctx.shadowBlur = 10;
            
            // Draw a bone-like projectile
            ctx.save();
            
            // Rotate in direction of movement
            const angle = Math.atan2(projectile.dirY, projectile.dirX);
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(angle);
            
            // Draw bone shaft
            ctx.fillRect(-this.projectileSize, -2, this.projectileSize * 2, 4);
            
            // Draw bone knobs
            ctx.beginPath();
            ctx.ellipse(-this.projectileSize, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(this.projectileSize, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    renderPrisonEffects(ctx, mapRenderer) {
        ctx.save();
        
        for (const effect of this.prisonEffects) {
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / this.rootDuration;
            const alpha = Math.min(1, 3 * (1 - progress)); // Fade out towards the end
            
            // Draw bone prison cage
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillStyle = `rgba(138, 43, 226, ${alpha * 0.15})`;
            ctx.lineWidth = 2;
            
            // Draw the cage
            const cageSize = 50; // Size of the cage
            
            // Draw cage circle base
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, cageSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw vertical bones
            const numBones = 8;
            for (let i = 0; i < numBones; i++) {
                const angle = (i / numBones) * Math.PI * 2;
                const x = screenPos.x + Math.cos(angle) * cageSize;
                const y = screenPos.y + Math.sin(angle) * cageSize;
                
                // Draw bone
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                // Draw bone knob
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            
            // Draw remaining time indicator
            const remainingTime = Math.ceil((this.rootDuration - elapsed) / 1000);
            if (remainingTime > 0) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 3;
                ctx.fillText(`${remainingTime}s`, screenPos.x, screenPos.y - 30);
                ctx.shadowBlur = 0;
            }
        }
        
        ctx.restore();
    }

    // Add createBlastEffect method
    createBlastEffect(position, sourcePlayer) {
        // Create a bone prison effect at the impact point
        const prisonEffect = {
            x: position.x,
            y: position.y,
            startTime: Date.now()
        };
        this.prisonEffects.push(prisonEffect);
        
        // Create a visual blast effect
        const blastEffect = {
            x: position.x,
            y: position.y,
            startTime: Date.now(),
            duration: 500,
            radius: this.projectileSize * 2
        };
        this.blastEffects.push(blastEffect);
    }

    // Add handleProjectileImpact method
    handleProjectileImpact(projectile, hitTarget, gameState) {
        // Create visual effect at impact point
        this.createBlastEffect({
            x: projectile.x,
            y: projectile.y
        }, projectile.sourcePlayer);
        
        // If there's a hit target, root them
        if (hitTarget) {
            this.rootPlayer(hitTarget, projectile, gameState);
        }
    }

    // Add renderBlastEffects method
    renderBlastEffects(ctx, mapRenderer) {
        ctx.save();
        
        // Remove expired effects
        this.blastEffects = this.blastEffects.filter(effect => {
            return Date.now() - effect.startTime < effect.duration;
        });
        
        // Render active effects
        for (const effect of this.blastEffects) {
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            const progress = (Date.now() - effect.startTime) / effect.duration;
            const alpha = 1 - progress;
            const radius = effect.radius * (1 + progress) * mapRenderer.camera.zoom;
            
            // Draw expanding circle
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = '#8a2be2';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bone fragments
            ctx.globalAlpha = alpha;
            const fragments = 8;
            for (let i = 0; i < fragments; i++) {
                const angle = (i / fragments) * Math.PI * 2 + progress * Math.PI;
                const x = screenPos.x + Math.cos(angle) * radius * 0.8;
                const y = screenPos.y + Math.sin(angle) * radius * 0.8;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 3 * mapRenderer.camera.zoom, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

class FanToss extends Ability {
    constructor() {
        super("Fan Toss", 2); // 2 seconds cooldown
        this.damage = 25;
        this.enhancedDamage = 55;
        this.enhancedWindow = 3000; // 3 seconds in ms for enhanced damage
        this.projectileSpeed = 600; // pixels per second
        this.projectileSize = 30;
        this.projectiles = [];
        this.enhancedTargets = new Map(); // Map of playerId -> timestamp of last hit
        this.hitEffects = []; // Array to store hit effects for rendering
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw blue background
        ctx.fillStyle = '#3a7aff';
        ctx.fillRect(x, y, size, size);
        
        // Draw fan shape
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.7);
        ctx.arc(x + size * 0.5, y + size * 0.7, size * 0.4, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        
        // Draw fan details
        ctx.strokeStyle = '#3a7aff';
        ctx.lineWidth = size / 30;
        
        // Draw fan lines
        for (let i = 0; i < 7; i++) {
            const angle = Math.PI + (i * Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(x + size * 0.5, y + size * 0.7);
            ctx.lineTo(
                x + size * 0.5 + Math.cos(angle) * size * 0.4,
                y + size * 0.7 + Math.sin(angle) * size * 0.4
            );
            ctx.stroke();
        }
    }
    
    execute(player, gameState) {
        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;
        
        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );
            
            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            }
        } else {
            // Fallback to keyboard direction if mouse position is not available
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;
            
            // If no direction keys pressed, use player's last movement direction or face forward
            if (dirX === 0 && dirY === 0) {
                if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
                    dirX = player.velocity.x > 0 ? 1 : -1;
                } else {
                    dirY = player.velocity.y > 0 ? 1 : -1;
                }
            }
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX /= length;
                dirY /= length;
            } else {
                // Default to forward direction if no movement
                dirY = -1;
            }
        }
        
        // Create projectile
        const projectile = {
            x: player.x,
            y: player.y,
            dirX: dirX,
            dirY: dirY,
            speed: this.projectileSpeed,
            sourcePlayer: player,
            size: this.projectileSize,
            damage: this.damage,
            distanceTraveled: 0,
            maxDistance: 800, // Maximum distance the projectile can travel
            hitPlayers: new Set() // Track players hit by this projectile
        };
        
        this.projectiles.push(projectile);
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'fanToss',
                playerId: player.id,
                startX: player.x,
                startY: player.y,
                dirX: dirX,
                dirY: dirY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            const moveDistance = (projectile.speed * deltaTime) / 1000;
            projectile.x += projectile.dirX * moveDistance;
            projectile.y += projectile.dirY * moveDistance;
            projectile.distanceTraveled += moveDistance;
            
            // Remove projectiles that have traveled too far
            if (projectile.distanceTraveled >= projectile.maxDistance) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Cleanup expired enhanced damage targets
        const now = Date.now();
        for (const [playerId, timestamp] of this.enhancedTargets.entries()) {
            if (now - timestamp > this.enhancedWindow) {
                this.enhancedTargets.delete(playerId);
            }
        }
    }
    
    checkProjectileCollisions(gameState) {
        if (!gameState || !gameState.players || !this.projectiles.length) return;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const sourcePlayerId = projectile.sourcePlayer.id;
            let hasHitPlayer = false;
            
            // Calculate new position
            const moveDistance = (projectile.speed * (1/60)) / 1000; // Assuming 60fps
            const newX = projectile.x + projectile.dirX * moveDistance;
            const newY = projectile.y + projectile.dirY * moveDistance;
            
            // Check collision with world objects using mapGenerator
            if (window.mapGenerator && !window.mapGenerator.isWalkable(newX, newY)) {
                // Create impact effect at collision point
                this.createImpactEffect(projectile.x, projectile.y, false);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Update projectile position if no collision with world
            projectile.x = newX;
            projectile.y = newY;
            projectile.distanceTraveled += moveDistance;
            
            // Check collision with players
            for (const playerId in gameState.players) {
                // Skip source player
                if (playerId === sourcePlayerId) continue;
                
                // Skip already hit players
                if (projectile.hitPlayers.has(playerId)) continue;
                
                const target = gameState.players[playerId];
                if (!target || target.health <= 0) continue; // Skip dead players
                
                // Simple circle collision detection
                const dx = target.x - projectile.x;
                const dy = target.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Player hitbox (50) + projectile size
                if (distance < 50 + projectile.size) {
                    // Determine damage based on previous hits
                    let damage = projectile.damage;
                    const now = Date.now();
                    
                    if (this.enhancedTargets.has(playerId)) {
                        damage = this.enhancedDamage;
                    }
                    
                    // Record hit for enhanced damage on next hit
                    this.enhancedTargets.set(playerId, now);
                    
                    // Apply damage using takeDamage function
                    if (typeof window.takeDamage === 'function') {
                        window.takeDamage(target, damage, projectile.sourcePlayer);
                    } else {
                        // Fallback to direct health modification if takeDamage is not available
                        target.health = Math.max(0, target.health - damage);
                    }
                    
                    // Create hit effect
                    this.createHitEffect(target, damage === this.enhancedDamage);
                    
                    // Create impact effect at the hit location
                    this.createImpactEffect(projectile.x, projectile.y, damage === this.enhancedDamage);
                    
                    // Mark as hit
                    projectile.hitPlayers.add(playerId);
                    hasHitPlayer = true;
                }
            }
            
            if (hasHitPlayer) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    createHitEffect(targetPlayer, isEnhanced = false) {
        if (!targetPlayer) return;
        
        // Create damage text
        const damageText = {
            x: targetPlayer.x,
            y: targetPlayer.y - 30,
            value: isEnhanced ? this.enhancedDamage : this.damage,
            color: isEnhanced ? '#ff5e5e' : '#ffffff',
            fontSize: isEnhanced ? 20 : 16,
            lifetime: 1000,
            createdAt: Date.now(),
            offsetX: Math.random() * 40 - 20  // Random offset for visual variety
        };
        
        // Add to global effects if available
        if (window.gameEffects && window.gameEffects.damageTexts) {
            window.gameEffects.damageTexts.push(damageText);
        }
    }
    
    createImpactEffect(x, y, isEnhanced = false) {
        // Create impact visual effect
        const impact = {
            x: x,
            y: y,
            radius: this.projectileSize * 1.5,
            maxRadius: this.projectileSize * 3,
            currentRadius: this.projectileSize * 1.5,
            color: isEnhanced ? 'rgba(255, 0, 0, 0.7)' : 'rgba(58, 122, 255, 0.7)',
            lifetime: 500,
            createdAt: Date.now(),
            isEnhanced: isEnhanced
        };
        
        this.hitEffects.push(impact);
    }
    
    renderProjectiles(ctx, mapRenderer) {
        if (!ctx || !mapRenderer) return;
        
        ctx.save();
        
        // Render projectiles
        for (const projectile of this.projectiles) {
            const screenPos = mapRenderer.worldToScreen(projectile.x, projectile.y);
            
            // Draw fan projectile
            const size = projectile.size * 2;
            const x = screenPos.x - size/2;
            const y = screenPos.y - size/2;
            
            // Rotate in direction of movement
            const angle = Math.atan2(projectile.dirY, projectile.dirX);
            
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(angle + Math.PI/2);
            
            // Draw fan shape
            ctx.fillStyle = '#3a7aff';
            ctx.beginPath();
            ctx.moveTo(0, size/2);
            ctx.arc(0, size/2, size/2, Math.PI, 0, false);
            ctx.closePath();
            ctx.fill();
            
            // Draw fan details
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            
            // Draw fan lines
            for (let i = 0; i < 7; i++) {
                const lineAngle = Math.PI + (i * Math.PI / 6);
                ctx.beginPath();
                ctx.moveTo(0, size/2);
                ctx.lineTo(
                    Math.cos(lineAngle) * size/2,
                    size/2 + Math.sin(lineAngle) * size/2
                );
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Render impact effects
        const now = Date.now();
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            const elapsed = now - effect.createdAt;
            
            if (elapsed > effect.lifetime) {
                this.hitEffects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.lifetime;
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            // Expand and fade out
            const currentRadius = effect.radius + (effect.maxRadius - effect.radius) * progress;
            const alpha = 1 - progress;
            
            // Draw expanding circle
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, currentRadius * mapRenderer.scale, 0, Math.PI * 2);
            
            const baseColor = effect.isEnhanced ? '255, 0, 0' : '58, 122, 255';
            ctx.fillStyle = `rgba(${baseColor}, ${alpha * 0.7})`;
            ctx.fill();
            
            // Draw smaller inner circle
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, currentRadius * 0.6 * mapRenderer.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.fill();
            
            // Draw fan fragments
            const fragmentCount = effect.isEnhanced ? 10 : 7;
            for (let j = 0; j < fragmentCount; j++) {
                const fragmentAngle = (j / fragmentCount) * Math.PI * 2;
                const distance = currentRadius * 0.8 * progress;
                
                const fx = screenPos.x + Math.cos(fragmentAngle) * distance;
                const fy = screenPos.y + Math.sin(fragmentAngle) * distance;
                
                const fragmentSize = (effect.isEnhanced ? 8 : 6) * (1 - progress) * mapRenderer.scale;
                
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.arc(fx, fy, fragmentSize, 0, Math.PI, false);
                ctx.closePath();
                ctx.fillStyle = `rgba(${baseColor}, ${alpha})`;
                ctx.fill();
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 1 * mapRenderer.scale;
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

class BlazingAura extends Ability {
    constructor() {
        super("Blazing Aura", 27); // 27 seconds cooldown
        this.isActive = false;
        this.activationTime = 0;
        this.duration = 4000; // 4 seconds in ms
        this.damagePerTick = 20;
        this.tickInterval = 1000; // Damage every 1 second
        this.lastTickTime = 0;
        this.auraRadius = 150; // Radius of the aura
        this.affectedPlayers = new Set(); // Track players affected in current tick
        this.hitEffects = []; // Array to store hit effects for rendering
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw orange background
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(x, y, size, size);
        
        // Draw aura/flames
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = size / 15;
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw outer aura
        const flameCount = 12;
        const innerRadius = size/4;
        const outerRadius = size/2 - 5;
        
        for (let i = 0; i < flameCount; i++) {
            const angle = (i / flameCount) * Math.PI * 2;
            const midAngle = angle + ((1 / flameCount) * Math.PI);
            
            const innerX = x + size/2 + Math.cos(angle) * innerRadius;
            const innerY = y + size/2 + Math.sin(angle) * innerRadius;
            
            const outerX = x + size/2 + Math.cos(angle) * outerRadius;
            const outerY = y + size/2 + Math.sin(angle) * outerRadius;
            
            const controlX = x + size/2 + Math.cos(midAngle) * (outerRadius * 1.3);
            const controlY = y + size/2 + Math.sin(midAngle) * (outerRadius * 1.3);
            
            ctx.beginPath();
            ctx.moveTo(innerX, innerY);
            ctx.quadraticCurveTo(controlX, controlY, outerX, outerY);
            ctx.stroke();
        }
        
        // Draw fire symbol
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    execute(player, gameState) {
        // Activate aura
        this.isActive = true;
        this.activationTime = Date.now();
        this.lastTickTime = this.activationTime;
        this.affectedPlayers.clear();
        
        // Broadcast ability use to other players if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'blazingAura',
                playerId: player.id,
                x: player.x,
                y: player.y,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isActive) return;
        
        const now = Date.now();
        const elapsedTime = now - this.activationTime;
        
        // End ability after duration
        if (elapsedTime >= this.duration) {
            this.isActive = false;
            return;
        }
        
        // Check for damage tick
        if (now - this.lastTickTime >= this.tickInterval) {
            console.log("Damage tick triggered at ", now);
            this.lastTickTime = now;
            this.affectedPlayers.clear(); // Reset affected players for new tick
        }
    }
    
    applyAuraEffects(player, gameState) {
        if (!this.isActive || !gameState || !gameState.players) return;
        
        const now = Date.now();
        
        // Make player immune to damage while aura is active
        player.isImmune = true;
        
        // Root player in place while aura is active
        player.isRooted = true;
        
        // Apply damage to nearby players on tick interval
        const timeSinceLastTick = now - this.lastTickTime;
        if (timeSinceLastTick < this.tickInterval) {
            // Not time for a new damage tick yet
            return;
        }
        
        console.log("Applying damage to players near", player.id);
        
        // Check collision with players
        for (const playerId in gameState.players) {
            // Skip source player
            if (playerId === player.id) continue;
            
            // Skip already affected players in this tick
            if (this.affectedPlayers.has(playerId)) continue;
            
            const target = gameState.players[playerId];
            if (!target || target.health <= 0) continue; // Skip dead players
            
            // Check if player is within aura radius
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.auraRadius) {
                console.log(`Dealing ${this.damagePerTick} damage to player ${playerId}`);
                
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(target, this.damagePerTick, player);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    target.health = Math.max(0, target.health - this.damagePerTick);
                    
                    // Add hit effect
                    if (!target.hitEffect) {
                        target.hitEffect = {
                            time: now,
                            duration: 200
                        };
                    }
                }
                
                // Create hit effect
                this.createHitEffect(target);
                
                // Create visual flame effect at target position
                this.createFlameEffect(target.x, target.y);
                
                // Mark as affected for this tick
                this.affectedPlayers.add(playerId);
            }
        }
        
        // Reset tick timer after applying damage
        this.lastTickTime = now;
    }
    
    createHitEffect(targetPlayer) {
        if (!targetPlayer) return;
        
        // Create damage text
        const damageText = {
            x: targetPlayer.x,
            y: targetPlayer.y - 30,
            value: this.damagePerTick,
            color: '#ff7700',
            fontSize: 16,
            lifetime: 1000,
            createdAt: Date.now(),
            offsetX: Math.random() * 40 - 20  // Random offset for visual variety
        };
        
        // Add to global effects if available
        if (window.gameEffects && window.gameEffects.damageTexts) {
            window.gameEffects.damageTexts.push(damageText);
        }
    }
    
    createFlameEffect(x, y) {
        // Create flame visual effect
        const flame = {
            x: x,
            y: y,
            radius: 20,
            maxRadius: 40,
            currentRadius: 20,
            color: 'rgba(255, 120, 0, 0.7)',
            lifetime: 800,
            createdAt: Date.now()
        };
        
        this.hitEffects.push(flame);
    }
    
    renderAura(ctx, player, mapRenderer) {
        if (!ctx || !mapRenderer || !player) return;
        
        // Render hit effects even if aura is not active
        this.renderHitEffects(ctx, mapRenderer);
        
        if (!this.isActive) return;
        
        const now = Date.now();
        const elapsedTime = now - this.activationTime;
        const progress = elapsedTime / this.duration;
        
        // Get screen position
        const screenPos = mapRenderer.worldToScreen(player.x, player.y);
        
        // Ensure mapRenderer.scale is valid
        const scale = isFinite(mapRenderer.scale) && mapRenderer.scale > 0 ? 
            mapRenderer.scale : 1;
        
        // Draw aura
        ctx.save();
        
        // Ensure all radius calculations are valid
        const safeAuraRadius = isFinite(this.auraRadius) ? this.auraRadius : 150;
        const scaledRadius = safeAuraRadius * scale;
        
        // Check all gradient values to ensure they're finite
        if (isFinite(screenPos.x) && isFinite(screenPos.y) && 
            isFinite(scaledRadius) && scaledRadius > 0) {
            
            // Outer glow
            try {
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, scaledRadius
                );
                
                gradient.addColorStop(0, 'rgba(255, 119, 0, 0.7)');
                gradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 230, 100, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, scaledRadius, 0, Math.PI * 2);
                ctx.fill();
            } catch (e) {
                // Fallback if gradient creation fails
                console.warn('Gradient creation failed, using fallback:', e);
                ctx.fillStyle = 'rgba(255, 119, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, scaledRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Inner circle
            ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 30 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            // Flame particles
            const particleCount = 24;
            const innerRadius = 30 * scale;
            const outerRadius = scaledRadius;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + (now / 1000);
                const distance = innerRadius + (Math.sin(now / 100 + i) * 0.5 + 0.5) * (outerRadius - innerRadius);
                
                if (!isFinite(distance)) continue; // Skip if distance is invalid
                
                const x = screenPos.x + Math.cos(angle) * distance;
                const y = screenPos.y + Math.sin(angle) * distance;
                
                const size = 5 + Math.sin(now / 200 + i * 0.7) * 4;
                
                if (!isFinite(x) || !isFinite(y) || !isFinite(size)) continue; // Skip if any value is invalid
                
                ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw immunity visual
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 60 * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    renderHitEffects(ctx, mapRenderer) {
        if (!ctx || !mapRenderer) return;
        
        ctx.save();
        
        // Render flame effects
        const now = Date.now();
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            const elapsed = now - effect.createdAt;
            
            if (elapsed > effect.lifetime) {
                this.hitEffects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.lifetime;
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            // Expand and fade out
            const currentRadius = effect.radius + (effect.maxRadius - effect.radius) * progress;
            const alpha = 1 - progress;
            
            // Draw flame effect
            const flameCount = 8;
            const baseRadius = currentRadius * mapRenderer.scale;
            
            for (let j = 0; j < flameCount; j++) {
                const flameAngle = (j / flameCount) * Math.PI * 2 + (now / 500);
                const offsetX = Math.cos(flameAngle) * baseRadius * 0.2;
                const offsetY = Math.sin(flameAngle) * baseRadius * 0.2;
                
                // Draw flame tongue
                const height = baseRadius * (1.2 + Math.sin(now / 200 + j) * 0.3);
                
                ctx.fillStyle = `rgba(255, ${120 + Math.floor(progress * 100)}, 0, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.moveTo(screenPos.x + offsetX, screenPos.y + offsetY);
                ctx.quadraticCurveTo(
                    screenPos.x + offsetX * 2,
                    screenPos.y + offsetY * 2 - height * 0.7,
                    screenPos.x + offsetX * 1.5,
                    screenPos.y + offsetY * 1.5 - height
                );
                ctx.quadraticCurveTo(
                    screenPos.x,
                    screenPos.y - height * 0.8,
                    screenPos.x - offsetX * 1.5,
                    screenPos.y - offsetY * 1.5 - height
                );
                ctx.quadraticCurveTo(
                    screenPos.x - offsetX * 2,
                    screenPos.y - offsetY * 2 - height * 0.7,
                    screenPos.x - offsetX,
                    screenPos.y - offsetY
                );
                ctx.closePath();
                ctx.fill();
            }
            
            // Draw center glow
            ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, baseRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class ElectricBall extends Ability {
    constructor() {
        super("Electric Ball", 3); // 3 seconds cooldown
        this.damage = 60;
        this.duration = 8000; // 8 seconds duration (changed from 8.5s)
        this.connectionRange = 300; // Increased range at which balls connect (from 200)
        this.balls = []; // Active electric balls
        this.connections = []; // Active connections between balls
        this.lastHitTimes = new Map(); // Track last hit time for each player
        this.hitCooldown = 500; // Minimum time between hits on same player (ms)
    }

    drawIcon(ctx, x, y, size) {
        // Draw blue background
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(x, y, size, size);

        // Draw electric ball
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();

        // Draw lightning bolts around the ball
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size/15;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI/2) + Date.now()/1000;
            const startX = x + size/2 + Math.cos(angle) * size/3;
            const startY = y + size/2 + Math.sin(angle) * size/3;
            const endX = x + size/2 + Math.cos(angle) * size/2;
            const endY = y + size/2 + Math.sin(angle) * size/2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    execute(player, gameState) {
        // Get target position from mouse
        if (!gameState.mousePosition || !gameState.mapRenderer) return;

        const worldPos = gameState.mapRenderer.screenToWorld(
            gameState.mousePosition.x,
            gameState.mousePosition.y
        );

        // Create new electric ball
        const ball = {
            x: worldPos.x,
            y: worldPos.y,
            createdAt: Date.now(),
            playerId: player.id
        };

        this.balls.push(ball);
        this.updateConnections();

        // Broadcast ability use if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'electricBall',
                playerId: player.id,
                x: worldPos.x,
                y: worldPos.y,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Remove expired balls
        const now = Date.now();
        this.balls = this.balls.filter(ball => now - ball.createdAt < this.duration);
        
        // Update connections after removing expired balls
        this.updateConnections();
    }

    updateConnections() {
        this.connections = [];
        
        // Check each pair of balls
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];
                
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.connectionRange) {
                    this.connections.push({
                        ball1: ball1,
                        ball2: ball2,
                        distance: distance
                    });
                }
            }
        }
    }

    checkPlayerCollisions(gameState) {
        if (!gameState.players || !gameState.currentPlayer) return;

        const now = Date.now();
        const players = {...gameState.players};
        if (gameState.currentPlayer) {
            players[gameState.currentPlayer.id] = gameState.currentPlayer;
        }

        // Check collisions with electric balls and connections
        for (const playerId in players) {
            const player = players[playerId];
            let isHit = false;

            // Skip if player was recently hit
            if (this.lastHitTimes.has(playerId) && 
                now - this.lastHitTimes.get(playerId) < this.hitCooldown) {
                continue;
            }

            // Skip if this is the player who created the balls
            const ballOwner = this.balls.length > 0 ? this.balls[0].playerId : null;
            if (playerId === ballOwner) continue;

            // Check collisions with balls
            for (const ball of this.balls) {
                const dx = player.x - ball.x;
                const dy = player.y - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 30) { // Ball collision radius
                    isHit = true;
                    break;
                }
            }

            // Check collisions with connections
            if (!isHit) {
                for (const conn of this.connections) {
                    const distance = this.pointToLineDistance(
                        player.x, player.y,
                        conn.ball1.x, conn.ball1.y,
                        conn.ball2.x, conn.ball2.y
                    );

                    if (distance < 20) { // Lightning connection width
                        isHit = true;
                        break;
                    }
                }
            }

            // Apply damage if hit
            if (isHit) {
                this.lastHitTimes.set(playerId, now);
                this.createHitEffect(player);

                // Calculate damage with egg collection multiplier if available
                let damageAmount = this.damage;
                const sourcePlayer = players[ballOwner];
                if (sourcePlayer && sourcePlayer.eggStats && sourcePlayer.eggStats.damageMultiplier) {
                    damageAmount = Math.round(this.damage * sourcePlayer.eggStats.damageMultiplier);
                }

                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(player, damageAmount, sourcePlayer);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    if (player.shield > 0) {
                        if (player.shield >= damageAmount) {
                            player.shield -= damageAmount;
                            damageAmount = 0;
                        } else {
                            damageAmount -= player.shield;
                            player.shield = 0;
                        }
                    }
                    if (damageAmount > 0) {
                        player.health = Math.max(0, player.health - damageAmount);
                    }
                }

                // Broadcast damage if in multiplayer
                if (gameState.currentLobby && !gameState.isBotsGame) {
                    const damageData = {
                        type: 'electricDamage',
                        sourceId: ballOwner,
                        targetId: playerId,
                        damage: damageAmount,
                        timestamp: now
                    };
                    
                    gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(damageData);
                }
            }
        }
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    createHitEffect(player) {
        if (!player.hitEffects) player.hitEffects = [];
        
        player.hitEffects.push({
            type: 'electric',
            time: Date.now(),
            duration: 500,
            x: player.x,
            y: player.y
        });
    }

    render(ctx, mapRenderer) {
        // Render electric balls
        ctx.lineWidth = 2;
        for (const ball of this.balls) {
            const screenPos = mapRenderer.worldToScreen(ball.x, ball.y);
            
            // Draw glow
            const gradient = ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, 30
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw ball
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw electric particles
            const time = Date.now() / 1000;
            ctx.strokeStyle = 'white';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI/2) + time * 2;
                const radius = 10 + Math.sin(time * 4 + i) * 5;
                
                ctx.beginPath();
                ctx.moveTo(
                    screenPos.x + Math.cos(angle) * radius,
                    screenPos.y + Math.sin(angle) * radius
                );
                ctx.lineTo(
                    screenPos.x + Math.cos(angle) * (radius + 10),
                    screenPos.y + Math.sin(angle) * (radius + 10)
                );
                ctx.stroke();
            }
        }

        // Render connections
        for (const conn of this.connections) {
            const pos1 = mapRenderer.worldToScreen(conn.ball1.x, conn.ball1.y);
            const pos2 = mapRenderer.worldToScreen(conn.ball2.x, conn.ball2.y);
            
            // Draw lightning connection
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            
            const segments = 12;
            const time = Date.now() / 1000;
            
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = pos1.x + (pos2.x - pos1.x) * t;
                const y = pos1.y + (pos2.y - pos1.y) * t;
                
                // Add random offset that changes over time
                const offset = 15;
                const noise = Math.sin(t * 10 + time * 5) * offset;
                
                const perpX = -(pos2.y - pos1.y) / conn.distance;
                const perpY = (pos2.x - pos1.x) / conn.distance;
                
                ctx.lineTo(
                    x + perpX * noise,
                    y + perpY * noise
                );
            }
            
            ctx.lineTo(pos2.x, pos2.y);
            ctx.stroke();
            
            // Draw glow effect
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }
    }
}

class ElectricDash extends Ability {
    constructor() {
        super("Electric Dash", 11); // 11 seconds cooldown
        this.damage = 40;
        this.dashDistance = 300; // Maximum dash distance
        this.dashDuration = 300; // Duration of dash in milliseconds
        this.isDashing = false;
        this.dashStartTime = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.hitboxWidth = 50; // Width of the dash hitbox
        this.affectedPlayers = new Set(); // Track players hit by this dash instance
        this.pushDistance = 200; // Distance to push hit players
    }

    drawIcon(ctx, x, y, size) {
        // Draw dark blue background
        ctx.fillStyle = '#003366';
        ctx.fillRect(x, y, size, size);

        // Draw lightning trail
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = size/8;
        
        const time = Date.now() / 1000;
        const segments = 5;
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y + size * 0.5);
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const xPos = x + size * (0.2 + t * 0.6);
            const yOffset = Math.sin(t * 10 + time * 5) * size * 0.1;
            ctx.lineTo(xPos, y + size * 0.5 + yOffset);
        }
        
        ctx.stroke();

        // Draw glow effect
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = size/4;
        ctx.stroke();

        // Draw Raiden symbol
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.3);
        ctx.lineTo(x + size * 0.3, y + size * 0.7);
        ctx.lineTo(x + size * 0.7, y + size * 0.7);
        ctx.closePath();
        ctx.fill();
    }

    execute(player, gameState) {
        if (this.isDashing) return;

        // Use cursor position if available
        let dirX = 0;
        let dirY = 0;

        if (gameState.mousePosition && gameState.mapRenderer) {
            // Convert screen mouse position to world coordinates
            const worldPos = gameState.mapRenderer.screenToWorld(
                gameState.mousePosition.x,
                gameState.mousePosition.y
            );

            // Calculate direction vector from player to cursor
            dirX = worldPos.x - player.x;
            dirY = worldPos.y - player.y;

            // Limit to maximum dash distance
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > this.dashDistance) {
                dirX = (dirX / length) * this.dashDistance;
                dirY = (dirY / length) * this.dashDistance;
            }
        } else {
            // Fallback to keyboard direction
            if (gameState.keys.d) dirX += 1;
            if (gameState.keys.a) dirX -= 1;
            if (gameState.keys.s) dirY += 1;
            if (gameState.keys.w) dirY -= 1;

            // Normalize and scale to dash distance
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            if (length > 0) {
                dirX = (dirX / length) * this.dashDistance;
                dirY = (dirY / length) * this.dashDistance;
            } else {
                dirY = -this.dashDistance; // Default to forward
            }
        }

        // Set dash parameters
        this.isDashing = true;
        this.dashStartTime = Date.now();
        this.dashStartX = player.x;
        this.dashStartY = player.y;
        this.dashTargetX = player.x + dirX;
        this.dashTargetY = player.y + dirY;
        this.affectedPlayers.clear();

        // Store normalized dash direction for effects
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        this.dashDirX = dirX / length;
        this.dashDirY = dirY / length;

        // Broadcast ability use if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'electricDash',
                playerId: player.id,
                startX: this.dashStartX,
                startY: this.dashStartY,
                targetX: this.dashTargetX,
                targetY: this.dashTargetY,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }

    updateDash(player, gameState, deltaTime) {
        if (!this.isDashing) return;

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.dashStartTime;

        if (elapsedTime >= this.dashDuration) {
            // Dash complete
            this.isDashing = false;
            player.x = this.dashTargetX;
            player.y = this.dashTargetY;
            return;
        }

        // Track the last position for collision detection
        const lastX = player.x;
        const lastY = player.y;

        // Calculate current position along the dash path
        const progress = elapsedTime / this.dashDuration;
        const newX = this.dashStartX + (this.dashTargetX - this.dashStartX) * progress;
        const newY = this.dashStartY + (this.dashTargetY - this.dashStartY) * progress;

        // Update player position
        player.x = newX;
        player.y = newY;

        // Check for collisions and push affected players
        this.checkLineCollisions(player, gameState, lastX, lastY, newX, newY);
    }

    checkLineCollisions(player, gameState, startX, startY, endX, endY) {
        for (const id in gameState.players) {
            if (this.affectedPlayers.has(id) || id === player.id) continue;

            const targetPlayer = gameState.players[id];
            const distance = this.pointToLineDistance(
                targetPlayer.x, targetPlayer.y,
                startX, startY,
                endX, endY
            );

            if (distance <= this.hitboxWidth) {
                this.affectedPlayers.add(id);

                // Apply damage with egg collection multiplier if available
                let damageAmount = this.damage;
                if (player.eggStats && player.eggStats.damageMultiplier) {
                    damageAmount = Math.round(this.damage * player.eggStats.damageMultiplier);
                }

                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, damageAmount, player);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - damageAmount);
                }

                // Push the player
                const pushDirX = this.dashDirX;
                const pushDirY = this.dashDirY;
                
                targetPlayer.x += pushDirX * this.pushDistance;
                targetPlayer.y += pushDirY * this.pushDistance;

                // Create hit effect
                this.createHitEffect(targetPlayer);

                // Broadcast hit if in multiplayer
                if (gameState.currentLobby && !gameState.isBotsGame) {
                    const hitData = {
                        type: 'electricDashHit',
                        playerId: player.id,
                        targetId: id,
                        damage: damageAmount,
                        pushX: pushDirX * this.pushDistance,
                        pushY: pushDirY * this.pushDistance,
                        timestamp: Date.now()
                    };
                    
                    gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(hitData);
                }
            }
        }
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    createHitEffect(targetPlayer) {
        if (!targetPlayer.hitEffects) targetPlayer.hitEffects = [];
        
        targetPlayer.hitEffects.push({
            type: 'electricDash',
            time: Date.now(),
            duration: 500,
            x: targetPlayer.x,
            y: targetPlayer.y
        });
    }

    renderDashEffect(ctx, player, mapRenderer) {
        if (!this.isDashing) return;

        const startPos = mapRenderer.worldToScreen(this.dashStartX, this.dashStartY);
        const currentPos = mapRenderer.worldToScreen(player.x, player.y);
        const targetPos = mapRenderer.worldToScreen(this.dashTargetX, this.dashTargetY);

        // Draw lightning trail
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        
        const segments = 20;
        const time = Date.now() / 1000;
        
        // Draw multiple lightning paths for effect
        for (let path = 0; path < 3; path++) {
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = startPos.x + (currentPos.x - startPos.x) * t;
                const y = startPos.y + (currentPos.y - startPos.y) * t;
                
                // Add random offset that changes over time
                const offset = 20 * (1 - t); // Offset decreases along the path
                const noise = Math.sin(t * 10 + time * 5 + path * 7) * offset;
                
                const perpX = -(currentPos.y - startPos.y) / segments;
                const perpY = (currentPos.x - startPos.x) / segments;
                
                ctx.lineTo(
                    x + perpX * noise,
                    y + perpY * noise
                );
            }
            
            ctx.stroke();
        }

        // Draw glow effect
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        // Draw electric particles
        const particleCount = 10;
        ctx.fillStyle = '#00ffff';
        
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const x = startPos.x + (currentPos.x - startPos.x) * t;
            const y = startPos.y + (currentPos.y - startPos.y) * t;
            
            const size = Math.random() * 4 + 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Reap extends Ability {
    constructor() {
        super("Reap", 1); // 1 second cooldown
        this.damage = 20;
        this.range = 100; // Range around Zasalamel
        this.hitEffects = []; // Track hit effects for rendering
        this.spinEffects = []; // Track spin animation effects
        this.spinDuration = 500; // Duration of spin animation in ms
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw purple/dark red scythe icon
        ctx.save();
        
        // Background gradient
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size/2
        );
        gradient.addColorStop(0, '#4a0404');
        gradient.addColorStop(1, '#2a0202');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw scythe
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(-Math.PI / 4); // Rotate to nice angle
        
        // Draw scythe blade
        ctx.beginPath();
        ctx.strokeStyle = '#6a0dad'; // Dark purple
        ctx.lineWidth = size/10;
        ctx.arc(0, -size/6, size/3, -Math.PI * 0.8, Math.PI * 0.3);
        ctx.stroke();
        
        // Add glow to blade
        ctx.shadowColor = '#6a0dad';
        ctx.shadowBlur = size/10;
        ctx.stroke();
        
        // Draw handle
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.strokeStyle = '#4a0404'; // Dark red
        ctx.lineWidth = size/15;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size*0.4);
        ctx.stroke();
        
        ctx.restore();
    }
    
    execute(player, gameState) {
        // Create spin effect
        this.spinEffects.push({
            x: player.x,
            y: player.y,
            startTime: Date.now(),
            duration: this.spinDuration,
            startAngle: 0,
            endAngle: Math.PI * 4 // Two full rotations
        });

        // Find all players within range
        const affectedPlayers = new Set();
        
        for (const id in gameState.players) {
            if (id === player.id) continue; // Skip self
            
            const targetPlayer = gameState.players[id];
            const dx = targetPlayer.x - player.x;
            const dy = targetPlayer.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range) {
                affectedPlayers.add(targetPlayer);
                
                // Apply damage with egg collection multiplier if available
                let damageAmount = this.damage;
                if (player.eggStats && player.eggStats.damageMultiplier) {
                    damageAmount = Math.round(this.damage * player.eggStats.damageMultiplier);
                }
                
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, damageAmount, player);
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - damageAmount);
                }
                
                // Create hit effect
                this.hitEffects.push({
                    x: targetPlayer.x,
                    y: targetPlayer.y,
                    time: Date.now(),
                    duration: 300
                });
            }
        }
        
        // Broadcast ability use if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'reap',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                timestamp: Date.now(),
                affectedPlayers: Array.from(affectedPlayers).map(p => p.id)
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    renderEffects(ctx, mapRenderer) {
        // Render spin effects
        this.spinEffects = this.spinEffects.filter(effect => {
            const elapsed = Date.now() - effect.startTime;
            if (elapsed >= effect.duration) return false;
            
            const progress = elapsed / effect.duration;
            const currentAngle = effect.startAngle + (effect.endAngle - effect.startAngle) * progress;
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(currentAngle);
            
            // Draw scythe blade
            ctx.beginPath();
            ctx.strokeStyle = '#6a0dad'; // Dark purple
            ctx.lineWidth = 4;
            ctx.arc(0, -30, 40, -Math.PI * 0.8, Math.PI * 0.3);
            ctx.stroke();
            
            // Draw handle
            ctx.beginPath();
            ctx.strokeStyle = '#4a0404'; // Dark red
            ctx.lineWidth = 3;
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -60);
            ctx.stroke();
            
            // Add glow effect
            ctx.globalAlpha = 0.3;
            ctx.shadowColor = '#6a0dad';
            ctx.shadowBlur = 15;
            ctx.stroke();
            
            ctx.restore();
            
            return true;
        });

        // Render hit effects
        this.hitEffects = this.hitEffects.filter(effect => {
            const elapsed = Date.now() - effect.time;
            if (elapsed >= effect.duration) return false;
            
            const screenPos = mapRenderer.worldToScreen(effect.x, effect.y);
            const alpha = 1 - (elapsed / effect.duration);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Draw slashing effect
            ctx.strokeStyle = '#6a0dad'; // Dark purple
            ctx.lineWidth = 3;
            
            // Draw multiple slash lines
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI / 3) * i + (elapsed / effect.duration * Math.PI);
                const length = 30;
                
                ctx.beginPath();
                ctx.moveTo(
                    screenPos.x + Math.cos(angle) * length,
                    screenPos.y + Math.sin(angle) * length
                );
                ctx.lineTo(
                    screenPos.x - Math.cos(angle) * length,
                    screenPos.y - Math.sin(angle) * length
                );
                
                // Add glow effect
                ctx.shadowColor = '#6a0dad';
                ctx.shadowBlur = 10;
                ctx.stroke();
            }
            
            ctx.restore();
            
            return true;
        });
    }
}

class SoulAura extends Ability {
    constructor() {
        super("Soul Aura", 22); // 22 seconds cooldown
        this.damage = 20;
        this.range = 150; // Range around Zasalamel
        this.duration = 5000; // 5 seconds duration
        this.tickInterval = 500; // Damage every 0.5 seconds
        this.isActive = false;
        this.activationTime = 0;
        this.lastTickTime = 0;
        this.hitEffects = []; // Track hit effects for rendering
        this.soulParticles = []; // Track soul particles for visual effect
    }
    
    drawIcon(ctx, x, y, size) {
        // Draw dark red soul aura icon
        ctx.save();
        
        // Background gradient
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size/2
        );
        gradient.addColorStop(0, '#4a0404');
        gradient.addColorStop(1, '#2a0202');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw aura circle
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = size/15;
        ctx.shadowColor = '#8b0000';
        ctx.shadowBlur = size/10;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw soul particles
        const numParticles = 5;
        ctx.fillStyle = '#8b0000';
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const distance = size/4;
            const particleX = x + size/2 + Math.cos(angle) * distance;
            const particleY = y + size/2 + Math.sin(angle) * distance;
            const particleSize = size/10;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw particle trail
            ctx.beginPath();
            ctx.moveTo(particleX, particleY);
            ctx.lineTo(
                particleX - Math.cos(angle) * size/8,
                particleY - Math.sin(angle) * size/8
            );
            ctx.lineWidth = particleSize;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Draw center
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = size/20;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    execute(player, gameState) {
        this.isActive = true;
        this.activationTime = Date.now();
        this.lastTickTime = Date.now();
        
        // Create initial soul particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.soulParticles.push({
                x: player.x + Math.cos(angle) * this.range,
                y: player.y + Math.sin(angle) * this.range,
                angle: angle,
                speed: 2 + Math.random(),
                size: 5 + Math.random() * 5,
                opacity: 0.7 + Math.random() * 0.3
            });
        }
        
        // Broadcast ability activation if in multiplayer
        if (gameState.currentLobby && !gameState.isBotsGame) {
            const abilityData = {
                type: 'soulAura',
                playerId: player.id,
                sourceX: player.x,
                sourceY: player.y,
                timestamp: Date.now()
            };
            
            gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/abilities`).push().set(abilityData);
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isActive) {
            const now = Date.now();
            const elapsed = now - this.activationTime;
            
            if (elapsed >= this.duration) {
                this.isActive = false;
                this.soulParticles = []; // Clear particles when ability ends
            }
        }
    }
    
    applyAuraEffects(player, gameState) {
        if (!this.isActive) return;
        
        const now = Date.now();
        if (now - this.lastTickTime < this.tickInterval) return;
        
        this.lastTickTime = now;
        let totalDamageDealt = 0;
        
        // Find all players within range
        for (const id in gameState.players) {
            if (id === player.id) continue; // Skip self
            
            const targetPlayer = gameState.players[id];
            const dx = targetPlayer.x - player.x;
            const dy = targetPlayer.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range) {
                // Apply damage with egg collection multiplier if available
                let damageAmount = this.damage;
                if (player.eggStats && player.eggStats.damageMultiplier) {
                    damageAmount = Math.round(this.damage * player.eggStats.damageMultiplier);
                }
                
                // Apply damage using takeDamage function
                if (typeof window.takeDamage === 'function') {
                    window.takeDamage(targetPlayer, damageAmount, player);
                    totalDamageDealt += damageAmount;
                } else {
                    // Fallback to direct health modification if takeDamage is not available
                    targetPlayer.health = Math.max(0, targetPlayer.health - damageAmount);
                    totalDamageDealt += damageAmount;
                }
                
                // Create hit effect
                this.hitEffects.push({
                    x: targetPlayer.x,
                    y: targetPlayer.y,
                    time: now,
                    duration: 300,
                    angle: Math.atan2(dy, dx)
                });
            }
        }
        
        // Heal Zasalamel for the damage dealt
        if (totalDamageDealt > 0) {
            if (gameState.currentLobby && !gameState.isBotsGame) {
                gameState.database.ref(`battle-royale/lobbies/${gameState.currentLobby}/players/${player.id}`).update({
                    health: Math.min(200, player.health + totalDamageDealt)
                });
            } else {
                player.health = Math.min(200, player.health + totalDamageDealt);
            }
        }
    }
    
    renderAura(ctx, player, mapRenderer) {
        if (!this.isActive) return;
        
        const elapsed = Date.now() - this.activationTime;
        const alpha = Math.min(1, (this.duration - elapsed) / 1000);
        
        const screenPos = mapRenderer.worldToScreen(player.x, player.y);
        
        // Draw dark red aura circle
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        
        // Create gradient for aura
        const gradient = ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, this.range
        );
        gradient.addColorStop(0, 'rgba(100, 0, 0, 0.1)');
        gradient.addColorStop(0.7, 'rgba(139, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(88, 0, 0, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.range, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw aura border with glow
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = '#8b0000'; // Dark red
        ctx.lineWidth = 2;
        ctx.shadowColor = '#8b0000';
        ctx.shadowBlur = 15;
        ctx.stroke();
        
        // Update and render soul particles
        for (let particle of this.soulParticles) {
            particle.angle += particle.speed * 0.02;
            particle.x = player.x + Math.cos(particle.angle) * this.range;
            particle.y = player.y + Math.sin(particle.angle) * this.range;
            
            const particlePos = mapRenderer.worldToScreen(particle.x, particle.y);
            
            ctx.globalAlpha = particle.opacity * alpha;
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(particlePos.x, particlePos.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add particle trail
            ctx.globalAlpha = (particle.opacity * alpha) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particlePos.x, particlePos.y);
            ctx.lineTo(
                particlePos.x - Math.cos(particle.angle) * 15,
                particlePos.y - Math.sin(particle.angle) * 15
            );
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = particle.size;
            ctx.stroke();
        }
        
        // Draw hit effects
        this.hitEffects = this.hitEffects.filter(effect => {
            const effectElapsed = Date.now() - effect.time;
            if (effectElapsed >= effect.duration) return false;
            
            const effectPos = mapRenderer.worldToScreen(effect.x, effect.y);
            const effectAlpha = 1 - (effectElapsed / effect.duration);
            
            ctx.globalAlpha = effectAlpha;
            ctx.strokeStyle = '#8b0000';
            ctx.lineWidth = 3;
            
            // Draw soul drain effect
            const startRadius = 20;
            const endRadius = 5;
            const spiralRotations = 2;
            
            ctx.beginPath();
            for (let i = 0; i <= 20; i++) {
                const t = i / 20;
                const radius = startRadius * (1 - t) + endRadius * t;
                const angle = effect.angle + (spiralRotations * Math.PI * 2 * t);
                const x = effectPos.x + Math.cos(angle) * radius;
                const y = effectPos.y + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            // Add glow effect
            ctx.shadowColor = '#8b0000';
            ctx.shadowBlur = 10;
            ctx.stroke();
            
            return true;
        });
        
        ctx.restore();
    }
}

// Initialize abilities for each character
function initializeCharacterAbilities(character) {
    switch(character) {
        case 'Shinnok.png':
            return {
                q: new BurstBlast(),
                r: new BonePrison()
            };
        case 'Zasalamel.png':
            return {
                q: new Reap(),
                r: new SoulAura()
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
        case 'Raiden.png':
            return {
                q: new ElectricBall(),
                r: new ElectricDash()
            };
        default:
            return {
                q: new DashingKick(),
                r: new ExecuteKick()
            };
    }
    return null;
}

// Make BonePrison use the same collision detection as BurstBlast
// This fixes the issue where Shinnok's abilities go through enemies
BonePrison.prototype.checkProjectileCollisions = BurstBlast.prototype.checkProjectileCollisions;

// Add render method call for Fan Toss projectiles
function renderAbilityEffects(ctx, player, gameState) {
    if (!ctx || !player || !player.abilities) return;
    
    // Get map renderer from game state if available
    const mapRenderer = gameState.mapRenderer;
    if (!mapRenderer) return;
    
    // Render FanToss projectiles
    if (player.abilities.q instanceof FanToss) {
        player.abilities.q.renderProjectiles(ctx, mapRenderer);
        player.abilities.q.checkProjectileCollisions(gameState);
    }
    
    // Render BlazingAura
    if (player.abilities.r instanceof BlazingAura) {
        player.abilities.r.renderAura(ctx, player, mapRenderer);
        player.abilities.r.applyAuraEffects(player, gameState);
    }
    
    // Other ability effects...
    // (existing code for other ability rendering)
}

// Ability UI renderer
class AbilityRenderer {
    constructor() {
        this.qAbilityIcon = new Image();
        this.rAbilityIcon = new Image();
        this.loadedIcons = new Set();
        this.brokenIcons = new Set();
        
        // Add error handlers to detect broken images
        this.qAbilityIcon.onerror = () => this.handleBrokenIcon(this.qAbilityIcon.src);
        this.rAbilityIcon.onerror = () => this.handleBrokenIcon(this.rAbilityIcon.src);
    }
    
    handleBrokenIcon(iconPath) {
        this.brokenIcons.add(iconPath);
        console.warn(`Failed to load ability icon: ${iconPath}`);
    }
    
    loadIconForAbility(ability, keySlot) {
        if (!ability || !ability.icon || this.loadedIcons.has(ability.icon) || this.brokenIcons.has(ability.icon)) return;
        
        const img = keySlot === 'q' ? this.qAbilityIcon : this.rAbilityIcon;
        
        // Use the direct path provided in the ability's icon property
        img.src = ability.icon;
        
        this.loadedIcons.add(ability.icon);
    }
    
    renderAbilityUI(ctx, player) {
        if (!player || !player.abilities) return;
        
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // UI positions
        const abilitySize = 60;
        const margin = 10;
        const bottomMargin = 50;
        
        // Q ability position (bottom center left)
        const qX = canvasWidth / 2 - abilitySize - margin;
        const qY = canvasHeight - abilitySize - bottomMargin;
        
        // R ability position (bottom center right)
        const rX = canvasWidth / 2 + margin;
        const rY = canvasHeight - abilitySize - bottomMargin;
        
        // Draw Q ability
        if (player.abilities.q) {
            this.renderAbilitySlot(ctx, player.abilities.q, qX, qY, abilitySize, 'Q');
        }
        
        // Draw R ability
        if (player.abilities.r) {
            this.renderAbilitySlot(ctx, player.abilities.r, rX, rY, abilitySize, 'R');
        }
    }
    
    renderAbilitySlot(ctx, ability, x, y, size, keyLabel) {
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, size, size);
        
        // Check if ability has a custom drawIcon method
        if (typeof ability.drawIcon === 'function') {
            // Use custom vector-based icon
            ability.drawIcon(ctx, x, y, size);
        } else {
            // Use image-based icon if available and loaded (not broken)
            const icon = keyLabel === 'Q' ? this.qAbilityIcon : this.rAbilityIcon;
            const isIconBroken = ability.icon && this.brokenIcons.has(ability.icon);
            
            if (icon.complete && !isIconBroken && icon.naturalWidth > 0) {
                try {
                    ctx.drawImage(icon, x, y, size, size);
                } catch (error) {
                    console.warn(`Error drawing ability icon: ${error.message}`);
                    this.handleBrokenIcon(icon.src);
                    this.drawDefaultIcon(ctx, ability, x, y, size);
                }
            } else {
                this.drawDefaultIcon(ctx, ability, x, y, size);
            }
        }
        
        // Draw cooldown overlay
        if (ability.isOnCooldown) {
            const cooldownPercent = ability.getCooldownPercent();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.moveTo(x + size/2, y + size/2);
            ctx.arc(
                x + size/2, 
                y + size/2, 
                size/2, 
                -Math.PI/2, 
                -Math.PI/2 + (2 * Math.PI * cooldownPercent), 
                false
            );
            ctx.closePath();
            ctx.fill();
            
            // Draw cooldown text
            const cooldownSec = Math.ceil(ability.currentCooldown / 1000);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cooldownSec, x + size/2, y + size/2);
        }
        
        // Draw key label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(keyLabel, x + size/2, y + size - 10);
    }
    
    // Draw a default placeholder icon
    drawDefaultIcon(ctx, ability, x, y, size) {
        // Draw placeholder for broken/missing icon
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
        
        // Draw ability name as text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ability.name.substring(0, 10), x + size/2, y + size/2 - 10);
    }
} 