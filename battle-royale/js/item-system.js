// Item rarity levels
const RARITY = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// Item definitions
const ITEMS = {
    HP_POTION: {
        id: 'hp_potion',
        name: 'Health Potion',
        description: 'Restores 50 health',
        rarity: RARITY.COMMON,
        useTime: 2000, // ms
        stackable: true,
        maxStack: 3,
        effect: {
            type: 'heal',
            amount: 50
        },
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMjAgOGg2YTIgMiAwIDAgMSAyIDJ2OGgyYTIgMiAwIDAgMSAyIDJ2NEwzOSAzMWwzIDNjOCA4IDggMTYgMCAyNHMtMTYgOC0yNCAwbC0zLTMtNy03di0xNWEyIDIgMCAwIDEgMi0yaDJ2LThhMiAyIDAgMCAxIDItMnoiIGZpbGw9IiNGMTVBM0UiLz48cGF0aCBkPSJNMTggMTJ2LTJhMiAyIDAgMCAxIDItMmg2YTIgMiAwIDAgMSAyIDJ2MmEyIDIgMCAwIDEtMiAyaC02YTIgMiAwIDAgMS0yLTJ6IiBmaWxsPSIjQkY0RTMzIi8+PHBhdGggZD0iTTIzIDI2YzAgMS41LTEuNSAzLTMgM3MtMy0xLjUtMy0zIDEuNS0zIDMtMyAzIDEuNSAzIDN6IiBmaWxsPSIjRkZGIi8+PC9nPjwvc3ZnPg=='
    },
    SHIELD_POTION: {
        id: 'shield_potion',
        name: 'Shield Potion',
        description: 'Restores 25 shield',
        rarity: RARITY.COMMON,
        useTime: 1000, // ms
        stackable: true,
        maxStack: 3,
        effect: {
            type: 'shield',
            amount: 25
        },
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMjAgOGg2YTIgMiAwIDAgMSAyIDJ2OGgyYTIgMiAwIDAgMSAyIDJ2NEwzOSAzMWwzIDNjOCA4IDggMTYgMCAyNHMtMTYgOC0yNCAwbC0zLTMtNy03di0xNWEyIDIgMCAwIDEgMi0yaDJ2LThhMiAyIDAgMCAxIDItMnoiIGZpbGw9IiM0QTkwRTIiLz48cGF0aCBkPSJNMTggMTJ2LTJhMiAyIDAgMCAxIDItMmg2YTIgMiAwIDAgMSAyIDJ2MmEyIDIgMCAwIDEtMiAyaC02YTIgMiAwIDAgMS0yLTJ6IiBmaWxsPSIjMzg3MUI4Ii8+PHBhdGggZD0iTTIzIDI2YzAgMS41LTEuNSAzLTMgM3MtMy0xLjUtMy0zIDEuNS0zIDMtMyAzIDEuNSAzIDN6IiBmaWxsPSIjRkZGIi8+PC9nPjwvc3ZnPg=='
    },
    EASTER_EGG: {
        id: 'easter_egg',
        name: 'Easter Egg',
        description: 'Restores 5 shield and increases damage',
        rarity: RARITY.UNCOMMON,
        useTime: 500, // ms - quick to use
        stackable: true,
        maxStack: 5,
        effect: {
            type: 'easter_egg',
            amount: 5 // 5 shield
        },
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48ZWxsaXBzZSBjeD0iMzIiIGN5PSIzNiIgcng9IjIwIiByeT0iMjQiIGZpbGw9IiNGRkYiLz48ZWxsaXBzZSBjeD0iMzIiIGN5PSIzNiIgcng9IjE4IiByeT0iMjIiIGZpbGw9IiNGRkM3RDQiLz48cGF0aCBkPSJNMjYgMjRjMy02IDYtMTAgMTItNyIgc3Ryb2tlPSIjODA1QUQ1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGZpbGw9IiM4MDVBRDUiIGQ9Ik0yMiAzNmw0IDQgNCAxTTMyIDQybDUgNE00MCAzNGw1IC0yIi8+PHBhdGggZmlsbD0iIzVCRDFFQiIgZD0iTTI0IDMwbDQgLTJNMzIgMjhsMyAzTTM4IDQwbC0yIDQiLz48cGF0aCBmaWxsPSIjRkY5ODAwIiBkPSJNMzAgNDRsLTQgLTEwTTQwIDMwbC01IDEwIi8+PC9nPjwvc3ZnPg=='
    }
};

// Chest class
class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.items = [];
        this.generateItems();
    }

    generateItems() {
        // Generate 1-4 random items
        const itemCount = 1 + Math.floor(Math.random() * 4);
        const itemPool = [ITEMS.HP_POTION, ITEMS.SHIELD_POTION];
        
        for (let i = 0; i < itemCount; i++) {
            const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
            const item = {...randomItem}; // Clone the item
            item.stackCount = 1; // Initialize stack count
            this.items.push(item);
        }
        
        // 5% chance to drop an Easter egg if the Easter event is active
        if (Math.random() < 0.05) {
            const easterEgg = {...ITEMS.EASTER_EGG};
            easterEgg.stackCount = 1;
            this.items.push(easterEgg);
        }
    }

    open() {
        if (this.isOpen) return [];
        this.isOpen = true;
        return [...this.items]; // Return items and clear chest
    }
}

