// Ice Shard - A Ice-type physical move
import { BaseMove } from './base_move.js';

export class IceShard extends BaseMove {
    constructor() {
        super();
        this.name = "Ice Shard";
        this.type = "Ice";
        this.category = "Physical";
        this.power = 40;
        this.accuracy = 100;
        this.pp = 30;
        this.maxPP = 30;
        this.priority = 1;
        this.description = "Hurls chunks of ice with priority. Always goes first.";
        this.effects = ["priority"];
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