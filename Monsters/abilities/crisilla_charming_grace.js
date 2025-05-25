// Charming Grace - Crisilla's passive ability
export class CharmingGrace {
    constructor() {
        this.name = "Charming Grace";
        this.description = "Critical hit ratio is doubled. Physical attacks have a 30% chance to infatuate the target.";
        this.isPassive = true;
        this.ownerName = "Crisilla";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        let abilityTriggered = false;
        let abilityMessage = "";
        let abilityChanges = {};

        // Double critical hit ratio for all moves
        if (move.power > 0) {
            move.critRatio = (move.critRatio || 1) * 2;
            abilityTriggered = true;
            abilityMessage = `${user.name}'s Charming Grace increased critical hit chance!`;
            abilityChanges.critRatio = { from: move.critRatio / 2, to: move.critRatio };
        }

        return abilityTriggered ? { triggered: true, message: abilityMessage, changes: abilityChanges } : { triggered: false };
    }

    // Called after a physical move hits
    onPhysicalHit(move, user, target, battleState) {
        if (move.category === "Physical") {
            const infatuationChance = Math.random();
            if (infatuationChance <= 0.3) {
                // Apply infatuation status
                if (!target.statusEffects) target.statusEffects = [];
                if (!target.statusEffects.includes("infatuated")) {
                    target.statusEffects.push("infatuated");
                    return {
                        triggered: true,
                        message: `${target.name} became infatuated with ${user.name}!`,
                        changes: {
                            statusEffect: { type: "infatuated", target: target.name }
                        }
                    };
                }
            }
        }
        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Charming Grace enhances critical hits and charms enemies!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s charming presence fills the battlefield!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Charming Grace doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [moveToUse] = args;
                return moveToUse.power > 0;
            case "physical_hit":
                const [physicalMove] = args;
                return physicalMove.category === "Physical";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 