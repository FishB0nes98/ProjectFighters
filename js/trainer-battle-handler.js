// Trainer Battle Handler - Integrates with egg system for special rewards
import { eggSystem } from './egg-system.js';
import { ref, get, set, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

export class TrainerBattleHandler {
    constructor() {
        this.specialTrainerRewards = {
            'kotal_kahn': {
                eggType: 'WATER',
                dailyLimit: true,
                cooldownHours: 24,
                message: '🏆 Kotal Kahn defeated! You received a Water Egg as a reward!'
            }
        };
    }

    // Handle trainer defeat and award special rewards
    async handleTrainerDefeat(trainerId, userId) {
        console.log(`🏆 Trainer ${trainerId} defeated by user ${userId}`);
        
        const specialReward = this.specialTrainerRewards[trainerId];
        if (!specialReward) {
            console.log(`No special rewards for trainer ${trainerId}`);
            return { success: true, messages: [] };
        }

        const messages = [];
        
        try {
            // Check if this is a daily limited reward
            if (specialReward.dailyLimit) {
                const canReceive = await this.checkDailyEligibility(trainerId, userId);
                if (!canReceive) {
                    messages.push(`You've already received your daily reward from ${trainerId}. Come back tomorrow!`);
                    return { success: true, messages };
                }
            }

            // Award the egg
            if (specialReward.eggType) {
                await eggSystem.createEgg(specialReward.eggType, null, userId);
                messages.push(specialReward.message);
                
                // Update last reward time if daily limited
                if (specialReward.dailyLimit) {
                    await this.updateLastRewardTime(trainerId, userId);
                }
            }

            return { success: true, messages };

        } catch (error) {
            console.error(`❌ Error handling trainer defeat rewards:`, error);
            return { success: false, messages: ['Failed to process trainer rewards.'] };
        }
    }

    // Check if user can receive daily reward from trainer
    async checkDailyEligibility(trainerId, userId) {
        if (!window.firebaseDatabase) return false;

        try {
            const lastRewardRef = ref(window.firebaseDatabase, `users/${userId}/lastTrainerRewards/${trainerId}`);
            const snapshot = await get(lastRewardRef);
            const lastRewardTime = snapshot.val() || 0;
            
            const now = Date.now();
            const cooldownMs = this.specialTrainerRewards[trainerId].cooldownHours * 60 * 60 * 1000;
            
            return (now - lastRewardTime) >= cooldownMs;
        } catch (error) {
            console.error('❌ Error checking daily eligibility:', error);
            return false;
        }
    }

    // Update last reward time for trainer
    async updateLastRewardTime(trainerId, userId) {
        if (!window.firebaseDatabase) return;

        try {
            const lastRewardRef = ref(window.firebaseDatabase, `users/${userId}/lastTrainerRewards/${trainerId}`);
            await set(lastRewardRef, Date.now());
        } catch (error) {
            console.error('❌ Error updating last reward time:', error);
        }
    }

    // Get time until next reward is available
    async getTimeUntilNextReward(trainerId, userId) {
        if (!this.specialTrainerRewards[trainerId]?.dailyLimit) {
            return { available: true, timeRemaining: 0 };
        }

        try {
            const lastRewardRef = ref(window.firebaseDatabase, `users/${userId}/lastTrainerRewards/${trainerId}`);
            const snapshot = await get(lastRewardRef);
            const lastRewardTime = snapshot.val() || 0;
            
            const now = Date.now();
            const cooldownMs = this.specialTrainerRewards[trainerId].cooldownHours * 60 * 60 * 1000;
            const timeRemaining = Math.max(0, (lastRewardTime + cooldownMs) - now);
            
            return {
                available: timeRemaining === 0,
                timeRemaining: timeRemaining,
                formattedTime: this.formatTimeRemaining(timeRemaining)
            };
        } catch (error) {
            console.error('❌ Error getting time until next reward:', error);
            return { available: false, timeRemaining: 0 };
        }
    }

    // Format time remaining as human readable string
    formatTimeRemaining(ms) {
        if (ms <= 0) return 'Available now!';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Get all special trainer info for UI display
    getSpecialTrainerInfo() {
        return Object.entries(this.specialTrainerRewards).map(([trainerId, reward]) => ({
            trainerId,
            ...reward
        }));
    }

    // Award random egg (for general rewards system)
    async awardRandomEgg(userId, rarityWeights = null) {
        try {
            // Use default rarity weights if none provided
            const eggTypes = ['WATER', 'FIRE', 'GRASS', 'ELECTRIC', 'ICE', 'GROUND', 'NORMAL', 'FLYING'];
            const randomType = eggTypes[Math.floor(Math.random() * eggTypes.length)];
            
            await eggSystem.createEgg(randomType, null, userId);
            
            return {
                success: true,
                message: `🥚 You received a ${randomType} egg!`
            };
        } catch (error) {
            console.error('❌ Error awarding random egg:', error);
            return {
                success: false,
                message: 'Failed to award egg reward.'
            };
        }
    }
}

// Global trainer battle handler instance
export const trainerBattleHandler = new TrainerBattleHandler();

// Make it available globally
window.TrainerBattleHandler = trainerBattleHandler; 