// Pixilate - Bunburrow's passive ability
export class Pixilate {
    constructor() {
        this.name = "Pixilate";
        this.description = "Normal-type moves become Fairy-type and gain a 20% power boost";
        this.isPassive = true;
        this.ownerName = "Bunburrow";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // Only affects Normal-type moves
        if (move.type === "Normal") {
            // Convert to Fairy type
            const originalType = move.type;
            move.type = "Fairy";
            
            // Boost power by 20%
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * 1.2);
            }

            return {
                triggered: true,
                message: `${user.name}'s Pixilate converted ${move.name} to Fairy-type!`,
                changes: {
                    type: { from: originalType, to: "Fairy" },
                    power: { from: originalPower, to: move.power }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Pixilate ability is ready to convert Normal moves to Fairy-type!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Pixilate ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Pixilate doesn't need resetting as it's a passive transformation ability
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Normal";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 