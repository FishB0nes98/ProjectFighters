// Stone Edge - A Rock-type physical move
import { BaseMove } from './base_move.js';

export class StoneEdge extends BaseMove {
    constructor() {
        super();
        this.name = "Stone Edge";
        this.type = "Rock";
        this.category = "Physical";
        this.power = 100;
        this.accuracy = 80;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "The user stabs the target from below with sharpened stones. Critical hits land more easily.";
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