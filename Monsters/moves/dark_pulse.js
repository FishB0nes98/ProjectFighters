// Dark Pulse - A Dark-type special move
import { BaseMove } from './base_move.js';

export class DarkPulse extends BaseMove {
    constructor() {
        super();
        this.name = "Dark Pulse";
        this.type = "Dark";
        this.category = "Special";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "The user releases a horrible aura imbued with dark thoughts. This may also make the target flinch.";
        this.effects = ["flinch_chance"];
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