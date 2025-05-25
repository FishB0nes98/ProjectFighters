// Drain Kiss - A Grass-type draining attack
import { BaseMove } from './base_move.js';

export class DrainKiss extends BaseMove {
    constructor() {
        super();
        this.name = "Drain Kiss";
        this.type = "Grass";
        this.category = "Special";
        this.power = 50;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Drains the target's energy. Heals the user for 75% of damage dealt.";
        this.effects = ["draining"];
        this.criticalHitRate = 1;
        this.makesContact = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // Heal user for 75% of damage dealt if attack was successful
        if (result.success && result.damage > 0) {
            const healAmount = Math.floor(result.damage * 0.75);
            if (healAmount > 0) {
                const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
                user.currentHP += actualHeal;
                result.effects.push("draining");
                result.messages.push(`${user.name} drained ${actualHeal} HP from ${target.name}!`);
            }
        }

        return result;
    }
} 