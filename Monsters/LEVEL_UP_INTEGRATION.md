# Monster Level-Up System Integration Guide

## Overview

The Monster Level-Up System provides Pokemon-style experience gain and stat increases during battles. Monsters gain XP when defeating opponents, level up when they accumulate enough XP, and receive stat boosts that make them stronger.

## Key Features

- **Pokemon-style XP calculation** based on level differences and battle types
- **Automatic stat increases** on level-up with scaling based on base stats
- **Firebase integration** for persistent monster data storage
- **Battle integration** with the existing battle system
- **Real-time level-ups** during battles with visual feedback
- **Team XP distribution** for trainer battles

## Files Created

1. `level_up_manager.js` - Core level-up system
2. `level_up_demo.js` - Console demonstration
3. `level_up_test.html` - Interactive web demo
4. Modified `battle_system.js` - Integration with existing battle system

## Quick Start

### 1. Import the Level-Up Manager

```javascript
import { levelUpManager } from './level_up_manager.js';
import { BattleSystem } from './battle_system.js';

const battleSystem = new BattleSystem();
```

### 2. Handle Monster Defeat

When a monster is defeated in battle:

```javascript
// Single monster defeat
const result = await battleSystem.handleMonsterDefeat(
    winnerMonster,     // The victorious monster
    loserMonster,      // The defeated monster
    'wild',            // Battle type: 'wild', 'trainer', or 'boss'
    false              // Is trainer battle (affects XP multiplier)
);

// Display messages
result.messages.forEach(message => {
    console.log(message); // Or add to battle log UI
});
```

### 3. Team XP for Trainer Battles

For trainer battles where multiple monsters participate:

```javascript
const teamResults = await battleSystem.awardTeamXP(
    playerTeam,        // Array of player monsters
    defeatedMonster,   // The defeated opponent monster
    'trainer',         // Battle type
    true               // Is trainer battle
);

// Display results
teamResults.messages.forEach(message => {
    console.log(message);
});
```

### 4. Display XP Progress

For UI elements like XP bars:

```javascript
const xpProgress = battleSystem.getXPProgress(monster);

// xpProgress contains:
// - level: current level
// - currentXP: total experience points
// - progressXP: XP progress in current level
// - neededXP: XP needed to complete current level
// - progress: 0.0 to 1.0 progress to next level
// - xpToNext: XP needed for next level
// - isMaxLevel: boolean if at max level
```

## Monster Data Structure

Monsters need these additional fields for the level-up system:

```javascript
const monster = {
    // Existing fields...
    name: "Blobby",
    types: ["Water", "Dragon"],
    
    // Level-up system fields
    level: 5,                    // Current level (1-100)
    experience: 1250,            // Total experience points
    uid: "unique_monster_id",    // Required for Firebase saving
    
    // Stats (will be modified on level-up)
    stats: {
        hp: 80,
        attack: 75,
        defense: 70,
        specialAttack: 90,
        specialDefense: 85,
        speed: 95
    },
    
    // HP values (maxHP increases with level-ups)
    currentHP: 80,
    maxHP: 80
};
```

## XP Calculation Formula

The XP gain formula considers several factors:

```javascript
// Base XP calculation
const baseXP = 50;
const levelBonus = Math.floor(loser.level * 1.2);

// Level difference multiplier
let levelMultiplier = 1.0;
if (levelDiff > 0) {
    levelMultiplier = 1.0 + (levelDiff * 0.2); // 20% more per level
} else if (levelDiff < 0) {
    levelMultiplier = Math.max(0.2, 1.0 + (levelDiff * 0.1)); // Min 20%
}

// Battle type multipliers
const battleMultipliers = {
    'wild': 1.0,
    'trainer': 1.5,
    'boss': 2.0
};

// Trainer battle bonus: +50% XP
if (isTrainerBattle) {
    battleMultiplier *= 1.5;
}

const finalXP = Math.floor((baseXP + levelBonus) * levelMultiplier * battleMultiplier);
```

## Stat Increase Formula

Stats increase based on the monster's base stats:

```javascript
// Per level increases (minimum 1 per stat)
const increases = {
    hp: Math.max(1, Math.floor(baseStats.hp / 20)),
    attack: Math.max(1, Math.floor(baseStats.attack / 25)),
    defense: Math.max(1, Math.floor(baseStats.defense / 25)),
    specialAttack: Math.max(1, Math.floor(baseStats.specialAttack / 25)),
    specialDefense: Math.max(1, Math.floor(baseStats.specialDefense / 25)),
    speed: Math.max(1, Math.floor(baseStats.speed / 25))
};
```

## Firebase Integration

Monster data is automatically saved to Firebase on level-up:

```javascript
// Firebase structure
users/{userId}/monsters/{monsterUid}/
├── level: 5
├── experience: 1250
├── stats: {
│   ├── hp: 85
│   ├── attack: 78
│   └── ...
├── currentHP: 85
└── maxHP: 85
```

## Integration with Existing Systems

