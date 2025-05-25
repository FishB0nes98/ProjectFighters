// Aqua Cannon - A Water-type special move
import { BaseMove } from './base_move.js';

export class AquaCannon extends BaseMove {
    constructor() {
        super();
        this.name = "Aqua Cannon";
        this.type = "Water";
        this.category = "Special";
        this.power = 90;
        this.accuracy = 90;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "The user fires a powerful blast of water at the target with tremendous force.";
        this.effects = [];
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