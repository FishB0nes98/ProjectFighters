// Lava Plume - A Fire-type special move
import { BaseMove } from './base_move.js';

export class LavaPlume extends BaseMove {
    constructor() {
        super();
        this.name = "Lava Plume";
        this.type = "Fire";
        this.category = "Special";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "The user torches everything around with an eruption of lava. This may also leave targets with burns.";
        this.effects = ["burn_chance", "hits_all"];
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