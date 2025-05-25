// Vine Whip - A Grass-type physical move
import { BaseMove } from './base_move.js';

export class VineWhip extends BaseMove {
    constructor() {
        super();
        this.name = "Vine Whip";
        this.type = "Grass";
        this.category = "Physical";
        this.power = 45;
        this.accuracy = 100;
        this.pp = 25;
        this.maxPP = 25;
        this.priority = 0;
        this.description = "Strikes the target with slender vines. Heals the user slightly.";
        this.effects = ["heal_user"];
        this.criticalHitRate = 1;
        this.makesContact = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        // Heal user for 25% of damage dealt if attack was successful
        if (result.success && result.damage > 0) {
            const healAmount = Math.floor(result.damage * 0.25);
            if (healAmount > 0) {
                const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
                user.currentHP += actualHeal;
                result.effects.push("healing");
                result.messages.push(`${user.name} absorbed energy and restored ${actualHeal} HP!`);
            }
        }
        
        return result;
    }
}