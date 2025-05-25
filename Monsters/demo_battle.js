// Demo Battle - Shows the new move and ability system in action
import { battleSystem } from './battle_system.js';

// Example usage of the battle system
export function demonstrateBattleSystem() {
    console.log("=== Monster Battle System Demo ===");

    // Mock monster data (would come from JSON files)
    const bunburrowData = {
        id: "001",
        name: "Bunburrow",
        types: ["Ground", "Fairy"],
        ability: { name: "Pixilate", isPassive: true },
        stats: { hp: 95, attack: 35, defense: 85, specialAttack: 45, specialDefense: 95, speed: 65 },
        moves: [
            { name: "Fairy Wind" },
            { name: "Heal Bell" },
            { name: "Light Screen" },
            { name: "Burrow Strike" }
        ]
    };

    const pechacData = {
        id: "002", 
        name: "Pechac",
        types: ["Ground", "Water"],
        ability: { name: "Torrent", isPassive: true },
        stats: { hp: 65, attack: 105, defense: 65, specialAttack: 115, specialDefense: 70, speed: 100 },
        moves: [
            { name: "Aqua Cannon" },
            { name: "Stone Edge" },
            { name: "Rapid Strike" },
            { name: "Temple Crash" }
        ]
    };

    // Mock user monster data (would come from Firebase)
    const userBunburrow = {
        level: 25,
        ivs: { hp: 20, attack: 15, defense: 25, specialAttack: 18, specialDefense: 30, speed: 22 }
    };

    const userPechac = {
        level: 25,
        ivs: { hp: 18, attack: 28, defense: 20, specialAttack: 31, specialDefense: 16, speed: 25 }
    };

    // Initialize monsters with battle system
    const bunburrow = battleSystem.initializeMonster(bunburrowData, userBunburrow);
    const pechac = battleSystem.initializeMonster(pechacData, userPechac);

    console.log(`\nInitialized ${bunburrow.name}:`);
    console.log(`- HP: ${bunburrow.maxHP}`);
    console.log(`- Ability: ${bunburrow.ability?.name}`);
    console.log(`- Moves: ${bunburrow.moves.map(m => m.name).join(', ')}`);

    console.log(`\nInitialized ${pechac.name}:`);
    console.log(`- HP: ${pechac.maxHP}`);
    console.log(`- Ability: ${pechac.ability?.name}`);
    console.log(`- Moves: ${pechac.moves.map(m => m.name).join(', ')}`);

    // Start battle
    console.log("\n=== Battle Start ===");
    const battleStart = battleSystem.startBattle(bunburrow, pechac);
    battleStart.messages.forEach(msg => console.log(msg));

    // Demonstrate Bunburrow's Heal Bell (support move)
    console.log("\n--- Bunburrow uses Heal Bell ---");
    const healBellResult = battleSystem.executeMove(bunburrow, pechac, 1); // Heal Bell is index 1
    console.log(healBellResult.message);

    // Demonstrate Bunburrow's Light Screen (defensive setup)
    console.log("\n--- Bunburrow uses Light Screen ---");
    const lightScreenResult = battleSystem.executeMove(bunburrow, pechac, 2); // Light Screen is index 2
    console.log(lightScreenResult.message);

    // Demonstrate Pechac's Aqua Cannon (powerful attack)
    console.log("\n--- Pechac uses Aqua Cannon ---");
    const aquaCannonResult = battleSystem.executeMove(pechac, bunburrow, 0); // Aqua Cannon is index 0
    console.log(aquaCannonResult.message);
    if (aquaCannonResult.success) {
        console.log(`Bunburrow HP: ${bunburrow.currentHP}/${bunburrow.maxHP}`);
    }

    // Demonstrate Pechac's Temple Crash (high damage with recoil)
    console.log("\n--- Pechac uses Temple Crash ---");
    const templeCrashResult = battleSystem.executeMove(pechac, bunburrow, 3); // Temple Crash is index 3
    console.log(templeCrashResult.message);
    if (templeCrashResult.success) {
        console.log(`Bunburrow HP: ${bunburrow.currentHP}/${bunburrow.maxHP}`);
        console.log(`Pechac HP: ${pechac.currentHP}/${pechac.maxHP} (took recoil)`);
    }

    // Demonstrate Torrent ability activation (when Pechac is low on HP)
    console.log("\n--- Simulating low HP for Torrent activation ---");
    const oldHP = pechac.currentHP;
    pechac.currentHP = Math.floor(pechac.maxHP * 0.25); // Set to 25% HP
    console.log(`Pechac HP reduced to: ${pechac.currentHP}/${pechac.maxHP}`);
    
    const torrentAquaCannonResult = battleSystem.executeMove(pechac, bunburrow, 0); // Aqua Cannon with Torrent boost
    console.log(torrentAquaCannonResult.message);

    console.log("\n=== Demo Complete ===");
    
    return {
        bunburrow,
        pechac,
        battleResults: [healBellResult, lightScreenResult, aquaCannonResult, templeCrashResult, torrentAquaCannonResult]
    };
}

// Export the demo function
window.demonstrateBattleSystem = demonstrateBattleSystem; 