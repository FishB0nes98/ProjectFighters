// Raid Renderer Class
class RaidRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraScale = 1;
        this.targetCameraScale = 1;
        this.cameraLerpFactor = 0.1;
        this.timeDistortions = []; // We'll keep this variable but won't actively use it
        this.lastDistortionTime = 0;
        
        // Edge scrolling variables
        this.edgeScrollActive = true;
        this.edgeScrollThreshold = 80; // pixels from edge to start scrolling
        this.edgeScrollSpeed = 8;
        this.mousePosition = { x: 0, y: 0 };
        this.cameraOffset = { x: 0, y: 0 };
        
        // Visual effects arrays
        this.slashEffects = [];
        
        // Setup mouse tracking for edge scrolling
        canvas.addEventListener('mousemove', (e) => this.trackMouse(e));
    }
    
    trackMouse(e) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    render(gameState) {
        // Handle edge scrolling
        if (this.edgeScrollActive) {
            this.updateEdgeScrolling();
        }
        
        // Update camera position to center on boss with offset
        if (gameState.boss) {
            this.updateCamera(gameState);
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw floor shadow
        this.drawFloorShadow(gameState);
        
        // We're not drawing time distortion effects anymore
        
        // Draw entities
        this.drawEntities(gameState);
        
        // Draw effects
        this.drawEffects(gameState);
        
        // Draw slash effects
        this.updateSlashEffects();
        this.drawSlashEffects();
        
        // Draw UI
        this.drawUI(gameState);
    }
    
    updateEdgeScrolling() {
        // Reset camera offset acceleration
        let offsetAccelX = 0;
        let offsetAccelY = 0;
        
        // Check if mouse is near the edges
        // Right edge
        if (this.mousePosition.x > this.canvas.width - this.edgeScrollThreshold) {
            offsetAccelX = (this.mousePosition.x - (this.canvas.width - this.edgeScrollThreshold)) / this.edgeScrollThreshold;
        }
        // Left edge
        else if (this.mousePosition.x < this.edgeScrollThreshold) {
            offsetAccelX = -(1 - this.mousePosition.x / this.edgeScrollThreshold);
        }
        
        // Bottom edge
        if (this.mousePosition.y > this.canvas.height - this.edgeScrollThreshold) {
            offsetAccelY = (this.mousePosition.y - (this.canvas.height - this.edgeScrollThreshold)) / this.edgeScrollThreshold;
        }
        // Top edge
        else if (this.mousePosition.y < this.edgeScrollThreshold) {
            offsetAccelY = -(1 - this.mousePosition.y / this.edgeScrollThreshold);
        }
        
        // Apply acceleration to camera offset
        this.cameraOffset.x += offsetAccelX * this.edgeScrollSpeed;
        this.cameraOffset.y += offsetAccelY * this.edgeScrollSpeed;
        
        // Limit max camera offset
        const maxOffset = 300;
        this.cameraOffset.x = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.x));
        this.cameraOffset.y = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.y));
        
        // Apply damping when not scrolling
        if (Math.abs(offsetAccelX) < 0.01 && Math.abs(offsetAccelY) < 0.01) {
            this.cameraOffset.x *= 0.95;
            this.cameraOffset.y *= 0.95;
            
            // Reset tiny values to zero
            if (Math.abs(this.cameraOffset.x) < 0.5) this.cameraOffset.x = 0;
            if (Math.abs(this.cameraOffset.y) < 0.5) this.cameraOffset.y = 0;
        }
    }
    
    updateCamera(gameState) {
        // Smoothly move camera to follow boss with offset
        const boss = gameState.boss;
        
        if (boss) {
            const targetX = boss.x + this.cameraOffset.x;
            const targetY = boss.y + this.cameraOffset.y;
            
            this.cameraX += (targetX - this.cameraX) * this.cameraLerpFactor;
            this.cameraY += (targetY - this.cameraY) * this.cameraLerpFactor;
            
            // Adjust camera scale based on action intensity
            this.cameraScale += (this.targetCameraScale - this.cameraScale) * 0.05;
            
            // Constrain camera to arena boundaries
            this.constrainCameraToBoundaries();
        }
    }
    
    constrainCameraToBoundaries() {
        // Ensure camera doesn't go too far from arena center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxDistance = 500;
        
        const dx = this.cameraX - centerX;
        const dy = this.cameraY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            this.cameraX = centerX + Math.cos(angle) * maxDistance;
            this.cameraY = centerY + Math.sin(angle) * maxDistance;
        }
    }
    
    // Helper function to add time distortion at a position
    // We'll keep this function for compatibility but make it do nothing
    addTimeDistortion(x, y) {
        // Do nothing - time distortions removed
        return;
    }
    
    // Helper function to add slash effects
    addSlashEffect(params) {
        this.slashEffects.push({
            startX: params.startX,
            startY: params.startY,
            endX: params.endX,
            endY: params.endY,
            width: params.width || 30,
            startTime: performance.now(),
            duration: params.duration || 500,
            color: params.color || 'rgba(180, 50, 255, 0.7)'
        });
    }
    
    // Add a curved slash effect for Scythe Slash
    addArcSlashEffect(centerX, centerY, radius, angle, width, color) {
        this.slashEffects.push({
            isArc: true,
            centerX: centerX,
            centerY: centerY,
            radius: radius,
            angle: angle,
            width: width || 40,
            startTime: performance.now(),
            duration: 700,
            color: color || 'rgba(200, 0, 0, 0.8)'
        });
    }
    
    updateSlashEffects() {
        const now = performance.now();
        
        // Update and filter out expired slash effects
        this.slashEffects = this.slashEffects.filter(effect => {
            return now - effect.startTime < effect.duration;
        });
    }
    
    drawSlashEffects() {
        const ctx = this.ctx;
        const now = performance.now();
        
        this.slashEffects.forEach(effect => {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;
            
            if (progress >= 1) return;
            
            // Check if it's an arc slash (for Scythe Slash) or regular slash
            if (effect.isArc) {
                // Draw arc slash
                const alpha = 1 - progress;
                const angleWidth = 0.3; // Width of the arc in radians
                
                // Create a gradient for the arc
                const gradient = ctx.createRadialGradient(
                    effect.centerX, effect.centerY, effect.radius - effect.width/2,
                    effect.centerX, effect.centerY, effect.radius + effect.width/2
                );
                
                // Base color without alpha
                const baseColor = effect.color.replace(/[\d.]+\)$/, '');
                
                gradient.addColorStop(0, `${baseColor}0)`);
                gradient.addColorStop(0.3, `${baseColor}${alpha * 0.9})`);
                gradient.addColorStop(0.5, `${baseColor}${alpha})`);
                gradient.addColorStop(0.7, `${baseColor}${alpha * 0.9})`);
                gradient.addColorStop(1, `${baseColor}0)`);
                
                // Draw the arc slash - make it simpler and more scythe-like
                ctx.beginPath();
                ctx.arc(
                    effect.centerX, 
                    effect.centerY, 
                    effect.radius, 
                    effect.angle - angleWidth, 
                    effect.angle + angleWidth
                );
                ctx.lineWidth = effect.width;
                ctx.strokeStyle = gradient;
                ctx.stroke();
                
                // Simple blade edge effect
                ctx.beginPath();
                const edgeAngle = effect.angle;
                const startX = effect.centerX + Math.cos(edgeAngle - angleWidth) * effect.radius;
                const startY = effect.centerY + Math.sin(edgeAngle - angleWidth) * effect.radius;
                const endX = effect.centerX + Math.cos(edgeAngle + angleWidth) * effect.radius;
                const endY = effect.centerY + Math.sin(edgeAngle + angleWidth) * effect.radius;
                
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.lineWidth = effect.width * 0.3;
                ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha * 0.7 + ')';
                ctx.stroke();
            } else {
                // Draw regular slash (existing code)
                // Calculate direction vector
                const dx = effect.endX - effect.startX;
                const dy = effect.endY - effect.startY;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate perpendicular vector
                const perpX = -dy / length;
                const perpY = dx / length;
                
                // Create slash path
                ctx.beginPath();
                
                // Draw slash as a quadrilateral
                ctx.moveTo(
                    effect.startX + perpX * effect.width / 2,
                    effect.startY + perpY * effect.width / 2
                );
                ctx.lineTo(
                    effect.endX + perpX * effect.width / 2,
                    effect.endY + perpY * effect.width / 2
                );
                ctx.lineTo(
                    effect.endX - perpX * effect.width / 2,
                    effect.endY - perpY * effect.width / 2
                );
                ctx.lineTo(
                    effect.startX - perpX * effect.width / 2,
                    effect.startY - perpY * effect.width / 2
                );
                ctx.closePath();
                
                // Create gradient along the slash
                const gradient = ctx.createLinearGradient(
                    effect.startX, effect.startY,
                    effect.endX, effect.endY
                );
                
                const alpha = 1 - progress;
                const baseColor = effect.color.replace(/[\d.]+\)$/, ''); // Remove alpha value
                
                gradient.addColorStop(0, `${baseColor}0)`);
                gradient.addColorStop(0.1, `${baseColor}${alpha * 0.7})`);
                gradient.addColorStop(0.5, `${baseColor}${alpha})`);
                gradient.addColorStop(0.9, `${baseColor}${alpha * 0.7})`);
                gradient.addColorStop(1, `${baseColor}0)`);
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Add glow effect
                ctx.beginPath();
                ctx.moveTo(
                    effect.startX + perpX * effect.width * 0.8,
                    effect.startY + perpY * effect.width * 0.8
                );
                ctx.lineTo(
                    effect.endX + perpX * effect.width * 0.8,
                    effect.endY + perpY * effect.width * 0.8
                );
                ctx.lineTo(
                    effect.endX - perpX * effect.width * 0.8,
                    effect.endY - perpY * effect.width * 0.8
                );
                ctx.lineTo(
                    effect.startX - perpX * effect.width * 0.8,
                    effect.startY - perpY * effect.width * 0.8
                );
                ctx.closePath();
                
                ctx.fillStyle = `${baseColor}${alpha * 0.3})`;
                ctx.fill();
            }
        });
    }
    
    // We're keeping these functions empty for compatibility
    updateTimeDistortions() {
        // Do nothing - time distortions removed
    }
    
    drawTimeDistortions() {
        // Do nothing - time distortions removed
    }
    
    drawFloorShadow(gameState) {
        const ctx = this.ctx;
        
        // Draw shadow for boss
        if (gameState.boss) {
            const boss = gameState.boss;
            
            ctx.beginPath();
            ctx.ellipse(
                boss.x, 
                boss.y + boss.sizeMultiplier * PLAYER_SIZE.height / 2, 
                boss.sizeMultiplier * PLAYER_SIZE.width / 2, 
                boss.sizeMultiplier * PLAYER_SIZE.width / 8, 
                0, 
                0, 
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }
        
        // Draw shadows for players
        gameState.players.forEach(player => {
            if (player.health <= 0) return; // Don't draw shadows for dead players
            
            ctx.beginPath();
            ctx.ellipse(
                player.x, 
                player.y + PLAYER_SIZE.height / 2, 
                PLAYER_SIZE.width / 2, 
                PLAYER_SIZE.width / 8, 
                0, 
                0, 
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        });
    }
    
    drawEntities(gameState) {
        // Draw players first (they're behind the boss for better visibility)
        gameState.players.forEach(player => {
            player.draw(this.ctx);
        });
        
        // Draw boss
        if (gameState.boss) {
            gameState.boss.draw(this.ctx, this);
        }
    }
    
    drawEffects(gameState) {
        const ctx = this.ctx;
        
        // Draw ability effects
        gameState.players.forEach(player => {
            if (player.abilities) {
                // Draw ability effects based on their type
                
                // Fan Toss projectiles (Mai)
                if (player.abilities.q instanceof FanToss) {
                    player.abilities.q.activeProjectiles.forEach(projectile => {
                        ctx.save();
                        ctx.translate(projectile.x, projectile.y);
                        ctx.rotate(projectile.rotation);
                        
                        // Draw fan projectile
                        ctx.beginPath();
                        ctx.moveTo(0, -10);
                        ctx.lineTo(15, 0);
                        ctx.lineTo(0, 10);
                        ctx.closePath();
                        ctx.fillStyle = '#ff9999';
                        ctx.fill();
                        
                        ctx.restore();
                    });
                }
                
                // Burst Blast projectiles (Shinnok)
                if (player.abilities.q instanceof BurstBlast) {
                    // Draw projectiles
                    player.abilities.q.activeProjectiles.forEach(projectile => {
                        ctx.beginPath();
                        ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
                        ctx.fillStyle = '#993333';
                        ctx.fill();
                        
                        // Glow effect
                        const gradient = ctx.createRadialGradient(
                            projectile.x, projectile.y, 5,
                            projectile.x, projectile.y, 15
                        );
                        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.beginPath();
                        ctx.arc(projectile.x, projectile.y, 15, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    });
                    
                    // Draw blast effects
                    player.abilities.q.blastEffects.forEach(effect => {
                        const elapsed = performance.now() - effect.startTime;
                        const progress = Math.min(1, elapsed / effect.duration);
                        const radius = progress * player.abilities.q.radius;
                        
                        // Blast circle
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 0, 0, ${0.7 * (1 - progress)})`;
                        ctx.fill();
                        
                        // Blast ring
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    });
                }
                
                // Bone Prison effects (Shinnok)
                if (player.abilities.r instanceof BonePrison) {
                    player.abilities.r.activeEffects.forEach(effect => {
                        const elapsed = performance.now() - effect.startTime;
                        const progress = Math.min(1, elapsed / effect.duration);
                        
                        // Draw bone prison circle
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(150, 150, 150, ${0.7 * (1 - progress)})`;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        
                        // Draw bone spikes
                        const spikes = 12;
                        for (let i = 0; i < spikes; i++) {
                            const angle = (i / spikes) * Math.PI * 2;
                            const spikeHeight = 40 * (1 - progress * 0.5);
                            
                            ctx.save();
                            ctx.translate(effect.x, effect.y);
                            ctx.rotate(angle);
                            
                            // Draw bone spike
                            ctx.beginPath();
                            ctx.moveTo(effect.radius - 10, 0);
                            ctx.lineTo(effect.radius + spikeHeight, 0);
                            ctx.lineTo(effect.radius + spikeHeight - 10, 8);
                            ctx.lineTo(effect.radius - 5, 5);
                            ctx.closePath();
                            ctx.fillStyle = '#e0e0e0';
                            ctx.fill();
                            ctx.strokeStyle = '#999999';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            
                            ctx.restore();
                        }
                    });
                }
                
                // Blazing Aura effects (Mai)
                if (player.abilities.r instanceof BlazingAura && player.abilities.r.isActive) {
                    const aura = player.abilities.r;
                    const elapsed = performance.now() - aura.activationTime;
                    const progress = Math.min(1, elapsed / aura.duration);
                    
                    // Draw fire aura
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, aura.range, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 100, 0, ${0.2 * (1 - progress * 0.5)})`;
                    ctx.fill();
                    
                    // Draw fire particles
                    const particles = 24;
                    for (let i = 0; i < particles; i++) {
                        const angle = (i / particles) * Math.PI * 2 + performance.now() / 1000;
                        const dist = aura.range * (0.7 + Math.sin(angle * 3 + performance.now() / 500) * 0.3);
                        const x = player.x + Math.cos(angle) * dist;
                        const y = player.y + Math.sin(angle) * dist;
                        
                        ctx.beginPath();
                        ctx.arc(x, y, 5 + Math.random() * 5, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 100)}, 0, ${0.7 * (1 - progress * 0.5)})`;
                        ctx.fill();
                    }
                }
                
                // Team Heal effects (Julia)
                if (player.abilities.r instanceof TeamHeal) {
                    player.abilities.r.activeEffects.forEach(effect => {
                        const elapsed = performance.now() - effect.startTime;
                        const progress = Math.min(1, elapsed / effect.duration);
                        
                        // Draw healing circle
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, player.abilities.r.radius * progress, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(100, 255, 100, ${0.3 * (1 - progress)})`;
                        ctx.fill();
                        
                        // Draw healing ring
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, player.abilities.r.radius * progress, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(50, 255, 50, ${0.7 * (1 - progress)})`;
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    });
                }
                
                // Wind Push effects (Julia)
                if (player.abilities.q instanceof WindPush) {
                    player.abilities.q.activeEffects.forEach(effect => {
                        const elapsed = performance.now() - effect.startTime;
                        const progress = Math.min(1, elapsed / effect.duration);
                        
                        // Calculate direction and distance
                        const dx = effect.targetX - effect.x;
                        const dy = effect.targetY - effect.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const dirX = dx / distance;
                        const dirY = dy / distance;
                        
                        // Draw wind effect
                        for (let i = 0; i < 5; i++) {
                            const offset = i * player.abilities.q.range / 5;
                            const x = effect.x + dirX * offset * progress;
                            const y = effect.y + dirY * offset * progress;
                            
                            ctx.beginPath();
                            ctx.arc(x, y, 5 + (i * 3) * (1 - progress), 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(200, 255, 255, ${0.7 * (1 - progress)})`;
                            ctx.fill();
                        }
                    });
                }
            }
        });
        
        // Draw Soul Aura effect for boss if active
        if (gameState.boss && gameState.boss.abilities.r.alwaysActive) {
            // This is handled in the boss.drawSoulAura method
        }
    }
    
    drawUI(gameState) {
        // Draw player and boss info (health bars, etc.)
        // These are handled by the HTML elements
    }
    
    drawBackground() {
        // Create a gradient background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 10,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 1.5
        );
        
        // Dark blue/gray colors (less purple, no time theme)
        gradient.addColorStop(0, '#101030');
        gradient.addColorStop(0.7, '#080818');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw simple stars instead of time fragments
        this.drawStars();
        
        // Draw a circular arena floor
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 900;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        // Create floor gradient (less time-themed)
        const floorGradient = this.ctx.createRadialGradient(
            centerX, centerY, radius * 0.2,
            centerX, centerY, radius
        );
        floorGradient.addColorStop(0, '#202040');
        floorGradient.addColorStop(0.7, '#101020');
        floorGradient.addColorStop(1, '#080810');
        
        this.ctx.fillStyle = floorGradient;
        this.ctx.fill();
        
        // Draw arena border with simple effect
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#404080';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Add a subtle glow to the border
        const glowSize = 8;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(80, 80, 160, 0.3)';
        this.ctx.lineWidth = glowSize;
        this.ctx.stroke();
        
        // No more time runes
        
        // Draw grid lines on the arena floor
        this.ctx.strokeStyle = 'rgba(80, 80, 120, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let y = -radius; y <= radius; y += 150) {
            this.ctx.beginPath();
            // Apply 3D perspective to lines
            const startX = -Math.sqrt(radius * radius - y * y);
            const endX = Math.sqrt(radius * radius - y * y);
            
            if (!isNaN(startX) && !isNaN(endX)) {
                this.ctx.moveTo(centerX + startX, centerY + y);
                this.ctx.lineTo(centerX + endX, centerY + y);
                this.ctx.stroke();
            }
        }
        
        // Vertical grid lines
        for (let x = -radius; x <= radius; x += 150) {
            this.ctx.beginPath();
            // Apply 3D perspective to lines
            const startY = -Math.sqrt(radius * radius - x * x);
            const endY = Math.sqrt(radius * radius - x * x);
            
            if (!isNaN(startY) && !isNaN(endY)) {
                this.ctx.moveTo(centerX + x, centerY + startY);
                this.ctx.lineTo(centerX + x, centerY + endY);
                this.ctx.stroke();
            }
        }
    }
    
    drawStars() {
        const ctx = this.ctx;
        
        // Draw simple stars - no time theme
        for (let i = 0; i < 200; i++) {
            const x = Math.sin(i * 4321) * this.canvas.width;
            const y = Math.cos(i * 1234) * this.canvas.height;
            const size = 0.5 + Math.random() * 0.5;
            
            ctx.beginPath();
            ctx.arc(
                this.canvas.width / 2 + x / 2, 
                this.canvas.height / 2 + y / 2, 
                size, 
                0, 
                Math.PI * 2
            );
            
            // White/blue stars instead of time-themed colors
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
            ctx.fill();
        }
    }
} 