// Toxic Spike - A Poison-type physical move
import { BaseMove } from './base_move.js';

export class ToxicSpike extends BaseMove {
    constructor() {
        super();
        this.name = "Toxic Spike";
        this.type = "Poison";
        this.category = "Physical";
        this.power = 60;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Strikes with a poisonous spike. Always poisons the target.";
        this.effects = ["poison"];
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