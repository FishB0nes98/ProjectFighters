// Moonbeam - A Fairy-type special move
import { BaseMove } from './base_move.js';

export class Moonbeam extends BaseMove {
    constructor() {
        super();
        this.name = "Moonbeam";
        this.type = "Fairy";
        this.category = "Special";
        this.power = 85;
        this.accuracy = 100;
        this.pp = 12;
        this.maxPP = 12;
        this.priority = 0;
        this.description = "Calls down a beam of moonlight. Heals the user for 25% of damage dealt.";
        this.effects = ["healing"];
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