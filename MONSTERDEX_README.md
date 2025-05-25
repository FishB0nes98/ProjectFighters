# MonsterDex - Project Fighters

A modern, responsive, and feature-rich monster encyclopedia for the Project Fighters Monster Tamers game.

## Features

### 🔍 **Advanced Search & Filtering**
- **Real-time search**: Search monsters by name, type, ability, moves, or description
- **Type filtering**: Filter monsters by their elemental types
- **Smart sorting**: Sort by ID, name, stats, or price
- **Instant results**: No page refresh needed

### 📱 **Responsive Design**
- **Mobile-first**: Optimized for all screen sizes
- **Dark theme**: Modern dark UI with vibrant accents
- **Grid/List views**: Switch between card grid and compact list views
- **Touch-friendly**: Designed for both desktop and mobile interaction

### 📊 **Detailed Monster Information**
- **Complete stats**: HP, Attack, Defense, Special Attack, Special Defense, Speed
- **Animated stat bars**: Visual representation with smooth animations
- **Move details**: Complete moveset with power, accuracy, PP, and descriptions
- **Ability information**: Detailed ability descriptions and effects
- **Physical stats**: Height, weight, and habitat information
- **Pricing**: In-game coin values

### 🎨 **Visual Excellence**
- **Type-based colors**: Each monster type has its unique color scheme
- **Smooth animations**: Hover effects, transitions, and loading states
- **Modal details**: Full-screen detailed views for each monster
- **Image gallery**: High-quality monster artwork
- **Professional typography**: Clean, readable fonts

### ⚡ **Performance & UX**
- **Fast loading**: Asynchronous data loading with loading indicators
- **Error handling**: Graceful error states and retry mechanisms
- **Keyboard navigation**: Full keyboard support (ESC to close modals)
- **Accessibility**: Screen reader friendly and high contrast
- **Local caching**: Efficient data management

## How to Use

### 1. **Browse Monsters**
- Open `monsterdex.html` in your browser
- Browse through the monster cards in the main grid
- Use the header stats to see total monsters and types available

### 2. **Search & Filter**
- Use the search bar to find specific monsters
- Select a type from the dropdown to filter by element
- Choose different sorting options to organize the results
- Clear search using the X button or by clearing the text

### 3. **View Details**
- Click on any monster card to open the detailed view
- Explore stats, abilities, moves, and habitat information
- Watch the animated stat bars show relative strengths
- Close the modal by clicking the X, clicking outside, or pressing ESC

### 4. **Switch Views**
- Use the grid/list toggle buttons to change the display format
- Grid view: Card-based layout perfect for browsing
- List view: Compact layout ideal for comparing monsters

## File Structure

```
├── monsterdex.html          # Main HTML file
├── css/
│   └── monsterdex.css       # Complete styling
├── js/
│   └── monsterdex.js        # Core functionality
└── Monsters/                # Monster data and images
    ├── *.json              # Individual monster data files
    └── *.png               # Monster artwork
```

## Technical Details

### **Dynamic Loading**
- Automatically discovers and loads all monster JSON files
- Handles missing files gracefully
- Supports hot-swapping of monster data

### **Type System**
- Supports all standard monster types (Fire, Water, Grass, Electric, etc.)
- Color-coded type badges for visual identification
- Type effectiveness calculations (utility function included)

### **Search Algorithm**
- Searches across all monster properties
- Includes fuzzy search capabilities
- Real-time filtering with debouncing for performance

### **Responsive Breakpoints**
- Desktop (1024px+): Full-featured layout
- Tablet (768px-1023px): Adjusted spacing and layout
- Mobile (480px-767px): Stacked layout and larger touch targets
- Small mobile (<480px): Single-column layout

## Customization

### **Adding New Monsters**
1. Create a new JSON file in the `Monsters/` directory
2. Follow the existing monster data structure
3. Add a corresponding PNG image with the monster's name
4. The MonsterDex will automatically detect and include the new monster

### **Styling**
- Modify CSS custom properties (variables) for quick theme changes
- All colors, spacing, and animations are centralized
- Mobile-first responsive design principles

### **Functionality**
- Extend the `MonsterDex` class for additional features
- Use `MonsterUtils` for stat calculations and utilities
- Implement `MonsterSearch` for advanced search features

## Browser Support

- **Modern browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile browsers**: iOS Safari 13+, Chrome Mobile 80+
- **Features used**: CSS Grid, Flexbox, ES6+ JavaScript, Fetch API

## Performance

- **Optimized loading**: Asynchronous monster data fetching
- **Smooth animations**: 60fps animations with GPU acceleration
- **Efficient rendering**: Virtual scrolling ready for large datasets
- **Memory management**: Proper cleanup and garbage collection

## Accessibility

- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Semantic HTML and ARIA labels
- **High contrast**: Dark theme with sufficient color contrast
- **Focus indicators**: Clear focus states for all interactive elements
- **Reduced motion**: Respects user motion preferences

---

**Built with ❤️ for Project Fighters Monster Tamers**

*Last updated: December 2024* 