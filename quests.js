// Quest Types and their configurations
export const questTypes = {
    daily: {
        title: 'Daily Quests',
        resetInterval: 64800000, // 18 hours in milliseconds
        maxActive: 2
    },
    special: {
        title: 'Special Quests',
        maxActive: 5
    }
};

// Sample quest templates
export const questTemplates = {
    daily: [
        {
            id: 'gang_warfare',
            icon: 'fa-fist-raised',
            title: 'Gang Warfare',
            description: 'Play 3 games',
            requirements: {
                count: 3,
                type: 'play'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 100 }
            ],
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                lastReset: null
            }
        },
        {
            id: 'territory_control',
            icon: 'fa-fire',
            title: 'Territory Control',
            description: 'Deal 15,000 damage to enemy champions',
            requirements: {
                count: 15000,
                type: 'damage'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 100 }
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
            id: 'street_enforcer',
            icon: 'fa-trophy',
            title: 'Street Enforcer',
            description: 'Win 3 games in a row',
            requirements: {
                count: 3,
                type: 'win_streak'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 30 }
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
            id: 'gang_hitman',
            icon: 'fa-skull-crossbones',
            title: 'Gang Hitman',
            description: 'Get 2 multikills in games',
            requirements: {
                count: 2,
                type: 'multikills'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 25 }
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
            id: 'turf_war',
            icon: 'fa-flag',
            title: 'Turf War',
            description: 'Participate in taking 8 objectives (towers, dragons, etc.)',
            requirements: {
                count: 8,
                type: 'objectives'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
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
            id: 'gang_domination',
            icon: 'fa-crown',
            title: 'Gang Domination',
            description: 'Complete 2 games with 8+ kills and 4 or fewer deaths',
            requirements: {
                count: 2,
                type: 'high_kda'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 40 }
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
            id: 'gang_loyalty',
            icon: 'fa-star',
            title: 'Gang Loyalty',
            description: 'Play 4 games with the same champion',
            requirements: {
                count: 4,
                type: 'play_champion'
            },
            rewards: [
                { type: 'questPoints', icon: 'res/img/qp.png', amount: 35 }
            ],
            repeatable: true,
            defaultData: {
                progress: 0,
                completed: false,
                claimed: false,
                champion: null,
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
    // Filter out completed non-repeatable quests
    const availableQuests = questTemplates.special.filter(quest => {
        // If quest is repeatable, always include it
        if (quest.repeatable) return true;
        
        // For non-repeatable quests, only include if not completed
        const questData = getUserQuestData(quest.id); // You'll need to implement this function
        return !questData || !questData.completed;
    });
    
    return availableQuests;
} 