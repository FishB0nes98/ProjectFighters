// Map Editor JavaScript
class MapEditor {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Editor state
        this.currentTool = 'select';
        this.currentElementType = null;
        this.isDrawing = false;
        this.isPanning = false;
        this.isDragging = false;
        this.selectedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Map state
        this.mapData = {
            id: 'custom-map-' + Date.now(),
            name: 'New Map',
            width: 19200,
            height: 1080,
            backgroundPath: 'UI/map.webp',
            boundaries: [
                // Basic ground level like in test-map-level.html
                {
                    id: 'default-ground',
                    type: 'ground',
                    x: 0,
                    y: 800,
                    width: 19200,
                    height: 280
                }
            ],
            spawnPoints: [],
            enemies: [],
            interactables: [],
            hazards: []
        };
        
        // View state
        this.camera = { x: 0, y: 0 };
        this.zoom = 0.5; // Start zoomed out to see more of the larger map
        this.gridSize = 20;
        this.showGrid = true;
        this.snapToGrid = true;
        
        // Layer visibility
        this.layerVisibility = {
            boundaries: true,
            characters: true,
            interactables: true,
            hazards: true
        };
        
        // Drawing state
        this.startPoint = null;
        this.previewElement = null;
        
        // Character reference
        this.showCharacter = true;
        this.characterSprite = null;
        this.characterPosition = { x: 200, y: 750 }; // Default position on ground
        this.characterSize = { width: 120, height: 120 }; // Default size, will be updated when sprite loads
        this.isCharacterSelected = false; // Track if character is selected
        this.characterDragOffset = { x: 0, y: 0 }; // For dragging character
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.setupLayers();
        this.handleURLParameters();
        this.loadCharacterSprite();
        this.render();
        this.updateMinimap();
        
        // Start with a good view of the map
        setTimeout(() => {
            this.centerView();
        }, 100);
        
