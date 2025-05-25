import { BaseMove } from './base_move.js';

export class QuiverDance extends BaseMove {
    constructor() {
        super();
        this.name = "Quiver Dance";
        this.type = "Bug";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Dances to raise special attack, special defense, and speed.";
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        result.messages.push(`${user.name} used ${this.name}!`);
        
        // Boost Special Attack
        const spAtkResult = this.applyStatModification(user, "specialAttack", 1, battleManager);
        if (spAtkResult.success) {
            result.messages.push(spAtkResult.message);
            result.effects.push({
                type: "stat_change",
                stat: "specialAttack",
                stages: 1,
                target: user.name
            });
        }

        // Boost Special Defense
        const spDefResult = this.applyStatModification(user, "specialDefense", 1, battleManager);
        if (spDefResult.success) {
            result.messages.push(spDefResult.message);
            result.effects.push({
                type: "stat_change",
                stat: "specialDefense",
                stages: 1,
                target: user.name
            });
        }

        // Boost Speed
        const speedResult = this.applyStatModification(user, "speed", 1, battleManager);
        if (speedResult.success) {
            result.messages.push(speedResult.message);
            result.effects.push({
                type: "stat_change",
                stat: "speed",
                stages: 1,
                target: user.name
            });
        }

        return result;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "+1 Special Attack", "+1 Special Defense", "+1 Speed"]
        };
    }
} 