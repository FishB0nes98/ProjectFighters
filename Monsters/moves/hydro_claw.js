// Hydro Claw - A Water-type physical move
import { BaseMove } from './base_move.js';

export class HydroClaw extends BaseMove {
    constructor() {
        super();
        this.name = "Hydro Claw";
        this.type = "Water";
        this.category = "Physical";
        this.power = 75;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Slashes with claws made of pressurized water. High critical hit ratio.";
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