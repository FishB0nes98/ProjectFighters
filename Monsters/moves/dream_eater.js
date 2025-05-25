// Dream Eater - A Psychic-type move that eats dreams from sleeping targets
import { BaseMove } from './base_move.js';

export class DreamEater extends BaseMove {
    constructor() {
        super();
        this.name = "Dream Eater";
        this.type = "Psychic";
        this.category = "Special";
        this.power = 100;
        this.accuracy = 100;
        this.pp = 12;
        this.maxPP = 12;
        this.priority = 0;
        this.description = "Eats the dreams of sleeping targets. Heals the user for damage dealt.";
        this.effects = ["draining", "sleep_required"];
        this.criticalHitRate = 1;
        this.makesContact = false;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Check if target is sleeping
        if (target.statusCondition !== "sleep") {
            result.success = false;
            result.messages.push(`${this.name} can only be used on sleeping targets!`);
            return result;
        }

        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // Heal user for 100% of damage dealt if attack was successful
        if (result.success && result.damage > 0) {
            const healAmount = result.damage;
            const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
            user.currentHP += actualHeal;
            result.effects.push("draining");
            result.messages.push(`${user.name} devoured ${target.name}'s dreams and healed ${actualHeal} HP!`);
        }

        return result;
    }
} 