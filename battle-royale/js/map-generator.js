class MapGenerator {
    constructor(width, height, seed) {
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.tileSize = 64; // Increased tile size for better scale
        this.objectTypes = {
            TREE: 'tree',
            STONE: 'stone',
            BRIDGE: 'bridge',
            WATER: 'water'
        };
        this.WATER_MOVEMENT_PENALTY = 0.5; // Player moves at 50% speed in water
    }

    // Seeded random number generator
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    generateTerrain() {
        const terrain = [];
        const objects = [];
        
        // Create a base grass map
        for (let y = 0; y < this.height; y++) {
            terrain[y] = [];
            for (let x = 0; x < this.width; x++) {
                terrain[y][x] = {
                    type: 'grass',
                    walkable: true
                };
            }
        }

        // Generate a river
        const riverData = this.generateRiver(terrain);
        
        // Add bridges across the river
        if (riverData) {
            this.addBridges(terrain, riverData, objects);
        }
        
        // Add stone clusters (avoiding water)
        const stoneCount = Math.floor(this.width * this.height * 0.01);
        for (let i = 0; i < stoneCount; i++) {
            // Find a suitable non-water location
            let x, y;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                x = Math.floor(this.random() * this.width);
                y = Math.floor(this.random() * this.height);
                attempts++;
                
                if (attempts >= maxAttempts) break; // Avoid infinite loop
            } while (terrain[y][x].type === 'water');
            
            // Only place stone if not on water
            if (terrain[y][x].type !== 'water') {
                this.generateStoneCluster(x, y, objects, terrain);
            }
        }
        
        // Add forest areas (avoiding water)
        const forestCount = Math.floor(this.width * this.height * 0.03);
        for (let i = 0; i < forestCount; i++) {
            // Find a suitable non-water location
            let x, y;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                x = Math.floor(this.random() * this.width);
                y = Math.floor(this.random() * this.height);
                attempts++;
                
                if (attempts >= maxAttempts) break; // Avoid infinite loop
            } while (terrain[y][x].type === 'water');
            
            // Only place forest if not on water
            if (terrain[y][x].type !== 'water') {
                this.generateForest(x, y, objects, terrain);
            }
        }

        return {
            terrain: terrain,
            objects: objects,
            width: this.width * this.tileSize,
            height: this.height * this.tileSize,
            tileSize: this.tileSize
        };
    }

    generateRiver(terrain) {
        // Create a winding river across the map
        const startX = Math.floor(this.random() * this.width * 0.3);
        let x = startX;
        let riverWidth = 2 + Math.floor(this.random() * 3);
        const riverPath = []; // Store river center points for bridge placement
        
        for (let y = 0; y < this.height; y++) {
            // Make the river wind a bit
            if (this.random() > 0.7) {
                x += this.random() > 0.5 ? 1 : -1;
            }
            
            // Keep the river within map bounds
            x = Math.max(riverWidth, Math.min(this.width - riverWidth - 1, x));
            
            // Create the river at this y-coordinate
            for (let w = -riverWidth; w <= riverWidth; w++) {
                const riverX = x + w;
                if (riverX >= 0 && riverX < this.width) {
                    terrain[y][riverX] = {
                        type: 'water',
                        walkable: true, // Water is now walkable
                        movementMultiplier: this.WATER_MOVEMENT_PENALTY // But slows movement
                    };
                }
            }
            
            // Store river path for bridge placement
            riverPath.push({x: x, y: y, width: riverWidth});
        }
        
        return {
            path: riverPath,
            width: riverWidth
        };
    }
    
    addBridges(terrain, riverData, objects) {
        // Add bridges at intervals along the river
        const riverLength = riverData.path.length;
        const bridgeInterval = Math.floor(riverLength / (3 + Math.floor(this.random() * 3))); // 3-5 bridges
        
        for (let i = 0; i < riverLength; i += bridgeInterval) {
            if (i + bridgeInterval/2 < riverLength) {
                const bridgePos = i + Math.floor(bridgeInterval/2); // Place bridge in the middle of the interval
                const riverPoint = riverData.path[bridgePos];
                
                // Create a bridge at this point
                const bridgeWidth = riverPoint.width * 2 + 2;
                
                // Mark bridge tiles as normal terrain
                for (let w = -riverPoint.width - 1; w <= riverPoint.width + 1; w++) {
                    const bridgeX = riverPoint.x + w;
                    if (bridgeX >= 0 && bridgeX < this.width) {
                        terrain[riverPoint.y][bridgeX] = {
                            type: 'bridge', // Mark as bridge tiles
                            walkable: true   // Bridge is walkable
                        };
                    }
                }
                
                // Add bridge object
                objects.push({
                    type: this.objectTypes.BRIDGE,
                    x: riverPoint.x * this.tileSize + this.tileSize / 2,
                    y: riverPoint.y * this.tileSize + this.tileSize / 2,
                    width: bridgeWidth * this.tileSize,
                    height: this.tileSize,
                    walkable: true
                });
            }
        }
    }

    generateStoneCluster(centerX, centerY, objects, terrain) {
        const clusterSize = 1 + Math.floor(this.random() * 3);
        
        for (let i = 0; i < clusterSize; i++) {
            const offsetX = Math.floor(this.random() * 3) - 1;
            const offsetY = Math.floor(this.random() * 3) - 1;
            const x = centerX + offsetX;
            const y = centerY + offsetY;
            
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                // Check if this position is on water
                if (terrain[y][x].type === 'water') {
                    continue; // Skip this position if it's water
                }
                
                const stoneSize = 0.3 + this.random() * 0.4; // Smaller stones
                objects.push({
                    type: this.objectTypes.STONE,
                    x: x * this.tileSize + this.tileSize / 2,
                    y: y * this.tileSize + this.tileSize / 2,
                    size: stoneSize,
                    walkable: false
                });
            }
        }
    }

    generateForest(centerX, centerY, objects, terrain) {
        const treeCount = 5 + Math.floor(this.random() * 10);
        const radius = 3 + Math.floor(this.random() * 3);
        
        for (let i = 0; i < treeCount; i++) {
            const angle = this.random() * Math.PI * 2;
            const distance = this.random() * radius;
            const x = Math.floor(centerX + Math.cos(angle) * distance);
            const y = Math.floor(centerY + Math.sin(angle) * distance);
            
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                // Check if this position is on water or bridge
                if (terrain[y][x].type === 'water' || terrain[y][x].type === 'bridge') {
                    continue; // Skip this position if it's water or bridge
                }
                
                const treeSize = 0.6 + this.random() * 0.3; // Smaller trees
                objects.push({
                    type: this.objectTypes.TREE,
                    x: x * this.tileSize + this.tileSize / 2,
                    y: y * this.tileSize + this.tileSize / 2,
                    size: treeSize,
                    walkable: false
                });
            }
        }
    }

    getMovementSpeedMultiplier(x, y) {
        // Convert world coordinates to grid positions
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        // Check bounds
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return 1.0;
        }

        // Check terrain type for movement multiplier
        if (this.currentMap && this.currentMap.terrain[gridY][gridX].type === 'water') {
            return this.WATER_MOVEMENT_PENALTY;
        }

        return 1.0; // Default normal speed
    }

    isWalkable(x, y) {
        // Convert world coordinates to grid positions
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        // Check bounds
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }

        // Check terrain walkability
        if (this.currentMap && this.currentMap.terrain[gridY][gridX].walkable === false) {
            return false;
        }

        // Check objects for collision
        if (this.currentMap && this.currentMap.objects) {
            const playerRadius = 15; // Reduced player radius for easier navigation
            
            for (const obj of this.currentMap.objects) {
                if (obj.walkable === false) {
                    let collides = false;
                    
                    // Different collision detection based on object type
                    switch(obj.type) {
                        case this.objectTypes.TREE:
                            // Circular collision for trees (smaller radius)
                            const treeRadius = obj.size * this.tileSize / 2 * 0.5; // 50% of half the tile size
                            const dx = x - obj.x;
                            const dy = y - obj.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            collides = distance < (playerRadius + treeRadius);
                            break;
                            
                        case this.objectTypes.STONE:
                            // Circular collision for stones (smaller radius)
                            const stoneRadius = obj.size * this.tileSize / 2 * 0.5;
                            const sx = x - obj.x;
                            const sy = y - obj.y;
                            const stoneDist = Math.sqrt(sx * sx + sy * sy);
                            collides = stoneDist < (playerRadius + stoneRadius);
                            break;
                    }
                    
                    if (collides) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
    
    setCurrentMap(map) {
        this.currentMap = map;
    }
} 