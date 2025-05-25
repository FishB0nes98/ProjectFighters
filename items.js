export const items = {
    sand_dagger: {
        id: "sand_dagger",
        name: "Sand Dagger",
        image: "items/sand_dagger.webp",
        cost: 2500,
        tags: ["Attack", "Anti-Tank", "Movement"],
        stats: {
            attackDamage: 40,
            armorPenetration: 5
        },
        passive: {
            name: "Desertwalk",
            description: "When dealing at least 1500 damage within 1.5s, gain 30% Movement Speed for 5s (8s cooldown)"
        }
    },
    desert_crafted_hammer: {
        id: "desert_crafted_hammer",
        name: "Desert Crafted Hammer",
        image: "items/desert_crafted_hammer.webp",
        cost: 2200,
        tags: ["Attack", "Defense"],
        stats: {
            attackDamage: 35,
            health: 350,
            armor: 5
        },
        passive: {
            name: "Desert Might",
            description: "CC-ing an enemy grants bonus 1HP for the entire game"
        }
    },
    flask_of_strength: {
        id: "flask_of_strength",
        name: "Flask of Strength",
        image: "items/flask_of_strength.webp",
        cost: 1100,
        tags: ["Attack"],
        stats: {},
        active: {
            name: "Surge of Power",
            description: "Grants +95 Attack Damage for 10s",
            cooldown: 60
        }
    },
    venomous_blade: {
        id: "venomous_blade",
        name: "Venomous Blade",
        image: "items/venomous_blade.webp",
        cost: 2650,
        tags: ["Attack", "Magic"],
        stats: {
            attackDamage: 24,
            abilityPower: 27
        },
        passive: {
            name: "Poison Strike",
            description: "Dealing damage with a spell poisons the target hit, dealing additional [50] damage within 3s. This effect can stack"
        }
    },
    boots_of_the_sandwalker: {
        id: "boots_of_the_sandwalker",
        name: "Boots of the Sandwalker",
        image: "items/boots_of_the_sandwalker.webp",
        cost: 1250,
        tags: ["Movement", "Cooldown Reduction"],
        stats: {
            movementSpeed: 20,
            cooldownReduction: 1
        },
        passive: {
            name: "Dune Runner",
            description: "When you are slowed, you gain +40% additional Movement speed when the slow expires"
        }
    },
    scorpion_sword: {
        id: "scorpion_sword",
        name: "Scorpion Sword",
        image: "items/scorpion_sword.webp",
        cost: 1900,
        tags: ["Attack", "Movement", "Healing Reduction"],
        stats: {
            attackDamage: 20,
            movementSpeed: 5
        },
        passive: {
            name: "Venom Strike",
            description: "Your attacks decrease healing by 25% for 2s"
        }
    },
    white_veil: {
        id: "white_veil",
        name: "White Veil",
        image: "items/white_veil.webp",
        cost: 2800,
        tags: ["Magic"],
        stats: {
            abilityPower: 80,
            health: 200,
            mana: 300
        },
        active: {
            name: "Vanish",
            description: "Gain stealth for 2s (cancels upon spell use)",
            cooldown: 35
        }
    },
    straightshot_aimer: {
        id: "straightshot_aimer",
        name: "Straightshot Aimer",
        image: "items/straightshot_aimer.webp",
        cost: 1800,
        tags: ["Attack", "Attack Speed"],
        stats: {
            attackDamage: 40,
            attackSpeed: 0.2
        },
        passive: {
            name: "Extended Reach",
            description: "Gain 10% bonus attack range"
        }
    },
    pharaoh_amulet: {
        id: "pharaoh_amulet",
        name: "Pharaoh Amulet",
        image: "items/pharaoh_amulet.webp",
        cost: 2600,
        tags: ["Magic"],
        stats: {
            abilityPower: 60,
            mana: 300
        },
        passive: {
            name: "Eternal Burn",
            description: "Your spells burn the target for 3s, dealing [25 damage] every second. This can stack infinitely"
        }
    },
    sphinx_choker: {
        id: "sphinx_choker",
        name: "Sphinx Choker",
        image: "items/sphinx_choker.webp",
        cost: 2300,
        tags: ["Support", "Magic"],
        stats: {
            healingAndShieldingPower: 15,
            abilityPower: 20,
            mana: 100
        },
        passive: {
            name: "Self Blessing",
            description: "Your heals and shields also affect yourself for 20% of its effect"
        }
    },
    cactus_staff: {
        id: "cactus_staff",
        name: "Cactus Staff",
        image: "items/cactus_staff.webp",
        cost: 2500,
        tags: ["Magic"],
        stats: {
            abilityPower: 40,
            health: 250,
            mana: 100
        },
        passive: {
            name: "Desert Thorns",
            description: "Occasionally, your spells shoot thorns when hit around the first target, dealing [20% AP] damage to all targets hit by the thorns (35s cooldown)"
        }
    },
    thorny_shield: {
        id: "thorny_shield",
        name: "Thorny Shield",
        image: "items/thorny_shield.webp",
        cost: 2000,
        tags: ["Defense"],
        stats: {
            armor: 10,
            magicResistance: 10
        },
        passive: {
            name: "Thorny Reflection",
            description: "You reflect 1% of the damage you receive back to the attacker"
        }
    },
    palm_leaf: {
        id: "palm_leaf",
        name: "Palm Leaf",
        image: "items/palm_leaf.webp",
        cost: 2300,
        tags: ["Support", "Defense"],
        stats: {
            healingAndShieldingPower: 14,
            health: 150,
            mana: 200
        }
    },
    sand_brick_armor: {
        id: "sand_brick_armor",
        name: "Sand Brick Armor",
        image: "items/sand_brick_armor.webp",
        cost: 2550,
        tags: ["Defense"],
        stats: {
            health: 400,
            damageReduction: 10
        },
        passive: {
            name: "Fortified Defense",
            description: "You gain 1% Damage reduction for every 20% MaxHP you are missing"
        }
    },
    ra_wand: {
        id: "ra_wand",
        name: "Ra's Wand",
        image: "items/ra_wand.webp",
        cost: 3300,
        tags: ["Magic"],
        stats: {
            abilityPower: 100
        },
        passive: {
            name: "Solar Amplification",
            description: "You gain [15%] of your total Ability Power as bonus Ability Power"
        }
    },
    tanyas_spear: {
        id: "tanyas_spear",
        name: "Tanya's Spear",
        image: "items/tanyas_spear.webp",
        cost: 3000,
        tags: ["Attack", "Magic", "Cooldown Reduction"],
        stats: {
            attackDamage: 40,
            abilityPower: 40,
            cooldownReduction: 2
        },
        passive: {
            name: "Spellblade",
            description: "After casting an ability, your next autoattack within 3s deals bonus [50% AP] magic damage"
        }
    },
    shao_kahns_hammer: {
        id: "shao_kahns_hammer",
        name: "Shao Kahn's Hammer",
        image: "items/shao_kahns_hammer.webp",
        cost: 2300,
        tags: ["Attack", "Defense"],
        stats: {
            attackDamage: 25,
            health: 300,
            armor: 5
        },
        passive: {
            name: "Wrath of Kahn",
            description: "When you are CC-d, you gain 5% of your maximum Attack Damage for 5s"
        }
    },
    zasalamels_scythe: {
        id: "zasalamels_scythe",
        name: "Zasalamel's Scythe",
        image: "items/zasalamels_scythe.webp",
        cost: 2400,
        tags: ["Attack", "Cooldown Reduction"],
        stats: {
            attackDamage: 44,
            cooldownReduction: 1
        },
        passive: {
            name: "Soul Harvest",
            description: "Killing an enemy fighter grants +5 Attack Damage for the rest of the game"
        }
    },
    abyssal_dune: {
        id: "abyssal_dune",
        name: "Abyssal Dune",
        image: "items/abyssal_dune.webp",
        cost: 3300,
        tags: ["Magic", "Cooldown Reduction"],
        stats: {
            abilityPower: 45,
            mana: 300,
            cooldownReduction: 1
        },
        passive: {
            name: "Ultimate Power",
            description: "Casting your ultimate ability grants you [25% AP] bonus Ability Power for 5s"
        }
    },
    sunforged_gauntlets: {
        id: "sunforged_gauntlets",
        name: "Sunforged Gauntlets",
        image: "items/sunforged_gauntlets.webp",
        cost: 2350,
        tags: ["Attack Speed", "Defense"],
        stats: {
            attackSpeed: 0.65,
            magicResistance: 8
        },
        active: {
            name: "Rapid Strike",
            description: "Gain 0.35 bonus Attack Speed for 5s",
            cooldown: 40
        }
    },
    oasis_guardian_cloak: {
        id: "oasis_guardian_cloak",
        name: "Oasis Guardian Cloak",
        image: "items/oasis_guardian_cloak.webp",
        cost: 2800,
        tags: ["Support", "Defense"],
        stats: {
            damageReduction: 5,
            health: 500
        },
        passive: {
            name: "Oasis Blessing",
            description: "CC-ing an enemy restores 2% of maximum Health to nearby allies and yourself"
        }
    },
    scarab_amulet: {
        id: "scarab_amulet",
        name: "Scarab Amulet",
        image: "items/scarab_amulet.webp",
        cost: 2600,
        tags: ["Support", "Movement", "Cooldown Reduction"],
        stats: {
            healingAndShieldingPower: 8,
            movementSpeed: 15,
            cooldownReduction: 1
        },
        active: {
            name: "Scarab's Protection",
            description: "Grant a target champion a [850] shield",
            cooldown: 40
        }
    },
    pyramid_wardstone: {
        id: "pyramid_wardstone",
        name: "Pyramid Wardstone",
        image: "items/pyramid_wardstone.webp",
        cost: 1700,
        tags: ["Support", "Defense"],
        stats: {
            mana: 300,
            health: 250
        },
        passive: {
            name: "Eternal Watch",
            description: "Killing an enemy places a vision ward on their body that lasts until they respawn"
        }
    },
    sands_of_eternity: {
        id: "sands_of_eternity",
        name: "Sands of Eternity",
        image: "items/sands_of_eternity.webp",
        cost: 2800,
        tags: ["Attack", "Attack Speed", "Defense"],
        stats: {
            attackDamage: 25,
            attackSpeed: 0.2,
            lifeSteal: 3
        },
        active: {
            name: "Time Freeze",
            description: "Enter stasis, becoming invulnerable but unable to move or take actions",
            cooldown: 120
        }
    },
    djinn_s_lamp: {
        id: "djinn_s_lamp",
        name: "Djinn's Lamp",
        image: "items/djinns_lamp.webp",
        cost: 2400,
        tags: ["Magic"],
        stats: {
            abilityPower: 65,
            mana: 250
        },
        passive: {
            name: "Enchanted Magic",
            description: "Your abilities deal 8% bonus damage"
        }
    },
    obsidian_spire: {
        id: "obsidian_spire",
        name: "Obsidian Spire",
        image: "items/obsidian_spire.webp",
        cost: 2600,
        tags: ["Magic"],
        stats: {
            abilityPower: 25,
            mana: 100,
            spellVamp: 3
        },
        passive: {
            name: "Glacial Touch",
            description: "Your abilities slow enemies by 15% for 2s"
        }
    },
    kotal_kahns_atlantean_dagger: {
        id: "kotal_kahns_atlantean_dagger",
        name: "Kotal Kahn's Atlantean Dagger",
        image: "items/kotal_kahns_atlantean_dagger.webp",
        cost: 2400,
        tags: ["Support", "Defense", "Movement"],
        stats: {
            movementSpeed: 10,
            healingAndShieldingPower: 10,
            tenacity: 20,
            damageReduction: 3
        },
        passive: {
            name: "Blood Ritual",
            description: "Heal 1% of your maximum Health every 2s, increased to 2% if below 20% HP"
        }
    },
    shinnoks_dark_magic_bubble: {
        id: "shinnoks_dark_magic_bubble",
        name: "Shinnok's Dark Magic Bubble",
        image: "items/shinnoks_dark_magic_bubble.webp",
        cost: 2750,
        tags: ["Magic", "Defense"],
        stats: {
            abilityPower: 75,
            mana: 100
        },
        passive: {
            name: "Dark Magic",
            description: "Your abilities apply 25% healing reduction to enemies hit for 3 seconds"
        }
    },
    golden_arrow: {
        id: "golden_arrow",
        name: "Golden Arrow",
        image: "items/golden_arrow.webp",
        cost: 2900,
        tags: ["Attack", "Magic", "Attack Speed"],
        stats: {
            attackDamage: 42,
            attackSpeed: 0.4
        },
        passive: {
            name: "First Strike",
            description: "Your first autoattack against each target deals bonus [110% AD] as magic damage"
        }
    },
    leviathans_fang: {
        id: "leviathans_fang",
        name: "Leviathan's Fang",
        image: "items/leviathans_fang.webp",
        cost: 3000,
        tags: ["Attack", "Magic"],
        stats: {
            attackDamage: 20,
            lifeSteal: 10
        },
        passive: {
            name: "Combat Frenzy",
            description: "While in combat, gain stacking Attack Speed. Each second in combat grants 5% Attack Speed (up to 25%)"
        }
    },
    tideborn_breastplate: {
        id: "tideborn_breastplate",
        name: "Tideborn Breastplate",
        image: "items/tideborn_breastplate.webp",
        cost: 1950,
        tags: ["Defense"],
        stats: {
            magicResistance: 5,
            health: 500
        },
        passive: {
            name: "Tidal Defense",
            description: "When healed, gain additional 5% Magic Resistance for 10s"
        }
    },
    stormcallers_orb: {
        id: "stormcallers_orb",
        name: "Stormcaller's Orb",
        image: "items/stormcallers_orb.webp",
        cost: 2800,
        tags: ["Magic", "Anti-Tank"],
        stats: {
            abilityPower: 40,
            magicPenetration: 5
        },
        passive: {
            name: "Storm Execution",
            description: "Your abilities have a 50% chance to critically strike enemies below 20% HP, dealing [30%] additional magic damage"
        }
    },
    pearl_of_the_depths: {
        id: "pearl_of_the_depths",
        name: "Pearl of the Depths",
        image: "items/pearl_of_the_depths.webp",
        cost: 3000,
        tags: ["Support", "Magic"],
        stats: {
            mana: 225,
            manaRegen: 5,
            healingAndShieldingPower: 10,
            abilityPower: 35
        },
        passive: {
            name: "Oceanic Empowerment",
            description: "Healing an ally grants them +25 Ability Power and -0.25s ability cooldown reduction for 1.75s"
        }
    },
    wavebreaker_boots: {
        id: "wavebreaker_boots",
        name: "Wavebreaker Boots",
        image: "items/wavebreaker_boots.webp",
        cost: 2550,
        tags: ["Movement", "Attack"],
        stats: {
            movementSpeed: 5,
            attackDamage: 25,
            health: 200,
            mana: 100
        },
        passive: {
            name: "Wave Rush",
            description: "After using an ability, gain 15% bonus Movement Speed for 2s"
        }
    },
    atlantean_crown: {
        id: "atlantean_crown",
        name: "Atlantean Crown",
        image: "items/atlantean_crown.webp",
        cost: 2750,
        tags: ["Defense", "Attack"],
        stats: {
            health: 350,
            spellVamp: 5,
            lifeSteal: 5,
            attackDamage: 15
        },
        passive: {
            name: "Royal Recovery",
            description: "All healing effects on you are increased by 12%"
        }
    },
    fish_scale_shoulderplate: {
        id: "fish_scale_shoulderplate",
        name: "Fish Scale Shoulderplate",
        image: "items/fish_scale_shoulderplate.webp",
        cost: 2450,
        tags: ["Defense", "Movement"],
        stats: {
            magicResistance: 10,
            movementSpeed: 8,
            health: 300
        },
        passive: {
            name: "Spell Shield",
            description: "Reduces incoming spell damage by 10%"
        }
    },
    mermaid_essence: {
        id: "mermaid_essence",
        name: "Mermaid Essence",
        image: "items/mermaid_essence.webp",
        cost: 2900,
        tags: ["Magic", "Support"],
        stats: {
            abilityPower: 50,
            healingAndShieldingPower: 12
        },
        passive: {
            name: "Ocean's Blessing",
            description: "Casting an ability grants a counter. At 4 counters, heal nearby allies for [85% AP] health"
        }
    },
    coral_polearm: {
        id: "coral_polearm",
        name: "Coral Polearm",
        image: "items/coral_polearm.webp",
        cost: 2700,
        tags: ["Attack"],
        stats: {
            attackDamage: 40,
            mana: 300,
            lifeSteal: 8
        },
        passive: {
            name: "Coral Restoration",
            description: "Every third attack restores [110] Health"
        }
    },
    wavebreaker: {
        id: "wavebreaker",
        name: "Wavebreaker",
        image: "items/wavebreaker.webp",
        cost: 2700,
        tags: ["Anti-Tank", "Attack", "Movement"],
        stats: {
            attackDamage: 32,
            armorPenetration: 6,
            movementSpeed: 10
        }
    },
    pearl_gun: {
        id: "pearl_gun",
        name: "Pearl Gun",
        image: "items/pearl_gun.webp",
        cost: 3000,
        tags: ["Attack", "Magic"],
        stats: {
            attackDamage: 50
        },
        passive: {
            name: "Hybrid Enhancement",
            description: "Your abilities gain additional scaling: 20% AD and 50% AP"
        }
    },
    clam_dancers: {
        id: "clam_dancers",
        name: "Clam Dancers",
        image: "items/clam_dancers.webp",
        cost: 2850,
        tags: ["Attack", "Movement", "Defense", "Cooldown Reduction"],
        stats: {
            attackDamage: 25,
            movementSpeed: 8,
            cooldownReduction: 1
        },
        passive: {
            name: "Dance of Protection",
            description: "Dashing grants 2% Damage Reduction and 10 Attack Damage, stacking up to 10 times"
        }
    },
    icicle_spear: {
        id: "icicle_spear",
        name: "Icicle Spear",
        image: "items/icicle_spear.webp",
        cost: 2000,
        tags: ["Attack", "Cooldown Reduction"],
        stats: {
            attackDamage: 35,
            cooldownReduction: 1
        },
        passive: {
            name: "Frozen Opportunity",
            description: "If you attack a CC-d enemy or an enemy that was CC-d in the past [2.5s], you deal 10% increased damage with your spells to that target"
        }
    },
    treasure_chest: {
        id: "treasure_chest",
        name: "Treasure Chest",
        image: "items/treasure_chest.webp",
        cost: 1850,
        tags: ["Magic", "Attack", "Defense", "Movement"],
        stats: {
            attackDamage: 5,
            abilityPower: 5,
            damageReduction: 1,
            movementSpeed: 5
        },
        passive: {
            name: "Hidden Riches",
            description: "After 10 kills or assists, all stats from this item are multiplied by 4"
        }
    },
    atlantis_teardrop: {
        id: "atlantis_teardrop",
        name: "Atlantis Teardrop",
        image: "items/atlantis_teardrop.webp",
        cost: 2750,
        tags: ["Magic"],
        stats: {
            mana: 500,
            health: 300
        },
        passive: {
            name: "Ocean's Power",
            description: "Your attacks restore 2% of your missing mana. Additionally, your spells deal bonus magic damage equal to 4% of your maximum mana"
        }
    },
    golden_mask: {
        id: "golden_mask",
        name: "Golden Mask",
        image: "items/golden_mask.webp",
        cost: 2000,
        tags: ["Defense"],
        stats: {
            armor: 4,
            magicResistance: 5
        },
        active: {
            name: "Divine Protection",
            description: "Gain a shield that reduces the first damage you take by 85%",
            cooldown: 60
        }
    },
    tridents_vow: {
        id: "tridents_vow",
        name: "Trident's Vow",
        image: "items/tridents_vow.webp",
        cost: 2600,
        tags: ["Attack Speed", "Attack"],
        stats: {
            attackSpeed: 0.25,
            attackDamage: 25
        },
        passive: {
            name: "Combat Cadence",
            description: "Grants 0.2 Attack Speed if you are in combat for at least 2.75s"
        }
    },
    abyssal_anchor: {
        id: "abyssal_anchor",
        name: "Abyssal Anchor",
        image: "items/abyssal_anchor.webp",
        cost: 2250,
        tags: ["Defense"],
        stats: {
            armor: 8,
            tenacity: 15,
            health: 400
        },
        passive: {
            name: "Ocean's Retaliation",
            description: "When immobilized, release a shockwave that knocks nearby enemies back (15s cooldown)"
        }
    },
    seaborne_crown: {
        id: "seaborne_crown",
        name: "Seaborne Crown",
        image: "items/seaborne_crown.webp",
        cost: 3000,
        tags: ["Support", "Magic"],
        stats: {
            abilityPower: 40,
            manaRegen: 8,
            healingAndShieldingPower: 13
        },
        passive: {
            name: "Tidal Currents",
            description: "Casting abilities creates water currents for 2s, granting nearby allies 15% bonus Movement Speed. Each ally can only be affected once every 6s"
        }
    },
    steel_titan_chassis: {
        id: "steel_titan_chassis",
        name: "Steel Titan Chassis",
        image: "items/steel_titan_chassis.webp",
        cost: 2800,
        tags: ["Defense"],
        stats: {
            armor: 6,
            tenacity: 10,
            health: 300
        },
        passive: {
            name: "Iron Will",
            description: "When hit by crowd control effects, gain 20% bonus armor and reduce the duration of subsequent crowd control effects by 15% for 4s"
        }
    },
    concrete_barrier_cloak: {
        id: "concrete_barrier_cloak",
        name: "Concrete Barrier Cloak",
        image: "items/concrete_barrier_cloak.webp",
        cost: 2400,
        tags: ["Defense", "Support"],
        stats: {
            armor: 4,
            health: 400,
            damageReduction: 2
        },
        passive: {
            name: "Urban Cover",
            description: "Nearby allies take 5% less damage from ranged attacks"
        }
    },
    tire_iron_knuckles: {
        id: "tire_iron_knuckles",
        name: "Tire Iron Knuckles",
        image: "items/tire_iron_knuckles.webp",
        cost: 2600,
        tags: ["Attack", "Defense"],
        stats: {
            attackDamage: 30,
            health: 250,
            lifeSteal: 4
        },
        passive: {
            name: "Street Brawler",
            description: "Your basic attacks restore an additional 1% of your missing health"
        }
    },
    bodega_champions_belt: {
        id: "bodega_champions_belt",
        name: "Bodega Champion's Belt",
        image: "items/bodega_champions_belt.webp",
        cost: 2500,
        tags: ["Defense", "Attack"],
        stats: {
            health: 350,
            attackDamage: 20,
            damageReduction: 3
        },
        passive: {
            name: "Never Down",
            description: "When below 40% HP, taking damage grants you a [150 + 8% max HP] shield for 3s (8s cooldown)"
        }
    },
    empire_phantoms_mask: {
        id: "empire_phantoms_mask",
        name: "Empire Phantom's Mask",
        image: "items/empire_phantoms_mask.webp",
        cost: 2900,
        tags: ["Attack"],
        stats: {
            attackDamage: 60
        },
        passive: {
            name: "Silent Predator",
            description: "After exiting stealth or camouflage, your next attack within 3s is guaranteed to critically strike and deals 200% critical strike damage"
        }
    },
    toxic_alley_shiv: {
        id: "toxic_alley_shiv",
        name: "Toxic Alley Shiv",
        image: "items/toxic_alley_shiv.webp",
        cost: 2900,
        tags: ["Magic", "Movement"],
        stats: {
            abilityPower: 65,
            movementSpeed: 5
        },
        passive: {
            name: "Urban Wound",
            description: "Your abilities cause enemies to bleed for [30 + 15% AP] magic damage over 3s. Gain 20% bonus Movement Speed when moving towards bleeding targets"
        }
    },
    times_square_orb: {
        id: "times_square_orb",
        name: "Times Square Orb",
        image: "items/times_square_orb.webp",
        cost: 3300,
        tags: ["Magic", "Cooldown Reduction"],
        stats: {
            abilityPower: 70,
            cooldownReduction: 2,
            mana: 300
        },
        passive: {
            name: "Temporal Loop",
            description: "Every 10 seconds, your next spell deals 25% increased damage and refunds [50 + 15% of its mana cost]"
        }
    },
    streetlight_rod: {
        id: "streetlight_rod",
        name: "Streetlight Rod",
        image: "items/streetlight_rod.webp",
        cost: 2900,
        tags: ["Magic", "Cooldown Reduction"],
        stats: {
            abilityPower: 55,
            cooldownReduction: 1,
            mana: 250
        },
        passive: {
            name: "Electro Strike",
            description: "After hitting an enemy champion with 3 spells, they are struck by lightning for [150 + 35% AP] magic damage (12s cooldown per target)"
        }
    },
    broadway_star_badge: {
        id: "broadway_star_badge",
        name: "Broadway Star Badge",
        image: "items/broadway_star_badge.webp",
        cost: 2650,
        tags: ["Support", "Magic"],
        stats: {
            abilityPower: 40,
            healingAndShieldingPower: 15,
            manaRegen: 5
        },
        passive: {
            name: "Standing Ovation",
            description: "When nearby allies cast abilities, they restore [20 + 10% AP] health (2s cooldown per ally)"
        }
    },
    taxi_drivers_whistle: {
        id: "taxi_drivers_whistle",
        name: "Taxi Driver's Whistle",
        image: "items/taxi_drivers_whistle.webp",
        cost: 2450,
        tags: ["Support", "Movement"],
        stats: {
            health: 300,
            armor: 5,
            magicResistance: 4
        },
        active: {
            name: "Fast Lane",
            description: "ACTIVE: Sound the whistle, granting yourself and nearby allies 40% bonus Movement Speed that decays over 3 seconds (60s cooldown)",
            cooldown: 60
        }
    },
    cybernetic_data_core: {
        id: "cybernetic_data_core",
        name: "Cybernetic Data Core",
        image: "items/cybernetic_data_core.webp",
        cost: 2600,
        tags: ["Magic", "Cooldown Reduction"],
        stats: {
            abilityPower: 45,
            manaRegen: 10,
            cooldownReduction: 1
        },
        passive: {
            name: "Hackwave",
            description: "Casting a spell releases an energy pulse that deals [75 + 25% AP] magic damage to nearby enemies (10s cooldown)"
        }
    },
    skyline_prism: {
        id: "skyline_prism",
        name: "Skyline Prism",
        image: "items/skyline_prism.webp",
        cost: 2800,
        tags: ["Magic", "Anti-Tank"],
        stats: {
            abilityPower: 65,
            magicPenetration: 7
        },
        passive: {
            name: "Neon Pierce",
            description: "Your spells ignore 7% of the target's Magic Resistance and Damage Reduction"
        }
    },
    street_kings_chain: {
        id: "street_kings_chain",
        name: "Street King's Chain",
        image: "items/street_kings_chain.webp",
        cost: 1850,
        tags: ["Attack"],
        stats: {
            attackDamage: 40,
            movementSpeed: 5
        },
        passive: {
            name: "Street Dominance",
            description: "Kills and assists grant stacking bonuses: First stack gives 150 bonus gold, each subsequent stack increases the bonus by 150 gold (up to 1000 gold per kill). Dying resets all stacks"
        }
    },
    cyber_revolver: {
        id: "cyber_revolver",
        name: "Cyber Revolver",
        image: "items/cyber_revolver.webp",
        cost: 2700,
        tags: ["Attack", "Attack Speed"],
        stats: {
            attackDamage: 40,
            attackSpeed: 0.35
        },
        passive: {
            name: "Piercing Shot",
            description: "Every fourth basic attack fires a piercing bullet that deals [100% AD] physical damage to all enemies in a line"
        }
    },
    anna_williams_rocket_launcher: {
        id: "anna_williams_rocket_launcher",
        name: "Anna Williams' Rocket Launcher",
        image: "items/anna_williams_rocket_launcher.jfif",
        cost: 2800,
        tags: ["Attack"],
        stats: {
            attackDamage: 60
        },
        passive: {
            name: "Combat Rhythm",
            description: "After hitting 3 basic attacks within 5 seconds, your spells deal bonus [20% AD] physical damage for 3s"
        }
    }
    // More items will be added here
};