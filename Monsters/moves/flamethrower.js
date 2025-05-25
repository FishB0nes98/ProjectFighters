// Flamethrower - A Fire-type special move
import { BaseMove } from './base_move.js';

export class Flamethrower extends BaseMove {
    constructor() {
        super();
        this.name = "Flamethrower";
        this.type = "Fire";
        this.category = "Special";
        this.power = 90;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "The user shoots flames at the target. May cause burn.";
        this.effects = ["burn_chance"];
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