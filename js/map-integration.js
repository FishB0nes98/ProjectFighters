// Map Integration Script
// This file helps integrate custom maps created with the map editor into the game

class MapLoader {
    constructor() {
        this.customMaps = new Map();
        this.loadStoredMaps();
    }
    
    // Load maps from localStorage
    loadStoredMaps() {
        try {
            const storedMaps = localStorage.getItem('projectfighters_custom_maps');
            if (storedMaps) {
                const maps = JSON.parse(storedMaps);
                maps.forEach(map => {
                    this.customMaps.set(map.id, map);
                });
                console.log(`Loaded ${maps.length} custom maps from storage`);
            }
        } catch (error) {
            console.error('Error loading stored maps:', error);
        }
    }
    
    // Save maps to localStorage
    saveMapToStorage(mapData) {
        try {
            const existingMaps = Array.from(this.customMaps.values());
            const updatedMaps = existingMaps.filter(map => map.id !== mapData.id);
            updatedMaps.push(mapData);
            
            localStorage.setItem('projectfighters_custom_maps', JSON.stringify(updatedMaps));
            this.customMaps.set(mapData.id, mapData);
            
            console.log(`Saved custom map: ${mapData.name}`);
            return true;
        } catch (error) {
            console.error('Error saving map to storage:', error);
            return false;
        }
    }
    
    // Convert editor format to game format
    convertToGameLevel(mapData) {
        return {
            id: mapData.id,
            name: mapData.name,
            description: mapData.description || 'Custom level created with the map editor',
            
            // Background and visual settings
            backgroundPath: mapData.backgroundPath || 'UI/map.webp',
            width: mapData.width,
            height: mapData.height,
            
            // Spawn points
            spawnPoints: mapData.spawnPoints.map(spawn => ({
                x: spawn.x,
                y: spawn.y,
                name: spawn.name || 'Spawn Point'
            })),
            
            // Collision boundaries
            boundaries: mapData.boundaries.map(boundary => ({
                x: boundary.x,
                y: boundary.y,
                width: boundary.width,
                height: boundary.height,
                type: boundary.type
            })),
            
            // Interactive elements
            interactables: mapData.interactables.map(item => ({
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                type: item.type,
                action: item.action
            })),
            
            // Camera settings
            camera: {
                followPlayer: true,
                smoothing: 0.1,
                bounds: {
                    minX: 0,
                    maxX: mapData.width,
                    minY: 0,
                    maxY: mapData.height
                }
            },
            
            // Lighting and atmosphere
            lighting: {
                ambient: 0.9,
                shadows: true,
                timeOfDay: 'day'
            },
            
            // Game mode specific settings
            gameMode: {
                type: 'custom',
                maxPlayers: 4,
                respawnEnabled: true,
                respawnTime: 3000
            },
            
            // Level-specific rules
            rules: {
                allowFlying: false,
                allowWallJumping: true,
                gravity: 0.8,
                friction: 0.85,
                groundLevel: mapData.height - 300,
                jumpHeight: 150,
                terminalVelocity: 15
            },
            
            // Debug settings
            showDebug: false,
            showSpawnPoints: false,
            showBoundaries: false,
            showGrid: false
        };
    }
    
    // Get all available custom maps
    getCustomMaps() {
        return Array.from(this.customMaps.values());
    }
    
    // Get a specific map by ID
    getMap(mapId) {
        return this.customMaps.get(mapId);
    }
    
    // Load a custom map into the game
    async loadCustomLevel(mapId, gameManager, stageManager) {
        const mapData = this.getMap(mapId);
        if (!mapData) {
            console.error(`Custom map not found: ${mapId}`);
            return false;
        }
        
        try {
            // Convert to game level format
            const gameLevel = this.convertToGameLevel(mapData);
            
            // Create a temporary level object that matches the expected format
            const levelModule = {
                default: gameLevel,
                [mapData.name.replace(/[^a-zA-Z0-9]/g, '_') + 'Level']: gameLevel
            };
            
            // Load the level into the stage manager
            if (stageManager && stageManager.loadCustomLevel) {
                const success = await stageManager.loadCustomLevel(gameLevel);
                if (success && gameManager) {
                    // Spawn enemies if they exist in the map data
                    if (mapData.enemies && mapData.enemies.length > 0) {
                        this.spawnCustomEnemies(mapData.enemies, gameManager);
                    }
                }
                return success;
            } else {
                console.error('StageManager does not support custom levels');
                return false;
            }
        } catch (error) {
            console.error('Error loading custom level:', error);
            return false;
        }
    }
    
