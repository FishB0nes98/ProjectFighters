# 🎮 Monster Fighters - Retro Monster Battle Game

A modern take on classic monster-taming games with Pokemon-style mechanics, built with vanilla JavaScript and featuring a retro-modern aesthetic.

## 🌟 Features

### Core Game Systems
- **Turn-based Battle System** - Strategic combat with proper speed calculations, priority moves, and type effectiveness
- **Individual Values (IVs)** - Each monster has unique stats affecting performance  
- **Comprehensive Type System** - 18 different types with full effectiveness chart
- **Dynamic Move System** - Moves loaded from individual files with various effects
- **Ability System** - Passive abilities that trigger during battle
- **Intelligent AI** - Multiple difficulty levels and personality types

### Battle Mechanics
- **Damage Calculation** - Pokemon-style formulas with level, stats, STAB, and type effectiveness
- **Status Conditions** - Poison, burn, paralysis, sleep, freeze
- **Field Effects** - Light Screen, weather, terrain effects
- **Critical Hits** - Enhanced damage with visual effects
- **Multi-hit Moves** - Moves that hit multiple times
- **Priority System** - Faster moves go first regardless of speed
- **Recoil Damage** - Powerful moves with drawbacks

### User Interface
- **Modern Retro Design** - Pixel fonts with modern animations and effects
- **Real-time HP Bars** - Animated health bars with color indicators
- **Type Effectiveness Preview** - Shows effectiveness when hovering over moves
- **Battle Log** - Typewriter effect for immersive battle commentary
- **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Option 1: Local Development Server
1. Clone or download the project
2. Start a local server (required for ES6 modules):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using VS Code Live Server extension
   ```
3. Open `http://localhost:8000/monster-fighters.html`

### Option 2: Direct File Access
Open `monster-fighters.html` in a modern browser. Note: Some features may be limited due to CORS restrictions.

## 🎯 How to Play

### Main Menu
- **Quick Battle** - Jump into a battle with auto-generated teams
- **Team Management** - View and manage your monster team (coming soon)
- **Monster Dex** - Browse available monsters and their stats
- **Settings** - Adjust AI difficulty and personality

### Battle Controls
- **Select Moves** - Click on move buttons to choose your attack
- **Type Effectiveness** - Hover over moves to see effectiveness against opponent
- **Battle Log** - Watch the battle unfold with detailed commentary

### Debug Console
Open browser console for advanced controls:
```javascript
// Generate a test team
debugMode.generateTestTeam()

// Add random monsters
debugMode.addRandomMonster()

// View team information
debugMode.showTeamInfo()

// Start battles
gameEngine.quickBattle()

// Adjust AI settings
setAIDifficulty('hard')
setAIPersonality('smart')
```

## 🏗️ Project Structure

```
📦 Monster Fighters
├── 📄 monster-fighters.html      # Main game page
├── 📄 README.md                  # This file
├── 📁 js/                        # JavaScript modules
│   ├── 📄 monster-game-engine.js # Core game engine
│   ├── 📄 battle-manager.js      # Battle mechanics
│   ├── 📄 enemy-ai.js            # AI opponent
│   ├── 📄 ui-manager.js          # User interface
│   └── 📄 firebase-config.js     # Firebase integration
├── 📁 css/                       # Stylesheets
│   ├── 📄 monster-tamers.css     # Base styles
│   └── 📄 battle-ui.css          # Battle interface styles
├── 📁 Monsters/                  # Monster data and assets
│   ├── 📄 Bunburrow.json         # Fairy support monster
│   ├── 📄 Pechac.json            # Water/Fighting attacker
│   ├── 📄 monster_template.json  # Template for new monsters
│   ├── 📄 move_registry.js       # Move loading system
│   ├── 📄 ability_registry.js    # Ability loading system
│   ├── 📄 battle_system.js       # Battle integration
│   ├── 📁 moves/                 # Individual move files
│   │   ├── 📄 fairy_wind.js
│   │   ├── 📄 heal_bell.js
│   │   ├── 📄 light_screen.js
│   │   ├── 📄 burrow_strike.js
│   │   ├── 📄 aqua_cannon.js
│   │   ├── 📄 stone_edge.js
│   │   ├── 📄 rapid_strike.js
│   │   └── 📄 temple_crash.js
│   └── 📁 abilities/             # Individual ability files
│       ├── 📄 bunburrow_pixilate.js
│       └── 📄 pechac_torrent.js
```

