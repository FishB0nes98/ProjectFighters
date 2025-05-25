// Speed Boost - Scorchlete's passive ability
export class SpeedBoost {
    constructor() {
        this.name = "Speed Boost";
        this.description = "Speed increases by 50% each turn. Fire-type moves have 15% increased critical hit rate.";
        this.isPassive = true;
        this.ownerName = "Scorchlete";
        this.turnCount = 0;
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // Boost Fire-type move critical hit rate
        if (move.type === "Fire") {
            const originalCritRate = move.criticalHitRate;
            move.criticalHitRate = Math.min(move.criticalHitRate + 0.15, 1.0); // Cap at 100%

            return {
                triggered: true,
                message: `${user.name}'s Speed Boost enhanced ${move.name}'s critical hit chance!`,
                changes: {
                    criticalHitRate: { from: originalCritRate, to: move.criticalHitRate }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the end of each turn
    onTurnEnd(user, battleState) {
        this.turnCount++;
        
        // Initialize stat modifiers if they don't exist
        if (!user.statModifiers) {
            user.statModifiers = { speed: 0 };
        }

        // Boost speed by 1 stage each turn (max +6)
        if (user.statModifiers.speed < 6) {
            user.statModifiers.speed = Math.min(user.statModifiers.speed + 1, 6);
            
            return {
                triggered: true,
                message: `${user.name}'s Speed Boost increased its speed!`,
                changes: {
                    speedStage: user.statModifiers.speed
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.turnCount = 0;
        return {
            triggered: true,
            message: `${user.name}'s Speed Boost ability will increase speed each turn!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Speed Boost ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        this.turnCount = 0;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Fire";
            case "turn_end":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 