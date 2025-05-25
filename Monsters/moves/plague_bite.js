// Plague Bite - Ratastrophe's signature Poison move
export class PlagueBite {
    constructor() {
        this.name = "Plague Bite";
        this.type = "Poison";
        this.category = "Physical";
        this.power = 80;
        this.accuracy = 100;
        this.pp = 15;
        this.description = "A diseased bite that spreads poison. Damage increases if target is already poisoned.";
        this.priority = 0;
        this.contact = true;
        this.poisonChance = 0.50; // 50% poison chance
        this.poisonBonusMultiplier = 1.5; // 50% bonus damage to poisoned targets
    }

    // Execute the move
    execute(user, target, battleState) {
        const results = {
            damage: 0,
            effectiveness: 1,
            critical: false,
            missed: false,
            statusEffects: [],
            messages: [],
            vfx: []
        };

        // Accuracy check
        const accuracyRoll = Math.random() * 100;
        if (accuracyRoll > this.accuracy) {
            results.missed = true;
            results.messages.push(`${user.name}'s ${this.name} missed!`);
            return results;
        }

        // Critical hit check
        const critRoll = Math.random();
        results.critical = critRoll < 0.0625; // 1/16 chance

        // Check if target is already poisoned for bonus damage
        const targetPoisoned = target.statusCondition === 'poison' || target.statusCondition === 'badly_poisoned';

        // Calculate damage
        let baseDamage = this.calculateDamage(user, target, results.critical, battleState);
        
        // Apply bonus damage if target is poisoned
        if (targetPoisoned) {
            baseDamage = Math.floor(baseDamage * this.poisonBonusMultiplier);
            results.messages.push(`The disease spreads! Super effective against poisoned foes!`);
        }

        results.damage = baseDamage;

        // Apply damage
        target.currentHP = Math.max(0, target.currentHP - results.damage);

        // Add VFX
        results.vfx.push({
            name: 'plague-bite-vfx',
            target: target,
            duration: 800
        });

        // Poison chance (enhanced by Toxic Aura if user has it)
        let poisonChance = this.poisonChance;
        if (user.ability && user.ability.name === "Toxic Aura") {
            poisonChance = 0.80; // Much higher chance with ability
        }

        if (Math.random() < poisonChance && target.statusCondition === "none") {
            target.statusCondition = "poison";
            target.statusTurns = 999; // Lasts until cured
            results.statusEffects.push('poisoned');
            results.messages.push(`${target.name} was poisoned by the plague bite!`);
            
            results.vfx.push({
                name: 'poison-application-vfx',
                target: target,
                duration: 1000
            });
        }

        // Damage message
        const critText = results.critical ? " Critical hit!" : "";
        results.messages.unshift(`${user.name} used ${this.name}!${critText}`);

        return results;
    }

    // Calculate damage using the standard formula
    calculateDamage(user, target, isCritical, battleState) {
        const level = user.level || 50;
        const attack = isCritical ? user.stats.attack * 1.5 : user.stats.attack;
        const defense = target.stats.defense;
        
        // Base damage calculation
        const baseDamage = ((((2 * level / 5 + 2) * this.power * attack / defense) / 50) + 2);
        
        // Apply STAB (Same Type Attack Bonus)
        let stab = 1;
        if (user.types && user.types.includes(this.type)) {
            stab = 1.5;
        }
        
        // Random factor (85-100%)
        const randomFactor = (Math.random() * 0.15) + 0.85;
        
        return Math.floor(baseDamage * stab * randomFactor);
    }

    // Get move info for UI
    getInfo() {
        return {
            name: this.name,
            type: this.type,
            category: this.category,
            power: this.power,
            accuracy: this.accuracy,
            pp: this.pp,
            description: this.description,
            special: "50% poison chance, 1.5x damage vs poisoned foes"
        };
    }
} 