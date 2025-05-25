// Trainer System - Define enemy trainers and their monster teams
export const trainerRegistry = new Map();

export class Trainer {
    constructor(id, name, description, monsters, sprite = null, badge = null, rewards = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.monsters = monsters; // Array of monster definitions with levels and IVs
        this.sprite = sprite;
        this.badge = badge;
        this.rewards = rewards || this.getDefaultRewards(); // Default rewards if not specified
        this.isDefeated = false;
    }

    // Default reward system for beginner trainers
    getDefaultRewards() {
        return {
            cm: {
                min: 120,
                max: 250
            },
            items: [
                {
                    name: "XP Snack",
                    type: "rare_candy",
                    chance: 2 // 2% chance
                }
            ]
        };
    }

    // Calculate and return battle rewards
    calculateRewards() {
        const rewards = {
            cm: 0,
            items: []
        };

        // Calculate CM reward
        if (this.rewards.cm) {
            rewards.cm = Math.floor(Math.random() * (this.rewards.cm.max - this.rewards.cm.min + 1)) + this.rewards.cm.min;
        }

        // Check for item rewards
        if (this.rewards.items) {
            for (const item of this.rewards.items) {
                const roll = Math.random() * 100;
                if (roll < item.chance) {
                    rewards.items.push({
                        name: item.name,
                        type: item.type
                    });
                }
            }
        }

        return rewards;
    }

    // Create battle-ready monsters for this trainer
    createBattleTeam(gameEngine) {
        const battleTeam = [];
        
        for (const monsterData of this.monsters) {
            const monsterDef = gameEngine.getMonsterDef(monsterData.species);
            if (monsterDef) {
                const battleMonster = gameEngine.createBattleMonster(
                    monsterDef,
                    {
                        level: monsterData.level,
                        ivs: monsterData.ivs || gameEngine.generateRandomIVs()
                    },
                    `${this.id}_${monsterData.species}_${Date.now()}`
                );
                battleTeam.push(battleMonster);
            }
        }
        
        return battleTeam;
    }
}

// Register a new trainer
export function registerTrainer(trainer) {
    trainerRegistry.set(trainer.id, trainer);
    console.log(`📋 Registered trainer: ${trainer.name}`);
}

// Get trainer by ID
export function getTrainer(trainerId) {
    const trainer = trainerRegistry.get(trainerId);
    if (!trainer) {
        throw new Error(`Trainer with ID '${trainerId}' not found`);
    }
    return trainer;
}

// Get all available trainers
export function getAllTrainers() {
    return Array.from(trainerRegistry.values());
}

// Get beginner trainers specifically (for daily login game)
export function getBeginnerTrainers() {
    const beginnerTrainerIds = [
        'rookie_riley',
        'scout_sam', 
        'camper_casey',
        'student_sarah',
        'hiker_henry',
        'twins_tim_tom',
        'ace_trainer_alex'
    ];
    
    return beginnerTrainerIds.map(id => trainerRegistry.get(id)).filter(trainer => trainer);
}

