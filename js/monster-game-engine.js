// Monster Game Engine - Main game controller
import { moveRegistry } from '../Monsters/move_registry.js';
import { abilityRegistry } from '../Monsters/ability_registry.js';
import { getTrainer, getAllTrainers } from '../Monsters/trainers.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { EnhancedBattleManager } from './enhanced-battle-manager.js';
import { UIManager } from './ui-manager.js';
import { EnemyAI } from './enemy-ai.js';
import { XPManager } from './xp-manager.js';
import { MapMode } from './map-mode.js';

export class MonsterGameEngine {
    constructor() {
        this.currentUser = null;
        this.userTeam = [];
        this.monstersData = new Map();
        this.battleManager = null;
        this.uiManager = null;
        this.enemyAI = null;
        this.xpManager = null;
        this.mapMode = null;
        this.gameState = 'menu'; // menu, battle, team_selection, etc.
        
        this.initialize();
    }

    async initialize() {
        console.log('🎮 Monster Game Engine initializing...');
        
        // Load all monster data
        await this.loadMonsterData();
        
        // Initialize managers - using Enhanced Battle Manager for VFX
        this.battleManager = new EnhancedBattleManager(this);
        this.uiManager = new UIManager(this);
        this.enemyAI = new EnemyAI(this);
        this.xpManager = new XPManager(this);
        this.mapMode = new MapMode(this);
        
        // Set up authentication listener
        this.setupAuthListener();
        
        // Show main menu
        this.uiManager.showMainMenu();
        
        console.log('✅ Monster Game Engine ready with XP system and enhanced VFX!');
    }

    // Load all monster definitions
    async loadMonsterData() {
        const monsterFiles = [
            "bunburrow.json",
            "pechac.json",
            "cryorose.json",
            "hauntorch.json",
            "ratastrophe.json",
            "mizuryon.json",
            "scorchlete.json",
            "nymaria.json",
            "peepuff.json",
            "shiverion.json",
            "lumillow.json",
            "puffsqueak.json",
            // New image-based monsters
            "crisilla.json",
            "buzzy.json",
            "maquatic.json",
            "sharx.json",
            "smouldimp.json",
            "blobby.json",
            "crymora.json",
            "nerephal.json",
            // New monsters from images
            "furnacron.json",
            "nivoxis.json",
            "noctivy.json",
            "skarth.json",
            "frosmoth.json",
            "fulverice.json",
            "pyrochi.json",
            "synthraze.json"
        ];
        
        for (const file of monsterFiles) {
            try {
                const response = await fetch(`/Monsters/${file}`);
                if (response.ok) {
                    const monsterData = await response.json();
                    this.monstersData.set(monsterData.name.toLowerCase(), monsterData);
                }
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
            }
        }
        
        console.log(`📚 Loaded ${this.monstersData.size} monster definitions`);
    }

    // Set up authentication listener
    setupAuthListener() {
        if (window.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged((user) => {
                console.log('🔐 Auth state changed:', user ? `User logged in: ${user.displayName || user.email}` : 'User logged out');
                
                if (user) {
                    this.currentUser = user;
                    this.loadUserTeam();
                } else {
                    this.currentUser = null;
                    this.userTeam = [];
                }
                
                // Refresh the UI to reflect the auth state change
                if (this.uiManager && this.gameState === 'menu') {
                    this.uiManager.refreshUserInfo();
                }
            });
        }
    }

    // Load user's monster team from Firebase
    async loadUserTeam() {
        if (!this.currentUser || !window.firebaseDatabase) return;
        
        try {
            console.log(`📡 Loading team for user: ${this.currentUser.uid}`);
            
            // First get the user's monster team IDs
            const teamRef = ref(window.firebaseDatabase, `users/${this.currentUser.uid}/MonsterTeam`);
            const teamSnapshot = await get(teamRef);
            const teamIds = teamSnapshot.val() || [];
            
            console.log('🔍 Found team IDs:', teamIds);
            
            if (teamIds.length === 0) {
                console.log('📭 No monsters in team');
                this.userTeam = [];
                return;
            }
            
            // Then get the actual monster data
            const monstersRef = ref(window.firebaseDatabase, `users/${this.currentUser.uid}/monsters`);
            const monstersSnapshot = await get(monstersRef);
            const monstersData = monstersSnapshot.val() || {};
            
            console.log('🗂️ Found monsters data:', Object.keys(monstersData));
            
            this.userTeam = [];
            for (const teamId of teamIds) {
                const userMonster = monstersData[teamId];
                if (userMonster) {
                    console.log(`🔧 Processing monster: ${userMonster.monsterId} (Level ${userMonster.level})`);
                    
                    const monsterDef = this.monstersData.get(userMonster.monsterId.toLowerCase());
                    if (monsterDef) {
                        const monster = this.createBattleMonster(monsterDef, userMonster, teamId);
                        this.userTeam.push(monster);
                        console.log(`✅ Added ${monster.name} to team`);
                    } else {
                        console.warn(`❌ Monster definition not found for: ${userMonster.monsterId}`);
                    }
                } else {
                    console.warn(`❌ Monster data not found for team ID: ${teamId}`);
                }
            }
            
            console.log(`👥 Loaded user team: ${this.userTeam.length} monsters`);
            
            // Refresh UI if we're on the menu screen
            if (this.uiManager && this.gameState === 'menu') {
                this.uiManager.refreshUserInfo();
            }
            
        } catch (error) {
            console.error('❌ Failed to load user team:', error);
            this.userTeam = [];
        }
    }

