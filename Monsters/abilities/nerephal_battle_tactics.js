// Battle Tactics - Nerephal's passive ability
export class BattleTactics {
    constructor() {
        this.name = "Battle Tactics";
        this.description = "Switches automatically when at disadvantage. First move each turn has +1 priority and 20% more accuracy.";
        this.isPassive = true;
        this.ownerName = "Nerephal";
        this.isFirstMoveThisTurn = true;
    }

    // Called when calculating move priority
    onMovePriority(move, user, battleState) {
        if (this.isFirstMoveThisTurn) {
            move.priority = (move.priority || 0) + 1;
            return {
                triggered: true,
                message: `${user.name}'s Battle Tactics increased ${move.name}'s priority!`,
                changes: {
                    priority: { from: (move.priority || 0) - 1, to: move.priority }
                }
            };
        }
        return { triggered: false };
    }

    // Called when calculating move accuracy
    onMoveAccuracy(move, user, battleState) {
        if (this.isFirstMoveThisTurn) {
            const originalAccuracy = move.accuracy;
            move.accuracy = Math.min(100, Math.floor(move.accuracy * 1.2));
            this.isFirstMoveThisTurn = false; // Mark first move as used
            
            return {
                triggered: true,
                message: `${user.name}'s tactical precision improved ${move.name}'s accuracy!`,
                changes: {
                    accuracy: { from: originalAccuracy, to: move.accuracy }
                }
            };
        }
        return { triggered: false };
    }

    // Called when at type disadvantage
    onTypeDisadvantage(user, opponent, battleState) {
        // Simplified disadvantage check - should auto-switch in real implementation
        const shouldSwitch = this.calculateTypeDisadvantage(user.types, opponent.types);
        
        if (shouldSwitch) {
            return {
                triggered: true,
                message: `${user.name}'s Battle Tactics detected a disadvantage! Preparing to switch!`,
                changes: {
                    autoSwitch: { reason: "type_disadvantage", recommended: true }
                }
            };
        }
        return { triggered: false };
    }

    // Helper method to calculate type disadvantage
    calculateTypeDisadvantage(userTypes, opponentTypes) {
        // Simplified type effectiveness calculation
        const weakAgainst = {
            "Water": ["Electric", "Grass"],
            "Bug": ["Fire", "Flying", "Rock"]
        };
        
        for (const userType of userTypes) {
            if (weakAgainst[userType]) {
                for (const opponentType of opponentTypes) {
                    if (weakAgainst[userType].includes(opponentType)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Called at the start of each turn
    onTurnStart(user, battleState) {
        this.isFirstMoveThisTurn = true;
        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.isFirstMoveThisTurn = true;
        return {
            triggered: true,
            message: `${user.name} analyzes the battlefield with tactical precision!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        this.isFirstMoveThisTurn = true;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_priority":
            case "move_accuracy":
                return this.isFirstMoveThisTurn;
            case "type_disadvantage":
                return true;
            case "turn_start":
            case "battle_start":
                return true;
            default:
                return false;
        }
    }
} 