// Initialize trainers - this will be called when the game loads
export function initializeTrainers() {
    // Clear existing trainers
    trainerRegistry.clear();
    
    // Younger Sammy - First enemy trainer
    const youngerSammy = new Trainer(
        'younger_sammy',
        'Younger Sammy',
        'A young trainer who recently started his journey. He has one monster, but it\'s exceptionally well-trained with perfect genetics!',
        [
            {
                species: 'bunburrow',
                level: 2,
                ivs: {
                    hp: 31,        // Perfect HP IV
                    attack: 31,    // Perfect Attack IV
                    defense: 31,   // Perfect Defense IV
                    specialAttack: 31,  // Perfect Special Attack IV
                    specialDefense: 31, // Perfect Special Defense IV
                    speed: 31      // Perfect Speed IV
                }
            }
        ],
        'Icons/Trainers/Lili.png', // Using existing trainer image temporarily
        null // No badge for first trainer
    );
    
    registerTrainer(youngerSammy);
    
    // === BEGINNER TRAINERS FOR DAILY LOGIN GAME ===
    
    // Rookie Riley - Perfect for absolute beginners
    const rookieRiley = new Trainer(
        'rookie_riley',
        'Rookie Riley',
        'A brand new trainer who just got their first monster. Great for beginners to practice against!',
        [
            {
                species: 'blobby',
                level: 1,
                ivs: {
                    hp: 15, attack: 12, defense: 18, specialAttack: 10, specialDefense: 14, speed: 8
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(rookieRiley);
    
    // Scout Sam - Slightly more challenging
    const scoutSam = new Trainer(
        'scout_sam',
        'Scout Sam',
        'An eager scout who loves exploring with their trusty companion. Still learning the ropes!',
        [
            {
                species: 'peepuff',
                level: 2,
                ivs: {
                    hp: 20, attack: 16, defense: 14, specialAttack: 22, specialDefense: 18, speed: 25
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(scoutSam);
    
    // Camper Casey - Two monster team
    const camperCasey = new Trainer(
        'camper_casey',
        'Camper Casey',
        'A nature-loving trainer who enjoys camping with their monster friends. Has two companions!',
        [
            {
                species: 'bunburrow',
                level: 2,
                ivs: {
                    hp: 18, attack: 24, defense: 20, specialAttack: 12, specialDefense: 16, speed: 22
                }
            },
            {
                species: 'lumillow',
                level: 2,
                ivs: {
                    hp: 16, attack: 10, defense: 22, specialAttack: 26, specialDefense: 24, speed: 14
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(camperCasey);
    
    // Student Sarah - Balanced team
    const studentSarah = new Trainer(
        'student_sarah',
        'Student Sarah',
        'A dedicated student studying monster behavior. Her team is well-balanced for learning!',
        [
            {
                species: 'smouldimp',
                level: 3,
                ivs: {
                    hp: 22, attack: 28, defense: 16, specialAttack: 20, specialDefense: 18, speed: 24
                }
            },
            {
                species: 'buzzy',
                level: 3,
                ivs: {
                    hp: 19, attack: 14, defense: 12, specialAttack: 30, specialDefense: 20, speed: 28
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(studentSarah);
    
    // Hiker Henry - Tougher single monster
    const hikerHenry = new Trainer(
        'hiker_henry',
        'Hiker Henry',
        'A mountain hiker with one tough, well-trained monster. A good challenge for improving trainers!',
        [
            {
                species: 'crisilla',
                level: 4,
                ivs: {
                    hp: 28, attack: 26, defense: 30, specialAttack: 18, specialDefense: 25, speed: 15
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(hikerHenry);
    
    // Twins Tim & Tom - Coordinated duo
    const twinsTim = new Trainer(
        'twins_tim_tom',
        'Twins Tim & Tom',
        'Twin brothers who battle in perfect sync! Their monsters complement each other well.',
        [
            {
                species: 'puffsqueak',
                level: 3,
                ivs: {
                    hp: 24, attack: 20, defense: 18, specialAttack: 26, specialDefense: 22, speed: 30
                }
            },
            {
                species: 'shiverion',
                level: 3,
                ivs: {
                    hp: 26, attack: 22, defense: 24, specialAttack: 28, specialDefense: 26, speed: 18
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(twinsTim);
    
    // Ace Trainer Alex - Advanced beginner challenge
    const aceTrainerAlex = new Trainer(
        'ace_trainer_alex',
        'Ace Trainer Alex',
        'An experienced trainer who mentors beginners. Their diverse team will test everything you\'ve learned!',
        [
            {
                species: 'nymaria',
                level: 4,
                ivs: {
                    hp: 25, attack: 18, defense: 20, specialAttack: 30, specialDefense: 28, speed: 26
                }
            },
            {
                species: 'scorchlete',
                level: 4,
                ivs: {
                    hp: 28, attack: 30, defense: 22, specialAttack: 24, specialDefense: 20, speed: 29
                }
            },
            {
                species: 'maquatic',
                level: 5,
                ivs: {
                    hp: 30, attack: 26, defense: 24, specialAttack: 22, specialDefense: 25, speed: 28
                }
            }
        ],
        'Icons/Trainers/Lili.png'
    );
    registerTrainer(aceTrainerAlex);
    
    // Opp - A Gen Z trainer with a diverse team
    const opp = new Trainer(
        'opp',
        'Opp',
        'No cap fr fr, this trainer bussin with the most fire monsters on god fr fr',
        [
            {
                species: 'pechac',
                level: 3,
                ivs: {
                    hp: 25,
                    attack: 28,
                    defense: 22,
                    specialAttack: 30,
                    specialDefense: 24,
                    speed: 27
                }
            },
            {
                species: 'hauntorch',
                level: 3,
                ivs: {
                    hp: 27,
                    attack: 29,
                    defense: 23,
                    specialAttack: 26,
                    specialDefense: 25,
                    speed: 28
                }
            },
            {
                species: 'cryorose',
                level: 3,
                ivs: {
                    hp: 24,
                    attack: 26,
                    defense: 29,
                    specialAttack: 28,
                    specialDefense: 27,
                    speed: 25
                }
            },
            {
                species: 'ratastrophe',
                level: 3,
                ivs: {
                    hp: 28,
                    attack: 30,
                    defense: 24,
                    specialAttack: 25,
                    specialDefense: 23,
                    speed: 29
                }
            },
            {
                species: 'mizuryon',
                level: 3,
                ivs: {
                    hp: 26,
                    attack: 27,
                    defense: 28,
                    specialAttack: 29,
                    specialDefense: 26,
                    speed: 24
                }
            }
        ],
        'Icons/Trainers/Lili.png', // Using existing trainer image temporarily
        null // No badge for this trainer
    );
    
    registerTrainer(opp);
    
    // Kotal Kahn - A powerful trainer with a diverse water-focused team
    const kotalKahn = new Trainer(
        'kotal_kahn',
        'Kotal Kahn',
        'A formidable trainer who commands respect with his powerful aquatic team. His monsters have been trained to perfection through rigorous discipline.',
        [
            {
                species: 'mizuryon',
                level: 7,
                ivs: {
                    hp: 29,
                    attack: 31,
                    defense: 27,
                    specialAttack: 30,
                    specialDefense: 28,
                    speed: 31
                }
            },
            {
                species: 'pechac',
                level: 8,
                ivs: {
                    hp: 31,
                    attack: 30,
                    defense: 29,
                    specialAttack: 28,
                    specialDefense: 30,
                    speed: 27
                }
            },
            {
                species: 'maquatic',
                level: 6,
                ivs: {
                    hp: 26,
                    attack: 31,
                    defense: 25,
                    specialAttack: 24,
                    specialDefense: 26,
                    speed: 29
                }
            },
            {
                species: 'nerephal',
                level: 7,
                ivs: {
                    hp: 28,
                    attack: 30,
                    defense: 31,
                    specialAttack: 26,
                    specialDefense: 29,
                    speed: 28
                }
            },
            {
                species: 'buzzy',
                level: 6,
                ivs: {
                    hp: 25,
                    attack: 24,
                    defense: 23,
                    specialAttack: 31,
                    specialDefense: 27,
                    speed: 31
                }
            },
            {
                species: 'sharx',
                level: 8,
                ivs: {
                    hp: 30,
                    attack: 31,
                    defense: 28,
                    specialAttack: 22,
                    specialDefense: 27,
                    speed: 26
                }
            }
        ],
        'Icons/Trainers/Lili.png', // Using existing trainer image temporarily
        null, // No badge for this trainer
        // Special rewards for Kotal Kahn - includes daily water egg
        {
            cm: {
                min: 500,
                max: 800
            },
            items: [
                {
                    name: "XP Snack",
                    type: "rare_candy",
                    chance: 5 // 5% chance
                }
            ],
            specialReward: 'daily_water_egg' // Special flag for egg reward
        }
    );
    
    registerTrainer(kotalKahn);
    
    // Add more trainers here as the game expands
    
    console.log(`✅ Initialized ${trainerRegistry.size} trainers (${getBeginnerTrainers().length} beginner trainers available)`);
}

// Initialize trainers on module load
initializeTrainers(); 