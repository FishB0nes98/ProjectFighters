// Trainer Rewards System - Handle rewards for defeating trainers
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

export class TrainerRewardSystem {
    constructor() {
        this.auth = getAuth();
        this.database = getDatabase();
    }

    // Award rewards for defeating a trainer
    async awardTrainerRewards(trainer, userId = null) {
        try {
            // Use provided userId or get current user
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                throw new Error('No authenticated user found');
            }

            // Calculate rewards from trainer
            const rewards = trainer.calculateRewards();
            
            // Get current user data
            const userRef = ref(this.database, `users/${currentUserId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val() || {};

            // Prepare updates
            const updates = {};
            const rewardMessages = [];

            // Award CM
            if (rewards.cm > 0) {
                const currentCM = userData.CM || 0;
                updates[`users/${currentUserId}/CM`] = currentCM + rewards.cm;
                rewardMessages.push(`💰 ${rewards.cm} CM`);
            }

            // Award items
            if (rewards.items && rewards.items.length > 0) {
                for (const item of rewards.items) {
                    if (item.type === 'rare_candy') {
                        // Handle XP Snack (rare candy) items
                        const currentXPSnacks = userData.items?.xp_snacks || 0;
                        updates[`users/${currentUserId}/items/xp_snacks`] = currentXPSnacks + 1;
                        rewardMessages.push(`🍬 ${item.name}`);
                    }
                    // Add more item types here as needed
                }
            }

            // Mark trainer as defeated (optional - for daily reset mechanics)
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            updates[`users/${currentUserId}/defeated_trainers/${trainer.id}/${today}`] = true;

            // Apply all updates
            if (Object.keys(updates).length > 0) {
                await update(ref(this.database), updates);
            }

            return {
                success: true,
                rewards: rewards,
                messages: rewardMessages,
                totalCM: rewards.cm,
                items: rewards.items
            };

        } catch (error) {
            console.error('Error awarding trainer rewards:', error);
            return {
                success: false,
                error: error.message,
                rewards: { cm: 0, items: [] },
                messages: []
            };
        }
    }

    // Check if trainer can be fought today (for daily mechanics)
    async canFightTrainer(trainerId, userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) return false;

            const today = new Date().toISOString().split('T')[0];
            const userRef = ref(this.database, `users/${currentUserId}/defeated_trainers/${trainerId}/${today}`);
            const snapshot = await get(userRef);
            
            // Return true if trainer hasn't been defeated today
            return !snapshot.exists();
        } catch (error) {
            console.error('Error checking trainer availability:', error);
            return false;
        }
    }

    // Get user's current currency and items
    async getUserResources(userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) return null;

            const userRef = ref(this.database, `users/${currentUserId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val() || {};

            return {
                cm: userData.CM || 0,
                fm: userData.FM || 0,
                items: {
                    xp_snacks: userData.items?.xp_snacks || 0
                }
            };
        } catch (error) {
            console.error('Error getting user resources:', error);
            return null;
        }
    }

    // Use XP Snack item (for future implementation)
    async useXPSnack(monsterId, userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId) {
                throw new Error('No authenticated user found');
            }

            const userRef = ref(this.database, `users/${currentUserId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val() || {};

            const currentXPSnacks = userData.items?.xp_snacks || 0;
            if (currentXPSnacks <= 0) {
                throw new Error('No XP Snacks available');
            }

            // Reduce XP Snack count
            const updates = {};
            updates[`users/${currentUserId}/items/xp_snacks`] = currentXPSnacks - 1;
            
            // Add XP to monster (implementation depends on your monster XP system)
            // This is a placeholder - you'll need to integrate with your actual XP system
            const xpGained = 100; // Base XP from snack
            // updates[`users/${currentUserId}/monsters/${monsterId}/experience`] = currentExp + xpGained;

            await update(ref(this.database), updates);

            return {
                success: true,
                xpGained: xpGained,
                remainingSnacks: currentXPSnacks - 1
            };

        } catch (error) {
            console.error('Error using XP Snack:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
export const trainerRewardSystem = new TrainerRewardSystem();

// Convenience function for easy integration
export async function awardTrainerVictoryRewards(trainer, userId = null) {
    return await trainerRewardSystem.awardTrainerRewards(trainer, userId);
}

// Check if trainer can be fought today
export async function canFightTrainerToday(trainerId, userId = null) {
    return await trainerRewardSystem.canFightTrainer(trainerId, userId);
} 