        console.log('Map Editor initialized');
    }
    
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle template parameter
        const templateData = urlParams.get('template');
        if (templateData) {
            try {
                const template = JSON.parse(decodeURIComponent(templateData));
                this.loadTemplate(template);
            } catch (error) {
                console.error('Error loading template:', error);
            }
        }
        
        // Handle load parameter (for future file loading)
        const loadFile = urlParams.get('load');
        if (loadFile) {
            document.getElementById('statusText').textContent = `Ready to load: ${decodeURIComponent(loadFile)}`;
        }
    }
    
    loadTemplate(template) {
        this.mapData = {
            id: 'template-' + Date.now(),
            name: template.name || 'Template Map',
            width: template.width || 1920,
            height: template.height || 1080,
            backgroundPath: template.backgroundPath || 'UI/map.webp',
            boundaries: template.boundaries || [],
            spawnPoints: template.spawnPoints || [],
            enemies: template.enemies || [],
            interactables: template.interactables || [],
            hazards: template.hazards || []
        };
        
        // Add IDs to elements that don't have them
        this.addMissingIds();
        
        // Update UI
        document.getElementById('mapName').value = this.mapData.name;
        document.getElementById('mapWidth').value = this.mapData.width;
        document.getElementById('mapHeight').value = this.mapData.height;
        document.getElementById('mapBackground').value = this.mapData.backgroundPath;
        
        this.updateElementCount();
        this.updateCharacterPosition(); // Position character at spawn point
        this.centerView(); // Center the view on the loaded template
        document.getElementById('statusText').textContent = `Template loaded: ${this.mapData.name}`;
    }
    
    addMissingIds() {
        const allArrays = [
            this.mapData.boundaries,
            this.mapData.spawnPoints,
            this.mapData.enemies,
            this.mapData.interactables,
            this.mapData.hazards
        ];
        
        allArrays.forEach(array => {
            if (array) {
                array.forEach(element => {
                    if (!element.id) {
                        element.id = this.generateId();
                    }
                });
            }
        });
    }
    
    setupCanvas() {
        // Resize canvas to fit container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 120;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render();
        });
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        this.canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
        
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => {
            document.getElementById('contextMenu').style.display = 'none';
        });
    }
    
    setupToolbar() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                toolButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set current tool
                this.currentTool = btn.dataset.tool;
                this.currentElementType = btn.dataset.elementType || null;
                
                // Update cursor
                this.updateCursor();
                
                // Clear selection when switching tools
                this.selectedElement = null;
                this.hideElementProperties();
            });
        });
    }
    
    setupLayers() {
        const layerItems = document.querySelectorAll('.layer-item');
        layerItems.forEach(item => {
            const layerName = item.dataset.layer;
            const visibilityIcon = item.querySelector('.layer-visibility');
            
            // Toggle visibility
            visibilityIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.layerVisibility[layerName] = !this.layerVisibility[layerName];
                visibilityIcon.textContent = this.layerVisibility[layerName] ? '👁️' : '🚫';
                this.render();
            });
            
            // Select layer
            item.addEventListener('click', () => {
                layerItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
    
    updateCursor() {
        const cursors = {
            select: 'default',
            pan: 'grab',
            delete: 'crosshair',
            wall: 'crosshair',
            platform: 'crosshair',
            enemy: 'crosshair',
            spawn: 'crosshair'
        };
        this.canvas.style.cursor = cursors[this.currentTool] || 'crosshair';
    }
    
    // Mouse event handlers
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.camera.x) / this.zoom;
        const y = (e.clientY - rect.top - this.camera.y) / this.zoom;
        
        if (e.button === 0) { // Left click
            if (this.currentTool === 'select') {
                this.handleSelect(x, y, e);
            } else if (this.currentTool === 'pan') {
                this.handlePanStart(e);
            } else if (this.currentTool === 'delete') {
                this.handleDelete(x, y);
            } else if (this.currentElementType) {
                this.handleElementPlacement(x, y);
            }
        } else if (e.button === 1) { // Middle click - pan
            this.handlePanStart(e);
        }
        
        this.updateCoordinates(x, y);
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.camera.x) / this.zoom;
        const y = (e.clientY - rect.top - this.camera.y) / this.zoom;
        
        if (this.isPanning) {
            this.handlePan(e);
        } else if (this.isDragging && (this.selectedElement || this.isCharacterSelected)) {
            this.handleDrag(x, y);
        } else if (this.isDrawing) {
            this.handleDrawPreview(x, y);
        }
        
        this.updateCoordinates(x, y);
        this.updateTooltip(e, x, y);
        
        // Update cursor based on what we're hovering over
        if (this.currentTool === 'select' && !this.isDragging) {
            if (this.showCharacter && this.isPointInCharacter(x, y)) {
                this.canvas.style.cursor = 'move';
            } else if (this.getElementAt(x, y)) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }
    
    onMouseUp(e) {
        if (this.isDrawing) {
            this.finishDrawing();
        }
        
        this.isPanning = false;
        this.isDragging = false;
        this.isDrawing = false;
        this.previewElement = null;
        this.canvas.style.cursor = this.currentTool === 'pan' ? 'grab' : 'default';
        
        // Update cursor based on current tool when dragging ends
        this.updateCursor();
    }
    
    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, this.zoom * zoomFactor));
        
        // Zoom towards mouse position
        const zoomChange = newZoom / this.zoom;
        this.camera.x = mouseX - (mouseX - this.camera.x) * zoomChange;
        this.camera.y = mouseY - (mouseY - this.camera.y) * zoomChange;
        
        this.zoom = newZoom;
        this.updateZoomDisplay();
        this.render();
        this.updateMinimap();
    }
    
    onRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.camera.x) / this.zoom;
        const y = (e.clientY - rect.top - this.camera.y) / this.zoom;
        
        const element = this.getElementAt(x, y);
        if (element) {
            this.selectedElement = element;
            this.showContextMenu(e.clientX, e.clientY);
        }
    }
    
    onKeyDown(e) {
        switch (e.key) {
            case 'Delete':
                if (this.selectedElement) {
                    this.deleteSelectedElement();
                }
                break;
            case 'Escape':
                this.selectedElement = null;
                this.hideElementProperties();
                this.render();
                break;
            case 'g':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleGrid();
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveMap();
                }
                break;
            case 'z':
                if (e.ctrlKey) {
                    e.preventDefault();
                    // TODO: Implement undo/redo
                }
                break;
        }
    }
    
    onKeyUp(e) {
        // Handle key up events if needed
    }
    
    // Tool handlers
    handleSelect(x, y, e) {
        // First check if clicking on character reference
        if (this.showCharacter && this.isPointInCharacter(x, y)) {
            console.log('Character selected for dragging');
            this.isCharacterSelected = true;
            this.selectedElement = null;
            this.showCharacterProperties();
            this.isDragging = true;
            this.characterDragOffset = {
                x: x - this.characterPosition.x,
                y: y - this.characterPosition.y
            };
            console.log(`Character drag offset: (${this.characterDragOffset.x}, ${this.characterDragOffset.y})`);
            this.render();
            return;
        }
        
        // Then check for regular elements
        const element = this.getElementAt(x, y);
        
        if (element) {
            this.selectedElement = element;
            this.isCharacterSelected = false;
            this.showElementProperties(element);
            this.isDragging = true;
            this.dragOffset = {
                x: x - element.x,
                y: y - element.y
            };
        } else {
            this.selectedElement = null;
            this.isCharacterSelected = false;
            this.hideElementProperties();
        }
        
        this.render();
    }
    
    handlePanStart(e) {
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }
    
    handlePan(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanPoint.x;
            const dy = e.clientY - this.lastPanPoint.y;
            
            this.camera.x += dx;
            this.camera.y += dy;
            
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.render();
            this.updateMinimap();
        }
    }
    
    handleDrag(x, y) {
        if (this.isCharacterSelected && this.isDragging) {
            // Handle character dragging
            console.log(`Dragging character to (${Math.round(x)}, ${Math.round(y)})`);
            const newX = x - this.characterDragOffset.x;
            const newY = y - this.characterDragOffset.y;
            
            if (this.snapToGrid) {
                this.characterPosition.x = Math.round(newX / this.gridSize) * this.gridSize;
                this.characterPosition.y = Math.round(newY / this.gridSize) * this.gridSize;
            } else {
                this.characterPosition.x = newX;
                this.characterPosition.y = newY;
            }
            
            console.log(`Character moved to (${Math.round(this.characterPosition.x)}, ${Math.round(this.characterPosition.y)})`);
            this.updateCharacterPropertyInputs();
            this.render();
        } else if (this.selectedElement && this.isDragging) {
            // Handle element dragging
            const newX = x - this.dragOffset.x;
            const newY = y - this.dragOffset.y;
            
            if (this.snapToGrid) {
                this.selectedElement.x = Math.round(newX / this.gridSize) * this.gridSize;
                this.selectedElement.y = Math.round(newY / this.gridSize) * this.gridSize;
            } else {
                this.selectedElement.x = newX;
                this.selectedElement.y = newY;
            }
            
            this.updateElementPropertyInputs();
            this.render();
        }
    }
    
    handleDelete(x, y) {
        const element = this.getElementAt(x, y);
        if (element) {
            this.removeElement(element);
            this.render();
            this.updateElementCount();
        }
    }
    
    handleElementPlacement(x, y) {
        // For spawn points and single-click elements, create immediately
        if (['spawn', 'enemy', 'boss', 'checkpoint', 'health_potion', 'switch', 'treasure', 'portal'].includes(this.currentElementType)) {
            const defaultSize = this.currentElementType === 'spawn' ? 40 : 50;
            const snapX = this.snapToGrid ? Math.round(x / this.gridSize) * this.gridSize : x;
            let snapY = this.snapToGrid ? Math.round(y / this.gridSize) * this.gridSize : y;
            
            // Auto-place characters on ground level if clicked near it
            if (this.currentElementType === 'spawn' || this.currentElementType === 'enemy' || this.currentElementType === 'boss') {
                if (snapY > 720 && snapY < 900) { // If near ground level (800)
                    snapY = 750; // Standard ground character position
                }
            }
            
            const element = {
                id: this.generateId(),
                type: this.currentElementType,
                x: snapX - defaultSize/2,
                y: snapY - defaultSize/2,
                width: defaultSize,
                height: defaultSize
            };
            
            // Add type-specific properties
            if (this.currentElementType === 'enemy' || this.currentElementType === 'boss') {
                element.enemyType = this.currentElementType === 'boss' ? 'boss' : 'basic';
                element.health = this.currentElementType === 'boss' ? 200 : 100;
                element.damage = this.currentElementType === 'boss' ? 25 : 10;
            } else if (this.currentElementType === 'spawn') {
                element.name = `Spawn Point ${this.getElementsByType('spawn').length + 1}`;
            } else if (['checkpoint', 'health_potion', 'switch', 'door', 'treasure', 'portal'].includes(this.currentElementType)) {
                element.action = this.getDefaultAction(this.currentElementType);
            }
            
            this.addElement(element);
            this.updateElementCount();
            
            // Update character position if this is the first spawn point
            if (this.currentElementType === 'spawn') {
                this.updateCharacterPosition();
            }
            
            this.render();
            document.getElementById('statusText').textContent = `${this.currentElementType} placed`;
            return;
        }
        
        if (!this.isDrawing) {
            // Start drawing for other elements
            this.isDrawing = true;
            this.startPoint = this.snapToGrid ? {
                x: Math.round(x / this.gridSize) * this.gridSize,
                y: Math.round(y / this.gridSize) * this.gridSize
            } : { x, y };
        }
    }
    
    handleDrawPreview(x, y) {
        if (this.isDrawing && this.startPoint) {
            const endPoint = this.snapToGrid ? {
                x: Math.round(x / this.gridSize) * this.gridSize,
                y: Math.round(y / this.gridSize) * this.gridSize
            } : { x, y };
            
            this.previewElement = this.createElementFromPoints(this.startPoint, endPoint);
            this.render();
        }
    }
    
    finishDrawing() {
        if (this.previewElement) {
            // Minimum size check
            if (this.previewElement.width >= 10 && this.previewElement.height >= 10) {
                this.addElement(this.previewElement);
                this.updateElementCount();
            }
            this.previewElement = null;
            this.render();
        }
    }
    
    createElementFromPoints(start, end) {
        const element = {
            id: this.generateId(),
            type: this.currentElementType,
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y)
        };
        
        // Add type-specific properties
        if (this.currentElementType === 'enemy' || this.currentElementType === 'boss') {
            element.enemyType = this.currentElementType === 'boss' ? 'boss' : 'basic';
            element.health = this.currentElementType === 'boss' ? 200 : 100;
            element.damage = this.currentElementType === 'boss' ? 25 : 10;
        } else if (this.currentElementType === 'spawn') {
            element.name = `Spawn Point ${this.getElementsByType('spawn').length + 1}`;
        } else if (['checkpoint', 'health_potion', 'switch', 'door', 'treasure', 'portal'].includes(this.currentElementType)) {
            element.action = this.getDefaultAction(this.currentElementType);
        }
        
        return element;
    }
    
    getDefaultAction(type) {
        const actions = {
            checkpoint: 'save',
            health_potion: 'heal',
            switch: 'activate',
            door: 'open',
            treasure: 'collect',
            portal: 'teleport'
        };
        return actions[type] || 'interact';
    }
    
    // Element management
    addElement(element) {
        const category = this.getElementCategory(element.type);
        if (!this.mapData[category]) {
            this.mapData[category] = [];
        }
        this.mapData[category].push(element);
    }
    
    removeElement(element) {
        const category = this.getElementCategory(element.type);
        const array = this.mapData[category];
        if (array) {
            const index = array.indexOf(element);
            if (index > -1) {
                array.splice(index, 1);
            }
        }
        
        if (this.selectedElement === element) {
            this.selectedElement = null;
            this.hideElementProperties();
        }
    }
    
    getElementCategory(type) {
        const categories = {
            wall: 'boundaries',
            platform: 'boundaries',
            ground: 'boundaries',
            ceiling: 'boundaries',
            ramp_up: 'boundaries',
            ramp_down: 'boundaries',
            ice_platform: 'boundaries',
            lava_platform: 'boundaries',
            weak_platform: 'boundaries',
            crystal: 'boundaries',
            stalactite: 'boundaries',
            pillar: 'boundaries',
            spawn: 'spawnPoints',
            enemy: 'enemies',
            boss: 'enemies',
            checkpoint: 'interactables',
            health_potion: 'interactables',
            switch: 'interactables',
            door: 'interactables',
            treasure: 'interactables',
            portal: 'interactables',
            hazard: 'hazards',
            spikes: 'hazards',
            pit: 'hazards'
        };
        return categories[type] || 'boundaries';
    }
    
    getElementAt(x, y) {
        // Check all elements in reverse order (top to bottom)
        const allElements = this.getAllElements().reverse();
        
        for (const element of allElements) {
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }
    
    getAllElements() {
        return [
            ...this.mapData.boundaries,
            ...this.mapData.spawnPoints,
            ...this.mapData.enemies,
            ...this.mapData.interactables,
            ...this.mapData.hazards
        ].filter(Boolean);
    }
    
    getElementsByType(type) {
        return this.getAllElements().filter(el => el.type === type);
    }
    
    generateId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Rendering
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw background
        this.drawBackground();
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw elements by layer
        if (this.layerVisibility.boundaries) {
            this.drawElements(this.mapData.boundaries, 'boundary');
        }
        if (this.layerVisibility.characters) {
            this.drawElements(this.mapData.spawnPoints, 'spawn');
            this.drawElements(this.mapData.enemies, 'enemy');
        }
        if (this.layerVisibility.interactables) {
            this.drawElements(this.mapData.interactables, 'interactable');
        }
        if (this.layerVisibility.hazards) {
            this.drawElements(this.mapData.hazards, 'hazard');
        }
        
        // Draw preview element
        if (this.previewElement) {
            this.drawElement(this.previewElement, 'preview');
        }
        
        // Draw character reference
        if (this.showCharacter) {
            this.drawCharacterReference();
        }
        
        // Highlight selected element
        if (this.selectedElement) {
            this.drawSelectionHighlight(this.selectedElement);
        }
        
        this.ctx.restore();
    }
    
    drawBackground() {
        // Draw a simple grid background for now
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.mapData.width, this.mapData.height);
        
        // Draw border
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.mapData.width, this.mapData.height);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.mapData.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.mapData.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.mapData.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.mapData.width, y);
            this.ctx.stroke();
        }
    }
    
    drawElements(elements, category) {
        if (!elements) return;
        
        elements.forEach(element => {
            this.drawElement(element, category);
        });
    }
    
    drawElement(element, category) {
        const colors = this.getElementColors(element.type);
        
        // Draw element
        this.ctx.fillStyle = colors.fill;
        this.ctx.strokeStyle = colors.stroke;
        this.ctx.lineWidth = 2;
        
        this.ctx.fillRect(element.x, element.y, element.width, element.height);
        this.ctx.strokeRect(element.x, element.y, element.width, element.height);
        
        // Draw icon or text
        this.drawElementIcon(element);
    }
    
    drawElementIcon(element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${Math.min(element.width, element.height) * 0.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const icons = {
            wall: '🧱',
            platform: '📋',
            ground: '🌍',
            ceiling: '🔝',
            ramp_up: '📈',
            ramp_down: '📉',
            ice_platform: '🧊',
            lava_platform: '🌋',
            weak_platform: '💥',
            crystal: '💎',
            stalactite: '🪨',
            pillar: '🏛️',
            spawn: '🏁',
            enemy: '👹',
            boss: '👺',
            checkpoint: '🚩',
            health_potion: '🧪',
            switch: '🔘',
            door: '🚪',
            treasure: '📦',
            portal: '🌀',
            hazard: '⚠️',
            spikes: '⚡',
            pit: '🕳️'
        };
        
        const icon = icons[element.type] || '❓';
        this.ctx.fillText(icon, centerX, centerY);
    }
    
    getElementColors(type) {
        const colors = {
            wall: { fill: 'rgba(139, 69, 19, 0.7)', stroke: '#8b4513' },
            platform: { fill: 'rgba(34, 139, 34, 0.7)', stroke: '#228b22' },
            ground: { fill: 'rgba(101, 67, 33, 0.7)', stroke: '#654321' },
            ceiling: { fill: 'rgba(105, 105, 105, 0.7)', stroke: '#696969' },
            ramp_up: { fill: 'rgba(255, 165, 0, 0.7)', stroke: '#ffa500' },
            ramp_down: { fill: 'rgba(255, 140, 0, 0.7)', stroke: '#ff8c00' },
            ice_platform: { fill: 'rgba(173, 216, 230, 0.7)', stroke: '#add8e6' },
            lava_platform: { fill: 'rgba(255, 69, 0, 0.7)', stroke: '#ff4500' },
            weak_platform: { fill: 'rgba(255, 255, 0, 0.7)', stroke: '#ffff00' },
            crystal: { fill: 'rgba(147, 0, 211, 0.7)', stroke: '#9300d3' },
            stalactite: { fill: 'rgba(128, 128, 128, 0.7)', stroke: '#808080' },
            pillar: { fill: 'rgba(169, 169, 169, 0.7)', stroke: '#a9a9a9' },
            spawn: { fill: 'rgba(0, 255, 0, 0.7)', stroke: '#00ff00' },
            enemy: { fill: 'rgba(255, 69, 0, 0.7)', stroke: '#ff4500' },
            boss: { fill: 'rgba(139, 0, 0, 0.7)', stroke: '#8b0000' },
            checkpoint: { fill: 'rgba(255, 105, 180, 0.7)', stroke: '#ff69b4' },
            health_potion: { fill: 'rgba(0, 255, 127, 0.7)', stroke: '#00ff7f' },
            switch: { fill: 'rgba(255, 20, 147, 0.7)', stroke: '#ff1493' },
            door: { fill: 'rgba(160, 82, 45, 0.7)', stroke: '#a0522d' },
            treasure: { fill: 'rgba(255, 215, 0, 0.7)', stroke: '#ffd700' },
            portal: { fill: 'rgba(138, 43, 226, 0.7)', stroke: '#8a2be2' },
            hazard: { fill: 'rgba(255, 0, 0, 0.7)', stroke: '#ff0000' },
            spikes: { fill: 'rgba(220, 20, 60, 0.7)', stroke: '#dc143c' },
            pit: { fill: 'rgba(0, 0, 0, 0.7)', stroke: '#000000' }
        };
        
        return colors[type] || { fill: 'rgba(128, 128, 128, 0.7)', stroke: '#808080' };
    }
    
    drawSelectionHighlight(element) {
        this.ctx.strokeStyle = '#ff69b4';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        this.ctx.setLineDash([]);
        
        // Draw resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#ff69b4';
        
        // Corner handles
        this.ctx.fillRect(element.x - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
    }
    
    drawCharacterReference() {
        const x = this.characterPosition.x;
        const y = this.characterPosition.y;
        const width = this.characterSize.width;
        const height = this.characterSize.height;
        
        // Draw character sprite if loaded
        if (this.characterSprite && this.characterSprite.complete) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.8; // Semi-transparent
            
            // Get frame count from input or use default
            const frameCount = parseInt(document.getElementById('spriteFrames')?.value) || 9;
            
            // Assume 3x3 grid layout for 9 frames (common for sprite sheets)
            const cols = 3;
            const rows = Math.ceil(frameCount / cols);
            
            // Calculate actual frame dimensions for grid layout
            const frameWidth = this.characterSprite.width / cols;
            const frameHeight = this.characterSprite.height / rows;
            
            console.log(`Frame count: ${frameCount}`);
            console.log(`Grid layout: ${cols}x${rows}`);
            console.log(`Each frame dimensions: ${frameWidth}x${frameHeight}`);
            
            // For the 1024x1024 sprite sheet with 9 frames in 3x3 grid
            // Each frame is ~341x341 pixels
            // Scale it down to a reasonable editor size while maintaining aspect ratio
            const targetSize = 120; // Reasonable size for editor (square frames)
            const scale = targetSize / Math.max(frameWidth, frameHeight);
            
            this.characterSize.width = frameWidth * scale;
            this.characterSize.height = frameHeight * scale;
            
            // Ensure minimum readable size
            if (this.characterSize.width < 30 || this.characterSize.height < 30) {
                const minScale = 30 / Math.min(frameWidth, frameHeight);
                this.characterSize.width = frameWidth * minScale;
                this.characterSize.height = frameHeight * minScale;
                console.log(`Applied minimum size scaling: ${minScale.toFixed(3)}`);
            }
            
            // Get the first frame (top-left, position 0,0 in grid)
            const frameIndex = 0; // First frame
            const frameCol = frameIndex % cols;
            const frameRow = Math.floor(frameIndex / cols);
            
            // Calculate source rectangle for the specific frame
            const sourceX = frameCol * frameWidth;
            const sourceY = frameRow * frameHeight;
            const sourceWidth = frameWidth;
            const sourceHeight = frameHeight;
            
            console.log(`Sprite sheet: ${this.characterSprite.width}x${this.characterSprite.height}`);
            console.log(`Grid layout: ${cols}x${rows}, Frame size: ${frameWidth}x${frameHeight}`);
            console.log(`Drawing frame ${frameIndex} (${frameCol},${frameRow}): source(${sourceX}, ${sourceY}, ${sourceWidth}, ${sourceHeight})`);
            
            this.ctx.drawImage(
                this.characterSprite,
                sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle (specific frame)
                x - width/2, y - height/2, width, height // Destination rectangle (centered)
            );
            this.ctx.restore();
        } else {
            // Draw placeholder if sprite not loaded
            this.ctx.save();
            this.ctx.globalAlpha = 0.7;
            
            // Draw character body
            this.ctx.fillStyle = '#ff69b4';
            this.ctx.fillRect(x - width/2, y - height/2, width, height);
            
            // Draw character outline
            this.ctx.strokeStyle = '#ff1493';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - width/2, y - height/2, width, height);
            
            // Draw simple face
            this.ctx.fillStyle = '#fff';
            const eyeSize = Math.max(4, width * 0.08);
            const eyeY = y - height * 0.2;
            this.ctx.fillRect(x - width * 0.15, eyeY, eyeSize, eyeSize); // Left eye
            this.ctx.fillRect(x + width * 0.05, eyeY, eyeSize, eyeSize);  // Right eye
            this.ctx.fillRect(x - width * 0.1, y + height * 0.05, width * 0.2, Math.max(2, height * 0.04)); // Smile
            
            this.ctx.restore();
        }
        
        // Draw selection highlight if character is selected
        if (this.isCharacterSelected) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(x - width/2 - 2, y - height/2 - 2, width + 4, height + 4);
            this.ctx.setLineDash([]);
            
            // Draw resize handles for character
            const handleSize = 8;
            this.ctx.fillStyle = '#00ff00';
            
            // Corner handles
            this.ctx.fillRect(x - width/2 - handleSize/2, y - height/2 - handleSize/2, handleSize, handleSize);
            this.ctx.fillRect(x + width/2 - handleSize/2, y - height/2 - handleSize/2, handleSize, handleSize);
            this.ctx.fillRect(x - width/2 - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
            this.ctx.fillRect(x + width/2 - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
        }
        
        // Draw character label
        this.ctx.save();
        this.ctx.fillStyle = this.isCharacterSelected ? '#00ff00' : '#fff';
        this.ctx.font = `${Math.max(10, Math.min(14, width * 0.12))}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Character Reference (Frame 1)', x, y - height/2 - 15);
        
        // Show actual vs display size
        const actualFrameWidth = this.characterSprite && this.characterSprite.complete ? 
            Math.round(this.characterSprite.width / 3) : 'N/A'; // 3x3 grid
        const actualFrameHeight = this.characterSprite && this.characterSprite.complete ? 
            Math.round(this.characterSprite.height / 3) : 'N/A'; // 3x3 grid
        
        this.ctx.font = `${Math.max(8, Math.min(12, width * 0.1))}px Arial`;
        this.ctx.fillText(`Display: ${Math.round(width)}x${Math.round(height)}`, x, y + height/2 + 15);
        this.ctx.fillText(`Frame Size: ${actualFrameWidth}x${actualFrameHeight}`, x, y + height/2 + 30);
        this.ctx.restore();
    }
    
    updateMinimap() {
        this.minimapCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        const scaleX = this.minimapCanvas.width / this.mapData.width;
        const scaleY = this.minimapCanvas.height / this.mapData.height;
        const scale = Math.min(scaleX, scaleY);
        
        this.minimapCtx.save();
        this.minimapCtx.scale(scale, scale);
        
        // Draw elements
        this.getAllElements().forEach(element => {
            const colors = this.getElementColors(element.type);
            this.minimapCtx.fillStyle = colors.fill;
            this.minimapCtx.fillRect(element.x, element.y, element.width, element.height);
        });
        
        this.minimapCtx.restore();
        
        // Draw viewport indicator
        const viewX = (-this.camera.x / this.zoom) * scale;
        const viewY = (-this.camera.y / this.zoom) * scale;
        const viewW = (this.canvas.width / this.zoom) * scale;
        const viewH = (this.canvas.height / this.zoom) * scale;
        
        this.minimapCtx.strokeStyle = '#ff69b4';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.strokeRect(viewX, viewY, viewW, viewH);
    }
    
    // UI Updates
    updateCoordinates(x, y) {
        document.getElementById('coords').textContent = `${Math.round(x)}, ${Math.round(y)}`;
    }
    
    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
    }
    
    updateElementCount() {
        const count = this.getAllElements().length;
        document.getElementById('elementCount').textContent = count;
    }
    
    updateTooltip(e, x, y) {
        const tooltip = document.getElementById('tooltip');
        
        // Check for character reference first
        if (this.showCharacter && this.isPointInCharacter(x, y)) {
            tooltip.textContent = `Character Reference (${Math.round(this.characterPosition.x)}, ${Math.round(this.characterPosition.y)}) ${Math.round(this.characterSize.width)}x${Math.round(this.characterSize.height)}`;
            tooltip.style.left = e.clientX + 10 + 'px';
            tooltip.style.top = e.clientY - 30 + 'px';
            tooltip.style.display = 'block';
            return;
        }
        
        // Check for regular elements
        const element = this.getElementAt(x, y);
        
        if (element) {
            tooltip.textContent = `${element.type} (${Math.round(element.x)}, ${Math.round(element.y)}) ${element.width}x${element.height}`;
            tooltip.style.left = e.clientX + 10 + 'px';
            tooltip.style.top = e.clientY - 30 + 'px';
            tooltip.style.display = 'block';
        } else {
            tooltip.style.display = 'none';
        }
    }
    
    // Element Properties
    showElementProperties(element) {
        document.getElementById('elementProperties').style.display = 'block';
        document.getElementById('elementType').value = element.type;
        document.getElementById('elementX').value = element.x;
        document.getElementById('elementY').value = element.y;
        document.getElementById('elementWidth').value = element.width;
        document.getElementById('elementHeight').value = element.height;
        
        // Show type-specific properties
        const enemyProps = document.getElementById('enemyProperties');
        const interactableAction = document.getElementById('interactableAction');
        
        enemyProps.style.display = (element.type === 'enemy' || element.type === 'boss') ? 'flex' : 'none';
        interactableAction.style.display = element.action ? 'flex' : 'none';
        
        if (element.enemyType) {
            document.getElementById('enemyType').value = element.enemyType;
        }
        if (element.action) {
            document.getElementById('actionType').value = element.action;
        }
    }
    
    hideElementProperties() {
        document.getElementById('elementProperties').style.display = 'none';
    }
    
    updateElementPropertyInputs() {
        if (this.selectedElement) {
            document.getElementById('elementX').value = this.selectedElement.x;
            document.getElementById('elementY').value = this.selectedElement.y;
        }
    }
    
    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
    }
    
    centerView() {
        this.camera.x = this.canvas.width / 2 - (this.mapData.width * this.zoom) / 2;
        this.camera.y = this.canvas.height / 2 - (this.mapData.height * this.zoom) / 2;
        this.render();
        this.updateMinimap();
    }
    
    fitToView() {
        const scaleX = this.canvas.width / this.mapData.width;
        const scaleY = this.canvas.height / this.mapData.height;
        this.zoom = Math.min(scaleX, scaleY) * 0.9;
        this.updateZoomDisplay();
        this.centerView();
    }
    
    loadCharacterSprite() {
        // Load the character sprite - try multiple possible paths
        this.characterSprite = new Image();
        const spritePaths = [
            'UI/20250531_2250_Pixel Art Movesheet_remix_01jwm1q60zek48ptnx3d7ckhey.png',
            '20250531_2250_Pixel Art Movesheet_remix_01jwm1q60zek48ptnx3d7ckhey.png',
            'UI/idle.png',
            'UI/character.png',
            'sprites/character.png'
        ];
        
        let currentPathIndex = 0;
        
        const tryLoadSprite = () => {
            if (currentPathIndex >= spritePaths.length) {
                console.warn('Could not load any character sprite, using placeholder');
                return;
            }
            
            this.characterSprite.src = spritePaths[currentPathIndex];
        };
        
        this.characterSprite.onload = () => {
            console.log(`Character sprite loaded: ${spritePaths[currentPathIndex]}`);
            console.log(`Sprite dimensions: ${this.characterSprite.width}x${this.characterSprite.height}`);
            
            // Get frame count from input or use default
            const frameCount = parseInt(document.getElementById('spriteFrames')?.value) || 9;
            
            // Assume 3x3 grid layout for 9 frames (common for sprite sheets)
            const cols = 3;
            const rows = Math.ceil(frameCount / cols);
            
            // Calculate actual frame dimensions for grid layout
            const frameWidth = this.characterSprite.width / cols;
            const frameHeight = this.characterSprite.height / rows;
            
            console.log(`Frame count: ${frameCount}`);
            console.log(`Grid layout: ${cols}x${rows}`);
            console.log(`Each frame dimensions: ${frameWidth}x${frameHeight}`);
            
            // For the 1024x1024 sprite sheet with 9 frames in 3x3 grid
            // Each frame is ~341x341 pixels
            // Scale it down to a reasonable editor size while maintaining aspect ratio
            const targetSize = 120; // Reasonable size for editor (square frames)
            const scale = targetSize / Math.max(frameWidth, frameHeight);
            
            this.characterSize.width = frameWidth * scale;
            this.characterSize.height = frameHeight * scale;
            
            // Ensure minimum readable size
            if (this.characterSize.width < 30 || this.characterSize.height < 30) {
                const minScale = 30 / Math.min(frameWidth, frameHeight);
                this.characterSize.width = frameWidth * minScale;
                this.characterSize.height = frameHeight * minScale;
                console.log(`Applied minimum size scaling: ${minScale.toFixed(3)}`);
            }
            
            console.log(`Character display size: ${Math.round(this.characterSize.width)}x${Math.round(this.characterSize.height)}`);
            console.log(`Scale factor: ${scale.toFixed(3)}`);
            console.log(`First frame source rect: (0, 0, ${frameWidth}, ${frameHeight})`);
            
            this.render(); // Re-render when sprite loads
        };
        
        this.characterSprite.onerror = () => {
            currentPathIndex++;
            if (currentPathIndex < spritePaths.length) {
                console.warn(`Failed to load ${spritePaths[currentPathIndex - 1]}, trying ${spritePaths[currentPathIndex]}`);
                tryLoadSprite();
            } else {
                console.warn('Could not load any character sprite, using placeholder');
            }
        };
        
        tryLoadSprite();
    }
    
    isPointInCharacter(x, y) {
        if (!this.showCharacter) return false;
        
        const charX = this.characterPosition.x;
        const charY = this.characterPosition.y;
        const width = this.characterSize.width;
        const height = this.characterSize.height;
        
        const isInside = x >= charX - width/2 && x <= charX + width/2 &&
                         y >= charY - height/2 && y <= charY + height/2;
        
        // Debug logging (only on first detection to avoid spam)
        if (isInside && !this.lastCharacterHover) {
            console.log(`Character hover detected at (${Math.round(x)}, ${Math.round(y)})`);
            console.log(`Character bounds: (${Math.round(charX - width/2)}, ${Math.round(charY - height/2)}) to (${Math.round(charX + width/2)}, ${Math.round(charY + height/2)})`);
        }
        this.lastCharacterHover = isInside;
        
        return isInside;
    }
    
    showCharacterProperties() {
        document.getElementById('elementProperties').style.display = 'block';
        document.getElementById('elementType').value = 'character_reference';
        document.getElementById('elementX').value = Math.round(this.characterPosition.x);
        document.getElementById('elementY').value = Math.round(this.characterPosition.y);
        document.getElementById('elementWidth').value = Math.round(this.characterSize.width);
        document.getElementById('elementHeight').value = Math.round(this.characterSize.height);
        
        // Hide type-specific properties for character
        document.getElementById('enemyProperties').style.display = 'none';
        document.getElementById('interactableAction').style.display = 'none';
    }
    
    updateCharacterPropertyInputs() {
        if (this.isCharacterSelected) {
            document.getElementById('elementX').value = Math.round(this.characterPosition.x);
            document.getElementById('elementY').value = Math.round(this.characterPosition.y);
        }
    }
    
    updateCharacterPosition() {
        // Position character at first spawn point if available
        if (this.mapData.spawnPoints.length > 0) {
            this.characterPosition.x = this.mapData.spawnPoints[0].x;
            this.characterPosition.y = this.mapData.spawnPoints[0].y;
        }
    }
}

// Global functions for UI buttons
let mapEditor;

function init() {
    mapEditor = new MapEditor();
}

function newMap() {
    if (!mapEditor) return;
    if (confirm('Create a new map? This will clear the current map.')) {
        mapEditor.mapData = {
            id: 'custom-map-' + Date.now(),
            name: 'New Map',
            width: 19200,
            height: 1080,
            backgroundPath: 'UI/map.webp',
            boundaries: [
                // Basic ground level like in test-map-level.html
                {
                    id: 'default-ground',
                    type: 'ground',
                    x: 0,
                    y: 800,
                    width: 19200,
                    height: 280
                }
            ],
            spawnPoints: [],
            enemies: [],
            interactables: [],
            hazards: []
        };
        mapEditor.selectedElement = null;
        mapEditor.hideElementProperties();
        mapEditor.render();
        mapEditor.updateElementCount();
        document.getElementById('statusText').textContent = 'New map created with basic ground level';
    }
}

function saveMap() {
    if (!mapEditor) return;
    const mapData = JSON.stringify(mapEditor.mapData, null, 2);
    const blob = new Blob([mapData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapEditor.mapData.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    document.getElementById('statusText').textContent = 'Map saved successfully';
}

function loadMap(event) {
    if (!mapEditor) return;
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const mapData = JSON.parse(e.target.result);
            mapEditor.mapData = mapData;
            mapEditor.selectedElement = null;
            mapEditor.hideElementProperties();
            mapEditor.render();
            mapEditor.updateElementCount();
            document.getElementById('statusText').textContent = `Loaded: ${mapData.name}`;
            
            // Update map settings UI
            document.getElementById('mapName').value = mapData.name || 'New Map';
            document.getElementById('mapWidth').value = mapData.width || 1920;
            document.getElementById('mapHeight').value = mapData.height || 1080;
            document.getElementById('mapBackground').value = mapData.backgroundPath || 'UI/map.webp';
        } catch (error) {
            alert('Error loading map file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function exportToJS() {
    if (!mapEditor) return;
    const jsCode = generateLevelJS(mapEditor.mapData);
    
    const blob = new Blob([jsCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapEditor.mapData.name.replace(/\s+/g, '_')}_level.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    document.getElementById('statusText').textContent = 'Level exported as JavaScript';
}

function generateLevelJS(mapData) {
    const sanitizedName = mapData.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `// ${mapData.name} Level Configuration
// Generated by ProjectFighters Map Editor

const ${sanitizedName}Level = {
    id: '${mapData.id}',
    name: '${mapData.name}',
    description: 'Custom level created with the map editor',
    
    // Background and visual settings
    backgroundPath: '${mapData.backgroundPath}',
    width: ${mapData.width},
    height: ${mapData.height},
    
    // Spawn points for players/characters
    spawnPoints: ${JSON.stringify(mapData.spawnPoints, null, 8)},
    
    // Collision boundaries
    boundaries: ${JSON.stringify(mapData.boundaries, null, 8)},
    
    // Interactive elements
    interactables: ${JSON.stringify(mapData.interactables, null, 8)},
    
    // Enemy configurations
    enemies: ${JSON.stringify(mapData.enemies, null, 8)},
    
    // Hazard areas
    hazards: ${JSON.stringify(mapData.hazards, null, 8)},
    
    // Camera settings
    camera: {
        followPlayer: true,
        smoothing: 0.1,
        bounds: {
            minX: 0,
            maxX: ${mapData.width},
            minY: 0,
            maxY: ${mapData.height}
        }
    },
    
    // Game mode specific settings
    gameMode: {
        type: 'custom',
        maxPlayers: 4,
        respawnEnabled: true,
        respawnTime: 3000
    },
    
    // Level-specific rules
    rules: {
        allowFlying: false,
        allowWallJumping: true,
        gravity: 0.8,
        friction: 0.85,
        groundLevel: ${mapData.height - 300},
        jumpHeight: 150,
        terminalVelocity: 15
    },
    
    // Debug settings
    showDebug: false,
    showSpawnPoints: false,
    showBoundaries: false,
    showGrid: false
};

// Export the level configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ${sanitizedName}Level;
} else if (typeof window !== 'undefined') {
    window.${sanitizedName}Level = ${sanitizedName}Level;
}`;
}

function toggleGrid() {
    if (!mapEditor) return;
    mapEditor.showGrid = !mapEditor.showGrid;
    mapEditor.render();
    document.getElementById('statusText').textContent = `Grid ${mapEditor.showGrid ? 'enabled' : 'disabled'}`;
}

function toggleSnap() {
    if (!mapEditor) return;
    mapEditor.snapToGrid = !mapEditor.snapToGrid;
    document.getElementById('statusText').textContent = `Snap to grid ${mapEditor.snapToGrid ? 'enabled' : 'disabled'}`;
}

function toggleCharacter() {
    if (!mapEditor) return;
    mapEditor.showCharacter = !mapEditor.showCharacter;
    mapEditor.render();
    document.getElementById('statusText').textContent = `Character reference ${mapEditor.showCharacter ? 'enabled' : 'disabled'}`;
}

function testMap() {
    if (!mapEditor) return;
    // Check if we have spawn points
    if (mapEditor.mapData.spawnPoints.length === 0) {
        alert('⚠️ Please add at least one spawn point before testing the map!');
        return;
    }
    
    // Save the current map to localStorage for testing
    const mapId = mapEditor.mapData.id;
    const success = window.mapLoader?.saveMapToStorage(mapEditor.mapData);
    
    if (success) {
        // Open the game in a new window/tab with the test map
        const gameUrl = `test-map-level.html?testMap=${mapId}`;
        const gameWindow = window.open(gameUrl, '_blank');
        
        if (gameWindow) {
            document.getElementById('statusText').textContent = 'Map opened for testing in new tab';
        } else {
            // Fallback if popup blocked
            alert(`🎮 Test your map!\n\nMap saved with ID: ${mapId}\n\nTo test:\n1. Open raid-game.html\n2. Use the custom map loader\n3. Load map ID: ${mapId}`);
        }
    } else {
        alert('❌ Error saving map for testing. Please check the console for details.');
    }
}

function centerView() {
    if (!mapEditor) return;
    mapEditor.centerView();
}

function fitToView() {
    if (!mapEditor) return;
    mapEditor.fitToView();
}

function clearAll() {
    if (!mapEditor) return;
    if (confirm('Clear all elements? This cannot be undone.')) {
        mapEditor.mapData.boundaries = [];
        mapEditor.mapData.spawnPoints = [];
        mapEditor.mapData.enemies = [];
        mapEditor.mapData.interactables = [];
        mapEditor.mapData.hazards = [];
        mapEditor.selectedElement = null;
        mapEditor.hideElementProperties();
        mapEditor.render();
        mapEditor.updateElementCount();
        document.getElementById('statusText').textContent = 'All elements cleared';
    }
}

function showHelp() {
    const helpText = `ProjectFighters Map Editor Help

🎮 Basic Controls:
• Left click: Select/place elements
• Right click: Context menu
• Mouse wheel: Zoom in/out
• Middle click: Pan view

🧱 Creating Elements:
1. Select a tool from the toolbar
2. Click and drag to create elements
3. Use the properties panel to modify selected elements

⌨️ Keyboard Shortcuts:
• Ctrl+S: Save map
• Ctrl+G: Toggle grid
• Delete: Delete selected element
• Escape: Deselect element

🎯 Tips:
• Use snap to grid for precise alignment
• Layer visibility can be toggled in the properties panel
• Export to JS creates a level file for your game
• Use the minimap to navigate large levels

For more help, visit the ProjectFighters documentation.`;
    
    alert(helpText);
}

function updateSelectedElement() {
    if (!mapEditor) return;
    
    if (mapEditor.isCharacterSelected) {
        // Update character reference properties
        mapEditor.characterPosition.x = parseInt(document.getElementById('elementX').value) || 0;
        mapEditor.characterPosition.y = parseInt(document.getElementById('elementY').value) || 0;
        mapEditor.characterSize.width = parseInt(document.getElementById('elementWidth').value) || 120;
        mapEditor.characterSize.height = parseInt(document.getElementById('elementHeight').value) || 120;
        
        mapEditor.render();
        document.getElementById('statusText').textContent = 'Character reference updated';
    } else if (mapEditor.selectedElement) {
        // Update regular element properties
        mapEditor.selectedElement.x = parseInt(document.getElementById('elementX').value) || 0;
        mapEditor.selectedElement.y = parseInt(document.getElementById('elementY').value) || 0;
        mapEditor.selectedElement.width = parseInt(document.getElementById('elementWidth').value) || 10;
        mapEditor.selectedElement.height = parseInt(document.getElementById('elementHeight').value) || 10;
        
        // Update type-specific properties
        const enemyType = document.getElementById('enemyType').value;
        const actionType = document.getElementById('actionType').value;
        
        if (enemyType && (mapEditor.selectedElement.type === 'enemy' || mapEditor.selectedElement.type === 'boss')) {
            mapEditor.selectedElement.enemyType = enemyType;
        }
        
        if (actionType && mapEditor.selectedElement.action !== undefined) {
            mapEditor.selectedElement.action = actionType;
        }
        
        mapEditor.render();
        mapEditor.updateMinimap();
        document.getElementById('statusText').textContent = 'Element updated';
    }
}

function deleteSelectedElement() {
    if (!mapEditor) return;
    if (mapEditor.selectedElement) {
        mapEditor.removeElement(mapEditor.selectedElement);
        mapEditor.render();
        mapEditor.updateElementCount();
        document.getElementById('statusText').textContent = 'Element deleted';
    }
}

// Context menu functions
function copyElement() {
    if (!mapEditor) return;
    if (mapEditor.selectedElement) {
        mapEditor.clipboard = JSON.parse(JSON.stringify(mapEditor.selectedElement));
        document.getElementById('statusText').textContent = 'Element copied';
    }
}

function duplicateElement() {
    if (!mapEditor) return;
    if (mapEditor.selectedElement) {
        const duplicate = JSON.parse(JSON.stringify(mapEditor.selectedElement));
        duplicate.id = mapEditor.generateId();
        duplicate.x += 20;
        duplicate.y += 20;
        mapEditor.addElement(duplicate);
        mapEditor.selectedElement = duplicate;
        mapEditor.showElementProperties(duplicate);
        mapEditor.render();
        mapEditor.updateElementCount();
        document.getElementById('statusText').textContent = 'Element duplicated';
    }
}

function deleteElement() {
    deleteSelectedElement();
}

function bringToFront() {
    // TODO: Implement z-order functionality
    document.getElementById('statusText').textContent = 'Z-order functionality coming soon';
}

function sendToBack() {
    // TODO: Implement z-order functionality
    document.getElementById('statusText').textContent = 'Z-order functionality coming soon';
}

function loadCustomSprite(event) {
    if (!mapEditor) return;
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        mapEditor.characterSprite = new Image();
        mapEditor.characterSprite.onload = () => {
            console.log('Custom sprite loaded successfully');
            console.log(`Sprite dimensions: ${mapEditor.characterSprite.width}x${mapEditor.characterSprite.height}`);
            
            // Get frame count from input
            const frameCount = parseInt(document.getElementById('spriteFrames').value) || 9;
            
            // Assume 3x3 grid layout for 9 frames (common for sprite sheets)
            const cols = 3;
            const rows = Math.ceil(frameCount / cols);
            
            // Calculate actual frame dimensions for grid layout
            const frameWidth = mapEditor.characterSprite.width / cols;
            const frameHeight = mapEditor.characterSprite.height / rows;
            
            console.log(`Frame count: ${frameCount}`);
            console.log(`Grid layout: ${cols}x${rows}`);
            console.log(`Each frame dimensions: ${frameWidth}x${frameHeight}`);
            
            // Scale to reasonable editor size while maintaining aspect ratio
            const targetSize = 120; // Reasonable size for editor (square frames)
            const scale = targetSize / Math.max(frameWidth, frameHeight);
            
            mapEditor.characterSize.width = frameWidth * scale;
            mapEditor.characterSize.height = frameHeight * scale;
            
            // Ensure minimum readable size
            if (mapEditor.characterSize.width < 30 || mapEditor.characterSize.height < 30) {
                const minScale = 30 / Math.min(frameWidth, frameHeight);
                mapEditor.characterSize.width = frameWidth * minScale;
                mapEditor.characterSize.height = frameHeight * minScale;
            }
            
            console.log(`Character size set to: ${Math.round(mapEditor.characterSize.width)}x${Math.round(mapEditor.characterSize.height)}`);
            console.log(`Scale factor: ${scale.toFixed(3)}`);
            
            mapEditor.render();
            document.getElementById('statusText').textContent = `Custom sprite loaded (${frameCount} frames) - ${Math.round(mapEditor.characterSize.width)}x${Math.round(mapEditor.characterSize.height)}`;
        };
        mapEditor.characterSprite.onerror = () => {
            alert('Error loading sprite file. Please check the file format.');
        };
        mapEditor.characterSprite.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function reloadCharacterSprite() {
    if (!mapEditor) return;
    console.log('Reloading character sprite...');
    mapEditor.loadCharacterSprite();
    document.getElementById('statusText').textContent = 'Reloading character sprite...';
}

// Initialize when page loads
window.addEventListener('load', init); 