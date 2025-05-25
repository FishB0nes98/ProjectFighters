// Ice Fang - A Ice-type physical move
import { BaseMove } from './base_move.js';

export class IceFang extends BaseMove {
    constructor() {
        super();
        this.name = "Ice Fang";
        this.type = "Ice";
        this.category = "Physical";
        this.power = 65;
        this.accuracy = 95;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Bites with ice-cold fangs. May freeze or cause flinching.";
        this.effects = ["freeze_chance", "flinch_chance"];
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