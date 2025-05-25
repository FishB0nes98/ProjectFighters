// Magma Burst - A Fire-type special move
import { BaseMove } from './base_move.js';

export class MagmaBurst extends BaseMove {
    constructor() {
        super();
        this.name = "Magma Burst";
        this.type = "Fire";
        this.category = "Special";
        this.power = 110;
        this.accuracy = 85;
        this.pp = 8;
        this.maxPP = 8;
        this.priority = 0;
        this.description = "Erupts molten lava at all enemies. High power but lower accuracy.";
        this.effects = ["area_attack", "burn_chance"];
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