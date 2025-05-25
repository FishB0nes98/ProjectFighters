# 🥚 Monster Fighters Egg System

## Overview
The Egg System is a comprehensive breeding and collection feature that allows players to obtain monsters through time-based hatching mechanics. Eggs can be obtained through trainer battles, special rewards, and the monster shop.

## Features

### 🥚 Core Egg Mechanics
- **6 Rarity Tiers**: Common, Uncommon, Rare, Epic, Legendary, Mythical
- **Hatch Times**: 10 minutes (Common) to 48 hours (Mythical)
- **Enhanced IVs**: Higher rarity eggs produce monsters with better IV ranges
- **8 Egg Types**: Water, Fire, Grass, Electric, Ice, Ground, Normal, Flying
- **Real-time Countdown**: Live timers with automatic hatching

### 🚀 Booster System
- **IV Enhancer**: +10 to all IV stats (2500 FM / 15000 CM)
- **Hatch Accelerator**: 50% time reduction (1500 FM / 8000 CM)
- **Stackable Effects**: Multiple boosters can be applied to the same egg

### 🏆 Special Rewards
- **Kotal Kahn Daily Egg**: Water egg reward for defeating Kotal Kahn (24-hour cooldown)
- **Trainer Battle Integration**: Special trainers can award eggs as victory rewards
- **Random Rarity Generation**: Weighted system for fair distribution

## File Structure

### Core System Files
- `js/egg-system.js` - Main egg system logic and Firebase integration
- `js/trainer-battle-handler.js` - Special trainer reward handling
- `css/egg-system.css` - Complete styling for egg interface
- `egg-collection.html` - Dedicated egg management page

### Integration Files
- `monster-fighters.html` - Main game with egg system initialization
- `js/ui-manager.js` - Navigation button for egg collection
- `js/enhanced-battle-manager.js` - Trainer defeat reward integration
- `monster-shop.html` - Egg booster purchasing interface
- `Monsters/trainers.js` - Updated Kotal Kahn with reduced levels (6-8)

## Usage Guide

### For Players
1. **Obtaining Eggs**: Defeat Kotal Kahn daily for guaranteed Water eggs
2. **Managing Collection**: Visit Egg Collection page to view active eggs
3. **Using Boosters**: Purchase boosters from Monster Shop and apply to eggs
4. **Hatching**: Eggs hatch automatically when timer reaches zero

### For Developers
1. **Creating Test Eggs**: Use `debugMode.createTestEgg()` in console
2. **Fast Testing**: Use `debugMode.createFastEgg()` for 10-second eggs
3. **System Status**: Check `debugMode.checkEggSystem()` for diagnostics
4. **Kotal Kahn Testing**: Use `debugMode.testKotalKahnReward()` to test daily rewards

## Technical Implementation

### Database Structure
```
users/{userId}/
├── eggs/
│   └── {eggId}/
│       ├── id: string
│       ├── type: string (WATER, FIRE, etc.)
│       ├── rarity: string (COMMON, RARE, etc.)
│       ├── createdAt: timestamp
│       ├── hatchTime: timestamp
│       ├── isHatched: boolean
│       └── boosters: object
├── boosters/
│   ├── IV_BOOSTER: number
│   └── TIME_BOOSTER: number
└── lastKotalKahnEgg: timestamp
```

### Key Classes
- **EggSystem**: Main system controller with Firebase integration
- **TrainerBattleHandler**: Manages special trainer rewards and cooldowns
- **EGG_RARITIES**: Configuration object with hatch times and IV bonuses
- **EGG_TYPE_MONSTERS**: Mapping of egg types to possible monsters

### Rarity System
| Rarity | Hatch Time | IV Bonus Range | Weight |
|--------|------------|----------------|---------|
| Common | 10 min | 0-5 | 50% |
| Uncommon | 30 min | 3-10 | 30% |
| Rare | 2 hours | 8-15 | 15% |
| Epic | 6 hours | 12-20 | 4% |
| Legendary | 24 hours | 18-25 | 1% |
| Mythical | 48 hours | 25-31 | 0.1% |

## Testing Commands

### Console Commands (Available in monster-fighters.html)
```javascript
// Create a standard test egg
debugMode.createTestEgg('FIRE', 'RARE');

// Create a fast-hatching egg (10 seconds)
debugMode.createFastEgg('WATER');

// Test Kotal Kahn daily reward
debugMode.testKotalKahnReward();

// Check system status
debugMode.checkEggSystem();

// Open egg collection page
debugMode.openEggCollection();
```

## Integration Points

### Trainer Battles
- Special trainers can award eggs through `TrainerBattleHandler`
- Daily cooldowns prevent farming
- Automatic integration with battle completion

### Monster Shop
- Egg boosters available in dedicated filter tab
- FM/CM pricing with quantity controls
- Inventory management for purchased boosters

### Main Game Navigation
- Egg Collection button added to main menu
- Real-time egg status in collection interface
- Seamless navigation between game modes

## Future Enhancements

### Planned Features
- **Breeding System**: Combine two monsters to create eggs
- **Shiny Variants**: Rare color variants from special eggs
- **Egg Incubators**: Equipment to manage multiple eggs
- **Trading System**: Exchange eggs with other players
- **Seasonal Events**: Limited-time egg types and bonuses

### Technical Improvements
- **Offline Progress**: Calculate hatch progress when returning to game
- **Push Notifications**: Alert players when eggs are ready
- **Batch Operations**: Apply boosters to multiple eggs
- **Advanced Statistics**: Detailed hatching history and analytics

## Troubleshooting

### Common Issues
1. **Eggs not appearing**: Check Firebase authentication and database permissions
2. **Timers not updating**: Ensure egg system is initialized with valid user ID
3. **Boosters not working**: Verify booster inventory and egg selection
4. **Daily rewards not available**: Check 24-hour cooldown status

### Debug Information
- All egg operations are logged to console with 🥚 prefix
- Firebase errors are caught and logged with ❌ prefix
- System status can be checked with `debugMode.checkEggSystem()`

## Credits
Implemented as part of the Monster Fighters game engine with full Firebase integration and responsive design for optimal user experience. 