    // Spawn enemies for custom levels
    spawnCustomEnemies(enemies, gameManager) {
        if (!gameManager || !window.Enemy) {
            console.warn('Enemy class not available');
            return;
        }
        
        enemies.forEach(enemyData => {
            try {
                const config = {
                    x: enemyData.x,
                    y: enemyData.y,
                    width: enemyData.width || 60,
                    height: enemyData.height || 60,
                    health: enemyData.health || 100,
                    damage: enemyData.damage || 10,
                    speed: enemyData.speed || 3,
                    enemyType: enemyData.enemyType || 'basic'
                };
                
                const enemy = new Enemy(config);
                gameManager.addEnemy(enemy);
            } catch (error) {
                console.error('Error spawning enemy:', error);
            }
        });
    }
    
    // Delete a custom map
    deleteMap(mapId) {
        if (this.customMaps.has(mapId)) {
            this.customMaps.delete(mapId);
            
            // Update localStorage
            const remainingMaps = Array.from(this.customMaps.values());
            localStorage.setItem('projectfighters_custom_maps', JSON.stringify(remainingMaps));
            
            return true;
        }
        return false;
    }
    
    // Import map from JSON string
    importMapFromJSON(jsonString) {
        try {
            const mapData = JSON.parse(jsonString);
            
            // Validate required fields
            if (!mapData.id || !mapData.name || !mapData.width || !mapData.height) {
                throw new Error('Invalid map data: missing required fields');
            }
            
            // Ensure arrays exist
            mapData.boundaries = mapData.boundaries || [];
            mapData.spawnPoints = mapData.spawnPoints || [];
            mapData.enemies = mapData.enemies || [];
            mapData.interactables = mapData.interactables || [];
            mapData.hazards = mapData.hazards || [];
            
            this.saveMapToStorage(mapData);
            return true;
        } catch (error) {
            console.error('Error importing map:', error);
            return false;
        }
    }
    
    // Export map to JSON string
    exportMapToJSON(mapId) {
        const mapData = this.getMap(mapId);
        if (mapData) {
            return JSON.stringify(mapData, null, 2);
        }
        return null;
    }
}

// Extension to StageManager for custom level support
if (typeof window !== 'undefined' && window.StageManager) {
    const originalStageManager = window.StageManager;
    
    window.StageManager.prototype.loadCustomLevel = function(levelData) {
        this.currentStage = levelData;
        this.backgrounds = [];
        this.boundaries = [];
        this.spawnPoints = [];
        this.interactables = [];
        
        // Load background
        if (levelData.backgroundPath) {
            this.loadBackground(levelData.backgroundPath, levelData.width, levelData.height);
        }
        
        // Load boundaries
        if (levelData.boundaries) {
            this.boundaries = levelData.boundaries;
        }
        
        // Load spawn points
        if (levelData.spawnPoints) {
            this.spawnPoints = levelData.spawnPoints;
        }
        
        // Load interactables
        if (levelData.interactables) {
            this.interactables = levelData.interactables;
        }
        
        console.log(`Custom level loaded: ${levelData.name}`);
        return true;
    };
}

// Global map loader instance
window.mapLoader = new MapLoader();

// Utility functions for easy integration
window.loadCustomMap = function(mapId) {
    if (window.gameManager && window.gameManager.stageManager) {
        return window.mapLoader.loadCustomLevel(mapId, window.gameManager, window.gameManager.stageManager);
    } else {
        console.error('Game manager or stage manager not available');
        return false;
    }
};

window.getCustomMaps = function() {
    return window.mapLoader.getCustomMaps();
};

window.importCustomMap = function(jsonString) {
    return window.mapLoader.importMapFromJSON(jsonString);
};

// File upload handler for custom maps
window.handleCustomMapUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const success = window.mapLoader.importMapFromJSON(e.target.result);
            if (success) {
                alert('Custom map imported successfully!');
                // Trigger UI update if needed
                if (window.updateCustomMapsList) {
                    window.updateCustomMapsList();
                }
            } else {
                alert('Error importing custom map. Please check the file format.');
            }
        } catch (error) {
            alert('Error reading map file: ' + error.message);
        }
    };
    reader.readAsText(file);
};

console.log('Map Integration System loaded');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapLoader };
} 