// Frozen Petal - Cryorose's signature Ice move
export class FrozenPetal {
    constructor() {
        this.name = "Frozen Petal";
        this.type = "Ice";
        this.category = "Special";
        this.power = 75;
        this.accuracy = 95;
        this.pp = 15;
        this.description = "Sharp crystalline petals strike the target. Has a high chance to freeze.";
        this.priority = 0;
        this.contact = false;
        this.freezeChance = 0.30; // 30% freeze chance
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

        // Calculate damage
        const baseDamage = this.calculateDamage(user, target, results.critical, battleState);
        results.damage = baseDamage;

        // Apply damage
        target.currentHP = Math.max(0, target.currentHP - results.damage);

        // Add VFX
        results.vfx.push({
            name: 'frozen-petal-vfx',
            target: target,
            duration: 800
        });

        // Freeze chance (enhanced by Glacial Bloom if user has it)
        let freezeChance = this.freezeChance;
        if (user.ability && user.ability.name === "Glacial Bloom") {
            freezeChance = 0.50; // Increased chance with ability
        }

        if (Math.random() < freezeChance && target.statusCondition === "none") {
            target.statusCondition = "frozen";
            target.statusTurns = 2 + Math.floor(Math.random() * 2); // 2-3 turns
            results.statusEffects.push('frozen');
            results.messages.push(`${target.name} was frozen solid!`);
            
            results.vfx.push({
                name: 'freeze-effect',
                target: target,
                duration: 2000
            });
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
            description: this.description
        };
    }
} 