// Heal Bell - Status healing support move
import { BaseMove } from './base_move.js';

export class HealBell extends BaseMove {
    constructor() {
        super();
        this.name = "Heal Bell";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 5;
        this.maxPP = 5;
        this.description = "The user makes a soothing bell chime to heal the status conditions of all allies.";
        this.effects = ["heal_status"];
        this.targetType = "ally_team";
        this.vfx = {
            type: "healing_bell",
            color: "#A8A878",
            projectile: "🔔",
            impactEffect: "healing_sparkles",
            screenShake: "none",
            sound: "healing_chime",
            particles: ["✨", "💫", "🌟", "💖"],
            aura: "healing_aura"
        };
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Heal all status conditions from user and allies
        const healedMonsters = [];
        
        // Heal user
        if (user.statusCondition && user.statusCondition !== "none") {
            healedMonsters.push(user.name);
            user.statusCondition = "none";
            user.statusTurns = 0;
        }

        // In team battles, heal all allies
        if (battleState && battleState.userTeam) {
            for (const ally of battleState.userTeam) {
                if (ally !== user && ally.statusCondition && ally.statusCondition !== "none") {
                    healedMonsters.push(ally.name);
                    ally.statusCondition = "none";
                    ally.statusTurns = 0;
                }
            }
        }

        if (healedMonsters.length > 0) {
            result.messages.push(`${healedMonsters.join(", ")} ${healedMonsters.length === 1 ? "was" : "were"} cured of status conditions!`);
            result.effects.push("status_heal");
            result.healedMonsters = healedMonsters;
        } else {
            result.messages.push("But no one had any status conditions to cure.");
        }

        return result;
    }
} 