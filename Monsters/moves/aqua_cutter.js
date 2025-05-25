// Aqua Cutter - A Water-type physical move
import { BaseMove } from './base_move.js';

export class AquaCutter extends BaseMove {
    constructor() {
        super();
        this.name = "Aqua Cutter";
        this.type = "Water";
        this.category = "Physical";
        this.power = 70;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Slices with pressurized water. High critical hit ratio.";
        this.effects = ["high_critical"];
        this.criticalHitRate = 2;
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // TODO: Add special effects here if needed
        
        return result;
    }
}