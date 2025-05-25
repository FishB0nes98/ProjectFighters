// Shadow Ball - A Ghost-type special move
import { BaseMove } from './base_move.js';

export class ShadowBall extends BaseMove {
    constructor() {
        super();
        this.name = "Shadow Ball";
        this.type = "Ghost";
        this.category = "Special";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Hurls a shadowy blob at the target. May lower the target's Sp. Defense.";
        this.effects = ["sp_defense_down"];
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