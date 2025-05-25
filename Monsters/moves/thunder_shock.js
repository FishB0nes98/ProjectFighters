// Thunder Shock - A Electric-type special move
import { BaseMove } from './base_move.js';

export class ThunderShock extends BaseMove {
    constructor() {
        super();
        this.name = "Thunder Shock";
        this.type = "Electric";
        this.category = "Special";
        this.power = 40;
        this.accuracy = 100;
        this.pp = 30;
        this.maxPP = 30;
        this.priority = 0;
        this.description = "A weak electric attack that may paralyze the target.";
        this.effects = ["paralyze_chance"];
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