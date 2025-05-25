// Glacial Bloom - Cryorose's passive ability
export class GlacialBloom {
    constructor() {
        this.name = "Glacial Bloom";
        this.description = "Ice-type moves have a 30% chance to freeze the target, and Grass-type moves heal the user for 25% of damage dealt";
        this.isPassive = true;
        this.ownerName = "Cryorose";
        this.freezeChance = 0.30; // 30% freeze chance
        this.healPercentage = 0.25; // 25% healing
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        let results = { triggered: false, messages: [] };

        // Ice-type moves have chance to freeze
        if (move.type === "Ice" && move.power > 0) {
            if (Math.random() < this.freezeChance) {
                if (target.statusCondition === "none") {
                    target.statusCondition = "frozen";
                    target.statusTurns = 2 + Math.floor(Math.random() * 2); // 2-3 turns
                    results.triggered = true;
                    results.messages.push(`${user.name}'s Glacial Bloom froze ${target.name}!`);
                }
            }
        }

        return results.triggered ? results : { triggered: false };
    }

    // Called after damage is dealt
    onDamageDealt(move, user, target, damage, battleState) {
        // Grass-type moves heal the user
        if (move.type === "Grass" && damage > 0) {
            const healAmount = Math.floor(damage * this.healPercentage);
            const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
            
            if (actualHeal > 0) {
                user.currentHP += actualHeal;
                return {
                    triggered: true,
                    message: `${user.name}'s Glacial Bloom restored ${actualHeal} HP!`,
                    changes: {
                        healing: actualHeal
                    }
                };
            }
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Glacial Bloom ability is ready! Ice moves may freeze, Grass moves will heal!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Glacial Bloom creates a mystical aura!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // No persistent state to reset
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Ice" && move.power > 0;
            case "damage_dealt":
                const [moveDealt] = args;
                return moveDealt.type === "Grass";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 