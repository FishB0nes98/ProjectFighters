// Rapid Strike - A Fighting-type physical move
import { BaseMove } from './base_move.js';

export class RapidStrike extends BaseMove {
    constructor() {
        super();
        this.name = "Rapid Strike";
        this.type = "Fighting";
        this.category = "Physical";
        this.power = 25;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "The user strikes the target multiple times in quick succession. Hits 2-5 times.";
        this.effects = ["multi_hit"];
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