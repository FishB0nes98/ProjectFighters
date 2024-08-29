const quests = [
    {
        id: 'play3games',
        title: "Welcome to Quests",
        description: "Play 3 games",
        progress: 0,
        goal: 3,
        reward: { 'freelootbox/basicbox': 1 },
        requirement: (userData) => userData.gamesPlayed >= 3,
        image: 'res/img/basicbox.png',
        hoverText: 'Basic Lootbox'
    },
    {
        id: 'showWhatYouThink',
        title: "Show What You Think",
        description: "Play 2 games",
        progress: 0,
        goal: 2,
        reward: { 'Stickers/ChamCham_V': 1 },
        requirement: (userData) => userData.gamesPlayed >= 2,
        image: 'Stickers/ChamCham_V.png',
        hoverText: 'ChamCham V Sticker'
    },
    {
        id: 'play2gamesAsShinnok',
        title: "Shinnok's Challenge",
        description: "Play 2 games as Shinnok",
        progress: 0,
        goal: 2,
        reward: { 'Icons/Rainy_Day_Shinnok': 1 },
        requirement: (userData, team) => {
            return team.some(player => player === 'Shinnok') && userData.gamesPlayed >= 2;
        },
        image: 'Icons/Profile/Rainy_Day_Shinnok.png',
        hoverText: 'Rainy Day Shinnok Icon'
    },
    {
        id: 'play50games',
        title: "Marathon Gamer",
        description: "Play 50 games",
        progress: 0,
        goal: 50,
        reward: { 'freelootbox/basicbox': 1 },
        requirement: (userData) => userData.gamesPlayed >= 50,
        image: 'res/img/basicbox.png',
        hoverText: 'Basic Lootbox'
    },
];

export { quests };