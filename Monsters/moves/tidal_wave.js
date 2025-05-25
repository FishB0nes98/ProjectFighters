// Tidal Wave - Mizuryon's powerful Water move
export class TidalWave {
    constructor() {
        this.name = "Tidal Wave";
        this.type = "Water";
        this.category = "Special";
        this.power = 95;
        this.accuracy = 100;
        this.pp = 10;
        this.description = "Crashes into the target like a massive wave. May cause flinching.";
        this.priority = 0;
        this.contact = false;
        this.flinchChance = 0.30; // 30% flinch chance
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

        // Accuracy check (enhanced by Liquid Body if user has it)
        let accuracy = this.accuracy;
        if (user.ability && user.ability.name === "Liquid Body") {
            accuracy = Math.min(100, accuracy + 20); // Enhanced accuracy
        }

        const accuracyRoll = Math.random() * 100;
        if (accuracyRoll > accuracy) {
            results.missed = true;
            results.messages.push(`${user.name}'s ${this.name} missed!`);
            return results;
        }

        // Critical hit check (enhanced by Liquid Body)
        let critChance = 0.0625; // 1/16 base chance
        if (user.ability && user.ability.name === "Liquid Body") {
            critChance *= 2; // Double crit chance
        }

        const critRoll = Math.random();
        results.critical = critRoll < critChance;

        // Calculate damage
        const baseDamage = this.calculateDamage(user, target, results.critical, battleState);
        results.damage = baseDamage;

        // Apply damage
        target.currentHP = Math.max(0, target.currentHP - results.damage);

        // Add VFX
        results.vfx.push({
            name: 'tidal-wave-vfx',
            target: target,
            duration: 1500
        });

        // Flinch chance
        if (Math.random() < this.flinchChance && target.statusCondition === "none") {
            target.statusCondition = "flinch";
            target.statusTurns = 1; // Lasts for one turn
            results.statusEffects.push('flinched');
            results.messages.push(`${target.name} flinched from the massive wave!`);
        }

        // Damage message
        const critText = results.critical ? " Critical hit!" : "";
        results.messages.push(`${user.name} used ${this.name}!${critText}`);

        return results;
    }

    // Calculate damage using the standard formula
    calculateDamage(user, target, isCritical, battleState) {
        const level = user.level || 50;
        const attack = isCritical ? user.stats.specialAttack * 1.5 : user.stats.specialAttack;
        const defense = target.stats.specialDefense;
        
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
            special: "30% flinch chance"
        };
    }
} 