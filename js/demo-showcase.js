// Demo Showcase - Demonstrates Monster Fighters features
export class DemoShowcase {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.demoSteps = [
            {
                name: "Welcome",
                description: "Welcome to Monster Fighters! Let's showcase the key features.",
                action: () => this.showWelcomeMessage()
            },
            {
                name: "Team Generation", 
                description: "First, let's generate a test team of monsters.",
                action: () => this.generateDemoTeam()
            },
            {
                name: "Monster Stats",
                description: "Each monster has unique IVs and calculated stats.",
                action: () => this.showMonsterStats()
            },
            {
                name: "Type System",
                description: "Our comprehensive type system with 18 types.",
                action: () => this.demonstrateTypeSystem()
            },
            {
                name: "AI Personalities",
                description: "Different AI personalities for varied gameplay.",
                action: () => this.demonstrateAI()
            },
            {
                name: "Battle Demo",
                description: "Let's see a battle in action!",
                action: () => this.startDemoBattle()
            }
        ];
        this.currentStep = 0;
    }

    // Start the demo showcase
    startDemo() {
        console.log('🎭 Starting Monster Fighters Demo Showcase');
        this.executeStep(0);
    }

    // Execute a specific demo step
    executeStep(stepIndex) {
        if (stepIndex >= this.demoSteps.length) {
            this.endDemo();
            return;
        }

        const step = this.demoSteps[stepIndex];
        console.log(`\n📋 Demo Step ${stepIndex + 1}: ${step.name}`);
        console.log(`📝 ${step.description}`);
        
        this.currentStep = stepIndex;
        step.action();
    }

    // Show welcome message
    showWelcomeMessage() {
        const message = `
🎮 MONSTER FIGHTERS DEMO SHOWCASE
═══════════════════════════════════

This demo will show you:
✨ Dynamic monster generation with IVs
⚔️ Turn-based battle system
🧠 Intelligent AI with personalities
🎯 Type effectiveness system
🎨 Modern retro UI design
🔧 Modular game architecture

Ready to explore? Let's go!
        `;
        
        console.log(message);
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            this.executeStep(this.currentStep + 1);
        }, 3000);
    }

    // Generate demo team
    generateDemoTeam() {
        console.log('🏗️ Generating demo team...');
        
        // Clear existing team
        this.gameEngine.userTeam = [];
        
        // Generate monsters with specific IVs for demo
        const monsters = this.gameEngine.getAllMonsters();
        
        for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            const demoIVs = {
                hp: 31,
                attack: Math.floor(Math.random() * 32),
                defense: Math.floor(Math.random() * 32),
                specialAttack: Math.floor(Math.random() * 32),
                specialDefense: Math.floor(Math.random() * 32),
                speed: Math.floor(Math.random() * 32)
            };
            
            const battleMonster = this.gameEngine.createBattleMonster(monster, {
                level: 15 + Math.floor(Math.random() * 10), // Level 15-24
                ivs: demoIVs
            }, `demo_${i}`);
            
            this.gameEngine.userTeam.push(battleMonster);
            
            console.log(`✅ Created ${monster.name} (Lv.${battleMonster.level})`);
        }
        
        console.log(`🎯 Team complete! Generated ${this.gameEngine.userTeam.length} monsters.`);
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
            this.executeStep(this.currentStep + 1);
        }, 2000);
    }

    // Show monster stats breakdown
    showMonsterStats() {
        console.log('📊 Monster Stats Breakdown:');
        console.log('════════════════════════════');
        
        this.gameEngine.userTeam.forEach((monster, index) => {
            console.log(`\n${index + 1}. ${monster.name} (${monster.types.join('/')})`);
            console.log(`   Level: ${monster.level}`);
            console.log(`   HP: ${monster.maxHP} (Base: ${monster.baseStats.hp}, IV: ${monster.ivs.hp})`);
            console.log(`   Attack: ${monster.stats.attack} (Base: ${monster.baseStats.attack}, IV: ${monster.ivs.attack})`);
            console.log(`   Defense: ${monster.stats.defense} (Base: ${monster.baseStats.defense}, IV: ${monster.ivs.defense})`);
            console.log(`   Sp.Atk: ${monster.stats.specialAttack} (Base: ${monster.baseStats.specialAttack}, IV: ${monster.ivs.specialAttack})`);
            console.log(`   Sp.Def: ${monster.stats.specialDefense} (Base: ${monster.baseStats.specialDefense}, IV: ${monster.ivs.specialDefense})`);
            console.log(`   Speed: ${monster.stats.speed} (Base: ${monster.baseStats.speed}, IV: ${monster.ivs.speed})`);
            console.log(`   Ability: ${monster.ability?.name || 'None'}`);
            console.log(`   Moves: ${monster.moves.map(m => m.name).join(', ')}`);
        });
        
        // Auto-advance after 4 seconds
        setTimeout(() => {
            this.executeStep(this.currentStep + 1);
        }, 4000);
    }

    // Demonstrate type system
    demonstrateTypeSystem() {
        console.log('🔥 Type Effectiveness Demo:');
        console.log('═══════════════════════════');
        
        const demoMatchups = [
            { attacker: 'Water', defender: 'Fire', expected: 2.0, description: 'Water vs Fire' },
            { attacker: 'Fire', defender: 'Grass', expected: 2.0, description: 'Fire vs Grass' },
            { attacker: 'Grass', defender: 'Water', expected: 2.0, description: 'Grass vs Water' },
            { attacker: 'Electric', defender: 'Ground', expected: 0.0, description: 'Electric vs Ground' },
            { attacker: 'Fighting', defender: 'Ghost', expected: 0.0, description: 'Fighting vs Ghost' },
            { attacker: 'Fire', defender: 'Water', expected: 0.5, description: 'Fire vs Water' },
            { attacker: 'Water', defender: 'Grass', expected: 0.5, description: 'Water vs Grass' },
            { attacker: 'Normal', defender: 'Fighting', expected: 1.0, description: 'Normal vs Fighting' }
        ];
        
        // Import type effectiveness function
        import('./monster-game-engine.js').then(module => {
            const { getTypeEffectiveness } = module;
            
            demoMatchups.forEach(matchup => {
                const effectiveness = getTypeEffectiveness(matchup.attacker, [matchup.defender]);
                const result = effectiveness === matchup.expected ? '✅' : '❌';
                const effectText = effectiveness === 2 ? 'Super Effective!' : 
                                  effectiveness === 0.5 ? 'Not very effective...' :
                                  effectiveness === 0 ? 'No effect!' : 'Normal damage';
                
                console.log(`${result} ${matchup.description}: ${effectiveness}x (${effectText})`);
            });
            
            console.log('\n🎯 Type system working correctly!');
            
            // Auto-advance after 3 seconds
            setTimeout(() => {
                this.executeStep(this.currentStep + 1);
            }, 3000);
        });
    }

    // Demonstrate AI personalities
    demonstrateAI() {
        console.log('🤖 AI Personality Demo:');
        console.log('═══════════════════════');
        
        const personalities = ['aggressive', 'defensive', 'balanced', 'smart'];
        const difficulties = ['easy', 'normal', 'hard'];
        
        console.log('Available AI Personalities:');
        personalities.forEach(personality => {
            this.gameEngine.setAIPersonality(personality);
            console.log(`🎭 ${personality.toUpperCase()}: ${this.getPersonalityDescription(personality)}`);
        });
        
        console.log('\nAvailable Difficulty Levels:');
        difficulties.forEach(difficulty => {
            console.log(`⚡ ${difficulty.toUpperCase()}: ${this.getDifficultyDescription(difficulty)}`);
        });
        
        // Set to smart/normal for demo battle
        this.gameEngine.setAIPersonality('smart');
        this.gameEngine.setAIDifficulty('normal');
        
        console.log('\n🎯 AI set to Smart/Normal for demo battle!');
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            this.executeStep(this.currentStep + 1);
        }, 3000);
    }

    // Get personality description
    getPersonalityDescription(personality) {
        const descriptions = {
            aggressive: 'Prefers high-damage moves, avoids status moves',
            defensive: 'Favors status moves and high-accuracy attacks',
            balanced: 'No special preferences, well-rounded strategy',
            smart: 'Heavily weighs type effectiveness and optimal play'
        };
        return descriptions[personality] || 'Unknown personality';
    }

    // Get difficulty description
    getDifficultyDescription(difficulty) {
        const descriptions = {
            easy: '30% chance to pick random moves',
            normal: 'Balanced strategic play',
            hard: 'Optimal move selection with advanced tactics'
        };
        return descriptions[difficulty] || 'Unknown difficulty';
    }

    // Start demo battle
    startDemoBattle() {
        console.log('⚔️ Starting Demo Battle!');
        console.log('═══════════════════════');
        
        if (this.gameEngine.userTeam.length === 0) {
            console.log('❌ No team available! Generating one now...');
            this.gameEngine.generateTestTeam();
        }
        
        console.log('🎮 Battle features to watch:');
        console.log('  • Real-time HP bars with color indicators');
        console.log('  • Type effectiveness preview on move hover');
        console.log('  • Typewriter battle log messages');
        console.log('  • Animated battle effects');
        console.log('  • Smart AI decision making');
        console.log('  • Field effects and status conditions');
        
        console.log('\n🚀 Starting battle now!');
        
        // Start the actual battle
        this.gameEngine.quickBattle();
        
        console.log('\n🎭 Demo showcase complete! Enjoy playing Monster Fighters!');
    }

    // End demo
    endDemo() {
        const endMessage = `
🎉 DEMO SHOWCASE COMPLETE!
═══════════════════════════

Thank you for exploring Monster Fighters!

🎮 What you've seen:
✅ Dynamic monster generation with IVs
✅ Comprehensive type effectiveness system  
✅ Intelligent AI with multiple personalities
✅ Modern retro battle interface
✅ Modular, extensible architecture

🚀 Ready to play? Try these commands:
• gameEngine.quickBattle() - Start a battle
• debugMode.generateTestTeam() - Make a new team
• setAIDifficulty('hard') - Challenge yourself
• setAIPersonality('aggressive') - Change AI behavior

Happy battling! ⚔️
        `;
        
        console.log(endMessage);
    }
}

// Auto-start demo when imported
export function startDemo(gameEngine) {
    const demo = new DemoShowcase(gameEngine);
    demo.startDemo();
    return demo;
} 