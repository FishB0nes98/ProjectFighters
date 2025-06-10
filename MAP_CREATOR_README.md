# 🎮 ProjectFighters Map Creator System

A powerful visual level editor for creating custom maps and levels for your ProjectFighters game!

## 🚀 Quick Start

1. **Launch the Map Creator**: Open `map-creator.html` in your browser
2. **Choose your approach**:
   - **Advanced Editor**: Full-featured editor with layers and precision tools
   - **Quick Creator**: Simplified interface for rapid prototyping
   - **Templates**: Start with pre-made level templates

## 🛠️ Features

### 🎨 Advanced Map Editor (`map-editor.html`)

- **Visual Level Design**: Drag and drop interface for placing elements
- **Layer System**: Organize elements by type (boundaries, characters, interactables, hazards)
- **Comprehensive Tool Set**:
  - 🧱 **Boundaries**: walls, platforms, ramps, ground, ceiling
  - 🏔️ **Special Terrain**: ice platforms, lava, crystals, stalactites
  - 👾 **Characters**: spawn points, enemies, bosses
  - 🎁 **Interactables**: checkpoints, health potions, switches, doors, treasure
  - ⚡ **Hazards**: damage areas, spikes, pits

### 🎯 Key Controls

- **Left Click**: Select/place elements
- **Right Click**: Context menu (copy, duplicate, delete)
- **Mouse Wheel**: Zoom in/out
- **Middle Click**: Pan view
- **Drag**: Move selected elements

### ⌨️ Keyboard Shortcuts

- `Ctrl+S`: Save map
- `Ctrl+G`: Toggle grid
- `Delete`: Delete selected element
- `Escape`: Deselect element

## 📋 Element Types

### 🧱 Boundaries
- **Wall**: Solid barriers that block movement
- **Platform**: Jumpable surfaces
- **Ground**: Main floor surface
- **Ceiling**: Overhead barriers
- **Ramp Up/Down**: Sloped surfaces

### 🏔️ Special Terrain
- **Ice Platform**: Slippery surfaces
- **Lava Platform**: Dangerous hot surfaces
- **Weak Platform**: Breakable platforms
- **Crystal**: Decorative crystal formations
- **Stalactite**: Hanging obstacles
- **Pillar**: Vertical columns

### 👾 Characters
- **Spawn Points**: Player starting positions
- **Enemies**: Basic enemy placement
- **Boss**: Powerful enemy encounters

### 🎁 Interactables
- **Checkpoints**: Save points
- **Health Potions**: Healing items
- **Switches**: Activatable mechanisms
- **Doors**: Passages that can be opened
- **Treasure**: Collectible items
- **Portals**: Teleportation points

### ⚡ Hazards
- **Hazards**: Generic damage areas
- **Spikes**: Deadly spike traps
- **Pits**: Bottomless holes

## 💾 Save & Export Options

### 1. Save as JSON
- Saves your map in the editor's native format
- Can be loaded back into the editor for continued work
- Contains all element data and properties

### 2. Export as JavaScript
- Generates a `.js` file compatible with your game
- Ready to be included in your game's level system
- Follows the same format as existing levels

### 3. Local Storage Integration
- Maps are automatically saved to browser storage
- Custom maps can be loaded into your game
- Persistent between browser sessions

## 🎲 Template System

Quick-start templates available:

- **⚔️ Arena**: Fighting arena with platforms
- **🏃‍♂️ Platformer**: Side-scrolling level design
- **🌲 Forest**: Natural environment with trees and obstacles
- **🕳️ Cave**: Underground cavern system
- **🏰 Castle**: Medieval fortress layout

## 🔌 Game Integration

### Including the System

Add to your main game HTML:

```html
<!-- Map Integration -->
<script src="js/map-integration.js"></script>
```

### Loading Custom Maps

```javascript
// Get all custom maps
const customMaps = getCustomMaps();

// Load a specific custom map
loadCustomMap('map-id-here');

// Import a map from JSON
const mapJSON = '{"id":"custom-map","name":"My Level",...}';
importCustomMap(mapJSON);
```

### File Upload Support

```html
<!-- File input for map uploads -->
<input type="file" accept=".json" onchange="handleCustomMapUpload(event)">
```

## 🎮 Using in Your Game

### 1. Basic Integration

```javascript
// Initialize the map loader (done automatically)
// Maps are stored in window.mapLoader

// Load a custom level
const success = await window.loadCustomMap('your-map-id');
if (success) {
    console.log('Custom map loaded successfully!');
}
```

### 2. Advanced Usage

```javascript
// Access the map loader directly
const mapLoader = window.mapLoader;

// Get map data
const mapData = mapLoader.getMap('map-id');

// Save a map programmatically
mapLoader.saveMapToStorage(yourMapData);

// Convert editor format to game format
const gameLevel = mapLoader.convertToGameLevel(editorMapData);
```

## 📁 File Structure

```
📁 ProjectFighters/
├── map-creator.html          # Main launcher page
├── map-editor.html          # Advanced visual editor
├── js/
│   ├── map-editor.js        # Editor functionality
│   ├── map-integration.js   # Game integration
│   └── levels/
│       └── test-map-level.js # Example level format
└── MAP_CREATOR_README.md    # This file
```

## 🔧 Customization

### Adding New Element Types

1. **In the Editor**: Add new tool buttons to `map-editor.html`
2. **In the Renderer**: Add rendering logic to `drawElement()` function
3. **In the Game**: Update collision detection and game logic

### Custom Properties

Elements support custom properties for game-specific features:

```javascript
const customElement = {
    id: 'unique-id',
    type: 'custom_type',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    // Custom properties
    customProperty: 'value',
    behaviorSettings: {
        movable: true,
        destructible: false
    }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Maps not loading**: Check browser console for errors
2. **Elements not appearing**: Verify layer visibility is enabled
3. **Save/Load issues**: Check browser localStorage permissions
4. **Integration problems**: Ensure `map-integration.js` is loaded before use

### Debug Mode

Enable debug mode in the editor to see:
- Element boundaries
- Collision boxes
- Coordinate information
- Layer information

```javascript
mapEditor.config.showDebug = true;
```

## 🎯 Best Practices

### Level Design Tips

1. **Start with spawn points**: Place player spawns first
2. **Test collision**: Use the preview to check movement paths
3. **Balance difficulty**: Mix platforms, enemies, and hazards gradually
4. **Visual clarity**: Use different element types to create clear paths
5. **Performance**: Avoid too many small elements in one area

### Map Organization

1. **Use layers**: Keep similar elements on the same layer
2. **Naming convention**: Use descriptive names for spawn points and interactables
3. **Grid alignment**: Use snap-to-grid for consistent spacing
4. **Save frequently**: Use Ctrl+S to save your work regularly

## 🚀 Advanced Features

### Minimap Navigation
- Click on the minimap to jump to different areas
- Pink rectangle shows current viewport
- Useful for large levels

### Context Menu Actions
- **Copy/Duplicate**: Quickly replicate elements
- **Layer Management**: Move elements between layers
- **Property Editing**: Fine-tune element properties

### Zoom and Pan
- Mouse wheel zooms in/out
- Middle-click or pan tool for navigation
- Fit-to-view button centers all elements

## 📝 Contributing

To extend the map creator:

1. Fork the project
2. Add your feature to the appropriate file
3. Test with both editor and game integration
4. Update this README with new features
5. Submit a pull request

## 📄 License

This map creator system is part of the ProjectFighters game project. Use and modify according to your project's license.

---

**Happy Level Creating! 🎮✨**

For more help, use the Help button in the editor or check the browser console for debug information. 