    // Create a battle-ready monster with all stats calculated
    createBattleMonster(monsterDef, userMonster, uid = null) {
        const level = userMonster.level || 5;
        const ivs = userMonster.ivs || this.generateRandomIVs();
        
        const monster = {
            uid: uid,
            id: monsterDef.id,
            name: monsterDef.name,
            types: monsterDef.types,
            level: level,
            ivs: ivs,
            
            // XP System - ensure XP is properly initialized
            xp: userMonster.xp !== undefined ? userMonster.xp : (this.xpManager ? this.xpManager.getXPForLevel(level) : 0),
            
            // Calculate actual stats based on base stats, level, and IVs
            stats: this.calculateStats(monsterDef.stats, level, ivs),
            
            // Battle state
            currentHP: 0,
            maxHP: 0,
            statusCondition: "none",
            statusTurns: 0,
            
            // Load moves
            moves: [],
            
            // Load ability
            ability: null,
            
            // Original data
            baseStats: monsterDef.stats,
            originalData: monsterDef
        };

        // Calculate HP separately (different formula)
        monster.maxHP = this.calculateHP(monsterDef.stats.hp, level, ivs.hp);
        monster.currentHP = monster.maxHP;

        // Load moves from registry
        for (const moveData of monsterDef.moves) {
            try {
                const move = moveRegistry.getMove(moveData.name);
                monster.moves.push(move);
            } catch (error) {
                console.warn(`Failed to load move ${moveData.name}:`, error);
            }
        }

        // Load ability from registry
        if (monsterDef.ability) {
            try {
                monster.ability = abilityRegistry.getAbility(monsterDef.ability.name);
            } catch (error) {
                console.warn(`Failed to load ability ${monsterDef.ability.name}:`, error);
            }
        }

        return monster;
    }

    // Calculate stats using Pokemon-style formula
    calculateStats(baseStats, level, ivs) {
        return {
            hp: this.calculateHP(baseStats.hp, level, ivs.hp),
            attack: this.calculateStat(baseStats.attack, level, ivs.attack),
            defense: this.calculateStat(baseStats.defense, level, ivs.defense),
            specialAttack: this.calculateStat(baseStats.specialAttack, level, ivs.specialAttack),
            specialDefense: this.calculateStat(baseStats.specialDefense, level, ivs.specialDefense),
            speed: this.calculateStat(baseStats.speed, level, ivs.speed)
        };
    }

    // HP calculation (different from other stats)
    calculateHP(baseStat, level, iv) {
        return Math.floor(((2 * baseStat + iv) * level / 100) + level + 10);
    }

    // Regular stat calculation
    calculateStat(baseStat, level, iv) {
        return Math.floor(((2 * baseStat + iv) * level / 100) + 5);
    }

    // Generate random IVs (0-31 for each stat)
    generateRandomIVs() {
        return {
            hp: Math.floor(Math.random() * 32),
            attack: Math.floor(Math.random() * 32),
            defense: Math.floor(Math.random() * 32),
            specialAttack: Math.floor(Math.random() * 32),
            specialDefense: Math.floor(Math.random() * 32),
            speed: Math.floor(Math.random() * 32)
        };
    }

    // Start a battle
    startBattle(playerTeam, opponentTeam, isWild = false, trainer = null, battleContext = 'free') {
        if (!playerTeam.length || !opponentTeam.length) {
            console.error('Cannot start battle: teams are empty');
            return false;
        }

        this.gameState = 'battle';
        return this.battleManager.startBattle(playerTeam, opponentTeam, isWild, trainer, battleContext);
    }

