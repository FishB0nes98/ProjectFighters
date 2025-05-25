import { BaseMove } from './base_move.js';

export class IceShuriken extends BaseMove {
    constructor() {
        super();
        this.name = "Ice Shuriken";
        this.type = "Ice";
        this.category = "Physical";
        this.power = 75;
        this.accuracy = 95;
        this.pp = 15;
        this.maxPP = 15;
        this.priority = 0;
        this.description = "Throws multiple ice shards. Hits 2-3 times with high freeze chance.";
        this.makesContact = false;
        this.multiHit = true;
        this.freezeChance = 0.3; // 30% chance to freeze per hit
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Determine number of hits (2-3)
        const hits = Math.random() < 0.5 ? 2 : 3;
        let totalDamage = 0;
        let froze = false;

        result.messages.push(`${user.name} used ${this.name}!`);

        for (let i = 0; i < hits; i++) {
            // Calculate damage for each hit
            const hitDamage = battleManager.calculateDamage(user, target, this, false);
            const actualDamage = Math.min(hitDamage, target.currentHP);
            target.currentHP -= actualDamage;
            totalDamage += actualDamage;

            // Check for freeze on each hit
            if (!froze && Math.random() <= this.freezeChance) {
                const freezeResult = this.applyStatusCondition(target, "frozen", 4);
                if (freezeResult.success) {
                    froze = true;
                    result.effects.push({
                        type: "status",
                        condition: "frozen",
                        target: target.name,
                        duration: 4
                    });
                }
            }

            if (target.currentHP <= 0) break;
        }

        result.damage = totalDamage;
        result.messages.push(`Hit ${hits} time(s) for ${totalDamage} total damage!`);
        
        if (froze) {
            result.messages.push(`${target.name} was frozen by the icy shards!`);
        }

        return result;
    }

    // Get move info for UI
    getInfo() {
        const baseInfo = super.getInfo();
        return {
            ...baseInfo,
            effects: [...baseInfo.effects, "Hits 2-3 times", "30% freeze chance per hit"]
        };
    }
} 