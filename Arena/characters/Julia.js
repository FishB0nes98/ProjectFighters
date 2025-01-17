export const Julia = {
    stats: {
        hp: 620,
        mana: 560,
        attackDamage: 58,
        abilityPower: 0,
        armor: 30,
        magicResist: 30,
        criticalChance: 0,
        criticalDamage: 150,
        attackSpeed: 1.0,
        hpRegen: 2,
        manaRegen: 8
    },
    abilities: {
        Q: {
            name: "Windblower",
            manaCost: 55,
            cooldown: 6,
            targeting: "ally",
            effects: {
                heal: {
                    base: 90,
                    scaling: {
                        level: [90, 275, 450, 630, 800, 900]
                    }
                },
                speedBoost: {
                    value: 35,
                    duration: 2
                }
            }
        },
        W: {
            name: "Building Nature",
            manaCost: 80,
            cooldown: 21,
            targeting: "ally",
            effects: {
                buff: {
                    name: "Nature's Blessing",
                    icon: "Arena/abilityicons/Julia_W.jfif",
                    duration: 6,
                    healPercent: [30, 34, 39, 42, 44, 44]
                }
            }
        },
        E: {
            name: "Knockback attack",
            manaCost: 55,
            cooldown: 9,
            targeting: "enemy",
            effects: {
                damage: {
                    base: 25,
                    scaling: {
                        level: [25, 60, 105, 200, 350, 350]
                    }
                },
                debuff: {
                    name: "Stunned",
                    icon: "Arena/abilityicons/Julia_E.jfif",
                    duration: 1.5,
                    chance: 35,
                    type: "stun"
                }
            }
        },
        R: {
            name: "Strength of Spirits",
            manaCost: 120,
            cooldown: 125,
            targeting: "instant",
            effects: {
                heal: {
                    isPercentage: true,
                    value: 50,
                    scaling: {
                        level: [50, 75, 100]
                    }
                }
            }
        }
    }
}; 