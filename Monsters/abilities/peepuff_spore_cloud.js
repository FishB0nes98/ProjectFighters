// Spore Cloud - Peepuff's passive ability
export class SporeCloud {
    constructor() {
        this.name = "Spore Cloud";
        this.description = "When HP drops below 50%, releases spores that have 30% chance to inflict sleep or poison on attackers.";
        this.isPassive = true;
        this.ownerName = "Peepuff";
        this.isActivated = false;
    }

    // Called when the user takes damage
    onTakeDamage(damage, attacker, user, battleState) {
        const hpPercentage = user.currentHP / user.maxHP;
        
        // Activate when HP drops below 50% and hasn't been activated yet this battle
        if (hpPercentage < 0.5 && !this.isActivated) {
            this.isActivated = true;
            
            return {
                triggered: true,
                message: `${user.name}'s low HP triggered Spore Cloud!`,
                changes: {
                    sporeCloudActive: true
                }
            };
        }

        // If already activated, chance to affect attacker
        if (this.isActivated && attacker && attacker.statusCondition === "none") {
            if (Math.random() < 0.30) {
                // Randomly choose between sleep and poison
                const statusEffect = Math.random() < 0.5 ? "sleep" : "poison";
                attacker.statusCondition = statusEffect;
                attacker.statusTurns = statusEffect === "sleep" ? 3 : 4;
                
                return {
                    triggered: true,
                    message: `${attacker.name} was affected by ${user.name}'s spore cloud and became ${statusEffect}ed!`,
                    changes: {
                        statusInflicted: statusEffect
                    }
                };
            }
        }

        return { triggered: false };
    }

    // Called when user is attacked with a contact move
    onContactMove(attacker, user, battleState) {
        if (this.isActivated && attacker.statusCondition === "none") {
            if (Math.random() < 0.30) {
                // Randomly choose between sleep and poison
                const statusEffect = Math.random() < 0.5 ? "sleep" : "poison";
                attacker.statusCondition = statusEffect;
                attacker.statusTurns = statusEffect === "sleep" ? 3 : 4;
                
                return {
                    triggered: true,
                    message: `${attacker.name} was affected by ${user.name}'s spore cloud on contact and became ${statusEffect}ed!`,
                    changes: {
                        statusInflicted: statusEffect
                    }
                };
            }
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.isActivated = false;
        return {
            triggered: true,
            message: `${user.name}'s Spore Cloud ability is ready to activate when HP is low!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Spore Cloud ability is active!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        this.isActivated = false;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "take_damage":
                return true;
            case "contact_move":
                return this.isActivated;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 