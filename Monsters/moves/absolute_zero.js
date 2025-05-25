import { BaseMove } from './base_move.js';

export class AbsoluteZero extends BaseMove {
    constructor() {
        super();
        this.name = "Absolute Zero";
        this.type = "Ice";
        this.category = "Special";
        this.power = 120;
        this.accuracy = 80;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "Ultimate ice attack that always freezes if it hits.";
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute the damage
        const damageResult = this.executeDamageMove(user, target, battleManager, result);
        
        // If the move hit, always freeze the target
        if (damageResult.success && target.currentHP > 0) {
            const freezeResult = this.applyStatusCondition(target, "frozen", 5);
            if (freezeResult.success) {
                damageResult.messages.push(`${target.name} was frozen solid by the absolute zero temperature!`);
                damageResult.effects.push({
                    type: "status",
                    condition: "frozen",
                    target: target.name,
                    duration: 5
                });
            }
        }

        return damageResult;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "Always freezes if it hits", "Ultimate ice attack"]
        };
    }
} 