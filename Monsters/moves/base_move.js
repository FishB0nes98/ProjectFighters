// Base Move Class - Provides standardized functionality for all moves
export class BaseMove {
    constructor() {
        this.name = "Base Move";
        this.type = "Normal";
        this.category = "Physical"; // Physical, Special, Status
        this.power = 0;
        this.accuracy = 100;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "A basic move.";
        this.effects = [];
        this.criticalHitRate = 1; // 1 = normal crit rate (6.25%)
        this.makesContact = false;
        this.targetType = "single_enemy"; // single_enemy, self, ally_team, enemy_team, all
    }

    // Standard execute method that handles common functionality
    execute(user, target, battleManager, battleState) {
        const result = {
            success: true,
            damage: 0,
            messages: [],
            effects: [],
            critical: false,
            effectiveness: 1.0
        };

        // Calculate type effectiveness
        if (this.category !== "Status" || this.affectedByTypeEffectiveness) {
            result.effectiveness = battleManager.calculateTypeEffectiveness(this.type, target.types);
            
            if (result.effectiveness === 0) {
                result.success = false;
                result.messages.push(`${target.name} is immune to ${this.name}!`);
                return result;
            }
        }

        // Accuracy check (unless move never misses)
        if (this.accuracy < 100 && !this.neverMisses) {
            if (Math.random() * 100 > this.accuracy) {
                result.success = false;
                result.messages.push(`${this.name} missed!`);
                return result;
            }
        }

        // Execute the specific move logic
        return this.executeSpecific(user, target, battleManager, battleState, result);
    }

    // Override this method in specific moves
    executeSpecific(user, target, battleManager, battleState, result) {
        // Default implementation for damaging moves
        if (this.category !== "Status") {
            return this.executeDamageMove(user, target, battleManager, result);
        }
        
        result.messages.push(`${user.name} used ${this.name}!`);
        return result;
    }

    // Standard damage calculation
    executeDamageMove(user, target, battleManager, result) {
        // Critical hit check
        const critThreshold = this.criticalHitRate === 1 ? 6.25 : this.criticalHitRate * 6.25;
        result.critical = Math.random() * 100 < critThreshold;

        // Calculate damage
        result.damage = battleManager.calculateDamage(user, target, this, result.critical);
        result.damage = Math.floor(result.damage * result.effectiveness);

        // Apply damage
        const actualDamage = Math.min(result.damage, target.currentHP);
        target.currentHP -= actualDamage;
        result.damage = actualDamage;

        // Create damage message
        let damageMessage = `${this.name} dealt ${actualDamage} damage to ${target.name}`;
        if (result.critical) {
            damageMessage += " (Critical hit!)";
        }
        if (result.effectiveness > 1) {
            damageMessage += " (Super effective!)";
        } else if (result.effectiveness < 1) {
            damageMessage += " (Not very effective...)";
        }
        result.messages.push(damageMessage);

        return result;
    }

    // Apply status condition
    applyStatusCondition(target, status, duration = 4) {
        if (target.statusCondition !== "none") {
            return {
                success: false,
                message: `${target.name} is already affected by a status condition!`
            };
        }

        target.statusCondition = status;
        target.statusTurns = duration;
        return {
            success: true,
            message: `${target.name} was ${status}!`
        };
    }

    // Apply stat modification
    applyStatModification(target, stat, stages, battleManager) {
        const result = battleManager.applyStatModification(target, stat, stages);
        
        if (!result.success) {
            return {
                success: false,
                message: `${target.name}'s ${stat} won't go any ${stages > 0 ? 'higher' : 'lower'}!`
            };
        }

        const direction = stages > 0 ? 'rose' : 'fell';
        const amount = Math.abs(stages) === 1 ? '' : 
                      Math.abs(stages) === 2 ? ' sharply' : ' drastically';
        
        return {
            success: true,
            message: `${target.name}'s ${stat}${amount} ${direction}!`
        };
    }

    // Heal the user
    healUser(user, percentage = 0.5) {
        const healAmount = Math.floor(user.maxHP * percentage);
        const actualHeal = Math.min(healAmount, user.maxHP - user.currentHP);
        user.currentHP += actualHeal;
        
        return {
            success: actualHeal > 0,
            amount: actualHeal,
            message: actualHeal > 0 ? 
                `${user.name} recovered ${actualHeal} HP!` : 
                `${user.name}'s HP is already full!`
        };
    }

    // Check if the move can be used
    canUse(user, target, battleManager) {
        return this.pp > 0;
    }

    // Reset PP (for between battles)
    reset() {
        this.pp = this.maxPP;
    }

    // Get move info for UI
    getInfo() {
        return {
            name: this.name,
            type: this.type,
            category: this.category,
            power: this.power,
            accuracy: this.accuracy,
            pp: this.pp,
            maxPP: this.maxPP,
            description: this.description,
            effects: this.effects,
            priority: this.priority
        };
    }

    // Get type effectiveness for preview
    getTypeEffectiveness(targetTypes, battleManager) {
        if (battleManager && battleManager.calculateTypeEffectiveness) {
            return battleManager.calculateTypeEffectiveness(this.type, targetTypes);
        }
        return 1; // Neutral if can't calculate
    }
} 