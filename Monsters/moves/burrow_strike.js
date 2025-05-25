// Burrow Strike - A Ground-type physical move
import { BaseMove } from './base_move.js';

export class BurrowStrike extends BaseMove {
    constructor() {
        super();
        this.name = "Burrow Strike";
        this.type = "Ground";
        this.category = "Physical";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 1;
        this.description = "The user burrows underground and strikes the target from below. This move can't miss.";
        this.effects = ["no_miss"];
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