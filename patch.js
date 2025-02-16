export const CURRENT_PATCH = "1.7";

// Helper function to calculate patch winrate
export function calculatePatchWinrate(character) {
    if (!character) return { winrate: 0, totalGames: 0 };
    const wins = character.win || 0;
    const losses = character.lose || 0;
    const totalGames = wins + losses;
    const winrate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    return {
        winrate: winrate.toFixed(1),
        totalGames
    };
} 