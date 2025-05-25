// Scrappy Fighter - Puffsqueak's passive ability
export class ScrappyFighter {
    constructor() {
        this.name = "Scrappy Fighter";
        this.description = "Physical moves gain 30% power boost. Fighting-type moves are super effective against Fairy types.";
        this.isPassive = true;
        this.ownerName = "Puffsqueak";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        let abilityTriggered = false;
        let abilityMessage = "";
        let abilityChanges = {};

        // Boost physical moves by 30%
        if (move.category === "Physical") {
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * 1.3);
            }

            abilityTriggered = true;
            abilityMessage = `${user.name}'s Scrappy Fighter boosted ${move.name}'s power!`;
            abilityChanges.power = { from: originalPower, to: move.power };
        }

        return abilityTriggered ? { triggered: true, message: abilityMessage, changes: abilityChanges } : { triggered: false };
    }

    // Called when calculating type effectiveness
    onTypeEffectiveness(move, targetTypes, user, battleState) {
        // Make Fighting-type moves super effective against Fairy types
        if (move.type === "Fighting" && targetTypes.includes("Fairy")) {
            return {
                triggered: true,
                message: `${user.name}'s Scrappy Fighter made ${move.name} super effective against Fairy type!`,
                changes: {
                    effectiveness: { from: "normal", to: "super_effective" }
                },
                modifiedEffectiveness: 2.0 // Super effective multiplier
            };
        }

        return { triggered: false };
    }

    // Called when using Fighting-type moves
    onFightingMove(move, user, target, battleState) {
        if (move.type === "Fighting") {
            return {
                triggered: true,
                message: `${user.name}'s fighting spirit burns bright!`,
                changes: {
                    fightingMoveBoost: true
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Scrappy Fighter ability enhances physical and fighting moves!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Scrappy Fighter ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Scrappy Fighter doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [moveToUse] = args;
                return moveToUse.category === "Physical";
            case "type_effectiveness":
                const [moveForType, targetTypes] = args;
                return moveForType.type === "Fighting" && targetTypes.includes("Fairy");
            case "fighting_move":
                const [fightingMove] = args;
                return fightingMove.type === "Fighting";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 