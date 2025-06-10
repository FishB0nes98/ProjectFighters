// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Rebellious Daily Challenges',
        resetInterval: 64800000, // 18 hours in milliseconds
        maxActive: 3
    },
    special: {
        title: 'Rebellious Special Missions',
        maxActive: 6
    }
};

// Rebellious themed quest templates
export const questTemplates = {
    daily: [
        {
            id: 'daily_street_fights',
            icon: 'fa-fist-raised',
            title: 'Daily Street Fights',
            description: 'Hit the streets! Play 2 games to prove your rebellious spirit.',
            requirements: {
                count: 2,
                type: 'play_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 120 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'daily_rebel_victory',
            icon: 'fa-fire',
            title: 'Rebel Victory',
            description: 'Show them who\'s boss! Win 1 game today.',
            requirements: {
                count: 1,
                type: 'win_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 150 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 200 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'daily_rebel_style',
            icon: 'fa-tshirt',
            title: 'Rebel Style',
            description: 'Represent the rebellion! Play 1 game using any Rebellious series skin.',
            requirements: {
                count: 1,
                type: 'play_character_theme_skin',
                skins: ['Rebellious Ayane', 'Rebellious Anna', 'Rebellious Kabal', 'Rebellious Christie', 'Rebellious Ibuki', 'Rebellious FANG', 'Rebellious Mega Man']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 100 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 300 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        }
    ],
    special: [
        // Rebellious Skin Quests (dynamically created based on user's free song choice)
        {
            id: 'rebellious_ayane_quest',
            icon: 'fa-fire',
            title: 'Rebellious Spirit: Ayane',
            description: 'Prove your rebellious nature! Win 50 Ranked games to unlock the Rebellious Ayane skin.',
            requirements: {
                count: 50,
                type: 'win_ranked_games'
            },
            rewards: [
                { type: 'skin', name: 'Rebellious Ayane', icon: 'fa-tshirt' }
            ],
            repeatable: false,
            hidden: true, // Only visible if user chose Ayane's song
            defaultData: { progress: 0, completed: false, claimed: false, targetSkin: 'Rebellious Ayane', character: 'Ayane' }
        },
        {
            id: 'rebellious_anna_quest',
            icon: 'fa-fire',
            title: 'Rebellious Spirit: Anna',
            description: 'Prove your rebellious nature! Win 50 Ranked games to unlock the Rebellious Anna skin.',
            requirements: {
                count: 50,
                type: 'win_ranked_games'
            },
            rewards: [
                { type: 'skin', name: 'Rebellious Anna', icon: 'fa-tshirt' }
            ],
            repeatable: false,
            hidden: true, // Only visible if user chose Anna's song
            defaultData: { progress: 0, completed: false, claimed: false, targetSkin: 'Rebellious Anna', character: 'Anna' }
        },
        {
            id: 'rebellious_kabal_quest',
            icon: 'fa-fire',
            title: 'Rebellious Spirit: Kabal',
            description: 'Prove your rebellious nature! Win 50 Ranked games to unlock the Rebellious Kabal skin.',
            requirements: {
                count: 50,
                type: 'win_ranked_games'
            },
            rewards: [
                { type: 'skin', name: 'Rebellious Kabal', icon: 'fa-tshirt' }
            ],
            repeatable: false,
            hidden: true, // Only visible if user chose Kabal's song
            defaultData: { progress: 0, completed: false, claimed: false, targetSkin: 'Rebellious Kabal', character: 'Kabal' }
        },
        // Basic Rebellious Quests
        {
            id: 'rebel_uprising',
            icon: 'fa-fist-raised',
            title: 'Rebel Uprising',
            description: 'Join the rebellion! Play 5 games using any Rebellious series skin.',
            requirements: {
                count: 5,
                type: 'play_character_theme_skin',
                skins: ['Rebellious Ayane', 'Rebellious Anna', 'Rebellious Kabal', 'Rebellious Christie', 'Rebellious Ibuki', 'Rebellious FANG', 'Rebellious Mega Man']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 300 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 500 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0 }
        },
        {
            id: 'street_fighter',
            icon: 'fa-fire-alt',
            title: 'Street Fighter',
            description: 'Show your rebellious spirit! Win 5 games in a row.',
            requirements: {
                count: 5,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 400 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 700 },
                { type: 'title', name: 'Street Fighter', icon: 'fa-id-badge' }
            ],
            repeatable: false,
            defaultData: { progress: 0, completed: false, claimed: false, currentStreak: 0 }
        },
        {
            id: 'rebel_domination',
            icon: 'fa-crown',
            title: 'Rebel Domination',
            description: 'Dominate the battlefield! Get 15 kills or assists in a single game.',
            requirements: {
                count: 15,
                type: 'kills_assists_in_match'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 350 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 600 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0 }
        },
        {
            id: 'underground_champion',
            icon: 'fa-trophy',
            title: 'Underground Champion',
            description: 'Prove yourself in the underground! Win 20 ranked games.',
            requirements: {
                count: 20,
                type: 'win_ranked_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 600 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 1200 },
                { type: 'title', name: 'Underground Champion', icon: 'fa-id-badge' }
            ],
            repeatable: false,
            defaultData: { progress: 0, completed: false, claimed: false }
        },
        {
            id: 'rebel_loyalty',
            icon: 'fa-heart',
            title: 'Rebel Loyalty',
            description: 'Stay loyal to the cause! Play 10 games with the same Rebellious character.',
            requirements: {
                count: 10,
                type: 'play_same_rebellious_character',
                characters: ['Ayane', 'Anna', 'Kabal', 'Christie', 'Ibuki', 'FANG', 'Mega Man']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 500 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 900 },
                { type: 'sticker', name: 'rebel_loyalty_badge', icon: 'Stickers/rebel_loyalty_badge.png' }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0, chosenCharacter: null }
        },
        {
            id: 'midnight_rebellion',
            icon: 'fa-moon',
            title: 'Midnight Rebellion',
            description: 'The rebellion never sleeps! Play 25 games total.',
            requirements: {
                count: 25,
                type: 'play_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 400 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 800 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0 }
        }
    ]
};

// Quest progress tracking functions
export function calculateQuestProgress(quest, userStats) {
    // Get current progress from user stats based on quest type
    let currentProgress = 0;
    
    switch (quest.requirements.type) {
        case 'play_games':
            currentProgress = userStats?.gamesPlayed || 0;
            break;
        case 'win_games':
            currentProgress = userStats?.wins || 0;
            break;
        case 'win_streak':
            currentProgress = userStats?.currentStreak || 0;
            break;
        case 'win_ranked_games':
            currentProgress = userStats?.rankedWins || 0;
            break;
        case 'play_character_theme_skin':
            // Check if user is playing with any of the required skins
            if (userStats?.lastPlayedSkin && quest.requirements.skins?.includes(userStats.lastPlayedSkin)) {
                currentProgress = quest.defaultData.progress + 1;
            }
            break;
        case 'kills_assists_in_match':
            // This should be tracked per match, not cumulative
            currentProgress = userStats?.lastMatchKillsAssists || 0;
            break;
        case 'play_same_rebellious_character':
            // Track playing the same rebellious character multiple times
            if (userStats?.lastPlayedCharacter && quest.requirements.characters?.includes(userStats.lastPlayedCharacter)) {
                if (!quest.defaultData.chosenCharacter) {
                    // First time playing a rebellious character, set it as the chosen one
                    quest.defaultData.chosenCharacter = userStats.lastPlayedCharacter;
                    currentProgress = 1;
                } else if (userStats.lastPlayedCharacter === quest.defaultData.chosenCharacter) {
                    // Playing with the same chosen character
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
    // Always include all special quests
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

    const { result, kda, character: playedCharacter, skin: playedSkin, gameMode } = matchData;
    const isWin = result === 'Victory';
    const kills = kda?.kills ?? 0;
    const deaths = kda?.deaths ?? 0;
    const assists = kda?.assists ?? 0;
    const isRanked = gameMode === 'SoloQ' || gameMode === '1v1';

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
            let questData = userQuests[questId] || { ...template.defaultData };

            console.log(`Processing quest: ${questId}`, questData);

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
                 questData.completionCount = (questData.completionCount || 0) + 1;
            }

            if (needsReset) {
                const completionCount = questData.completionCount;
                questData = { ...template.defaultData, lastReset: currentTime };
                 if (template.repeatable) {
                     questData.completionCount = completionCount;
                 }
            }

            if (!template.repeatable && questData.claimed) {
                 console.log(`Skipping ${questId}: Non-repeatable and claimed.`);
                 updates[`users/${userId}/quests/${questId}`] = questData;
                 continue;
            }

            if (questData.completed && !needsReset) {
                 console.log(`Skipping ${questId}: Already completed.`);
                 updates[`users/${userId}/quests/${questId}`] = questData;
                 continue;
            }

            let progressMade = false;

            switch (template.requirements.type) {
                case 'play_games':
                    questData.progress = (questData.progress || 0) + 1;
                    progressMade = true;
                    break;

                case 'win_games':
                    if (isWin) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
                    }
                    break;

                case 'win_ranked_games':
                    if (isWin && isRanked) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
                    }
                    break;

                case 'play_character_theme_skin':
                    if (template.requirements.skins && template.requirements.skins.includes(playedSkin)) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
                    }
                    break;

                case 'win_streak':
                    if (isWin) {
                        questData.streak = (questData.streak || 0) + 1;
                    } else {
                        questData.streak = 0;
                    }
                    questData.progress = questData.streak;
                    progressMade = true;
                    break;

                case 'kills_assists_in_match':
                    const kAThisMatch = kills + assists;
                    if (kAThisMatch >= template.requirements.count) {
                        questData.progress = template.requirements.count;
                        progressMade = true;
                    } else {
                        if (template.repeatable) questData.progress = 0;
                    }
                    break;

                case 'play_same_rebellious_character':
                    if (template.requirements.characters && template.requirements.characters.includes(playedCharacter)) {
                        if (!questData.chosenCharacter) {
                            // First time playing a rebellious character, set it as the chosen one
                            questData.chosenCharacter = playedCharacter;
                            questData.progress = 1;
                            progressMade = true;
                        } else if (playedCharacter === questData.chosenCharacter) {
                            // Playing with the same chosen character
                            questData.progress = (questData.progress || 0) + 1;
                            progressMade = true;
                        }
                    }
                    break;

                default:
                    break;
            }

            if (progressMade && !questData.completed) {
                questData.completed = (questData.progress || 0) >= template.requirements.count;
                console.log(`Quest ${questId} progress: ${questData.progress}/${template.requirements.count}, Completed: ${questData.completed}`);
            }
            
            updates[`users/${userId}/quests/${questId}`] = questData;
        }
    }

    if (Object.keys(updates).length > 0) {
        try {
            await update(ref(database), updates);
            console.log('Quest progress updated successfully in Firebase:', updates);
        } catch (error) {
            console.error('Error updating quest progress in Firebase:', error);
        }
    } else {
        console.log('No quest progress updates to apply for this match.');
    }
} 