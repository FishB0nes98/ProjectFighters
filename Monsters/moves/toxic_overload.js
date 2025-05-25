// Toxic Overload - Ratastrophe's signature Poison move
import { BaseMove } from './base_move.js';

export class ToxicOverload extends BaseMove {
    constructor() {
        super();
        this.name = "Toxic Overload";
        this.type = "Poison";
        this.category = "Special";
        this.power = 20;
        this.accuracy = 100;
        this.pp = 5;
        this.maxPP = 5;
        this.priority = 0;
        this.description = "Badly poisons all enemies and doubles all existing poison damage for 3 turns.";
        this.effects = ["badly_poison", "battlefield_effect"];
        this.criticalHitRate = 1;
        this.makesContact = false;
        this.targetType = "enemy_team";
        this.targetAll = true;
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Execute standard damage first
        result = this.executeDamageMove(user, target, battleManager, result);

        if (result.success) {
            // Badly poison the target
            if (target.statusCondition === "none" || target.statusCondition === "poison") {
                target.statusCondition = "badly_poisoned";
                target.statusTurns = 999; // Lasts until cured
                result.effects.push('badly_poisoned');
                result.messages.push(`${target.name} was badly poisoned!`);

                // Add poison VFX
                if (!result.vfx) result.vfx = [];
                result.vfx.push({
                    name: 'poison-application-vfx',
                    target: target,
                    duration: 1000
                });
            }

            // Set battlefield effect - double poison damage for 3 turns
            if (!battleState.toxicOverloadActive) {
                battleState.toxicOverloadActive = true;
                battleState.toxicOverloadTurns = 3;
                battleState.toxicOverloadSource = user.name;
                
                result.messages.push("All poison damage is doubled for 3 turns!");
                
                // Add battlefield VFX
                result.vfx.push({
                    name: 'toxic-overload-explosion',
                    target: 'battlefield',
                    duration: 2000
                });
            }
        }

        return result;
    }

    // Handle turn-based effects
    static onTurnEnd(battleState) {
        if (battleState.toxicOverloadActive && battleState.toxicOverloadTurns > 0) {
            battleState.toxicOverloadTurns--;
            if (battleState.toxicOverloadTurns <= 0) {
                battleState.toxicOverloadActive = false;
                return {
                    message: "The enhanced poison effects wear off...",
                    vfx: []
                };
            } else {
                return {
                    message: `Enhanced poison effects continue for ${battleState.toxicOverloadTurns} more turns.`,
                    vfx: []
                };
            }
        }
        return { message: null, vfx: [] };
    }

    // Check if toxic overload is active for poison damage calculation
    static isActive(battleState) {
        return battleState?.toxicOverloadActive === true;
    }
} 