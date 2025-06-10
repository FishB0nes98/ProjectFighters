// Test Map Level Configuration
// Using map.webp as the background for the first test level

const testMapLevel = {
    id: 'test-map-01',
    name: 'Test Map - Forest Arena',
    description: 'A forest arena perfect for testing character movement and combat mechanics',
    
    // Background and visual settings - 10x wider for repeated background
    backgroundPath: 'UI/map.webp',
    width: 19200,  // 10x wider (1920 * 10) for 10 repeated backgrounds
    height: 1080, // 16:9 aspect ratio maintained
    
    // Spawn points for players/characters - spread across the wider map
    spawnPoints: [
        { x: 960, y: 746, name: 'Player 1 Spawn' },      // First background center
        { x: 2880, y: 746, name: 'Player 2 Spawn' },     // Second background center
        { x: 4800, y: 746, name: 'Player 3 Spawn' },     // Third background center
        { x: 6720, y: 746, name: 'Player 4 Spawn' },     // Fourth background center
        { x: 8640, y: 746, name: 'Player 5 Spawn' },     // Fifth background center
        { x: 10560, y: 746, name: 'Player 6 Spawn' },    // Sixth background center
        { x: 12480, y: 746, name: 'Player 7 Spawn' },    // Seventh background center
        { x: 14400, y: 746, name: 'Player 8 Spawn' },    // Eighth background center
        { x: 16320, y: 746, name: 'Player 9 Spawn' },    // Ninth background center
        { x: 18240, y: 746, name: 'Player 10 Spawn' }    // Tenth background center
    ],
    
    // Collision boundaries for side-view platformer
    boundaries: [
        // Map edges
        { x: 0, y: 0, width: 50, height: 1080, type: 'wall' },           // Left wall
        { x: 19150, y: 0, width: 50, height: 1080, type: 'wall' },       // Right wall
        { x: 0, y: 780, width: 19200, height: 300, type: 'ground' },     // Main ground level
        
        // === SECTION 1 (0-1920): Tutorial Area ===
        // Starting platforms
        { x: 500, y: 680, width: 200, height: 20, type: 'platform' },    // Low jump platform
        { x: 800, y: 630, width: 150, height: 20, type: 'platform' },    // Medium jump platform
        { x: 1100, y: 580, width: 120, height: 20, type: 'platform' },   // High jump platform
        // First obstacle
        { x: 1400, y: 680, width: 60, height: 100, type: 'wall' },       // Tall barrier
        // Ramp down
        { x: 1500, y: 740, width: 100, height: 40, type: 'ramp_down' },
        
        // === SECTION 2 (1920-3840): Forest Obstacles ===
        // Tree stumps as platforms
        { x: 2200, y: 700, width: 80, height: 80, type: 'platform' },
        { x: 2400, y: 650, width: 80, height: 130, type: 'platform' },
        { x: 2600, y: 600, width: 80, height: 180, type: 'platform' },
        // Gap with pit
        { x: 2800, y: 760, width: 200, height: 20, type: 'pit_cover' },
        // Climbing section
        { x: 3100, y: 720, width: 100, height: 20, type: 'platform' },
        { x: 3250, y: 670, width: 100, height: 20, type: 'platform' },
        { x: 3400, y: 620, width: 100, height: 20, type: 'platform' },
        { x: 3600, y: 680, width: 150, height: 20, type: 'platform' },
        
        // === SECTION 3 (3840-5760): Mountain Path ===
        // Steep ramps
        { x: 4000, y: 730, width: 150, height: 30, type: 'ramp_up' },
        { x: 4150, y: 700, width: 150, height: 30, type: 'ramp_up' },
        { x: 4300, y: 670, width: 150, height: 30, type: 'platform' },
        // Rock barriers
        { x: 4500, y: 620, width: 80, height: 140, type: 'wall' },
        { x: 4650, y: 670, width: 100, height: 20, type: 'platform' },
        { x: 4850, y: 620, width: 100, height: 20, type: 'platform' },
        // Descent with obstacles
        { x: 5000, y: 680, width: 60, height: 100, type: 'wall' },
        { x: 5150, y: 720, width: 150, height: 20, type: 'platform' },
        { x: 5400, y: 700, width: 200, height: 60, type: 'platform' },
        
        // === SECTION 4 (5760-7680): Cave Entrance ===
        // Low ceiling area
        { x: 6000, y: 550, width: 400, height: 30, type: 'ceiling' },
        { x: 6000, y: 720, width: 120, height: 20, type: 'platform' },
        { x: 6200, y: 720, width: 120, height: 20, type: 'platform' },
        // Narrow passages
        { x: 6500, y: 650, width: 40, height: 130, type: 'wall' },
        { x: 6600, y: 700, width: 100, height: 20, type: 'platform' },
        { x: 6800, y: 650, width: 100, height: 20, type: 'platform' },
        // Stalactites (hanging obstacles)
        { x: 7000, y: 550, width: 40, height: 80, type: 'stalactite' },
        { x: 7200, y: 550, width: 40, height: 100, type: 'stalactite' },
        { x: 7400, y: 690, width: 150, height: 20, type: 'platform' },
        
        // === SECTION 5 (7680-9600): Underground Caverns ===
        // Multi-level platforms
        { x: 8000, y: 720, width: 100, height: 20, type: 'platform' },
        { x: 8200, y: 670, width: 100, height: 20, type: 'platform' },
        { x: 8400, y: 620, width: 100, height: 20, type: 'platform' },
        { x: 8600, y: 670, width: 100, height: 20, type: 'platform' },
        { x: 8800, y: 720, width: 100, height: 20, type: 'platform' },
        // Crystal formations
        { x: 9000, y: 680, width: 60, height: 80, type: 'crystal' },
        { x: 9200, y: 650, width: 80, height: 110, type: 'crystal' },
        { x: 9400, y: 700, width: 150, height: 20, type: 'platform' },
        
        // === SECTION 6 (9600-11520): Lava Pits ===
        // Heat vents (dangerous areas)
        { x: 10000, y: 740, width: 80, height: 40, type: 'hazard' },
        { x: 10200, y: 700, width: 100, height: 20, type: 'platform' },
        { x: 10400, y: 650, width: 100, height: 20, type: 'platform' },
        { x: 10600, y: 700, width: 100, height: 20, type: 'platform' },
        // Lava bubble platforms (moving?)
        { x: 10800, y: 680, width: 80, height: 20, type: 'lava_platform' },
        { x: 11000, y: 640, width: 80, height: 20, type: 'lava_platform' },
        { x: 11200, y: 700, width: 120, height: 20, type: 'platform' },
        { x: 11400, y: 650, width: 100, height: 20, type: 'platform' },
        
        // === SECTION 7 (11520-13440): Ice Caves ===
        // Slippery surfaces
        { x: 12000, y: 720, width: 200, height: 20, type: 'ice_platform' },
        { x: 12300, y: 670, width: 150, height: 20, type: 'ice_platform' },
        { x: 12500, y: 620, width: 120, height: 20, type: 'ice_platform' },
        // Ice walls
        { x: 12700, y: 600, width: 60, height: 160, type: 'ice_wall' },
        { x: 12850, y: 680, width: 120, height: 20, type: 'platform' },
        { x: 13050, y: 630, width: 120, height: 20, type: 'platform' },
        { x: 13250, y: 690, width: 150, height: 20, type: 'platform' },
        
        // === SECTION 8 (13440-15360): Ruins ===
        // Broken pillars
        { x: 14000, y: 700, width: 60, height: 80, type: 'pillar' },
        { x: 14150, y: 650, width: 60, height: 130, type: 'pillar' },
        { x: 14300, y: 600, width: 60, height: 180, type: 'pillar' },
        // Crumbling platforms
        { x: 14500, y: 680, width: 100, height: 20, type: 'weak_platform' },
        { x: 14700, y: 630, width: 100, height: 20, type: 'weak_platform' },
        { x: 14900, y: 690, width: 120, height: 20, type: 'platform' },
        { x: 15100, y: 640, width: 120, height: 20, type: 'platform' },
        
        // === SECTION 9 (15360-17280): Sky Bridges ===
        // High altitude platforms
        { x: 15800, y: 620, width: 120, height: 20, type: 'platform' },
        { x: 16000, y: 580, width: 100, height: 20, type: 'platform' },
        { x: 16200, y: 620, width: 100, height: 20, type: 'platform' },
        { x: 16400, y: 660, width: 120, height: 20, type: 'platform' },
        // Wind barriers
        { x: 16600, y: 550, width: 40, height: 230, type: 'wind_wall' },
        { x: 16800, y: 640, width: 120, height: 20, type: 'platform' },
        { x: 17000, y: 600, width: 120, height: 20, type: 'platform' },
        
        // === SECTION 10 (17280-19200): Final Fortress ===
        // Castle walls
        { x: 17700, y: 600, width: 40, height: 180, type: 'wall' },
        { x: 17800, y: 660, width: 100, height: 20, type: 'platform' },
        { x: 17950, y: 610, width: 100, height: 20, type: 'platform' },
        { x: 18100, y: 670, width: 100, height: 20, type: 'platform' },
        // Final approach
        { x: 18300, y: 620, width: 150, height: 20, type: 'platform' },
        { x: 18500, y: 680, width: 200, height: 20, type: 'platform' },
        { x: 18750, y: 640, width: 200, height: 20, type: 'platform' },
        // Boss arena boundary
        { x: 19000, y: 580, width: 150, height: 200, type: 'arena_wall' }
    ],
    
    // Camera settings - updated for larger map
    camera: {
        followPlayer: true,
        smoothing: 0.1,
        bounds: {
            minX: 0,
            maxX: 19200,  // Extended to cover full width
            minY: 0,
            maxY: 1080
        }
    },
    
    // Lighting and atmosphere
    lighting: {
        ambient: 0.9,
        shadows: true,
        timeOfDay: 'day'
    },
    
    // Weather effects (optional)
    weather: null,
    
    // Audio settings
    music: null, // Can be added later
    ambientSounds: [
        // { path: 'sounds/forest-ambient.mp3', volume: 0.3, loop: true }
    ],
    
    // Game mode specific settings
    gameMode: {
        type: 'test',
        maxPlayers: 4,
        respawnEnabled: true,
        respawnTime: 3000
    },
    
    // Additional assets (decorative elements, etc.)
    assets: [
        // Example: { id: 'tree1', path: 'assets/tree.png' }
    ],
    
    // Asset positions on the map
    assetPositions: [
        // Example: { assetId: 'tree1', x: 500, y: 600, width: 64, height: 128 }
    ],
    
    // Interactive elements
    interactables: [
        // Checkpoints throughout the level
        { x: 960, y: 710, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 2880, y: 710, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 4800, y: 640, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 6720, y: 660, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 8640, y: 680, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 10560, y: 660, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 12480, y: 680, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 14400, y: 650, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 16320, y: 580, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        { x: 18240, y: 600, width: 32, height: 64, type: 'checkpoint', action: 'save' },
        
        // Power-ups and collectibles
        { x: 700, y: 650, width: 24, height: 24, type: 'health_potion', action: 'heal' },
        { x: 1200, y: 550, width: 24, height: 24, type: 'speed_boost', action: 'speed' },
        { x: 2500, y: 570, width: 24, height: 24, type: 'jump_boost', action: 'jump' },
        { x: 4700, y: 640, width: 24, height: 24, type: 'health_potion', action: 'heal' },
        { x: 7300, y: 660, width: 24, height: 24, type: 'shield', action: 'protect' },
        { x: 9300, y: 670, width: 24, height: 24, type: 'damage_boost', action: 'damage' },
        { x: 11300, y: 670, width: 24, height: 24, type: 'health_potion', action: 'heal' },
        { x: 13150, y: 600, width: 24, height: 24, type: 'ice_resistance', action: 'resist' },
        { x: 15000, y: 660, width: 24, height: 24, type: 'double_jump', action: 'ability' },
        { x: 17100, y: 570, width: 24, height: 24, type: 'wind_resistance', action: 'resist' },
        
        // Switches and mechanisms
        { x: 1600, y: 700, width: 32, height: 32, type: 'switch', action: 'activate_bridge' },
        { x: 3700, y: 650, width: 32, height: 32, type: 'lever', action: 'open_gate' },
        { x: 6900, y: 670, width: 32, height: 32, type: 'crystal_switch', action: 'light_cave' },
        { x: 10900, y: 670, width: 32, height: 32, type: 'pressure_plate', action: 'stop_lava' },
        { x: 13500, y: 660, width: 32, height: 32, type: 'ice_switch', action: 'melt_barrier' },
        { x: 16900, y: 570, width: 32, height: 32, type: 'wind_switch', action: 'calm_winds' },
        { x: 18800, y: 610, width: 32, height: 32, type: 'boss_gate', action: 'enter_arena' }
    ],
    
    // Level-specific rules
    rules: {
        allowFlying: false,
        allowWallJumping: true, // Allow wall jumping for advanced players
        gravity: 0.8, // Side-view platformer with gravity
        friction: 0.85,
        groundLevel: 760, // Main ground level
        jumpHeight: 150, // Max jump height (760 - 150 = 610)
        terminalVelocity: 15
    },
    
    // Debug settings
    showDebug: true,  // Enable debug mode to see collision boundaries
    showSpawnPoints: true,
    showBoundaries: true,
    showGrid: false
};

// Export the level configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testMapLevel;
} else if (typeof window !== 'undefined') {
    window.testMapLevel = testMapLevel;
} 