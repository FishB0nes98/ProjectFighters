class InputManager {
    constructor() {
        this.pressedKeys = new Set();
        this.mouseState = {
            leftButton: false,
            rightButton: false,
            x: 0,
            y: 0
        };
        this.setupEventListeners();
    }
    
        setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            this.pressedKeys.add(key);
            // Also add common variations
            this.pressedKeys.add(key.toLowerCase());
            this.pressedKeys.add(key.toUpperCase());
            // No preventDefault here to allow browser shortcuts if needed
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key;
            // Remove all variations of the key
            this.pressedKeys.delete(key);
            this.pressedKeys.delete(key.toLowerCase());
            this.pressedKeys.delete(key.toUpperCase());
        });
        
        // Clear keys on various focus events
        window.addEventListener('blur', () => {
            this.clearAllKeys();
        });

        window.addEventListener('focus', () => {
            this.clearAllKeys();
        });
        
        // Also clear on visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.clearAllKeys();
            }
        });
        
        // Mouse event listeners (unchanged)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseState.leftButton = true;
            } else if (e.button === 2) {
                this.mouseState.rightButton = true;
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseState.leftButton = false;
            } else if (e.button === 2) {
                this.mouseState.rightButton = false;
            }
        });
        document.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.mouseState.x = e.clientX - rect.left;
            this.mouseState.y = e.clientY - rect.top;
        });
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    isKeyPressed(key) {
        // Check for exact match first
        if (this.pressedKeys.has(key)) return true;
        
        // Check case variations
        if (this.pressedKeys.has(key.toLowerCase())) return true;
        if (this.pressedKeys.has(key.toUpperCase())) return true;
        
        // Special handling for common movement keys
        const keyMap = {
            'a': ['a', 'A', 'ArrowLeft'],
            'A': ['a', 'A', 'ArrowLeft'],
            'd': ['d', 'D', 'ArrowRight'],
            'D': ['d', 'D', 'ArrowRight'],
            'w': ['w', 'W', 'ArrowUp'],
            'W': ['w', 'W', 'ArrowUp'],
            's': ['s', 'S', 'ArrowDown'],
            'S': ['s', 'S', 'ArrowDown'],
            'ArrowLeft': ['a', 'A', 'ArrowLeft'],
            'ArrowRight': ['d', 'D', 'ArrowRight'],
            'ArrowUp': ['w', 'W', 'ArrowUp'],
            'ArrowDown': ['s', 'S', 'ArrowDown']
        };
        
        if (keyMap[key]) {
            return keyMap[key].some(variant => this.pressedKeys.has(variant));
        }
        
        return false;
    }

    getKeys() {
        return Array.from(this.pressedKeys);
    }

    clearAllKeys() {
        this.pressedKeys.clear();
    }
    
    // Debug method to see what keys are currently pressed
    debugKeys() {
        console.log('Currently pressed keys:', Array.from(this.pressedKeys));
    }

    isMouseButtonPressed(button) {
        return button === 'left' ? this.mouseState.leftButton : this.mouseState.rightButton;
    }

    getMousePosition() {
        return { x: this.mouseState.x, y: this.mouseState.y };
    }
}

class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.smoothing = 0.1;
    }
    
    follow(target, canvasWidth, canvasHeight) {
        this.targetX = target.x - canvasWidth / 2;
        this.targetY = target.y - canvasHeight / 2;
    }
    
    update() {
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }
}

