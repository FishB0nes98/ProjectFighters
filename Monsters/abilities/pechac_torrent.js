// Torrent - Pechac's passive ability
export class Torrent {
    constructor() {
        this.name = "Torrent";
        this.description = "Powers up Water-type moves when HP is low (below 33%)";
        this.isPassive = true;
        this.ownerName = "Pechac";
        this.activationThreshold = 0.33; // 33% HP threshold
        this.powerMultiplier = 1.5; // 50% power boost
    }

    // Check if ability should be active
    isActive(user) {
        const hpPercentage = user.currentHP / user.maxHP;
        return hpPercentage <= this.activationThreshold;
    }

    // Called when a move is about to be executed
    onMoveUse(move, user, target, battleState) {
        // Only affects Water-type moves when HP is low
        if (move.type === "Water" && this.isActive(user)) {
            const originalPower = move.power;
            if (move.power > 0) {
                move.power = Math.floor(move.power * this.powerMultiplier);
            }

            return {
                triggered: true,
                message: `${user.name}'s Torrent boosted ${move.name}'s power!`,
                changes: {
                    power: { from: originalPower, to: move.power }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Torrent ability is ready! Water moves will be boosted when HP is low!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        if (this.isActive(user)) {
            return {
                triggered: true,
                message: `${user.name}'s Torrent is active! Water moves are powered up!`
            };
        } else {
            return {
                triggered: true,
                message: `${user.name}'s Torrent ability is ready!`
            };
        }
    }

    // Called when HP changes
    onHPChange(user, oldHP, newHP, battleState) {
        const oldPercentage = oldHP / user.maxHP;
        const newPercentage = newHP / user.maxHP;
        
        // Check if we crossed the activation threshold
        if (oldPercentage > this.activationThreshold && newPercentage <= this.activationThreshold) {
            return {
                triggered: true,
                message: `${user.name}'s Torrent activated! Water-type moves are now powered up!`
            };
        }
        
        return { triggered: false };
    }

    // Reset ability (called between battles)
    reset() {
        // Torrent doesn't need resetting as it's based on current HP
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "move_use":
                const [move] = args;
                return move.type === "Water" && this.isActive(user);
            case "battle_start":
            case "switch_in":
                return true;
            case "hp_change":
                return true; // Always check HP changes
            default:
                return false;
        }
    }
} 