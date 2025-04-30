// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyBOeh3nsMWHiMDPZ_HplIFMSrV7fqArZZM",
    authDomain: "project-fighters.firebaseapp.com",
    projectId: "project-fighters",
    storageBucket: "project-fighters.appspot.com",
    messagingSenderId: "489482476632",
    appId: "1:489482476632:web:c53ab1c55ba351f33b2e05"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const trainerCards = document.querySelectorAll('.trainer-card');
const playerNameElement = document.getElementById('player-name');
const playerLevelElement = document.getElementById('player-level');
const playerCoinsElement = document.getElementById('player-coins');
const playerGemsElement = document.getElementById('player-gems');
const startBattleBtn = document.getElementById('start-battle');
const selectedTrainerDetailsElement = document.getElementById('selected-trainer-details');
const monsterListElement = document.getElementById('monster-list');

// Global variables
let currentUser = null;
let selectedTrainer = null;
let playerMonsters = [];
let selectedMonsters = [];

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        loadUserData();
    } else {
        // Redirect to login if not logged in
        window.location.href = '../index.html';
    }
});

// Load user data from Firestore
function loadUserData() {
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Display user info
                playerNameElement.textContent = userData.username || 'Trainer';
                playerLevelElement.textContent = `Level ${userData.level || 1}`;
                playerCoinsElement.textContent = userData.coins || 0;
                playerGemsElement.textContent = userData.gems || 0;
                
                // Load user's monsters
                loadUserMonsters();
            }
        })
        .catch(error => {
            console.error("Error loading user data:", error);
        });
}

// Load user's monsters from Firestore
function loadUserMonsters() {
    db.collection('users').doc(currentUser.uid).collection('monsters').get()
        .then(snapshot => {
            playerMonsters = [];
            snapshot.forEach(doc => {
                playerMonsters.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Initialize the monster selection UI
            updateMonsterSelectionUI();
        })
        .catch(error => {
            console.error("Error loading monsters:", error);
        });
}

// Update the monster selection UI
function updateMonsterSelectionUI() {
    monsterListElement.innerHTML = '';
    
    playerMonsters.forEach(monster => {
        const monsterCard = document.createElement('div');
        monsterCard.className = 'monster-card';
        monsterCard.dataset.monsterId = monster.id;
        
        // Check if monster is selected
        if (selectedMonsters.find(m => m.id === monster.id)) {
            monsterCard.classList.add('selected');
        }
        
        monsterCard.innerHTML = `
            <div class="monster-avatar">
                <img src="${monster.imageUrl || '../assets/monsters/default.png'}" alt="${monster.name}">
            </div>
            <div class="monster-info">
                <h3>${monster.name}</h3>
                <div class="monster-stats">
                    <span class="monster-level">Lvl ${monster.level || 1}</span>
                    <span class="monster-type ${monster.type || 'normal'}">${monster.type || 'Normal'}</span>
                </div>
                <div class="monster-power">
                    <div class="power-bar">
                        <div class="power-fill" style="width: ${calculatePowerPercentage(monster)}%"></div>
                    </div>
                    <span class="power-text">${calculateMonsterPower(monster)}</span>
                </div>
            </div>
        `;
        
        monsterCard.addEventListener('click', () => toggleMonsterSelection(monster, monsterCard));
        monsterListElement.appendChild(monsterCard);
    });
}

// Calculate monster power as a number
function calculateMonsterPower(monster) {
    return Math.floor((monster.attack || 5) * 0.4 + 
                     (monster.defense || 5) * 0.3 + 
                     (monster.speed || 5) * 0.3) * 
                     (monster.level || 1);
}

// Calculate power percentage for UI display (max 100)
function calculatePowerPercentage(monster) {
    const power = calculateMonsterPower(monster);
    return Math.min(100, power / 2);
}

// Toggle monster selection
function toggleMonsterSelection(monster, card) {
    const index = selectedMonsters.findIndex(m => m.id === monster.id);
    
    if (index >= 0) {
        // Deselect the monster
        selectedMonsters.splice(index, 1);
        card.classList.remove('selected');
    } else {
        // Select the monster (max 3)
        if (selectedMonsters.length < 3) {
            selectedMonsters.push(monster);
            card.classList.add('selected');
        } else {
            showNotification('You can only select up to 3 monsters!', 'warning');
        }
    }
    
    // Update battle button state
    updateBattleButtonState();
}

// Update the battle button state based on selections
function updateBattleButtonState() {
    if (selectedTrainer && selectedMonsters.length > 0) {
        startBattleBtn.disabled = false;
        startBattleBtn.classList.remove('disabled');
    } else {
        startBattleBtn.disabled = true;
        startBattleBtn.classList.add('disabled');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Handle trainer card selection
trainerCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove selected class from all trainer cards
        trainerCards.forEach(c => c.classList.remove('selected'));
        
        // Add selected class to clicked card
        card.classList.add('selected');
        
        // Store selected trainer data
        selectedTrainer = {
            id: card.dataset.trainerId,
            name: card.querySelector('.trainer-name').textContent,
            difficulty: card.dataset.difficulty,
            element: card.dataset.element
        };
        
        // Update trainer details panel
        updateTrainerDetails(selectedTrainer);
        
        // Update battle button state
        updateBattleButtonState();
    });
});

