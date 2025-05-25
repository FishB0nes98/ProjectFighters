// Sleepy Time - A Normal-type area sleep status move
import { BaseMove } from './base_move.js';

export class SleepyTime extends BaseMove {
    constructor() {
        super();
        this.name = "Sleepy Time";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Puts all enemies to sleep with soothing lullabies.";
        this.effects = ["area_status", "sleep"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.targetsAll = true;
        this.targetType = "enemy_team";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Apply sleep status with random duration (2-4 turns)
        const sleepDuration = Math.floor(Math.random() * 3) + 2;
        const statusResult = this.applyStatusCondition(target, "sleep", sleepDuration);
        
        if (statusResult.success) {
            result.effects.push("sleep");
            result.messages.push(`${target.name} fell into a peaceful slumber!`);
        } else {
            result.success = false;
            result.messages.push(statusResult.message);
        }

        return result;
    }
} 