## 🎨 Current Monsters

### Bunburrow
- **Type:** Fairy
- **Role:** Tanky Support
- **Ability:** Pixilate (converts Normal moves to Fairy-type with 20% boost)
- **Key Moves:** Fairy Wind, Heal Bell, Light Screen, Burrow Strike

### Pechac  
- **Type:** Water/Fighting
- **Role:** Fast Physical Attacker
- **Ability:** Torrent (boosts Water moves by 50% when HP below 33%)
- **Key Moves:** Aqua Cannon, Stone Edge, Rapid Strike, Temple Crash

## ⚔️ Battle Mechanics Deep Dive

### Damage Formula
```
damage = ((2 * level + 10) / 250) * (attack / defense) * power + 2
damage *= STAB_bonus (1.5x if move type matches user type)
damage *= type_effectiveness (0x, 0.5x, 1x, or 2x)
damage *= critical_hit (1.5x if critical)
damage *= random_factor (85% - 100%)
```

### Type Effectiveness Chart
The game includes a comprehensive type chart covering all 18 Pokemon types:
- **Super Effective (2x)** - Green indicator
- **Not Very Effective (0.5x)** - Orange indicator  
- **No Effect (0x)** - Gray indicator
- **Normal Damage (1x)** - No indicator

### AI Intelligence Levels
- **Easy** - 30% chance to pick random moves
- **Normal** - Balanced strategic play
- **Hard** - Optimal move selection with prediction

### AI Personalities
- **Aggressive** - Prefers high-damage moves
- **Defensive** - Favors status moves and accuracy
- **Smart** - Heavily weighs type effectiveness
- **Balanced** - No special preferences

## 🔧 Technical Features

### ES6 Module System
- Dynamic loading of monsters, moves, and abilities
- Clean separation of concerns
- Easy extensibility

### Type System
- Full 18-type Pokemon-style effectiveness chart
- Support for dual-type monsters
- Proper damage calculation with type bonuses

### Battle Engine
- Event-driven ability system
- Field effect management
- Status condition tracking
- Turn order calculation based on priority and speed

### Modern Web Standards
- ES6+ JavaScript features
- CSS Grid and Flexbox layouts
- CSS Custom Properties (variables)
- Responsive design principles

## 🎮 Adding New Content

### Creating a New Monster
1. Copy `monster_template.json` to `Monsters/YourMonster.json`
2. Fill in stats, types, moves, and ability
3. Add to `loadMonsterData()` array in game engine
4. Create monster sprite: `Monsters/YourMonster.png`

### Creating a New Move
1. Create `Monsters/moves/your_move.js`
2. Implement move logic following existing patterns
3. Add to move registry

### Creating a New Ability
1. Create `Monsters/abilities/your_ability.js`
2. Implement ability hooks (switch_in, move_use, hp_change, etc.)
3. Add to ability registry

## 🚧 Roadmap

### Planned Features
- [ ] Team Management Interface
- [ ] Monster Collection System
- [ ] Experience and Leveling
- [ ] More Monsters (target: 20+)
- [ ] Online Multiplayer
- [ ] Tournament Mode
- [ ] Move Learning System
- [ ] Item System
- [ ] Weather Effects
- [ ] Terrain Effects

### Technical Improvements
- [ ] Save System Integration
- [ ] Performance Optimization
- [ ] Mobile-First Design
- [ ] Accessibility Features
- [ ] Internationalization

## 🤝 Contributing

This is a learning project demonstrating modern web game development. Feel free to:
- Add new monsters, moves, or abilities
- Improve the AI system
- Enhance the user interface
- Fix bugs or optimize performance
- Suggest new features

## 📜 License

This project is for educational purposes. Feel free to use and modify for learning web development and game design concepts.

---

**Built with ❤️ using Vanilla JavaScript, CSS3, and modern web standards** 