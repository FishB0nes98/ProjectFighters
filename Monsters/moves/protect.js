// Protect - Normal type status move that blocks all attacks
import { BaseMove } from './base_move.js';

export class Protect extends BaseMove {
    constructor() {
        super();
        this.name = "Protect";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 4; // High priority
        this.description = "Blocks all attacks for one turn. Less likely to succeed consecutively.";
        this.effects = ["protection"];
        this.makesContact = false;
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Calculate success chance based on consecutive usage
        const consecutiveProtects = battleState?.consecutiveProtects || 0;
        
        // Base success rate is 100%
        // Each consecutive use halves the success rate
        let successRate = 100;
        for (let i = 0; i < consecutiveProtects; i++) {
            successRate /= 2;
        }
        
        // Minimum success rate of 12.5%
        successRate = Math.max(successRate, 12.5);
        
        // Check if the move succeeds
        if (Math.random() * 100 > successRate) {
            result.success = false;
            result.messages.push(`${this.name} failed!`);
            return result;
        }

        // Apply protection status
        user.statusEffects = user.statusEffects || {};
        user.statusEffects.protected = {
            turnsRemaining: 1,
            description: "Protected from all attacks"
        };

        result.messages.push(`${user.name} protected itself!`);
        result.effects.push({
            type: 'status',
            target: 'user',
            status: 'protected',
            duration: 1
        });

        return result;
    }

    // Check if this is a protect-like move (for consecutive use tracking)
    isProtectMove() {
        return true;
    }
} 