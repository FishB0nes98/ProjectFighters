// Bubble Play - Blobby's passive ability
export class BubblePlay {
    constructor() {
        this.name = "Bubble Play";
        this.description = "Water moves create protective bubbles that reduce incoming damage by 25% for 2 turns.";
        this.isPassive = true;
        this.ownerName = "Blobby";
        this.bubbleShield = 0; // Turns remaining
    }

    // Called when a water move is used
    onWaterMove(move, user, target, battleState) {
        if (move.type === "Water") {
            this.bubbleShield = 2; // Activate for 2 turns
            return {
                triggered: true,
                message: `${user.name}'s Bubble Play created protective bubbles!`,
                changes: {
                    shield: { type: "bubble", duration: 2, reduction: 0.25 }
                }
            };
        }
        return { triggered: false };
    }

    // Called when taking damage
    onDamageReceived(damage, user, battleState) {
        if (this.bubbleShield > 0) {
            const reducedDamage = Math.floor(damage * 0.75); // 25% reduction
            const damageReduced = damage - reducedDamage;
            
            return {
                triggered: true,
                message: `${user.name}'s bubble shield reduced the damage!`,
                changes: {
                    damageReduction: { from: damage, to: reducedDamage, saved: damageReduced }
                }
            };
        }
        return { triggered: false };
    }

    // Called at the end of each turn
    onTurnEnd(user, battleState) {
        if (this.bubbleShield > 0) {
            this.bubbleShield--;
            if (this.bubbleShield === 0) {
                return {
                    triggered: true,
                    message: `${user.name}'s bubble shield faded away.`
                };
            }
        }
        return { triggered: false };
    }

    // Called at the start of battle
    onBattleStart(user, battleState) {
        this.bubbleShield = 0;
        return {
            triggered: true,
            message: `${user.name} playfully blows bubbles around the battlefield!`
        };
    }

    // Reset ability (called between battles)
    reset() {
        this.bubbleShield = 0;
    }

    // Check if ability should activate
    shouldActivate(context, user, ...args) {
        switch (context) {
            case "water_move":
                const [waterMove] = args;
                return waterMove.type === "Water";
            case "damage_received":
                return this.bubbleShield > 0;
            case "turn_end":
                return this.bubbleShield > 0;
            case "battle_start":
                return true;
            default:
                return false;
        }
    }
} 