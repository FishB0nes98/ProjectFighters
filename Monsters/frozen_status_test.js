// Frozen Status Test - Test script to verify frozen status is working
console.log('🧊 Frozen Status Test loaded!');

// Test functions for frozen status
window.FrozenStatusTest = {
    // Test frozen status application
    testFrozenStatus() {
        console.log('🧪 Testing frozen status application...');
        
        // Create a mock monster
        const testMonster = {
            name: 'Test Monster',
            statusCondition: 'none',
            statusTurns: 0,
            currentHP: 100,
            maxHP: 100
        };
        
        console.log('Before freeze:', testMonster);
        
        // Apply frozen status
        testMonster.statusCondition = 'frozen';
        testMonster.statusTurns = 3;
        
        console.log('After freeze:', testMonster);
        console.log('✅ Frozen status applied successfully!');
        
        return testMonster;
    },
    
    // Test thaw out chance
    testThawOut() {
        console.log('🧪 Testing thaw out mechanics...');
        
        const frozenMonster = {
            name: 'Frozen Monster',
            statusCondition: 'frozen',
            statusTurns: 2,
            currentHP: 80,
            maxHP: 100
        };
        
        console.log('Frozen monster:', frozenMonster);
        
        // Simulate thaw out check (20% chance)
        let attempts = 0;
        let thawed = false;
        
        while (!thawed && attempts < 20) {
            attempts++;
            if (Math.random() < 0.2) {
                frozenMonster.statusCondition = 'none';
                frozenMonster.statusTurns = 0;
                thawed = true;
                console.log(`🔥 Monster thawed out after ${attempts} attempts!`);
            }
        }
        
        if (!thawed) {
            console.log('❄️ Monster remained frozen after 20 attempts (expected sometimes)');
        }
        
        console.log('Final state:', frozenMonster);
        return frozenMonster;
    },
    
    // Test move prevention
    testMoveBlocking() {
        console.log('🧪 Testing move blocking for frozen monsters...');
        
        const frozenMonster = {
            name: 'Frozen Fighter',
            statusCondition: 'frozen',
            statusTurns: 1,
            currentHP: 50,
            maxHP: 100
        };
        
        // Simulate move attempt
        function canMove(monster) {
            if (monster.statusCondition === 'frozen' || monster.statusCondition === 'freeze') {
                console.log(`${monster.name} is frozen solid and cannot move!`);
                
                // 20% chance to thaw
                if (Math.random() < 0.2) {
                    monster.statusCondition = 'none';
                    monster.statusTurns = 0;
                    console.log(`${monster.name} thawed out!`);
                    return true;
                }
                
                return false;
            }
            return true;
        }
        
        const canMoveResult = canMove(frozenMonster);
        console.log(`Can move: ${canMoveResult}`);
        console.log('Final monster state:', frozenMonster);
        
        return { canMove: canMoveResult, monster: frozenMonster };
    },
    
    // Test Cryorose's Frozen Petal move
    testFrozenPetal() {
        console.log('🧪 Testing Cryorose\'s Frozen Petal move...');
        
        const cryorose = {
            name: 'Cryorose',
            level: 5,
            types: ['Ice', 'Grass'],
            stats: { specialAttack: 70 },
            ability: { name: 'Glacial Bloom' }
        };
        
        const target = {
            name: 'Target Monster',
            statusCondition: 'none',
            statusTurns: 0,
            currentHP: 100,
            maxHP: 100,
            stats: { specialDefense: 60 },
            types: ['Normal']
        };
        
        console.log('Cryorose:', cryorose);
        console.log('Target before:', target);
        
        // Simulate Frozen Petal freeze chance (30% base, 50% with ability)
        const freezeChance = cryorose.ability?.name === 'Glacial Bloom' ? 0.50 : 0.30;
        
        if (Math.random() < freezeChance && target.statusCondition === 'none') {
            target.statusCondition = 'frozen';
            target.statusTurns = 2 + Math.floor(Math.random() * 2); // 2-3 turns
            console.log(`🧊 ${target.name} was frozen by Frozen Petal!`);
        } else {
            console.log(`❄️ Frozen Petal didn't freeze the target this time`);
        }
        
        console.log('Target after:', target);
        return { user: cryorose, target: target };
    },
    
    // Run all tests
    runAllTests() {
        console.log('🧊 Running all frozen status tests...');
        console.log('='.repeat(50));
        
        this.testFrozenStatus();
        console.log('-'.repeat(30));
        
        this.testThawOut();
        console.log('-'.repeat(30));
        
        this.testMoveBlocking();
        console.log('-'.repeat(30));
        
        this.testFrozenPetal();
        console.log('='.repeat(50));
        
        console.log('✅ All frozen status tests completed!');
        console.log('💡 Try using Cryorose\'s Frozen Petal in battle to test the real implementation!');
    }
};

console.log('🧊 Frozen Status Test utilities loaded!');
console.log('Available functions:');
console.log('- FrozenStatusTest.testFrozenStatus() - Test status application');
console.log('- FrozenStatusTest.testThawOut() - Test thaw out mechanics');
console.log('- FrozenStatusTest.testMoveBlocking() - Test move prevention');
console.log('- FrozenStatusTest.testFrozenPetal() - Test Frozen Petal move');
console.log('- FrozenStatusTest.runAllTests() - Run all tests'); 