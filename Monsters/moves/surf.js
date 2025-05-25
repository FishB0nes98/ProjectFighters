// Surf - A Water-type special move
import { BaseMove } from './base_move.js';

export class Surf extends BaseMove {
    constructor() {
        super();
        this.name = "Surf";
        this.type = "Water";
        this.category = "Special";
        this.power = 90;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "The user attacks everything around it by swamping its surroundings with a giant wave.";
        this.effects = ["hits_all"];
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