// Ember - A Fire-type special move
import { BaseMove } from './base_move.js';

export class Ember extends BaseMove {
    constructor() {
        super();
        this.name = "Ember";
        this.type = "Fire";
        this.category = "Special";
        this.power = 40;
        this.accuracy = 100;
        this.pp = 25;
        this.maxPP = 25;
        this.priority = 0;
        this.description = "The target is attacked with small flames. This may also leave the target with a burn.";
        this.effects = ["burn_chance"];
        this.criticalHitRate = 1;
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // 10% chance to burn the target
        if (result.success && target.statusCondition === "none" && Math.random() < 0.1) {
            const statusResult = this.applyStatusCondition(target, "burn", 4);
            if (statusResult.success) {
                result.effects.push("burn");
                result.messages.push(`${target.name} was burned by the small flames!`);
            }
        }
        
        return result;
    }
}