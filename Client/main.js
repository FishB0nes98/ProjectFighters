// Import Firebase modules
import { auth, database, onAuthStateChanged, signOut, ref, get, set, update } from './firebase-config.js';

// Game Client Class
class GameClient {
    constructor() {
        this.currentUser = null;
        this.currentPanel = 'welcome-panel';
        this.userIcons = [];
        this.userTitles = [];
        
        // Test Firebase connection on startup
        this.testFirebaseConnection();
        
        this.initializeAuth();
        this.setupEventListeners();
        this.setupProfileActions();
    }

    async testFirebaseConnection() {
        try {
            console.log('Testing Firebase connection on startup...');
            const testRef = ref(database, 'Store');
            const snapshot = await get(testRef);
            console.log('Firebase connection test successful');
            console.log('Store data available:', snapshot.exists());
            if (snapshot.exists()) {
                const storeData = snapshot.val();
                console.log('Store collections found:', Object.keys(storeData));
            }
        } catch (error) {
            console.error('Firebase connection test failed:', error);
        }
    }

    initializeAuth() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '../index.html';
            }
        });
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const userRef = ref(database, `users/${this.currentUser.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // Store user data for use throughout the class
                this.currentUserData = userData;
                
                this.updatePlayerInfo(userData);
                this.updateCurrencyDisplay(userData);
                
                // Load user-specific data
                await this.loadUserIcons(userData);
                await this.loadUserTitles(userData);
                
                console.log('User data loaded successfully');
            } else {
                console.log('No user data found');
                // Initialize with default values
                this.currentUserData = {
                    FM: 0,
                    CM: 0,
                    questPoints: 0,
                    skins: {},
                    Icons: {},
                    Stickers: {},
                    Songs: {},
                    titles: {}
                };
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Initialize with default values on error
            this.currentUserData = {
                FM: 0,
                CM: 0,
                questPoints: 0,
                skins: {},
                Icons: {},
                Stickers: {},
                Songs: {},
                titles: {}
            };
        }
    }

    updatePlayerInfo(userData) {
        // Update player name
        const playerName = document.getElementById('player-name');
        if (playerName) {
            playerName.textContent = userData.username || this.currentUser.email.split('@')[0];
        }

        // Update player title
        const playerTitle = document.getElementById('player-title');
        if (playerTitle) {
            if (userData.activeTitle) {
                playerTitle.textContent = this.capitalizeTitle(userData.activeTitle);
                playerTitle.style.display = 'block';
            } else {
                playerTitle.textContent = 'No Title';
                playerTitle.style.display = 'block';
            }
        }

        // Update player icon
        const playerIcon = document.getElementById('player-icon');
        if (playerIcon && userData.icon) {
            this.setPlayerIcon(userData.icon);
        }
    }

    updateCurrencyDisplay(userData) {
        // Update Fight Money
        const fmAmount = document.getElementById('fm-amount');
        if (fmAmount) {
            fmAmount.textContent = (userData.FM || 0).toLocaleString();
        }

        // Update Champion Money
        const cmAmount = document.getElementById('cm-amount');
        if (cmAmount) {
            cmAmount.textContent = (userData.CM || 0).toLocaleString();
        }

        // Update Quest Points
        const qpAmount = document.getElementById('qp-amount');
        if (qpAmount) {
            qpAmount.textContent = (userData.questPoints || 0).toLocaleString();
        }
    }

    setPlayerIcon(iconName) {
        const playerIcon = document.getElementById('player-icon');
        if (!playerIcon) return;

        // Try different paths and extensions
        const basePath = iconName.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, '');
        const extensions = ['png', 'webp', 'jpg', 'jpeg', 'jfif'];
        
        let extensionIndex = 0;
        let folderIndex = 0;
        const folders = ['Icons/Profile', 'Icons']; // Try Profile folder first, then main Icons folder
        
        const tryNextExtension = () => {
            if (extensionIndex < extensions.length) {
                playerIcon.src = `../${folders[folderIndex]}/${basePath}.${extensions[extensionIndex]}`;
                extensionIndex++;
            } else if (folderIndex < folders.length - 1) {
                // Try next folder
                folderIndex++;
                extensionIndex = 0;
                playerIcon.src = `../${folders[folderIndex]}/${basePath}.${extensions[extensionIndex]}`;
                        extensionIndex++;
                    } else {
                        // Fallback to default
                        playerIcon.src = '../Icons/Profile/Birdie.png';
                        playerIcon.onerror = null;
            }
        };
        
        playerIcon.onerror = tryNextExtension;
        tryNextExtension();
    }

    capitalizeTitle(title) {
        if (!title) return '';
        return title.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    setupEventListeners() {
        // Navigation buttons
        window.startGame = () => this.showPanel('game-modes');
        window.openStore = async () => {
            console.log('Opening store...');
            this.showPanel('store-panel');
            
            // Ensure user data is loaded before initializing shop
            if (!this.currentUserData && this.currentUser) {
                console.log('Loading user data before initializing shop...');
                await this.loadUserData();
            }
            
            // Debug current user data
            console.log('Current user data:', this.currentUserData);
            console.log('Current user:', this.currentUser);
            
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
                console.log('Initializing shop after delay...');
                this.initShop();
            }, 100);
        };
        window.showFighters = () => this.showPanel('welcome-panel');
        window.selectGameMode = (url) => window.location.href = url;
        
        // Profile modal functions
        window.openProfileSettings = () => this.openProfileModal();
        window.closeProfileSettings = () => this.closeProfileModal();
        window.saveProfileSettings = () => this.saveProfileSettings();
        window.logout = () => this.logout();
        
        // Character grid functionality
        this.initializeCharacterGrid();
        
        // Fallback: Try to initialize character grid again after a short delay
        setTimeout(() => {
            if (document.getElementById('character-grid') && document.getElementById('character-grid').children.length === 0) {
                console.log('Character grid empty, retrying initialization...');
                this.initializeCharacterGrid();
            }
        }, 1000);
    }

    showPanel(panelId) {
        // Hide all panels
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        // Show the selected panel
        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }
    }

    async loadUserIcons(userData) {
        this.userIcons = [];

        // Add special icons if user owns them
        if (userData.Icons) {
            Object.entries(userData.Icons).forEach(([iconName, owned]) => {
                if (owned === 1) {
                    this.userIcons.push({
                        name: `${iconName}.png`,
                        path: `../Icons/Profile/${iconName}.png`
                    });
                }
            });
        }
    }

    async loadUserTitles(userData) {
        this.userTitles = ['No Title']; // Default option
        
        if (userData.titles) {
            Object.entries(userData.titles).forEach(([titleName, owned]) => {
                if (owned === true) {
                    this.userTitles.push(this.capitalizeTitle(titleName));
                }
            });
        }
    }

    async initShop() {
        try {
            console.log('Initializing shop...');
            
            // Initialize notification event handlers
            this.setupShopNotifications();
            
            // Initialize back to top button
            this.initBackToTop();
            
            // Fetch shop data from Firebase
            console.log('Fetching shop data from Firebase...');
            const shopRef = ref(database, 'Store');
            console.log('Shop reference:', shopRef);
            const snapshot = await get(shopRef);
            console.log('Firebase snapshot received:', snapshot);
            console.log('Snapshot exists:', snapshot.exists());
            
            if (snapshot.exists()) {
                const shopData = snapshot.val();
                console.log('Raw shop data from Firebase:', shopData);
                console.log('Shop data type:', typeof shopData);
                console.log('Shop data keys:', Object.keys(shopData));
                
                // Log each collection in detail
                Object.keys(shopData).forEach(collectionName => {
                    const collection = shopData[collectionName];
                    console.log(`Collection "${collectionName}":`, collection);
                    console.log(`Collection "${collectionName}" type:`, typeof collection);
                    if (collection && typeof collection === 'object') {
                        console.log(`Collection "${collectionName}" items:`, Object.keys(collection));
                    }
                });
                
                // Validate that we got an object
                if (!shopData || typeof shopData !== 'object' || Array.isArray(shopData)) {
                    console.error('Invalid shop data structure:', typeof shopData, Array.isArray(shopData));
                    throw new Error('Shop data is not a valid object');
                }
                
                this.shopData = shopData;
                console.log('Shop data validated and stored successfully');
                console.log('Number of collections found:', Object.keys(this.shopData).length);
                
                this.renderShopCollections(this.shopData);
                console.log('Shop collections rendered successfully');
            } else {
                console.log("No shop data found in Firebase");
                console.log("Snapshot value:", snapshot.val());
                const shopContainer = document.getElementById('shopContainer');
                if (shopContainer) {
                    shopContainer.innerHTML = `
                        <div class="empty-shop">
                            <h2>Shop is currently empty</h2>
                            <p>Check back later for new items!</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error("Error loading shop data:", error);
            console.error("Error stack:", error.stack);
            
            // Show error message to user
            const shopContainer = document.getElementById('shopContainer');
            if (shopContainer) {
                shopContainer.innerHTML = `
                    <div class="error-shop">
                        <h2>Error Loading Shop</h2>
                        <p>There was an error loading the shop data. Please try again later.</p>
                        <p>Error: ${error.message}</p>
                        <button onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        }
    }

    setupShopNotifications() {
        // Initialize notification event handlers
        const notificationConfirm = document.getElementById('notificationConfirm');
        const notificationCancel = document.getElementById('notificationCancel');
        const errorNotificationOk = document.getElementById('errorNotificationOk');
        const successNotificationOk = document.getElementById('successNotificationOk');
        
        if (notificationConfirm) {
            notificationConfirm.addEventListener('click', () => {
                document.getElementById('notificationOverlay').classList.remove('show');
            });
        }
        
        if (notificationCancel) {
            notificationCancel.addEventListener('click', () => {
                document.getElementById('notificationOverlay').classList.remove('show');
            });
        }
        
        if (errorNotificationOk) {
            errorNotificationOk.addEventListener('click', () => {
                document.getElementById('errorNotificationOverlay').classList.remove('show');
            });
        }
        
        if (successNotificationOk) {
            successNotificationOk.addEventListener('click', () => {
                document.getElementById('successNotificationOverlay').classList.remove('show');
            });
        }
        
        // Setup modal close functionality
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeItemModal();
            });
        }
        
        // Close modal when clicking outside
        const itemModal = document.getElementById('itemModal');
        if (itemModal) {
            itemModal.addEventListener('click', (e) => {
                if (e.target === itemModal) {
                    this.closeItemModal();
                }
            });
        }
    }

    initBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Helper function to format item names (tokyo_kagome -> Tokyo Kagome)
    formatItemName(name) {
        return name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Check if user owns the item
    isItemOwned(itemName, itemType, userData) {
        if (!userData) {
            console.log(`No user data available for ownership check of ${itemName}`);
            return false;
        }

        try {
            // Based on item type, check the appropriate section of user data
            switch (parseInt(itemType)) {
                case 1: // Skin
                    return userData.skins && userData.skins[itemName] === 1;
                case 2: // Icon
                    return (userData.Icons && userData.Icons[itemName] === 1) || 
                           (userData.icons && userData.icons[itemName] === 1);
                case 3: // Sticker
                    return userData.Stickers && userData.Stickers[itemName] === 1;
                case 4: // Song
                    return userData.Songs && userData.Songs[itemName] === 1;
                case 6: // Lootbox
                    return false; // Lootboxes are always purchasable
                default:
                    console.log(`Unknown item type ${itemType} for item ${itemName}`);
                    return false;
            }
        } catch (error) {
            console.error(`Error checking ownership for ${itemName}:`, error);
            return false;
        }
    }

    // Function to render shop collections
    renderShopCollections(collections) {
        console.log('Starting to render shop collections...');
        const shopContainer = document.getElementById('shopContainer');
        
        if (!shopContainer) {
            console.error('Shop container not found!');
            return;
        }
        
        // Test basic DOM manipulation
        console.log('Shop container found:', shopContainer);
        console.log('Shop container classes:', shopContainer.className);
        console.log('Shop container parent:', shopContainer.parentElement);
        
        shopContainer.innerHTML = ''; // Clear previous items
        console.log('Cleared shop container');
        
        const collectionNames = Object.keys(collections);
        console.log(`Found ${collectionNames.length} collections to render:`, collectionNames);
        
        for (const collectionName in collections) {
            const collection = collections[collectionName];
            
            // Skip if collection is not an object or is an array
            if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
                console.warn(`Skipping invalid collection "${collectionName}": not a valid object`);
                continue;
            }
            
            const collectionSection = document.createElement('div');
            collectionSection.classList.add('collection-section');
            
            // Create collection header
            const collectionHeader = document.createElement('div');
            collectionHeader.classList.add('collection-header');
            
            // Collection name
            const collectionTitle = document.createElement('h3');
            collectionTitle.classList.add('collection-name');
            collectionTitle.textContent = this.formatItemName(collectionName);
            
            collectionHeader.appendChild(collectionTitle);
            
            // Create items grid
            const itemsGrid = document.createElement('div');
            itemsGrid.classList.add('shop-items');
            
            const itemNames = Object.keys(collection);
            console.log(`Collection "${collectionName}" has ${itemNames.length} items:`, itemNames);
            
            let itemsRendered = 0;
            for (const itemName in collection) {
                try {
                    const itemData = collection[itemName];
                    
                    // Basic validation for individual items
                    if (!itemData || typeof itemData !== 'object' || 
                        typeof itemData.price !== 'number' || 
                        typeof itemData.type !== 'number') {
                        console.warn(`Skipping invalid item "${itemName}" in collection "${collectionName}"`);
                        continue;
                    }
                    
                    console.log(`Rendering item "${itemName}" with data:`, itemData);
                    const itemCard = this.createItemCard(itemName, itemData, collectionName);
                    
                    // Only append if createItemCard returned a valid element
                    if (itemCard && itemCard.nodeType === Node.ELEMENT_NODE) {
                        itemsGrid.appendChild(itemCard);
                        itemsRendered++;
                        console.log(`Successfully rendered and appended item "${itemName}"`);
                    } else {
                        console.warn(`Failed to create valid item card for "${itemName}"`);
                    }
                } catch (error) {
                    console.error(`Error rendering item "${itemName}":`, error);
                }
            }
            
            console.log(`Collection "${collectionName}": ${itemsRendered}/${itemNames.length} items rendered successfully`);
            
            // Only add collection to DOM if it has rendered items
            if (itemsRendered > 0) {
                // Add elements to section
                collectionSection.appendChild(collectionHeader);
                collectionSection.appendChild(itemsGrid);
                
                // Add section to container
                shopContainer.appendChild(collectionSection);
                console.log(`Collection "${collectionName}" added to shop container`);
            } else {
                console.warn(`Collection "${collectionName}" not added: no items rendered`);
            }
        }
        
        console.log('Finished rendering all shop collections');
        
        // Final verification
        const renderedSections = shopContainer.querySelectorAll('.collection-section');
        console.log(`Total collection sections rendered: ${renderedSections.length}`);
        
        const renderedItems = shopContainer.querySelectorAll('.item-card');
        console.log(`Total item cards rendered: ${renderedItems.length}`);
        
        // Debug: Check the actual HTML content
        console.log('Shop container HTML length:', shopContainer.innerHTML.length);
        console.log('Shop container children count:', shopContainer.children.length);
        
        // Debug: Log first few characters of HTML to see if content exists
        if (shopContainer.innerHTML.length > 0) {
            console.log('Shop container HTML preview:', shopContainer.innerHTML.substring(0, 200) + '...');
        }
        
        // Show message if no collections were rendered
        if (renderedSections.length === 0) {
            console.warn('No collection sections found - showing empty shop message');
            shopContainer.innerHTML = `
                <div class="empty-shop">
                    <h2>No valid shop collections found</h2>
                    <p>The shop data may be corrupted or empty.</p>
                    <button onclick="location.reload()">Refresh</button>
                </div>
            `;
        } else if (renderedItems.length === 0) {
            console.warn('Collection sections exist but no item cards found - possible CSS or DOM issue');
            // Add a debug message
            const debugDiv = document.createElement('div');
            debugDiv.style.cssText = 'color: red; padding: 20px; background: rgba(255,0,0,0.1); margin: 20px; border: 2px solid red;';
            debugDiv.innerHTML = `
                <h3>Debug: Shop Rendering Issue</h3>
                <p>Collections: ${renderedSections.length}</p>
                <p>Items: ${renderedItems.length}</p>
                <p>Container HTML length: ${shopContainer.innerHTML.length}</p>
            `;
            shopContainer.appendChild(debugDiv);
        }
    }

    // Improved function to try loading image with different extensions
    loadImageWithFallback(imgElement, basePath, itemName, callback) {
        console.log(`Loading image for "${itemName}" with base path: ${basePath}`);
        
        // Define the extensions to try in order - including all supported formats
        const extensions = ['png', 'jpg', 'jpeg', 'jfif', 'webp'];
        let currentExtensionIndex = 0;
        
        // Function to try the next extension
        const tryNextExtension = () => {
            if (currentExtensionIndex >= extensions.length) {
                console.error(`Failed to load image for ${itemName} with any extension from path: ${basePath}`);
                console.log(`Attempted extensions:`, extensions);
                console.log(`Full paths attempted:`, extensions.map(ext => `${basePath}${itemName}.${ext}`));
                
                // Set a fallback image - use FM currency icon as it should exist
                console.log(`Setting fallback image for ${itemName}`);
                imgElement.src = '../res/img/fm.png';
                imgElement.onerror = () => {
                    console.error('Even fallback image failed to load!');
                    // Last resort - set a data URL for a 1x1 transparent pixel
                    imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                };
                console.log(`Using fallback FM icon for ${itemName}`);
                if (callback) callback(false);
                return;
            }
            
            const ext = extensions[currentExtensionIndex];
            const fullPath = `${basePath}${itemName}.${ext}`;
            console.log(`Trying to load: ${fullPath}`);
            imgElement.src = fullPath;
            currentExtensionIndex++;
        };
        
        // Handle image load error
        imgElement.onerror = function() {
            console.warn(`Failed to load image: ${imgElement.src}`);
            tryNextExtension();
        };
        
        // Handle image load success
        imgElement.onload = function() {
            console.log(`Successfully loaded image for ${itemName}: ${imgElement.src}`);
            if (callback) callback(true);
        };
        
        // Start with the first extension
        tryNextExtension();
    }

    // Create item card
    createItemCard(itemName, itemData, collectionName) {
        console.log(`Creating item card for "${itemName}" in collection "${collectionName}"`);
        console.log('Item data:', itemData);
        
        // Validate input parameters
        if (!itemName || !itemData || !collectionName) {
            console.error('Invalid parameters for createItemCard:', { itemName, itemData, collectionName });
            return null; // Return null instead of empty div
        }
        
        // Validate required item data properties
        if (typeof itemData.price !== 'number' || typeof itemData.type !== 'number') {
            console.error(`Invalid item data for ${itemName}:`, itemData);
            return null; // Return null instead of empty div
        }
        
        try {
            const itemCard = document.createElement('div');
            itemCard.className = `item-card rarity-${itemData.rarity || 'common'}`;
            itemCard.setAttribute('data-item-name', itemName);
            itemCard.setAttribute('data-collection', collectionName);
            
            // Different sizes based on item type
            if (itemData.type !== 1) { // If NOT a skin
                itemCard.classList.add('small-item-card');
            }
            
            // Determine the appropriate currency based on item price type
            const currencyImg = '../res/img/fm.png'; // Default to FM
            const currencyAlt = 'FM';

            const itemImageContainer = document.createElement('div');
            itemImageContainer.className = 'item-image';
            itemImageContainer.setAttribute('data-type', itemData.type);
            
            const itemImage = document.createElement('img');
            // Determine image path based on item type - match shop_2.html paths
            let basePath = '';
            if (itemData.type === 1) { // Skin - Use Skins folder directly
                basePath = '../Skins/';
            } else if (itemData.type === 2) { // Icon
                basePath = '../Icons/Profile/';
            } else if (itemData.type === 3) { // Sticker
                basePath = '../Stickers/';
            } else if (itemData.type === 4) { // Song
                basePath = '../Songs/thumbnails/';
            } else if (itemData.type === 5) { // Currency
                basePath = '../res/img/';
            } else if (itemData.type === 6) { // Lootbox
                basePath = '../Lootboxes/';
            }
            
            console.log(`Item "${itemName}" type ${itemData.type} using base path: ${basePath}`);

            // Use the improved image loading function with all supported formats
            this.loadImageWithFallback(itemImage, basePath, itemName);
            
            itemImage.alt = itemName;
            itemImageContainer.appendChild(itemImage);

            const itemType = document.createElement('div');
            itemType.className = 'item-type';
            // Set item type text
            const typeText = this.getItemTypeName(itemData.type);
            itemType.textContent = typeText;

            const itemRarity = document.createElement('div');
            itemRarity.className = 'item-rarity';
            // Set rarity
            if (itemData.rarity) {
                itemRarity.textContent = itemData.rarity.charAt(0).toUpperCase() + itemData.rarity.slice(1);
            } else {
                itemRarity.textContent = 'Common';
            }

            const itemInfo = document.createElement('div');
            itemInfo.className = 'item-info';

            const itemName_div = document.createElement('div');
            itemName_div.className = 'item-name';
            // Format the item name for display - match shop_2.html formatting
            const displayItemName = this.formatItemName(itemName);
            itemName_div.textContent = displayItemName;

            const itemDescription = document.createElement('div');
            itemDescription.className = 'item-description';
            itemDescription.textContent = itemData.description || `${typeText} - ${this.formatItemName(collectionName)}`;

            const itemPrice = document.createElement('div');
            itemPrice.className = 'item-price';

            const price = document.createElement('div');
            price.className = 'price';

            const currencyIcon = document.createElement('img');
            currencyIcon.src = currencyImg;
            currencyIcon.alt = currencyAlt;

            const priceValue = document.createElement('span');
            priceValue.className = 'price-value';
            
            // Display original price with strikethrough if there's a discount
            if (itemData.discount) {
                const originalPrice = document.createElement('span');
                originalPrice.className = 'original-price';
                originalPrice.textContent = itemData.original_price || itemData.price;
                price.appendChild(originalPrice);
                
                const discountTag = document.createElement('div');
                discountTag.className = 'discount-tag';
                discountTag.textContent = `-${itemData.discount}%`;
                itemImageContainer.appendChild(discountTag);
                
                // Calculate discounted price
                const originalPriceValue = itemData.original_price || itemData.price;
                priceValue.textContent = Math.round(originalPriceValue * (1 - itemData.discount / 100));
            } else {
                priceValue.textContent = itemData.price;
            }

            price.appendChild(currencyIcon);
            price.appendChild(priceValue);
            itemPrice.appendChild(price);

            // Check if user already owns this item - with better error handling
            let isOwned = false;
            try {
                isOwned = this.isItemOwned(itemName, itemData.type, this.currentUserData);
            } catch (error) {
                console.warn(`Error checking ownership for ${itemName}:`, error);
                isOwned = false; // Default to not owned if there's an error
            }
            
            if (isOwned) {
                const ownedLabel = document.createElement('div');
                ownedLabel.className = 'owned-label';
                ownedLabel.textContent = 'OWNED';
                itemPrice.appendChild(ownedLabel);
            } else {
                const buyButton = document.createElement('button');
                buyButton.className = 'buy-button';
                buyButton.textContent = 'Buy';
                buyButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent item card click
                    this.purchaseShopItem(itemData, itemName, collectionName);
                });
                itemPrice.appendChild(buyButton);
            }

            itemInfo.appendChild(itemName_div);
            itemInfo.appendChild(itemDescription);

            itemCard.appendChild(itemImageContainer);
            itemCard.appendChild(itemType);
            itemCard.appendChild(itemRarity);
            itemCard.appendChild(itemInfo);
            itemCard.appendChild(itemPrice);

            // Add click event to show details
            itemCard.addEventListener('click', () => {
                this.showItemDetails(itemData, itemName, collectionName);
            });

            console.log(`Successfully created item card for "${itemName}" with ${itemCard.children.length} child elements`);
            return itemCard;
            
        } catch (error) {
            console.error(`Error creating item card for "${itemName}":`, error);
            return null; // Return null on error
        }
    }

    // Show item details in modal
    showItemDetails(item, itemName, collectionName) {
        const modal = document.getElementById('itemModal');
        if (!modal) {
            console.error('Item modal not found');
            return;
        }

        const modalTitle = modal.querySelector('.modal-title');
        const modalImage = modal.querySelector('.modal-image img');
        const modalDescription = modal.querySelector('.modal-description');
        const modalPrice = modal.querySelector('.modal-price-value');
        const modalCurrencyImg = modal.querySelector('.modal-price img');
        const modalActions = modal.querySelector('.modal-actions');
        const modalImageContainer = modal.querySelector('.modal-image');
        const modalAudioPlayer = modal.querySelector('.modal-audio-player');
        
        if (!modalTitle || !modalImage || !modalDescription || !modalPrice || !modalCurrencyImg || !modalActions || !modalImageContainer) {
            console.error('Modal elements not found');
            return;
        }
        
        // Set data-type attribute for aspect ratio
        modalImageContainer.setAttribute('data-type', item.type);

        // Set modal content with formatted name
        modalTitle.textContent = this.formatItemName(itemName);
        
        // Determine image path for modal - match shop_2.html paths
        let basePath;
        if (item.type === 1) { // Skin - Show the full skin in modal
            basePath = `../Skins/`; 
        } else if (item.type === 2) { // Icon
            basePath = `../Icons/Profile/`;
        } else if (item.type === 3) { // Sticker
            basePath = `../Stickers/`;
        } else if (item.type === 4) { // Song
            basePath = `../Songs/thumbnails/`;
            // Setup audio player for songs
            if (modalAudioPlayer) {
                modalAudioPlayer.src = `../Songs/${itemName}.mp3`;
                modalAudioPlayer.style.display = 'block';
                // Set audio to start at 40% of the song when started
                modalAudioPlayer.onloadedmetadata = function() {
                    modalAudioPlayer.currentTime = modalAudioPlayer.duration * 0.4;
                };
            }
        } else if (item.type === 5) { // Currency
            basePath = `../res/img/`;
        } else if (item.type === 6) { // Lootbox
            basePath = `../Lootboxes/`;
        } else {
            basePath = `../Loading Screen/`; // Default
        }
        
        // Hide audio player for non-song items
        if (modalAudioPlayer) {
            if (item.type !== 4) {
                modalAudioPlayer.style.display = 'none';
            } else {
                modalAudioPlayer.style.display = 'block';
            }
        }
        
        // Use the improved image loading function
        this.loadImageWithFallback(modalImage, basePath, itemName);
        
        modalImage.alt = itemName;
        
        // Detailed description for modal - use formatted names
        modalDescription.textContent = item.description || 
            `This ${this.getItemTypeName(item.type)} is part of the ${this.formatItemName(collectionName)} collection.`;
        
        // Set price and currency
        modalPrice.textContent = item.discount ? 
            Math.round(item.original_price * (1 - item.discount / 100)) : 
            item.price;
        
        // Set currency image based on item type
        modalCurrencyImg.src = '../res/img/fm.png';
        modalCurrencyImg.alt = 'FM';
        
        // Clear previous actions
        modalActions.innerHTML = '';
        
        // Check if user already owns this item
        const isOwned = this.isItemOwned(itemName, item.type, this.currentUserData);
        
        if (isOwned) {
            const ownedLabel = document.createElement('div');
            ownedLabel.className = 'modal-owned-label';
            ownedLabel.textContent = 'OWNED';
            modalActions.appendChild(ownedLabel);
        } else {
            // Add buy button if not owned
            const buyButton = document.createElement('button');
            buyButton.className = 'modal-buy-button';
            buyButton.textContent = 'Purchase';
            buyButton.onclick = () => this.purchaseShopItem(item, itemName, collectionName);
            modalActions.appendChild(buyButton);
        }
        
        // Show modal with fade-in animation
        modal.classList.remove('hidden'); // Remove hidden class first
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Helper function to get the item type name
    getItemTypeName(type) {
        switch(type) {
            case 1: return 'Skin';
            case 2: return 'Icon';
            case 3: return 'Sticker';
            case 4: return 'Song';
            case 5: return 'Currency';
            case 6: return 'Lootbox';
            default: return 'Item';
        }
    }

    // Function to close the item modal
    closeItemModal() {
        const modal = document.getElementById('itemModal');
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            
            // Stop audio if playing
            const audioPlayer = modal.querySelector('.modal-audio-player');
            if (audioPlayer && !audioPlayer.paused) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            }
        }, 300); // Wait for animation to complete
    }

    // Show confirmation modal
    showConfirmation(message, item, itemName, collectionName) {
        const overlay = document.getElementById('notificationOverlay');
        const messageElement = overlay.querySelector('.notification-message');
        
        // Store item details for later use
        this.currentPurchaseItem = item;
        this.currentPurchaseItemName = itemName;
        this.currentPurchaseCollectionName = collectionName;
        
        // Set the message
        messageElement.textContent = message;
        
        // Show the overlay
        overlay.classList.add('show');
        
        // Return a promise that resolves when the user makes a choice
        return new Promise((resolve) => {
            document.getElementById('notificationConfirm').onclick = () => {
                overlay.classList.remove('show');
                resolve(true);
            };
            
            document.getElementById('notificationCancel').onclick = () => {
                overlay.classList.remove('show');
                resolve(false);
            };
        });
    }

    // Show error notification
    showError(message) {
        const overlay = document.getElementById('errorNotificationOverlay');
        const messageElement = overlay.querySelector('.notification-message');
        
        // Set the message
        messageElement.textContent = message;
        
        // Show the overlay
        overlay.classList.add('show');
        
        // Handle the OK button
        document.getElementById('errorNotificationOk').onclick = () => {
            overlay.classList.remove('show');
        };
    }

    // Show success notification
    showSuccess(message) {
        const overlay = document.getElementById('successNotificationOverlay');
        const messageElement = overlay.querySelector('.notification-message');
        
        // Set the message
        messageElement.textContent = message;
        
        // Show the overlay
        overlay.classList.add('show');
        
        // Handle the OK button
        document.getElementById('successNotificationOk').onclick = () => {
            overlay.classList.remove('show');
        };
    }

    // Handle buying an item (renamed from purchaseItem to avoid conflicts)
    async purchaseShopItem(item, itemName, collectionName) {
        if (!this.currentUser || !this.currentUserData) {
            this.showError('User data not loaded. Please refresh the page.');
            return;
        }

        try {
            // Check if user has enough currency
            const currentFM = this.currentUserData.FM || 0;
            const itemPrice = item.discount ? 
                Math.round(item.original_price * (1 - item.discount / 100)) : 
                item.price;

            if (currentFM < itemPrice) {
                this.showError(`You don't have enough FM to purchase this item! You have ${currentFM} FM, but this item costs ${itemPrice} FM.`);
                return;
            }

            // Show confirmation message
            const confirmed = await this.showConfirmation(
                `Are you sure you want to buy ${this.formatItemName(itemName)} for ${itemPrice} FM?`, 
                item, 
                itemName, 
                collectionName
            );

            if (confirmed) {
                // Create updates object
                const updates = {};
                
                // Deduct FM
                const newFMBalance = currentFM - itemPrice;
                updates[`FM`] = newFMBalance;
                
                // Add item to appropriate user data location based on type
                switch (parseInt(item.type)) {
                    case 1: // Skin
                        updates[`skins/${itemName}`] = 1;
                        break;
                    case 2: // Icon
                        updates[`Icons/${itemName}`] = 1;
                        break;
                    case 3: // Sticker
                        updates[`Stickers/${itemName}`] = 1;
                        break;
                    case 4: // Song
                        updates[`Songs/${itemName}`] = 1;
                        break;
                    case 5: // Currency
                        // For currency, add the value to the user's balance
                        const currencyAmount = 1000; // Example value
                        updates[`CM`] = (this.currentUserData.CM || 0) + currencyAmount;
                        break;
                    case 6: // Lootbox
                        // If the user doesn't have a freelootbox field, create it
                        updates[`freelootbox`] = (this.currentUserData.freelootbox || 0) + 1;
                        break;
                }
                
                // Update Firebase
                const userRef = ref(database, `users/${this.currentUser.uid}`);
                await update(userRef, updates);
                
                // Update local user data
                this.currentUserData.FM = newFMBalance;
                
                // Update specific item data in local storage
                switch (parseInt(item.type)) {
                    case 1: // Skin
                        if (!this.currentUserData.skins) this.currentUserData.skins = {};
                        this.currentUserData.skins[itemName] = 1;
                        break;
                    case 2: // Icon
                        if (!this.currentUserData.Icons) this.currentUserData.Icons = {};
                        this.currentUserData.Icons[itemName] = 1;
                        break;
                    case 3: // Sticker
                        if (!this.currentUserData.Stickers) this.currentUserData.Stickers = {};
                        this.currentUserData.Stickers[itemName] = 1;
                        break;
                    case 4: // Song
                        if (!this.currentUserData.Songs) this.currentUserData.Songs = {};
                        this.currentUserData.Songs[itemName] = 1;
                        break;
                    case 5: // Currency
                        this.currentUserData.CM = (this.currentUserData.CM || 0) + 1000; // Example value
                        break;
                    case 6: // Lootbox
                        this.currentUserData.freelootbox = (this.currentUserData.freelootbox || 0) + 1;
                        break;
                }
                
                // Update UI currency display
                this.updateCurrencyDisplay(this.currentUserData);
                
                // Close the modal if open
                this.closeItemModal();
                
                // Show success notification
                this.showSuccess(`Successfully purchased ${this.formatItemName(itemName)}!`);
                
                // Refresh the shop display to update owned items
                if (this.shopData) {
                    this.renderShopCollections(this.shopData);
                }
            }
        } catch (error) {
            console.error("Error purchasing item:", error);
            this.showError("There was an error processing your purchase. Please try again.");
        }
    }

    // Initialize character grid with search only (filters removed)
    initializeCharacterGrid() {
        const grid = document.getElementById('character-grid');
        const searchInput = document.getElementById('character-search');
        
        console.log('Initializing character grid...', grid); // Debug log
        
        if (!grid) {
            console.error('Character grid element not found!');
            return;
        }
        
        // Character roles data (same as in home.html)
        const roles = {
            top: ['Astaroth', 'Birdie', 'Christie', 'Jun', 'Lili', 'Mai', 'Shao Kahn', 'Siegfried', 'Sophitia', 'Tanya', 'Yugo'],
            jungle: ['Alice', 'Birdie', 'Blanka', 'Cham Cham', 'Juri', 'Kabal', 'Kotal Kahn', 'Reptile', 'Scorpion', 'Talim', 'Zasalamel'],
            mid: ['Akuma', 'Angel', 'Ayane', 'Elphelt', 'Ibuki', 'Mai', 'Mega Man', 'Morrigan', 'Noel', 'Raiden', 'Shinnok', 'Shizumaru', 'Sub Zero', 'Tanya'],
            adc: ['Anna', 'Eagle', 'Elphelt', 'Erron Black', 'Kagome', 'Nina', 'Noel', 'Peacock', 'Mega Man'],
            support: ['Angel', 'Birdie', 'FANG', 'Julia', 'Kokoro', 'Kotal Kahn', 'Kuma', 'R Mika', 'Shoma', 'Sub Zero']
        };
        
        // Get all unique characters with their roles
        const characters = new Set();
        Object.entries(roles).forEach(([role, chars]) => {
            chars.forEach(char => {
                characters.add(char);
            });
        });
        
        // Create character array with roles and sort alphabetically
        const characterData = Array.from(characters).sort().map(name => {
            const characterRoles = [];
            Object.entries(roles).forEach(([role, chars]) => {
                if (chars.includes(name)) {
                    characterRoles.push(role.toLowerCase());
                }
            });
            return {
                name,
                roles: characterRoles,
                image: `../Icons/${name}.png`
            };
        });
        
        console.log('Character data:', characterData); // Debug log
        
        // Function to create character card
        const createCharacterCard = (character) => {
            const card = document.createElement('a');
            card.href = `../character.html?character=${encodeURIComponent(character.name)}`;
            card.className = `character-card ${character.roles.join(' ')}`;
            card.dataset.roles = character.roles.join(',');
            
            card.innerHTML = `
                <div class="character-image-container">
                    <img src="${character.image}" alt="${character.name}" onerror="this.src='../Icons/Profile/${character.name}.png'">
                    <div class="character-overlay">
                        <div class="character-roles">
                            ${character.roles.map(role => `
                                <span class="role-icon">
                                    <i class="fas ${this.getRoleIcon(role)}"></i>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="character-info">
                    <h3>${character.name}</h3>
                </div>
            `;
            
            return card;
        };
        
        // Render all characters (no filtering)
        const renderCharacters = () => {
            console.log('Rendering characters...'); // Debug log
            grid.innerHTML = '';
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            
            characterData.forEach(character => {
                if (!searchInput || character.name.toLowerCase().includes(searchTerm)) {
                    const card = createCharacterCard(character);
                    grid.appendChild(card);
                    console.log('Added character card:', character.name); // Debug log
                }
            });
            
            console.log('Total characters rendered:', grid.children.length); // Debug log
        };
        
        // Event listeners (only for search if it exists)
        if (searchInput) {
            searchInput.addEventListener('input', renderCharacters);
        }
        
        // Initial render
        renderCharacters();
    }
    
    // Function to get role icon
    getRoleIcon(role) {
        const icons = {
            top: 'fa-chevron-up',
            jungle: 'fa-tree',
            mid: 'fa-star',
            adc: 'fa-crosshairs',
            support: 'fa-heart'
        };
        return icons[role] || 'fa-user';
    }

    // Profile Modal Functions
    openProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
        modal.classList.remove('hidden');
            this.updateProfilePreview();
            this.loadProfileIcons();
            this.loadProfileTitles();
            this.setupIconCategories();
        }
    }
    
    closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
        modal.classList.add('hidden');
        }
    }
    
    updateProfilePreview() {
        // Update preview name
        const previewName = document.getElementById('preview-name');
        if (previewName && this.currentUser) {
            previewName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        }

        // Update preview title
        const previewTitle = document.getElementById('preview-title');
        const playerTitle = document.getElementById('player-title');
        if (previewTitle && playerTitle) {
            previewTitle.textContent = playerTitle.textContent || 'No Title';
        }

        // Update preview icon
        const previewIcon = document.getElementById('preview-icon');
        const playerIcon = document.getElementById('player-icon');
        if (previewIcon && playerIcon) {
            previewIcon.src = playerIcon.src;
        }

        // Load and display rank points
        this.loadRankPoints();
    }
    
    async loadRankPoints() {
        try {
            const userRef = ref(database, `users/${this.currentUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : {};
            
            const rankPointsDisplay = document.getElementById('rank-points-display');
            if (rankPointsDisplay) {
                const rankPoints = userData['Rank points'] || 0;
                rankPointsDisplay.textContent = `Rank Points: ${rankPoints}`;
            }
        } catch (error) {
            console.error('Error loading rank points:', error);
        }
    }

    async loadProfileIcons() {
        try {
            // Load basic character icons from Icons folder (always available)
            const basicIcons = [
                'Akuma', 'Alice', 'Angel', 'Anna', 'Astaroth', 'Ayane', 'Birdie', 'Blanka',
                'Cham Cham', 'Christie', 'Eagle', 'Elphelt', 'Erron Black', 'FANG',
                'Ibuki', 'Jun', 'Julia', 'Juri', 'Kabal', 'Kagome', 'Kokoro',
                'Kotal Kahn', 'Kuma', 'Lili', 'Mai', 'Mega Man', 'Morrigan', 'Nina',
                'Noel', 'Peacock', 'Raiden', 'Reptile', 'R Mika', 'R.Mika', 'Scorpion',
                'Shao Kahn', 'Shinnok', 'Shizumaru', 'Shoma', 'Siegfried', 'Sophitia',
                'Sub Zero', 'Talim', 'Tanya', 'Yugo', 'Zasalamel'
            ];

            // Load user's special icons from database (Icons/Profile folder)
            const userRef = ref(database, `users/${this.currentUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : {};

            this.iconCategories = {
                basic: basicIcons.map(icon => ({ name: icon, owned: true, category: 'basic', folder: 'Icons' })),
                special: []
            };

            // Add special icons if user owns them (from Icons/Profile folder)
            if (userData.Icons) {
                Object.entries(userData.Icons).forEach(([iconName, owned]) => {
                    if (owned === 1) {
                        this.iconCategories.special.push({
                            name: iconName,
                            owned: true,
                            category: 'special',
                            folder: 'Icons/Profile'
                        });
                    }
                });
            }

            this.updateIconCounts();
            this.renderIconGrid('basic');
        } catch (error) {
            console.error('Error loading profile icons:', error);
        }
    }

    updateIconCounts() {
        const basicCount = document.getElementById('basic-count');
        const specialCount = document.getElementById('special-count');

        if (basicCount) basicCount.textContent = this.iconCategories.basic.length;
        if (specialCount) specialCount.textContent = this.iconCategories.special.length;
        
        // Hide premium category button since it doesn't exist
        const premiumBtn = document.querySelector('[data-category="premium"]');
        if (premiumBtn) {
            premiumBtn.style.display = 'none';
        }
    }

    renderIconGrid(category) {
        const iconGrid = document.getElementById('icon-grid');
        if (!iconGrid || !this.iconCategories) return;
        
        iconGrid.innerHTML = '';
        const icons = this.iconCategories[category] || [];

        icons.forEach(icon => {
        const iconItem = document.createElement('div');
            iconItem.className = `icon-item ${icon.owned ? '' : 'locked'}`;
            iconItem.onclick = () => {
                if (icon.owned) {
                    this.selectIcon(iconItem, icon.name);
                }
            };
        
        const img = document.createElement('img');
            img.alt = icon.name;
            
            // Load image with fallback using the correct folder
            this.loadIconImage(img, icon.name, icon.folder);
            
            iconItem.appendChild(img);
            iconGrid.appendChild(iconItem);
        });
    }

    loadIconImage(imgElement, iconName, folder = 'Icons/Profile') {
        const basePath = iconName.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, '');
        const extensions = ['png', 'webp', 'jpg', 'jpeg', 'jfif'];
        
        let extensionIndex = 0;
        const tryNextExtension = () => {
            if (extensionIndex < extensions.length) {
                imgElement.src = `../${folder}/${basePath}.${extensions[extensionIndex]}`;
                extensionIndex++;
            } else {
                // If all extensions fail, try fallback to Birdie in Profile folder
                imgElement.src = '../Icons/Profile/Birdie.png';
                imgElement.onerror = null;
            }
        };
        
        imgElement.onerror = tryNextExtension;
        tryNextExtension();
    }

    setupIconCategories() {
        window.switchIconCategory = (category) => {
            // Update active button
            const buttons = document.querySelectorAll('.icon-category-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            const activeBtn = document.querySelector(`[data-category="${category}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }

            // Render icons for selected category
            this.renderIconGrid(category);
        };

        window.filterIcons = () => {
            const searchInput = document.getElementById('icon-search');
            const searchTerm = searchInput.value.toLowerCase();
            const iconItems = document.querySelectorAll('.icon-item');

            iconItems.forEach(item => {
                const img = item.querySelector('img');
                const iconName = img.alt.toLowerCase();
                
                if (iconName.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        };
    }

    async loadProfileTitles() {
        try {
            const userRef = ref(database, `users/${this.currentUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.exists() ? snapshot.val() : {};

            // Only load titles that the user actually owns from Firebase
            this.userOwnedTitles = [
                { name: 'No Title', description: 'Default title', rarity: 'common', owned: true }
            ];

            // Add user's owned titles from Firebase
            if (userData.titles) {
                Object.entries(userData.titles).forEach(([titleName, owned]) => {
                    if (owned === true) {
                        // Format the title name properly
                        const formattedName = this.formatTitleName(titleName);
                        this.userOwnedTitles.push({
                            name: formattedName,
                            description: `Unlocked title: ${formattedName}`,
                            rarity: this.getTitleRarity(titleName),
                            owned: true
                        });
                }
            });
        }
        
            this.renderTitleGrid();
        } catch (error) {
            console.error('Error loading profile titles:', error);
        }
    }

    formatTitleName(titleName) {
        // Handle special formatting for titles
        return titleName.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    getTitleRarity(titleName) {
        // Assign rarity based on title name patterns
        const legendary = ['atlantean warrior', 'celestial protector', 'guardian angel'];
        const epic = ['monster trainer', 'cyber warrior', 'battleborn'];
        const rare = ['santa clause', 'snow angel', 'spirit blossom'];
        
        const lowerTitle = titleName.toLowerCase();
        
        if (legendary.some(title => lowerTitle.includes(title))) return 'legendary';
        if (epic.some(title => lowerTitle.includes(title))) return 'epic';
        if (rare.some(title => lowerTitle.includes(title))) return 'rare';
        
        return 'common';
    }

    renderTitleGrid() {
        const titleGrid = document.getElementById('title-grid');
        if (!titleGrid || !this.userOwnedTitles) return;

        titleGrid.innerHTML = '';

        this.userOwnedTitles.forEach(title => {
            const titleItem = document.createElement('div');
            titleItem.className = 'title-item';
            titleItem.onclick = () => {
                this.selectTitle(titleItem, title.name);
            };

            const raritySpan = document.createElement('span');
            raritySpan.className = `title-rarity ${title.rarity}`;
            raritySpan.textContent = title.rarity;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'title-name';
            nameDiv.textContent = title.name;

            const descDiv = document.createElement('div');
            descDiv.className = 'title-description';
            descDiv.textContent = title.description;

            titleItem.appendChild(raritySpan);
            titleItem.appendChild(nameDiv);
            titleItem.appendChild(descDiv);
            titleGrid.appendChild(titleItem);
        });
    }

    selectIcon(iconElement, iconName) {
        // Remove previous selection
        const prevSelected = document.querySelector('.icon-item.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Add selection to clicked icon
        iconElement.classList.add('selected');

        // Update preview
        this.setPreviewIcon(iconName);
        this.selectedIcon = iconName;
    }

    selectTitle(titleElement, titleName) {
        // Remove previous selection
        const prevSelected = document.querySelector('.title-item.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Add selection to clicked title
        titleElement.classList.add('selected');

        // Update preview
        const previewTitle = document.getElementById('preview-title');
        if (previewTitle) {
            previewTitle.textContent = titleName;
        }
        this.selectedTitle = titleName;
    }
    
    async saveProfileSettings() {
        try {
            const updates = {};
            
            // Save selected icon
            if (this.selectedIcon) {
                updates.icon = this.selectedIcon;
                this.setPlayerIcon(this.selectedIcon);
            }
            
            // Save selected title
            if (this.selectedTitle !== undefined) {
                updates.activeTitle = this.selectedTitle === 'No Title' ? '' : this.selectedTitle;
                const playerTitle = document.getElementById('player-title');
                if (playerTitle) {
                    playerTitle.textContent = this.selectedTitle;
                }
            }

            // Update database
            if (Object.keys(updates).length > 0) {
                const userRef = ref(database, `users/${this.currentUser.uid}`);
                await update(userRef, updates);
            }
            
            this.closeProfileModal();
            this.showSuccessMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile settings:', error);
            this.showErrorMessage('Failed to save profile settings.');
        }
    }

    showSuccessMessage(message) {
        // Create a simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #27ae60, #229954);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Profile action functions
    setupProfileActions() {
        window.viewFullProfile = () => {
            window.open('../Profile.html', '_blank');
        };
    }
    
    logout() {
        signOut(auth).then(() => {
        window.location.href = '../index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    }

    setPreviewIcon(iconName) {
        const previewIcon = document.getElementById('preview-icon');
        if (!previewIcon) return;

        const basePath = iconName.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, '');
        const extensions = ['png', 'webp', 'jpg', 'jpeg', 'jfif'];
        
        let extensionIndex = 0;
        let folderIndex = 0;
        const folders = ['Icons/Profile', 'Icons']; // Try Profile folder first, then main Icons folder
        
        const tryNextExtension = () => {
            if (extensionIndex < extensions.length) {
                previewIcon.src = `../${folders[folderIndex]}/${basePath}.${extensions[extensionIndex]}`;
                extensionIndex++;
            } else if (folderIndex < folders.length - 1) {
                // Try next folder
                folderIndex++;
                extensionIndex = 0;
                previewIcon.src = `../${folders[folderIndex]}/${basePath}.${extensions[extensionIndex]}`;
                extensionIndex++;
            } else {
                // Fallback to default
                previewIcon.src = '../Icons/Profile/Birdie.png';
                previewIcon.onerror = null;
            }
        };
        
        previewIcon.onerror = tryNextExtension;
        tryNextExtension();
    }

    // Build Window Functions
    toggleBuildWindow(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const buildWindow = document.getElementById('build-window');
        if (!buildWindow.classList.contains('show')) {
            buildWindow.style.display = 'block';
            // Trigger reflow
            buildWindow.offsetHeight;
            buildWindow.classList.add('show');
        } else {
            this.closeBuildWindow();
        }
    }

    closeBuildWindow() {
        const buildWindow = document.getElementById('build-window');
        buildWindow.classList.remove('show');
        // Wait for animation to complete before hiding
        setTimeout(() => {
            buildWindow.style.display = 'none';
        }, 300);
    }
}

// Initialize the game client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameClient = new GameClient();
});

// Global functions for navigation
window.startGame = () => {
    window.gameClient.showPanel('game-modes');
};

window.showFighters = () => {
    window.gameClient.showPanel('welcome-panel');
};

window.openStore = () => {
    window.gameClient.showPanel('store-panel');
    window.gameClient.initShop();
};

window.toggleBuildWindow = (event) => {
    window.gameClient.toggleBuildWindow(event);
};

window.closeBuildWindow = () => {
    window.gameClient.closeBuildWindow();
};

// Close build window when clicking outside
window.addEventListener('click', function(event) {
    const buildWindow = document.getElementById('build-window');
    if (event.target === buildWindow) {
        window.gameClient.closeBuildWindow();
    }
});

// Additional global functions for HTML onclick handlers
window.selectGameMode = function(gameFile) {
    // Redirect to the actual game file
    window.location.href = `../${gameFile}`;
};

window.openProfileSettings = function() {
    window.gameClient.openProfileModal();
};

window.closeProfileSettings = function() {
    window.gameClient.closeProfileModal();
};

window.saveProfileSettings = function() {
    window.gameClient.saveProfileSettings();
};

window.logout = function() {
    window.gameClient.logout();
};
