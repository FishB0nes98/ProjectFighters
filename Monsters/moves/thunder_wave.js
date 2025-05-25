// Thunder Wave - An Electric-type status move that paralyzes the target
import { BaseMove } from './base_move.js';

export class ThunderWave extends BaseMove {
    constructor() {
        super();
        this.name = "Thunder Wave";
        this.type = "Electric";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 90;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "A weak electric charge that paralyzes the target.";
        this.effects = ["paralyze"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.affectedByTypeEffectiveness = true;
    }

    // Execute the specific move logic
    executeSpecific(user, target, battleManager, battleState, result) {
        // Apply paralysis
        const statusResult = this.applyStatusCondition(target, "paralyzed", 4);
        
        if (statusResult.success) {
            result.effects.push("paralyzed");
            result.messages.push(`${target.name} was paralyzed by the electric wave!`);
        } else {
            result.success = false;
            result.messages.push(statusResult.message);
        }

        return result;
    }
} 