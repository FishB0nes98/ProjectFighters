// Flame Dash - A Fire-type physical move
import { BaseMove } from './base_move.js';

export class FlameDash extends BaseMove {
    constructor() {
        super();
        this.name = "Flame Dash";
        this.type = "Fire";
        this.category = "Physical";
        this.power = 65;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 1;
        this.description = "A quick dash wreathed in flames. Always goes first and may burn the target.";
        this.effects = ["burn_chance", "priority"];
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