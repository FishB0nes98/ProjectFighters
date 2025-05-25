// Ice Scales - Frosmoth's passive ability
export class IceScales {
    constructor() {
        this.name = "Ice Scales";
        this.description = "Special attacks deal 50% less damage. Ice moves have 100% accuracy and 20% chance to freeze. Immune to burn.";
        this.isPassive = true;
        this.ownerName = "Frosmoth";
    }

    // Called when receiving special damage
    onSpecialDamageReceived(damage, move, user, target, battleState) {
        if (move.category === "Special") {
            const reducedDamage = Math.floor(damage * 0.5);
            return {
                triggered: true,
                message: `${target.name}'s Ice Scales reduced the special attack's power!`,
                changes: {
                    damage: { from: damage, to: reducedDamage }
                },
                newDamage: reducedDamage
            };
        }
        return { triggered: false, newDamage: damage };
    }

    // Called when using Ice moves
    onIceMoveUsed(move, user, target, battleState) {
        if (move.type === "Ice") {
            // Set accuracy to 100%
            const originalAccuracy = move.accuracy;
            move.accuracy = 100;
            
            // 20% chance to freeze
            const freezeChance = Math.random();
            if (freezeChance <= 0.2) {
                if (!target.statusEffects) target.statusEffects = [];
                if (!target.statusEffects.includes("frozen")) {
                    target.statusEffects.push("frozen");
                    return {
                        triggered: true,
                        message: `${target.name} was frozen by ${user.name}'s icy scales!`,
                        changes: {
                            accuracy: { from: originalAccuracy, to: 100 },
                            statusEffect: { type: "frozen", target: target.name }
                        }
                    };
                }
            }
            
            return {
                triggered: true,
                message: `${user.name}'s Ice Scales ensured the ice attack hit perfectly!`,
                changes: {
                    accuracy: { from: originalAccuracy, to: 100 }
                }
            };
        }
        return { triggered: false };
    }

    // Called when receiving status conditions
    onStatusConditionReceived(condition, user, target, battleState) {
        if (condition === "burn") {
            return {
                triggered: true,
                message: `${target.name}'s Ice Scales prevent burning!`,
                changes: {
                    statusImmunity: "burn"
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
            message: `${user.name}'s crystalline scales shimmer with protective ice!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Ice Scales glisten in the light!`
        };
    }

    // Reset ability
    reset() {
        // No state to reset
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "special_damage_received":
                const [, move] = args;
                return move.category === "Special";
            case "ice_move_used":
                const [iceMove] = args;
                return iceMove.type === "Ice";
            case "status_condition_received":
                const [condition] = args;
                return condition === "burn";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 