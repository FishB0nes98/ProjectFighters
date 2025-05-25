// Fire Spin - A Fire-type special move
import { BaseMove } from './base_move.js';

export class FireSpin extends BaseMove {
    constructor() {
        super();
        this.name = "Fire Spin";
        this.type = "Fire";
        this.category = "Special";
        this.power = 35;
        this.accuracy = 85;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "The target becomes trapped within a fierce vortex of fire that rages for four to five turns.";
        this.effects = ["trap"];
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