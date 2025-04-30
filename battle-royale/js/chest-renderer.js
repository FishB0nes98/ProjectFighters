class ChestRenderer {
    constructor(mapRenderer) {
        this.mapRenderer = mapRenderer;
        this.loadChestImages();
    }

    loadChestImages() {
        // Closed chest image
        this.closedChestImage = new Image();
        this.closedChestImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTIgMjB2MzJoNDBWMjBIMTJ6IiBmaWxsPSIjOEI0NTEzIi8+PHBhdGggZD0iTTEyIDIwaDQwdjhoLTQwdi04eiIgZmlsbD0iIzVEMkUwQiIvPjxwYXRoIGQ9Ik0xNiAxN2wzMiAwIDAgMyAtMzIgMHoiIGZpbGw9IiM4QjQ1MTMiLz48cGF0aCBkPSJNMjAgMTR2M2gyNHYtM0gyMHoiIGZpbGw9IiM3MDM4MEMiLz48cGF0aCBkPSJNMjggMzJoOHY4aC04eiIgZmlsbD0iI0ZGRDcwMCIvPjxwYXRoIGQ9Ik0yOCAzNmg4djRoLTh6IiBmaWxsPSIjRkZCMDAwIi8+PC9nPjwvc3ZnPg==';
        
        // Open chest image
        this.openChestImage = new Image();
        this.openChestImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTIgMjB2MzJoNDBWMjBIMTJ6IiBmaWxsPSIjOEI0NTEzIi8+PHBhdGggZD0iTTEyIDIwaDQwdjhoLTQwdi04eiIgZmlsbD0iIzVEMkUwQiIvPjxwYXRoIGQ9Ik0xNiAxMGwzMiAwIDAgMTAgLTMyIDB6IiBmaWxsPSIjOEI0NTEzIi8+PHBhdGggZD0iTTIwIDE0djZoMjR2LTZIMjB6IiBmaWxsPSIjNzAzODBDIi8+PHBhdGggZD0iTTI4IDI4aDh2OGgtOHoiIGZpbGw9IiNGRkQ3MDAiLz48cGF0aCBkPSJNMjggMzJoOHY0aC04eiIgZmlsbD0iI0ZGQjAwMCIvPjwvZz48L3N2Zz4=';
        
        // Item hover effect
        this.itemGlowEffect = new Image();
        this.itemGlowEffect.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjQiIGZpbGw9IiNGRkY1MDAiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PC9zdmc+';
        
        // Easter egg base image
        this.easterEggBaseImage = new Image();
        this.easterEggBaseImage.src = ITEMS.EASTER_EGG.image;
    }

    renderChests(ctx, chests) {
        for (const chest of chests) {
            const chestSize = 48;
            const screenPos = this.mapRenderer.worldToScreen(chest.x, chest.y);
            
            // Draw chest shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                screenPos.x,
                screenPos.y + 10,
                chestSize/2,
                chestSize/4,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw chest image
            const image = chest.isOpen ? this.openChestImage : this.closedChestImage;
            if (image.complete) {
                ctx.drawImage(
                    image,
                    screenPos.x - chestSize/2,
                    screenPos.y - chestSize/2,
                    chestSize,
                    chestSize
                );
            }
            
            // Draw a hover effect if the chest is not opened
            if (!chest.isOpen) {
                // Pulse effect with enhanced visibility
                const time = Date.now() / 1000;
                const scale = 1 + 0.15 * Math.sin(time * 2);
                const alpha = 0.4 + 0.3 * Math.sin(time * 2);
                
                if (this.itemGlowEffect.complete) {
                    // Draw larger glow effect
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(
                        this.itemGlowEffect,
                        screenPos.x - chestSize * scale,
                        screenPos.y - chestSize * scale,
                        chestSize * scale * 2,
                        chestSize * scale * 2
                    );
                    
                    // Draw vertical light beam for better visibility
                    const gradient = ctx.createLinearGradient(
                        screenPos.x, 
                        screenPos.y - chestSize * 3, 
                        screenPos.x, 
                        screenPos.y
                    );
                    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
                    gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
                    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x - chestSize/3, screenPos.y);
                    ctx.lineTo(screenPos.x + chestSize/3, screenPos.y);
                    ctx.lineTo(screenPos.x + chestSize/6, screenPos.y - chestSize * 3);
                    ctx.lineTo(screenPos.x - chestSize/6, screenPos.y - chestSize * 3);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    renderDroppedItems(ctx, droppedItems) {
        for (const item of droppedItems) {
            const itemSize = 32;
            const screenPos = this.mapRenderer.worldToScreen(item.x, item.y);
            
            // Draw item shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                screenPos.x,
                screenPos.y + 5,
                itemSize/2,
                itemSize/4,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw item image
            if (item.image) {
                // Create an image element if it doesn't exist
                if (!item.imageElement) {
                    item.imageElement = new Image();
                    item.imageElement.src = item.image;
                }
                
                if (item.imageElement.complete) {
                    // Draw a glow effect based on rarity
                    ctx.save();
                    let glowColor;
                    switch(item.rarity) {
                        case 'uncommon':
                            glowColor = 'rgba(0, 255, 0, 0.3)';
                            break;
                        case 'rare':
                            glowColor = 'rgba(0, 112, 221, 0.3)';
                            break;
                        case 'epic':
                            glowColor = 'rgba(163, 53, 238, 0.3)';
                            break;
                        case 'legendary':
                            glowColor = 'rgba(255, 165, 0, 0.3)';
                            break;
                        default: // common
                            glowColor = 'rgba(255, 255, 255, 0.2)';
                    }
                    
                    // Draw glow
                    const time = Date.now() / 1000;
                    const pulseScale = 1 + 0.1 * Math.sin(time * 2);
                    
                    ctx.shadowColor = glowColor.replace(/[\d.]+\)$/, '0.7)'); // Increase opacity for shadow
                    ctx.shadowBlur = 10 * pulseScale;
                    
                    // Draw item
                    ctx.drawImage(
                        item.imageElement,
                        screenPos.x - itemSize/2,
                        screenPos.y - itemSize/2,
                        itemSize,
                        itemSize
                    );
                    
                    // Draw stack count if item is stackable and has more than 1
                    if (item.stackable && item.stackCount > 1) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.fillRect(screenPos.x + itemSize/4, screenPos.y + itemSize/4, 16, 16);
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(item.stackCount, screenPos.x + itemSize/4 + 8, screenPos.y + itemSize/4 + 12);
                    }
                    
                    // Draw a floating animation
                    const floatOffset = 2 * Math.sin(time * 3 + item.x * 0.1); // Different phase for each item
                    
                    // Draw item name if player is close enough
                    if (item.isClose) {
                        ctx.fillStyle = '#fff';
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                        ctx.shadowBlur = 3;
                        ctx.fillText(item.name, screenPos.x, screenPos.y - itemSize/2 - 5 + floatOffset);
                        
                        // Draw pickup hint
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.font = '10px Arial';
                        ctx.fillText('Press E to pick up', screenPos.x, screenPos.y + itemSize/2 + 15 + floatOffset);
                    }
                    
                    ctx.restore();
                }
            }
        }
    }
    
    renderInventoryUI(ctx, inventory, player) {
        if (!inventory) return;
        
        const padding = 10;
        const itemSize = 50;
        const width = (itemSize + padding) * inventory.maxSize + padding;
        const height = itemSize + padding * 2;
        // Position at bottom-left instead of center
        const x = padding;
        const y = ctx.canvas.height - height - 20;
        
        // Store inventory position for mouse interaction
        this.inventoryUI = {
            x, y, width, height,
            itemSize, padding,
            slots: []
        };
        
        // Draw inventory background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw rounded rectangle for inventory
        this.roundRect(ctx, x, y, width, height, 10, true, true);
        
        // Draw inventory slots
        for (let i = 0; i < inventory.maxSize; i++) {
            const slotX = x + padding + i * (itemSize + padding);
            const slotY = y + padding;
            
            // Store slot position for drag and drop
            this.inventoryUI.slots[i] = {
                x: slotX,
                y: slotY,
                width: itemSize,
                height: itemSize,
                index: i
            };
            
            // Draw slot background
            ctx.fillStyle = 'rgba(50, 50, 50, 0.6)';
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            this.roundRect(ctx, slotX, slotY, itemSize, itemSize, 5, true, true);
            
            // Draw slot number
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), slotX + itemSize - 10, slotY + 15);
            
            // If there's an item in this slot, draw it
            if (i < inventory.items.length && inventory.items[i]) {
                const item = inventory.items[i];
                
                // Check if it's an Easter egg item to add special effects
                const isEasterEgg = item.id === 'easter_egg';
                
                // Don't draw the item being dragged in its original slot
                if (this.draggedItem && this.draggedItemIndex === i) {
                    // Draw a subtle indicator that this is the source slot
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
                    this.roundRect(ctx, slotX + 5, slotY + 5, itemSize - 10, itemSize - 10, 5, true, false);
                    continue;
                }
                
                // Draw special glow effect for Easter eggs
                if (isEasterEgg) {
                    // Draw pulsing glow effect
                    const time = Date.now() / 1000;
                    const pulseSize = 1 + 0.1 * Math.sin(time * 3);
                    
                    ctx.save();
                    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 2);
                    ctx.fillStyle = '#FFD700';
                    
                    // Draw star-shaped glow
                    ctx.beginPath();
                    for (let j = 0; j < 8; j++) {
                        const angle = j * Math.PI / 4;
                        const radius = j % 2 === 0 ? itemSize * 0.6 * pulseSize : itemSize * 0.3;
                        const starX = slotX + itemSize/2 + Math.cos(angle) * radius;
                        const starY = slotY + itemSize/2 + Math.sin(angle) * radius;
                        
                        if (j === 0) {
                            ctx.moveTo(starX, starY);
                        } else {
                            ctx.lineTo(starX, starY);
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                
                // Draw item image
                if (item.image) {
                    ctx.drawImage(
                        this.getItemImage(item), 
                        slotX + 5, 
                        slotY + 5, 
                        itemSize - 10, 
                        itemSize - 10
                    );
                } else {
                    // Fallback if no image
                    ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
                    this.roundRect(ctx, slotX + 5, slotY + 5, itemSize - 10, itemSize - 10, 5, true, false);
                }
                
                // Draw stack count if item is stackable and has more than 1
                if (item.stackable && item.stackCount > 1) {
                    // Background for stack count
                    ctx.fillStyle = isEasterEgg ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
                    ctx.beginPath();
                    ctx.arc(slotX + itemSize - 10, slotY + itemSize - 10, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Stack count text
                    ctx.fillStyle = isEasterEgg ? 'black' : 'white';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.stackCount, slotX + itemSize - 10, slotY + itemSize - 6);
                }
            }
        }
        
        // Draw item use progress if using an item
        if (inventory.isUsingItem && inventory.activeItemIndex >= 0) {
            const item = inventory.items[inventory.activeItemIndex];
            const slotX = x + padding + inventory.activeItemIndex * (itemSize + padding);
            const slotY = y + padding;
            
            // Progress overlay
            ctx.fillStyle = item.id === 'easter_egg' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(
                slotX, 
                slotY + itemSize * (1 - inventory.useProgress), 
                itemSize, 
                itemSize * inventory.useProgress
            );
            
            // Progress border
            ctx.strokeStyle = item.id === 'easter_egg' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(slotX, slotY, itemSize, itemSize);
            
            // Progress text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${Math.round(inventory.useProgress * 100)}%`,
                slotX + itemSize/2,
                slotY + itemSize/2 + 5
            );
        }
        
        // Draw the dragged item if it exists
        if (this.draggedItem) {
            const isEasterEgg = this.draggedItem.id === 'easter_egg';
            
            // Draw a shadow under the dragged item
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(this.dragPosition.x, this.dragPosition.y + 10, itemSize/2 - 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the item at the mouse position
            ctx.drawImage(
                this.getItemImage(this.draggedItem),
                this.dragPosition.x - (itemSize - 10)/2,
                this.dragPosition.y - (itemSize - 10)/2,
                itemSize - 10,
                itemSize - 10
            );
            
            // Draw stack count if item is stackable and has more than 1
            if (this.draggedItem.stackable && this.draggedItem.stackCount > 1) {
                // Background for stack count
                ctx.fillStyle = isEasterEgg ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(this.dragPosition.x + itemSize/2 - 15, this.dragPosition.y + itemSize/2 - 15, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Stack count text
                ctx.fillStyle = isEasterEgg ? 'black' : 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.draggedItem.stackCount, this.dragPosition.x + itemSize/2 - 15, this.dragPosition.y + itemSize/2 - 11);
            }
        }
        
        // Draw player health and shield bars
        this.renderPlayerStats(ctx, player);
        
        ctx.restore();
    }
    
    renderPlayerStats(ctx, player) {
        if (!player) return;
        
        const barWidth = 400; // Match inventory width
        const barHeight = 20;
        const padding = 10;
        
        // Position higher on the screen - move up from the bottom
        const x = padding;
        const y = ctx.canvas.height - 2 * barHeight - 3 * padding - 130; // Increased from 80 to 130 to move higher
        
        // Draw background panel for stats area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y - 25, barWidth, 2 * barHeight + 3 * padding + 15); // Include space for title
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y - 25, barWidth, 2 * barHeight + 3 * padding + 15);
        
        // Draw title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('PLAYER STATS', x + 10, y - 10);
        
        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + padding, y, barWidth - 2 * padding, barHeight);
        
        // Health bar fill - update from 100 to 200 max
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.fillRect(x + padding, y, (barWidth - 2 * padding) * (player.health / 200), barHeight);
        
        // Health bar text - show current/max
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Health: ${Math.round(player.health)}/200`, x + padding * 2, y + barHeight - 5);
        
        // Shield bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + padding, y + barHeight + padding, barWidth - 2 * padding, barHeight);
        
        // Shield bar fill - update from 100 to 200 max
        ctx.fillStyle = 'rgba(50, 150, 255, 0.8)'; // Match player shield color
        ctx.fillRect(x + padding, y + barHeight + padding, (barWidth - 2 * padding) * (player.shield / 200), barHeight);
        
        // Shield bar text - show current/max
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Shield: ${Math.round(player.shield)}/200`, x + padding * 2, y + barHeight * 2 + padding - 5);
    }
    
    renderEasterEggs(ctx, easterEggs, player) {
        for (const egg of easterEggs) {
            if (egg.collected) continue; // Skip collected eggs
            
            const eggSize = 40;
            const screenPos = this.mapRenderer.worldToScreen(egg.x, egg.y);
            
            // Calculate floating animation based on egg's own offset
            const time = Date.now() / 1000;
            const floatY = Math.sin(time * 1.5 + egg.floatOffset) * 5;
            
            // Draw egg shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                screenPos.x,
                screenPos.y + 5,
                eggSize/2.5,
                eggSize/5,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Check if player is close enough to interact with the egg
            const dx = egg.x - player.x;
            const dy = egg.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isClose = distance <= player.interactRange;
            
            // Draw egg with custom color tint
            if (this.easterEggBaseImage.complete) {
                // Apply a pulsing effect to make eggs more noticeable
                const pulseScale = 1 + 0.1 * Math.sin(time * 3);
                const scaledSize = eggSize * pulseScale;
                
                ctx.save();
                
                // Apply a glow effect based on egg color
                ctx.shadowColor = `#${egg.color}`;
                ctx.shadowBlur = 15;
                
                // Draw the egg with a colored tint
                ctx.drawImage(
                    this.easterEggBaseImage,
                    screenPos.x - scaledSize/2,
                    screenPos.y - scaledSize/2 + floatY,
                    scaledSize,
                    scaledSize
                );
                
                // Draw sparkle effect
                if (Math.random() < 0.05) {
                    this.drawSparkle(ctx, screenPos.x + (Math.random() * eggSize - eggSize/2), 
                                    screenPos.y + (Math.random() * eggSize - eggSize/2) + floatY, 
                                    2 + Math.random() * 4, 
                                    `#${egg.color}`);
                }
                
                // Draw interaction prompt if player is close
                if (isClose) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 3;
                    ctx.fillText('Easter Egg', screenPos.x, screenPos.y - eggSize/2 - 8 + floatY);
                    
                    // Draw pickup hint
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.font = '10px Arial';
                    ctx.fillText('Press E to collect', screenPos.x, screenPos.y + eggSize/2 + 15 + floatY);
                }
                
                ctx.restore();
            }
        }
    }
    
    drawSparkle(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        
        // Draw a star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const radius = i % 2 === 0 ? size : size/2;
            const angle = (i * 2 * Math.PI / 10) + Math.PI/2;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    renderEggStats(ctx, player) {
        if (!player || !player.eggStats) return;
        
        // Calculate position in top-right corner
        const padding = 15;
        const x = ctx.canvas.width - 230 - padding;
        const y = 15; // Position at top of screen
        const width = 230;
        const height = 100;
        
        // Create a hexagonal background shape for battle royale feel
        ctx.save();
        
        // Draw semi-transparent background with hexagonal shape
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.drawHexagon(ctx, x + width/2, y + height/2, width/2, height/2);
        ctx.fill();
        
        // Draw glowing border
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        this.drawHexagon(ctx, x + width/2, y + height/2, width/2, height/2);
        ctx.stroke();
        
        // Add inner border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        this.drawHexagon(ctx, x + width/2, y + height/2, width/2 - 5, height/2 - 5);
        ctx.stroke();
        
        // Calculate egg collection progress toward next damage boost
        const eggsCollected = player.eggStats.eggsCollected;
        const nextMilestone = Math.ceil(eggsCollected / 10) * 10;
        const prevMilestone = nextMilestone - 10;
        const progressToNext = (eggsCollected - prevMilestone) / 10;
        
        // Draw title with event icon
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🥚 EASTER EVENT', x + width/2, y + 25);
        
        // Draw animated gold accent line
        const time = Date.now() / 1000;
        const lineWidth = 60 + Math.sin(time * 2) * 20;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width/2 - lineWidth/2, y + 32);
        ctx.lineTo(x + width/2 + lineWidth/2, y + 32);
        ctx.stroke();
        
        // Draw egg counter with battle royale style
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`EGGS: ${eggsCollected}`, x + 25, y + 55);
        
        // Draw progress bar to next damage boost
        const barWidth = 180;
        const barHeight = 8;
        const barX = x + 25;
        const barY = y + 65;
        
        // Draw progress bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw progress indicator
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth * progressToNext, barHeight);
        
        // Add tick marks for progress visualization
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const tickX = barX + (barWidth * i / 10);
            ctx.beginPath();
            ctx.moveTo(tickX, barY);
            ctx.lineTo(tickX, barY + barHeight);
            ctx.stroke();
        }
        
        // Progress text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`NEXT BOOST: ${nextMilestone} EGGS`, x + width - 25, y + 55);
        
        // Draw damage multiplier
        const damageBoost = Math.round((player.eggStats.damageMultiplier - 1) * 100);
        
        // Draw damage boost with a more combat-focused style
        ctx.fillStyle = damageBoost > 0 ? 'rgba(255, 100, 50, 0.9)' : 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`+${damageBoost}% DMG`, x + width/2, y + 90);
        
        // Add glow effect for damage boost if it's significant
        if (damageBoost >= 10) {
            const glowIntensity = 0.3 + 0.1 * Math.sin(time * 3);
            ctx.shadowColor = 'rgba(255, 100, 50, ' + glowIntensity + ')';
            ctx.shadowBlur = 10;
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`+${damageBoost}% DMG`, x + width/2, y + 90);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
    
    // Helper method to draw hexagon shape
    drawHexagon(ctx, centerX, centerY, width, height) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angleDeg = 60 * i - 30;
            const angleRad = (Math.PI / 180) * angleDeg;
            const x = centerX + width * Math.cos(angleRad);
            const y = centerY + height * Math.sin(angleRad);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
    }

    // Helper method to get an item image
    getItemImage(item) {
        // If the item has a direct image source, use it
        if (item.image) {
            // Check if it's already an Image object
            if (item.image instanceof Image) {
                return item.image;
            }
            
            // Check if we've already created an image for this
            if (!this.itemImages) {
                this.itemImages = {};
            }
            
            // Create and cache the image if needed
            if (!this.itemImages[item.id]) {
                const img = new Image();
                img.src = item.image;
                this.itemImages[item.id] = img;
            }
            
            return this.itemImages[item.id];
        }
        
        // Default fallback image
        return null;
    }

    // Helper method to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof fill === 'undefined') {
            fill = true;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    initDragAndDrop(canvas, inventory, player, droppedItems) {
        if (!this.isDragHandlersInitialized) {
            this.draggedItem = null;
            this.draggedItemIndex = -1;
            this.dragPosition = { x: 0, y: 0 };
            
            canvas.addEventListener('mousedown', (e) => {
                if (!this.inventoryUI || !inventory) return;
                
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Check if click is within inventory
                for (let i = 0; i < this.inventoryUI.slots.length; i++) {
                    const slot = this.inventoryUI.slots[i];
                    
                    if (mouseX >= slot.x && mouseX < slot.x + slot.width &&
                        mouseY >= slot.y && mouseY < slot.y + slot.height) {
                        
                        // Found a slot that was clicked
                        if (i < inventory.items.length && inventory.items[i] && inventory.items[i].id) {
                            this.draggedItem = {...inventory.items[i]};
                            this.draggedItemIndex = i;
                            this.dragPosition = { x: mouseX, y: mouseY };
                            
                            // Set a flag to cancel item use if attempting to drag
                            inventory.cancelDrag = true;
                        }
                        break;
                    }
                }
            });
            
            canvas.addEventListener('mousemove', (e) => {
                if (this.draggedItem) {
                    const rect = canvas.getBoundingClientRect();
                    this.dragPosition = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    };
                }
            });
            
            canvas.addEventListener('mouseup', (e) => {
                if (!this.draggedItem || !inventory) return;
                
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                let itemDropped = false;
                
                // Check if dropped on another inventory slot (swap)
                if (this.inventoryUI) {
                    for (let i = 0; i < this.inventoryUI.slots.length; i++) {
                        if (i === this.draggedItemIndex) continue; // Skip same slot
                        
                        const slot = this.inventoryUI.slots[i];
                        
                        if (mouseX >= slot.x && mouseX < slot.x + slot.width &&
                            mouseY >= slot.y && mouseY < slot.y + slot.height) {
                            
                            // Make sure the dragged item index is valid
                            if (this.draggedItemIndex < 0 || this.draggedItemIndex >= inventory.items.length) {
                                console.error('Invalid draggedItemIndex:', this.draggedItemIndex);
                                break;
                            }
                            
                            // Make sure the dragged item still exists (hasn't been removed)
                            if (!inventory.items[this.draggedItemIndex]) {
                                console.error('Item at draggedItemIndex no longer exists:', this.draggedItemIndex);
                                break;
                            }
                            
                            // Swap items
                            const temp = i < inventory.items.length && inventory.items[i] ? 
                                {...inventory.items[i]} : null;
                                
                            // Create a deep copy to avoid reference issues
                            const draggedItemCopy = {...inventory.items[this.draggedItemIndex]};
                            
                            // Set the target slot
                            inventory.items[i] = draggedItemCopy;
                            
                            if (temp) {
                                inventory.items[this.draggedItemIndex] = temp;
                            } else {
                                // If target slot was empty, remove from original slot
                                inventory.items.splice(this.draggedItemIndex, 1);
                            }
                            
                            itemDropped = true;
                            break;
                        }
                    }
                }
                
                // If not dropped on another inventory slot, check if dropped outside inventory
                if (!itemDropped && this.inventoryUI && player) {
                    // Check if dropped outside inventory area
                    if (mouseX < this.inventoryUI.x || mouseX > this.inventoryUI.x + this.inventoryUI.width ||
                        mouseY < this.inventoryUI.y || mouseY > this.inventoryUI.y + this.inventoryUI.height) {
                        
                        // Make sure the dragged item index is valid
                        if (this.draggedItemIndex >= 0 && this.draggedItemIndex < inventory.items.length &&
                            inventory.items[this.draggedItemIndex]) {
                            
                            // Drop item in the world close to player
                            const dropOffsetX = (Math.random() - 0.5) * 50;
                            const dropOffsetY = (Math.random() - 0.5) * 50;
                            
                            droppedItems.push({
                                ...inventory.items[this.draggedItemIndex],
                                x: player.x + dropOffsetX,
                                y: player.y + dropOffsetY,
                                isClose: true
                            });
                            
                            // Remove from inventory
                            inventory.items.splice(this.draggedItemIndex, 1);
                        }
                    }
                }
                
                // Reset drag state
                this.draggedItem = null;
                this.draggedItemIndex = -1;
            });
            
            this.isDragHandlersInitialized = true;
        }
    }
} 