// Rest - A Normal-type healing status move
import { BaseMove } from './base_move.js';

export class Rest extends BaseMove {
    constructor() {
        super();
        this.name = "Rest";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Restores all HP and removes status conditions. User falls asleep for 2 turns.";
        this.effects = ["healing", "sleep_self"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Heal to full HP
        const healAmount = user.maxHP - user.currentHP;
        user.currentHP = user.maxHP;
        
        // Remove any status conditions
        const oldStatus = user.statusCondition;
        user.statusCondition = "none";
        user.statusTurns = 0;

        // Put user to sleep for 2 turns
        user.statusCondition = "sleep";
        user.statusTurns = 2;

        result.effects.push("healing", "sleep_self");
        
        if (healAmount > 0) {
            result.messages.push(`${user.name} restored ${healAmount} HP!`);
        }
        
        if (oldStatus !== "none") {
            result.messages.push(`${user.name} was cured of ${oldStatus}!`);
        }
        
        result.messages.push(`${user.name} fell into a deep, restorative sleep!`);

        return result;
    }
} 