// Spore - A Grass-type status move that puts target to sleep
import { BaseMove } from './base_move.js';

export class Spore extends BaseMove {
    constructor() {
        super();
        this.name = "Spore";
        this.type = "Grass";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Releases spores that put the target to sleep.";
        this.effects = ["sleep"];
        this.criticalHitRate = 0;
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Grass-type immunity check (Grass types can't be put to sleep by spores)
        if (target.types.includes("Grass")) {
            result.success = false;
            result.messages.push(`${target.name} is immune to spore effects!`);
            return result;
        }

        // Apply sleep status with random duration (2-4 turns)
        const sleepDuration = Math.floor(Math.random() * 3) + 2;
        const statusResult = this.applyStatusCondition(target, "sleep", sleepDuration);
        
        if (statusResult.success) {
            result.effects.push("sleep");
            result.messages.push(`${target.name} fell asleep from the spores!`);
        } else {
            result.success = false;
            result.messages.push(statusResult.message);
        }

        return result;
    }
} 