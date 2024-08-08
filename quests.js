const quests = [
    {
        id: 'play3games',
        title: "Welcome to Quests",
        description: "Play 3 games",
        progress: 0,
        goal: 3,
        reward: { 'freelootbox/basicbox': 1 },
        requirement: (userData) => userData.gamesPlayed >= 3,
        image: 'res/img/basicbox.png', // Add image path
        hoverText: 'Basic Lootbox' // Add hover text
    },
    {
        id: 'winAsSpecificCharacter',
        title: "Pajama Party Invitation",
        description: "Win a game as Kokoro, Shoma, Blanka, Cham Cham, or Christie",
        progress: 0,
        goal: 1,
        reward: { 'freelootbox/pajamapartybox': 1 },
        requirement: (userData, team) => {
            const characters = ['Kokoro', 'Shoma', 'Blanka', 'Cham Cham', 'Christie'];
            return team.some(player => characters.includes(player));
        },
        image: 'res/img/pajamapartybox.png', // Add image path
        hoverText: 'Pajama Party Lootbox' // Add hover text
    },
    {
        id: 'play5gamesWithShizumaru',
        title: "NEW CHALLENGER!",
        description: "Play 5 games with Shizumaru",
        progress: 0,
        goal: 5,
        reward: { 'skins/Samurai Shizumaru': 1 },
        requirement: (userData, team) => {
            return team.includes('Shizumaru') && userData.gamesPlayedWithShizumaru >= 5;
        },
        image: 'Loading Screen/Samurai Shizumaru.png', // Add image path
        hoverText: 'Samurai Shizumaru Skin' // Add hover text
    }
];
export { quests };