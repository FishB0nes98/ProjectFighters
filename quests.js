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
        id: 'play10gamesAsForestCharacters',
        title: "Secrets of the Forest",
        description: "Play 10 games as Angel, Julia, Astaroth, Kotal Kahn, Morrigan, or Talim",
        progress: 0,
        goal: 10,
        reward: { 'CM': 4500 },
        requirement: (userData, team) => {
            const characters = ['Angel', 'Julia', 'Astaroth', 'Kotal Kahn', 'Morrigan', 'Talim'];
            return team.some(player => characters.includes(player));
        },
        image: 'res/img/cm.png',
        hoverText: '4500 CM'
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
        id: 'play10gamesArcadeEvent',
        title: "Arcade Legends",
        description: "Play 10 games as Raiden, Sophitia, Sub Zero, Christie, or Noel",
        progress: 0,
        goal: 10,
        reward: { 'Icons/Arcade_Sub_Zero': 1 },
        requirement: (userData, team) => {
            const characters = ['Raiden', 'Sophitia', 'Sub Zero', 'Christie', 'Noel'];
            return team.some(player => characters.includes(player));
        },
        image: 'Icons/Profile/Arcade_Sub_Zero.png',
        hoverText: 'Arcade Sub Zero Icon'
    },
    {
        id: 'play10_1vs1_games',
        title: "1vs1 Challenger",
        description: "Play 10 1vs1 games",
        progress: 0,
        goal: 10,
        reward: { 'FM': 500 },
        requirement: (userData) => userData.oneVsOneGamesPlayed >= 10,
        image: 'res/img/FM.png',
        hoverText: '500 FM'
    },
];

export { quests };