// --- Projectile class for enemy ice ball ---
class Projectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius || 16;
        this.speed = config.speed || 7;
        this.vx = config.vx;
        this.vy = config.vy;
        this.lifetime = config.lifetime || 120; // frames
        this.age = 0;
        this.active = true;
        this.owner = config.owner || null;
        this.color = config.color || 'rgba(100,200,255,0.8)';
        this.trail = [];
        this.maxTrail = 8;
        this.targetY = config.targetY || this.y; // Store the Y position where it was cast
        this.laneWidth = 20; // Width of the lane for collision detection
    }
    
    update() {
        if (!this.active) return;
        this.trail.push({x: this.x, y: this.y, alpha: 1});
        if (this.trail.length > this.maxTrail) this.trail.shift();
        
        // Calculate new position
        const newX = this.x + this.vx * this.speed;
        const newY = this.targetY;
        
        // Check for wall collision
        if (this.checkWallCollision(newX, newY)) {
            // Hit a wall - deactivate projectile
            this.active = false;
            return;
        }
        
        this.x = newX;
        this.y = newY;
        this.age++;
        if (this.age > this.lifetime) this.active = false;
    }
    render(ctx, camera) {
        if (!this.active) return;
        let drawX = this.x, drawY = this.y;
        if (camera) { drawX -= camera.x; drawY -= camera.y; }
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.save();
            ctx.globalAlpha = t.alpha * (i / this.trail.length) * 0.5;
            ctx.beginPath();
            ctx.arc(t.x - (camera ? camera.x : 0), t.y - (camera ? camera.y : 0), this.radius * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100,200,255,0.3)';
            ctx.shadowColor = '#aef';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }
        // Draw main ball
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
    }
    getBounds() {
        return { x: this.x, y: this.y, r: this.radius };
    }
    
    checkWallCollision(x, y) {
        // Access game manager through window to check for wall collisions
        if (!window.gameManager || !window.gameManager.stageManager) {
            return false;
        }
        
        const boundaries = window.gameManager.stageManager.getStageBoundaries();
        const projectileLeft = x - this.radius;
        const projectileRight = x + this.radius;
        const projectileTop = y - this.radius;
        const projectileBottom = y + this.radius;
        
        for (const boundary of boundaries) {
            // Check collision with solid boundaries that should block projectiles
            if (['wall', 'ice_wall', 'pillar', 'arena_wall', 'ceiling', 'stalactite', 'crystal', 'platform', 'ice_platform', 'lava_platform', 'weak_platform', 'ramp_up', 'ramp_down', 'pit_cover'].includes(boundary.type)) {
                if (projectileRight > boundary.x && 
                    projectileLeft < boundary.x + boundary.width &&
                    projectileBottom > boundary.y && 
                    projectileTop < boundary.y + boundary.height) {
                    return true;
                }
            }
        }
        return false;
    }
}

class GameManager {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Game state
        this.isRunning = false;
        this.isGameOver = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        // Managers
        this.inputManager = new InputManager();
        this.camera = new Camera();
        this.stageManager = null; // Will be set when StageManager is available
        
        // Game objects
        this.characters = [];
        this.enemies = [];  // New array for enemies
        this.enemyConfigs = []; // Store enemy configurations for respawning
        this.player = null;
        this.projectiles = [];
        
        // Configuration
        this.config = {
            showDebug: config.showDebug || false,
            backgroundColor: config.backgroundColor || '#000000',
            ...config
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        
        // Create HP UI elements
        this.createHPUI();
        
        // Create game over UI elements
        this.createGameOverUI();
        
        // Create ability UI elements
        this.createAbilityUI();
        
        // Cheat state
        this.enemiesFrozen = false;
        this.noCooldownMode = false;
        this.lastFreezeKeyDown = false;
        this.lastNoCooldownKeyDown = false;
        
        console.log('GameManager initialized');
    }
    
    addCharacter(character) {
        this.characters.push(character);
        if (!this.player) {
            this.player = character;
        }
        return character;
    }
    
    removeCharacter(character) {
        const index = this.characters.indexOf(character);
        if (index > -1) {
            this.characters.splice(index, 1);
        }
        if (this.player === character) {
            this.player = this.characters[0] || null;
        }
    }
    