### Battle System Integration

The level-up system is already integrated with `battle_system.js`:

```javascript
// In your battle logic, after a monster is defeated:
if (opponentMonster.currentHP <= 0) {
    const result = await battleSystem.handleMonsterDefeat(
        playerMonster, 
        opponentMonster, 
        'wild'
    );
    
    // Add messages to battle log
    battleLog.push(...result.messages);
}
```

### Game Engine Integration

For the main game engine, integrate level-ups in the battle resolution:

```javascript
// In monster-game-engine.js or similar
async function resolveBattle(winner, loser, battleType) {
    // Existing battle resolution...
    
    // Award XP and handle level-ups
    const levelUpResult = await battleSystem.handleMonsterDefeat(
        winner, 
        loser, 
        battleType, 
        isTrainerBattle
    );
    
    // Update UI with level-up messages
    if (levelUpResult.messages.length > 0) {
        displayBattleMessages(levelUpResult.messages);
    }
    
    return levelUpResult;
}
```

### UI Integration

For XP bars and level displays:

```javascript
function updateMonsterUI(monster) {
    const xpProgress = battleSystem.getXPProgress(monster);
    
    // Update level display
    document.getElementById('monsterLevel').textContent = monster.level;
    
    // Update XP bar
    const xpBar = document.getElementById('xpBar');
    xpBar.style.width = `${xpProgress.progress * 100}%`;
    
    // Update XP text
    document.getElementById('xpText').textContent = 
        `${xpProgress.progressXP} / ${xpProgress.neededXP} XP`;
}
```

## Testing

### Console Demo

Run the console demo to see the system in action:

```javascript
import { demonstrateLevelUpSystem } from './level_up_demo.js';
demonstrateLevelUpSystem();
```

### Interactive Demo

Open `level_up_test.html` in a browser to test the system interactively.

### Unit Testing

Test individual components:

```javascript
import { levelUpManager } from './level_up_manager.js';

// Test XP calculation
const xpGain = levelUpManager.calculateXPGain(
    { level: 5 },  // winner
    { level: 7 },  // loser
    'trainer',     // battle type
    true           // is trainer battle
);
console.log(`XP Gain: ${xpGain}`);

// Test level-up
const monster = { level: 4, experience: 800, stats: {...} };
const result = levelUpManager.awardXP(monster, 500);
console.log(`Level up result:`, result);
```

## Configuration

### XP Table Customization

Modify the XP requirements in `level_up_manager.js`:

```javascript
generateXPTable() {
    const table = [0];
    
    for (let level = 2; level <= this.maxLevel; level++) {
        // Customize this formula for different progression speeds
        const baseXP = 100;           // Base XP requirement
        const multiplier = 1.2;       // Growth rate
        const xpNeeded = Math.floor(baseXP * Math.pow(level, 2.5) * multiplier);
        table.push(table[table.length - 1] + xpNeeded);
    }
    
    return table;
}
```

### Stat Growth Customization

Modify stat increases in `calculateStatIncreases()`:

```javascript
// Adjust these divisors to change stat growth rates
increases.hp += Math.max(1, Math.floor(baseStats.hp / 20));        // HP grows fastest
increases.attack += Math.max(1, Math.floor(baseStats.attack / 25)); // Other stats grow slower
// ... etc
```

## Best Practices

1. **Always check for level-ups** after awarding XP
2. **Save to Firebase** immediately after level-ups to prevent data loss
3. **Display level-up messages** to provide player feedback
4. **Update UI elements** (XP bars, stat displays) after level changes
5. **Handle errors gracefully** when Firebase operations fail
6. **Use appropriate battle types** for correct XP multipliers

## Troubleshooting

### Common Issues

1. **Monster not leveling up**: Check that `experience` and `level` fields exist
2. **Firebase save fails**: Ensure monster has a valid `uid` and user is authenticated
3. **Stats not increasing**: Verify monster has `stats` object with correct structure
4. **XP calculation wrong**: Check battle type and trainer battle flag parameters

### Debug Logging

Enable debug logging to troubleshoot issues:

```javascript
// In level_up_manager.js, add console.log statements:
console.log(`Awarding ${xpGain} XP to ${monster.name}`);
console.log(`Level: ${oldLevel} → ${newLevel}`);
console.log(`Stats before:`, oldStats);
console.log(`Stats after:`, monster.stats);
```

## Future Enhancements

Potential improvements to consider:

1. **Evolution system** triggered by level-ups
2. **Move learning** at specific levels
3. **Ability changes** on evolution
4. **Stat variation** based on individual monster IVs
5. **XP share items** for team-wide XP distribution
6. **Level caps** based on story progression
7. **Prestige system** for max-level monsters

## Conclusion

The Monster Level-Up System provides a complete Pokemon-style progression system that integrates seamlessly with your existing battle system and Firebase backend. Monsters will now grow stronger through battles, providing players with a sense of progression and attachment to their creatures.

For questions or issues, refer to the demo files and test the system with the provided HTML interface. 