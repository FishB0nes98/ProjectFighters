// Raid Boss System
const PLAYER_SPEED = 4;
const PLAYER_SIZE = {
    width: 60,
    height: 80
};

// Available characters for raid (filtered to specific characters)
const availableCharacters = [
    'Lili.png',
    'Julia.png',
    'Mai.png',
    'Shinnok.png'
];

// Boss data
const bosses = {
    stage1: {
        name: 'Zasalamel',
        skin: 'Zasalamel.png',
        health: 5000,
        sizeMultiplier: 5.0, // Changed from 7.0 to 5.0
        movementSpeed: 1.5,
        abilities: {
            r: {
                name: 'Soul Aura',
                alwaysActive: true,
                damage: 20, // Reduced from 30
                range: 220, // Reduced from 250
                tickInterval: 800 // Increased from 500 (less frequent damage)
            },
            s: {
                name: 'Scythe Slash',
                damage: 75,
                range: 400,
                cooldown: 15000, // Increased from 10000 to 15000 (15 seconds)
                lastUsedTime: 0,
                slashAngle: Math.PI, // 180 degrees
                slashDuration: 2000, // 2 seconds for full slash
                warningDuration: 1200, // 1.2 seconds warning before slash happens
                isActive: false,
                startTime: 0,
                startAngle: 0,
                dodgeWindow: 800, // 0.8 second window to dodge by moving away
                hitboxSize: 30 // Reduced hitbox size from 50 to 30
            },
            p: {
                name: 'Spinning Scythe',
                damage: 50,
                range: 100,
                cooldown: 20000, // 20 seconds
                lastUsedTime: 0,
                duration: 10000, // 10 seconds duration
                isActive: false,
                startTime: 0,
                scythes: [] // Will hold spinning scythe objects
            },
            t: {
                name: 'Time Explosion',
                damage: 40,
                range: 250,
                cooldown: 25000, // 25 seconds
                lastUsedTime: 0,
                castTime: 2000, // 2 seconds cast time
                freezeDuration: 4000, // 4 seconds freeze duration
                isActive: false,
                startTime: 0,
                position: {x: 0, y: 0}
            }
        },
        // Boss AI behaviors
        behaviors: {
            idle: {
                duration: [2000, 5000], // Random duration between 2-5 seconds
                weight: 1
            },
            pursue: {
                duration: [4000, 7000], // Random duration between 4-7 seconds
                weight: 3
            },
            retreat: {
                duration: [3000, 5000], // Random duration between 3-5 seconds
                weight: 1
            },
            flank: {
                duration: [3000, 6000], // Random duration between 3-6 seconds
                weight: 2
            }
        }
    }
};

// Game state
let gameState = {
    isActive: false,
    players: [],
    boss: null,
    selectedCharacters: [],
    canvas: null,
    ctx: null,
    keys: {
        w: false,
        s: false,
        a: false,
        d: false,
        q: false,
        r: false,
        '1': false,
        '2': false,
        '3': false,
        '4': false
    },
    lastTime: 0,
    renderer: null
};

// Initialize the raid boss game
function initializeRaidBossGame() {
    // Get canvas and context
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize renderer
    gameState.renderer = new RaidRenderer(gameState.canvas, gameState.ctx);
    
    // Set up event listeners
    document.getElementById('startRaidBtn').addEventListener('click', showCharacterSelect);
    document.getElementById('startRaidButton').addEventListener('click', startRaid);
    
    // Set up keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Create character selection UI
    createCharacterSelectUI();
}

// Resize canvas to fit window
function resizeCanvas() {
    gameState.canvas.width = window.innerWidth;
    gameState.canvas.height = window.innerHeight;
}

// Show character selection UI
function showCharacterSelect() {
    document.getElementById('lobbyUI').style.display = 'none';
    document.getElementById('characterSelect').style.display = 'block';
    
    // Create team slots
    const selectedTeam = document.getElementById('selectedTeam');
    selectedTeam.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'team-slot';
        slot.dataset.index = i;
        selectedTeam.appendChild(slot);
    }
    
    // Reset selected characters
    gameState.selectedCharacters = [];
    updateStartButton();
}

// Create character selection UI
function createCharacterSelectUI() {
    const characterOptions = document.getElementById('characterOptions');
    characterOptions.innerHTML = '';
    
    availableCharacters.forEach(char => {
        const option = document.createElement('div');
        option.className = 'character-option';
        
        const img = document.createElement('img');
        img.src = `../Loading Screen/${char}`;
        img.alt = char.replace('.png', '');
        
        option.appendChild(img);
        option.addEventListener('click', () => selectCharacter(char));
        
        characterOptions.appendChild(option);
    });
}

