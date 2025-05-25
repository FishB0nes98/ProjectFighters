// Sludge Bomb - A Poison-type special move
import { BaseMove } from './base_move.js';

export class SludgeBomb extends BaseMove {
    constructor() {
        super();
        this.name = "Sludge Bomb";
        this.type = "Poison";
        this.category = "Special";
        this.power = 90;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Hurls filthy sludge at the target. High chance to poison.";
        this.effects = ["poison_chance"];
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