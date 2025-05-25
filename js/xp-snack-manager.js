// XP Snack Manager - Handles XP Snack items for leveling up monsters
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { levelUpManager } from '../Monsters/level_up_manager.js';

export class XPSnackManager {
    constructor() {
        this.auth = getAuth();
        this.database = getDatabase();
    }

    // Get user's current XP Snack count
    async getXPSnackCount(userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                console.warn('No user ID provided for XP Snack count check');
                return 0;
            }

            const userRef = ref(this.database, `users/${currentUserId}/items/xp_snacks`);
            const snapshot = await get(userRef);
            
            return snapshot.exists() ? snapshot.val() : 0;
        } catch (error) {
            console.error('Error getting XP Snack count:', error);
            return 0;
        }
    }

    // Use an XP Snack on a monster
    async useXPSnack(monster, userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                throw new Error('No authenticated user found');
            }

            if (!monster || !monster.uid) {
                throw new Error('Invalid monster provided');
            }

            // Check if user has XP Snacks
            const currentXPSnacks = await this.getXPSnackCount(currentUserId);
            if (currentXPSnacks <= 0) {
                throw new Error('No XP Snacks available');
            }

            // Ensure monster has all required properties initialized
            if (!monster.level) monster.level = 1;
            
            // Handle XP migration: old system used 'xp' field, new system uses 'experience'
            if (!monster.experience && monster.xp) {
                monster.experience = monster.xp;
                console.log(`🔄 Migrating XP: ${monster.xp} -> experience field for ${monster.name}`);
            }
            
            // Handle starting level mismatch: monsters start at level 5 but with 0 XP
            if (!monster.experience || monster.experience === 0) {
                const startingLevel = monster.level || 5;
                if (startingLevel > 1) {
                    // Set XP to match the starting level
                    monster.experience = levelUpManager.getXPForLevel(startingLevel);
                    console.log(`🎯 Setting starting XP for Level ${startingLevel} ${monster.name}: ${monster.experience} XP`);
                } else {
                    monster.experience = 0;
                }
            }
            
            if (!monster.stats) monster.stats = { ...monster.baseStats };
            if (!monster.maxHP) {
                // Calculate maxHP based on HP stat if not present
                monster.maxHP = monster.stats.hp || 50;
            }
            if (!monster.currentHP) monster.currentHP = monster.maxHP;

            // Calculate XP gain from snack (scales with monster level)
            const baseXP = 200; // Increased base XP
            const levelMultiplier = Math.max(1, monster.level * 0.8); // Better scaling
            const xpGained = Math.floor(baseXP * levelMultiplier);

            // Award XP to monster
            const oldLevel = monster.level;
            const oldXP = monster.experience || 0;
            
            console.log('🍬 XP Snack Debug:');
            console.log(`Monster: ${monster.name} (Level ${oldLevel})`);
            console.log(`Current XP: ${oldXP}`);
            console.log(`XP to gain: ${xpGained}`);
            console.log(`XP needed for next level: ${levelUpManager.getXPForLevel(oldLevel + 1) - oldXP}`);
            
            const result = levelUpManager.awardXP(monster, xpGained);
            
            console.log('🎯 XP Award Result:');
            console.log(`New Level: ${result.newLevel} (was ${result.oldLevel})`);
            console.log(`New XP: ${result.newXP} (was ${result.oldXP})`);
            console.log(`Levels gained: ${result.levelsGained}`);
            console.log(`Monster object after award:`, {
                level: monster.level,
                experience: monster.experience,
                maxHP: monster.maxHP
            });

            // Ensure all properties are defined before saving
            const safeMonsterData = {
                level: monster.level || 1,
                experience: monster.experience || 0,
                stats: monster.stats || { ...monster.baseStats },
                maxHP: monster.maxHP || monster.stats?.hp || 50,
                currentHP: monster.currentHP || monster.maxHP || monster.stats?.hp || 50
            };

            // Debug logging to ensure no undefined values
            console.log('🔍 Monster data before save:', {
                uid: monster.uid,
                name: monster.name,
                level: safeMonsterData.level,
                experience: safeMonsterData.experience,
                maxHP: safeMonsterData.maxHP,
                currentHP: safeMonsterData.currentHP,
                hasStats: !!safeMonsterData.stats
            });

            // Prepare Firebase updates
            const updates = {};
            
            // Reduce XP Snack count
            updates[`users/${currentUserId}/items/xp_snacks`] = currentXPSnacks - 1;
            
            // Update monster data with safe values
            updates[`users/${currentUserId}/monsters/${monster.uid}/level`] = safeMonsterData.level;
            updates[`users/${currentUserId}/monsters/${monster.uid}/experience`] = safeMonsterData.experience;
            updates[`users/${currentUserId}/monsters/${monster.uid}/stats`] = safeMonsterData.stats;
            updates[`users/${currentUserId}/monsters/${monster.uid}/maxHP`] = safeMonsterData.maxHP;
            updates[`users/${currentUserId}/monsters/${monster.uid}/currentHP`] = safeMonsterData.currentHP;
            
            // Remove old XP field if it exists (migration cleanup)
            if (monster.xp !== undefined) {
                updates[`users/${currentUserId}/monsters/${monster.uid}/xp`] = null;
                console.log(`🗑️ Removing old XP field for ${monster.name}`);
            }

            // Apply all updates atomically
            await update(ref(this.database), updates);

            return {
                success: true,
                xpGained: xpGained,
                oldLevel: oldLevel,
                newLevel: monster.level,
                levelsGained: result.levelsGained,
                oldXP: oldXP,
                newXP: monster.experience,
                statIncreases: result.statIncreases,
                remainingSnacks: currentXPSnacks - 1,
                messages: this.formatXPSnackMessages(monster, result)
            };

        } catch (error) {
            console.error('Error using XP Snack:', error);
            return {
                success: false,
                error: error.message,
                xpGained: 0,
                levelsGained: 0,
                remainingSnacks: await this.getXPSnackCount(userId)
            };
        }
    }

    // Format messages for XP Snack usage
    formatXPSnackMessages(monster, result) {
        const messages = [];
        
        messages.push(`🍬 Used XP Snack on ${monster.name}!`);
        messages.push(`💫 ${monster.name} gained ${result.xpGained} XP!`);
        
        if (result.levelsGained > 0) {
            messages.push(`🎉 ${monster.name} reached level ${result.newLevel}!`);
            
            if (result.statIncreases) {
                const statNames = {
                    hp: 'HP',
                    attack: 'Attack',
                    defense: 'Defense',
                    specialAttack: 'Sp. Attack',
                    specialDefense: 'Sp. Defense',
                    speed: 'Speed'
                };
                
                const increases = [];
                for (const [stat, increase] of Object.entries(result.statIncreases)) {
                    if (increase > 0) {
                        increases.push(`${statNames[stat]} +${increase}`);
                    }
                }
                
                if (increases.length > 0) {
                    messages.push(`📈 ${increases.join(', ')}`);
                }
            }
            
            messages.push(`🏥 ${monster.name} recovered some HP!`);
        }
        
        return messages;
    }

    // Add XP Snacks to user's inventory (for admin/testing purposes)
    async addXPSnacks(count, userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                throw new Error('No authenticated user found');
            }

            const currentCount = await this.getXPSnackCount(currentUserId);
            const newCount = currentCount + count;

            const updates = {};
            updates[`users/${currentUserId}/items/xp_snacks`] = newCount;

            await update(ref(this.database), updates);

            return {
                success: true,
                oldCount: currentCount,
                newCount: newCount,
                added: count
            };

        } catch (error) {
            console.error('Error adding XP Snacks:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all user items (for UI display)
    async getUserItems(userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                return { xp_snacks: 0 };
            }

            const userRef = ref(this.database, `users/${currentUserId}/items`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return { xp_snacks: 0 };
            }
        } catch (error) {
            console.error('Error getting user items:', error);
            return { xp_snacks: 0 };
        }
    }
}

// Create singleton instance
export const xpSnackManager = new XPSnackManager(); 