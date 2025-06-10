class StageManager {
    constructor() {
        this.currentStage = null;
        this.stages = new Map();
        this.backgroundImage = null;
        this.isLoading = false;
        
        // Stage configuration
        this.stageConfig = {
            width: 1920,  // 16:9 aspect ratio base width
            height: 1080, // 16:9 aspect ratio base height
            scale: 1
        };
        
        console.log('StageManager initialized');
    }
    
    // Register a new stage
    registerStage(stageId, config) {
        this.stages.set(stageId, {
            id: stageId,
            name: config.name || stageId,
            backgroundPath: config.backgroundPath,
            width: config.width || this.stageConfig.width,
            height: config.height || this.stageConfig.height,
            spawnPoints: config.spawnPoints || [{ x: 400, y: 300 }],
            boundaries: config.boundaries || null,
            collisionMap: config.collisionMap || null,
            music: config.music || null,
            ambientSounds: config.ambientSounds || [],
            lighting: config.lighting || { ambient: 1.0, shadows: false },
            weather: config.weather || null,
            ...config
        });
        
        console.log(`Stage registered: ${stageId}`);
        return this.stages.get(stageId);
    }
    
    // Load a stage
    async loadStage(stageId) {
        if (this.isLoading) {
            console.warn('Stage loading already in progress');
            return false;
        }
        
        const stage = this.stages.get(stageId);
        if (!stage) {
            console.error(`Stage not found: ${stageId}`);
            return false;
        }
        
        this.isLoading = true;
        console.log(`Loading stage: ${stageId}`);
        
        try {
            // Set current stage first
            this.currentStage = stage;
            
            // Load background image
            if (stage.backgroundPath) {
                await this.loadBackground(stage.backgroundPath);
            }
            
            // Load additional assets if needed
            if (stage.assets && stage.assets.length > 0) {
                await this.loadStageAssets(stage.assets);
            }
            
            this.isLoading = false;
            
            console.log(`Stage loaded successfully: ${stageId}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load stage ${stageId}:`, error);
            this.currentStage = null;
            this.isLoading = false;
            return false;
        }
    }
    
    // Load background image
    loadBackground(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                console.log('Background loaded:', imagePath);
                resolve(img);
            };
            img.onerror = () => {
                console.error('Failed to load background:', imagePath);
                reject(new Error(`Failed to load background: ${imagePath}`));
            };
            img.src = imagePath;
        });
    }
    
    // Load additional stage assets
    async loadStageAssets(assets) {
        if (!assets || assets.length === 0) {
            console.log('No stage assets to load');
            return;
        }
        
        const loadPromises = assets.map(asset => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ id: asset.id, image: img });
                img.onerror = () => reject(new Error(`Failed to load asset: ${asset.path}`));
                img.src = asset.path;
            });
        });
        
        try {
            const loadedAssets = await Promise.all(loadPromises);
            if (!this.currentStage) {
                console.error('Current stage is null when trying to set loaded assets');
                return;
            }
            this.currentStage.loadedAssets = new Map();
            loadedAssets.forEach(asset => {
                this.currentStage.loadedAssets.set(asset.id, asset.image);
            });
            console.log('Stage assets loaded');
        } catch (error) {
            console.error('Failed to load stage assets:', error);
            throw error;
        }
    }
    
    // Render the current stage
    render(ctx, camera = null) {
        if (!this.currentStage || !this.backgroundImage) return;
        
        const stage = this.currentStage;
        
        // Calculate render position with camera offset
        let renderX = 0;
        let renderY = 0;
        
        if (camera) {
            renderX = -camera.x;
            renderY = -camera.y;
        }
        
        // Render background - repeat 10 times horizontally
        ctx.save();
        
        const repeatCount = 10;
        const originalWidth = this.backgroundImage.width;
        const originalHeight = this.backgroundImage.height;
        
        // Scale the image to match stage height while maintaining aspect ratio
        const scaleY = stage.height / originalHeight;
        const scaledWidth = originalWidth * scaleY;
        const scaledHeight = stage.height;
        
        // Calculate total width needed for 10 repetitions
        const totalWidth = scaledWidth * repeatCount;
        
        // Render the background 10 times horizontally
        for (let i = 0; i < repeatCount; i++) {
            const xOffset = i * scaledWidth;
            
            ctx.drawImage(
                this.backgroundImage,
                renderX + xOffset, renderY,
                scaledWidth, scaledHeight
            );
        }
        
        ctx.restore();
        
        // Render additional stage elements
        this.renderStageElements(ctx, camera);
    }
    
    // Render additional stage elements
    renderStageElements(ctx, camera) {
        if (!this.currentStage) return;
        
        const stage = this.currentStage;
        
        // Always render platforms and obstacles as visual elements
        if (stage.boundaries) {
            this.renderPlatforms(ctx, camera);
        }
        
        // Render collision boundaries for debugging
        if (stage.boundaries && stage.showDebug) {
            this.renderBoundaries(ctx, camera);
        }
        
        // Render spawn points for debugging
        if (stage.spawnPoints && stage.showDebug) {
            this.renderSpawnPoints(ctx, camera);
        }
        
        // Render additional assets
        if (stage.loadedAssets) {
            this.renderStageAssets(ctx, camera);
        }
    }
    
    // Render platforms as visual elements
    renderPlatforms(ctx, camera) {
        const stage = this.currentStage;
        if (!stage.boundaries) return;
        
        ctx.save();
        
        stage.boundaries.forEach(boundary => {
            // Skip rendering ground level
            if (boundary.type === 'ground') return;
            
            let x = boundary.x;
            let y = boundary.y;
            
            if (camera) {
                x -= camera.x;
                y -= camera.y;
            }
            
            // Get color and style based on platform type
            const style = this.getPlatformStyle(boundary.type);
            
            // Fill the platform
            ctx.fillStyle = style.fill;
            ctx.fillRect(x, y, boundary.width, boundary.height);
            
            // Add border if specified
            if (style.border) {
                ctx.strokeStyle = style.border;
                ctx.lineWidth = style.borderWidth || 2;
                ctx.strokeRect(x, y, boundary.width, boundary.height);
            }
            
            // Add special effects for certain platform types
            if (style.effect) {
                this.renderPlatformEffect(ctx, x, y, boundary.width, boundary.height, style.effect);
            }
        });
        
        ctx.restore();
    }
    
    // Get visual style for different platform types
    getPlatformStyle(type) {
        const styles = {
            'ground': { 
                fill: 'transparent', // Make ground invisible
                border: 'transparent', 
                borderWidth: 0 
            },
            'platform': { 
                fill: 'rgba(139, 69, 19, 0.9)', 
                border: 'rgba(160, 82, 45, 1)', 
                borderWidth: 2 
            },
            'wall': { 
                fill: 'rgba(105, 105, 105, 0.9)', 
                border: 'rgba(169, 169, 169, 1)', 
                borderWidth: 2 
            },
            'ramp_up': { 
                fill: 'rgba(160, 82, 45, 0.9)', 
                border: 'rgba(210, 180, 140, 1)', 
                borderWidth: 2 
            },
            'ramp_down': { 
                fill: 'rgba(160, 82, 45, 0.9)', 
                border: 'rgba(210, 180, 140, 1)', 
                borderWidth: 2 
            },
            'ice_platform': { 
                fill: 'rgba(173, 216, 230, 0.8)', 
                border: 'rgba(135, 206, 250, 1)', 
                borderWidth: 2,
                effect: 'ice'
            },
            'ice_wall': { 
                fill: 'rgba(173, 216, 230, 0.9)', 
                border: 'rgba(135, 206, 250, 1)', 
                borderWidth: 2,
                effect: 'ice'
            },
            'lava_platform': { 
                fill: 'rgba(255, 69, 0, 0.8)', 
                border: 'rgba(255, 140, 0, 1)', 
                borderWidth: 2,
                effect: 'lava'
            },
            'crystal': { 
                fill: 'rgba(147, 0, 211, 0.7)', 
                border: 'rgba(186, 85, 211, 1)', 
                borderWidth: 2,
                effect: 'crystal'
            },
            'hazard': { 
                fill: 'rgba(255, 0, 0, 0.6)', 
                border: 'rgba(255, 69, 0, 1)', 
                borderWidth: 3,
                effect: 'danger'
            },
            'ceiling': { 
                fill: 'rgba(105, 105, 105, 0.9)', 
                border: 'rgba(169, 169, 169, 1)', 
                borderWidth: 2 
            },
            'stalactite': { 
                fill: 'rgba(105, 105, 105, 0.9)', 
                border: 'rgba(169, 169, 169, 1)', 
                borderWidth: 2 
            },
            'pillar': { 
                fill: 'rgba(160, 82, 45, 0.9)', 
                border: 'rgba(210, 180, 140, 1)', 
                borderWidth: 2 
            },
            'weak_platform': { 
                fill: 'rgba(139, 69, 19, 0.6)', 
                border: 'rgba(160, 82, 45, 0.8)', 
                borderWidth: 1,
                effect: 'weak'
            },
            'wind_wall': { 
                fill: 'rgba(135, 206, 250, 0.3)', 
                border: 'rgba(70, 130, 180, 0.6)', 
                borderWidth: 2,
                effect: 'wind'
            },
            'arena_wall': { 
                fill: 'rgba(105, 105, 105, 1)', 
                border: 'rgba(169, 169, 169, 1)', 
                borderWidth: 3 
            },
            'pit_cover': { 
                fill: 'rgba(139, 69, 19, 0.5)', 
                border: 'rgba(160, 82, 45, 0.7)', 
                borderWidth: 1,
                effect: 'weak'
            }
        };
        
        return styles[type] || styles['platform']; // Default to platform style
    }
    
    // Render special effects for platforms
    renderPlatformEffect(ctx, x, y, width, height, effect) {
        ctx.save();
        
        switch (effect) {
            case 'ice':
                // Add shimmering ice effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
                break;
                
            case 'lava':
                // Add glowing lava effect
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'rgba(255, 140, 0, 0.5)';
                ctx.fillRect(x, y, width, height);
                break;
                
            case 'crystal':
                // Add crystal sparkle effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                for (let i = 0; i < 3; i++) {
                    const sparkleX = x + Math.random() * width;
                    const sparkleY = y + Math.random() * height;
                    ctx.fillRect(sparkleX, sparkleY, 2, 2);
                }
                break;
                
            case 'danger':
                // Add warning stripes
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                ctx.lineWidth = 2;
                for (let i = 0; i < width; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(x + i, y);
                    ctx.lineTo(x + i + 5, y + height);
                    ctx.stroke();
                }
                break;
                
            case 'weak':
                // Add cracks
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + width * 0.3, y);
                ctx.lineTo(x + width * 0.7, y + height);
                ctx.moveTo(x + width * 0.6, y);
                ctx.lineTo(x + width * 0.2, y + height);
                ctx.stroke();
                break;
                
            case 'wind':
                // Add flowing wind lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                for (let i = 0; i < height; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + i);
                    ctx.lineTo(x + width, y + i);
                    ctx.stroke();
                }
                break;
        }
        
        ctx.restore();
    }
    
    // Render collision boundaries (debug)
    renderBoundaries(ctx, camera) {
        const stage = this.currentStage;
        if (!stage.boundaries) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        
        stage.boundaries.forEach(boundary => {
            let x = boundary.x;
            let y = boundary.y;
            
            if (camera) {
                x -= camera.x;
                y -= camera.y;
            }
            
            ctx.strokeRect(x, y, boundary.width, boundary.height);
        });
        
        ctx.restore();
    }
    
    // Render spawn points
    renderSpawnPoints(ctx, camera) {
        const stage = this.currentStage;
        if (!stage.spawnPoints) return;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        
        stage.spawnPoints.forEach((point, index) => {
            let x = point.x;
            let y = point.y;
            
            if (camera) {
                x -= camera.x;
                y -= camera.y;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw spawn point number
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(index.toString(), x, y + 4);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        });
        
        ctx.restore();
    }
    
    // Render stage assets
    renderStageAssets(ctx, camera) {
        const stage = this.currentStage;
        if (!stage.assetPositions || !stage.loadedAssets) return;
        
        stage.assetPositions.forEach(assetPos => {
            const asset = stage.loadedAssets.get(assetPos.assetId);
            if (!asset) return;
            
            let x = assetPos.x;
            let y = assetPos.y;
            
            if (camera) {
                x -= camera.x;
                y -= camera.y;
            }
            
            ctx.drawImage(
                asset,
                x, y,
                assetPos.width || asset.width,
                assetPos.height || asset.height
            );
        });
    }
    
    // Get current stage info
    getCurrentStage() {
        return this.currentStage;
    }
    
    // Get stage boundaries for collision detection
    getStageBoundaries() {
        return this.currentStage?.boundaries || [];
    }
    
    // Get spawn points
    getSpawnPoints() {
        return this.currentStage?.spawnPoints || [{ x: 400, y: 300 }];
    }
    
    // Check if point is within stage bounds
    isWithinStageBounds(x, y) {
        if (!this.currentStage) return true;
        
        const stage = this.currentStage;
        return x >= 0 && x <= stage.width && y >= 0 && y <= stage.height;
    }
    
    // Get stage dimensions
    getStageDimensions() {
        if (!this.currentStage) {
            return { width: this.stageConfig.width, height: this.stageConfig.height };
        }
        
        return {
            width: this.currentStage.width,
            height: this.currentStage.height
        };
    }
    
    // Toggle debug rendering
    toggleDebug() {
        if (this.currentStage) {
            this.currentStage.showDebug = !this.currentStage.showDebug;
        }
    }
    
    // Unload current stage
    unloadStage() {
        if (this.currentStage) {
            console.log(`Unloading stage: ${this.currentStage.id}`);
            this.currentStage = null;
            this.backgroundImage = null;
        }
    }
    
    // Get list of registered stages
    getRegisteredStages() {
        return Array.from(this.stages.keys());
    }
    
    // Add this method to prevent errors
    update(deltaTime) {
        // No-op for now
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StageManager;
} 