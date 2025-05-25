// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Monster Trainer Daily Quests',
        resetInterval: 64800000, // 18 hours in milliseconds
        maxActive: 3
    },
    special: {
        title: 'Monster Trainer Special Challenges',
        maxActive: 4
    }
};

// Monster Trainer themed quest templates
export const questTemplates = {
    daily: [
        {
            id: 'trainer_daily_expedition',
            icon: 'fa-map-signs',
            title: 'Daily Expedition',
            description: 'Explore the wild! Play 2 games.',
            requirements: {
                count: 2,
                type: 'play_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 100 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'trainer_daily_victory',
            icon: 'fa-trophy',
            title: "Trainer\'s Triumph",
            description: 'Achieve victory in 1 game.',
            requirements: {
                count: 1,
                type: 'win_games'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 150 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        },
        {
            id: 'monster_partner_up',
            icon: 'fa-dragon',
            title: 'Monster Partner Up!',
            description: 'Play 1 game using any Monster Trainer series skin.',
            requirements: {
                count: 1,
                type: 'play_character_theme_skin',
                skins: ['Monster Trainer Ayane', 'Monster Trainer Kokoro', 'Monster Trainer Shoma']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 120 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 200 }
            ],
            resetInterval: 64800000,
            defaultData: { progress: 0, completed: false, claimed: false, lastReset: null }
        }
    ],
    special: [
        {
            id: 'elemental_overload',
            icon: 'fa-fire-alt',
            title: 'Elemental Overload',
            description: "Unleash your monster\'s power! Land 10 abilities on opponents in a single game.",
            requirements: {
                count: 10,
                type: 'land_abilities_on_enemies_in_match'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 200 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 300 }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0 }
        },
        {
            id: 'trainers_resolve',
            icon: 'fa-shield-alt',
            title: "Trainer\'s Resolve",
            description: 'Show your resolve! Get 3 Kills or Assists as Monster Trainer Ayane.',
            requirements: {
                count: 3,
                type: 'kills_assists_as_character_skin',
                skin: 'Monster Trainer Ayane'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 250 },
                { type: 'sticker', name: 'ayane_trainer_badge', icon: 'Stickers/ayane_trainer_badge.png' }
            ],
            repeatable: true,
            defaultData: { progress: 0, completed: false, claimed: false, completionCount: 0 }
        },
        {
            id: 'world_class_trainers',
            icon: 'fa-globe-americas',
            title: 'World Class Trainers',
            description: 'Prove your skill! Win 5 games during the Monster Trainer Event.',
            requirements: {
                count: 5,
                type: 'win_games_event'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 400 },
                { type: 'title', name: 'Elite Trainer', icon: 'fa-id-badge' }
            ],
            repeatable: false,
            defaultData: { progress: 0, completed: false, claimed: false, winsDuringEvent: 0 }
        },
        {
            id: 'vitality_boost',
            icon: 'fa-plus-square',
            title: 'Vitality Boost',
            description: 'Support your team! Heal or Shield allies for 5000 health in total.',
            requirements: {
                count: 5000,
                type: 'heal_shield_allies_total'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 300 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 750 }
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

    const { result, kda, character: playedCharacter, skin: playedSkin, gameMode, abilitiesLandedOnEnemies, healingDoneToAllies, shieldingDoneToAllies } = matchData;
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
                case 'win_games_event':
                    if (isWin) {
                        questData.progress = (questData.progress || 0) + 1;
                         if (template.id === 'world_class_trainers') {
                            questData.winsDuringEvent = (questData.winsDuringEvent || 0) + 1;
                            questData.progress = questData.winsDuringEvent;
                         }
                         progressMade = true;
                    }
                    break;

                case 'play_character_theme_skin':
                    if (template.requirements.skins && template.requirements.skins.includes(playedSkin)) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
                    }
                    break;

                case 'land_abilities_on_enemies_in_match':
                    if ((abilitiesLandedOnEnemies || 0) >= template.requirements.count) {
                        questData.progress = template.requirements.count;
                        progressMade = true;
                    } else {
                        if (template.repeatable) questData.progress = 0;
                    }
                    break;

                case 'kills_assists_as_character_skin':
                    if (playedSkin === template.requirements.skin) {
                        const kAThisMatch = kills + assists;
                        if (kAThisMatch > 0) {
                            questData.progress = (questData.progress || 0) + kAThisMatch;
                            progressMade = true;
                        }
                    }
                    break;
                
                case 'heal_shield_allies_total':
                    const healingShieldingDoneThisMatch = (healingDoneToAllies || 0) + (shieldingDoneToAllies || 0);
                    if (healingShieldingDoneThisMatch > 0) {
                        questData.progress = (questData.progress || 0) + healingShieldingDoneThisMatch;
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

                case 'high_kda':
                    if (kills >= (template.requirements.minKills || 0) && calculatedKda >= (template.requirements.kdaThreshold || 0)) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
                    }
                    break;

                case 'play_character_theme':
                    if (template.requirements.characters && template.requirements.characters.includes(playedCharacter)) {
                        questData.progress = (questData.progress || 0) + 1;
                        progressMade = true;
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