// XP Debug Script - Test XP calculations and level-ups
import { levelUpManager } from './level_up_manager.js';

// Simple test function to show XP table issues
function testXPTable() {
    console.log('🔍 XP Table Test');
    console.log('================');
    
    // Test the formula manually
    console.log('Manual XP calculation for levels 2-6:');
    for (let level = 2; level <= 6; level++) {
        const baseXP = 100;
        const multiplier = 1.2;
        const xpNeeded = Math.floor(baseXP * Math.pow(level, 2.5) * multiplier);
        console.log(`Level ${level}: ${xpNeeded} XP needed for this level`);
    }
    
    console.log('\nActual XP table (cumulative):');
    for (let i = 1; i <= 6; i++) {
        const xpNeeded = levelUpManager.getXPForLevel(i);
        console.log(`Level ${i}: ${xpNeeded} total XP`);
    }
    
    console.log('\nTesting level calculation:');
    const testXPValues = [0, 100, 500, 750, 1000, 2000, 5000];
    testXPValues.forEach(xp => {
        const level = levelUpManager.getLevelFromXP(xp);
        console.log(`${xp} XP = Level ${level}`);
    });
}

// Debug function to test XP calculations
function debugXPSystem() {
    console.log('🔍 XP System Debug');
    console.log('==================');
    
    // First test the XP table
    testXPTable();
    
    // Test XP table generation
    console.log('\nXP Table (first 10 levels):');
    for (let i = 1; i <= 10; i++) {
        const xpNeeded = levelUpManager.getXPForLevel(i);
        console.log(`Level ${i}: ${xpNeeded} total XP`);
    }
    
    console.log('\nXP needed between levels:');
    for (let i = 2; i <= 10; i++) {
        const currentLevelXP = levelUpManager.getXPForLevel(i - 1);
        const nextLevelXP = levelUpManager.getXPForLevel(i);
        const xpBetween = nextLevelXP - currentLevelXP;
        console.log(`Level ${i-1} to ${i}: ${xpBetween} XP`);
    }
    
    // Test current monster scenario
    console.log('\n🧪 Testing Current Monster Scenario:');
    const testMonster = {
        name: 'Cryorose',
        level: 5,
        experience: 500,
        stats: { hp: 85, attack: 60, defense: 70, specialAttack: 80, specialDefense: 75, speed: 55 },
        maxHP: 85,
        currentHP: 85
    };
    
    console.log('Current monster state:', testMonster);
    
    // Calculate XP needed for next level
    const currentLevelXP = levelUpManager.getXPForLevel(testMonster.level);
    const nextLevelXP = levelUpManager.getXPForLevel(testMonster.level + 1);
    const xpToNextLevel = nextLevelXP - testMonster.experience;
    
    console.log(`Current level ${testMonster.level} requires: ${currentLevelXP} XP`);
    console.log(`Next level ${testMonster.level + 1} requires: ${nextLevelXP} XP`);
    console.log(`Monster has: ${testMonster.experience} XP`);
    console.log(`XP needed for next level: ${xpToNextLevel} XP`);
    
    // Test XP snack calculation
    const baseXP = 200;
    const levelMultiplier = Math.max(1, testMonster.level * 0.8);
    const xpGained = Math.floor(baseXP * levelMultiplier);
    
    console.log(`\n🍬 XP Snack calculation:`);
    console.log(`Base XP: ${baseXP}`);
    console.log(`Level multiplier (${testMonster.level} * 0.5): ${levelMultiplier}`);
    console.log(`XP gained from snack: ${xpGained}`);
    
    // Test awarding XP
    console.log(`\n⚡ Testing XP award:`);
    const testMonsterCopy = { ...testMonster };
    const result = levelUpManager.awardXP(testMonsterCopy, xpGained);
    
    console.log('Award result:', result);
    console.log('Monster after XP:', {
        level: testMonsterCopy.level,
        experience: testMonsterCopy.experience,
        maxHP: testMonsterCopy.maxHP
    });
    
    // Test if monster would level up with more XP
    console.log(`\n🚀 Testing with enough XP to level up:`);
    const testMonsterCopy2 = { ...testMonster };
    const bigXPGain = xpToNextLevel + 100; // Enough to level up
    const result2 = levelUpManager.awardXP(testMonsterCopy2, bigXPGain);
    
    console.log(`Giving ${bigXPGain} XP:`);
    console.log('Award result:', result2);
    console.log('Monster after big XP:', {
        level: testMonsterCopy2.level,
        experience: testMonsterCopy2.experience,
        maxHP: testMonsterCopy2.maxHP
    });
}

// Quick function to show what XP is needed for starting levels
function showStartingLevels() {
    console.log('🎯 Starting Level XP Requirements:');
    console.log('==================================');
    for (let level = 1; level <= 10; level++) {
        const xpNeeded = levelUpManager.getXPForLevel(level);
        console.log(`Level ${level}: ${xpNeeded} XP`);
    }
    
    console.log('\n🍬 XP Snack values for different levels:');
    for (let level = 1; level <= 10; level++) {
        const baseXP = 200;
        const levelMultiplier = Math.max(1, level * 0.8);
        const xpGained = Math.floor(baseXP * levelMultiplier);
        console.log(`Level ${level}: ${xpGained} XP from snack`);
    }
}

// Make it available globally for testing
window.debugXPSystem = debugXPSystem;
window.testXPTable = testXPTable;
window.showStartingLevels = showStartingLevels;

console.log('🔍 XP Debug script loaded! Run debugXPSystem(), testXPTable(), or showStartingLevels() in console to test.'); 