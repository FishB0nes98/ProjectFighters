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
        id: 'win4gamesAgainstInfernalAttackVol2',
        title: "Infernal Attack vol.2",
        description: "Win 4 games against Scorpion, Raiden, Birdie, Julia, Astaroth, Ibuki",
        progress: 0,
        goal: 4,
        reward: { 'skins/Kagome': 1 },
        requirement: (userData, opponents) => {
            const characters = ['Scorpion', 'Raiden', 'Birdie', 'Julia', 'Astaroth', 'Ibuki'];
            return opponents.some(opponent => characters.includes(opponent));
        },
        image: 'Icons/Kagome.png',
        hoverText: 'Kagome Fighter Unlock'
    },
    {
        id: 'play1gameAsKuma',
        title: "The Bears Are Coming",
        description: "Play 1 game as Kuma",
        progress: 0,
        goal: 1,
        reward: { 'Icons/Panda': 1 },
        requirement: (userData, team) => {
            const characters = ['Kuma'];
            return team.some(player => characters.includes(player));
        },
        image: 'Icons/Profile/Panda.png',
        hoverText: 'Panda Icon'
    },
    {
        id: 'play10ARAMGames',
        title: "Introducing Rerolls",
        description: "Play 10 ARAM games",
        progress: 0,
        goal: 10,
        reward: { 'FM': 500 },
        requirement: (userData) => userData.aramGamesPlayed >= 10,
        image: 'res/img/FM.png',
        hoverText: '500 FM'
    },
];

export { quests };