// Dragon Breath - Dragon type special move that may paralyze
import { BaseMove } from './base_move.js';

export class DragonBreath extends BaseMove {
    constructor() {
        super();
        this.name = "Dragon Breath";
        this.type = "Dragon";
        this.category = "Special";
        this.power = 60;
        this.accuracy = 100;
        this.pp = 20;
        this.maxPP = 20;
        this.priority = 0;
        this.description = "Exhales a draconic breath that may paralyze the target.";
        this.effects = ["may_paralyze"];
        this.makesContact = false;
        this.targetType = "single";
    }

    executeSpecific(user, target, battleManager, battleState, result) {
        // Calculate damage
        const damage = battleManager.calculateDamage(user, target, this);
        
        // Apply damage
        target.currentHP = Math.max(0, target.currentHP - damage);
        result.damage = damage;
        
        result.messages.push(`${user.name} used ${this.name}!`);
        result.messages.push(`${target.name} took ${damage} damage!`);
        
        // 30% chance to paralyze
        if (Math.random() < 0.3 && target.statusCondition === "none") {
            target.statusCondition = "paralyzed";
            target.statusTurns = 0; // Paralysis lasts until cured
            result.messages.push(`${target.name} was paralyzed!`);
            result.effects.push({
                type: 'status',
                target: 'opponent',
                status: 'paralyzed'
            });
        }
        
        return result;
    }
} 