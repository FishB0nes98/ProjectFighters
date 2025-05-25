// Close Combat - A Fighting-type physical move
import { BaseMove } from './base_move.js';

export class CloseCombat extends BaseMove {
    constructor() {
        super();
        this.name = "Close Combat";
        this.type = "Fighting";
        this.category = "Physical";
        this.power = 120;
        this.accuracy = 100;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "A powerful close-quarters attack that lowers the user's defense and special defense.";
        this.effects = ["user_defense_down"];
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