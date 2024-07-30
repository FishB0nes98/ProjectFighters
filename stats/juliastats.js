const juliaStats = {
    AD: 50, // Physical Damage
    AP: 30, // Magical Damage
    HP: 500, // Health Points
    Mana: 200, // Mana
    Armor: 20, // Reduces Physical damage by %
    MagicResistance: 15, // Reduces Magical damage by %
    Speed: 1.0, // Losing 0.5s cooldown on abilities
    HealingBoost: 10, // Makes healing abilities stronger
    Spells: {
        spell1: 'res/img/raid/juliaa1.jfif'
    }
};

function displayJuliaStats() {
    const player1StatsContainer = document.getElementById('player1-stats');
    const player2StatsContainer = document.getElementById('player2-stats');

    const statsHTML = `
        <p>AD: ${juliaStats.AD}</p>
        <p>AP: ${juliaStats.AP}</p>
        <p>HP: ${juliaStats.HP}</p>
        <p>Mana: ${juliaStats.Mana}</p>
        <p>Armor: ${juliaStats.Armor}%</p>
        <p>Magic Resistance: ${juliaStats.MagicResistance}%</p>
        <p>Speed: ${juliaStats.Speed}</p>
        <p>Healing Boost: ${juliaStats.HealingBoost}%</p>
    `;

    player1StatsContainer.innerHTML = statsHTML;
    player2StatsContainer.innerHTML = statsHTML;
}

function getOpponentKey(database, ref, playerId, callback) {
    const playersRef = ref(database, 'players');
    onValue(playersRef, (snapshot) => {
        const players = snapshot.val();
        for (const key in players) {
            if (key !== playerId) {
                callback(key);
                return;
            }
        }
        console.error(`Opponent for player ${playerId} not found`);
    });
}

function useJuliaFirstAbility(database, ref, playerId) {
    console.log("useJuliaFirstAbility function called"); // Initial log to confirm function call

    const playerRef = ref(database, `players/${playerId}`);
    onValue(playerRef, (snapshot) => {
        const playerData = snapshot.val();
        console.log('Player data:', playerData);
        if (playerData) {
            const damage = 425 + (0.5 * playerData.AD);
            const healing = 0.25 * damage + (playerData.HealingBoost / 100 * damage);

            console.log(`Using Julia's first ability: Damage = ${damage}, Healing = ${healing}`);

            // Get all players
            const playersRef = ref(database, 'players');
            onValue(playersRef, (snapshot) => {
                const players = snapshot.val();
                for (const key in players) {
                    if (players[key].team !== playerData.team) {
                        // Deal damage to players in the opposite team
                        const opponentRef = ref(database, `players/${key}`);
                        const opponentData = players[key];
                        const newOpponentHP = opponentData.currentHP - damage;
                        set(opponentRef, {
                            ...opponentData,
                            currentHP: newOpponentHP > 0 ? newOpponentHP : 0
                        }).then(() => {
                            console.log('Opponent HP updated');
                            updateHP(key, newOpponentHP > 0 ? newOpponentHP : 0, opponentData.maxHP);
                        }).catch((error) => {
                            console.error('Error updating Opponent HP:', error);
                        });
                    }
                }
            });

            const newPlayerHP = playerData.currentHP + healing;
            set(playerRef, {
                ...playerData,
                currentHP: newPlayerHP < playerData.maxHP ? newPlayerHP : playerData.maxHP
            }).then(() => {
                console.log('Player HP updated');
                updateHP(playerId, newPlayerHP < playerData.maxHP ? newPlayerHP : playerData.maxHP);
            }).catch((error) => {
                console.error('Error updating Player HP:', error);
            });
        } else {
            console.error('Player data not found');
        }
    });
}

// Ensure the global variable is accessible
window.useJuliaFirstAbility = useJuliaFirstAbility;
window.juliaStats = juliaStats;
