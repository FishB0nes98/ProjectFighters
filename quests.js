const quests = [
  {
    id: 'play5GamesShomaRaiden',
    title: "Harvest Mastery: Shoma or Raiden",
    description: "Play 5 games as Shoma or Raiden",
    progress: 0,
    goal: 5,
    reward: { CM: 2000 },
    requirement: (userData) => {
      const eligibleCharacters = ['Shoma', 'Raiden'];
      return eligibleCharacters.some(character => userData.characterGamesPlayed && userData.characterGamesPlayed[character] >= 5);
    },
    image: 'res/img/CM.png',
    hoverText: '2000 CM'
  },
  {
    id: 'play5GamesAliceNina',
    title: "Crop Cultivation: Alice or Nina",
    description: "Play 5 games as Alice or Nina",
    progress: 0,
    goal: 5,
    reward: { CM: 2000 },
    requirement: (userData) => {
      const eligibleCharacters = ['Alice', 'Nina'];
      return eligibleCharacters.some(character => userData.characterGamesPlayed && userData.characterGamesPlayed[character] >= 5);
    },
    image: 'res/img/CM.png',
    hoverText: '2000 CM'
  },
  {
    id: 'play5GamesChamChamFANG',
    title: "Field Tilling: Cham Cham or FANG",
    description: "Play 5 games as Cham Cham or FANG",
    progress: 0,
    goal: 5,
    reward: { CM: 2000 },
    requirement: (userData) => {
      const eligibleCharacters = ['Cham Cham', 'FANG'];
      return eligibleCharacters.some(character => userData.characterGamesPlayed && userData.characterGamesPlayed[character] >= 5);
    },
    image: 'res/img/CM.png',
    hoverText: '2000 CM'
  },
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
  }
];

export { quests };