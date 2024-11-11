const quests = [
  {
    id: 'play10SameCharacterSacredCeremony',
    title: "Forever",
    description: "Play 10 games with the same character (Shoma, Julia, Birdie, Morrigan, or Nina)",
    progress: 0,
    goal: 10,
    reward: { 'lootbox/FreeLootbox': 1 },
    requirement: (userData) => {
      const eligibleCharacters = ['Shoma', 'Julia', 'Birdie', 'Morrigan', 'Nina'];
      return eligibleCharacters.some(character => userData.characterGamesPlayed && userData.characterGamesPlayed[character] >= 10);
    },
    image: 'res/img/basicbox.png',
    hoverText: 'Free Lootbox'
  }
  ];
  
  export { quests };