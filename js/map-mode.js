// Map Mode - Progressive trainer battles with visual map interface
import { getAllTrainers, getTrainer } from '../Monsters/trainers.js';
import { ref, get, set, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { auth, database } from '../firebase-config.js';

export class MapMode {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.trainers = [];
        this.playerProgress = {
            defeatedTrainers: [],
            currentTrainer: 0,
            totalVictories: 0,
            totalBattles: 0,
            winStreak: 0,
            bestWinStreak: 0
        };
        this.isLoading = false;
        this.initializeTrainers();
    }

    // Initialize trainer progression order
    initializeTrainers() {
        const allTrainers = getAllTrainers();
        
        // Define trainer progression order (easy to hard)
        const trainerOrder = [
            'rookie_riley',
            'scout_sam',
            'camper_casey',
            'student_sarah',
            'younger_sammy',
            'hiker_henry',
            'twins_tim_tom',
            'ace_trainer_alex',
            'opp',
            'kotal_kahn'
        ];

        // Organize trainers in progression order
        this.trainers = trainerOrder.map(id => {
            const trainer = allTrainers.find(t => t.id === id);
            if (!trainer) {
                console.warn(`Trainer ${id} not found in registry`);
                return null;
            }
            return trainer;
        }).filter(trainer => trainer !== null);

        console.log(`🗺️ Map Mode initialized with ${this.trainers.length} trainers`);
    }

    // Load player progress from Firebase
    async loadPlayerProgress() {
        const user = auth.currentUser;
        if (!user) {
            console.warn('No authenticated user for map progress');
            return;
        }

        try {
            this.isLoading = true;
            const progressRef = ref(database, `users/${user.uid}/mapProgress`);
            const snapshot = await get(progressRef);
            
            if (snapshot.exists()) {
                this.playerProgress = { ...this.playerProgress, ...snapshot.val() };
                console.log('📊 Loaded map progress:', this.playerProgress);
            } else {
                // Initialize progress for new player
                await this.savePlayerProgress();
                console.log('🆕 Initialized new map progress');
            }
        } catch (error) {
            console.error('❌ Failed to load map progress:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Save player progress to Firebase
    async savePlayerProgress() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const progressRef = ref(database, `users/${user.uid}/mapProgress`);
            await set(progressRef, this.playerProgress);
            console.log('💾 Saved map progress to Firebase');
        } catch (error) {
            console.error('❌ Failed to save map progress:', error);
        }
    }

    // Mark trainer as defeated
    async markTrainerDefeated(trainerId) {
        if (!this.playerProgress.defeatedTrainers.includes(trainerId)) {
            this.playerProgress.defeatedTrainers.push(trainerId);
            this.playerProgress.totalVictories++;
            this.playerProgress.winStreak++;
            
            if (this.playerProgress.winStreak > this.playerProgress.bestWinStreak) {
                this.playerProgress.bestWinStreak = this.playerProgress.winStreak;
            }

            // Advance to next trainer if this was the current one
            const trainerIndex = this.trainers.findIndex(t => t.id === trainerId);
            if (trainerIndex === this.playerProgress.currentTrainer) {
                this.playerProgress.currentTrainer = Math.min(
                    this.playerProgress.currentTrainer + 1,
                    this.trainers.length - 1
                );
            }

            await this.savePlayerProgress();
            console.log(`🏆 Trainer ${trainerId} marked as defeated`);
        }
    }

    // Record battle attempt (win or loss)
    async recordBattleAttempt(trainerId, victory) {
        this.playerProgress.totalBattles++;
        
        if (victory) {
            await this.markTrainerDefeated(trainerId);
        } else {
            this.playerProgress.winStreak = 0;
            await this.savePlayerProgress();
        }
    }

    // Get trainer status
    getTrainerStatus(trainerId) {
        const isDefeated = this.playerProgress.defeatedTrainers.includes(trainerId);
        const trainerIndex = this.trainers.findIndex(t => t.id === trainerId);
        const isUnlocked = trainerIndex <= this.playerProgress.currentTrainer;
        const isCurrent = trainerIndex === this.playerProgress.currentTrainer && !isDefeated;

        return {
            isDefeated,
            isUnlocked,
            isCurrent,
            index: trainerIndex
        };
    }

    // Show map interface
    async showMapInterface() {
        await this.loadPlayerProgress();
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="map-mode-container">
                <div class="map-header">
                    <h1 class="map-title">🗺️ Trainer Journey</h1>
                    <div class="map-stats">
                        <div class="stat-item">
                            <span class="stat-label">Progress:</span>
                            <span class="stat-value">${this.playerProgress.defeatedTrainers.length}/${this.trainers.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Win Rate:</span>
                            <span class="stat-value">${this.playerProgress.totalBattles > 0 ? 
                                Math.round((this.playerProgress.totalVictories / this.playerProgress.totalBattles) * 100) : 0}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Win Streak:</span>
                            <span class="stat-value">${this.playerProgress.winStreak}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Best Streak:</span>
                            <span class="stat-value">${this.playerProgress.bestWinStreak}</span>
                        </div>
                    </div>
                </div>

                <div class="map-content">
                    <div class="trainer-path">
                        ${this.generateTrainerPath()}
                    </div>
                </div>

                <div class="map-actions">
                    <button class="map-button secondary" onclick="gameEngine.returnToMenu()">
                        ← Back to Menu
                    </button>
                    <button class="map-button primary" onclick="gameEngine.showTrainerSelection()">
                        🎲 Free Battle Mode
                    </button>
                    <button class="map-button scoreboard" onclick="mapMode.showScoreboard()">
                        🏆 Scoreboard
                    </button>
                </div>
            </div>
        `;

        this.addMapStyles();
    }

    // Generate trainer path HTML
    generateTrainerPath() {
        return this.trainers.map((trainer, index) => {
            const status = this.getTrainerStatus(trainer.id);
            const isEven = index % 2 === 0;
            
            return `
                <div class="trainer-node ${status.isDefeated ? 'defeated' : ''} 
                     ${status.isCurrent ? 'current' : ''} 
                     ${!status.isUnlocked ? 'locked' : ''} 
                     ${isEven ? 'left' : 'right'}" 
                     data-trainer-id="${trainer.id}">
                    
                    <div class="trainer-connector ${index === 0 ? 'first' : ''}"></div>
                    
                    <div class="trainer-card" onclick="mapMode.selectTrainer('${trainer.id}')">
                        <div class="trainer-avatar">
                            <img src="${trainer.sprite || 'Icons/Trainers/Lili.png'}" 
                                 alt="${trainer.name}" 
                                 onerror="this.src='Icons/Trainers/Lili.png'">
                            <div class="trainer-status-icon">
                                ${status.isDefeated ? '✅' : status.isCurrent ? '⚡' : !status.isUnlocked ? '🔒' : '❓'}
                            </div>
                        </div>
                        
                        <div class="trainer-info">
                            <h3 class="trainer-name">${trainer.name}</h3>
                            <p class="trainer-description">${trainer.description}</p>
                            <div class="trainer-team">
                                <span class="team-size">${trainer.monsters.length} Monster${trainer.monsters.length > 1 ? 's' : ''}</span>
                                <span class="team-level">Lv. ${Math.min(...trainer.monsters.map(m => m.level))}-${Math.max(...trainer.monsters.map(m => m.level))}</span>
                            </div>
                        </div>
                        
                        <div class="trainer-actions">
                            ${status.isUnlocked ? `
                                <button class="battle-btn ${status.isDefeated ? 'rematch' : 'challenge'}" 
                                        onclick="event.stopPropagation(); mapMode.startTrainerBattle('${trainer.id}')">
                                    ${status.isDefeated ? '🔄 Rematch' : '⚔️ Challenge'}
                                </button>
                            ` : `
                                <button class="battle-btn locked" disabled>
                                    🔒 Locked
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Select trainer for details
    selectTrainer(trainerId) {
        const trainer = this.trainers.find(t => t.id === trainerId);
        const status = this.getTrainerStatus(trainerId);
        
        if (!trainer || !status.isUnlocked) return;

        // Show trainer details modal
        this.showTrainerDetails(trainer, status);
    }

    // Show trainer details modal
    showTrainerDetails(trainer, status) {
        const modal = document.createElement('div');
        modal.className = 'trainer-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${trainer.name}</h2>
                    <button class="close-btn" onclick="this.closest('.trainer-details-modal').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="trainer-portrait">
                        <img src="${trainer.sprite || 'Icons/Trainers/Lili.png'}" alt="${trainer.name}">
                        <div class="status-badge ${status.isDefeated ? 'defeated' : status.isCurrent ? 'current' : 'available'}">
                            ${status.isDefeated ? 'Defeated' : status.isCurrent ? 'Current Challenge' : 'Available'}
                        </div>
                    </div>
                    
                    <div class="trainer-details">
                        <p class="description">${trainer.description}</p>
                        
                        <div class="team-preview">
                            <h3>Team Composition</h3>
                            <div class="monster-list">
                                ${trainer.monsters.map(monster => `
                                    <div class="monster-item">
                                        <span class="monster-name">${monster.species}</span>
                                        <span class="monster-level">Lv. ${monster.level}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="rewards-preview">
                            <h3>Victory Rewards</h3>
                            <div class="reward-list">
                                <div class="reward-item">
                                    <span>💰 ${trainer.rewards.cm.min}-${trainer.rewards.cm.max} CM</span>
                                </div>
                                ${trainer.rewards.items.map(item => `
                                    <div class="reward-item">
                                        <span>🎁 ${item.name} (${item.chance}% chance)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn secondary" onclick="this.closest('.trainer-details-modal').remove()">
                        Close
                    </button>
                    <button class="modal-btn primary" onclick="mapMode.startTrainerBattle('${trainer.id}'); this.closest('.trainer-details-modal').remove();">
                        ${status.isDefeated ? '🔄 Rematch' : '⚔️ Challenge'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Start trainer battle from map
    async startTrainerBattle(trainerId) {
        const status = this.getTrainerStatus(trainerId);
        if (!status.isUnlocked) {
            console.warn('Trainer is locked');
            return;
        }

        try {
            // Start the battle using the game engine with 'map' context
            const success = this.gameEngine.startTrainerBattle(trainerId, 'map');
            if (success) {
                console.log(`🥊 Started map battle against ${trainerId}`);
            }
        } catch (error) {
            console.error('Failed to start trainer battle:', error);
        }
    }

    // Show scoreboard
    async showScoreboard() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Load global leaderboard data
        const leaderboardData = await this.loadGlobalLeaderboard();

        mainContent.innerHTML = `
            <div class="scoreboard-container">
                <div class="scoreboard-header">
                    <h1 class="scoreboard-title">🏆 Global Leaderboard</h1>
                    <div class="scoreboard-tabs">
                        <button class="tab-btn active" onclick="mapMode.switchScoreboardTab('progress')">Progress</button>
                        <button class="tab-btn" onclick="mapMode.switchScoreboardTab('winrate')">Win Rate</button>
                        <button class="tab-btn" onclick="mapMode.switchScoreboardTab('streak')">Win Streak</button>
                    </div>
                </div>

                <div class="scoreboard-content">
                    <div class="personal-stats">
                        <h3>Your Stats</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-number">${this.playerProgress.defeatedTrainers.length}</div>
                                <div class="stat-label">Trainers Defeated</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${this.playerProgress.totalVictories}</div>
                                <div class="stat-label">Total Victories</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${this.playerProgress.totalBattles > 0 ? 
                                    Math.round((this.playerProgress.totalVictories / this.playerProgress.totalBattles) * 100) : 0}%</div>
                                <div class="stat-label">Win Rate</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${this.playerProgress.bestWinStreak}</div>
                                <div class="stat-label">Best Win Streak</div>
                            </div>
                        </div>
                    </div>

                    <div class="global-leaderboard" id="leaderboard-content">
                        ${this.generateLeaderboardHTML(leaderboardData, 'progress')}
                    </div>
                </div>

                <div class="scoreboard-actions">
                    <button class="scoreboard-btn secondary" onclick="mapMode.showMapInterface()">
                        ← Back to Map
                    </button>
                    <button class="scoreboard-btn primary" onclick="mapMode.refreshLeaderboard()">
                        🔄 Refresh
                    </button>
                </div>
            </div>
        `;

        this.addScoreboardStyles();
    }

    // Load global leaderboard data
    async loadGlobalLeaderboard() {
        try {
            const leaderboardRef = ref(database, 'users');
            const snapshot = await get(leaderboardRef);
            
            if (!snapshot.exists()) return [];

            const users = snapshot.val();
            const leaderboardData = [];

            for (const [userId, userData] of Object.entries(users)) {
                if (userData.mapProgress) {
                    const progress = userData.mapProgress;
                    leaderboardData.push({
                        userId,
                        username: userData.username || 'Anonymous',
                        defeatedTrainers: progress.defeatedTrainers?.length || 0,
                        totalVictories: progress.totalVictories || 0,
                        totalBattles: progress.totalBattles || 0,
                        winRate: progress.totalBattles > 0 ? 
                            Math.round((progress.totalVictories / progress.totalBattles) * 100) : 0,
                        bestWinStreak: progress.bestWinStreak || 0,
                        currentStreak: progress.winStreak || 0
                    });
                }
            }

            return leaderboardData;
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    }

    // Generate leaderboard HTML
    generateLeaderboardHTML(data, sortBy) {
        if (!data.length) {
            return '<div class="no-data">No leaderboard data available</div>';
        }

        // Sort data based on criteria
        let sortedData = [...data];
        switch (sortBy) {
            case 'progress':
                sortedData.sort((a, b) => b.defeatedTrainers - a.defeatedTrainers);
                break;
            case 'winrate':
                sortedData.sort((a, b) => b.winRate - a.winRate);
                break;
            case 'streak':
                sortedData.sort((a, b) => b.bestWinStreak - a.bestWinStreak);
                break;
        }

        return `
            <div class="leaderboard-list">
                ${sortedData.slice(0, 20).map((player, index) => `
                    <div class="leaderboard-entry ${player.userId === auth.currentUser?.uid ? 'current-player' : ''}">
                        <div class="rank">#${index + 1}</div>
                        <div class="player-info">
                            <div class="player-name">${player.username}</div>
                            <div class="player-stats">
                                ${sortBy === 'progress' ? `${player.defeatedTrainers}/${this.trainers.length} trainers` : ''}
                                ${sortBy === 'winrate' ? `${player.winRate}% win rate` : ''}
                                ${sortBy === 'streak' ? `${player.bestWinStreak} best streak` : ''}
                            </div>
                        </div>
                        <div class="player-score">
                            ${sortBy === 'progress' ? player.defeatedTrainers : ''}
                            ${sortBy === 'winrate' ? player.winRate + '%' : ''}
                            ${sortBy === 'streak' ? player.bestWinStreak : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Switch scoreboard tab
    async switchScoreboardTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Load and display data for the selected tab
        const leaderboardData = await this.loadGlobalLeaderboard();
        const leaderboardContent = document.getElementById('leaderboard-content');
        if (leaderboardContent) {
            leaderboardContent.innerHTML = this.generateLeaderboardHTML(leaderboardData, tab);
        }
    }

    // Refresh leaderboard
    async refreshLeaderboard() {
        const activeTab = document.querySelector('.tab-btn.active')?.textContent.toLowerCase() || 'progress';
        await this.switchScoreboardTab(activeTab);
    }

    // Add map mode styles
    addMapStyles() {
        if (document.getElementById('map-mode-styles')) return;

        const style = document.createElement('style');
        style.id = 'map-mode-styles';
        style.textContent = `
            .map-mode-container {
                min-height: 100vh;
                background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
                color: white;
                padding: 2rem;
                font-family: 'Segoe UI', sans-serif;
            }

            .map-header {
                text-align: center;
                margin-bottom: 3rem;
            }

            .map-title {
                font-size: 3rem;
                font-weight: bold;
                background: linear-gradient(45deg, #00d4ff, #9b59b6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 1rem;
                text-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
            }

            .map-stats {
                display: flex;
                justify-content: center;
                gap: 2rem;
                flex-wrap: wrap;
            }

            .stat-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 1rem 1.5rem;
                border-radius: 1rem;
                border: 1px solid rgba(0, 212, 255, 0.3);
                backdrop-filter: blur(10px);
            }

            .stat-label {
                color: #b8c5d6;
                font-size: 0.9rem;
                margin-right: 0.5rem;
            }

            .stat-value {
                color: #00d4ff;
                font-weight: bold;
                font-size: 1.1rem;
            }

            .trainer-path {
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
                padding: 2rem 0;
            }

            .trainer-node {
                position: relative;
                margin: 2rem 0;
                display: flex;
                align-items: center;
            }

            .trainer-node.left {
                justify-content: flex-start;
            }

            .trainer-node.right {
                justify-content: flex-end;
            }

            .trainer-node.left .trainer-card {
                margin-left: 2rem;
            }

            .trainer-node.right .trainer-card {
                margin-right: 2rem;
            }

            .trainer-connector {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 4px;
                height: 100px;
                background: linear-gradient(to bottom, #00d4ff, #9b59b6);
                transform: translateX(-50%);
                z-index: 1;
            }

            .trainer-connector.first {
                height: 50px;
                top: 100%;
            }

            .trainer-node:last-child .trainer-connector {
                display: none;
            }

            .trainer-card {
                background: rgba(30, 37, 50, 0.9);
                border: 2px solid rgba(0, 212, 255, 0.3);
                border-radius: 1rem;
                padding: 1.5rem;
                max-width: 400px;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                position: relative;
                z-index: 2;
            }

            .trainer-card:hover {
                border-color: #00d4ff;
                box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
                transform: translateY(-5px);
            }

            .trainer-node.defeated .trainer-card {
                border-color: #00ff88;
                background: rgba(0, 255, 136, 0.1);
            }

            .trainer-node.current .trainer-card {
                border-color: #ffd700;
                background: rgba(255, 215, 0, 0.1);
                animation: pulse 2s infinite;
            }

            .trainer-node.locked .trainer-card {
                border-color: #6c7b8a;
                background: rgba(108, 123, 138, 0.1);
                opacity: 0.6;
                cursor: not-allowed;
            }

            .trainer-avatar {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
            }

            .trainer-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 3px solid rgba(0, 212, 255, 0.5);
                object-fit: cover;
            }

            .trainer-status-icon {
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }

            .trainer-info {
                text-align: center;
                margin-bottom: 1rem;
            }

            .trainer-name {
                font-size: 1.3rem;
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }

            .trainer-description {
                color: #b8c5d6;
                font-size: 0.9rem;
                line-height: 1.4;
                margin-bottom: 1rem;
            }

            .trainer-team {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                color: #6c7b8a;
            }

            .trainer-actions {
                text-align: center;
            }

            .battle-btn {
                background: linear-gradient(45deg, #00d4ff, #9b59b6);
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .battle-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
            }

            .battle-btn.rematch {
                background: linear-gradient(45deg, #00ff88, #00d4ff);
            }

            .battle-btn.locked {
                background: #6c7b8a;
                cursor: not-allowed;
                opacity: 0.6;
            }

            .map-actions {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 3rem;
                flex-wrap: wrap;
            }

            .map-button {
                padding: 1rem 2rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }

            .map-button.primary {
                background: linear-gradient(45deg, #00d4ff, #9b59b6);
                color: white;
            }

            .map-button.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .map-button.scoreboard {
                background: linear-gradient(45deg, #ffd700, #ff9800);
                color: white;
            }

            .map-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            /* Trainer Details Modal */
            .trainer-details-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .modal-content {
                background: rgba(30, 37, 50, 0.95);
                border: 2px solid rgba(0, 212, 255, 0.3);
                border-radius: 1rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                z-index: 1001;
                backdrop-filter: blur(10px);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-header h2 {
                color: #00d4ff;
                margin: 0;
            }

            .close-btn {
                background: none;
                border: none;
                color: #b8c5d6;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.3s ease;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .trainer-portrait {
                text-align: center;
                margin-bottom: 2rem;
            }

            .trainer-portrait img {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 3px solid rgba(0, 212, 255, 0.5);
                object-fit: cover;
            }

            .status-badge {
                display: inline-block;
                padding: 0.5rem 1rem;
                border-radius: 1rem;
                font-size: 0.8rem;
                font-weight: bold;
                margin-top: 1rem;
            }

            .status-badge.defeated {
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
                border: 1px solid #00ff88;
            }

            .status-badge.current {
                background: rgba(255, 215, 0, 0.2);
                color: #ffd700;
                border: 1px solid #ffd700;
            }

            .status-badge.available {
                background: rgba(0, 212, 255, 0.2);
                color: #00d4ff;
                border: 1px solid #00d4ff;
            }

            .trainer-details .description {
                color: #b8c5d6;
                line-height: 1.6;
                margin-bottom: 2rem;
            }

            .team-preview, .rewards-preview {
                margin-bottom: 2rem;
            }

            .team-preview h3, .rewards-preview h3 {
                color: #00d4ff;
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }

            .monster-list, .reward-list {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 0.5rem;
                padding: 1rem;
            }

            .monster-item, .reward-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .monster-item:last-child, .reward-item:last-child {
                border-bottom: none;
            }

            .monster-name {
                color: #b8c5d6;
                text-transform: capitalize;
            }

            .monster-level {
                color: #ffd700;
                font-weight: bold;
            }

            .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                padding: 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-btn {
                padding: 0.8rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .modal-btn.primary {
                background: linear-gradient(45deg, #00d4ff, #9b59b6);
                color: white;
            }

            .modal-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .modal-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .map-mode-container {
                    padding: 1rem;
                }

                .map-title {
                    font-size: 2rem;
                }

                .map-stats {
                    gap: 1rem;
                }

                .stat-item {
                    padding: 0.8rem 1rem;
                }

                .trainer-card {
                    max-width: 300px;
                    padding: 1rem;
                }

                .trainer-node.left .trainer-card,
                .trainer-node.right .trainer-card {
                    margin: 0 auto;
                }

                .trainer-node {
                    justify-content: center !important;
                }

                .map-actions {
                    flex-direction: column;
                    align-items: center;
                }

                .map-button {
                    width: 100%;
                    max-width: 300px;
                }

                .modal-content {
                    width: 95%;
                    margin: 1rem;
                }

                .modal-actions {
                    flex-direction: column;
                }

                .modal-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Add scoreboard styles
    addScoreboardStyles() {
        if (document.getElementById('scoreboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'scoreboard-styles';
        style.textContent = `
            .scoreboard-container {
                min-height: 100vh;
                background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
                color: white;
                padding: 2rem;
                font-family: 'Segoe UI', sans-serif;
            }

            .scoreboard-header {
                text-align: center;
                margin-bottom: 3rem;
            }

            .scoreboard-title {
                font-size: 3rem;
                font-weight: bold;
                background: linear-gradient(45deg, #ffd700, #ff9800);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 2rem;
                text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
            }

            .scoreboard-tabs {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .tab-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 0.8rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: bold;
            }

            .tab-btn.active {
                background: linear-gradient(45deg, #ffd700, #ff9800);
                border-color: #ffd700;
            }

            .tab-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .tab-btn.active:hover {
                background: linear-gradient(45deg, #ffd700, #ff9800);
            }

            .scoreboard-content {
                max-width: 1000px;
                margin: 0 auto;
            }

            .personal-stats {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 1rem;
                padding: 2rem;
                margin-bottom: 3rem;
                backdrop-filter: blur(10px);
            }

            .personal-stats h3 {
                color: #00d4ff;
                margin-bottom: 1.5rem;
                text-align: center;
                font-size: 1.5rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .stat-card {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
                padding: 1.5rem;
                text-align: center;
                transition: all 0.3s ease;
            }

            .stat-card:hover {
                border-color: #00d4ff;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
            }

            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #ffd700;
                margin-bottom: 0.5rem;
            }

            .stat-label {
                color: #b8c5d6;
                font-size: 0.9rem;
            }

            .global-leaderboard {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 1rem;
                padding: 2rem;
                backdrop-filter: blur(10px);
            }

            .leaderboard-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .leaderboard-entry {
                display: flex;
                align-items: center;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
                transition: all 0.3s ease;
            }

            .leaderboard-entry:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .leaderboard-entry.current-player {
                border-color: #ffd700;
                background: rgba(255, 215, 0, 0.1);
            }

            .rank {
                font-size: 1.2rem;
                font-weight: bold;
                color: #ffd700;
                min-width: 60px;
                text-align: center;
            }

            .player-info {
                flex: 1;
                margin-left: 1rem;
            }

            .player-name {
                font-weight: bold;
                color: white;
                margin-bottom: 0.25rem;
            }

            .player-stats {
                color: #b8c5d6;
                font-size: 0.9rem;
            }

            .player-score {
                font-size: 1.1rem;
                font-weight: bold;
                color: #00d4ff;
                min-width: 80px;
                text-align: right;
            }

            .no-data {
                text-align: center;
                color: #6c7b8a;
                padding: 3rem;
                font-size: 1.1rem;
            }

            .scoreboard-actions {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 3rem;
                flex-wrap: wrap;
            }

            .scoreboard-btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }

            .scoreboard-btn.primary {
                background: linear-gradient(45deg, #00d4ff, #9b59b6);
                color: white;
            }

            .scoreboard-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .scoreboard-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .scoreboard-container {
                    padding: 1rem;
                }

                .scoreboard-title {
                    font-size: 2rem;
                }

                .scoreboard-tabs {
                    flex-direction: column;
                    align-items: center;
                }

                .tab-btn {
                    width: 100%;
                    max-width: 200px;
                }

                .stats-grid {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                }

                .leaderboard-entry {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.5rem;
                }

                .rank {
                    min-width: auto;
                }

                .player-info {
                    margin-left: 0;
                }

                .player-score {
                    min-width: auto;
                    text-align: center;
                }

                .scoreboard-actions {
                    flex-direction: column;
                    align-items: center;
                }

                .scoreboard-btn {
                    width: 100%;
                    max-width: 300px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Make MapMode available globally
window.MapMode = MapMode; 