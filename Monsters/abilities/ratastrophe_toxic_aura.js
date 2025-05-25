// Toxic Aura - Ratastrophe's passive ability
export class ToxicAura {
    constructor() {
        this.name = "Toxic Aura";
        this.description = "All attacks have a 40% chance to poison the target. Poisoned enemies take 15% max HP damage each turn instead of the usual 12.5%";
        this.isPassive = true;
        this.ownerName = "Ratastrophe";
        this.poisonChance = 0.40; // 40% poison chance
        this.enhancedPoisonDamage = 0.15; // 15% max HP per turn
        this.normalPoisonDamage = 0.125; // 12.5% normal poison
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // All attacks that deal damage have a chance to poison
        if (move.power > 0 && Math.random() < this.poisonChance) {
            if (target.statusCondition === "none") {
                target.statusCondition = "poison";
                target.statusTurns = 999; // Poison lasts until cured
                
                return {
                    triggered: true,
                    message: `${target.name} was poisoned by ${user.name}'s Toxic Aura!`
                };
            }
        }

        return { triggered: false };
    }

    // Called when poison damage is calculated each turn
    onPoisonDamage(target, battleState) {
        if (target.statusCondition === "poison" || target.statusCondition === "badly_poisoned") {
            const enhancedDamage = Math.floor(target.maxHP * this.enhancedPoisonDamage);
            return {
                triggered: true,
                damage: enhancedDamage,
                message: `${target.name} is badly poisoned by Toxic Aura! (${enhancedDamage} damage)`
            };
        }

        return { triggered: false };
    }

    // Called when damage is dealt to enhance existing poison
    onDamageDealt(move, user, target, damage, battleState) {
        if (move.name === "Plague Bite" && (target.statusCondition === "poison" || target.statusCondition === "badly_poisoned")) {
            const bonusDamage = Math.floor(damage * 0.5); // 50% bonus damage
            return {
                triggered: true,
                bonusDamage: bonusDamage,
                message: `${move.name} deals extra damage to the poisoned ${target.name}!`
            };
        }

        return { triggered: false };
    }

    // Called when Toxic Overload is used
    onToxicOverload(user, targets, battleState) {
        let results = { triggered: true, messages: [] };
        
        // Badly poison all targets
        targets.forEach(target => {
            if (target.statusCondition === "none" || target.statusCondition === "poison") {
                target.statusCondition = "badly_poisoned";
                target.statusTurns = 999; // Lasts until cured
                results.messages.push(`${target.name} is badly poisoned!`);
            }
        });

        // Double existing poison damage for 3 turns
        if (!battleState.toxicOverloadActive) {
            battleState.toxicOverloadActive = true;
            battleState.toxicOverloadTurns = 3;
            results.messages.push("All poison damage is doubled for 3 turns!");
        }

        return results;
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Toxic Aura spreads poison through the battlefield!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Toxic Aura fills the air with noxious fumes!`
        };
    }

    // Called at the end of each turn for poison damage
    onTurnEnd(user, battleState) {
        // Handle toxic overload duration
        if (battleState.toxicOverloadActive && battleState.toxicOverloadTurns > 0) {
            battleState.toxicOverloadTurns--;
            if (battleState.toxicOverloadTurns <= 0) {
                battleState.toxicOverloadActive = false;
                return {
                    triggered: true,
                    message: "The enhanced poison effects wear off..."
                };
            }
        }
        
        return { triggered: false };
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
                return move.power > 0;
            case "poison_damage":
                return true;
            case "damage_dealt":
                const [moveDealt] = args;
                return moveDealt.name === "Plague Bite";
            case "toxic_overload":
                return true;
            case "battle_start":
            case "switch_in":
            case "turn_end":
                return true;
            default:
                return false;
        }
    }
} 