// Update trainer details in the panel
function updateTrainerDetails(trainer) {
    // Get trainer data from Firebase
    db.collection('trainers').doc(trainer.id).get()
        .then(doc => {
            if (doc.exists) {
                const trainerData = doc.data();
                
                // Update the trainer details panel
                selectedTrainerDetailsElement.innerHTML = `
                    <div class="trainer-profile">
                        <div class="trainer-avatar">
                            <img src="${trainerData.imageUrl || '../assets/trainers/default.png'}" alt="${trainer.name}">
                        </div>
                        <div class="trainer-info">
                            <h2>${trainer.name}</h2>
                            <div class="trainer-badges">
                                <span class="trainer-element ${trainer.element}">${trainer.element}</span>
                                <span class="trainer-difficulty ${trainer.difficulty}">${trainer.difficulty}</span>
                            </div>
                            <p class="trainer-description">${trainerData.description || 'A mysterious trainer ready for battle!'}</p>
                        </div>
                    </div>
                `;
                
                // Load trainer's monsters
                if (trainerData.monsters) {
                    const monsterContainer = document.createElement('div');
                    monsterContainer.className = 'trainer-monsters';
                    monsterContainer.innerHTML = '<h3>Trainer Monsters</h3><div class="monster-icons"></div>';
                    
                    const monsterIcons = monsterContainer.querySelector('.monster-icons');
                    
                    trainerData.monsters.forEach(monsterId => {
                        db.collection('monsters').doc(monsterId).get()
                            .then(monsterDoc => {
                                if (monsterDoc.exists) {
                                    const monster = monsterDoc.data();
                                    const monsterIcon = document.createElement('div');
                                    monsterIcon.className = `monster-icon ${monster.type || 'normal'}`;
                                    monsterIcon.innerHTML = `
                                        <img src="${monster.iconUrl || '../assets/monsters/icons/default.png'}" alt="${monster.name}">
                                        <span>${monster.name}</span>
                                    `;
                                    monsterIcons.appendChild(monsterIcon);
                                }
                            });
                    });
                    
                    selectedTrainerDetailsElement.appendChild(monsterContainer);
                }
            }
        })
        .catch(error => {
            console.error("Error loading trainer details:", error);
        });
}

// Handle start battle button click
startBattleBtn.addEventListener('click', () => {
    if (!selectedTrainer) {
        showNotification('Please select a trainer first!', 'warning');
        return;
    }
    
    if (selectedMonsters.length === 0) {
        showNotification('Please select at least one monster!', 'warning');
        return;
    }
    
    // Start battle animation
    document.body.classList.add('battle-starting');
    
    // Create battle session in Firebase
    const battleData = {
        userId: currentUser.uid,
        trainerId: selectedTrainer.id,
        playerMonsters: selectedMonsters.map(m => m.id),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'starting'
    };
    
    db.collection('battles').add(battleData)
        .then(docRef => {
            // Redirect to battle arena with battle ID
            setTimeout(() => {
                window.location.href = `battle-arena.html?id=${docRef.id}`;
            }, 1000);
        })
        .catch(error => {
            console.error("Error starting battle:", error);
            document.body.classList.remove('battle-starting');
            showNotification('Error starting battle. Please try again.', 'error');
        });
});

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load trainer cards from Firebase
    db.collection('trainers').get()
        .then(snapshot => {
            const trainersContainer = document.querySelector('.trainers-container');
            trainersContainer.innerHTML = ''; // Clear placeholder trainers
            
            snapshot.forEach(doc => {
                const trainer = doc.data();
                const trainerCard = document.createElement('div');
                trainerCard.className = 'trainer-card';
                trainerCard.dataset.trainerId = doc.id;
                trainerCard.dataset.difficulty = trainer.difficulty || 'normal';
                trainerCard.dataset.element = trainer.element || 'neutral';
                
                trainerCard.innerHTML = `
                    <div class="trainer-image">
                        <img src="${trainer.imageUrl || '../assets/trainers/default.png'}" alt="${trainer.name}">
                    </div>
                    <div class="trainer-name">${trainer.name}</div>
                    <div class="trainer-badges">
                        <span class="trainer-element ${trainer.element || 'neutral'}">${trainer.element || 'Neutral'}</span>
                        <span class="trainer-difficulty ${trainer.difficulty || 'normal'}">${trainer.difficulty || 'Normal'}</span>
                    </div>
                `;
                
                trainerCard.addEventListener('click', () => {
                    // Handle trainer selection
                    trainerCards.forEach(c => c.classList.remove('selected'));
                    trainerCard.classList.add('selected');
                    
                    selectedTrainer = {
                        id: doc.id,
                        name: trainer.name,
                        difficulty: trainer.difficulty || 'normal',
                        element: trainer.element || 'neutral'
                    };
                    
                    updateTrainerDetails(selectedTrainer);
                    updateBattleButtonState();
                });
                
                trainersContainer.appendChild(trainerCard);
            });
        })
        .catch(error => {
            console.error("Error loading trainers:", error);
        });
});

// Carousel navigation
const prevButton = document.getElementById('carousel-prev');
const nextButton = document.getElementById('carousel-next');
const trainersContainer = document.querySelector('.trainers-container');

prevButton.addEventListener('click', () => {
    trainersContainer.scrollBy({ left: -300, behavior: 'smooth' });
});

nextButton.addEventListener('click', () => {
    trainersContainer.scrollBy({ left: 300, behavior: 'smooth' });
}); 