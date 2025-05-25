// Glacial Storm - A Ice-type special move
import { BaseMove } from './base_move.js';

export class GlacialStorm extends BaseMove {
    constructor() {
        super();
        this.name = "Glacial Storm";
        this.type = "Ice";
        this.category = "Special";
        this.power = 120;
        this.accuracy = 85;
        this.pp = 8;
        this.maxPP = 8;
        this.priority = 0;
        this.description = "Ultimate ice attack that hits all enemies and may cause freeze and frostbite.";
        this.effects = ["area_attack", "freeze_chance", "frostbite_chance"];
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