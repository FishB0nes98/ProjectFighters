// Trainer Battle Demo - Shows how to use the beginner trainers and reward system
import { getBeginnerTrainers, getTrainer } from './trainers.js';
import { awardTrainerVictoryRewards, canFightTrainerToday } from './trainer_rewards.js';

export class TrainerBattleDemo {
    constructor() {
        this.beginnerTrainers = getBeginnerTrainers();
    }

    // Get a random beginner trainer for daily battles
    getRandomBeginnerTrainer() {
        if (this.beginnerTrainers.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.beginnerTrainers.length);
        return this.beginnerTrainers[randomIndex];
    }

    // Get trainer by difficulty level (1-7, where 1 is easiest)
    getTrainerByDifficulty(level) {
        const difficultyMap = {
            1: 'rookie_riley',      // Level 2, 1 monster
            2: 'scout_sam',         // Level 3, 1 monster  
            3: 'camper_casey',      // Level 3-4, 2 monsters
            4: 'student_sarah',     // Level 4, 2 monsters
            5: 'hiker_henry',       // Level 6, 1 tough monster
            6: 'twins_tim_tom',     // Level 5, 2 coordinated monsters
            7: 'ace_trainer_alex'   // Level 6-7, 3 monsters
        };

        const trainerId = difficultyMap[level];
        return trainerId ? getTrainer(trainerId) : null;
    }

    // Simulate a trainer battle victory and award rewards
    async simulateTrainerVictory(trainerId, userId = null) {
        try {
            // Check if trainer can be fought today
            const canFight = await canFightTrainerToday(trainerId, userId);
            if (!canFight) {
                return {
                    success: false,
                    message: 'This trainer has already been defeated today. Try again tomorrow!'
                };
            }

            // Get the trainer
            const trainer = getTrainer(trainerId);
            if (!trainer) {
                return {
                    success: false,
                    message: 'Trainer not found!'
                };
            }

            // Award rewards for victory
            const rewardResult = await awardTrainerVictoryRewards(trainer, userId);
            
            if (rewardResult.success) {
                return {
                    success: true,
                    trainer: trainer,
                    rewards: rewardResult.rewards,
                    messages: rewardResult.messages,
                    message: `Victory against ${trainer.name}! ${rewardResult.messages.join(', ')}`
                };
            } else {
                return {
                    success: false,
                    message: `Failed to award rewards: ${rewardResult.error}`
                };
            }

        } catch (error) {
            console.error('Error in trainer battle simulation:', error);
            return {
                success: false,
                message: `Battle error: ${error.message}`
            };
        }
    }

    // Get all beginner trainers with their info
    getBeginnerTrainerInfo() {
        return this.beginnerTrainers.map(trainer => ({
            id: trainer.id,
            name: trainer.name,
            description: trainer.description,
            monsterCount: trainer.monsters.length,
            averageLevel: Math.round(
                trainer.monsters.reduce((sum, m) => sum + m.level, 0) / trainer.monsters.length
            ),
            monsters: trainer.monsters.map(m => ({
                species: m.species,
                level: m.level
            }))
        }));
    }

    // Test reward calculation (without saving to database)
    testRewardCalculation(trainerId) {
        const trainer = getTrainer(trainerId);
        if (!trainer) return null;

        // Run multiple simulations to show reward variance
        const simulations = [];
        for (let i = 0; i < 10; i++) {
            const rewards = trainer.calculateRewards();
            simulations.push(rewards);
        }

        return {
            trainer: trainer.name,
            simulations: simulations,
            averageCM: Math.round(
                simulations.reduce((sum, r) => sum + r.cm, 0) / simulations.length
            ),
            xpSnackChance: simulations.filter(r => r.items.length > 0).length * 10 + '%'
        };
    }
}

// Example usage functions for integration
export function initializeTrainerBattleSystem() {
    const demo = new TrainerBattleDemo();
    
    console.log('🎯 Beginner Trainer Battle System Initialized');
    console.log('📋 Available Beginner Trainers:');
    
    const trainerInfo = demo.getBeginnerTrainerInfo();
    trainerInfo.forEach((trainer, index) => {
        console.log(`${index + 1}. ${trainer.name} (${trainer.monsterCount} monsters, avg level ${trainer.averageLevel})`);
        console.log(`   ${trainer.description}`);
        console.log(`   Monsters: ${trainer.monsters.map(m => `${m.species} (Lv.${m.level})`).join(', ')}`);
    });

    return demo;
}

// Quick test function to show reward variance
export function testTrainerRewards() {
    const demo = new TrainerBattleDemo();
    
    console.log('🎲 Testing Trainer Reward System:');
    
    const beginnerTrainers = getBeginnerTrainers();
    beginnerTrainers.forEach(trainer => {
        const test = demo.testRewardCalculation(trainer.id);
        console.log(`${test.trainer}: Avg ${test.averageCM} CM, XP Snack chance: ${test.xpSnackChance}`);
    });
}

// Export the demo class for use in other files
export { TrainerBattleDemo }; 