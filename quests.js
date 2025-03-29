// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Blossom Quests',
        resetInterval: 64800000, // 18 hours in milliseconds
        maxActive: 3
    },
    special: {
        title: 'Blossom Festival Quests',
        maxActive: 6
    }
};

// Blossom event quest templates
export const questTemplates = {
    daily: [
        {
            id: 'blossom_gatherer',
            icon: 'fa-seedling',
            title: 'Blossom Gatherer',
            description: 'Play 3 games of any mode',
            requirements: {
                count: 3,
                type: 'play'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 125 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'spring_champion',
            icon: 'fa-leaf',
            title: 'Spring Champion',
            description: 'Win a game in any mode',
            requirements: {
                count: 1,
                type: 'win'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 175 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'cherry_blossom_fury',
            icon: 'fa-fire',
            title: 'Cherry Blossom Fury',
            description: 'Deal 10,000 damage to enemy champions',
            requirements: {
                count: 10000,
                type: 'damage'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 150 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null,
                totalDamage: 0
            }
        }
    ],
    special: [
        {
            id: 'sakura_warrior',
            icon: 'fa-trophy',
            title: 'Sakura Warrior',
            description: 'Win 3 games in a row',
            requirements: {
                count: 3,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 225 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                streak: 0,
                completionCount: 0
            }
        },
        {
            id: 'spring_festival_duelist',
            icon: 'fa-khanda',
            title: 'Spring Festival Duelist',
            description: 'Win 2 games in 1v1 mode',
            requirements: {
                count: 2,
                type: 'win_1v1'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 200 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                wins: 0,
                completionCount: 0
            }
        },
        {
            id: 'blossom_multikill',
            icon: 'fa-skull-crossbones',
            title: 'Blossom Reaper',
            description: 'Get 3 multikills in any game mode',
            requirements: {
                count: 3,
                type: 'multikills'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 190 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                multikills: 0,
                completionCount: 0
            }
        },
        {
            id: 'petal_collector',
            icon: 'fa-flag',
            title: 'Petal Collector',
            description: 'Participate in taking 6 objectives (towers, dragons, etc.)',
            requirements: {
                count: 6,
                type: 'objectives'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 180 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                objectives: 0,
                completionCount: 0
            }
        },
        {
            id: 'spring_master',
            icon: 'fa-crown',
            title: 'Spring Master',
            description: 'Complete 2 games with 8+ kills and 4 or fewer deaths',
            requirements: {
                count: 2,
                type: 'high_kda'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 220 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                games: 0,
                completionCount: 0
            }
        },
        {
            id: 'blossom_devotee',
            icon: 'fa-heart',
            title: 'Blossom Devotee',
            description: 'Play 4 games with the same champion',
            requirements: {
                count: 4,
                type: 'play_champion'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 175 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                champion: null,
                completionCount: 0
            }
        },
        {
            id: 'aram_blossoms',
            icon: 'fa-random',
            title: 'ARAM Blossoms',
            description: 'Win 3 games in ARAM mode',
            requirements: {
                count: 3,
                type: 'win_aram'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 195 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                wins: 0,
                completionCount: 0
            }
        }
    ]
};

// Quest progress tracking functions
export function calculateQuestProgress(quest, userStats) {
    // Get current progress from user stats based on quest type
    let currentProgress = 0;
    
    switch (quest.requirements.type) {
        case 'play':
            currentProgress = userStats?.gamesPlayed || 0;
            break;
        case 'win':
            currentProgress = userStats?.wins || 0;
            break;
        case 'win_streak':
            currentProgress = userStats?.currentStreak || 0;
            break;
        case 'win_1v1':
            currentProgress = userStats?.wins1v1 || 0;
            break;
        case 'win_aram':
            currentProgress = userStats?.winsARAM || 0;
            break;
        case 'damage':
            currentProgress = userStats?.totalDamage || 0;
            break;
        case 'multikills':
            currentProgress = userStats?.multikills || 0;
            break;
        case 'objectives':
            currentProgress = userStats?.objectives || 0;
            break;
        case 'high_kda':
            currentProgress = userStats?.highKDAGames || 0;
            break;
        case 'play_champion':
            // Check if the user is using the same champion as the quest requirement
            if (userStats?.lastPlayedChampion) {
                if (!quest.defaultData.champion) {
                    // First game with a champion, set it as the requirement
                    quest.defaultData.champion = userStats.lastPlayedChampion;
                    currentProgress = 1;
                } else if (userStats.lastPlayedChampion === quest.defaultData.champion) {
                    // Playing with the same champion
                    currentProgress = quest.defaultData.progress + 1;
                }
            }
            break;
        default:
            currentProgress = 0;
    }

    return {
        current: Math.min(currentProgress, quest.requirements.count),
        total: quest.requirements.count
    };
}

// Quest reward functions
export function getQuestRewards(quest) {
    return quest.rewards;
}

// Quest status check functions
export function checkQuestStatus(quest, progress) {
    if (progress.current >= progress.total) {
        return 'claim-ready';
    } else if (progress.current > 0) {
        return 'in-progress';
    }
    return 'not-started';
}

// Quest generation functions
export function generateDailyQuests(userLevel) {
    return questTemplates.daily;
}

export function generateSpecialQuests(userLevel, activeEvents) {
    // Always include all special quests since they're all repeatable
    return questTemplates.special;
}

// Function to update quest progress after a match
export async function updateQuestProgress(userId, matchData, database, ref, get, update) {
    try {
        // Get user's current quests
        const userQuestsRef = ref(database, `users/${userId}/quests`);
        const userQuestsSnapshot = await get(userQuestsRef);
        const userQuests = userQuestsSnapshot.val() || {};
        
        // Get all quest templates
        const allQuests = [...questTemplates.daily, ...questTemplates.special];
        
        // Prepare updates
        const updates = {};
        
        // Process each quest
        for (const quest of allQuests) {
            // Skip if quest is already claimed
            const questData = userQuests[quest.id] || JSON.parse(JSON.stringify(quest.defaultData));
            if (questData.claimed) continue;
            
            // Update progress based on match data
            let questUpdated = false;
            
            switch (quest.requirements.type) {
                case 'play':
                    questData.progress += 1;
                    questUpdated = true;
                    break;
                    
                case 'win':
                    if (matchData.result === 'Victory') {
                        questData.progress += 1;
                        questUpdated = true;
                    }
                    break;
                    
                case 'win_streak':
                    if (matchData.result === 'Victory') {
                        questData.streak = (questData.streak || 0) + 1;
                        questData.progress = questData.streak;
                    } else {
                        questData.streak = 0;
                        questData.progress = 0;
                    }
                    questUpdated = true;
                    break;
                    
                case 'win_1v1':
                    if (matchData.result === 'Victory' && matchData.gameMode === '1v1') {
                        questData.progress += 1;
                        questUpdated = true;
                    }
                    break;
                    
                case 'win_aram':
                    if (matchData.result === 'Victory' && matchData.gameMode === 'ARAM') {
                        questData.progress += 1;
                        questUpdated = true;
                    }
                    break;
                    
                case 'damage':
                    if (matchData.stats && matchData.stats.damage) {
                        questData.totalDamage = (questData.totalDamage || 0) + matchData.stats.damage;
                        questData.progress = Math.min(questData.totalDamage, quest.requirements.count);
                        questUpdated = true;
                    }
                    break;
                    
                case 'multikills':
                    if (matchData.stats && matchData.stats.multikills) {
                        questData.multikills = (questData.multikills || 0) + matchData.stats.multikills;
                        questData.progress = Math.min(questData.multikills, quest.requirements.count);
                        questUpdated = true;
                    }
                    break;
                    
                case 'objectives':
                    if (matchData.stats && matchData.stats.objectives) {
                        questData.objectives = (questData.objectives || 0) + matchData.stats.objectives;
                        questData.progress = Math.min(questData.objectives, quest.requirements.count);
                        questUpdated = true;
                    }
                    break;
                    
                case 'high_kda':
                    if (matchData.stats && 
                        matchData.stats.kills >= 8 && 
                        matchData.stats.deaths <= 4) {
                        questData.games = (questData.games || 0) + 1;
                        questData.progress = questData.games;
                        questUpdated = true;
                    }
                    break;
                    
                case 'play_champion':
                    if (matchData.character) {
                        if (!questData.champion) {
                            questData.champion = matchData.character;
                            questData.progress = 1;
                            questUpdated = true;
                        } else if (matchData.character === questData.champion) {
                            questData.progress += 1;
                            questUpdated = true;
                        }
                    }
                    break;
            }
            
            // Check if quest is completed
            if (questUpdated) {
                questData.completed = questData.progress >= quest.requirements.count;
                updates[`users/${userId}/quests/${quest.id}`] = questData;
            }
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
        }
        
        return true;
    } catch (error) {
        console.error('Error updating quest progress:', error);
        return false;
    }
} 