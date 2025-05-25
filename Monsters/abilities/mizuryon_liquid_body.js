// Liquid Body - Mizuryon's passive ability
export class LiquidBody {
    constructor() {
        this.name = "Liquid Body";
        this.description = "Speed is increased by 50% and critical hit ratio is doubled. Water-type moves have increased accuracy";
        this.isPassive = true;
        this.ownerName = "Mizuryon";
        this.speedMultiplier = 1.5; // 50% speed increase
        this.critMultiplier = 2.0; // Double crit chance
        this.waterAccuracyBonus = 20; // +20 accuracy for water moves
        this.applied = false;
    }

    // Called when battle starts to apply stat modifications
    onBattleStart(user, battleState) {
        if (!this.applied) {
            // Apply speed boost
            user.stats.speed = Math.floor(user.stats.speed * this.speedMultiplier);
            this.applied = true;
            
            return {
                triggered: true,
                message: `${user.name}'s Liquid Body increases speed and sharpens instincts!`,
                changes: {
                    speed: { multiplier: this.speedMultiplier }
                }
            };
        }
        return { triggered: false };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        if (!this.applied) {
            user.stats.speed = Math.floor(user.stats.speed * this.speedMultiplier);
            this.applied = true;
        }
        
        return {
            triggered: true,
            message: `${user.name}'s Liquid Body flows with incredible grace!`
        };
    }

    // Called when calculating critical hit chance
    onCriticalHitCheck(move, user, target, battleState) {
        // Double the critical hit chance for all moves
        const baseCritChance = 0.0625; // Standard 1/16 chance
        const boostedCritChance = baseCritChance * this.critMultiplier;
        
        return {
            triggered: true,
            critChance: boostedCritChance,
            message: move.name === "Precision Strike" ? 
                `${user.name}'s Liquid Body ensures perfect precision!` :
                null // Only show message for special moves
        };
    }

    // Called when move accuracy is calculated
    onAccuracyCheck(move, user, target, battleState) {
        // Boost accuracy for Water-type moves
        if (move.type === "Water") {
            const boostedAccuracy = Math.min(100, move.accuracy + this.waterAccuracyBonus);
            
            return {
                triggered: true,
                accuracy: boostedAccuracy,
                message: boostedAccuracy > move.accuracy ? 
                    `${user.name}'s Liquid Body enhances ${move.name}'s precision!` : null
            };
        }
        
        return { triggered: false };
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // Special handling for Precision Strike (always crits)
        if (move.name === "Precision Strike") {
            return {
                triggered: true,
                guaranteedCrit: true,
                message: `${user.name}'s Liquid Body guides the Precision Strike to a vital spot!`
            };
        }
        
        return { triggered: false };
    }

    // Reset ability (called between battles)
    reset() {
        this.applied = false;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "battle_start":
            case "switch_in":
                return true;
            case "critical_hit_check":
                return true; // Always modify crit chance
            case "accuracy_check":
                const [move] = args;
                return move.type === "Water";
            case "move_use":
                const [moveUsed] = args;
                return moveUsed.name === "Precision Strike";
            default:
                return false;
        }
    }
} 