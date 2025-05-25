// Fix Monster Levels - Migration script to fix level/XP mismatches
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

class MonsterLevelFixer {
    constructor() {
        this.auth = getAuth();
        this.database = getDatabase();
    }

    // Fix all monsters for a specific user
    async fixUserMonsters(userId) {
        console.log(`🔧 Starting monster level fix for user: ${userId}`);
        
        try {
            const userMonstersRef = ref(this.database, `users/${userId}/monsters`);
            const snapshot = await get(userMonstersRef);
            
            if (!snapshot.exists()) {
                console.log('❌ No monsters found for this user');
                return;
            }
            
            const monsters = snapshot.val();
            const updates = {};
            let fixedCount = 0;
            
            for (const [monsterKey, monster] of Object.entries(monsters)) {
                // Check for level/XP mismatch
                const hasLevelXPMismatch = (
                    monster.level && monster.level > 1 && 
                    (monster.experience === 0 || monster.experience === undefined)
                );
                
                if (hasLevelXPMismatch) {
                    console.log(`🎯 Fixing ${monster.monsterId || 'Unknown'} (${monsterKey}): Level ${monster.level} with ${monster.experience || 0} XP`);
                    
                    // Reset to Level 1 with 0 XP
                    updates[`${monsterKey}/level`] = 1;
                    updates[`${monsterKey}/experience`] = 0;
                    
                    // Remove old XP field if it exists
                    if (monster.xp !== undefined) {
                        updates[`${monsterKey}/xp`] = null;
                    }
                    
                    fixedCount++;
                }
            }
            
            if (fixedCount > 0) {
                await update(userMonstersRef, updates);
                console.log(`✅ Fixed ${fixedCount} monsters for user ${userId}`);
            } else {
                console.log(`✅ No monsters needed fixing for user ${userId}`);
            }
            
            return fixedCount;
            
        } catch (error) {
            console.error(`❌ Error fixing monsters for user ${userId}:`, error);
            throw error;
        }
    }

    // Fix monsters for the current logged-in user
    async fixCurrentUserMonsters() {
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            console.error('❌ No user logged in');
            return;
        }
        
        return this.fixUserMonsters(currentUser.uid);
    }
}

// Create global instance
window.MonsterLevelFixer = new MonsterLevelFixer();

// Convenience functions for console use
window.fixMyMonsters = () => window.MonsterLevelFixer.fixCurrentUserMonsters();
window.fixUserMonsters = (userId) => window.MonsterLevelFixer.fixUserMonsters(userId);

console.log('🔧 Monster Level Fixer loaded!');
console.log('Available functions:');
console.log('- fixMyMonsters() - Fix monsters for current user');
console.log('- fixUserMonsters(userId) - Fix monsters for specific user'); 