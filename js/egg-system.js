// Egg System for Monster Fighters
import { ref, get, set, push, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

// Egg rarity definitions
export const EGG_RARITIES = {
    COMMON: {
        name: 'Common',
        color: '#9E9E9E',
        hatchTime: 10 * 60 * 1000, // 10 minutes in milliseconds
        ivBonus: { min: 0, max: 5 },
        weight: 50
    },
    UNCOMMON: {
        name: 'Uncommon',
        color: '#4CAF50',
        hatchTime: 30 * 60 * 1000, // 30 minutes
        ivBonus: { min: 3, max: 10 },
        weight: 30
    },
    RARE: {
        name: 'Rare',
        color: '#2196F3',
        hatchTime: 2 * 60 * 60 * 1000, // 2 hours
        ivBonus: { min: 8, max: 15 },
        weight: 15
    },
    EPIC: {
        name: 'Epic',
        color: '#9C27B0',
        hatchTime: 6 * 60 * 60 * 1000, // 6 hours
        ivBonus: { min: 12, max: 20 },
        weight: 4
    },
    LEGENDARY: {
        name: 'Legendary',
        color: '#FF9800',
        hatchTime: 24 * 60 * 60 * 1000, // 24 hours
        ivBonus: { min: 18, max: 25 },
        weight: 1
    },
    MYTHICAL: {
        name: 'Mythical',
        color: '#E91E63',
        hatchTime: 48 * 60 * 60 * 1000, // 48 hours
        ivBonus: { min: 25, max: 31 },
        weight: 0.1
    }
};

// Egg type to monster mapping
export const EGG_TYPE_MONSTERS = {
    WATER: ['mizuryon', 'pechac', 'maquatic', 'nerephal'],
    FIRE: ['scorchlete', 'smouldimp', 'hauntorch'],
    GRASS: ['bunburrow', 'nymaria', 'cryorose'],
    ELECTRIC: ['buzzy', 'lumillow'],
    ICE: ['shiverion', 'crymora'],
    GROUND: ['ratastrophe'],
    NORMAL: ['blobby', 'peepuff', 'puffsqueak'],
    FLYING: ['crisilla', 'sharx']
};

// Egg booster types
export const EGG_BOOSTERS = {
    IV_BOOSTER: {
        name: 'IV Enhancer',
        description: 'Increases the IV potential of the monster inside the egg',
        price: { FM: 2500, CM: 15000 },
        effect: 'iv_boost',
        value: 10 // Adds 10 to IV bonus range
    },
    TIME_BOOSTER: {
        name: 'Hatch Accelerator',
        description: 'Halves the remaining hatch time of an egg',
        price: { FM: 1500, CM: 8000 },
        effect: 'time_reduction',
        value: 0.5 // Multiplies remaining time by 0.5
    }
};

export class EggSystem {
    constructor() {
        this.userUID = null;
        this.userEggs = [];
        this.hatchTimers = new Map();
    }

    setUserID(userId) {
        this.userUID = userId;
        this.loadUserEggs();
    }

    // Generate random rarity based on weights
    generateRandomRarity() {
        const totalWeight = Object.values(EGG_RARITIES).reduce((sum, rarity) => sum + rarity.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [key, rarity] of Object.entries(EGG_RARITIES)) {
            random -= rarity.weight;
            if (random <= 0) {
                return key;
            }
        }
        
        return 'COMMON'; // Fallback
    }

    // Create a new egg
    async createEgg(type, rarity = null, userId = null) {
        const targetUserId = userId || this.userUID;
        if (!targetUserId) {
            throw new Error('No user ID provided for egg creation');
        }

        const eggRarity = rarity || this.generateRandomRarity();
        const rarityData = EGG_RARITIES[eggRarity];
        
        const egg = {
            id: `egg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            rarity: eggRarity,
            createdAt: Date.now(),
            hatchTime: Date.now() + rarityData.hatchTime,
            isHatched: false,
            boosters: {
                ivBoost: 0,
                timeReduction: 1.0
            }
        };

        // Save to Firebase
        const eggRef = ref(window.firebaseDatabase, `users/${targetUserId}/eggs/${egg.id}`);
        await set(eggRef, egg);

        console.log(`🥚 Created ${eggRarity} ${type} egg for user ${targetUserId}`);
        
        // Reload user eggs if this is for the current user
        if (targetUserId === this.userUID) {
            await this.loadUserEggs();
        }

        return egg;
    }

    // Load user's eggs from Firebase
    async loadUserEggs() {
        if (!this.userUID || !window.firebaseDatabase) return;

        try {
            const eggsRef = ref(window.firebaseDatabase, `users/${this.userUID}/eggs`);
            const snapshot = await get(eggsRef);
            const eggsData = snapshot.val() || {};
            
            this.userEggs = Object.values(eggsData).filter(egg => !egg.isHatched);
            
            // Start timers for eggs that aren't hatched
            this.startHatchTimers();
            
            console.log(`🥚 Loaded ${this.userEggs.length} eggs for user`);
            
        } catch (error) {
            console.error('❌ Error loading user eggs:', error);
        }
    }

    // Start hatch timers for all eggs
    startHatchTimers() {
        // Clear existing timers
        this.hatchTimers.forEach(timer => clearInterval(timer));
        this.hatchTimers.clear();

        this.userEggs.forEach(egg => {
            if (!egg.isHatched && egg.hatchTime > Date.now()) {
                this.startSingleHatchTimer(egg);
            }
        });
    }

    // Start timer for a single egg
    startSingleHatchTimer(egg) {
        const checkInterval = setInterval(() => {
            const now = Date.now();
            
            if (now >= egg.hatchTime) {
                clearInterval(checkInterval);
                this.hatchTimers.delete(egg.id);
                this.triggerEggHatch(egg);
            }
        }, 1000); // Check every second

        this.hatchTimers.set(egg.id, checkInterval);
    }

    // Trigger egg hatching
    async triggerEggHatch(egg) {
        try {
            // Generate monster from egg
            const monster = await this.generateMonsterFromEgg(egg);
            
            // Add monster to user collection using direct Firebase method
            const monsterAdded = await this.addMonsterToUserCollection(monster);
            
            if (!monsterAdded) {
                console.error('❌ Failed to add hatched monster to collection');
                return;
            }

            // Mark egg as hatched
            const eggRef = ref(window.firebaseDatabase, `users/${this.userUID}/eggs/${egg.id}`);
            await update(eggRef, { 
                isHatched: true, 
                hatchedAt: Date.now(),
                hatchedMonster: monster
            });

            // Remove from active eggs
            this.userEggs = this.userEggs.filter(e => e.id !== egg.id);

            // Trigger UI notification
            this.showHatchNotification(egg, monster);

            console.log(`🐣 Egg ${egg.id} hatched into ${monster.species}!`);

        } catch (error) {
            console.error('❌ Error hatching egg:', error);
        }
    }

    // Generate monster from egg with enhanced IVs
    generateMonsterFromEgg(egg) {
        const rarityData = EGG_RARITIES[egg.rarity];
        const possibleMonsters = EGG_TYPE_MONSTERS[egg.type];
        
        if (!possibleMonsters || possibleMonsters.length === 0) {
            throw new Error(`No monsters available for egg type: ${egg.type}`);
        }

        // Random monster from type
        const species = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];

        // Generate enhanced IVs
        const ivs = {};
        const statNames = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
        
        statNames.forEach(stat => {
            const baseIV = Math.floor(Math.random() * 32); // 0-31 base IV
            const bonus = Math.floor(Math.random() * (rarityData.ivBonus.max - rarityData.ivBonus.min + 1)) + rarityData.ivBonus.min;
            const boostedBonus = bonus + egg.boosters.ivBoost;
            
            ivs[stat] = Math.min(31, baseIV + boostedBonus); // Cap at 31
        });

        return {
            species: species,
            level: 1,
            xp: 0,
            ivs: ivs,
            nature: this.generateRandomNature(),
            fromEgg: true,
            eggRarity: egg.rarity,
            hatchedAt: Date.now()
        };
    }

    // Generate random nature (placeholder for future nature system)
    generateRandomNature() {
        const natures = ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax'];
        return natures[Math.floor(Math.random() * natures.length)];
    }

    // Add hatched monster to user's collection in Firebase
    async addMonsterToUserCollection(monster) {
        if (!this.userUID || !window.firebaseDatabase) {
            console.error('❌ Cannot add monster: No user ID or Firebase database');
            return false;
        }

        try {
            // Import Firebase functions
            const { ref, push, set, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js');
            
            // Create reference to user's monsters collection
            const userMonstersRef = ref(window.firebaseDatabase, `users/${this.userUID}/monsters`);
            const newMonsterRef = push(userMonstersRef);
            
            // Generate unique ID for the monster
            const uniqueId = `monster_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            
            // Prepare monster data for Firebase
            const monsterData = {
                monsterId: monster.species,
                uniqueId: uniqueId,
                dateAcquired: serverTimestamp(),
                level: monster.level || 1,
                experience: monster.xp || 0,
                ivs: monster.ivs,
                nature: monster.nature,
                // Egg-specific data
                fromEgg: true,
                eggRarity: monster.eggRarity,
                hatchedAt: monster.hatchedAt
            };

            // Save to Firebase
            await set(newMonsterRef, monsterData);
            
            console.log(`✅ Added hatched monster to collection: ${monster.species} (${monster.eggRarity} rarity)`);
            console.log(`📊 Monster stats - Level: ${monster.level}, IVs:`, monster.ivs);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error adding monster to collection:', error);
            return false;
        }
    }

    // Apply booster to egg
    async applyBoosterToEgg(eggId, boosterType) {
        if (!this.userUID) return false;

        const egg = this.userEggs.find(e => e.id === eggId);
        if (!egg) return false;

        const booster = EGG_BOOSTERS[boosterType];
        if (!booster) return false;

        try {
            // Apply booster effect
            if (booster.effect === 'iv_boost') {
                egg.boosters.ivBoost += booster.value;
            } else if (booster.effect === 'time_reduction') {
                // Calculate current remaining time
                const now = Date.now();
                const currentRemainingTime = Math.max(0, egg.hatchTime - now);
                
                // Apply reduction to remaining time only
                const reducedRemainingTime = currentRemainingTime * booster.value;
                
                // Set new hatch time = current time + reduced remaining time
                const oldHatchTime = egg.hatchTime;
                egg.hatchTime = now + reducedRemainingTime;
                
                // Update the time reduction tracker (for display purposes)
                egg.boosters.timeReduction *= booster.value;
                
                // Log the time reduction for debugging
                console.log(`⏰ Time Accelerator applied to egg ${eggId}:`);
                console.log(`  - Original remaining time: ${Math.floor(currentRemainingTime / 1000)}s`);
                console.log(`  - Reduced remaining time: ${Math.floor(reducedRemainingTime / 1000)}s`);
                console.log(`  - Time saved: ${Math.floor((currentRemainingTime - reducedRemainingTime) / 1000)}s`);
                
                // Restart timer with new time
                if (this.hatchTimers.has(eggId)) {
                    clearInterval(this.hatchTimers.get(eggId));
                    this.hatchTimers.delete(eggId);
                }
                this.startSingleHatchTimer(egg);
            }

            // Update in Firebase
            const eggRef = ref(window.firebaseDatabase, `users/${this.userUID}/eggs/${eggId}`);
            await update(eggRef, { 
                boosters: egg.boosters,
                hatchTime: egg.hatchTime // Save the updated hatch time
            });

            console.log(`🚀 Applied ${booster.name} to egg ${eggId}`);
            return true;

        } catch (error) {
            console.error('❌ Error applying booster:', error);
            return false;
        }
    }

    // Get time remaining for egg
    getTimeRemaining(egg) {
        const now = Date.now();
        // Use the actual hatch time (already adjusted by boosters)
        const remaining = Math.max(0, egg.hatchTime - now);
        
        return {
            total: remaining,
            days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
            hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remaining % (1000 * 60)) / 1000)
        };
    }

    // Format time remaining as string
    formatTimeRemaining(egg) {
        const time = this.getTimeRemaining(egg);
        
        if (time.total <= 0) return 'Ready to hatch!';
        
        if (time.days > 0) {
            return `${time.days}d ${time.hours}h ${time.minutes}m`;
        } else if (time.hours > 0) {
            return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
        } else if (time.minutes > 0) {
            return `${time.minutes}m ${time.seconds}s`;
        } else {
            return `${time.seconds}s`;
        }
    }

    // Show hatch notification
    showHatchNotification(egg, monster) {
        const rarityData = EGG_RARITIES[egg.rarity];
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'egg-hatch-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border: 4px solid ${rarityData.color};
            border-radius: 15px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            color: white;
            text-align: center;
            box-shadow: 0 0 30px ${rarityData.color}50;
            z-index: 10000;
            font-family: 'Press Start 2P', monospace;
            animation: hatchSlideIn 0.5s ease-out;
        `;
        
        // Calculate average IV for display
        const avgIV = Math.round(Object.values(monster.ivs).reduce((sum, iv) => sum + iv, 0) / 6);
        
        notification.innerHTML = `
            <div class="hatch-content">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🐣</div>
                <h3 style="color: ${rarityData.color}; margin-bottom: 1rem; font-size: 1.1rem;">Egg Hatched!</h3>
                <p style="margin-bottom: 1.5rem; font-size: 0.7rem;">Your ${rarityData.name} ${egg.type} egg hatched into:</p>
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                ">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🐾</div>
                    <h4 style="color: #FFD700; margin-bottom: 0.5rem; font-size: 1rem;">
                        ${monster.species.charAt(0).toUpperCase() + monster.species.slice(1)}
                    </h4>
                    <div style="font-size: 0.6rem; color: #B0B0B0; line-height: 1.4;">
                        <div>Level ${monster.level} • ${monster.nature} Nature</div>
                        <div>Average IV: ${avgIV}/31 ${avgIV >= 25 ? '⭐' : avgIV >= 20 ? '✨' : ''}</div>
                        <div style="color: ${rarityData.color};">From ${rarityData.name} Egg</div>
                    </div>
                </div>
                <p style="margin-bottom: 1.5rem; font-size: 0.6rem; color: #E0E0E0;">
                    Monster added to your collection!
                </p>
                <button onclick="this.parentElement.remove()" style="
                    background: linear-gradient(45deg, ${rarityData.color}, #2196F3);
                    border: none;
                    color: white;
                    padding: 0.8rem 1.5rem;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 0.7rem;
                    cursor: pointer;
                    border-radius: 10px;
                    transition: all 0.3s ease;
                    border: 2px solid ${rarityData.color};
                ">
                    Collect Monster
                </button>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes hatchSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8) rotateY(90deg);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1) rotateY(0deg);
                }
            }
        `;
        document.head.appendChild(style);

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 15000);
    }

    // Get user's eggs
    getUserEggs() {
        return this.userEggs;
    }

    // Check if user has received their beginner egg
    async hasReceivedBeginnerEgg() {
        if (!this.userUID) return false;

        try {
            const beginnerEggRef = ref(window.firebaseDatabase, `users/${this.userUID}/beginnerEgg`);
            const snapshot = await get(beginnerEggRef);
            return snapshot.val() === true;
        } catch (error) {
            console.error('❌ Error checking beginner egg status:', error);
            return false;
        }
    }

    // Award beginner egg to new users
    async awardBeginnerEgg() {
        if (!this.userUID) return false;

        try {
            // Check if already received
            const hasReceived = await this.hasReceivedBeginnerEgg();
            if (hasReceived) {
                console.log('🥚 User has already received beginner egg');
                return false;
            }

            // Generate random type and rarity for beginner egg
            const eggTypes = Object.keys(EGG_TYPE_MONSTERS);
            const randomType = eggTypes[Math.floor(Math.random() * eggTypes.length)];
            const randomRarity = this.generateRandomRarity();

            // Create the beginner egg
            const beginnerEgg = await this.createEgg(randomType, randomRarity, this.userUID);

            // Mark that user has received their beginner egg
            const beginnerEggRef = ref(window.firebaseDatabase, `users/${this.userUID}/beginnerEgg`);
            await set(beginnerEggRef, true);

            // Show notification
            this.showBeginnerEggNotification(beginnerEgg);

            console.log(`🎉 Awarded beginner ${randomRarity} ${randomType} egg to user ${this.userUID}`);
            return beginnerEgg;

        } catch (error) {
            console.error('❌ Error awarding beginner egg:', error);
            return false;
        }
    }

    // Show beginner egg notification
    showBeginnerEggNotification(egg) {
        const rarityData = EGG_RARITIES[egg.rarity];
        
        // Create notification modal
        const modal = document.createElement('div');
        modal.className = 'beginner-egg-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Press Start 2P', monospace;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                border: 4px solid ${rarityData.color};
                border-radius: 15px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                color: white;
                text-align: center;
                box-shadow: 0 0 30px ${rarityData.color}50;
                animation: modalSlideIn 0.5s ease-out;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="color: ${rarityData.color}; margin-bottom: 1rem; font-size: 1.2rem;">
                    Welcome to Monster Fighters!
                </h2>
                <p style="margin-bottom: 1.5rem; font-size: 0.8rem; line-height: 1.6;">
                    As a new trainer, you've received a special beginner egg!
                </p>
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                ">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🥚</div>
                    <div style="color: ${rarityData.color}; font-weight: bold; margin-bottom: 0.5rem;">
                        ${rarityData.name} ${egg.type} Egg
                    </div>
                    <div style="font-size: 0.7rem; color: #B0B0B0;">
                        Hatch Time: ${this.formatTimeRemaining(egg)}
                    </div>
                </div>
                <p style="margin-bottom: 1.5rem; font-size: 0.7rem; color: #E0E0E0;">
                    Visit the Egg Collection to watch your egg hatch and meet your first monster!
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.href='egg-collection.html'" style="
                        background: linear-gradient(45deg, ${rarityData.color}, #2196F3);
                        border: none;
                        color: white;
                        padding: 0.8rem 1.5rem;
                        font-family: 'Press Start 2P', monospace;
                        font-size: 0.7rem;
                        cursor: pointer;
                        border-radius: 10px;
                        transition: all 0.3s ease;
                        border: 2px solid ${rarityData.color};
                    ">
                        View Egg Collection
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: linear-gradient(45deg, #666, #888);
                        border: none;
                        color: white;
                        padding: 0.8rem 1.5rem;
                        font-family: 'Press Start 2P', monospace;
                        font-size: 0.7rem;
                        cursor: pointer;
                        border-radius: 10px;
                        transition: all 0.3s ease;
                        border: 2px solid #888;
                    ">
                        Continue
                    </button>
                </div>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(modal);

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }

    // Check if user can receive daily Kotal Kahn egg
    async canReceiveDailyEgg() {
        if (!this.userUID) return false;

        try {
            const lastEggRef = ref(window.firebaseDatabase, `users/${this.userUID}/lastKotalKahnEgg`);
            const snapshot = await get(lastEggRef);
            const lastEggTime = snapshot.val() || 0;
            
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            return (now - lastEggTime) >= oneDayMs;
        } catch (error) {
            console.error('❌ Error checking daily egg eligibility:', error);
            return false;
        }
    }

    // Award daily Kotal Kahn egg
    async awardDailyKotalKahnEgg() {
        if (!this.userUID) return false;

        try {
            const canReceive = await this.canReceiveDailyEgg();
            if (!canReceive) {
                return false;
            }

            // Create water egg
            await this.createEgg('WATER');

            // Update last egg time
            const lastEggRef = ref(window.firebaseDatabase, `users/${this.userUID}/lastKotalKahnEgg`);
            await set(lastEggRef, Date.now());

            console.log('🏆 Awarded daily Kotal Kahn water egg');
            return true;

        } catch (error) {
            console.error('❌ Error awarding daily egg:', error);
            return false;
        }
    }
}

// Global egg system instance
export const eggSystem = new EggSystem();

// Make it available globally
window.EggSystem = eggSystem; 