    // Generate a wild monster encounter
    generateWildEncounter(level = null) {
        const monsterNames = Array.from(this.monstersData.keys());
        const randomName = monsterNames[Math.floor(Math.random() * monsterNames.length)];
        const monsterDef = this.monstersData.get(randomName);
        
        const wildLevel = level || Math.floor(Math.random() * 10) + 5; // Level 5-14
        const wildMonster = this.createBattleMonster(monsterDef, {
            level: wildLevel,
            ivs: this.generateRandomIVs()
        });

        return wildMonster;
    }

    // Get monster definition by name
    getMonsterDef(name) {
        return this.monstersData.get(name.toLowerCase());
    }

    // Get all available monsters
    getAllMonsters() {
        return Array.from(this.monstersData.values());
    }

    // Quick battle for testing
    quickBattle() {
        if (this.userTeam.length === 0) {
            console.warn('No user team available, generating test team');
            this.generateTestTeam();
        }

        // Use full team for better gameplay experience
        const playerTeam = this.userTeam.slice(); // All monsters
        const wildMonster = this.generateWildEncounter(10);
        
        // Changed to trainer battle (false) so players can enjoy full team switching
        return this.startBattle(playerTeam, [wildMonster], false, null, 'wild');
    }

    // Start a trainer battle (free battle mode by default)
    startTrainerBattle(trainerId, battleContext = 'free') {
        if (this.userTeam.length === 0) {
            console.warn('No user team available, generating test team');
            this.generateTestTeam();
        }

        try {
            // Get the trainer
            const trainer = getTrainer(trainerId);
            console.log(`🥊 Starting battle against trainer: ${trainer.name} (Context: ${battleContext})`);
            
            // Create trainer's battle team
            const trainerTeam = trainer.createBattleTeam(this);
            console.log(`👥 Trainer team: ${trainerTeam.map(m => `${m.name} (Lv.${m.level})`).join(', ')}`);
            
            // Use player's full team
            const playerTeam = this.userTeam.slice();
            
            // Start the trainer battle with specified context
            return this.startBattle(playerTeam, trainerTeam, false, trainer, battleContext);
        } catch (error) {
            console.error('Failed to start trainer battle:', error);
            // Fallback to quick battle
            return this.quickBattle();
        }
    }

    // Show trainer selection screen
    showTrainerSelection() {
        this.gameState = 'trainer_selection';
        this.uiManager.showTrainerSelection();
    }

    // Show map mode interface
    showMapMode() {
        this.gameState = 'map_mode';
        this.mapMode.showMapInterface();
    }

    // Generate test team for demo
    generateTestTeam() {
        let count = 0;
        for (const [name, monsterDef] of this.monstersData) {
            if (count >= 6) break; // Limit to 6 monsters for a proper team
            
            const testMonster = this.createBattleMonster(monsterDef, {
                level: 15,
                xp: this.xpManager ? this.xpManager.getXPForLevel(15) : 0, // Ensure XP is set
                ivs: {
                    hp: 25,
                    attack: 20,
                    defense: 22,
                    specialAttack: 24,
                    specialDefense: 21,
                    speed: 23
                }
            }, `test_${name}_${Date.now()}_${count}`); // Unique UID for each test monster
            
            this.userTeam.push(testMonster);
            count++;
        }
        
        console.log(`Generated test team with ${this.userTeam.length} monsters for demo`);
    }

    // Return to main menu
    returnToMenu() {
        this.gameState = 'menu';
        this.uiManager.showMainMenu();
    }

    // Set AI difficulty
    setAIDifficulty(difficulty) {
        if (this.enemyAI) {
            this.enemyAI.setDifficulty(difficulty);
        }
    }

    // Set AI personality
    setAIPersonality(personality) {
        if (this.enemyAI) {
            this.enemyAI.setPersonality(personality);
        }
    }
}

