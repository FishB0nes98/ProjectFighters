import { BaseMove } from './base_move.js';

export class BeatDrop extends BaseMove {
    constructor() {
        super();
        this.name = "Beat Drop";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Creates a powerful bass drop that lowers all enemy stats and may cause confusion.";
        this.targetType = "enemy_team";
        this.confusionChance = 0.3; // 30% chance to confuse
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        result.messages.push(`${user.name} dropped the beat! The bass shakes the battlefield!`);
        
        // Get all enemies (this is a simplified version - actual implementation would depend on battle system)
        const enemies = battleState.enemies || [target];
        
        enemies.forEach(enemy => {
            if (enemy && enemy.currentHP > 0) {
                // Lower all stats by 1 stage
                const stats = ["attack", "defense", "specialAttack", "specialDefense", "speed"];
                
                stats.forEach(stat => {
                    const statResult = this.applyStatModification(enemy, stat, -1, battleManager);
                    if (statResult.success) {
                        result.effects.push({
                            type: "stat_change",
                            stat: stat,
                            stages: -1,
                            target: enemy.name
                        });
                    }
                });

                // Check for confusion
                const confusionRoll = Math.random();
                if (confusionRoll <= this.confusionChance) {
                    const confusionResult = this.applyStatusCondition(enemy, "confused", 3);
                    if (confusionResult.success) {
                        result.messages.push(`${enemy.name} became confused by the intense beat!`);
                        result.effects.push({
                            type: "status",
                            condition: "confused",
                            target: enemy.name,
                            duration: 3
                        });
                    }
                }
            }
        });

        result.messages.push("All enemies' stats fell from the overwhelming sound!");
        return result;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "Lowers all enemy stats", "30% chance to confuse all enemies"]
        };
    }
} 