// Battle Arena MOBA-Style JavaScript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { monsters } from './monster-data.js';

// Function to ensure 16:9 aspect ratio
function adjustLayout() {
    const mainContainer = document.getElementById('main-container');
    const header = document.querySelector('.main-header');
    const footer = document.querySelector('.main-footer');
    
    // Calculate available height for main container
    const windowHeight = window.innerHeight;
    const headerHeight = header.offsetHeight;
    const footerHeight = footer.offsetHeight;
    const availableHeight = windowHeight - headerHeight - footerHeight;
    
    // Set container height to maintain 16:9 aspect ratio if needed
    mainContainer.style.height = `${availableHeight}px`;
    
    // Adjust trainer details panel
    const detailsPanel = document.getElementById('trainer-details-panel');
    if (detailsPanel) {
        detailsPanel.style.maxHeight = `${availableHeight - 40}px`;
    }
    
    // Adjust trainer splash area
    const trainerSplash = document.querySelector('.trainer-splash');
    if (trainerSplash) {
        const panelWidth = detailsPanel.offsetWidth;
        const idealHeight = panelWidth / 16 * 9; // 16:9 aspect ratio
        const maxHeight = availableHeight - 40;
        trainerSplash.style.height = `${Math.min(idealHeight, maxHeight)}px`;
    }
}

