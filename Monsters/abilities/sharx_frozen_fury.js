// Frozen Fury - Sharx's passive ability
export class FrozenFury {
    constructor() {
        this.name = "Frozen Fury";
        this.description = "Physical attacks have 20% chance to freeze. Attack increases by 50% when below 30% HP.";
        this.isPassive = true;
        this.ownerName = "Sharx";
        this.furyActivated = false;
    }

    // Called when a physical move is used
    onPhysicalMove(move, user, target, battleState) {
        if (move.category === "Physical" && move.power > 0) {
            const freezeChance = Math.random();
            if (freezeChance <= 0.2) {
                // Apply freeze status
                if (!target.statusEffects) target.statusEffects = [];
                if (!target.statusEffects.includes("frozen")) {
                    target.statusEffects.push("frozen");
                    return {
                        triggered: true,
                        message: `${target.name} was frozen solid by ${user.name}'s Frozen Fury!`,
                        changes: {
                            statusEffect: { type: "frozen", target: target.name }
                        }
                    };
                }
            }
        }
        return { triggered: false };
    }

    // Called when calculating attack
    onAttackCalculation(user, battleState) {
        const currentHP = user.currentHP || user.stats.hp;
        const maxHP = user.maxHP || user.stats.hp;
        const hpPercentage = currentHP / maxHP;

        if (hpPercentage <= 0.3 && !this.furyActivated) {
            this.furyActivated = true;
            const originalAttack = user.stats.attack;
            user.stats.attack = Math.floor(originalAttack * 1.5);
            
            return {
                triggered: true,
                message: `${user.name}'s Frozen Fury activated! Attack was boosted!`,
                changes: {
                    attack: { from: originalAttack, to: user.stats.attack }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.furyActivated = false;
        return {
            triggered: true,
            message: `${user.name}'s icy rage is ready to unleash!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s frozen fury chills the battlefield!`
        };
    }

    // Called on HP change
    onHPChange(user, battleState) {
        return this.onAttackCalculation(user, battleState);
    }

    // Reset ability (called between battles)
    reset() {
        this.furyActivated = false;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "physical_move":
                const [physicalMove] = args;
                return physicalMove.category === "Physical" && physicalMove.power > 0;
            case "attack_calculation":
            case "hp_change":
                const currentHP = user.currentHP || user.stats.hp;
                const maxHP = user.maxHP || user.stats.hp;
                return (currentHP / maxHP) <= 0.3 && !this.furyActivated;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 