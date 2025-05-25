// Temple Crash - A Fighting-type physical move
import { BaseMove } from './base_move.js';

export class TempleCrash extends BaseMove {
    constructor() {
        super();
        this.name = "Temple Crash";
        this.type = "Fighting";
        this.category = "Physical";
        this.power = 70;
        this.accuracy = 100;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "The user crashes down with tremendous force. Power increases when the user's HP is low.";
        this.effects = ["reversal"];
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