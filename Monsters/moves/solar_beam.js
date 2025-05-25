// Solar Beam - Cryorose's powerful two-turn Grass move
import { BaseMove } from './base_move.js';

export class SolarBeam extends BaseMove {
    constructor() {
        super();
        this.name = "Solar Beam";
        this.type = "Grass";
        this.category = "Special";
        this.power = 120;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Charges on the first turn, then unleashes a powerful beam. Healing is doubled.";
        this.effects = ["charging", "healing"];
        this.criticalHitRate = 1;
        this.makesContact = false;
        this.requiresCharging = true;
        this.enhancedHealing = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Check if we need to charge first
        if (!user.solarBeamCharged) {
            // Charging turn
            user.solarBeamCharged = true;
            result.messages.push(`${user.name} is gathering sunlight!`);
            result.effects.push("charging");
            
            // Add charging VFX
            result.vfx = [{
                name: 'solar-beam-charge',
                target: user,
                duration: 2000
            }];
            
            return result;
        }

        // Attack turn - reset charged state
        user.solarBeamCharged = false;

        // Execute standard damage
        result = this.executeDamageMove(user, target, battleManager, result);

        if (result.success && result.damage > 0) {
            // Add attack VFX
            if (!result.vfx) result.vfx = [];
            result.vfx.push({
                name: 'solar-beam-vfx',
                target: target,
                duration: 600
            });

            // Healing effect (enhanced by Glacial Bloom ability)
            let healMultiplier = 0.25; // Base 25% healing
            if (user.ability && user.ability.name === "Glacial Bloom") {
                healMultiplier = 0.50; // Doubled healing with ability
            }

            const healAmount = Math.floor(result.damage * healMultiplier);
            const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
            
            if (actualHeal > 0) {
                user.currentHP += actualHeal;
                result.messages.push(`${user.name} absorbed sunlight and restored ${actualHeal} HP!`);
                result.effects.push("healing");
                
                // Add healing VFX
                result.vfx.push({
                    name: 'healing-bloom-vfx',
                    target: user,
                    duration: 1500
                });
            }
        }

        return result;
    }
} 