// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Desert Wars Quests',
        resetInterval: 64800000, // 18 hours in milliseconds
        maxActive: 3
    },
    special: {
        title: 'Desert Wars Challenges',
        maxActive: 6
    }
};

// Desert Wars themed quest templates
export const questTemplates = {
    daily: [
        {
            id: 'desert_daily_games',
            icon: 'fa-play',
            title: 'Desert Patrol',
            description: 'Play 2 games (any mode).',
            requirements: {
                count: 2,
                type: 'play_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 100 }
            ],
            resetInterval: 64800000, // 18 hours
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'desert_daily_wins',
            icon: 'fa-trophy',
            title: 'Oasis Victory',
            description: 'Win 1 game (any mode).',
            requirements: {
                count: 1,
                type: 'win_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 150 }
            ],
            resetInterval: 64800000, // 18 hours
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'dune_skirmisher',
            icon: 'fa-crosshairs',
            title: 'Dune Skirmisher',
            description: 'Get 10 Kills or Assists across any games today.',
            requirements: {
                count: 10,
                type: 'kills_assists'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 120 }
            ],
            resetInterval: 64800000, // 18 hours
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null, totalKillsAssists: 0 }
        }
    ],
    special: [
        {
            id: 'sandstorm_victor',
            icon: 'fa-wind',
            title: 'Sandstorm Victor',
            description: 'Win 3 games in a row (any mode).',
            requirements: {
                count: 3,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 250 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 500 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, streak: 0, completionCount: 0 }
        },
        {
            id: 'nomads_trial',
            icon: 'fa-hiking',
            title: 'Nomad\'s Trial',
            description: 'Play 5 games using Desert characters (Talim, Shizumaru, Scorpion).',
            requirements: {
                count: 5,
                type: 'play_character_theme',
                characters: ['Talim', 'Shizumaru', 'Scorpion']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 300 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, gamesWithTheme: 0, completionCount: 0 }
        },
        {
            id: 'treasure_hunter',
            icon: 'fa-gem',
            title: 'Treasure Hunter',
            description: 'Achieve a KDA of 4.0 or higher in a single game (min 3 kills, any mode).',
            requirements: {
                count: 1,
                type: 'high_kda',
                minKills: 3,
                kdaThreshold: 4.0
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 200 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, gamesWithHighKDA: 0, completionCount: 0 }
        },
        {
            id: 'conqueror_of_sands',
            icon: 'fa-crown',
            title: 'Conqueror of Sands',
            description: 'Win 10 games during the Desert Wars event (any mode).',
            requirements: {
                count: 10,
                type: 'win_games_event'
            },
            rewards: [
                { type: 'title', name: 'Desert Conqueror', icon: 'fa-id-badge' },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 1000 }
            ],
            repeatable: false,
            defaultData: { progress: 0, completed: false, claimed: false, winsDuringEvent: 0 }
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
    if (!userId || !matchData) {
        console.error("Missing userId or matchData for quest update.");
        return;
    }

    console.log('Updating quest progress for user:', userId, 'with matchData:', matchData);

    const userQuestsRef = ref(database, `users/${userId}/quests`);
    const userQuestsSnap = await get(userQuestsRef);
    const userQuests = userQuestsSnap.val() || {};
    const currentTime = Date.now();
    const updates = {};

    const { result, kda, character: playedCharacter, gameMode } = matchData;
    const isWin = result === 'Victory';
    const kills = kda?.kills ?? 0;
    const deaths = kda?.deaths ?? 0;
    const assists = kda?.assists ?? 0;
    const calculatedKda = deaths === 0 ? (kills + assists) : (kills + assists) / deaths;

    // Helper to get quest template by ID
    const getTemplate = (questId) => {
        for (const type in questTemplates) {
            const template = questTemplates[type].find(q => q.id === questId);
            if (template) return template;
        }
        return null;
    };

    // Iterate through all defined quest templates to update corresponding user quests
    for (const type in questTemplates) {
        for (const template of questTemplates[type]) {
            const questId = template.id;
            const questRef = ref(database, `users/${userId}/quests/${questId}`);
            let questData = userQuests[questId] || { ...template.defaultData }; // Get current data or use default

            console.log(`Processing quest: ${questId}`, questData);

            // --- Reset Logic ---
            let needsReset = false;
            if (template.resetInterval) {
                const timeSinceReset = currentTime - (questData.lastReset || 0);
                if (timeSinceReset >= template.resetInterval) {
                    console.log(`Quest ${questId} needs daily reset.`);
                    needsReset = true;
                }
            }
            if (template.repeatable && questData.claimed) {
                 console.log(`Quest ${questId} needs reset after claim (repeatable).`);
                 needsReset = true;
                 questData.completionCount = (questData.completionCount || 0) + 1; // Increment completion count for repeatable quests
            }

            if (needsReset) {
                // Reset quest data, keeping completionCount if repeatable
                const completionCount = questData.completionCount;
                questData = { ...template.defaultData, lastReset: currentTime };
                 if (template.repeatable) {
                     questData.completionCount = completionCount;
                 }
            }

            // Skip already claimed non-repeatable quests
            if (!template.repeatable && questData.claimed) {
                 console.log(`Skipping ${questId}: Non-repeatable and claimed.`);
                 continue;
            }

            // Skip already completed quests (unless it was just reset)
            if (questData.completed && !needsReset) {
                 console.log(`Skipping ${questId}: Already completed.`);
                 continue;
            }

            // --- Progress Update Logic ---
            let progressMade = false;

            switch (template.requirements.type) {
                case 'play_games':
                    questData.progress = (questData.progress || 0) + 1;
                    progressMade = true;
                    break;

                case 'win_games':
                case 'win_games_event': // Handles event wins too
                    if (isWin) {
                        questData.progress = (questData.progress || 0) + 1;
                         // Specific tracking for event quest
                         if (template.id === 'conqueror_of_sands') {
                            questData.winsDuringEvent = (questData.winsDuringEvent || 0) + 1;
                            questData.progress = questData.winsDuringEvent;
                         }
                         progressMade = true;
                    }
                    break;

                case 'kills_assists':
                    const currentKillsAssists = kills + assists;
                    questData.totalKillsAssists = (questData.totalKillsAssists || 0) + currentKillsAssists;
                    questData.progress = questData.totalKillsAssists;
                    progressMade = currentKillsAssists > 0;
                    break;

                case 'win_streak':
                    if (isWin) {
                        questData.streak = (questData.streak || 0) + 1;
                    } else {
                        questData.streak = 0; // Reset streak on loss
                    }
                    questData.progress = questData.streak;
                    progressMade = true; // Progress updates even on loss (streak reset)
                    break;

                case 'play_character_theme':
                    if (template.requirements.characters.includes(playedCharacter)) {
                        questData.gamesWithTheme = (questData.gamesWithTheme || 0) + 1;
                        questData.progress = questData.gamesWithTheme;
                        progressMade = true;
                    }
                    break;

                case 'high_kda':
                    if (kills >= template.requirements.minKills && calculatedKda >= template.requirements.kdaThreshold) {
                        questData.gamesWithHighKDA = (questData.gamesWithHighKDA || 0) + 1;
                        questData.progress = questData.gamesWithHighKDA;
                        progressMade = true;
                    }
                    break;

                // Add cases for other quest types if needed (e.g., damage, healing)
                // case 'damage':
                //     questData.totalDamage = (questData.totalDamage || 0) + (matchData.damageDealt || 0);
                //     questData.progress = questData.totalDamage;
                //     progressMade = (matchData.damageDealt || 0) > 0;
                //     break;

                default:
                    console.warn(`Unknown quest requirement type: ${template.requirements.type} for quest ${questId}`);
            }

            // --- Completion Check ---
            if (progressMade && !questData.completed) {
                questData.completed = (questData.progress || 0) >= template.requirements.count;
                console.log(`Quest ${questId} progress: ${questData.progress}/${template.requirements.count}, Completed: ${questData.completed}`);
            }

            // Add updated quest data to the updates object
             updates[`users/${userId}/quests/${questId}`] = questData;
        }
    }

    // Apply all updates to Firebase
    if (Object.keys(updates).length > 0) {
        try {
            await update(ref(database), updates);
            console.log('Quest progress updated successfully in Firebase:', updates);
        } catch (error) {
            console.error('Error updating quest progress in Firebase:', error);
        }
    } else {
        console.log('No quest progress updates to apply.');
    }
} 