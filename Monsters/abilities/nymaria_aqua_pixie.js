// Aqua Pixie - Nymaria's passive ability
export class AquaPixie {
    constructor() {
        this.name = "Aqua Pixie";
        this.description = "Water-type moves become Fairy-type with 20% power boost. Healing moves restore 50% more HP.";
        this.isPassive = true;
        this.ownerName = "Nymaria";
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        let triggered = false;
        let message = "";
        let changes = {};

        // Convert Water-type moves to Fairy-type and boost power
        if (move.type === "Water") {
            const originalType = move.type;
            move.type = "Fairy";
            
            // Boost power by 20%
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * 1.2);
            }

            triggered = true;
            message = `${user.name}'s Aqua Pixie converted ${move.name} to Fairy-type!`;
            changes.type = { from: originalType, to: "Fairy" };
            changes.power = { from: originalPower, to: move.power };
        }

        // Boost healing moves by 50%
        if (move.effects && move.effects.includes("healing")) {
            triggered = true;
            message += (message ? " " : "") + `${user.name}'s Aqua Pixie enhanced healing power!`;
            changes.healingBoost = 1.5;
        }

        return triggered ? { triggered: true, message, changes } : { triggered: false };
    }

    // Called when healing occurs
    onHealingMove(healAmount, user, battleState) {
        // Boost healing by 50%
        const boostedHeal = Math.floor(healAmount * 1.5);
        
        return {
            triggered: true,
            message: `${user.name}'s Aqua Pixie boosted the healing!`,
            changes: {
                healAmount: { from: healAmount, to: boostedHeal }
            },
            modifiedHeal: boostedHeal
        };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Aqua Pixie ability is ready to enhance Water and healing moves!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Aqua Pixie ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Aqua Pixie doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Water" || (move.effects && move.effects.includes("healing"));
            case "healing":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 