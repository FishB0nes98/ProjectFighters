import { BaseMove } from './base_move.js';

export class NinjaStrike extends BaseMove {
    constructor() {
        super();
        this.name = "Ninja Strike";
        this.type = "Water";
        this.category = "Physical";
        this.power = 90;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 1; // Always goes first
        this.description = "A swift ninja attack that always goes first and may freeze the target.";
        this.makesContact = true;
        this.freezeChance = 0.2; // 20% chance to freeze
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute the damage
        const damageResult = this.executeDamageMove(user, target, battleManager, result);
        
        // Check for freeze
        if (damageResult.success && this.freezeChance > 0) {
            const freezeRoll = Math.random();
            if (freezeRoll <= this.freezeChance) {
                const freezeResult = this.applyStatusCondition(target, "frozen", 4);
                if (freezeResult.success) {
                    damageResult.messages.push(freezeResult.message);
                    damageResult.effects.push({
                        type: "status",
                        condition: "frozen",
                        target: target.name,
                        duration: 4
                    });
                }
            }
        }

        return damageResult;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "20% chance to freeze", "High priority"]
        };
    }
} 