// XP Manager - Handles experience gain and leveling system
export class XPManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.maxLevel = 100;
        
        // Very slow progression - exponential growth
        // Level 1->2 needs 100 XP, Level 99->100 needs ~50,000 XP
        this.xpTable = this.generateXPTable();
    }

    // Generate XP requirements table for each level
    generateXPTable() {
        const table = [0]; // Level 1 starts at 0 XP
        
        for (let level = 2; level <= this.maxLevel; level++) {
            // Exponential formula for very slow progression
            // Base XP + (level^2.5 * multiplier)
            const baseXP = 50;
            const multiplier = 8;
            const exponent = 2.3;
            
            const xpNeeded = Math.floor(baseXP + Math.pow(level, exponent) * multiplier);
            table.push(table[table.length - 1] + xpNeeded);
        }
        
        return table;
    }

    // Get total XP needed to reach a specific level
    getXPForLevel(level) {
        if (level <= 1) return 0;
        if (level > this.maxLevel) return this.xpTable[this.maxLevel - 1];
        return this.xpTable[level - 1];
    }

    // Get XP needed for next level
    getXPToNextLevel(currentLevel, currentXP) {
        if (currentLevel >= this.maxLevel) return 0;
        
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        return nextLevelXP - currentXP;
    }

    // Get current level progress (0.0 to 1.0)
    getLevelProgress(level, currentXP) {
        if (level >= this.maxLevel) return 1.0;
        
        const currentLevelXP = this.getXPForLevel(level);
        const nextLevelXP = this.getXPForLevel(level + 1);
        const levelXPRange = nextLevelXP - currentLevelXP;
        const progressXP = currentXP - currentLevelXP;
        
        return Math.max(0, Math.min(1, progressXP / levelXPRange));
    }

    // Calculate level from total XP
    getLevelFromXP(totalXP) {
        for (let level = 1; level <= this.maxLevel; level++) {
            if (totalXP < this.getXPForLevel(level)) {
                return level - 1;
            }
        }
        return this.maxLevel;
    }

    // Calculate XP gain from defeating a monster
    calculateXPGain(winner, loser, battleType = 'wild') {
        const baseXP = 75; // Increased base XP for faster progression (was 25)
        const levelDiff = loser.level - winner.level;
        
        // Level difference multiplier (fighting higher level gives more XP)
        let levelMultiplier = 1.0;
        if (levelDiff > 0) {
            levelMultiplier = 1.0 + (levelDiff * 0.25); // Increased to 25% more per level difference (was 15%)
        } else if (levelDiff < 0) {
            levelMultiplier = Math.max(0.3, 1.0 + (levelDiff * 0.1)); // Increased minimum to 30% (was 10%)
        }
        
        // Battle type multiplier
        let battleMultiplier = 1.0;
        switch (battleType) {
            case 'wild':
                battleMultiplier = 1.2; // Increased wild battle XP (was 1.0)
                break;
            case 'trainer':
                battleMultiplier = 2.0; // Increased trainer battle XP (was 1.5)
                break;
            case 'boss':
                battleMultiplier = 3.0; // Increased boss battle XP (was 2.0)
                break;
        }
        
        // Loser's level contributes to XP (higher level opponents give more XP)
        const levelBonus = Math.floor(loser.level * 1.5); // Increased level bonus (was 0.8)
        
        const finalXP = Math.floor((baseXP + levelBonus) * levelMultiplier * battleMultiplier);
        
        // Minimum 5 XP, increased maximum scaling
        return Math.max(5, Math.min(finalXP, loser.level * 25)); // Increased minimum and maximum
    }

    // Award XP to a monster and handle level ups
    awardXP(monster, xpGain, battleLog = null) {
        if (!monster.xp) monster.xp = 0;
        if (!monster.level) monster.level = 1;
        
        const oldLevel = monster.level;
        const oldXP = monster.xp;
        
        console.log(`💫 XP Manager: Awarding ${xpGain} XP to ${monster.name}. Before: Level ${oldLevel}, XP ${oldXP}`);
        monster.xp += xpGain;
        console.log(`💫 XP Manager: After adding XP: Level ${monster.level}, XP ${monster.xp}`);
        
        // Check for level ups
        const newLevel = this.getLevelFromXP(monster.xp);
        const levelsGained = newLevel - oldLevel;
        
        if (levelsGained > 0) {
            monster.level = newLevel;
            
            // Recalculate stats for new level
            this.recalculateStatsForLevel(monster);
            
            // Add level up messages
            if (battleLog) {
                for (let i = 0; i < levelsGained; i++) {
                    const levelReached = oldLevel + i + 1;
                    battleLog.push(`🎉 ${monster.name} reached level ${levelReached}!`);
                    
                    // Show stat increases
                    const statIncrease = this.getStatIncreaseForLevel(monster);
                    if (statIncrease.total > 0) {
                        battleLog.push(`📈 Stats increased! (+${statIncrease.total} total)`);
                    }
                }
            }
        }
        
        return {
            xpGained: xpGain,
            oldLevel: oldLevel,
            newLevel: monster.level,
            levelsGained: levelsGained,
            oldXP: oldXP,
            newXP: monster.xp
        };
    }

    // Recalculate monster stats when leveling up
    recalculateStatsForLevel(monster) {
        if (!monster.baseStats || !monster.ivs) return;
        
        const oldMaxHP = monster.maxHP;
        
        // Recalculate all stats
        monster.stats = this.gameEngine.calculateStats(monster.baseStats, monster.level, monster.ivs);
        monster.maxHP = this.gameEngine.calculateHP(monster.baseStats.hp, monster.level, monster.ivs.hp);
        
        // Maintain HP percentage when leveling up
        const hpPercentage = monster.currentHP / oldMaxHP;
        monster.currentHP = Math.floor(monster.maxHP * hpPercentage);
        
        // Ensure at least 1 HP if monster was alive
        if (monster.currentHP <= 0 && oldMaxHP > 0) {
            monster.currentHP = 1;
        }
    }

    // Get stat increase information for a level up
    getStatIncreaseForLevel(monster) {
        if (!monster.baseStats || !monster.ivs) {
            return { total: 0, breakdown: {} };
        }
        
        const oldStats = this.gameEngine.calculateStats(monster.baseStats, monster.level - 1, monster.ivs);
        const newStats = monster.stats;
        
        const increases = {
            hp: newStats.hp - oldStats.hp,
            attack: newStats.attack - oldStats.attack,
            defense: newStats.defense - oldStats.defense,
            specialAttack: newStats.specialAttack - oldStats.specialAttack,
            specialDefense: newStats.specialDefense - oldStats.specialDefense,
            speed: newStats.speed - oldStats.speed
        };
        
        const total = Object.values(increases).reduce((sum, val) => sum + val, 0);
        
        return {
            total: total,
            breakdown: increases
        };
    }

    // Award XP to entire team (for participating in battle)
    awardTeamXP(team, xpPerMonster, battleType = 'wild', battleLog = null) {
        const results = [];
        
        for (const monster of team) {
            // Only conscious monsters get full XP, fainted monsters get 50%
            const xpMultiplier = monster.currentHP > 0 ? 1.0 : 0.5;
            const finalXP = Math.floor(xpPerMonster * xpMultiplier);
            
            if (finalXP > 0) {
                const result = this.awardXP(monster, finalXP, battleLog);
                result.monster = monster;
                results.push(result);
            }
        }
        
        return results;
    }

    // Get XP progress bar data for UI
    getXPBarData(monster) {
        if (!monster.xp) monster.xp = 0;
        if (!monster.level) monster.level = 1;
        
        const currentLevelXP = this.getXPForLevel(monster.level);
        const nextLevelXP = this.getXPForLevel(monster.level + 1);
        const progress = this.getLevelProgress(monster.level, monster.xp);
        const xpToNext = this.getXPToNextLevel(monster.level, monster.xp);
        
        return {
            level: monster.level,
            currentXP: monster.xp,
            currentLevelXP: currentLevelXP,
            nextLevelXP: nextLevelXP,
            progress: progress,
            xpToNext: xpToNext,
            isMaxLevel: monster.level >= this.maxLevel
        };
    }

    // Format XP for display
    formatXP(xp) {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(1)}M`;
        } else if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)}K`;
        }
        return xp.toString();
    }

    // Save monster XP to Firebase
    async saveMonsterXP(monster) {
        if (!this.gameEngine.currentUser || !monster.uid || !window.firebaseDatabase) {
            console.log(`⚠️ Cannot save XP for ${monster.name}: User=${!!this.gameEngine.currentUser}, UID=${!!monster.uid}, Firebase=${!!window.firebaseDatabase}`);
            return;
        }
        
        try {
            const { ref, update } = await import('https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js');
            const monsterRef = ref(window.firebaseDatabase, `users/${this.gameEngine.currentUser.uid}/monsters/${monster.uid}`);
            
            console.log(`💾 Saving XP for ${monster.name}: Level ${monster.level} (${monster.xp} XP) to Firebase...`);
            await update(monsterRef, {
                level: monster.level,
                xp: monster.xp || 0
            });
            
            console.log(`✅ Successfully saved XP for ${monster.name}: Level ${monster.level} (${monster.xp} XP)`);
        } catch (error) {
            console.error('❌ Failed to save monster XP:', error);
        }
    }

    // Bulk save team XP to Firebase
    async saveTeamXP(team) {
        if (!this.gameEngine.currentUser || !window.firebaseDatabase) return;
        
        const promises = team
            .filter(monster => monster.uid)
            .map(monster => this.saveMonsterXP(monster));
        
        try {
            await Promise.all(promises);
            console.log(`💾 Saved XP for ${promises.length} monsters`);
        } catch (error) {
            console.error('Failed to save team XP:', error);
        }
    }
} 