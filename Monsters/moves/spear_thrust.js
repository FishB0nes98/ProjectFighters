// Spear Thrust - A Bug-type physical move
import { BaseMove } from './base_move.js';

export class SpearThrust extends BaseMove {
    constructor() {
        super();
        this.name = "Spear Thrust";
        this.type = "Bug";
        this.category = "Physical";
        this.power = 80;
        this.accuracy = 95;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "A precise spear attack that rarely misses vital spots.";
        this.effects = ["high_critical"];
        this.criticalHitRate = 2;
        this.makesContact = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // TODO: Add special effects here if needed
        
        return result;
    }
}