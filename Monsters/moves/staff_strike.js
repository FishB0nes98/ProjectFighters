// Staff Strike - A Fighting-type physical move
import { BaseMove } from './base_move.js';

export class StaffStrike extends BaseMove {
    constructor() {
        super();
        this.name = "Staff Strike";
        this.type = "Fighting";
        this.category = "Physical";
        this.power = 80;
        this.accuracy = 90;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Strikes with a wooden staff. May cause flinching.";
        this.effects = ["flinch_chance"];
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