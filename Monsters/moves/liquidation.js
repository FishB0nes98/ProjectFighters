// Liquidation - A Water-type physical move
import { BaseMove } from './base_move.js';

export class Liquidation extends BaseMove {
    constructor() {
        super();
        this.name = "Liquidation";
        this.type = "Water";
        this.category = "Physical";
        this.power = 85;
        this.accuracy = 100;
        this.pp = 12;
        this.maxPP = 12;
        this.priority = 0;
        this.description = "Slams into the target with water. May lower defense.";
        this.effects = ["defense_down_chance"];
        this.criticalHitRate = 1;
        this.makesContact = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // TODO: Add special effects here if needed
        
        return result;
    }
}