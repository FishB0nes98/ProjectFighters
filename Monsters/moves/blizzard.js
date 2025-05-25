// Blizzard - A Ice-type special move
import { BaseMove } from './base_move.js';

export class Blizzard extends BaseMove {
    constructor() {
        super();
        this.name = "Blizzard";
        this.type = "Ice";
        this.category = "Special";
        this.power = 110;
        this.accuracy = 70;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "A howling blizzard that may freeze the target and all nearby enemies.";
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