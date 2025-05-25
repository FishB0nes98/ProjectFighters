// Aqua Tail - Water type physical move
import { BaseMove } from './base_move.js';

export class AquaTail extends BaseMove {
    constructor() {
        super();
        this.name = "Aqua Tail";
        this.type = "Water";
        this.category = "Physical";
        this.power = 90;
        this.accuracy = 90;
        this.pp = 10;
        this.maxPP = 10;
        this.priority = 0;
        this.description = "Swings its tail like a wave to attack the target.";
        this.effects = [];
        this.makesContact = true;
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
        
        return result;
    }
} 