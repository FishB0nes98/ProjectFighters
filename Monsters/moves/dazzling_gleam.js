// Dazzling Gleam - A Fairy-type special move
import { BaseMove } from './base_move.js';

export class DazzlingGleam extends BaseMove {
    constructor() {
        super();
        this.name = "Dazzling Gleam";
        this.type = "Fairy";
        this.category = "Special";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "The user damages opposing monsters by emitting a powerful flash.";
        this.effects = ["hits_all_opponents"];
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