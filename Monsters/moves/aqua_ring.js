// Aqua Ring - A Water-type status move that restores HP over time
import { BaseMove } from './base_move.js';

export class AquaRing extends BaseMove {
    constructor() {
        super();
        this.name = "Aqua Ring";
        this.type = "Water";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Creates a veil of water that gradually restores HP.";
        this.effects = ["healing_over_time"];
        this.criticalHitRate = 0;
        this.makesContact = false;
        this.targetType = "self";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Apply Aqua Ring effect - restores 1/16 of max HP each turn for 5 turns
        if (!user.statusEffects) {
            user.statusEffects = {};
        }
        
        user.statusEffects.aquaRing = {
            turnsRemaining: 5,
            healAmount: Math.floor(user.maxHP / 16)
        };

        result.effects.push("aqua_ring");
        result.messages.push(`${user.name} surrounded itself with a veil of healing water!`);

        return result;
    }

    // Static method to process Aqua Ring healing each turn
    static processAquaRing(monster) {
        if (monster.statusEffects?.aquaRing) {
            const aquaRing = monster.statusEffects.aquaRing;
            const healAmount = Math.min(aquaRing.healAmount, monster.maxHP - monster.currentHP);
            
            if (healAmount > 0) {
                monster.currentHP += healAmount;
            }
            
            aquaRing.turnsRemaining--;
            
            if (aquaRing.turnsRemaining <= 0) {
                delete monster.statusEffects.aquaRing;
                return `${monster.name}'s Aqua Ring faded away.`;
            }
            
            return healAmount > 0 ? 
                `${monster.name} was healed by Aqua Ring for ${healAmount} HP!` : 
                null;
        }
        return null;
    }
} 