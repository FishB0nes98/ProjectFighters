// Static Current - Buzzy's passive ability
export class StaticCurrent {
    constructor() {
        this.name = "Static Current";
        this.description = "Electric moves have 50% chance to paralyze. Speed is doubled when any status condition is active on the field.";
        this.isPassive = true;
        this.ownerName = "Buzzy";
    }

    // Called when an electric move is used
    onElectricMove(move, user, target, battleState) {
        if (move.type === "Electric" && move.power > 0) {
            const paralysisChance = Math.random();
            if (paralysisChance <= 0.5) {
                // Apply paralysis status
                if (!target.statusEffects) target.statusEffects = [];
                if (!target.statusEffects.includes("paralyzed")) {
                    target.statusEffects.push("paralyzed");
                    return {
                        triggered: true,
                        message: `${target.name} was paralyzed by ${user.name}'s Static Current!`,
                        changes: {
                            statusEffect: { type: "paralyzed", target: target.name }
                        }
                    };
                }
            }
        }
        return { triggered: false };
    }

    // Called when calculating speed
    onSpeedCalculation(user, battleState) {
        // Check if any monster on the field has a status condition
        let statusOnField = false;
        
        if (user.statusEffects && user.statusEffects.length > 0) {
            statusOnField = true;
        }
        
        // Check opponent's status (if available)
        if (battleState.opponent && battleState.opponent.statusEffects && battleState.opponent.statusEffects.length > 0) {
            statusOnField = true;
        }

        if (statusOnField) {
            const originalSpeed = user.stats.speed;
            user.stats.speed = Math.floor(originalSpeed * 2);
            return {
                triggered: true,
                message: `${user.name}'s Static Current doubled its speed!`,
                changes: {
                    speed: { from: originalSpeed, to: user.stats.speed }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Static Current crackles with electric energy!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s static electricity fills the air!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Static Current doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "electric_move":
                const [electricMove] = args;
                return electricMove.type === "Electric" && electricMove.power > 0;
            case "speed_calculation":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 