// Type effectiveness chart
export const TYPE_EFFECTIVENESS = {
    "Normal": {
        "Rock": 0.5,
        "Ghost": 0,
        "Steel": 0.5
    },
    "Fighting": {
        "Normal": 2,
        "Flying": 0.5,
        "Poison": 0.5,
        "Rock": 2,
        "Bug": 0.5,
        "Ghost": 0,
        "Steel": 2,
        "Fire": 1,
        "Water": 1,
        "Electric": 1,
        "Grass": 1,
        "Ice": 2,
        "Psychic": 0.5,
        "Dark": 2,
        "Fairy": 0.5
    },
    "Flying": {
        "Fighting": 2,
        "Rock": 0.5,
        "Bug": 2,
        "Steel": 0.5,
        "Electric": 0.5,
        "Grass": 2,
        "Ice": 1,
        "Ground": 1
    },
    "Poison": {
        "Fighting": 1,
        "Poison": 0.5,
        "Ground": 0.5,
        "Rock": 0.5,
        "Bug": 1,
        "Ghost": 0.5,
        "Steel": 0,
        "Fire": 1,
        "Water": 1,
        "Electric": 1,
        "Grass": 2,
        "Ice": 1,
        "Psychic": 1,
        "Dark": 1,
        "Fairy": 2
    },
    "Ground": {
        "Flying": 0,
        "Poison": 2,
        "Bug": 0.5,
        "Steel": 2,
        "Fire": 2,
        "Electric": 2,
        "Grass": 0.5,
        "Rock": 2
    },
    "Rock": {
        "Fighting": 0.5,
        "Flying": 2,
        "Poison": 1,
        "Ground": 0.5,
        "Bug": 2,
        "Steel": 0.5,
        "Fire": 2,
        "Ice": 2
    },
    "Bug": {
        "Fighting": 0.5,
        "Flying": 0.5,
        "Poison": 0.5,
        "Ghost": 0.5,
        "Steel": 0.5,
        "Fire": 0.5,
        "Grass": 2,
        "Psychic": 2,
        "Dark": 2,
        "Fairy": 0.5
    },
    "Ghost": {
        "Normal": 0,
        "Psychic": 2,
        "Ghost": 2,
        "Dark": 0.5
    },
    "Steel": {
        "Rock": 2,
        "Steel": 0.5,
        "Fire": 0.5,
        "Water": 0.5,
        "Electric": 0.5,
        "Ice": 2,
        "Fairy": 2
    },
    "Fire": {
        "Rock": 0.5,
        "Bug": 2,
        "Steel": 2,
        "Fire": 0.5,
        "Water": 0.5,
        "Grass": 2,
        "Ice": 2,
        "Dragon": 0.5
    },
    "Water": {
        "Ground": 2,
        "Rock": 2,
        "Fire": 2,
        "Water": 0.5,
        "Grass": 0.5,
        "Dragon": 0.5
    },
    "Grass": {
        "Flying": 0.5,
        "Poison": 0.5,
        "Ground": 2,
        "Rock": 2,
        "Bug": 0.5,
        "Steel": 0.5,
        "Fire": 0.5,
        "Water": 2,
        "Grass": 0.5,
        "Dragon": 0.5
    },
    "Electric": {
        "Flying": 2,
        "Ground": 0,
        "Water": 2,
        "Grass": 0.5,
        "Electric": 0.5,
        "Dragon": 0.5
    },
    "Psychic": {
        "Fighting": 2,
        "Poison": 2,
        "Steel": 0.5,
        "Psychic": 0.5,
        "Dark": 0
    },
    "Ice": {
        "Flying": 2,
        "Ground": 2,
        "Steel": 0.5,
        "Fire": 0.5,
        "Water": 0.5,
        "Grass": 2,
        "Ice": 0.5,
        "Dragon": 2
    },
    "Dragon": {
        "Steel": 0.5,
        "Fire": 1,
        "Water": 1,
        "Electric": 1,
        "Grass": 1,
        "Ice": 1,
        "Dragon": 2,
        "Fairy": 0
    },
    "Dark": {
        "Fighting": 0.5,
        "Ghost": 2,
        "Psychic": 2,
        "Dark": 0.5,
        "Fairy": 0.5
    },
    "Fairy": {
        "Fighting": 2,
        "Poison": 0.5,
        "Steel": 0.5,
        "Fire": 0.5,
        "Dragon": 2,
        "Dark": 2
    }
};

// Get type effectiveness multiplier
export function getTypeEffectiveness(attackType, targetTypes) {
    let effectiveness = 1;
    
    for (const targetType of targetTypes) {
        if (TYPE_EFFECTIVENESS[attackType] && TYPE_EFFECTIVENESS[attackType][targetType] !== undefined) {
            effectiveness *= TYPE_EFFECTIVENESS[attackType][targetType];
        }
    }
    
    return effectiveness;
}

// Export global instance
export const gameEngine = new MonsterGameEngine();

// Make available globally for testing
window.gameEngine = gameEngine; 