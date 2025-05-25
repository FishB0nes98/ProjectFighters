// Charm - A Fairy-type status move that lowers attack and may infatuate
import { BaseMove } from './base_move.js';

export class Charm extends BaseMove {
    constructor() {
        super();
        this.name = "Charm";
        this.type = "Fairy";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Sharply lowers the target's attack and may cause infatuation.";
        this.effects = ["attack_down", "infatuation_chance"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.affectedByTypeEffectiveness = true;
    }

    // Execute the specific move logic
    executeSpecific(user, target, battleManager, battleState, result) {
        // Lower target's attack by 2 stages
        const statResult = this.applyStatModification(target, "attack", -2, battleManager);
        if (statResult.success) {
            result.effects.push("attack_down_sharp");
            result.messages.push(statResult.message);
        } else {
            result.messages.push(statResult.message);
        }

        // 50% chance to cause infatuation
        if (Math.random() < 0.50) {
            if (!target.statusEffects) target.statusEffects = [];
            if (!target.statusEffects.includes("infatuated")) {
                target.statusEffects.push("infatuated");
                result.effects.push("infatuation");
                result.messages.push(`${target.name} became infatuated with ${user.name}!`);
            }
        }

        return result;
    }
} 