// XP Snack Test Utilities - For testing and development
import { xpSnackManager } from './xp-snack-manager.js';

// Test function to add XP Snacks to user's inventory
export async function addTestXPSnacks(count = 10) {
    try {
        const result = await xpSnackManager.addXPSnacks(count);
        
        if (result.success) {
            console.log(`✅ Added ${count} XP Snacks to inventory`);
            console.log(`Previous count: ${result.oldCount}`);
            console.log(`New count: ${result.newCount}`);
            
            if (window.showToast) {
                window.showToast(`Added ${count} XP Snacks to your inventory!`, 'success');
            }
            
            // Update the display if the function exists
            if (window.MonsterTamers && window.MonsterTamers.updateXPSnackCount) {
                window.MonsterTamers.updateXPSnackCount();
            }
            
            return result;
        } else {
            console.error('❌ Failed to add XP Snacks:', result.error);
            if (window.showToast) {
                window.showToast('Failed to add XP Snacks: ' + result.error, 'error');
            }
            return result;
        }
    } catch (error) {
        console.error('❌ Error adding test XP Snacks:', error);
        if (window.showToast) {
            window.showToast('Error adding XP Snacks: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Test function to check current XP Snack count
export async function checkXPSnackCount() {
    try {
        const count = await xpSnackManager.getXPSnackCount();
        console.log(`🍬 Current XP Snack count: ${count}`);
        
        if (window.showToast) {
            window.showToast(`You have ${count} XP Snacks`, 'info');
        }
        
        return count;
    } catch (error) {
        console.error('❌ Error checking XP Snack count:', error);
        return 0;
    }
}

// Test function to use an XP Snack on a random monster
export async function testXPSnackUsage() {
    try {
        // Get user's monsters from the cache
        if (!window.MonsterTamers || !window.MonsterTamers.userMonstersCache) {
            throw new Error('No monsters available for testing');
        }
        
        const userMonsters = window.MonsterTamers.userMonstersCache;
        if (userMonsters.length === 0) {
            throw new Error('No monsters in collection');
        }
        
        // Pick a random monster
        const randomMonster = userMonsters[Math.floor(Math.random() * userMonsters.length)];
        
        console.log(`🧪 Testing XP Snack on ${randomMonster.monsterId} (UID: ${randomMonster.uid})`);
        
        // Use the XP Snack
        const result = await window.MonsterTamers.useXPSnackOnMonster(randomMonster.uid);
        
        if (result && result.success) {
            console.log('✅ XP Snack test successful!');
            return result;
        } else {
            console.log('❌ XP Snack test failed:', result?.error || 'Unknown error');
            return result;
        }
        
    } catch (error) {
        console.error('❌ Error testing XP Snack usage:', error);
        if (window.showToast) {
            window.showToast('XP Snack test failed: ' + error.message, 'error');
        }
        return { success: false, error: error.message };
    }
}

// Make functions available globally for console testing
window.XPSnackTest = {
    addTestXPSnacks,
    checkXPSnackCount,
    testXPSnackUsage
};

console.log('🧪 XP Snack Test utilities loaded!');
console.log('Available functions:');
console.log('- XPSnackTest.addTestXPSnacks(count) - Add XP Snacks to inventory');
console.log('- XPSnackTest.checkXPSnackCount() - Check current XP Snack count');
console.log('- XPSnackTest.testXPSnackUsage() - Test using XP Snack on random monster'); 