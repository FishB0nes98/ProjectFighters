// Light Screen - Defensive support move
import { BaseMove } from './base_move.js';

export class LightScreen extends BaseMove {
    constructor() {
        super();
        this.name = "Light Screen";
        this.type = "Psychic";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 30;
        this.maxPP = 30;
        this.description = "A wondrous wall of light is put up to reduce damage from special attacks for five turns.";
        this.effects = ["light_screen"];
        this.targetType = "ally_team";
        this.vfx = {
            type: "defensive_barrier",
            color: "#F85888",
            projectile: "🛡️",
            impactEffect: "light_barrier",
            screenShake: "none",
            sound: "psychic_barrier",
            particles: ["✨", "🌟", "💫"],
            barrier: "light_screen_wall"
        };
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Set up Light Screen effect in battle state
        if (!battleState.fieldEffects) {
            battleState.fieldEffects = {};
        }

        if (!battleState.fieldEffects.userSide) {
            battleState.fieldEffects.userSide = {};
        }

        battleState.fieldEffects.userSide.lightScreen = {
            turnsRemaining: 5,
            effect: "reduce_special_damage",
            reduction: 0.5 // 50% reduction in special damage
        };

        result.messages.push(`${user.name} used ${this.name}! A shimmering wall of light protects the team!`);
        result.effects.push("light_screen_active");
        result.fieldEffect = {
            type: "light_screen",
            side: "user",
            duration: 5
        };

        return result;
    }

    // Check if Light Screen is active
    static isActive(battleState, side = "user") {
        return battleState?.fieldEffects?.[`${side}Side`]?.lightScreen?.turnsRemaining > 0;
    }

    // Apply Light Screen damage reduction
    static applyReduction(damage, moveCategory, battleState, side = "user") {
        if (moveCategory === "Special" && this.isActive(battleState, side)) {
            const reduction = battleState.fieldEffects[`${side}Side`].lightScreen.reduction;
            return Math.floor(damage * reduction);
        }
        return damage;
    }

    // Decrease turn counter
    static decreaseTurns(battleState, side = "user") {
        if (battleState?.fieldEffects?.[`${side}Side`]?.lightScreen) {
            battleState.fieldEffects[`${side}Side`].lightScreen.turnsRemaining--;
            
            if (battleState.fieldEffects[`${side}Side`].lightScreen.turnsRemaining <= 0) {
                delete battleState.fieldEffects[`${side}Side`].lightScreen;
                return `The Light Screen faded away!`;
            }
        }
        return null;
    }
} 