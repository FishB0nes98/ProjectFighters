// Moonblast - A Fairy-type special move
import { BaseMove } from './base_move.js';

export class Moonblast extends BaseMove {
    constructor() {
        super();
        this.name = "Moonblast";
        this.type = "Fairy";
        this.category = "Special";
        this.power = 95;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Borrowing the power of the moon, the user attacks the target. This may also lower the target's Sp. Atk stat.";
        this.effects = ["special_attack_down_chance"];
        this.criticalHitRate = 1;
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // TODO: Add special effects here if needed
        
        return result;
    }
}