// Initialize Firebase on document load
document.addEventListener('DOMContentLoaded', () => {
    // Handle window resize to maintain aspect ratio
    window.addEventListener('resize', adjustLayout);
    
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCqhxq6sPDU3EmuvvkBIIDJ-H6PsBc42Jg",
        authDomain: "project-fighters-by-fishb0nes.firebaseapp.com",
        databaseURL: "https://project-fighters-by-fishb0nes-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "project-fighters-by-fishb0nes",
        storageBucket: "project-fighters-by-fishb0nes.appspot.com",
        messagingSenderId: "867339299995",
        appId: "1:867339299995:web:99c379940014b9c05cea3e",
        measurementId: "G-LNEM6HR842"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);
    
    // Initialize auth state observer
    onAuthStateChanged(auth, user => {
        if (user) {
            console.log("User is logged in:", user.displayName || user.email);
            // Update player avatar and info if logged in
            updatePlayerInfo(user);
        } else {
            console.log("No user logged in");
            // Redirect to login page
            window.location.href = '../index.html';
        }
        
        // Load trainers regardless of login status
        loadTrainers();
    });

    // Update player info with user data
    async function updatePlayerInfo(user) {
        const playerAvatarImg = document.getElementById('player-avatar-img');
        const playerLevel = document.getElementById('player-level');
        const playerCM = document.getElementById('player-cm');
        
        try {
            // Get user data from database
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // Set player level and resources
                playerLevel.textContent = `Level 1`; // Fixed at level 1 as requested
                playerCM.textContent = userData.CM || 0;
                
                // If user has a custom icon, use it
                if (userData.icon) {
                    // Try to find the correct format in the Profile directory
                    const tryLoadIcon = (extensions, index = 0) => {
                        if (index >= extensions.length) {
                            playerAvatarImg.src = '../Icons/default-icon.jpg';
                            return;
                        }
                        
                        const testImg = new Image();
                        const ext = extensions[index];
                        const iconName = userData.icon.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, '');
                        testImg.src = `../Icons/Profile/${iconName}.${ext}`;
                        
                        testImg.onload = () => {
                            playerAvatarImg.src = testImg.src;
                        };
                        
                        testImg.onerror = () => {
                            tryLoadIcon(extensions, index + 1);
                        };
                    };
                    
                    tryLoadIcon(['webp', 'png', 'jpg', 'jpeg', 'jfif']);
                }
            }
        } catch (error) {
            console.error("Error getting user data:", error);
        }
    }

    // Define trainer data
    const trainers = {
        lili: {
            id: 'lili',
            name: "Lili",
            title: "Fairy Gym Leader",
            icon: "../Icons/Trainers/Lili.png",
            banner: "../Images/gym-fairy.jpg",
            specialtyType: "FAIRY",
            quote: "The power of cuteness can be surprisingly strong!",
            difficulty: 1,
            reward: {
                badge: "Pixie Badge",
                coins: 1500,
                xp: 2000
            },
            team: [
                {
                    id: "lumillow",
                    level: 50
                },
                {
                    id: "puffsqueak",
                    level: 50
                },
                {
                    id: "nymaria",
                    level: 50
                },
                {
                    id: "bunburrow",
                    level: 50
                },
                {
                    id: "glimmeow",
                    level: 50
                },
                {
                    id: "noctivy",
                    level: 50
                }
            ]
        },
        kotal: {
            id: 'kotal',
            name: "Kotal Kahn",
            title: "Water Gym Leader",
            icon: "../Icons/Trainers/kotal.jpg",
            banner: "../Images/gym-water.jpg",
            specialtyType: "WATER",
            quote: "The tides of battle shall wash away your hopes!",
            difficulty: 2,
            reward: {
                badge: "Aqua Badge",
                coins: 1600,
                xp: 2200
            },
            team: [
                {
                    id: "mizuryon",
                    level: 50
                },
                {
                    id: "brinboon",
                    level: 50
                },
                {
                    id: "vexice",
                    level: 50
                },
                {
                    id: "nerephal",
                    level: 50
                },
                {
                    id: "pechac",
                    level: 50
                },
                {
                    id: "dripplet",
                    level: 50
                }
            ]
        },
        // Additional trainers
        flint: {
            id: 'flint',
            name: "Flint",
            title: "Fire Gym Leader",
            icon: "../Icons/Trainers/flint.jpg",
            banner: "../Images/gym-fire.jpg",
            specialtyType: "FIRE",
            quote: "My burning passion for battle will reduce you to ashes!",
            difficulty: 3,
            reward: {
                badge: "Blaze Badge",
                coins: 1800,
                xp: 2400
            },
            team: [
                {
                    id: "pyrochi",
                    level: 52
                },
                {
                    id: "smouldimp",
                    level: 52
                },
                {
                    id: "furnacron",
                    level: 52
                },
                {
                    id: "emberam",
                    level: 52
                },
                {
                    id: "cinderpaw",
                    level: 52
                },
                {
                    id: "magmamutt",
                    level: 52
                }
            ]
        },
        terra: {
            id: 'terra',
            name: "Terra",
            title: "Ground Gym Leader",
            icon: "../Icons/Trainers/terra.jpg",
            banner: "../Images/gym-ground.jpg",
            specialtyType: "GROUND",
            quote: "Stand your ground or be buried beneath it!",
            difficulty: 4,
            reward: {
                badge: "Terra Badge",
                coins: 1700,
                xp: 2300
            },
            team: [
                {
                    id: "pechac",
                    level: 53
                },
                {
                    id: "sandscour",
                    level: 53
                },
                {
                    id: "terrafang",
                    level: 53
                },
                {
                    id: "quakehoof",
                    level: 53
                },
                {
                    id: "crustscrape",
                    level: 53
                },
                {
                    id: "dustirrel",
                    level: 53
                }
            ]
        }
    };

    // Current selected trainer
    let selectedTrainer = null;

    // Function to load trainers into the container
    function loadTrainers() {
        const trainersContainer = document.querySelector('.trainers-container');
        
        // Clear any existing content
        trainersContainer.innerHTML = '';
        
        // Add trainer cards to the container
        Object.values(trainers).forEach(trainer => {
            const trainerCard = createTrainerCard(trainer);
            trainersContainer.appendChild(trainerCard);
        });
        
        // Set up event listeners
        setupEventListeners();
        
        // Select the first trainer by default
        const firstTrainer = Object.values(trainers)[0];
        selectTrainer(firstTrainer);
        
        // Adjust layout to maintain aspect ratio
        setTimeout(adjustLayout, 100);
    }

    // Function to create a trainer card
    function createTrainerCard(trainer) {
        const card = document.createElement('div');
        card.className = 'trainer-card';
        card.dataset.trainerId = trainer.id;
        
        // Banner image or fallback to type color
        const bannerBg = trainer.banner || `#${Math.floor(Math.random()*16777215).toString(16)}`;
        
        card.innerHTML = `
            <div class="trainer-banner">
                <div class="trainer-banner-bg" style="background-image: url('${bannerBg}')"></div>
            </div>
            <div class="trainer-content">
                <img class="trainer-icon" src="${trainer.icon}" alt="${trainer.name}">
                <h3 class="trainer-name">${trainer.name}</h3>
                <h4 class="trainer-title">${trainer.title}</h4>
                <div class="trainer-type ${trainer.specialtyType}">${trainer.specialtyType.charAt(0) + trainer.specialtyType.slice(1).toLowerCase()}</div>
            </div>
        `;
        
        // Add click event to select this trainer
        card.addEventListener('click', () => {
            selectTrainer(trainer);
        });
        
        return card;
    }

    // Function to select a trainer and show details
    function selectTrainer(trainer) {
        selectedTrainer = trainer;
        
        // Update selected card styling
        document.querySelectorAll('.trainer-card').forEach(card => {
            if (card.dataset.trainerId === trainer.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        
        // Update trainer details panel
        updateTrainerPanel(trainer);
        
        // Show the panel if hidden
        const detailsPanel = document.getElementById('trainer-details-panel');
        detailsPanel.classList.remove('hidden');
        
        // Adjust layout after panel becomes visible
        setTimeout(adjustLayout, 100);
    }

    // Function to show monster tooltip
    function showMonsterTooltip(monster, level, event) {
        const tooltip = document.getElementById('monster-tooltip');
        const rect = event.target.getBoundingClientRect();
        
        // Calculate position to keep tooltip within window bounds
        let left = rect.right + 10;
        let top = rect.top;
        
        // Check right boundary
        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = rect.left - tooltip.offsetWidth - 10;
        }
        
        // Check bottom boundary
        if (top + tooltip.offsetHeight > window.innerHeight) {
            top = window.innerHeight - tooltip.offsetHeight - 10;
        }
        
        // Check top boundary
        if (top < 0) {
            top = 10;
        }
        
        // Set tooltip position
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        // Set monster name
        tooltip.querySelector('.monster-name').textContent = monster.name;
        
        // Set monster types
        const typesContainer = tooltip.querySelector('.monster-types');
        typesContainer.innerHTML = '';
        monster.types.forEach(type => {
            const typeTag = document.createElement('div');
            typeTag.className = `type-tag ${type}`;
            typeTag.textContent = type.charAt(0) + type.slice(1).toLowerCase();
            typesContainer.appendChild(typeTag);
        });
        
        // Set stats using the actual stats from monster-data.js
        const maxStat = Math.max(
            monster.stats.hp,
            monster.stats.attack,
            monster.stats.defense,
            monster.stats.speed
        );
        
        const stats = {
            'hp': monster.stats.hp,
            'atk': monster.stats.attack,
            'def': monster.stats.defense,
            'spd': monster.stats.speed
        };
        
        Object.entries(stats).forEach(([stat, value]) => {
            const statBar = tooltip.querySelector(`.stat-fill.${stat}`);
            const statValue = statBar.parentElement.querySelector('.stat-value');
            const percentage = (value / maxStat) * 100;
            
            statBar.style.width = `${percentage}%`;
            statValue.textContent = value;
        });
        
        // Update tooltip content structure
        const tooltipContent = tooltip.querySelector('.tooltip-abilities');
        tooltipContent.innerHTML = ''; // Clear existing content
        
        // Add moves section
        const movesSection = document.createElement('div');
        movesSection.className = 'tooltip-moves';
        movesSection.innerHTML = '<h5>Moves</h5>';
        const movesList = document.createElement('ul');
        movesList.className = 'moves-list';
        
        // Helper function to get move type
        function getMoveType(moveName) {
            // This is a simplified version - you might want to import actual move data
            const typeHints = {
                'fire': 'FIRE', 'flame': 'FIRE', 'ember': 'FIRE',
                'water': 'WATER', 'aqua': 'WATER', 'hydro': 'WATER',
                'thunder': 'ELECTRIC', 'volt': 'ELECTRIC', 'electric': 'ELECTRIC',
                'grass': 'GRASS', 'leaf': 'GRASS', 'vine': 'GRASS',
                'ice': 'ICE', 'freeze': 'ICE', 'frost': 'ICE',
                'fight': 'FIGHTING', 'karate': 'FIGHTING', 'punch': 'FIGHTING',
                'poison': 'POISON', 'toxic': 'POISON', 'venom': 'POISON',
                'ground': 'GROUND', 'earth': 'GROUND', 'sand': 'GROUND',
                'fly': 'FLYING', 'wing': 'FLYING', 'air': 'FLYING',
                'psychic': 'PSYCHIC', 'psy': 'PSYCHIC', 'mind': 'PSYCHIC',
                'bug': 'BUG', 'insect': 'BUG',
                'rock': 'ROCK', 'stone': 'ROCK',
                'ghost': 'GHOST', 'shadow': 'GHOST', 'phantom': 'GHOST',
                'dragon': 'DRAGON',
                'dark': 'DARK', 'night': 'DARK', 'evil': 'DARK',
                'steel': 'STEEL', 'metal': 'STEEL', 'iron': 'STEEL',
                'fairy': 'FAIRY', 'pixie': 'FAIRY',
                'normal': 'NORMAL', 'tackle': 'NORMAL', 'slam': 'NORMAL'
            };
            
            const moveLower = moveName.toLowerCase();
            for (const [hint, type] of Object.entries(typeHints)) {
                if (moveLower.includes(hint)) {
                    return type;
                }
            }
            
            // Default to the monster's first type if no match found
            return monster.types[0];
        }
        
        monster.abilities.forEach(ability => {
            const li = document.createElement('li');
            li.className = 'move-item';
            const moveType = getMoveType(ability);
            li.classList.add(moveType);
            
            const formattedName = ability.replace(/_/g, ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            li.textContent = formattedName;
            movesList.appendChild(li);
        });
        
        movesSection.appendChild(movesList);
        tooltipContent.appendChild(movesSection);
        
        // Add passive ability if exists
        if (monster.passiveAbility) {
            const passiveSection = document.createElement('div');
            passiveSection.className = 'tooltip-passive';
            passiveSection.innerHTML = `
                <h5>Passive Ability</h5>
                <div class="passive-ability">
                    <span class="passive-name">${monster.passiveAbility.name}</span>
                    <span class="passive-desc">${monster.passiveAbility.description}</span>
                </div>
            `;
            tooltipContent.appendChild(passiveSection);
        }
        
        // Show tooltip
        tooltip.classList.remove('hidden');
    }

    // Function to hide monster tooltip
    function hideMonsterTooltip() {
        const tooltip = document.getElementById('monster-tooltip');
        tooltip.classList.add('hidden');
    }

    // Function to update trainer details panel
    function updateTrainerPanel(trainer) {
        // Get panel elements
        const trainerName = document.getElementById('panel-trainer-name');
        const trainerTitle = document.getElementById('panel-trainer-title');
        const trainerQuote = document.getElementById('panel-trainer-quote');
        const trainerType = document.getElementById('panel-trainer-type');
        const badgeReward = document.getElementById('panel-badge-reward');
        const coinsReward = document.getElementById('panel-coins-reward');
        const xpReward = document.getElementById('panel-xp-reward');
        const teamPreview = document.getElementById('panel-team-preview');
        const trainerArtwork = document.querySelector('.trainer-artwork');
        const difficultyStars = document.querySelector('.difficulty-stars');
        
        // Set trainer details
        trainerName.textContent = trainer.name;
        trainerTitle.textContent = trainer.title;
        trainerQuote.textContent = trainer.quote;
        
        // Set banner artwork
        trainerArtwork.style.backgroundImage = `url('${trainer.banner}')`;
        
        // Set type with class for styling
        trainerType.textContent = trainer.specialtyType.charAt(0) + trainer.specialtyType.slice(1).toLowerCase();
        trainerType.className = 'type-tag ' + trainer.specialtyType;
        
        // Set rewards
        badgeReward.textContent = trainer.reward.badge;
        coinsReward.textContent = `${trainer.reward.coins} Coins`;
        xpReward.textContent = `${trainer.reward.xp} XP`;
        
        // Set difficulty stars
        difficultyStars.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            if (i <= trainer.difficulty) {
                star.className = 'fas fa-star';
            } else if (i - 0.5 === trainer.difficulty) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
            difficultyStars.appendChild(star);
        }
        
        // Build team preview with tooltip functionality
        teamPreview.innerHTML = '';
        trainer.team.forEach(monsterInfo => {
            const monster = monsters[monsterInfo.id];
            if (monster) {
                const monsterPreview = document.createElement('div');
                monsterPreview.className = 'monster-preview';
                
                monsterPreview.innerHTML = `
                    <img src="${monster.image}" alt="${monster.name}">
                    <h5 class="monster-name">${monster.name}</h5>
                    <p class="monster-level">Lv. ${monsterInfo.level}</p>
                `;
                
                // Add tooltip events
                monsterPreview.addEventListener('mouseenter', (e) => {
                    showMonsterTooltip(monster, monsterInfo.level, e);
                });
                
                monsterPreview.addEventListener('mouseleave', () => {
                    hideMonsterTooltip();
                });
                
                teamPreview.appendChild(monsterPreview);
            }
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        const startBattleButton = document.getElementById('start-battle-btn');
        const prevButton = document.querySelector('.prev-btn');
        const nextButton = document.querySelector('.next-btn');
        const trainersContainer = document.querySelector('.trainers-container');
        
        // Start battle button
        startBattleButton.addEventListener('click', () => {
            if (selectedTrainer) {
                startBattle(selectedTrainer.id);
            }
        });
        
        // Carousel navigation
        prevButton.addEventListener('click', () => {
            trainersContainer.scrollBy({
                left: -210,
                behavior: 'smooth'
            });
        });
        
        nextButton.addEventListener('click', () => {
            trainersContainer.scrollBy({
                left: 210,
                behavior: 'smooth'
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                navigateTrainers('prev');
            } else if (e.key === 'ArrowRight') {
                navigateTrainers('next');
            } else if (e.key === 'Enter' && selectedTrainer) {
                startBattle(selectedTrainer.id);
            }
        });
    }
    
    // Function to navigate trainers with keyboard
    function navigateTrainers(direction) {
        if (!selectedTrainer) return;
        
        const trainerIds = Object.keys(trainers);
        const currentIndex = trainerIds.indexOf(selectedTrainer.id);
        let newIndex;
        
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % trainerIds.length;
        } else {
            newIndex = (currentIndex - 1 + trainerIds.length) % trainerIds.length;
        }
        
        const newTrainerId = trainerIds[newIndex];
        selectTrainer(trainers[newTrainerId]);
        
        // Scroll to the selected trainer card
        const selectedCard = document.querySelector(`.trainer-card[data-trainer-id="${newTrainerId}"]`);
        if (selectedCard) {
            selectedCard.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    // Function to start battle with selected trainer
    function startBattle(trainerId) {
        // Play sound effect (if available)
        const battleSound = new Audio('../Sounds/battle-start.mp3');
        battleSound.volume = 0.5;
        battleSound.play().catch(error => console.log('Audio play failed:', error));
        
        // Add battle start animation
        document.body.classList.add('battle-starting');
        
        // Redirect to battle page with trainer ID after animation
        setTimeout(() => {
            window.location.href = `monster-battle.html?gym=${trainerId}`;
        }, 1000);
    }
    
    // Create particle effect for background
    function createParticles() {
        const particlesContainer = document.querySelector('.particles');
        const screenArea = window.innerWidth * window.innerHeight;
        const particleDensity = 0.00003; // Particles per pixel
        const particleCount = Math.min(Math.floor(screenArea * particleDensity), 100); // Cap at 100 particles
        
        // Clear existing particles
        particlesContainer.innerHTML = '';
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Size based on screen dimensions - bigger screens get slightly larger particles
            const size = (Math.random() * 4 + 1) * (window.innerWidth / 1920);
            
            particle.style.width = `${size}px`;
            particle.style.height = particle.style.width;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Scale animation duration with screen size for more consistent feel
            const baseDuration = Math.random() * 20 + 10;
            const scaleFactor = Math.max(0.8, Math.min(1.2, window.innerHeight / 1080));
            particle.style.animationDuration = `${baseDuration * scaleFactor}s`;
            
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Initialize particles
    createParticles();
    
    // Update particles on window resize
    window.addEventListener('resize', () => {
        createParticles();
        adjustLayout();
    });
}); 