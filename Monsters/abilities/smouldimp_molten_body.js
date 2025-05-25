// Molten Body - Smouldimp's passive ability
export class MoltenBody {
    constructor() {
        this.name = "Molten Body";
        this.description = "Contact moves burn the attacker. HP loss from burns heals this monster instead.";
        this.isPassive = true;
        this.ownerName = "Smouldimp";
    }

    // Called when hit by a contact move
    onContactMove(move, attacker, user, battleState) {
        if (move.contact) {
            // Apply burn status to the attacker
            if (!attacker.statusEffects) attacker.statusEffects = [];
            if (!attacker.statusEffects.includes("burned")) {
                attacker.statusEffects.push("burned");
                return {
                    triggered: true,
                    message: `${attacker.name} was burned by ${user.name}'s molten body!`,
                    changes: {
                        statusEffect: { type: "burned", target: attacker.name }
                    }
                };
            }
        }
        return { triggered: false };
    }

    // Called when burn damage is calculated
    onBurnDamage(user, battleState, burnDamage) {
        // Instead of taking burn damage, Smouldimp heals
        const maxHP = user.maxHP || user.stats.hp;
        const healAmount = Math.min(burnDamage, maxHP - (user.currentHP || user.stats.hp));
        
        if (healAmount > 0) {
            user.currentHP = (user.currentHP || user.stats.hp) + healAmount;
            return {
                triggered: true,
                message: `${user.name}'s Molten Body absorbed the burn damage and healed!`,
                changes: {
                    healing: { amount: healAmount, newHP: user.currentHP }
                }
            };
        }
        
        return { triggered: false };
    }

    // Called when taking damage from fire moves
    onFireDamage(move, user, battleState, damage) {
        if (move.type === "Fire") {
            // Reduce fire damage by 50%
            const reducedDamage = Math.floor(damage * 0.5);
            const healAmount = damage - reducedDamage;
            
            if (healAmount > 0) {
                const maxHP = user.maxHP || user.stats.hp;
                user.currentHP = Math.min((user.currentHP || user.stats.hp) + healAmount, maxHP);
                
                return {
                    triggered: true,
                    message: `${user.name}'s Molten Body absorbed some of the fire damage!`,
                    changes: {
                        damageReduction: { from: damage, to: reducedDamage },
                        healing: { amount: healAmount, newHP: user.currentHP }
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
            message: `${user.name}'s molten body radiates intense heat!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s molten form bubbles and glows!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Molten Body doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "contact_move":
                const [contactMove] = args;
                return contactMove.contact === true;
            case "burn_damage":
                return true;
            case "fire_damage":
                const [fireMove] = args;
                return fireMove.type === "Fire";
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 