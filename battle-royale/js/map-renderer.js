class MapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        this.createTextures();
        this.loadObjectImages();
    }

    createTextures() {
        // Create grass texture
        this.grassTexture = this.createGrassTexture();
        
        // Create water texture
        this.waterTexture = this.createWaterTexture();
        
        // Create bridge texture
        this.bridgeTexture = this.createBridgeTexture();
    }
    
    createGrassTexture() {
        // Create a simple grass texture with no grid pattern
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Larger texture to avoid visible repeating patterns
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Base grass color - solid uniform color
        ctx.fillStyle = '#7CCD7C'; // Solid medium green
        ctx.fillRect(0, 0, 128, 128);
        
        return canvas;
    }
    
    createWaterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Base water color
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(0, 0, 64, 64);

        // Add some wave effect
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `rgba(150, 200, 255, 0.2)`;
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const width = 5 + Math.random() * 15;
            const height = 1 + Math.random() * 2;
            ctx.fillRect(x, y, width, height);
        }

        return canvas;
    }
    
    createBridgeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Base bridge color
        ctx.fillStyle = '#8B4513'; // Wood color
        ctx.fillRect(0, 0, 64, 64);

        // Add wood plank details
        ctx.fillStyle = '#A0522D'; // Lighter wood color
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(0, i * 16, 64, 12);
        }
        
        // Add dark edges
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, 0, 64, 2);
        ctx.fillRect(0, 62, 64, 2);

        return canvas;
    }
    
    loadObjectImages() {
        // Load tree image
        this.treeImage = new Image();
        this.treeImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9Im51bGwiPjxlbGxpcHNlIGZpbGw9IiM3MzUyMzUiIGN4PSI1MCIgY3k9IjgwIiByeD0iOCIgcnk9IjE1Ii8+PGVsbGlwc2UgZmlsbD0iIzFkNjAyMyIgY3g9IjUwIiBjeT0iNDAiIHJ4PSIyNSIgcnk9IjMwIi8+PGVsbGlwc2UgZmlsbD0iIzI0NzEyOSIgY3g9IjUwIiBjeT0iMzAiIHJ4PSIyMCIgcnk9IjI1Ii8+PGVsbGlwc2UgZmlsbD0iIzFkNjAyMyIgY3g9IjUwIiBjeT0iMTgiIHJ4PSIxNSIgcnk9IjE4Ii8+PC9nPjwvc3ZnPg==';
        
        // Load stone image
        this.stoneImage = new Image();
        this.stoneImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBzdHJva2U9IiM1NTU1NTUiIGZpbGw9IiM4MDgwODAiIGN4PSI1MCIgY3k9IjUwIiByeD0iNDAiIHJ5PSIzMCIvPjxwYXRoIHN0cm9rZT0ibnVsbCIgZmlsbD0iIzY2NjY2NiIgZD0ibTcwLDM1YzAsMCAtMTUsMTAgLTQwLDUiLz48cGF0aCBzdHJva2U9Im51bGwiIGZpbGw9IiM2NjY2NjYiIGQ9Im0zMCw0NWM1LDE1IDQwLDEwIDUwLDIwIi8+PC9zdmc+';
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
            y: (worldY - this.camera.y) * this.camera.zoom + this.canvas.height / 2
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvas.width / 2) / this.camera.zoom + this.camera.x,
            y: (screenY - this.canvas.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    followTarget(target) {
        // Smooth camera movement
        const targetX = target.x;
        const targetY = target.y;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }

    render(map) {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate visible area
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
        
        // Create a clipping region for the map boundaries
        this.ctx.save();
        
        // Calculate the screen coordinates of the map boundaries
        const mapTopLeft = this.worldToScreen(0, 0);
        const mapBottomRight = this.worldToScreen(map.width, map.height);
        
        // Create a clipping path that matches the map boundaries
        this.ctx.beginPath();
        this.ctx.rect(mapTopLeft.x, mapTopLeft.y, mapBottomRight.x - mapTopLeft.x, mapBottomRight.y - mapTopLeft.y);
        this.ctx.clip();
        
        // Fill the visible area with grass (now limited to map boundaries by clipping)
        this.ctx.fillStyle = '#7CCD7C'; // Same solid color as the grass texture
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate tile range to draw
        const startTileX = Math.max(0, Math.floor(topLeft.x / map.tileSize));
        const startTileY = Math.max(0, Math.floor(topLeft.y / map.tileSize));
        const endTileX = Math.min(map.terrain[0].length - 1, Math.ceil(bottomRight.x / map.tileSize));
        const endTileY = Math.min(map.terrain.length - 1, Math.ceil(bottomRight.y / map.tileSize));

        // Draw only non-grass terrain tiles (water, bridges)
        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                const tile = map.terrain[y][x];
                if (tile.type === 'grass') continue; // Skip grass tiles
                
                const screenPos = this.worldToScreen(x * map.tileSize, y * map.tileSize);
                const scaledTileSize = map.tileSize * this.camera.zoom;
                
                // Choose texture based on tile type
                let texture;
                switch (tile.type) {
                    case 'water':
                        texture = this.waterTexture;
                        break;
                    case 'bridge':
                        texture = this.bridgeTexture;
                        break;
                }
                
                if (texture) {
                    // Save context state
                    this.ctx.save();
                    
                    // Create and transform pattern to stay fixed to world coordinates
                    const pattern = this.ctx.createPattern(texture, 'repeat');
                    const patternTransform = new DOMMatrix();
                    
                    // Apply camera transformation to the pattern
                    patternTransform.translateSelf(
                        -(this.camera.x * this.camera.zoom) % texture.width, 
                        -(this.camera.y * this.camera.zoom) % texture.height
                    );
                    patternTransform.scaleSelf(this.camera.zoom);
                    
                    pattern.setTransform(patternTransform);
                    this.ctx.fillStyle = pattern;
                    
                    // Draw the tile
                    this.ctx.fillRect(screenPos.x, screenPos.y, scaledTileSize, scaledTileSize);
                    
                    // Restore context state
                    this.ctx.restore();
                }
            }
        }
        
        // Draw objects
        this.renderObjects(map);
        
        // Restore the canvas state to remove clipping
        this.ctx.restore();
    }
    
    renderObjects(map) {
        // Sort objects by Y position for proper layering
        const sortedObjects = [...map.objects].sort((a, b) => a.y - b.y);
        
        for (const obj of sortedObjects) {
            const screenPos = this.worldToScreen(obj.x, obj.y);
            
            switch (obj.type) {
                case 'tree':
                    this.renderTree(screenPos, obj.size);
                    break;
                case 'stone':
                    this.renderStone(screenPos, obj.size);
                    break;
                case 'bridge':
                    this.renderBridge(screenPos, obj.width, obj.height);
                    break;
            }
        }
    }
    
    renderTree(screenPos, size) {
        if (this.treeImage.complete) {
            const treeSize = 100 * size * this.camera.zoom;
            this.ctx.drawImage(
                this.treeImage,
                screenPos.x - treeSize / 2,
                screenPos.y - treeSize * 0.8, // Adjust to align bottom with position
                treeSize,
                treeSize
            );
        }
    }
    
    renderStone(screenPos, size) {
        if (this.stoneImage.complete) {
            const stoneSize = 80 * size * this.camera.zoom;
            this.ctx.drawImage(
                this.stoneImage,
                screenPos.x - stoneSize / 2,
                screenPos.y - stoneSize / 2,
                stoneSize,
                stoneSize
            );
        }
    }
    
    renderBridge(screenPos, width, height) {
        // Draw a bridge
        const scaledWidth = width * this.camera.zoom;
        const scaledHeight = height * this.camera.zoom;
        
        // Create wood pattern
        const pattern = this.ctx.createPattern(this.bridgeTexture, 'repeat');
        this.ctx.fillStyle = pattern;
        
        this.ctx.fillRect(
            screenPos.x - scaledWidth / 2,
            screenPos.y - scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        
        // Add railings
        this.ctx.fillStyle = '#654321'; // Dark wood
        this.ctx.fillRect(
            screenPos.x - scaledWidth / 2,
            screenPos.y - scaledHeight / 2,
            scaledWidth,
            scaledHeight * 0.1
        );
        this.ctx.fillRect(
            screenPos.x - scaledWidth / 2,
            screenPos.y + scaledHeight / 2 - scaledHeight * 0.1,
            scaledWidth,
            scaledHeight * 0.1
        );
    }
    
    renderMinimap(canvas, map, players, localPlayer) {
        const ctx = canvas.getContext('2d');
        const minimapSize = canvas.width; // Assuming square minimap
        const mapSize = map.width; // Width of the actual map
        const scale = minimapSize / mapSize;
        
        // Clear minimap
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw terrain
        for (let y = 0; y < map.terrain.length; y++) {
            for (let x = 0; x < map.terrain[0].length; x++) {
                const tile = map.terrain[y][x];
                const minimapX = x * map.tileSize * scale;
                const minimapY = y * map.tileSize * scale;
                const tileSize = map.tileSize * scale;
                
                // Set color based on tile type
                switch (tile.type) {
                    case 'water':
                        ctx.fillStyle = '#4A90E2';
                        break;
                    case 'bridge':
                        ctx.fillStyle = '#8B4513';
                        break;
                    case 'grass':
                    default:
                        ctx.fillStyle = '#7CCD7C';
                        break;
                }
                
                ctx.fillRect(minimapX, minimapY, tileSize, tileSize);
            }
        }
        
        // Draw objects as dots
        for (const obj of map.objects) {
            // Set color based on object type
            switch (obj.type) {
                case 'tree':
                    ctx.fillStyle = '#006400'; // Dark green for trees
                    break;
                case 'stone':
                    ctx.fillStyle = '#808080'; // Gray for stones
                    break;
                case 'bridge':
                    ctx.fillStyle = '#8B4513'; // Brown for bridges
                    break;
            }
            
            const minimapX = obj.x * scale;
            const minimapY = obj.y * scale;
            const dotSize = 2;
            ctx.fillRect(minimapX - dotSize/2, minimapY - dotSize/2, dotSize, dotSize);
        }
        
        // Draw players
        for (const id in players) {
            const player = players[id];
            const minimapX = player.x * scale;
            const minimapY = player.y * scale;
            
            // Local player is red, other players are blue
            ctx.fillStyle = player === localPlayer ? '#FF0000' : '#0000FF';
            ctx.beginPath();
            ctx.arc(minimapX, minimapY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw current view area
        const viewX = this.camera.x * scale;
        const viewY = this.camera.y * scale;
        const viewWidth = (this.canvas.width / this.camera.zoom) * scale;
        const viewHeight = (this.canvas.height / this.camera.zoom) * scale;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            viewX - viewWidth / 2,
            viewY - viewHeight / 2,
            viewWidth,
            viewHeight
        );
    }

    // Add this method to convert world distances to screen distances
    worldToScreenDistance(worldDistance) {
        return worldDistance * this.camera.zoom;
    }
} 