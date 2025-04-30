glimmeow: {
    id: "glimmeow",
    name: "Glimmeow",
    types: ["FAIRY"],
    image: "../Monsters/Glimmeow.png",
    stats: {
        hp: 130,
        attack: 130, // High physical attack
        defense: 85,
        spAtk: 65,
        spDef: 80,
        speed: 120 // Fast speed for meta relevance
    },
    abilities: ["rainbow_claw", "pounce", "steel_slash", "prismatic_pounce"],
    passiveAbility: {
        name: "Pristine Coat",
        description: "Cannot be affected by status conditions",
        type: "status_immunity",
        immunity: true // Complete immunity to all status effects
    }
}, 