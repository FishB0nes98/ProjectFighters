const shomaStats = {
    AD: 60, // Physical Damage
    AP: 40, // Magical Damage
    HP: 6200, // Health Points
    Mana: 250, // Mana
    Armor: 25, // Reduces Physical damage by %
    MagicResistance: 20, // Reduces Magical damage by %
    Speed: 1.2, // Losing 0.5s cooldown on abilities
    HealingBoost: 15 // Makes healing abilities stronger
};

function displayShomaStats() {
    console.log('Displaying Shoma stats');
    const player1StatsContainer = document.getElementById('player1-stats');
    const player2StatsContainer = document.getElementById('player2-stats');

    const statsHTML = `
        <p>AD: ${shomaStats.AD}</p>
        <p>AP: ${shomaStats.AP}</p>
        <p>HP: ${shomaStats.HP}</p>
        <p>Mana: ${shomaStats.Mana}</p>
        <p>Armor: ${shomaStats.Armor}%</p>
        <p>Magic Resistance: ${shomaStats.MagicResistance}%</p>
        <p>Speed: ${shomaStats.Speed}</p>
        <p>Healing Boost: ${shomaStats.HealingBoost}%</p>
    `;

    player1StatsContainer.innerHTML = statsHTML;
    player2StatsContainer.innerHTML = statsHTML;
}

function useShomaFirstAbility(database, ref, onValue, playerId, update) {
    // Define Shoma's first ability here
    console.log("Shoma's first ability used");
}

// Ensure the global variable is accessible
window.shomaStats = shomaStats;
window.useShomaFirstAbility = useShomaFirstAbility;