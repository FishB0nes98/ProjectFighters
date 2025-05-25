// Bubble Beam - A Water-type special move
import { BaseMove } from './base_move.js';

export class BubbleBeam extends BaseMove {
    constructor() {
        super();
        this.name = "Bubble Beam";
        this.type = "Water";
        this.category = "Special";
        this.power = 65;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "A spray of bubbles that may lower the target's speed.";
        this.effects = ["speed_down_chance"];
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