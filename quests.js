const quests = [
  {
    id: 'play15Games',
    title: "Seasoned Farmer",
    description: "Play 15 games",
    progress: 0,
    goal: 15,
    reward: { 'lootbox/FreeLootbox': 1 },
    requirement: (userData) => {
      const totalGames = Object.values(userData.characterGamesPlayed || {}).reduce((sum, games) => sum + games, 0);
      return totalGames >= 15;
    },
    image: 'res/img/basicbox.png',
    hoverText: 'Free Lootbox'
  },
  {
    id: 'playSteampunkChampions',
    title: "Steam-Powered Warriors",
    description: "Play 5 games as Nina, Yugo, MegaMan, Kabal or Ibuki",
    progress: 0,
    goal: 5,
    reward: { CM: 4000 },
    requirement: (userData) => {
      const steampunkChampions = ['Nina', 'Yugo', 'Mega Man', 'Kabal', 'Ibuki'];
      const totalGames = steampunkChampions.reduce((sum, champion) => {
        return sum + (userData.characterGamesPlayed?.[champion] || 0);
      }, 0);
      return totalGames >= 5;
    },
    image: 'res/img/cm.png',
    hoverText: '4000 CM'
  },
  {
    id: 'playEnchanterGames',
    title: "Arcane Engineering",
    description: "Play 3 games as an Enchanter champion",
    progress: 0,
    goal: 3,
    reward: { 'lootbox/FreeLootbox': 1 },
    requirement: (userData) => {
      // Get all enchanters from roles data
      const enchanters = Object.keys(roles).reduce((acc, role) => {
        if (role === 'Support') {
          return [...acc, ...roles[role].filter(champion => {
            const championRoles = Roles[champion]?.toLowerCase() || '';
            return championRoles.includes('enchanter');
          })];
        }
        return acc;
      }, []);

      // Count games played with enchanter champions
      const totalEnchanterGames = enchanters.reduce((sum, champion) => {
        return sum + (userData.characterGamesPlayed?.[champion] || 0);
      }, 0);

      return totalEnchanterGames >= 3;
    },
    image: 'res/img/basicbox.png',
    hoverText: 'Free Lootbox'
  }
];

export { quests };