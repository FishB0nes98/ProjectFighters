# Battle Context System Documentation

## Overview
The Battle Context System distinguishes between different types of battles to ensure that only map mode trainer battles affect the trainer journey map progress. This prevents free battle mode from unintentionally modifying map progression.

## Problem Solved
Previously, ALL trainer battles would update the trainer journey map progress, regardless of whether they were initiated from:
- **Map Mode**: Progressive trainer battles that should affect journey progress
- **Free Battle Mode**: Casual trainer battles that should NOT affect journey progress

## Implementation

### Battle Context Types
The system now tracks three types of battle contexts:

1. **`'map'`**: Battles initiated from the trainer journey map
   - **Effect**: Updates map progress on victory/defeat
   - **Source**: Map Mode interface trainer battles

2. **`'free'`**: Battles initiated from free battle mode
   - **Effect**: Does NOT update map progress
   - **Source**: Trainer Selection screen battles

3. **`'wild'`**: Wild monster encounters
   - **Effect**: No trainer progress (no trainer involved)
   - **Source**: Quick battles and wild encounters

### Files Modified

#### `js/enhanced-battle-manager.js`
- **`startBattle()` method**: Added `battleContext` parameter
- **`battleState` object**: Added `battleContext` field to track context
- **`endBattle()` method**: Only updates map progress for `'map'` context battles

```javascript
// Before: Updated progress for ALL trainer battles
if (this.battleState.trainer && this.gameEngine.mapMode) {
    await this.gameEngine.mapMode.recordBattleAttempt(this.battleState.trainer.id, playerWon);
}

// After: Only updates progress for MAP battles
if (this.battleState.trainer && this.battleState.battleContext === 'map' && this.gameEngine.mapMode) {
    await this.gameEngine.mapMode.recordBattleAttempt(this.battleState.trainer.id, playerWon);
} else if (this.battleState.trainer && this.battleState.battleContext === 'free') {
    console.log(`🎲 Free battle mode - map progress NOT updated for trainer ${this.battleState.trainer.id}`);
}
```

#### `js/monster-game-engine.js`
- **`startBattle()` method**: Added `battleContext` parameter with default `'free'`
- **`startTrainerBattle()` method**: Added `battleContext` parameter with default `'free'`
- **`quickBattle()` method**: Uses `'wild'` context for wild encounters

#### `js/map-mode.js`
- **`startTrainerBattle()` method**: Passes `'map'` context to game engine

#### `js/battle-manager.js` (Legacy Support)
- **`startBattle()` method**: Added compatibility parameters for battle context

### Usage Examples

#### Map Mode Battle (Updates Progress)
```javascript
// From map mode interface
gameEngine.startTrainerBattle('rookie_riley', 'map');
// Result: Victory/defeat updates trainer journey progress
```

#### Free Battle Mode (No Progress Update)
```javascript
// From trainer selection screen
gameEngine.startTrainerBattle('rookie_riley', 'free');
// Result: Victory/defeat does NOT update trainer journey progress
```

#### Wild Battle (No Trainer Involved)
```javascript
// Quick battle or wild encounter
gameEngine.quickBattle();
// Result: No trainer progress (wild monster battle)
```

## Debug Commands

### Testing Battle Contexts
```javascript
// Test map battle (should update progress)
debugMode.testMapBattle('rookie_riley');

// Test free battle (should NOT update progress)
debugMode.testFreeBattle('rookie_riley');

// Check current battle context
debugMode.checkBattleContext();
```

### Console Output Examples
```
🗺️ Testing MAP battle against rookie_riley...
📊 This SHOULD update map progress
🥊 Starting battle against trainer: Rookie Riley (Context: map)

🎲 Testing FREE battle against rookie_riley...
📊 This should NOT update map progress
🥊 Starting battle against trainer: Rookie Riley (Context: free)
```

## Battle Flow

### Map Mode Battle Flow
1. User clicks trainer in map interface
2. `mapMode.startTrainerBattle(trainerId)` called
3. Passes `'map'` context to `gameEngine.startTrainerBattle(trainerId, 'map')`
4. Battle starts with `battleContext: 'map'`
5. On battle end, map progress is updated
6. Console shows: `📊 Updated map progress for trainer rookie_riley: Victory`

### Free Battle Mode Flow
1. User clicks trainer in trainer selection screen
2. `gameEngine.startTrainerBattle(trainerId)` called (defaults to `'free'`)
3. Battle starts with `battleContext: 'free'`
4. On battle end, map progress is NOT updated
5. Console shows: `🎲 Free battle mode - map progress NOT updated for trainer rookie_riley`

## Backward Compatibility

### Legacy Battle Manager
The legacy `BattleManager` class has been updated to accept the new parameters:
```javascript
startBattle(playerTeam, opponentTeam, isWild = false, trainer = null, battleContext = 'free')
```

### Default Behavior
- All trainer battles default to `'free'` context unless explicitly specified
- Map mode explicitly passes `'map'` context
- Wild battles use `'wild'` context

## Benefits

### 🎯 Precise Progress Tracking
- Map progress only updates for legitimate map battles
- Free battles allow practice without affecting progression

### 🎲 Casual Battle Mode
- Players can battle any trainer without consequences
- Useful for testing teams, strategies, or just having fun

### 🔍 Clear Debugging
- Battle context is logged for easy debugging
- Clear console messages indicate when progress is/isn't updated

### 🛡️ Data Integrity
- Prevents accidental progress updates
- Maintains intended game progression flow

## Testing Scenarios

### Scenario 1: Map Mode Progression
1. Start from map mode
2. Battle an unlocked trainer
3. Win the battle
4. ✅ Map progress should update
5. ✅ Trainer should be marked as defeated

### Scenario 2: Free Battle Mode
1. Start from trainer selection screen
2. Battle any trainer
3. Win the battle
4. ✅ Map progress should NOT update
5. ✅ Trainer remains in original state on map

### Scenario 3: Mixed Battles
1. Battle trainer in free mode (no progress update)
2. Battle same trainer in map mode (progress updates)
3. ✅ Only the map battle affects progression

## Error Handling

### Invalid Context
- System defaults to `'free'` for unknown contexts
- Logs warning for debugging

### Missing Parameters
- Backward compatibility maintained with default values
- Legacy code continues to work without modification

### Database Errors
- Map progress update failures are logged but don't crash the battle
- Battle rewards still function normally

## Future Enhancements

### Potential Features
- **Tournament Mode**: Special context for tournament battles
- **Training Mode**: Practice battles with reduced rewards
- **Challenge Mode**: Special battles with unique rules
- **Replay Mode**: Re-battle with no consequences

### Analytics Integration
- Track battle context statistics
- Monitor free vs map battle usage
- Identify popular training opponents

---

## Quick Reference

### Battle Context Values
- `'map'` → Updates trainer journey progress
- `'free'` → No progress update (default)
- `'wild'` → Wild encounter (no trainer)

### Key Methods
- `gameEngine.startTrainerBattle(trainerId, 'map')` → Map battle
- `gameEngine.startTrainerBattle(trainerId, 'free')` → Free battle
- `gameEngine.startTrainerBattle(trainerId)` → Free battle (default)

### Debug Commands
- `debugMode.testMapBattle(trainerId)` → Test map context
- `debugMode.testFreeBattle(trainerId)` → Test free context
- `debugMode.checkBattleContext()` → Check current context

This system ensures that the trainer journey map progression remains accurate and intentional, while still allowing players to enjoy casual battles without consequences. 