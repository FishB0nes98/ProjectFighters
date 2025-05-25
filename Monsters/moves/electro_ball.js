// Electro Ball - A Electric-type special move
import { BaseMove } from './base_move.js';

export class ElectroBall extends BaseMove {
    constructor() {
        super();
        this.name = "Electro Ball";
        this.type = "Electric";
        this.category = "Special";
        this.power = 85;
        this.accuracy = 100;
        this.pp = 12;
        this.maxPP = 12;
        this.priority = 0;
        this.description = "Hurls an electric orb. More powerful the faster the user.";
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