// Precision Strike - A Water-type physical move
import { BaseMove } from './base_move.js';

export class PrecisionStrike extends BaseMove {
    constructor() {
        super();
        this.name = "Precision Strike";
        this.type = "Water";
        this.category = "Physical";
        this.power = 60;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "A perfectly aimed attack that always results in a critical hit.";
        this.effects = [];
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