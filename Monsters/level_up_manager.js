// Level Up Manager - Handles XP gain and level-ups during battles
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

export class LevelUpManager {
    constructor() {
        this.auth = getAuth();
        this.database = getDatabase();
        this.maxLevel = 100;
        
        // Generate XP table for level requirements
        this.xpTable = this.generateXPTable();
    }

    // Generate XP requirements table for each level (similar to Pokemon)
    generateXPTable() {
        const table = [0]; // Level 1 starts at 0 XP
        
        for (let level = 2; level <= this.maxLevel; level++) {
            // More reasonable formula: quadratic growth instead of 2.5 power
            const baseXP = 50;
            const levelSquared = level * level;
            const xpNeeded = Math.floor(baseXP * levelSquared * 0.8);
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

    // Calculate level from total XP
    getLevelFromXP(totalXP) {
        for (let level = 1; level <= this.maxLevel; level++) {
            if (totalXP < this.getXPForLevel(level)) {
                return level - 1;
            }
        }
        return this.maxLevel;
    }

    // Calculate XP gain from defeating a monster (Pokemon-style formula)
    calculateXPGain(winner, loser, battleType = 'wild', isTrainerBattle = false) {
        const baseXP = 50;
        const levelDiff = loser.level - winner.level;
        
        // Level difference multiplier
        let levelMultiplier = 1.0;
        if (levelDiff > 0) {
            levelMultiplier = 1.0 + (levelDiff * 0.2); // 20% more per level difference
        } else if (levelDiff < 0) {
            levelMultiplier = Math.max(0.2, 1.0 + (levelDiff * 0.1)); // Minimum 20%
        }
        
        // Battle type multiplier
        let battleMultiplier = 1.0;
        if (isTrainerBattle) {
            battleMultiplier = 1.5; // Trainer battles give 50% more XP
        }
        
        switch (battleType) {
            case 'wild':
                battleMultiplier *= 1.0;
                break;
            case 'trainer':
                battleMultiplier *= 1.5;
                break;
            case 'boss':
                battleMultiplier *= 2.0;
                break;
        }
        
        // Loser's level contributes to XP
        const levelBonus = Math.floor(loser.level * 1.2);
        
        const finalXP = Math.floor((baseXP + levelBonus) * levelMultiplier * battleMultiplier);
        
        // Minimum 10 XP, maximum based on loser's level
        return Math.max(10, Math.min(finalXP, loser.level * 30));
    }

    // Award XP and handle level-ups (returns level-up information)
    awardXP(monster, xpGain) {
        if (!monster.experience) monster.experience = 0;
        if (!monster.level) monster.level = 1;
        
        const oldLevel = monster.level;
        const oldXP = monster.experience;
        
        // Add XP
        monster.experience += xpGain;
        
        // Check for level ups
        const newLevel = this.getLevelFromXP(monster.experience);
        const levelsGained = newLevel - oldLevel;
        
        const result = {
            xpGained: xpGain,
            oldLevel: oldLevel,
            newLevel: newLevel,
            levelsGained: levelsGained,
            oldXP: oldXP,
            newXP: monster.experience,
            statIncreases: null
        };
        
        // Always update the monster's level to match the calculated level
        monster.level = newLevel;
        
        if (levelsGained > 0) {
            // Calculate stat increases
            const statIncreases = this.calculateStatIncreases(monster, levelsGained);
            result.statIncreases = statIncreases;
            
            // Apply stat increases
            this.applyStatIncreases(monster, statIncreases);
            
            // Heal monster slightly on level up (like Pokemon)
            const healAmount = Math.floor(monster.maxHP * 0.1); // 10% heal
            monster.currentHP = Math.min(monster.maxHP, monster.currentHP + healAmount);
        }
        
        return result;
    }

    // Calculate stat increases for level-ups (Pokemon-style)
    calculateStatIncreases(monster, levelsGained) {
        const baseStats = monster.stats || monster.baseStats;
        if (!baseStats) return null;
        
        const increases = {
            hp: 0,
            attack: 0,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0
        };
        
        // Calculate increases based on base stats and level gains
        for (let i = 0; i < levelsGained; i++) {
            // Each stat increases based on its base value
            // Higher base stats = higher increases per level
            increases.hp += Math.max(1, Math.floor(baseStats.hp / 20));
            increases.attack += Math.max(1, Math.floor(baseStats.attack / 25));
            increases.defense += Math.max(1, Math.floor(baseStats.defense / 25));
            increases.specialAttack += Math.max(1, Math.floor(baseStats.specialAttack / 25));
            increases.specialDefense += Math.max(1, Math.floor(baseStats.specialDefense / 25));
            increases.speed += Math.max(1, Math.floor(baseStats.speed / 25));
        }
        
        return increases;
    }

    // Apply stat increases to monster
    applyStatIncreases(monster, statIncreases) {
        if (!statIncreases) return;
        
        // Ensure monster has stats object
        if (!monster.stats) {
            monster.stats = { ...monster.baseStats };
        }
        
        // Apply increases to current stats
        monster.stats.hp += statIncreases.hp;
        monster.stats.attack += statIncreases.attack;
        monster.stats.defense += statIncreases.defense;
        monster.stats.specialAttack += statIncreases.specialAttack;
        monster.stats.specialDefense += statIncreases.specialDefense;
        monster.stats.speed += statIncreases.speed;
        
        // Ensure maxHP is initialized
        if (!monster.maxHP) {
            monster.maxHP = monster.stats.hp;
        }
        
        // Update max HP
        const oldMaxHP = monster.maxHP || monster.stats.hp;
        monster.maxHP = (monster.maxHP || 0) + statIncreases.hp;
        
        // Ensure currentHP is initialized
        if (!monster.currentHP) {
            monster.currentHP = monster.maxHP;
        }
        
        // Maintain HP percentage when max HP increases
        if (oldMaxHP > 0) {
            const hpPercentage = monster.currentHP / oldMaxHP;
            monster.currentHP = Math.floor(monster.maxHP * hpPercentage);
        } else {
            monster.currentHP = monster.maxHP;
        }
    }

    // Save monster data to Firebase
    async saveMonsterData(monster, userId = null) {
        try {
            const currentUserId = userId || this.auth.currentUser?.uid;
            if (!currentUserId || !monster.uid) {
                console.warn('Cannot save monster data: missing user ID or monster UID');
                return false;
            }

            const monsterRef = ref(this.database, `users/${currentUserId}/monsters/${monster.uid}`);
            
            const updateData = {
                level: monster.level,
                experience: monster.experience || 0,
                stats: monster.stats,
                currentHP: monster.currentHP,
                maxHP: monster.maxHP
            };

            await update(monsterRef, updateData);
            console.log(`✅ Saved monster data for ${monster.name}: Level ${monster.level} (${monster.experience} XP)`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save monster data:', error);
            return false;
        }
    }

    // Award XP to team after battle
    async awardTeamXP(team, defeatedMonster, battleType = 'wild', isTrainerBattle = false) {
        const results = [];
        
        for (const monster of team) {
            if (!monster || monster.currentHP <= 0) continue; // Only conscious monsters get XP
            
            const xpGain = this.calculateXPGain(monster, defeatedMonster, battleType, isTrainerBattle);
            const result = this.awardXP(monster, xpGain);
            result.monster = monster;
            results.push(result);
            
            // Save to Firebase
            await this.saveMonsterData(monster);
        }
        
        return results;
    }

    // Get XP progress information for UI
    getXPProgress(monster) {
        if (!monster.experience) monster.experience = 0;
        if (!monster.level) monster.level = 1;
        
        const currentLevelXP = this.getXPForLevel(monster.level);
        const nextLevelXP = this.getXPForLevel(monster.level + 1);
        const progressXP = monster.experience - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progress = neededXP > 0 ? progressXP / neededXP : 1.0;
        
        return {
            level: monster.level,
            currentXP: monster.experience,
            progressXP: progressXP,
            neededXP: neededXP,
            progress: Math.max(0, Math.min(1, progress)),
            xpToNext: Math.max(0, nextLevelXP - monster.experience),
            isMaxLevel: monster.level >= this.maxLevel
        };
    }

    // Format level-up message for battle log
    formatLevelUpMessage(result) {
        const messages = [];
        
        if (result.levelsGained > 0) {
            messages.push(`🎉 ${result.monster.name} reached level ${result.newLevel}!`);
            
            if (result.statIncreases) {
                const statNames = {
                    hp: 'HP',
                    attack: 'Attack',
                    defense: 'Defense',
                    specialAttack: 'Sp. Attack',
                    specialDefense: 'Sp. Defense',
                    speed: 'Speed'
                };
                
                const increases = [];
                for (const [stat, increase] of Object.entries(result.statIncreases)) {
                    if (increase > 0) {
                        increases.push(`${statNames[stat]} +${increase}`);
                    }
                }
                
                if (increases.length > 0) {
                    messages.push(`📈 ${increases.join(', ')}`);
                }
            }
        }
        
        return messages;
    }
}

// Create singleton instance
export const levelUpManager = new LevelUpManager(); 