// Easter Egg class for the Easter event
class EasterEgg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.spawnTime = Date.now();
        
        // Randomly select one of several egg colors
        const eggColors = [
            'FF9800', // Orange
            '4CAF50', // Green
            '2196F3', // Blue
            'E91E63', // Pink
            '9C27B0', // Purple
            'FFEB3B'  // Yellow
        ];
        
        this.color = eggColors[Math.floor(Math.random() * eggColors.length)];
        
        // Create a floating animation offset
        this.floatOffset = Math.random() * Math.PI * 2; // Random starting phase
    }
    
    collect() {
        if (this.collected) return null;
        this.collected = true;
        
        // Return a copy of the Easter egg item
        return {...ITEMS.EASTER_EGG};
    }
    
    update(deltaTime) {
        // Update floating animation
        this.floatOffset += deltaTime * 0.002;
        
        // Eggs disappear after 90 seconds if not collected (reduced from 120 seconds)
        if (Date.now() - this.spawnTime > 90000) {
            return true; // Return true to indicate egg should be removed
        }
        
        return false;
    }
}

// Inventory class for player
class Inventory {
    constructor(maxSize = 6) {
        this.items = [];
        this.maxSize = maxSize;
        this.activeItemIndex = -1;
        this.useProgress = 0;
        this.isUsingItem = false;
        this.useStartTime = 0;
        this.cancelDrag = false; // Flag to prevent item use when drag starts
    }

    addItem(item) {
        // Check if item is valid
        if (!item || typeof item !== 'object') {
            console.error('Invalid item passed to inventory.addItem:', item);
            return false;
        }
        
        // Ensure item has required properties
        if (!item.id) {
            console.error('Item missing id property:', item);
            return false;
        }
        
        // Try to stack if item is stackable
        if (item.stackable) {
            for (let i = 0; i < this.items.length; i++) {
                const existingItem = this.items[i];
                // Check if existing item is valid and has an id
                if (!existingItem || !existingItem.id) continue;
                
                // Check if the item is of the same type and not at max stack
                if (existingItem.id === item.id && existingItem.stackCount < existingItem.maxStack) {
                    // Stack the item
                    existingItem.stackCount = (existingItem.stackCount || 1) + (item.stackCount || 1);
                    
                    // Cap at max stack size
                    if (existingItem.stackCount > existingItem.maxStack) {
                        // Create a new item with the overflow
                        const overflow = {
                            ...item,
                            stackCount: existingItem.stackCount - existingItem.maxStack
                        };
                        existingItem.stackCount = existingItem.maxStack;
                        
                        // Try to add the overflow as a new item
                        if (this.items.length < this.maxSize) {
                            this.items.push(overflow);
                            return true;
                        } else {
                            // Return overflow to the ground
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
        
        // If we couldn't stack or item isn't stackable, add as new item
        if (this.items.length < this.maxSize) {
            // Make sure item has a stack count if stackable
            if (item.stackable && !item.stackCount) {
                item.stackCount = 1;
            }
            this.items.push(item);
            return true;
        }
        
        return false; // Inventory full
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            
            // If item is stacked, reduce the stack
            if (item.stackable && item.stackCount > 1) {
                item.stackCount--;
                // Create a copy of the item with stack count of 1
                const removedItem = {...item, stackCount: 1};
                return removedItem;
            } else {
                // Remove the entire item
                return this.items.splice(index, 1)[0];
            }
        }
        return null;
    }

    startUseItem(index) {
        if (index >= 0 && index < this.items.length && !this.isUsingItem) {
            // If we just tried to drag the item, don't use it
            if (this.cancelDrag) {
                this.cancelDrag = false;
                return false;
            }
            
            this.activeItemIndex = index;
            this.isUsingItem = true;
            this.useStartTime = Date.now();
            this.useProgress = 0;
            return true;
        }
        return false;
    }

    updateUseProgress() {
        if (!this.isUsingItem) return 0;
        
        const item = this.items[this.activeItemIndex];
        const elapsed = Date.now() - this.useStartTime;
        this.useProgress = Math.min(1, elapsed / item.useTime);
        
        if (this.useProgress >= 1) {
            return true; // Item use complete
        }
        return false;
    }

    cancelUse() {
        this.isUsingItem = false;
        this.activeItemIndex = -1;
        this.useProgress = 0;
    }

    completeUse() {
        if (!this.isUsingItem) return null;
        
        const item = this.removeItem(this.activeItemIndex);
        this.isUsingItem = false;
        this.activeItemIndex = -1;
        this.useProgress = 0;
        
        return item; // Return item for applying effect
    }
}

// New function to extend Player class with egg collection mechanics
function initializeEggCollection(player) {
    // Initialize egg collection properties if they don't exist
    if (player.eggStats === undefined) {
        player.eggStats = {
            eggsCollected: 0,
            damageMultiplier: 1.0,
            lastEggTime: 0
        };
    }
    
    // Method to handle collecting an egg
    player.collectEgg = function() {
        this.eggStats.eggsCollected++;
        this.eggStats.lastEggTime = Date.now();
        
        // Every 10 eggs collected, increase damage by 5%
        if (this.eggStats.eggsCollected % 10 === 0) {
            this.eggStats.damageMultiplier += 0.05;
            return true; // Return true to indicate a damage boost was earned
        }
        
        return false; // No damage boost earned
    };
    
    // Method to get current damage multiplier
    player.getDamageMultiplier = function() {
        return this.eggStats.damageMultiplier;
    };
    
    return player;
} 