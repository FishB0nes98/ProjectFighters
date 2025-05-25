// Brick Break - A Fighting-type physical move
import { BaseMove } from './base_move.js';

export class BrickBreak extends BaseMove {
    constructor() {
        super();
        this.name = "Brick Break";
        this.type = "Fighting";
        this.category = "Physical";
        this.power = 75;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Breaks through barriers and deals fighting damage. Can shatter screens.";
        this.effects = ["barrier_break"];
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