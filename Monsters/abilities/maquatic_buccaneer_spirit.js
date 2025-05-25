// Buccaneer's Spirit - Maquatic's passive ability
export class BuccaneerSpirit {
    constructor() {
        this.name = "Buccaneer's Spirit";
        this.description = "Fighting moves get 25% power boost in water. Critical hits restore 25% of maximum HP.";
        this.isPassive = true;
        this.ownerName = "Maquatic";
    }

    // Called when a fighting move is used
    onFightingMove(move, user, target, battleState) {
        if (move.type === "Fighting") {
            // Check if battle is in water environment (simplified check)
            const isWaterEnvironment = battleState.environment === "water" || 
                                     battleState.weatherEffects?.includes("rain") ||
                                     user.types.includes("Water");
            
            if (isWaterEnvironment) {
                const originalPower = move.power;
                if (move.power > 0) {
                    move.power = Math.floor(move.power * 1.25);
                }
                
                return {
                    triggered: true,
                    message: `${user.name}'s Buccaneer's Spirit boosted ${move.name} in water!`,
                    changes: {
                        power: { from: originalPower, to: move.power }
                    }
                };
            }
        }
        return { triggered: false };
    }

    // Called when a critical hit occurs
    onCriticalHit(move, user, target, battleState) {
        const maxHP = user.maxHP || user.stats.hp;
        const healAmount = Math.floor(maxHP * 0.25);
        
        if (user.currentHP + healAmount <= maxHP) {
            user.currentHP += healAmount;
        } else {
            user.currentHP = maxHP;
        }

        return {
            triggered: true,
            message: `${user.name}'s Buccaneer's Spirit restored HP from the critical hit!`,
            changes: {
                healing: { amount: healAmount, newHP: user.currentHP }
            }
        };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s pirate spirit burns with adventurous flame!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name} enters with swashbuckling confidence!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        // Buccaneer's Spirit doesn't need resetting
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "fighting_move":
                const [fightingMove] = args;
                return fightingMove.type === "Fighting";
            case "critical_hit":
                return true;
            case "battle_start":
            case "switch_in":
                return true;
            default:
                return false;
        }
    }
} 