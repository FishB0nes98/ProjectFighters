// Frozen Majesty - Shiverion's passive ability
export class FrozenMajesty {
    constructor() {
        this.name = "Frozen Majesty";
        this.description = "Ice-type moves have 30% increased power and 20% chance to freeze. Dragon-type moves gain 25% critical hit rate.";
        this.isPassive = true;
        this.ownerName = "Shiverion";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        let triggered = false;
        let message = "";
        let changes = {};

        // Boost Ice-type moves
        if (move.type === "Ice") {
            // Increase power by 30%
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * 1.3);
            }

            triggered = true;
            message = `${user.name}'s Frozen Majesty boosted ${move.name}'s power!`;
            changes.power = { from: originalPower, to: move.power };
            changes.freezeChance = 0.2; // 20% freeze chance
        }

        // Boost Dragon-type move critical hit rate
        if (move.type === "Dragon") {
            const originalCritRate = move.criticalHitRate;
            move.criticalHitRate = Math.min(move.criticalHitRate + 0.25, 1.0); // Cap at 100%

            triggered = true;
            message += (message ? " " : "") + `${user.name}'s Frozen Majesty enhanced ${move.name}'s critical hit chance!`;
            changes.criticalHitRate = { from: originalCritRate, to: move.criticalHitRate };
        }

        return triggered ? { triggered: true, message, changes } : { triggered: false };
    }

    // Called after an Ice-type move hits
    onIceMoveHit(move, user, target, battleState) {
        // 20% chance to freeze the target (in addition to move's normal freeze chance)
        if (move.type === "Ice" && target.statusCondition === "none" && Math.random() < 0.2) {
            target.statusCondition = "frozen";
            target.statusTurns = 3;
            
            return {
                triggered: true,
                message: `${target.name} was frozen by ${user.name}'s Frozen Majesty!`,
                changes: {
                    statusInflicted: "frozen"
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Frozen Majesty ability enhances Ice and Dragon moves!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Frozen Majesty ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Frozen Majesty doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Ice" || move.type === "Dragon";
            case "ice_move_hit":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 