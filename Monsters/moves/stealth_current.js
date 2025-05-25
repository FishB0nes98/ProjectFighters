import { BaseMove } from './base_move.js';

export class StealthCurrent extends BaseMove {
    constructor() {
        super();
        this.name = "Stealth Current";
        this.type = "Water";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Becomes invisible, raising evasion and next attack's critical hit rate.";
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        result.messages.push(`${user.name} used ${this.name}!`);
        result.messages.push(`${user.name} became invisible in the water currents!`);
        
        // Boost Evasion
        const evasionResult = this.applyStatModification(user, "evasion", 2, battleManager);
        if (evasionResult.success) {
            result.messages.push(evasionResult.message);
            result.effects.push({
                type: "stat_change",
                stat: "evasion",
                stages: 2,
                target: user.name
            });
        }

        // Add critical hit boost for next attack
        if (!user.statusEffects) user.statusEffects = [];
        if (!user.statusEffects.includes("focus_energy")) {
            user.statusEffects.push("focus_energy");
            result.messages.push(`${user.name} is getting pumped!`);
            result.effects.push({
                type: "status",
                condition: "focus_energy",
                target: user.name,
                duration: 1
            });
        }

        return result;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "+2 Evasion", "Next attack has high critical hit rate"]
        };
    }
} 