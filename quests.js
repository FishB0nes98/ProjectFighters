// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Quests',
        resetInterval: 'daily',
        maxActive: 3
    },
    special: {
        title: 'Special Quests',
        resetInterval: 'daily',
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
            id: 'celestial_kills',
            icon: 'fa-skull',
            title: 'Celestial Slayer',
            description: 'Get 50 kills in total',
            requirements: {
                count: 50,
                type: 'kills'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 60 }
            ],
            resetInterval: 68400000, // 19 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null,
                totalKills: 0
            }
        }
    ],
    special: [
        {
            id: 'top_lane_games',
            icon: 'fa-chevron-up',
            title: 'Top Lane Mastery',
            description: 'Play 10 games as Top',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['top']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            resetInterval: 72000000, // 20 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'jungle_games',
            icon: 'fa-tree',
            title: 'Jungle Mastery',
            description: 'Play 10 games as Jungle',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['jungle']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            resetInterval: 72000000, // 20 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'mid_lane_games',
            icon: 'fa-star',
            title: 'Mid Lane Mastery',
            description: 'Play 10 games as Mid',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['mid']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            resetInterval: 72000000, // 20 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'adc_games',
            icon: 'fa-crosshairs',
            title: 'ADC Mastery',
            description: 'Play 10 games as ADC',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['adc']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            resetInterval: 72000000, // 20 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'support_games',
            icon: 'fa-heart',
            title: 'Support Mastery',
            description: 'Play 10 games as Support',
            requirements: {
                count: 10,
                type: 'play_role',
                roles: ['support']
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            resetInterval: 72000000, // 20 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
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