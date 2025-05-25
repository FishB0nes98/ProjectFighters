// Quick Attack - A Normal-type physical move
import { BaseMove } from './base_move.js';

export class QuickAttack extends BaseMove {
    constructor() {
        super();
        this.name = "Quick Attack";
        this.type = "Normal";
        this.category = "Physical";
        this.power = 40;
        this.accuracy = 100;
        this.pp = 30;
        this.maxPP = 30;
        this.priority = 1;
        this.description = "A quick tackle that always goes first.";
        this.effects = ["priority"];
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