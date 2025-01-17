export const Ibuki = {
    stats: {
        hp: 2100,
        mana: 400,
        attackDamage: 65,
        abilityPower: 0,
        armor: 32,
        magicResist: 30,
        hpRegen: 7.5,
        manaRegen: 8,
        movementSpeed: 345
    },
    abilities: {
        Q: {
            name: "Kunai Throw",
            targeting: "enemy",
            manaCost: 45,
            cooldown: 4,
            effects: {
                // Később implementáljuk
            }
        },
        W: {
            name: "Smoke Screen",
            targeting: "direction",
            manaCost: 70,
            cooldown: 16,
            effects: {
                // Később implementáljuk
            }
        },
        E: {
            name: "Agile Strike",
            targeting: "direction",
            manaCost: 60,
            cooldown: 12,
            effects: {
                // Később implementáljuk
            }
        },
        R: {
            name: "Ninjutsu: Shadow Strike",
            targeting: "enemy",
            manaCost: 100,
            cooldown: 90,
            effects: {
                // Később implementáljuk
            }
        }
    }
}; 