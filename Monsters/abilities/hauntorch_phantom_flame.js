// Phantom Flame - Hauntorch's passive ability
export class PhantomFlame {
    constructor() {
        this.name = "Phantom Flame";
        this.description = "30% chance to avoid physical attacks completely. When avoiding, next Fire or Ghost move deals 50% more damage";
        this.isPassive = true;
        this.ownerName = "Hauntorch";
        this.avoidanceChance = 0.30; // 30% avoidance
        this.damageBoost = 1.5; // 50% damage boost
        this.nextMoveBoost = false; // Track if next move should be boosted
    }

    // Called when the user is about to be hit by an attack
    onBeingAttacked(move, attacker, user, battleState) {
        // Only avoid physical attacks
        if (move.category === "Physical" && Math.random() < this.avoidanceChance) {
            this.nextMoveBoost = true; // Next Fire/Ghost move gets boosted
            return {
                triggered: true,
                avoided: true,
                message: `${user.name} phased through the attack with Phantom Flame! Next Fire or Ghost move will be powered up!`
            };
        }

        return { triggered: false };
    }

    // Called when a move is about to be executed by the user
    onMoveUse(move, user, target, battleState) {
        // Boost Fire or Ghost moves if we have the boost ready
        if (this.nextMoveBoost && (move.type === "Fire" || move.type === "Ghost") && move.power > 0) {
            const originalPower = move.power;
            move.power = Math.floor(move.power * this.damageBoost);
            this.nextMoveBoost = false; // Consume the boost

            return {
                triggered: true,
                message: `${user.name}'s Phantom Flame boosted ${move.name}'s power!`,
                changes: {
                    power: { from: originalPower, to: move.power }
                }
            };
        }

        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.nextMoveBoost = false; // Reset boost state
        return {
            triggered: true,
            message: `${user.name}'s Phantom Flame flickers ominously! Physical attacks may be avoided!`
        };
    }

    // Called when the user switches in
    onSwitchIn(user, battleState) {
        return {
            triggered: true,
            message: `${user.name}'s Phantom Flame blazes with spectral energy!`
        };
    }

    // Called at the start of each turn
    onTurnStart(user, battleState) {
        // Visual indicator if boost is ready
        if (this.nextMoveBoost) {
            return {
                triggered: true,
                message: `${user.name}'s Phantom Flame is ready to boost the next Fire or Ghost move!`
            };
        }
        return { triggered: false };
    }

    // Reset ability (called between battles)
    reset() {
        this.nextMoveBoost = false;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "being_attacked":
                const [move] = args;
                return move.category === "Physical";
            case "move_use":
                const [moveUsed] = args;
                return this.nextMoveBoost && (moveUsed.type === "Fire" || moveUsed.type === "Ghost");
            case "battle_start":
            case "switch_in":
            case "turn_start":
                return true;
            default:
                return false;
        }
    }
} 