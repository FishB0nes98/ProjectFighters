// Ice Beam - A Ice-type special move
import { BaseMove } from './base_move.js';

export class IceBeam extends BaseMove {
    constructor() {
        super();
        this.name = "Ice Beam";
        this.type = "Ice";
        this.category = "Special";
        this.power = 90;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "The target is struck with an icy-cold beam of energy. This may also leave the target frozen.";
        this.effects = ["freeze_chance"];
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