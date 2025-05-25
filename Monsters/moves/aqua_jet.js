// Aqua Jet - A Water-type physical move
import { BaseMove } from './base_move.js';

export class AquaJet extends BaseMove {
    constructor() {
        super();
        this.name = "Aqua Jet";
        this.type = "Water";
        this.category = "Physical";
        this.power = 40;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 10;
        this.priority = 1;
        this.description = "Lunges at the target with incredible speed. Always goes first.";
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