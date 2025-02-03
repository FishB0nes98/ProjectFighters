// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Quests',
        resetInterval: 'daily',
        maxActive: 3
    },
    special: {
        title: 'Special Quests',
        resetInterval: 'never',
        maxActive: 3
    }
};

// Sample quest templates
export const questTemplates = {
    daily: [
        {
            id: 'daily_games',
            icon: 'fa-gamepad',
            title: 'Daily Games',
            description: 'Play 2 games',
            requirements: {
                count: 2,
                type: 'play'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 50 }
            ],
            resetInterval: 64800000, // 18 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'love_day_character',
            icon: 'fa-heart',
            title: 'Love Day Special',
            description: 'Play a game as Christie, Morrigan or Elphelt',
            requirements: {
                count: 1,
                type: 'play_character',
                characters: ['Christie', 'Morrigan', 'Elphelt']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 50 }
            ],
            resetInterval: 64800000, // 18 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        }
    ],
    special: [
        {
            id: 'win_streak',
            icon: 'fa-fire',
            title: 'Win Streak',
            description: 'Win 2 games in a row',
            requirements: {
                count: 2,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 50 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                streak: 0
            }
        },
        {
            id: 'love_day_win',
            icon: 'fa-heart',
            title: 'Love Day Victory',
            description: 'Win a game as Morrigan, Elphelt, Christie, Kuma, Ibuki, Mega Man, Sophitia, Kagome or Alice',
            requirements: {
                count: 1,
                type: 'win_character',
                characters: ['Morrigan', 'Elphelt', 'Christie', 'Kuma', 'Ibuki', 'Mega Man', 'Sophitia', 'Kagome', 'Alice']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 25 },
                { type: 'championMoney', icon: 'res/img/cm.png', amount: 250 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false
            }
        },
        {
            id: 'bot_lane_games',
            icon: 'fa-users',
            title: 'Bot Lane Specialist',
            description: 'Play 10 games as ADC or Support',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['adc', 'support']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 75 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false
            }
        }
    ]
};

// Quest progress tracking functions
export function calculateQuestProgress(quest, userStats) {
    // This function will be implemented to calculate quest progress based on user stats
    // For now, return sample progress
    return {
        current: Math.floor(Math.random() * quest.requirements.count),
        total: quest.requirements.count
    };
}

// Quest reward functions
export function getQuestRewards(quest) {
    // This function will be implemented to get the rewards for a quest
    // For now, return the default rewards
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
    // This function will be implemented to generate daily quests based on user level
    // For now, return sample quests
    return questTemplates.daily;
}

export function generateSpecialQuests(userLevel, activeEvents) {
    // This function will be implemented to generate special quests based on active events
    // For now, return sample quests
    return questTemplates.special;
} 