// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Quests',
        resetInterval: 'daily',
        maxActive: 3
    },
    special: {
        title: 'Special Quests',
        resetInterval: null,
        maxActive: 5
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
            id: 'combat_prowess',
            icon: 'fa-fist-raised',
            title: 'Combat Prowess',
            description: 'Deal 10,000 damage to enemy champions',
            requirements: {
                count: 10000,
                type: 'damage'
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
                totalDamage: 0
            }
        },
        {
            id: 'team_player',
            icon: 'fa-users',
            title: 'Team Player',
            description: 'Get 15 assists in games',
            requirements: {
                count: 15,
                type: 'assists'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 55 }
            ],
            resetInterval: 68400000, // 19 hours in milliseconds
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null,
                totalAssists: 0
            }
        }
    ],
    special: [
        {
            id: 'win_streak',
            icon: 'fa-trophy',
            title: 'Win Streak',
            description: 'Win 2 games in a row',
            requirements: {
                count: 2,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 75 }
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
            id: 'battleborn_champion',
            icon: 'fa-crown',
            title: 'Battleborn Champion',
            description: 'Win 50 SoloQ games',
            requirements: {
                count: 50,
                type: 'soloq_wins'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 200 },
                { type: 'skin', icon: 'fa-user', name: 'Battleborn Talim' }
            ],
            repeatable: false,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                wins: 0
            }
        },
        {
            id: 'champion_mastery',
            icon: 'fa-star',
            title: 'Champion Mastery',
            description: 'Play 5 games with the same champion',
            requirements: {
                count: 5,
                type: 'play_champion'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 80 }
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
            id: 'multikill_hunter',
            icon: 'fa-skull-crossbones',
            title: 'Multikill Hunter',
            description: 'Get 3 multikills in games',
            requirements: {
                count: 3,
                type: 'multikills'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 90 }
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
            id: 'objective_taker',
            icon: 'fa-flag',
            title: 'Objective Taker',
            description: 'Participate in taking 10 objectives (towers, dragons, etc.)',
            requirements: {
                count: 10,
                type: 'objectives'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 85 }
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
            id: 'survival_expert',
            icon: 'fa-shield-alt',
            title: 'Survival Expert',
            description: 'Complete 3 games with 3 or fewer deaths',
            requirements: {
                count: 3,
                type: 'low_deaths'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 70 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                games: 0,
                completionCount: 0
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