// Select a character for the team
function selectCharacter(char) {
    // Check if character is already selected
    const charIndex = gameState.selectedCharacters.indexOf(char);
    
    if (charIndex !== -1) {
        // If already selected, remove from team
        gameState.selectedCharacters.splice(charIndex, 1);
        
        // Update team UI
        updateTeamUI();
    } else if (gameState.selectedCharacters.length < 4) {
        // Add to team if not full
        gameState.selectedCharacters.push(char);
        
        // Update team UI
        updateTeamUI();
    }
    
    updateStartButton();
}

// Update team UI with selected characters
function updateTeamUI() {
    const slots = document.querySelectorAll('.team-slot');
    
    // Clear all slots
    slots.forEach(slot => {
        slot.innerHTML = '';
    });
    
    // Fill slots with selected characters
    gameState.selectedCharacters.forEach((char, index) => {
        if (index < slots.length) {
            const img = document.createElement('img');
            img.src = `../Loading Screen/${char}`;
            img.alt = char.replace('.png', '');
            
            slots[index].appendChild(img);
        }
    });
}

// Update start button state
function updateStartButton() {
    const startButton = document.getElementById('startRaidButton');
    startButton.disabled = gameState.selectedCharacters.length === 0;
}

// Start the raid battle
function startRaid() {
    // Hide character select UI
    document.getElementById('characterSelect').style.display = 'none';
    
    // Show game UI
    document.getElementById('gameUI').style.display = 'block';
    
    // Create players
    createPlayers();
    
    // Create boss
    createBoss();
    
    // Create UI elements
    createPlayerHealthBars();
    createBossHealthBar();
    createAbilityBar();
    
    // Start game loop
    gameState.isActive = true;
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Create player objects
function createPlayers() {
    gameState.players = [];
    
    gameState.selectedCharacters.forEach((char, index) => {
        // Position players in a semi-circle facing the boss
        const angle = Math.PI / 2 - (Math.PI / 4) * index;
        const distance = 500; // Distance from center
        
        const player = new RaidPlayer({
            id: `player${index}`,
            x: gameState.canvas.width / 2 + Math.cos(angle) * distance,
            y: gameState.canvas.height / 2 + Math.sin(angle) * distance,
            skin: char,
            health: 200,
            isPlayer: true,
            index: index
        });
        
        gameState.players.push(player);
    });
}

// Create boss object
function createBoss() {
    const stage1Boss = bosses.stage1;
    
    gameState.boss = {
        id: 'boss',
        name: stage1Boss.name,
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
        skin: stage1Boss.skin,
        health: stage1Boss.health,
        maxHealth: stage1Boss.health,
        sizeMultiplier: stage1Boss.sizeMultiplier,
        movementSpeed: stage1Boss.movementSpeed,
        velocity: { x: 0, y: 0 },
        abilities: stage1Boss.abilities,
        lastSoulAuraTime: 0,
        hitEffects: [],
        timeWarpEffects: [], // New effect for time theme
        
        // AI state
        currentBehavior: null,
        behaviorStartTime: 0,
        behaviorEndTime: 0,
        targetPlayer: null,
        targetPosition: { x: 0, y: 0 },
        movementAngle: 0,
        
        loadImage() {
            this.image = new Image();
            this.image.src = `../Loading Screen/${this.skin}`;
        },
        
        update(deltaTime) {
            // Handle Soul Aura if it's always active
            if (this.abilities.r.alwaysActive) {
                const now = performance.now();
                if (now - this.lastSoulAuraTime > this.abilities.r.tickInterval) {
                    this.lastSoulAuraTime = now;
                    this.useSoulAura();
                }
            }
            
            // Update time warp effects
            this.updateTimeWarpEffects();
            
            // Update boss movement and AI
            this.updateAI(deltaTime);
            
            // Use abilities based on cooldowns and situation
            this.useAbilities();
            
            // Apply velocity to position
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Constrain boss to arena boundaries
            this.constrainToBoundaries();
        },
        
        constrainToBoundaries() {
            // Keep boss within arena - assuming circular arena
            const centerX = gameState.canvas.width / 2;
            const centerY = gameState.canvas.height / 2;
            const arenaRadius = 850; // Slightly less than the visual arena radius
            
            // Calculate distance from center
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If boss is outside arena, move back inside
            if (distance > arenaRadius) {
                const angle = Math.atan2(dy, dx);
                this.x = centerX + Math.cos(angle) * arenaRadius;
                this.y = centerY + Math.sin(angle) * arenaRadius;
            }
        },
        
        updateAI(deltaTime) {
            const now = performance.now();
            
            // Choose new behavior if current one has ended
            if (!this.currentBehavior || now > this.behaviorEndTime) {
                this.chooseBehavior();
            }
            
            // Execute current behavior
            if (this.currentBehavior) {
                this.executeBehavior(deltaTime);
            }
        },
        
        chooseBehavior() {
            const behaviors = bosses.stage1.behaviors;
            const now = performance.now();
            
            // Calculate total weights
            let totalWeight = 0;
            for (const key in behaviors) {
                totalWeight += behaviors[key].weight;
            }
            
            // Random weighted selection
            let random = Math.random() * totalWeight;
            let selectedBehavior = null;
            
            for (const key in behaviors) {
                random -= behaviors[key].weight;
                if (random <= 0) {
                    selectedBehavior = key;
                    break;
                }
            }
            
            // Set new behavior
            this.currentBehavior = selectedBehavior;
            this.behaviorStartTime = now;
            
            // Calculate random duration within range
            const durationRange = behaviors[selectedBehavior].duration;
            const duration = durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]);
            this.behaviorEndTime = now + duration;
            
            // Setup behavior-specific variables
            switch (selectedBehavior) {
                case 'pursue':
                    this.chooseTargetPlayer();
                    break;
                case 'retreat':
                    this.chooseRetreatPosition();
                    break;
                case 'flank':
                    this.chooseFlanKPosition();
                    break;
                case 'idle':
                default:
                    // For idle, we'll just slow down
                    this.velocity = { x: 0, y: 0 };
                    break;
            }
            
            // Create time distortion at new target location
            if (this.targetPosition) {
                gameState.renderer.addTimeDistortion(this.targetPosition.x, this.targetPosition.y);
            }
        },
        
        chooseTargetPlayer() {
            // Find a random player that's alive
            const alivePlayers = gameState.players.filter(player => player.health > 0);
            
            if (alivePlayers.length === 0) return null;
            
            // Pick a random player
            const randomIndex = Math.floor(Math.random() * alivePlayers.length);
            return alivePlayers[randomIndex];
        },
        
        chooseRetreatPosition() {
            // Find closest player
            let closestPlayer = null;
            let closestDistance = Infinity;
            
            gameState.players.forEach(player => {
                if (player.health <= 0) return;
                
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPlayer = player;
                }
            });
            
            if (closestPlayer) {
                // Calculate retreat direction (away from closest player)
                const dx = this.x - closestPlayer.x;
                const dy = this.y - closestPlayer.y;
                const angle = Math.atan2(dy, dx);
                
                // Calculate retreat position (move away from player towards edge of arena)
                const retreatDistance = 300;
                this.targetPosition = {
                    x: this.x + Math.cos(angle) * retreatDistance,
                    y: this.y + Math.sin(angle) * retreatDistance
                };
                
                // Ensure target is within arena bounds
                const centerX = gameState.canvas.width / 2;
                const centerY = gameState.canvas.height / 2;
                const toTarget = {
                    x: this.targetPosition.x - centerX,
                    y: this.targetPosition.y - centerY
                };
                const distanceToCenter = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);
                const arenaRadius = 850;
                
                if (distanceToCenter > arenaRadius) {
                    const scaleFactor = arenaRadius / distanceToCenter;
                    this.targetPosition = {
                        x: centerX + toTarget.x * scaleFactor,
                        y: centerY + toTarget.y * scaleFactor
                    };
                }
            } else {
                // If no players, move to random position within arena
                const centerX = gameState.canvas.width / 2;
                const centerY = gameState.canvas.height / 2;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 500;
                
                this.targetPosition = {
                    x: centerX + Math.cos(angle) * distance,
                    y: centerY + Math.sin(angle) * distance
                };
            }
        },
        
        chooseFlanKPosition() {
            // Find living players
            const livingPlayers = gameState.players.filter(player => player.health > 0);
            
            if (livingPlayers.length > 0) {
                // Choose random player to flank
                const targetPlayer = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
                
                // Calculate angle to player
                const dx = targetPlayer.x - this.x;
                const dy = targetPlayer.y - this.y;
                const angleToPlayer = Math.atan2(dy, dx);
                
                // Calculate flank angle (perpendicular to player)
                const flankAngle = angleToPlayer + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
                
                // Calculate flank position
                const flankDistance = 200 + Math.random() * 200;
                this.targetPosition = {
                    x: targetPlayer.x + Math.cos(flankAngle) * flankDistance,
                    y: targetPlayer.y + Math.sin(flankAngle) * flankDistance
                };
                
                // Store target for ability usage
                this.targetPlayer = targetPlayer;
            } else {
                // If no living players, default to center
                this.targetPosition = { 
                    x: gameState.canvas.width / 2, 
                    y: gameState.canvas.height / 2 
                };
            }
        },
        
        executeBehavior(deltaTime) {
            switch (this.currentBehavior) {
                case 'pursue':
                    // If we have a target player, update target position to follow them
                    if (this.targetPlayer && this.targetPlayer.health > 0) {
                        this.targetPosition = { x: this.targetPlayer.x, y: this.targetPlayer.y };
                    }
                    this.moveTowardsTarget(this.movementSpeed);
                    break;
                
                case 'retreat':
                    this.moveTowardsTarget(this.movementSpeed * 0.8);
                    break;
                
                case 'flank':
                    this.moveTowardsTarget(this.movementSpeed * 1.2);
                    break;
                
                case 'idle':
                default:
                    // Apply friction to slow down
                    this.velocity.x *= 0.95;
                    this.velocity.y *= 0.95;
                    
                    // If almost stopped, just stop
                    if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
                        this.velocity.x = 0;
                        this.velocity.y = 0;
                    }
                    break;
            }
        },
        
        moveTowardsTarget(speed) {
            if (!this.targetPosition) return;
            
            // Calculate direction to target
            const dx = this.targetPosition.x - this.x;
            const dy = this.targetPosition.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If we're already at the target, stop moving
            if (distance < 10) {
                this.velocity.x = 0;
                this.velocity.y = 0;
                return;
            }
            
            // Calculate normalized direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Set velocity based on direction and speed
            this.velocity.x = dirX * speed;
            this.velocity.y = dirY * speed;
            
            // Update movement angle for visual effects
            this.movementAngle = Math.atan2(dirY, dirX);
        },
        
        useAbilities() {
            const now = performance.now();
            
            // Use Soul Aura if active
            if (this.abilities.r.alwaysActive) {
                this.useSoulAura();
            }
            
            // Use Scythe Slash if off cooldown
            if (now - this.abilities.s.lastUsedTime > this.abilities.s.cooldown && !this.abilities.s.isActive) {
                this.useScytheSlash();
                this.abilities.s.lastUsedTime = now;
            }
            
            // Update Scythe Slash if active
            if (this.abilities.s.isActive) {
                this.updateScytheSlash(now);
            }
            
            // Use Spinning Scythe if off cooldown
            if (now - this.abilities.p.lastUsedTime > this.abilities.p.cooldown && !this.abilities.p.isActive) {
                this.useSpinningScythe();
                this.abilities.p.lastUsedTime = now;
            }
            
            // Update Spinning Scythe if active
            if (this.abilities.p.isActive) {
                this.updateSpinningScythe(now);
            }
            
            // Use Time Explosion if off cooldown
            if (now - this.abilities.t.lastUsedTime > this.abilities.t.cooldown && !this.abilities.t.isActive) {
                this.useTimeExplosion();
                this.abilities.t.lastUsedTime = now;
            }
            
            // Update Time Explosion if active
            if (this.abilities.t.isActive) {
                this.updateTimeExplosion(now);
            }
        },
        
        draw(ctx, renderer) {
            if (this.image && this.image.complete) {
                // Simple fade effect instead of time distortion
                const now = performance.now();
                
                // Draw simple shadow copies instead of time echo
                const shadowCopies = 2; // Reduced from 3
                for (let i = 0; i < shadowCopies; i++) {
                    const alpha = 0.15 - (i * 0.05);
                    ctx.globalAlpha = alpha;
                    
                    // Draw boss with size multiplier
                    const width = PLAYER_SIZE.width * this.sizeMultiplier;
                    const height = PLAYER_SIZE.height * this.sizeMultiplier;
                    
                    // Center the boss, slight offset
                    const x = this.x - width / 2 - 5 + (i * 10);
                    const y = this.y - height / 2;
                    
                    ctx.drawImage(this.image, x, y, width, height);
                }
                
                // Reset alpha
                ctx.globalAlpha = 1.0;
                
                // Draw the main boss image
                const width = PLAYER_SIZE.width * this.sizeMultiplier;
                const height = PLAYER_SIZE.height * this.sizeMultiplier;
                const x = this.x - width / 2;
                const y = this.y - height / 2;
                
                ctx.drawImage(this.image, x, y, width, height);
                
                // Draw Soul Aura if active
                if (this.abilities.r.alwaysActive) {
                    this.drawSoulAura(ctx, renderer);
                }
                
                // Draw hit effects
                this.drawHitEffects(ctx, renderer);
                
                // Draw boss name
                this.drawBossName(ctx);
            }
        },
        
        drawSoulAura(ctx, renderer) {
            const now = performance.now();
            
            // Draw aura circle around boss
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.abilities.r.range, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.abilities.r.range * 0.5,
                this.x, this.y, this.abilities.r.range
            );
            gradient.addColorStop(0, 'rgba(80, 0, 0, 0.1)');
            gradient.addColorStop(0.7, 'rgba(120, 0, 0, 0.15)');
            gradient.addColorStop(1, 'rgba(180, 0, 0, 0.01)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw aura border with simpler effect (no time themes)
            const segments = 16; // Reduced from 24
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.abilities.r.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 0, 0, 0.3)';
            ctx.stroke();
            
            // Draw simple particles
            for (let i = 0; i < 12; i++) { // Reduced from 18
                const angle = (Math.PI * 2 * i) / 12 + now / 1000;
                const dist = this.abilities.r.range * 0.9;
                
                const x = this.x + Math.cos(angle) * dist;
                const y = this.y + Math.sin(angle) * dist;
                
                // Simple energy particle
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 50, 0, 0.7)';
                ctx.fill();
            }
        },
        
        drawHitEffects(ctx, renderer) {
            // Draw hit effects
            this.hitEffects = this.hitEffects.filter(effect => {
                const elapsed = performance.now() - effect.startTime;
                if (elapsed > effect.duration) return false;
                
                const alpha = 1 - elapsed / effect.duration;
                const size = 20 + elapsed / 25;
                
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 50, 255, ${alpha})`;
                ctx.fill();
                
                return true;
            });
        },
        
        drawBossName(ctx) {
            const nameY = this.y - (this.sizeMultiplier * PLAYER_SIZE.height / 2) - 20;
            
            // Draw shadow for the name
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(this.name, this.x + 2, nameY + 2);
            
            // Draw the name
            ctx.fillStyle = 'white';
            ctx.fillText(this.name, this.x, nameY);
            
            // Draw a simple subtitle
            ctx.font = 'italic 16px Arial';
            ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
            ctx.fillText('Scythe Master', this.x, nameY + 20);
        },
        
        useSoulAura() {
            // Apply damage to players within range
            gameState.players.forEach(player => {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.abilities.r.range) {
                    // Only 40% chance to apply damage (hit less frequently)
                    if (Math.random() < 0.4) {
                        // Apply damage to player
                        player.takeDamage(this.abilities.r.damage);
                        
                        // Create hit effect
                        this.createHitEffect(player);
                    }
                }
            });
        },
        
        createHitEffect(player) {
            this.hitEffects.push({
                x: player.x,
                y: player.y,
                startTime: performance.now(),
                duration: 500
            });
        },
        
        updateTimeWarpEffects() {
            const now = performance.now();
            
            // Filter out expired effects
            this.timeWarpEffects = this.timeWarpEffects.filter(effect => {
                return now - effect.startTime < effect.duration;
            });
        },
        
        createTimeWarpEffect(x, y) {
            // We'll keep this method for compatibility but make it simpler
            this.createHitEffect({x: x, y: y});
        },
        
        useScytheSlash() {
            // Initialize the Scythe Slash
            const ability = this.abilities.s;
            ability.isActive = true;
            ability.startTime = performance.now();
            
            // Choose a random starting angle
            ability.startAngle = Math.random() * Math.PI * 2;
            
            // Create a warning effect to telegraph the attack
            this.createSlashWarningEffect(ability.startAngle, ability.slashAngle);
        },
        
        updateScytheSlash(now) {
            const ability = this.abilities.s;
            const elapsed = now - ability.startTime;
            
            // During warning phase, just show the warning effect
            if (elapsed < ability.warningDuration) {
                return;
            }
            
            // Calculate slash progress
            const slashProgress = (elapsed - ability.warningDuration) / (ability.slashDuration - ability.warningDuration);
            
            if (slashProgress >= 1) {
                // Slash complete
                ability.isActive = false;
                return;
            }
            
            // Calculate current slash angle
            const currentAngle = ability.startAngle + (ability.slashAngle * slashProgress);
            
            // Calculate points on the slash arc
            const checkPoints = 5; // Number of points to check for collisions
            const slashRange = ability.range;
            
            for (let i = 0; i < checkPoints; i++) {
                // Calculate point along current arc
                const pointAngle = currentAngle - (i / (checkPoints - 1)) * 0.2; // Small angle to check the current slice of the arc
                const pointX = this.x + Math.cos(pointAngle) * slashRange;
                const pointY = this.y + Math.sin(pointAngle) * slashRange;
                
                // Create visual slash effect at this point
                this.createSlashEffect(pointX, pointY, pointAngle);
                
                // Check for collisions with players
                this.checkScytheSlashCollisions(pointX, pointY);
            }
        },
        
        createSlashWarningEffect(startAngle, slashAngle) {
            // Create a visual warning effect for the upcoming slash
            const warningRange = this.abilities.s.range;
            const segments = 12; // Reduced from 20
            
            for (let i = 0; i < segments; i++) {
                const angle = startAngle - (i / segments) * slashAngle;
                const x = this.x + Math.cos(angle) * warningRange;
                const y = this.y + Math.sin(angle) * warningRange;
                
                // Create warning marker - use simple red circle instead of time distortion
                if (gameState.renderer && gameState.ctx) {
                    const ctx = gameState.ctx;
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                    ctx.fill();
                }
            }
        },
        
        checkScytheSlashCollisions(pointX, pointY) {
            const ability = this.abilities.s;
            const now = performance.now();
            const elapsed = now - ability.startTime;
            
            // Only check collisions after warning duration
            if (elapsed < ability.warningDuration) {
                return;
            }
            
            // Check each player for collision
            gameState.players.forEach(player => {
                if (player.health <= 0) return; // Skip dead players
                
                // Calculate distance from slash point to player
                const dx = player.x - pointX;
                const dy = player.y - pointY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Player hit detection radius (smaller hitbox)
                const hitRadius = ability.hitboxSize;
                
                if (distance < hitRadius) {
                    // Calculate time since warning started to determine if player can dodge
                    const timeSinceWarning = elapsed - ability.warningDuration;
                    
                    // Make dodging easier
                    if (timeSinceWarning <= ability.dodgeWindow) {
                        // Player is moving away from the boss (dodging)
                        const playerMovingAngle = Math.atan2(player.velocity.y, player.velocity.x);
                        const bossToPlayerAngle = Math.atan2(player.y - this.y, player.x - this.x);
                        const angleDiff = Math.abs(playerMovingAngle - bossToPlayerAngle);
                        
                        // If player is moving at all with even minimal speed, they can dodge
                        const playerSpeed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.y * player.velocity.y);
                        if (playerSpeed > 0.5) {
                            // Successfully dodged!
                            return;
                        }
                    }
                    
                    // Player is hit - but only 25% chance of actually dealing damage
                    if (Math.random() < 0.25) {
                        player.takeDamage(ability.damage);
                        this.createHitEffect(player);
                    }
                }
            });
        },
        
        createSlashEffect(x, y, angle) {
            // Create an arc effect for Scythe Slash
            if (gameState.renderer) {
                gameState.renderer.addArcSlashEffect(
                    this.x,
                    this.y,
                    this.abilities.s.range,
                    angle,
                    50,
                    'rgba(200, 0, 0, 0.8)'
                );
            }
        },
        
        // Add new methods for Spinning Scythe
        useSpinningScythe() {
            // Initialize the Spinning Scythe ability
            const ability = this.abilities.p;
            ability.isActive = true;
            ability.startTime = performance.now();
            ability.scythes = [];
            
            // Create 3 scythes in random locations
            for (let i = 0; i < 3; i++) {
                // Find random position within arena for scythe
                const centerX = gameState.canvas.width / 2;
                const centerY = gameState.canvas.height / 2;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 700; // Random distance from center
                
                const scytheX = centerX + Math.cos(angle) * distance;
                const scytheY = centerY + Math.sin(angle) * distance;
                
                // Create scythe object
                ability.scythes.push({
                    x: scytheX,
                    y: scytheY,
                    angle: Math.random() * Math.PI * 2, // Random starting angle
                    spinRate: 0.03 + Math.random() * 0.03, // Rotation speed
                    spinRadius: 70 + Math.random() * 50, // Radius of spin
                    rotationOffset: Math.random() * Math.PI * 2, // Random offset
                    lastDamageTime: 0 // To track damage frequency
                });
            }
        },
        
        updateSpinningScythe(now) {
            const ability = this.abilities.p;
            const elapsed = now - ability.startTime;
            
            // Check if ability duration has ended
            if (elapsed >= ability.duration) {
                ability.isActive = false;
                ability.scythes = [];
                return;
            }
            
            // Update each scythe
            ability.scythes.forEach(scythe => {
                // Update scythe position in a spinning pattern
                scythe.rotationOffset += scythe.spinRate;
                
                const newX = scythe.x + Math.cos(scythe.rotationOffset) * scythe.spinRadius;
                const newY = scythe.y + Math.sin(scythe.rotationOffset) * scythe.spinRadius;
                
                // Check for player collisions
                this.checkSpinningScytheCollisions(scythe, newX, newY, now);
                
                // Draw the spinning scythe effect
                this.drawSpinningScytheEffect(scythe.x, scythe.y, newX, newY);
            });
        },
        
        checkSpinningScytheCollisions(scythe, newX, newY, now) {
            const ability = this.abilities.p;
            
            // Check less frequently to reduce hit rate
            if (now - scythe.lastDamageTime < 500) return; // Check only every 500ms
            
            // Check for collisions with players
            gameState.players.forEach(player => {
                if (player.health <= 0) return; // Skip dead players
                
                // Calculate distance from scythe to player
                const dx = player.x - newX;
                const dy = player.y - newY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If player is hit
                if (distance < 40) { // Smaller hit radius
                    // Only 30% chance to actually deal damage for less frequent hits
                    if (Math.random() < 0.3) {
                        player.takeDamage(ability.damage);
                        this.createHitEffect(player);
                        scythe.lastDamageTime = now; // Update last damage time
                    }
                }
            });
        },
        
        drawSpinningScytheEffect(centerX, centerY, currentX, currentY) {
            // Draw spinning scythe effect
            if (gameState.renderer) {
                // Add a slash effect to visualize the spinning scythe
                gameState.renderer.addSlashEffect({
                    startX: centerX,
                    startY: centerY,
                    endX: currentX,
                    endY: currentY,
                    width: 20,
                    duration: 300,
                    color: 'rgba(255, 50, 0, 0.7)'
                });
            }
        },
        
        // Add new methods for Time Explosion
        useTimeExplosion() {
            // Initialize the Time Explosion ability
            const ability = this.abilities.t;
            ability.isActive = true;
            ability.startTime = performance.now();
            
            // Choose a position for the explosion
            // Target a random player or a position between players
            const alivePlayers = gameState.players.filter(player => player.health > 0);
            
            if (alivePlayers.length > 0) {
                // Either pick a random player or a midpoint between players
                if (Math.random() < 0.7 || alivePlayers.length === 1) {
                    // Target a random player directly
                    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                    ability.position = { x: target.x, y: target.y };
                } else {
                    // Find centroid of a random subset of players
                    const subset = alivePlayers.slice(0, Math.min(3, alivePlayers.length));
                    let sumX = 0, sumY = 0;
                    subset.forEach(player => {
                        sumX += player.x;
                        sumY += player.y;
                    });
                    ability.position = { 
                        x: sumX / subset.length, 
                        y: sumY / subset.length 
                    };
                }
            } else {
                // Default to boss position if no players alive
                ability.position = { x: this.x, y: this.y };
            }
        },
        
        updateTimeExplosion(now) {
            const ability = this.abilities.t;
            const elapsed = now - ability.startTime;
            
            // Draw visual effect based on phase
            if (elapsed < ability.castTime) {
                // Casting phase - draw warning circle
                this.drawTimeExplosionWarning(ability.position.x, ability.position.y, elapsed / ability.castTime);
            } else if (elapsed < ability.castTime + 500) {
                // Explosion moment - create explosion effect
                this.drawTimeExplosionEffect(ability.position.x, ability.position.y);
                
                // Apply freeze to players within range (only check once)
                if (elapsed < ability.castTime + 100) {
                    this.applyTimeExplosionFreeze(ability.position.x, ability.position.y, now);
                }
            } else if (elapsed < ability.castTime + ability.freezeDuration + 500) {
                // Show frozen effect on affected players
            } else {
                // Ability complete
                ability.isActive = false;
            }
        },
        
        drawTimeExplosionWarning(x, y, progress) {
            // Draw growing circle to indicate the coming explosion
            if (gameState.ctx) {
                const ctx = gameState.ctx;
                const range = this.abilities.t.range;
                
                // Ensure progress is always positive
                const safeProgress = Math.max(0.01, progress);
                
                // Draw outer pulse
                ctx.beginPath();
                ctx.arc(x, y, range * safeProgress, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 - progress * 0.3})`;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw inner circle
                ctx.beginPath();
                ctx.arc(x, y, range * safeProgress * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${0.2 - progress * 0.1})`;
                ctx.fill();
            }
        },
        
        drawTimeExplosionEffect(x, y) {
            // Create explosion visual effect
            if (gameState.ctx) {
                const ctx = gameState.ctx;
                const range = this.abilities.t.range;
                
                // Bright flash
                ctx.beginPath();
                ctx.arc(x, y, range, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
                ctx.fill();
                
                // Outer ring
                ctx.beginPath();
                ctx.arc(x, y, range, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 8;
                ctx.stroke();
            }
        },
        
        applyTimeExplosionFreeze(x, y, now) {
            const ability = this.abilities.t;
            
            // Check each player for freeze
            gameState.players.forEach(player => {
                if (player.health <= 0) return; // Skip dead players
                
                // Calculate distance
                const dx = player.x - x;
                const dy = player.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If player is within explosion range
                if (distance <= ability.range) {
                    // Deal damage
                    player.takeDamage(ability.damage);
                    
                    // Apply freeze effect to player
                    player.isFrozen = true;
                    player.frozenUntil = now + ability.freezeDuration;
                    
                    // Visual effect
                    this.createHitEffect(player);
                }
            });
        }
    };
    
    // Load boss image
    gameState.boss.loadImage();
}

// Create player health bars
function createPlayerHealthBars() {
    const container = document.getElementById('playerHealthBars');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerBar = document.createElement('div');
        playerBar.className = 'player-info';
        
        const avatar = document.createElement('img');
        avatar.className = 'player-avatar';
        avatar.src = `../Loading Screen/${player.skin}`;
        
        const healthBar = document.createElement('div');
        healthBar.className = 'player-health-bar';
        healthBar.id = `health-${player.id}`;
        
        const healthFill = document.createElement('div');
        healthFill.className = 'player-health-fill';
        healthFill.style.width = '100%';
        
        healthBar.appendChild(healthFill);
        playerBar.appendChild(avatar);
        playerBar.appendChild(healthBar);
        
        container.appendChild(playerBar);
    });
}

// Create boss health bar
function createBossHealthBar() {
    const container = document.getElementById('bossHealthBar');
    container.innerHTML = '';
    
    const bossName = document.createElement('div');
    bossName.className = 'boss-name';
    bossName.textContent = gameState.boss.name;
    
    const healthFill = document.createElement('div');
    healthFill.className = 'boss-health-fill';
    healthFill.style.width = '100%';
    
    container.appendChild(bossName);
    container.appendChild(healthFill);
}

// Create ability bar
function createAbilityBar() {
    const container = document.getElementById('abilityBar');
    container.innerHTML = '';
    
    // Add buttons for each player's abilities
    if (gameState.players.length > 0) {
        const player = gameState.players[0]; // First player is controlled by user
        
        // Q ability
        const qButton = document.createElement('div');
        qButton.className = 'ability-button';
        qButton.innerHTML = '<span>Q</span>';
        qButton.addEventListener('click', () => usePlayerAbility('q'));
        container.appendChild(qButton);
        
        // R ability
        const rButton = document.createElement('div');
        rButton.className = 'ability-button';
        rButton.innerHTML = '<span>R</span>';
        rButton.addEventListener('click', () => usePlayerAbility('r'));
        container.appendChild(rButton);
    }
}

// Use player ability
function usePlayerAbility(key) {
    if (gameState.players.length > 0) {
        const player = gameState.players[0]; // First player is controlled by user
        
        if (player.abilities && player.abilities[key]) {
            player.abilities[key].use(player, gameState);
        }
    }
}

// Handle keydown event
function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (gameState.keys.hasOwnProperty(key)) {
        gameState.keys[key] = true;
        
        // Ability keys
        if (key === 'q' || key === 'r') {
            usePlayerAbility(key);
        }
    }
}

// Handle keyup event
function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (gameState.keys.hasOwnProperty(key)) {
        gameState.keys[key] = false;
    }
}

// Update health bars
function updateHealthBars() {
    // Update player health bars
    gameState.players.forEach(player => {
        const healthBar = document.querySelector(`#health-${player.id} .player-health-fill`);
        if (healthBar) {
            const healthPercent = (player.health / player.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
        }
    });
    
    // Update boss health bar
    const bossHealthBar = document.querySelector('.boss-health-fill');
    if (bossHealthBar) {
        const healthPercent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
        bossHealthBar.style.width = `${healthPercent}%`;
    }
}

// Check game over conditions
function checkGameOver() {
    // Check if all players are dead
    const allPlayersDead = gameState.players.every(player => player.health <= 0);
    
    // Check if boss is dead
    const bossDefeated = gameState.boss.health <= 0;
    
    if (allPlayersDead || bossDefeated) {
        gameState.isActive = false;
        
        // Show game over message
        setTimeout(() => {
            alert(bossDefeated ? 'Raid Boss Defeated!' : 'Game Over!');
            window.location.reload();
        }, 1000);
    }
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    
    // Clear canvas
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    if (gameState.isActive) {
        // Update players
        gameState.players.forEach(player => {
            player.update(deltaTime, gameState);
        });
        
        // Update boss
        gameState.boss.update(deltaTime);
        
        // Update health bars
        updateHealthBars();
        
        // Check game over
        checkGameOver();
        
        // Draw the game
        gameState.renderer.render(gameState);
        
        // Continue game loop
        requestAnimationFrame(gameLoop);
    }
} 