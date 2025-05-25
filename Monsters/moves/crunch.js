// Crunch - A Dark-type physical move
import { BaseMove } from './base_move.js';

export class Crunch extends BaseMove {
    constructor() {
        super();
        this.name = "Crunch";
        this.type = "Dark";
        this.category = "Physical";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Crunches with sharp teeth. May lower defense.";
        this.effects = ["defense_down_chance"];
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