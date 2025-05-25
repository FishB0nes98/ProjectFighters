// Absolute Freeze - Fulverice's passive ability
export class AbsoluteFreeze {
    constructor() {
        this.name = "Absolute Freeze";
        this.description = "All Water-type moves become Ice-type and freeze the user. Water-types take 2x damage from all attacks. Immune to Water moves.";
        this.isPassive = true;
        this.ownerName = "Fulverice";
    }

    // Called when a move is used against this monster
    onMoveReceived(move, user, target, battleState) {
        if (move.type === "Water") {
            // Convert Water move to Ice type
            move.type = "Ice";
            
            // Freeze the user of the Water move
            if (!user.statusEffects) user.statusEffects = [];
            if (!user.statusEffects.includes("frozen")) {
                user.statusEffects.push("frozen");
            }
            
            return {
                triggered: true,
                message: `${target.name}'s Absolute Freeze turned ${move.name} into ice and froze ${user.name}!`,
                changes: {
                    moveType: { from: "Water", to: "Ice" },
                    statusEffect: { type: "frozen", target: user.name }
                }
            };
        }
        return { triggered: false };
    }

    // Called when calculating damage received
    onDamageCalculation(damage, move, user, target, battleState) {
        // Water types take double damage from all attacks
        if (user.types && user.types.includes("Water")) {
            const newDamage = Math.floor(damage * 2);
            return {
                triggered: true,
                message: `${user.name} is terrified by ${target.name}'s presence!`,
                changes: {
                    damage: { from: damage, to: newDamage }
                },
                newDamage: newDamage
            };
        }
        return { triggered: false, newDamage: damage };
    }

    // Called when any move is used on the battlefield
    onAnyMoveUsed(move, user, target, battleState) {
        if (move.type === "Water" && target === this.owner) {
            // Make user immune to Water moves
            return {
                triggered: true,
                message: `${target.name} is immune to Water-type moves!`,
                changes: {
                    immunity: true
                },
                immune: true
            };
        }
        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Absolute Freeze chills the very air! Water trembles in fear!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `The temperature drops drastically as ${user.name} enters the battlefield!`
        };
    }

    // Reset ability
    reset() {
        // No state to reset
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_received":
                const [move] = args;
                return move.type === "Water";
            case "damage_calculation":
                const [, , attacker] = args;
                return attacker.types && attacker.types.includes("Water");
            case "any_move_used":
                const [anyMove, , target] = args;
                return anyMove.type === "Water" && target === user;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 