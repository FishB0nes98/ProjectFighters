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
        id: 'crisisInTheKingdom',
        title: "Crisis In the Kingdom",
        description: "Play as Jun, Ayane, Astaroth, Kabal, or Birdie",
        progress: 0,
        goal: 8,
        reward: { 'Icons/Regal_Julia': 1 },
        requirement: (userData, team) => {
            const characters = ['Jun', 'Ayane', 'Astaroth', 'Kabal', 'Birdie'];
            return team.some(player => characters.includes(player));
        },
        image: 'Icons/Profile/Regal_Julia.png',
        hoverText: 'Regal Julia Icon'
    },
    {
        id: 'play10DraftModeGames',
        title: "Bans have arrived",
        description: "Play 10 Draft Mode games",
        progress: 0,
        goal: 10,
        reward: { 'freelootbox/basicbox': 1 },
        requirement: (userData) => userData.draftModeGamesPlayed >= 10,
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
];

export { quests };