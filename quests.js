const quests = [
  // New Halloween-Themed Quests
    {
      id: 'play5GamesHalloween',
      title: "Halloween Gamer",
      description: "Play 5 games",
      progress: 0,
      goal: 5,
      reward: { 'currency/CM': 5000 },
      requirement: (userData) => userData.gamesPlayed >= 5,
      image: 'res/img/cm.png', // Assuming CM image
      hoverText: '5,000 CM'
    },
    {
      id: 'play10SpecificCharactersGames',
      title: "Master of Blanka, Ayane, Julia, Erron Black, or Astaroth",
      description: "Play 10 games as Blanka, Ayane, Julia, Erron Black, or Astaroth",
      progress: 0,
      goal: 10,
      reward: { 'lootbox/HalloweenLootbox': 1 },
      requirement: (userData) => {
        const specificCharacters = ['Blanka', 'Ayane', 'Julia', 'Erron Black', 'Astaroth'];
        // Sum the games played as each specific character
        return specificCharacters.reduce((sum, char) => sum + (userData[`gamesPlayedAs${char.replace(' ', '')}`] || 0), 0) >= 10;
      },
      image: 'res/img/Halloweenbox.png', // Ensure this image exists
      hoverText: 'Halloween Lootbox'
    },
    {
      id: 'win5ARAMGames',
      title: "ARAM Victor",
      description: "Win 5 ARAM games",
      progress: 0,
      goal: 5,
      reward: { 'Stickers/Jackolantern': 1 },
      requirement: (userData) => userData.ARAMGamesWon >= 5,
      image: 'Stickers/jackolantern.png', // Ensure this image exists
      hoverText: 'Jackolantern Sticker'
    },
    {
      id: 'win50_1v1Games',
      title: "1v1 Legend",
      description: "Win 50 1v1 games",
      progress: 0,
      goal: 50,
      reward: { 'currency/FM': 2000 },
      requirement: (userData) => userData.oneVOneGamesWon >= 50,
      image: 'res/img/fm.png',
      hoverText: '2,000 FM'
    },
  {
    id: 'win10Gamescookin',
    title: "What's cookin'?",
    description: "Win 10 games",
    progress: 0,
    goal: 10,
    reward: { 'currency/FM': 500 },
    requirement: (userData) => userData.gamesWon >= 10,
    image: 'res/img/fm.png', // Assuming FM image
    hoverText: '500 FM'
  }
  ];
  
  export { quests };