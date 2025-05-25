// Play Rough - A Fairy-type physical move
import { BaseMove } from './base_move.js';

export class PlayRough extends BaseMove {
    constructor() {
        super();
        this.name = "Play Rough";
        this.type = "Fairy";
        this.category = "Physical";
        this.power = 90;
        this.accuracy = 90;
        this.pp = 12;
        this.maxPP = 12;
        this.priority = 0;
        this.description = "Plays rough with the target. May lower the target's attack.";
        this.effects = ["attack_down_chance"];
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