// Dream Weaver - Lumillow's passive ability
export class DreamWeaver {
    constructor() {
        this.name = "Dream Weaver";
        this.description = "Sleep-inducing moves never miss. Sleeping enemies take 25% more damage from all attacks.";
        this.isPassive = true;
        this.ownerName = "Lumillow";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // Make sleep-inducing moves never miss
        if (move.effects && move.effects.includes("sleep")) {
            const originalAccuracy = move.accuracy;
            move.accuracy = 100; // Always hit
            
            return {
                triggered: true,
                message: `${user.name}'s Dream Weaver ensured ${move.name} will not miss!`,
                changes: {
                    accuracy: { from: originalAccuracy, to: 100 }
                }
            };
        }

        return { triggered: false };
    }

    // Called when calculating damage against a target
    onDamageCalculation(damage, user, target, move, battleState) {
        // Boost damage against sleeping targets by 25%
        if (target.statusCondition === "sleep") {
            const boostedDamage = Math.floor(damage * 1.25);
            
            return {
                triggered: true,
                message: `${user.name}'s Dream Weaver boosted damage against the sleeping ${target.name}!`,
                changes: {
                    damage: { from: damage, to: boostedDamage }
                },
                modifiedDamage: boostedDamage
            };
        }

        return { triggered: false };
    }

    // Called when using sleep-related moves
    onSleepMove(move, user, target, battleState) {
        // Ensure sleep moves always work
        if (move.effects && move.effects.includes("sleep")) {
            return {
                triggered: true,
                message: `${user.name}'s Dream Weaver weaves powerful sleep magic!`,
                changes: {
                    guaranteedSleep: true
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Dream Weaver ability enhances sleep magic and dream attacks!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Dream Weaver ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Dream Weaver doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.effects && move.effects.includes("sleep");
            case "damage_calculation":
                const [, , target] = args;
                return target.statusCondition === "sleep";
            case "sleep_move":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 