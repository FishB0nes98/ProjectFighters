// Recover - A Normal-type status move that restores the user's HP
import { BaseMove } from './base_move.js';

export class Recover extends BaseMove {
    constructor() {
        super();
        this.name = "Recover";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "The user restores its own HP by up to half of its max HP.";
        this.effects = ["self_heal"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        const healResult = this.healUser(user, 0.5);
        result.effects.push("heal");
        result.messages.push(healResult.message);
        return result;
    }
} 