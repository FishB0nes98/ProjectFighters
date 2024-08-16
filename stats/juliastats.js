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

function useJuliaFirstAbility(database, ref, get, playerId, update) {
    console.log("useJuliaFirstAbility called");
    const playerRef = ref(database, `players/${playerId}`);
    get(playerRef).then((snapshot) => {
        const playerData = snapshot.val();
        console.log("Player data:", playerData);
        if (playerData && playerData.character === 'Julia') {
            // Use Julia's AD value from the juliaStats object
            const juliaAD = juliaStats.AD;
            if (typeof juliaAD !== 'number' || isNaN(juliaAD)) {
                console.error("Invalid or undefined AD value in juliaStats:", juliaAD);
                return;
            }

            // Determine the opponent's team based on Julia's team
            const opponentTeam = playerData.team === 'team1' ? 'team2' : 'team1';
            const opponentRef = ref(database, `players`);
            console.log("Fetching opponent data from:", `players/${opponentTeam}`);
            get(opponentRef).then((opponentSnapshot) => {
                const playersData = opponentSnapshot.val();
                console.log("All players data:", playersData);
                let opponentData = null;
                let opponentKey = null;
                for (const key in playersData) {
                    if (playersData[key].team === opponentTeam) {
                        opponentData = playersData[key];
                        opponentKey = key;
                        break;
                    }
                }
                console.log("Opponent data:", opponentData);
                if (opponentData) {
                    const damage = Math.round(juliaAD * 1.1);
                    const healing = Math.round(damage * 0.5);
                    const newOpponentHP = opponentData.currentHP - damage;
                    const newPlayerHP = Math.min(playerData.maxHP, playerData.currentHP + healing);

                    // Validate calculations
                    if (isNaN(newOpponentHP) || isNaN(newPlayerHP)) {
                        console.error("Invalid HP calculation:", { newOpponentHP, newPlayerHP });
                        return;
                    }

                    console.log(`Dealing ${damage} damage to opponent and healing ${healing} HP`);

                    // Use transactions to ensure atomic updates
                    update(ref(database, `players/${opponentKey}`), { currentHP: newOpponentHP }).then(() => {
                        console.log("Opponent HP updated");
                        update(playerRef, { currentHP: newPlayerHP }).then(() => {
                            console.log(`Julia dealt ${damage} damage to ${opponentTeam} and healed ${healing} HP`);
                        }).catch((error) => {
                            console.error("Error updating Julia's HP:", error);
                        });
                    }).catch((error) => {
                        console.error("Error updating opponent's HP:", error);
                    });
                } else {
                    console.error("Opponent data not found");
                }
            }).catch((error) => {
                console.error("Error getting opponent data:", error);
            });
        } else {
            console.error("Player data not found or character is not Julia");
        }
    }).catch((error) => {
        console.error("Error getting player data:", error);
    });
}

// Ensure the global variable is accessible
window.juliaStats = juliaStats;
window.useJuliaFirstAbility = useJuliaFirstAbility;