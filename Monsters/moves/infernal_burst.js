// Infernal Burst - A Fire-type special move
import { BaseMove } from './base_move.js';

export class InfernalBurst extends BaseMove {
    constructor() {
        super();
        this.name = "Infernal Burst";
        this.type = "Fire";
        this.category = "Special";
        this.power = 140;
        this.accuracy = 80;
        this.pp = 5;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Unleashes all spiritual energy in a massive explosion. User loses 1/3 of max HP.";
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