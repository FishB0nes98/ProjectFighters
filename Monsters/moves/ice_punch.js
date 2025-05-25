// Ice Punch - A Ice-type physical move
import { BaseMove } from './base_move.js';

export class IcePunch extends BaseMove {
    constructor() {
        super();
        this.name = "Ice Punch";
        this.type = "Ice";
        this.category = "Physical";
        this.power = 75;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "An ice-cold punch that may freeze the target.";
        this.effects = ["freeze_chance"];
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