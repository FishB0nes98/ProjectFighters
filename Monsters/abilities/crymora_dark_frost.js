// Dark Frost - Crymora's passive ability
export class DarkFrost {
    constructor() {
        this.name = "Dark Frost";
        this.description = "Dark and Ice moves gain 25% power. Special Attack increases by one stage when hit by a Dark move.";
        this.isPassive = true;
        this.ownerName = "Crymora";
    }

    // Called when using dark or ice moves
    onDarkOrIceMove(move, user, target, battleState) {
        if (move.type === "Dark" || move.type === "Ice") {
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * 1.25);
            }
            
            return {
                triggered: true,
                message: `${user.name}'s Dark Frost enhanced ${move.name}!`,
                changes: {
                    power: { from: originalPower, to: move.power }
                }
            };
        }
        return { triggered: false };
    }

    // Called when hit by a dark move
    onHitByDarkMove(move, attacker, user, battleState) {
        if (move.type === "Dark") {
            // Increase special attack by one stage (50%)
            const originalSpecialAttack = user.stats.specialAttack;
            user.stats.specialAttack = Math.floor(originalSpecialAttack * 1.5);
            
            return {
                triggered: true,
                message: `${user.name}'s Dark Frost absorbed the dark energy! Special Attack rose!`,
                changes: {
                    specialAttack: { from: originalSpecialAttack, to: user.stats.specialAttack }
                }
            };
        }
        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s dark magic mingles with icy power!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name} brings forth an aura of dark frost!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Dark Frost doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "dark_or_ice_move":
                const [move] = args;
                return move.type === "Dark" || move.type === "Ice";
            case "hit_by_dark_move":
                const [darkMove] = args;
                return darkMove.type === "Dark";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 