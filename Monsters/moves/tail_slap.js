// Tail Slap - A Normal-type physical move
import { BaseMove } from './base_move.js';

export class TailSlap extends BaseMove {
    constructor() {
        super();
        this.name = "Tail Slap";
        this.type = "Normal";
        this.category = "Physical";
        this.power = 25;
        this.accuracy = 85;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Slaps the target 2-5 times with its fluffy tail.";
        this.effects = ["multi_hit"];
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