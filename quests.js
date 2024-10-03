const quests = [
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
        id: 'play50games',
        title: "Marathon Gamer",
        description: "Play 50 Draft Mode games",
        progress: 0,
        goal: 50,
        reward: { 'freelootbox/basicbox': 1 },
        requirement: (userData) => userData.gamesPlayed >= 50,
        image: 'res/img/basicbox.png',
        hoverText: 'Basic Lootbox'
    },
    {
        id: 'play50ARAMgames',
        title: "ARAM Enthusiast",
        description: "Play 50 ARAM games",
        progress: 0,
        goal: 50,
        reward: { 'currency/CM': 10000 },
        requirement: (userData) => userData.ARAMGamesPlayed >= 50,
        image: 'res/img/cm.png',
        hoverText: '10,000 CM'
    },
    {
        id: 'play50_1v1games',
        title: "1v1 Master",
        description: "Play 50 1v1 games",
        progress: 0,
        goal: 50,
        reward: { 'currency/FM': 2000 },
        requirement: (userData) => userData.oneVOneGamesPlayed >= 50,
        image: 'res/img/fm.png',
        hoverText: '2,000 FM'
    },
];

export { quests };