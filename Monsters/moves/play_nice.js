// Play Nice - Normal type status move that lowers attack
import { BaseMove } from './base_move.js';

export class PlayNice extends BaseMove {
    constructor() {
        super();
        this.name = "Play Nice";
        this.type = "Normal";
        this.category = "Status";
        this.power = 0;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Lowers the target's attack in a friendly way.";
        this.effects = ["lower_attack"];
        this.makesContact = false;
        this.targetType = "single";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        result.messages.push(`${user.name} used ${this.name}!`);
        
        // Lower target's attack by 1 stage
        const statResult = battleManager.applyStatModification(target, "attack", -1);
        
        if (statResult.success) {
            result.messages.push(`${target.name}'s attack was lowered!`);
            result.effects.push({
                type: 'stat_change',
                target: 'opponent',
                stat: 'attack',
                change: -1
            });
        } else {
            result.messages.push(`${target.name}'s attack can't be lowered any further!`);
        }
        
        return result;
    }
} 