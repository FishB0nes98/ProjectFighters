// Swift - A Normal-type move that never misses with high critical hit ratio
import { BaseMove } from './base_move.js';

export class Swift extends BaseMove {
    constructor() {
        super();
        this.name = "Swift";
        this.type = "Normal";
        this.category = "Special";
        this.power = 60;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Star-shaped rays that never miss. High critical hit ratio.";
        this.effects = ["never_miss", "high_critical"];
        this.criticalHitRate = 2; // Higher critical hit rate
        this.makesContact = false;
        this.neverMisses = true; // Special flag for BaseMove
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Add never miss message
        result.messages.push(`${this.name} never misses!`);

        // Execute damage with enhanced critical hit rate
        result = this.executeDamageMove(user, target, battleManager, result);

        return result;
    }
} 