    setPlayer(character) {
        this.player = character;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('Game started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Update game state
        this.update();
        
        // Render frame
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    update() {
        // Don't update if game is over
        if (this.isGameOver) return;
        
        // Update camera
        if (this.player) {
            const { width, height } = this.getCanvasSize();
            this.camera.follow(this.player, width, height);
        }
        this.camera.update();

        // Update stage if available
        if (this.stageManager) {
            this.stageManager.update(this.deltaTime);
        }

        // Handle cheat keys - check for both '1' and 'NumPad1'
        const freezeKeyDown = this.inputManager.isKeyPressed('1') || 
                              this.inputManager.isKeyPressed('NumPad1') || 
                              this.inputManager.isKeyPressed('Numpad1');
        if (freezeKeyDown && !this.lastFreezeKeyDown) {
            this.enemiesFrozen = !this.enemiesFrozen;
            console.log('Enemies ' + (this.enemiesFrozen ? 'frozen' : 'unfrozen'));
            // Visual feedback for freeze state
            for (const enemy of this.enemies) {
                if (this.enemiesFrozen) {
                    enemy.freezeEffect = {
                        startTime: Date.now(),
                        duration: 1000,
                        alpha: 0.7
                    };
                } else {
                    enemy.freezeEffect = null;
                }
            }
        }
        this.lastFreezeKeyDown = freezeKeyDown;

        // Handle no cooldown cheat (NUM2)
        const noCooldownKeyDown = this.inputManager.isKeyPressed('2') || this.inputManager.isKeyPressed('NumPad2') || this.inputManager.isKeyPressed('Numpad2');
        if (noCooldownKeyDown && !this.lastNoCooldownKeyDown) {
            this.noCooldownMode = !this.noCooldownMode;
            console.log('No Cooldown Mode: ' + (this.noCooldownMode ? 'ON' : 'OFF'));
        }
        this.lastNoCooldownKeyDown = noCooldownKeyDown;

        // Update all characters
        for (const character of this.characters) {
            if (character instanceof Enemy) {
                // Only update enemy if not frozen
                if (!this.enemiesFrozen) {
                    character.update(this.inputManager, this.player);
                }
            } else {
                // For player character, pass mouse state for attack
                if (character === this.player) {
                    character.update(this.inputManager, {
                        isAttacking: this.inputManager.isMouseButtonPressed('left')
                    });
                } else {
                    character.update(this.inputManager);
                }
            }
        }

        // Check for collisions between player and enemies
        if (this.player) {
            for (const enemy of this.enemies) {
                this.checkPlayerEnemyCollision(this.player, enemy);
            }
        }

        // Update projectiles
        for (const proj of this.projectiles) proj.update();
        this.projectiles = this.projectiles.filter(p => p.active);
        // Handle projectile collisions
        this.handleProjectileCollisions();

        // Update UI
        this.updateUI();

        // Update ability UI
        this.updateAbilityUI();

        // If no cooldown mode, set all ability lastUsed to 0 for player
        if (this.noCooldownMode && this.player && this.player.abilities) {
            for (const key of ['q', 'e', 'r']) {
                if (this.player.abilities[key]) {
                    this.player.abilities[key].lastUsed = 0;
                }
            }
        }

        // Check if player is dead
        if (this.player && this.player.health <= 0) {
            this.showGameOver();
            return;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Don't render game elements if game is over
        if (this.isGameOver) return;
        
        // Render stage background if available
        if (this.stageManager) {
            this.stageManager.render(this.ctx, this.camera);
        } else {
            // Draw background grid as fallback
            this.drawGrid();
        }
        
        // Render all characters
        this.characters.forEach(character => {
            if (character instanceof Enemy && this.enemiesFrozen) {
                // Add freeze overlay for enemies
                this.ctx.save();
                if (character.freezeEffect) {
                    const progress = (Date.now() - character.freezeEffect.startTime) / character.freezeEffect.duration;
                    if (progress < 1) {
                        this.ctx.globalAlpha = character.freezeEffect.alpha * (1 - progress);
                        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
                        const drawX = character.x - (this.camera ? this.camera.x : 0);
                        const drawY = character.y - (this.camera ? this.camera.y : 0);
                        this.ctx.fillRect(
                            drawX - character.width/2,
                            drawY - character.height/2,
                            character.width,
                            character.height
                        );
                    }
                }
                this.ctx.restore();
            }
            character.render(this.ctx, this.camera);
        });
        
        // Render projectiles above background, below characters
        for (const proj of this.projectiles) proj.render(this.ctx, this.camera);
        
        // Draw debug info
        if (this.config.showDebug) {
            this.drawDebugInfo();
        }

        // Render hit effects
        if (this.hitEffects) {
            for (const effect of this.hitEffects) {
                const progress = (Date.now() - effect.startTime) / effect.duration;
                if (progress >= 1) continue;
                
                const radius = effect.maxRadius * progress;
                const alpha = 1 - progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(
                    effect.x - (this.camera ? this.camera.x : 0),
                    effect.y - (this.camera ? this.camera.y : 0),
                    radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.fillStyle = '#ff69b4';
                this.ctx.fill();
                this.ctx.restore();
            }
            
            // Remove expired effects
            this.hitEffects = this.hitEffects.filter(effect => 
                Date.now() - effect.startTime < effect.duration
            );
        }
    }
    
    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offsetX = -this.camera.x % gridSize;
        const offsetY = -this.camera.y % gridSize;
        
        // Vertical lines
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        
        let y = 25;
        this.ctx.fillText(`FPS: ${this.fps}`, 15, y);
        y += 15;
        this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 15, y);
        y += 15;
        
        if (this.player) {
            const state = this.player.getState();
            this.ctx.fillText(`State: ${state.state}`, 15, y);
            y += 15;
            this.ctx.fillText(`Pos: ${Math.round(state.position.x)}, ${Math.round(state.position.y)}`, 15, y);
            y += 15;
            this.ctx.fillText(`Dir: ${state.direction}`, 15, y);
            y += 15;
            this.ctx.fillText(`Frame: ${state.frame}`, 15, y);
        }
        
        this.ctx.restore();
    }
    
    updateUI() {
        // Update status elements if they exist
        const stateElement = document.getElementById('currentState');
        const positionElement = document.getElementById('position');
        const frameElement = document.getElementById('currentFrame');
        
        if (this.player) {
            // Update HP UI
            const hpFill = document.getElementById('playerHPFill');
            const hpText = document.getElementById('playerHPText');
            if (hpFill && hpText) {
                const hpPercent = (this.player.health / this.player.maxHealth) * 100;
                hpFill.style.width = `${hpPercent}%`;
                hpText.textContent = `HP: ${Math.round(this.player.health)}/${this.player.maxHealth}`;
                
                // Update HP bar color based on health percentage
                if (hpPercent > 60) {
                    hpFill.style.background = 'linear-gradient(to right, #00ff00, #44ff44)';
                } else if (hpPercent > 30) {
                    hpFill.style.background = 'linear-gradient(to right, #ffff00, #ffff44)';
                } else {
                    hpFill.style.background = 'linear-gradient(to right, #ff0000, #ff4444)';
                }
            }
            
            // Update other UI elements
            if (stateElement && positionElement && frameElement) {
            const state = this.player.getState();
            stateElement.textContent = state.state;
            positionElement.textContent = `${Math.round(state.position.x)}, ${Math.round(state.position.y)}`;
            frameElement.textContent = state.frame;
            }
        }
    }
    
    // Utility methods
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
    
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    toggleDebug() {
        this.config.showDebug = !this.config.showDebug;
        if (this.stageManager) {
            this.stageManager.toggleDebug();
        }
    }
    
    // Stage management methods
    setStageManager(stageManager) {
        this.stageManager = stageManager;
        console.log('StageManager attached to GameManager');
    }
    
    async loadStage(stageId) {
        if (!this.stageManager) {
            console.error('StageManager not available');
            return false;
        }
        
        const success = await this.stageManager.loadStage(stageId);
        if (success) {
            // Position player at first spawn point
            const spawnPoints = this.stageManager.getSpawnPoints();
            if (this.player && spawnPoints.length > 0) {
                this.player.setPosition(spawnPoints[0].x, spawnPoints[0].y);
            }
        }
        return success;
    }
    
    getCurrentStage() {
        return this.stageManager?.getCurrentStage() || null;
    }
    
    // Event handling for external systems
    addEventListener(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    dispatchEvent(event, data) {
        if (this.eventListeners && this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    addEnemy(enemy) {
        if (!enemy) return null;
        
        try {
        this.enemies.push(enemy);
        this.characters.push(enemy); // Also add to characters for rendering
            
            // Store enemy configuration for respawning
            const config = {
                x: enemy.x || 600,
                y: enemy.y || 746,
                width: enemy.width || 120,
                height: enemy.height || 120,
                speed: enemy.speed || 3,
                runSpeed: enemy.runSpeed || 6,
                health: enemy.maxHealth || 100,
                damage: enemy.damage || 10,
                detectionRange: enemy.detectionRange || 300,
                aggroRange: enemy.aggroRange || 150,
                movementPattern: enemy.movementPattern || 'patrol',
                patrolPoints: enemy.patrolPoints ? [...enemy.patrolPoints] : [
                    { x: 600, y: 746 },
                    { x: 800, y: 746 },
                    { x: 800, y: 718 },
                    { x: 600, y: 718 }
                ],
                spriteSheetPath: enemy.spriteSheet?.src || 'UI/enemy.png'
            };
            
            this.enemyConfigs.push(config);
        return enemy;
        } catch (error) {
            console.error('Error adding enemy:', error);
            return null;
        }
    }

    removeEnemy(enemy) {
        const enemyIndex = this.enemies.indexOf(enemy);
        if (enemyIndex > -1) {
            this.enemies.splice(enemyIndex, 1);
        }
        this.removeCharacter(enemy); // Also remove from characters array
    }

    checkPlayerEnemyCollision(player, enemy) {
        // Simple circle-based collision detection
        const playerRadius = player.width / 3;  // Using 1/3 of width as radius
        const enemyRadius = enemy.width / 3;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only check for damage if player is attacking
        if (player.isAttacking) {
            // Area attack: hit all enemies in the same y-lane and within attack range
            if (Math.abs(player.y - enemy.y) < 30) {
                const range = player.width * 1.2;
                if (Math.abs(player.x - enemy.x) < range) {
                    const isEnemyDead = enemy.takeDamage(player.damage || 10);
                    if (isEnemyDead) {
                        this.removeEnemy(enemy);
                    }
                }
            }
        } else if (!player.isInvincible && enemy.isAttacking) {
            // Only enemy deals damage if they are attacking
            if (distance < playerRadius + enemyRadius) {
                player.takeDamage(enemy.damage);
            }
        }
    }

    addProjectile(proj) {
        this.projectiles.push(proj);
    }

    handleProjectileCollisions() {
        // Player collision
        if (this.player) {
            for (const proj of this.projectiles) {
                if (!proj.active) continue;
                
                // Check if player is in the same lane as the projectile
                const isInLane = Math.abs(this.player.y - proj.targetY) < proj.laneWidth;
                
                if (isInLane) {
                const dx = this.player.x - proj.x;
                const dy = this.player.y - proj.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    // If player is crouching, dodge
                    if (this.player.isCrouching) continue;
                    // If player is jumping, dodge
                    if (this.player.isJumping) continue;
                    // If player is attacking, destroy projectile only if close enough and in facing direction
                    if (this.player.isAttacking) { 
                        const attackRange = this.player.width * 1.2; // Same range as enemy collision
                        const dx = proj.x - this.player.x;
                        const distance = Math.abs(dx);
                        
                        // Check if projectile is in attack range
                        if (distance < attackRange) {
                            // Check if projectile is in the direction player is facing
                            const isInFacingDirection = (this.player.direction === 'right' && dx >= 0) || 
                                                       (this.player.direction === 'left' && dx <= 0);
                            
                            if (isInFacingDirection) {
                                proj.active = false; 
                                continue; 
                            }
                        }
                    }
                    
                    // Otherwise, damage player
                    if (dist < proj.radius + this.player.width/3) {
                    this.player.takeDamage(10);
                        proj.active = false;
                    }
                }
            }
        }

        // Handle dagger collisions with enemies
        for (const proj of this.projectiles) {
            if (!proj.active || !(proj instanceof DaggerProjectile)) continue;
            
            for (const enemy of this.enemies) {
                const bounds = proj.getBounds();
                const dx = enemy.x - bounds.x;
                const dy = enemy.y - bounds.y;
                
                // Check if enemy is within dagger's hitbox
                if (Math.abs(dx) <= bounds.radius && Math.abs(dy) <= bounds.height) {
                    // Apply damage
                    const isEnemyDead = enemy.takeDamage(proj.damage);
                    
                    // Create hit effect
                    this.createHitEffect(enemy.x, enemy.y);
                    
                    // Notify projectile of hit
                    proj.hitEnemy(enemy);
                    
                    // Remove enemy if dead
                    if (isEnemyDead) {
                        this.removeEnemy(enemy);
                    }
                    break;
                }
            }
        }
    }

    createHPUI() {
        // Create HP bar container if it doesn't exist
        if (!document.getElementById('playerHPContainer')) {
            const container = document.createElement('div');
            container.id = 'playerHPContainer';
            container.style.cssText = `
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 10px;
                border-radius: 5px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            `;
            
            // Create HP bar
            const hpBar = document.createElement('div');
            hpBar.id = 'playerHPBar';
            hpBar.style.cssText = `
                width: 200px;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #fff;
                border-radius: 10px;
                overflow: hidden;
            `;
            
            // Create HP fill
            const hpFill = document.createElement('div');
            hpFill.id = 'playerHPFill';
            hpFill.style.cssText = `
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, #ff0000, #ff4444);
                transition: width 0.3s ease;
            `;
            
            // Create HP text
            const hpText = document.createElement('div');
            hpText.id = 'playerHPText';
            hpText.style.cssText = `
                color: #fff;
                font-family: Arial, sans-serif;
                font-size: 14px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            `;
            
            // Assemble UI
            hpBar.appendChild(hpFill);
            container.appendChild(hpBar);
            container.appendChild(hpText);
            document.getElementById('gameContainer').appendChild(container);
        }
    }

    createGameOverUI() {
        // Create game over container if it doesn't exist
        if (!document.getElementById('gameOverContainer')) {
            const container = document.createElement('div');
            container.id = 'gameOverContainer';
            container.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 0, 0, 0.3);
                display: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                transition: background-color 0.5s ease;
            `;
            
            // Create game over text
            const gameOverText = document.createElement('div');
            gameOverText.id = 'gameOverText';
            gameOverText.style.cssText = `
                color: #fff;
                font-family: Arial, sans-serif;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                margin-bottom: 20px;
            `;
            gameOverText.textContent = 'GAME OVER';
            
            // Create retry button
            const retryButton = document.createElement('button');
            retryButton.id = 'retryButton';
            retryButton.style.cssText = `
                padding: 15px 30px;
                font-size: 24px;
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            `;
            retryButton.textContent = 'Retry';
            retryButton.onmouseover = () => retryButton.style.background = '#ff6666';
            retryButton.onmouseout = () => retryButton.style.background = '#ff4444';
            retryButton.onclick = () => this.restartGame();
            
            // Assemble UI
            container.appendChild(gameOverText);
            container.appendChild(retryButton);
            document.getElementById('gameContainer').appendChild(container);
        }
    }
    
    showGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        
        const container = document.getElementById('gameOverContainer');
        if (container) {
            container.style.display = 'flex';
            // Animate the red overlay
            setTimeout(() => {
                container.style.background = 'rgba(255, 0, 0, 0.5)';
            }, 100);
        }
    }
    
    async restartGame() {
        try {
            // Reset game state
            this.isGameOver = false;
            
            // Hide game over screen
            const container = document.getElementById('gameOverContainer');
            if (container) {
                container.style.display = 'none';
                container.style.background = 'rgba(255, 0, 0, 0.3)';
            }
            
            // Reset player
            if (this.player) {
                this.player.health = this.player.maxHealth;
                this.player.state = 'idle';
                this.player.isInvincible = false;
                this.player.invincibilityFrames = 0;
            }
            
            // Clear enemies and projectiles
            this.enemies = [];
            this.projectiles = [];
            this.characters = this.characters.filter(char => char === this.player);
            
            // Reload current stage to respawn enemies
            if (this.stageManager) {
                const currentStage = this.stageManager.getCurrentStage();
                if (currentStage) {
                    await this.loadStage(currentStage.id);
                    
                    // Recreate enemies from stored configurations
                    const configs = [...this.enemyConfigs]; // Create a copy of configs
                    this.enemyConfigs = []; // Clear configs before recreating
                    
                    for (const config of configs) {
                        try {
                            const enemy = new Enemy(config);
                            this.addEnemy(enemy);
                        } catch (error) {
                            console.error('Error recreating enemy:', error);
                        }
                    }
                }
            }
            
            // Restart game loop
            this.start();
        } catch (error) {
            console.error('Error in restartGame:', error);
            // Try to recover by at least restarting the game loop
            this.start();
        }
    }

    createAbilityUI() {
        // Create ability container
        const abilityContainer = document.createElement('div');
        abilityContainer.id = 'abilityContainer';
        abilityContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;
        
        // Create Q ability icon
        const qAbility = document.createElement('div');
        qAbility.id = 'qAbility';
        qAbility.style.cssText = `
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #ff69b4;
            border-radius: 8px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            cursor: pointer;
            user-select: none;
        `;
        qAbility.textContent = 'Q';
        
        // Create E ability icon
        const eAbility = document.createElement('div');
        eAbility.id = 'eAbility';
        eAbility.style.cssText = qAbility.style.cssText; // Reuse Q ability styles
        eAbility.textContent = 'E';
        
        // Create R ability icon
        const rAbility = document.createElement('div');
        rAbility.id = 'rAbility';
        rAbility.style.cssText = qAbility.style.cssText;
        rAbility.textContent = 'R';
        
        // Add cooldown overlays
        const qCooldown = document.createElement('div');
        qCooldown.id = 'qCooldown';
        qCooldown.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 6px;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
        `;
        
        const eCooldown = document.createElement('div');
        eCooldown.id = 'eCooldown';
        eCooldown.style.cssText = qCooldown.style.cssText; // Reuse Q cooldown styles
        
        const rCooldown = document.createElement('div');
        rCooldown.id = 'rCooldown';
        rCooldown.style.cssText = qCooldown.style.cssText;
        
        qAbility.appendChild(qCooldown);
        eAbility.appendChild(eCooldown);
        rAbility.appendChild(rCooldown);
        
        abilityContainer.appendChild(qAbility);
        abilityContainer.appendChild(eAbility);
        abilityContainer.appendChild(rAbility);
        
        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(abilityContainer);
        }
        
        // Wire up ability containers for cooldown UI
        if (this.player && this.player.abilities) {
            if (this.player.abilities.q && this.player.abilities.q.setAbilityContainer) {
                this.player.abilities.q.setAbilityContainer(qAbility);
            }
            if (this.player.abilities.e && this.player.abilities.e.setAbilityContainer) {
                this.player.abilities.e.setAbilityContainer(eAbility);
            }
            if (this.player.abilities.r && this.player.abilities.r.setAbilityContainer) {
                this.player.abilities.r.setAbilityContainer(rAbility);
            }
        }
    }
    
    updateAbilityUI() {
        if (!this.player || !this.player.abilities) return;
        
        const qAbility = document.getElementById('qAbility');
        const qCooldown = document.getElementById('qCooldown');
        const eAbility = document.getElementById('eAbility');
        const eCooldown = document.getElementById('eCooldown');
        const rAbility = document.getElementById('rAbility');
        const rCooldown = document.getElementById('rCooldown');
        
        // Update Q ability
        if (qAbility && qCooldown) {
            const ability = this.player.abilities.q;
            const timeLeft = ability.cooldown - (Date.now() - ability.lastUsed);
            
            if (timeLeft > 0) {
                qCooldown.style.display = 'flex';
                qCooldown.textContent = Math.ceil(timeLeft / 1000);
                qAbility.style.opacity = '0.5';
            } else {
                qCooldown.style.display = 'none';
                qAbility.style.opacity = '1';
            }
        }
        
        // Update E ability
        if (eAbility && eCooldown) {
            const ability = this.player.abilities.e;
            const timeLeft = ability.cooldown - (Date.now() - ability.lastUsed);
            
            if (timeLeft > 0) {
                eCooldown.style.display = 'flex';
                eCooldown.textContent = Math.ceil(timeLeft / 1000);
                eAbility.style.opacity = '0.5';
            } else {
                eCooldown.style.display = 'none';
                eAbility.style.opacity = '1';
            }
        }
        
        // Update R ability
        if (rAbility && rCooldown) {
            const ability = this.player.abilities.r;
            const timeLeft = ability.cooldown - (Date.now() - ability.lastUsed);
            
            if (timeLeft > 0) {
                rCooldown.style.display = 'flex';
                rCooldown.textContent = Math.ceil(timeLeft / 1000);
                rAbility.style.opacity = '0.5';
            } else {
                rCooldown.style.display = 'none';
                rAbility.style.opacity = '1';
            }
        }
    }
    
    createHitEffect(x, y) {
        // Create a visual effect at the hit location
        const effect = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 30,
            alpha: 1,
            startTime: Date.now(),
            duration: 300
        };
        
        this.hitEffects = this.hitEffects || [];
        this.hitEffects.push(effect);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameManager, InputManager, Camera };
} 