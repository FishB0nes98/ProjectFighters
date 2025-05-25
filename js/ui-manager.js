// UI Manager - Modern retro interface for the monster game
import { battleAudio } from '../Monsters/animations/battle-audio.js';
import { getAllTrainers } from '../Monsters/trainers.js';
import { createXPProgressBar, addXPToBattleInfo, showLevelUpNotification } from './xp-ui-utils.js';

export class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentScreen = 'menu';
        this.battleMessageQueue = [];
        this.messageDisplaySpeed = 20; // milliseconds per character (reduced from 50 for faster text)
        this.isDisplayingMessage = false;
        
        // Load saved settings on initialization
        this.loadSettings();
    }

    // Show the battle screen
    showBattleScreen(battleState) {
        this.currentScreen = 'battle';
        this.renderBattleUI(battleState);
    }

    // Render the main battle interface
    renderBattleUI(battleState) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="battle-screen">
                <div class="battle-field">
                    <!-- Opponent Monster -->
                    <div class="opponent-area">
                        <div class="monster-sprite opponent-sprite">
                            <img src="/Monsters/${battleState.activeOpponent.name}.png" 
                                 alt="${battleState.activeOpponent.name}"
                                 class="monster-image"

                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNDQ0Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxMiI+4p2T77iPPC90ZXh0Pgo8L3N2Zz4K'">
                        </div>
                        <div class="monster-info opponent-info">
                            <div class="monster-name">${battleState.activeOpponent.name}</div>
                            <div class="monster-level-type">
                                <span class="monster-level">Lv.${battleState.activeOpponent.level}</span>
                                <span class="monster-types">
                                    ${battleState.activeOpponent.types.map(type => 
                                        `<span class="type-badge" style="background-color: ${this.getTypeColor(type)}">${type}</span>`
                                    ).join(' ')}
                                </span>
                            </div>
                            <div class="hp-bar-container">
                                <div class="hp-bar">
                                    <div class="hp-fill ${this.getHPBarClass(battleState.activeOpponent)}" style="width: ${(battleState.activeOpponent.currentHP / battleState.activeOpponent.maxHP) * 100}%"></div>
                                </div>
                                <div class="hp-text">${battleState.activeOpponent.currentHP}/${battleState.activeOpponent.maxHP}</div>
                            </div>
                            ${battleState.activeOpponent.statusCondition !== 'none' ? 
                                `<div class="status-indicator ${battleState.activeOpponent.statusCondition}">${battleState.activeOpponent.statusCondition.toUpperCase()}</div>` : ''}
                        </div>
                    </div>

                    <!-- Battle Effects Area -->
                    <div class="battle-effects">
                        ${this.renderFieldEffects(battleState.fieldEffects)}
                        <div class="weather-indicator">
                            ${battleState.weather ? `<span class="weather ${battleState.weather}">${battleState.weather.toUpperCase()}</span>` : ''}
                        </div>
                    </div>

                    <!-- Player Monster -->
                    <div class="player-area">
                        <div class="monster-sprite player-sprite">
                            <img src="/Monsters/${battleState.activePlayer.name}.png" 
                                 alt="${battleState.activePlayer.name}"
                                 class="monster-image"

                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIxMiI+4p2k77iPPC90ZXh0Pgo8L3N2Zz4K'">
                        </div>
                        <div class="monster-info player-info">
                            <div class="monster-name">${battleState.activePlayer.name}</div>
                            <div class="monster-level-type">
                                <span class="monster-level">Lv.${battleState.activePlayer.level}</span>
                                <span class="monster-types">
                                    ${battleState.activePlayer.types.map(type => 
                                        `<span class="type-badge" style="background-color: ${this.getTypeColor(type)}">${type}</span>`
                                    ).join(' ')}
                                </span>
                            </div>
                            <div class="hp-bar-container">
                                <div class="hp-bar">
                                    <div class="hp-fill ${this.getHPBarClass(battleState.activePlayer)}" style="width: ${(battleState.activePlayer.currentHP / battleState.activePlayer.maxHP) * 100}%"></div>
                                </div>
                                <div class="hp-text">${battleState.activePlayer.currentHP}/${battleState.activePlayer.maxHP}</div>
                            </div>
                            ${battleState.activePlayer.statusCondition !== 'none' ? 
                                `<div class="status-indicator ${battleState.activePlayer.statusCondition}">${battleState.activePlayer.statusCondition.toUpperCase()}</div>` : ''}
                            <div class="ability-indicator">
                                <span class="ability-name">${battleState.activePlayer.ability?.name || 'No Ability'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Battle UI -->
                <div class="battle-ui">
                    <div class="battle-log">
                        <div class="log-content" id="battle-log-content">
                            ${battleState.battleLog.map(msg => `<div class="log-message">${msg}</div>`).join('')}
                        </div>
                    </div>

                    <div class="battle-controls">
                        ${battleState.phase === 'select' ? this.renderMoveSelection(battleState.activePlayer) : ''}
                        ${battleState.phase === 'execute' ? '<div class="executing">Executing moves...</div>' : ''}
                    </div>
                </div>

                <!-- Turn Counter -->
                <div class="turn-indicator">
                    <span>Turn ${battleState.turn}</span>
                </div>
            </div>
        `;

        // Add event listeners for moves
        if (battleState.phase === 'select') {
            this.attachMoveEventListeners();
        }

        // Add right-click event listeners for monster sprites
        setTimeout(() => {
            const playerSprite = document.querySelector('.player-area .monster-sprite img');
            const opponentSprite = document.querySelector('.opponent-area .monster-sprite img');
            
            if (playerSprite && battleState.activePlayer) {
                this.attachMonsterSpriteRightClick(playerSprite, battleState.activePlayer);
            }
            
            if (opponentSprite && battleState.activeOpponent) {
                this.attachMonsterSpriteRightClick(opponentSprite, battleState.activeOpponent);
            }
        }, 100);

        // Add XP displays to monster info
        this.addXPDisplaysToBattleUI(battleState);

        // Auto-scroll battle log to bottom
        this.scrollBattleLogToBottom();
    }

    // Get HP bar CSS class based on HP percentage
    getHPBarClass(monster) {
        const hpPercent = (monster.currentHP / monster.maxHP) * 100;
        if (hpPercent <= 25) return 'critical';
        if (hpPercent <= 50) return 'low';
        return '';
    }

    // Get type color for move type indicators
    getTypeColor(type) {
        const typeColors = {
            'Normal': '#A8A878',
            'Fighting': '#C03028', 
            'Flying': '#A890F0',
            'Poison': '#A040A0',
            'Ground': '#E0C068',
            'Rock': '#B8A038',
            'Bug': '#A8B820',
            'Ghost': '#705898',
            'Steel': '#B8B8D0',
            'Fire': '#F08030',
            'Water': '#6890F0',
            'Grass': '#78C850',
            'Electric': '#F8D030',
            'Psychic': '#F85888',
            'Ice': '#98D8D8',
            'Dragon': '#7038F8',
            'Dark': '#705848',
            'Fairy': '#EE99AC'
        };
        return typeColors[type] || '#68A090';
    }

    // Render move selection buttons
    renderMoveSelection(monster) {
        const battleState = this.gameEngine.battleManager?.getBattleState();
        const canSwitch = battleState?.playerCanSwitch && battleState?.playerTeam?.filter(m => m.currentHP > 0 && m !== battleState.activePlayer).length > 0;
        
        return `
            <div class="move-selection">
                <div class="moves-grid">
                    ${monster.moves.map((move, index) => `
                        <button class="move-button ${move.pp <= 0 ? 'disabled' : ''}" 
                                data-move-index="${index}"
                                ${move.pp <= 0 ? 'disabled' : ''}>
                            <div class="move-name">${move.name}</div>
                            <div class="move-type" style="background-color: ${this.getTypeColor(move.type)}">${move.type}</div>
                            <div class="move-stats">
                                <span class="move-power">${move.power || '--'}</span>
                                <span class="move-accuracy">${move.accuracy}%</span>
                                <span class="move-pp">${move.pp}/${move.maxPP}</span>
                            </div>
                            <div class="move-description">${move.description}</div>
                            ${move.priority > 0 ? '<div class="priority-indicator">+' + move.priority + '</div>' : ''}
                            ${move.effects && move.effects.length > 0 ? 
                                `<div class="move-effects">${move.effects.map(effect => 
                                    `<span class="effect-tag ${effect}">${effect.replace('_', ' ')}</span>`
                                ).join('')}</div>` : ''}
                        </button>
                    `).join('')}
                </div>
                
                <div class="battle-options">
                    <button class="option-button" disabled>Bag</button>
                    <button class="option-button switch-button" ${!canSwitch ? 'disabled' : ''} id="switch-button">Switch</button>
                    <button class="option-button" disabled>Run</button>
                </div>
            </div>
        `;
    }

    // Render field effects
    renderFieldEffects(fieldEffects) {
        let effectsHtml = '';

        if (fieldEffects.playerSide.lightScreen) {
            effectsHtml += `<div class="field-effect light-screen">Light Screen (${fieldEffects.playerSide.lightScreen.turnsRemaining})</div>`;
        }

        if (fieldEffects.opponentSide.lightScreen) {
            effectsHtml += `<div class="field-effect light-screen opponent">Opponent Light Screen (${fieldEffects.opponentSide.lightScreen.turnsRemaining})</div>`;
        }

        return effectsHtml;
    }

    // Attach event listeners for move buttons with audio
    attachMoveEventListeners() {
        const moveButtons = document.querySelectorAll('.move-button:not(.disabled)');
        moveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                battleAudio.playUISound('button_click');
                const moveIndex = parseInt(e.currentTarget.dataset.moveIndex);
                this.selectMove(moveIndex);
            });

            // Add hover effects to show type effectiveness
            button.addEventListener('mouseenter', (e) => {
                battleAudio.playUISound('button_hover');
                this.showMovePreview(parseInt(e.currentTarget.dataset.moveIndex));
            });

            button.addEventListener('mouseleave', (e) => {
                this.hideMovePreview(parseInt(e.currentTarget.dataset.moveIndex));
            });
        });

        // Add switch button event listener
        const switchButton = document.getElementById('switch-button');
        if (switchButton && !switchButton.disabled) {
            switchButton.addEventListener('click', () => {
                battleAudio.playUISound('menu_select');
                this.showSwitchSelection();
            });
        }
    }

    // Select a move with audio feedback
    selectMove(moveIndex) {
        if (this.gameEngine.battleManager) {
            // Check if actions are locked
            if (!this.gameEngine.battleManager.canPerformAction()) {
                battleAudio.playUISound('error');
                console.log('❌ Move selection blocked - battle manager busy');
                return;
            }
            
            const success = this.gameEngine.battleManager.selectMove(moveIndex);
            if (!success) {
                battleAudio.playUISound('error');
            }
        }
    }

    // Show move effectiveness preview
    showMovePreview(moveIndex) {
        const battleState = this.gameEngine.battleManager?.getBattleState();
        if (!battleState) return;

        const move = battleState.activePlayer.moves[moveIndex];
        const target = battleState.activeOpponent;
        
        // Use the proper type effectiveness function
        const effectiveness = this.calculateTypeEffectiveness(move.type, target.types);

        // Show effectiveness indicator
        let effectivenessText = '';
        let effectivenessClass = '';

        if (effectiveness > 1) {
            effectivenessText = 'Super Effective!';
            effectivenessClass = 'super-effective';
        } else if (effectiveness < 1 && effectiveness > 0) {
            effectivenessText = 'Not very effective...';
            effectivenessClass = 'not-very-effective';
        } else if (effectiveness === 0) {
            effectivenessText = 'No effect!';
            effectivenessClass = 'no-effect';
        }

        // Add preview to move button
        const moveButton = document.querySelector(`[data-move-index="${moveIndex}"]`);
        if (moveButton && effectivenessText) {
            const existingPreview = moveButton.querySelector('.effectiveness-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            const preview = document.createElement('div');
            preview.className = `effectiveness-preview ${effectivenessClass}`;
            preview.textContent = effectivenessText;
            moveButton.appendChild(preview);
        }
    }

    // Hide move effectiveness preview
    hideMovePreview(moveIndex) {
        const moveButton = document.querySelector(`[data-move-index="${moveIndex}"]`);
        if (moveButton) {
            const existingPreview = moveButton.querySelector('.effectiveness-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
        }
    }

    // Calculate type effectiveness using simplified chart
    calculateTypeEffectiveness(attackType, targetTypes) {
        let effectiveness = 1;
        
        for (const targetType of targetTypes) {
            // Super effective matchups
            if (
                (attackType === "Water" && ["Fire", "Ground", "Rock"].includes(targetType)) ||
                (attackType === "Fire" && ["Grass", "Bug", "Steel", "Ice"].includes(targetType)) ||
                (attackType === "Grass" && ["Water", "Ground", "Rock"].includes(targetType)) ||
                (attackType === "Electric" && ["Water", "Flying"].includes(targetType)) ||
                (attackType === "Ground" && ["Electric", "Fire", "Poison", "Rock", "Steel"].includes(targetType)) ||
                (attackType === "Rock" && ["Fire", "Ice", "Flying", "Bug"].includes(targetType)) ||
                (attackType === "Fighting" && ["Normal", "Rock", "Steel", "Ice", "Dark"].includes(targetType)) ||
                (attackType === "Flying" && ["Fighting", "Bug", "Grass"].includes(targetType)) ||
                (attackType === "Psychic" && ["Fighting", "Poison"].includes(targetType)) ||
                (attackType === "Bug" && ["Grass", "Psychic", "Dark"].includes(targetType)) ||
                (attackType === "Ghost" && ["Ghost", "Psychic"].includes(targetType)) ||
                (attackType === "Dragon" && ["Dragon"].includes(targetType)) ||
                (attackType === "Dark" && ["Ghost", "Psychic"].includes(targetType)) ||
                (attackType === "Steel" && ["Rock", "Ice", "Fairy"].includes(targetType)) ||
                (attackType === "Fairy" && ["Fighting", "Dragon", "Dark"].includes(targetType)) ||
                (attackType === "Ice" && ["Flying", "Ground", "Grass", "Dragon"].includes(targetType)) ||
                (attackType === "Poison" && ["Grass", "Fairy"].includes(targetType))
            ) {
                effectiveness *= 2;
            }
            
            // Not very effective matchups
            else if (
                (attackType === "Water" && ["Water", "Grass", "Dragon"].includes(targetType)) ||
                (attackType === "Fire" && ["Fire", "Water", "Rock", "Dragon"].includes(targetType)) ||
                (attackType === "Grass" && ["Flying", "Poison", "Bug", "Steel", "Fire", "Grass", "Dragon"].includes(targetType)) ||
                (attackType === "Electric" && ["Electric", "Grass", "Dragon"].includes(targetType)) ||
                (attackType === "Ground" && ["Flying", "Bug", "Grass"].includes(targetType)) ||
                (attackType === "Rock" && ["Fighting", "Ground", "Steel"].includes(targetType)) ||
                (attackType === "Fighting" && ["Flying", "Poison", "Bug", "Psychic", "Fairy"].includes(targetType)) ||
                (attackType === "Flying" && ["Rock", "Steel", "Electric"].includes(targetType)) ||
                (attackType === "Psychic" && ["Steel", "Psychic"].includes(targetType)) ||
                (attackType === "Bug" && ["Fighting", "Flying", "Poison", "Ghost", "Steel", "Fire", "Fairy"].includes(targetType)) ||
                (attackType === "Ghost" && ["Dark"].includes(targetType)) ||
                (attackType === "Dragon" && ["Steel"].includes(targetType)) ||
                (attackType === "Dark" && ["Fighting", "Dark", "Fairy"].includes(targetType)) ||
                (attackType === "Steel" && ["Steel", "Fire", "Water", "Electric"].includes(targetType)) ||
                (attackType === "Fairy" && ["Poison", "Steel", "Fire"].includes(targetType)) ||
                (attackType === "Ice" && ["Steel", "Fire", "Water", "Ice"].includes(targetType)) ||
                (attackType === "Poison" && ["Poison", "Ground", "Rock", "Ghost"].includes(targetType))
            ) {
                effectiveness *= 0.5;
            }
            
            // No effect matchups
            else if (
                (attackType === "Normal" && targetType === "Ghost") ||
                (attackType === "Electric" && targetType === "Ground") ||
                (attackType === "Fighting" && targetType === "Ghost") ||
                (attackType === "Poison" && targetType === "Steel") ||
                (attackType === "Ground" && targetType === "Flying") ||
                (attackType === "Psychic" && targetType === "Dark") ||
                (attackType === "Ghost" && targetType === "Normal") ||
                (attackType === "Dragon" && targetType === "Fairy")
            ) {
                effectiveness *= 0;
            }
        }
        
        return effectiveness;
    }

    // Update battle UI (called during battle)
    updateBattleUI(battleState) {
        this.updateMonsterSprites(battleState);
        this.updateHPBars(battleState);
        this.updateMoveSelection(battleState);
        this.updateFieldEffects(battleState);
        this.updateTurnCounter(battleState);
    }

    // Update monster sprites and info when switching
    updateMonsterSprites(battleState) {
        // Update player monster
        const playerSprite = document.querySelector('.player-area .monster-sprite img');
        const playerName = document.querySelector('.player-area .monster-name');
        const playerLevel = document.querySelector('.player-area .monster-level');
        const playerTypes = document.querySelector('.player-area .monster-types');
        const playerStatus = document.querySelector('.player-area .status-indicator');
        const playerAbility = document.querySelector('.player-area .ability-indicator .ability-name');
        
        if (playerSprite && battleState.activePlayer) {
            playerSprite.src = `/Monsters/${battleState.activePlayer.name}.png`;
            playerSprite.alt = battleState.activePlayer.name;
            // Add right-click event listener for player monster
            this.attachMonsterSpriteRightClick(playerSprite, battleState.activePlayer);
        }
        if (playerName) {
            playerName.textContent = battleState.activePlayer.name;
        }
        if (playerLevel) {
            playerLevel.textContent = `Lv.${battleState.activePlayer.level}`;
        }
        if (playerTypes) {
            playerTypes.innerHTML = battleState.activePlayer.types.map(type => 
                `<span class="type-badge" style="background-color: ${this.getTypeColor(type)}">${type}</span>`
            ).join(' ');
        }
        if (playerAbility) {
            playerAbility.textContent = battleState.activePlayer.ability?.name || 'No Ability';
        }
        
        // Update/remove status indicator
        const playerInfoDiv = document.querySelector('.player-area .monster-info');
        if (playerInfoDiv) {
            // Remove existing status indicator
            const existingStatus = playerInfoDiv.querySelector('.status-indicator');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            // Add new status indicator if needed
            if (battleState.activePlayer.statusCondition !== 'none') {
                const statusDiv = document.createElement('div');
                statusDiv.className = `status-indicator ${battleState.activePlayer.statusCondition}`;
                statusDiv.textContent = battleState.activePlayer.statusCondition.toUpperCase();
                playerInfoDiv.appendChild(statusDiv);
            }
            
            // Update XP display for switched monster
            this.updateXPDisplayForMonster(playerInfoDiv, battleState.activePlayer);
        }

        // Update opponent monster
        const opponentSprite = document.querySelector('.opponent-area .monster-sprite img');
        const opponentName = document.querySelector('.opponent-area .monster-name');
        const opponentLevel = document.querySelector('.opponent-area .monster-level');
        const opponentTypes = document.querySelector('.opponent-area .monster-types');
        
        if (opponentSprite && battleState.activeOpponent) {
            opponentSprite.src = `/Monsters/${battleState.activeOpponent.name}.png`;
            opponentSprite.alt = battleState.activeOpponent.name;
            // Add right-click event listener for opponent monster
            this.attachMonsterSpriteRightClick(opponentSprite, battleState.activeOpponent);
        }
        if (opponentName) {
            opponentName.textContent = battleState.activeOpponent.name;
        }
        if (opponentLevel) {
            opponentLevel.textContent = `Lv.${battleState.activeOpponent.level}`;
        }
        if (opponentTypes) {
            opponentTypes.innerHTML = battleState.activeOpponent.types.map(type => 
                `<span class="type-badge" style="background-color: ${this.getTypeColor(type)}">${type}</span>`
            ).join(' ');
        }
        
        // Update/remove status indicator for opponent
        const opponentInfoDiv = document.querySelector('.opponent-area .monster-info');
        if (opponentInfoDiv) {
            // Remove existing status indicator
            const existingStatus = opponentInfoDiv.querySelector('.status-indicator');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            // Add new status indicator if needed
            if (battleState.activeOpponent.statusCondition !== 'none') {
                const statusDiv = document.createElement('div');
                statusDiv.className = `status-indicator ${battleState.activeOpponent.statusCondition}`;
                statusDiv.textContent = battleState.activeOpponent.statusCondition.toUpperCase();
                opponentInfoDiv.appendChild(statusDiv);
            }
            
            // Update XP display for switched opponent (if applicable)
            this.updateXPDisplayForMonster(opponentInfoDiv, battleState.activeOpponent);
        }
    }

    // Attach right-click event listener to monster sprites
    attachMonsterSpriteRightClick(spriteElement, monster) {
        // Remove any existing right-click listeners
        spriteElement.oncontextmenu = null;
        
        // Clone the element to remove all event listeners
        const newElement = spriteElement.cloneNode(true);
        spriteElement.parentNode.replaceChild(newElement, spriteElement);
        
        // Add right-click event listener to the new element
        newElement.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent default right-click menu
            
            // Call the global showMonsterStats function
            if (window.showMonsterStats) {
                window.showMonsterStats(monster.name, event);
            } else {
                console.warn('showMonsterStats function not available');
            }
        });
        
        // Optional: Add visual feedback on hover
        newElement.style.cursor = 'pointer';
        newElement.title = `Right-click to view ${monster.name}'s detailed stats`;
    }

    // Update HP bars with animation
    updateHPBars(battleState) {
        // Player HP
        const playerHPFill = document.querySelector('.player-area .hp-fill');
        const playerHPText = document.querySelector('.player-area .hp-text');
        
        if (playerHPFill && playerHPText) {
            const playerHPPercent = (battleState.activePlayer.currentHP / battleState.activePlayer.maxHP) * 100;
            playerHPFill.style.width = `${playerHPPercent}%`;
            playerHPText.textContent = `${battleState.activePlayer.currentHP}/${battleState.activePlayer.maxHP}`;
            
            // Add color classes based on HP percentage
            playerHPFill.className = 'hp-fill';
            if (playerHPPercent <= 25) {
                playerHPFill.classList.add('critical');
            } else if (playerHPPercent <= 50) {
                playerHPFill.classList.add('low');
            }
        }

        // Opponent HP
        const opponentHPFill = document.querySelector('.opponent-area .hp-fill');
        const opponentHPText = document.querySelector('.opponent-area .hp-text');
        
        if (opponentHPFill && opponentHPText) {
            const opponentHPPercent = (battleState.activeOpponent.currentHP / battleState.activeOpponent.maxHP) * 100;
            opponentHPFill.style.width = `${opponentHPPercent}%`;
            opponentHPText.textContent = `${battleState.activeOpponent.currentHP}/${battleState.activeOpponent.maxHP}`;
            
            // Add color classes based on HP percentage
            opponentHPFill.className = 'hp-fill';
            if (opponentHPPercent <= 25) {
                opponentHPFill.classList.add('critical');
            } else if (opponentHPPercent <= 50) {
                opponentHPFill.classList.add('low');
            }
        }
    }

    // Update move selection interface
    updateMoveSelection(battleState) {
        const battleControls = document.querySelector('.battle-controls');
        if (battleControls) {
            if (battleState.phase === 'select') {
                battleControls.innerHTML = this.renderMoveSelection(battleState.activePlayer);
                this.attachMoveEventListeners();
            } else {
                battleControls.innerHTML = '<div class="executing">Executing moves...</div>';
            }
        }
    }

    // Update field effects display
    updateFieldEffects(battleState) {
        const battleEffects = document.querySelector('.battle-effects');
        if (battleEffects) {
            battleEffects.innerHTML = this.renderFieldEffects(battleState.fieldEffects);
        }
    }

    // Update turn counter display
    updateTurnCounter(battleState) {
        const turnIndicator = document.querySelector('.turn-indicator span');
        if (turnIndicator) {
            turnIndicator.textContent = `Turn ${battleState.turn}`;
            console.log(`🔄 Turn counter updated to: ${battleState.turn}`);
        } else {
            console.warn('⚠️ Turn indicator element not found');
        }
    }

    // Add message to battle log with typing effect
    addBattleLogMessage(message) {
        console.log(`🖥️ UI Manager: Adding battle log message: "${message}"`);
        this.addBattleMessage(message);
    }

    // Add battle message to queue
    addBattleMessage(message) {
        this.battleMessageQueue.push(message);
        if (!this.isDisplayingMessage) {
            this.displayNextMessage();
        }
    }

    // Display next message with typewriter effect
    async displayNextMessage() {
        if (this.battleMessageQueue.length === 0) {
            this.isDisplayingMessage = false;
            return;
        }

        this.isDisplayingMessage = true;
        const message = this.battleMessageQueue.shift();
        
        const logContent = document.getElementById('battle-log-content');
        if (logContent) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'log-message typing';
            logContent.appendChild(messageDiv);

            // Scroll to bottom immediately when message starts
            this.scrollBattleLogToBottom();

            // Typewriter effect with periodic scrolling
            for (let i = 0; i <= message.length; i++) {
                messageDiv.textContent = message.substring(0, i);
                
                // Scroll every few characters to keep the message visible
                if (i % 10 === 0 || i === message.length) {
                    this.scrollBattleLogToBottom();
                }
                
                await this.sleep(this.messageDisplaySpeed);
            }

            messageDiv.classList.remove('typing');
            // Final scroll to ensure message is fully visible
            this.scrollBattleLogToBottom();
        }

        // Display next message after a short delay
        setTimeout(() => {
            this.displayNextMessage();
        }, 500);
    }

    // Sleep utility for typewriter effect
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Scroll battle log to bottom
    scrollBattleLogToBottom() {
        const logContent = document.getElementById('battle-log-content');
        if (logContent) {
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    // Show battle results with proper result object structure
    showBattleResults(resultData) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        const isVictory = resultData.victory;
        const battleStats = resultData.battleStats || {};
        const rewards = resultData.rewards || {};
        const trainerRewards = resultData.trainerRewards;
        const trainer = resultData.trainer;
        
        mainContent.innerHTML = `
            <div class="battle-results">
                <div class="result-content">
                    <h1 class="result-title ${isVictory ? 'victory' : 'defeat'}">
                        ${isVictory ? '🏆 VICTORY!' : '💀 DEFEAT!'}
                    </h1>
                    
                    <div class="result-details">
                        <p>${isVictory ? 'Congratulations! You won the battle!' : 'Better luck next time!'}</p>
                        
                        ${isVictory && (rewards.exp > 0 || rewards.money > 0) ? `
                            <div class="rewards">
                                <h3>Battle Rewards:</h3>
                                <ul>
                                    ${rewards.exp > 0 ? `<li>💫 ${rewards.exp} Experience Points</li>` : ''}
                                    ${rewards.money > 0 ? `<li>💰 ${rewards.money} Money</li>` : ''}
                                    <li>🏆 Battle victory recorded</li>
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${isVictory && trainerRewards && trainerRewards.success ? `
                            <div class="trainer-rewards">
                                <h3>Trainer Victory Rewards:</h3>
                                <ul>
                                    ${trainerRewards.totalCM > 0 ? `<li>💰 ${trainerRewards.totalCM} CM (Champion Money)</li>` : ''}
                                    ${trainerRewards.items && trainerRewards.items.length > 0 ? 
                                        trainerRewards.items.map(item => `<li>🍬 ${item.name}</li>`).join('') : ''}
                                    ${trainer ? `<li>🏅 Defeated ${trainer.name}</li>` : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>

                    <div class="battle-stats">
                        <h3>Battle Statistics:</h3>
                        <div class="stats-grid">
                            <div class="stat">
                                <span class="stat-label">Turns:</span>
                                <span class="stat-value">${battleStats.turns || 'N/A'}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Your Team:</span>
                                <span class="stat-value">${battleStats.playerTeamSurvivors || 0}/${battleStats.totalPlayerTeam || 0} remaining</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Battle Result:</span>
                                <span class="stat-value">${isVictory ? 'Victory' : 'Defeat'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="result-actions">
                        <button class="result-button primary" onclick="gameEngine.returnToMenu()">
                            Return to Menu
                        </button>
                        <button class="result-button secondary" onclick="gameEngine.quickBattle()">
                            Battle Again
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Show main menu
    showMainMenu() {
        this.currentScreen = 'menu';
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="main-menu">
                <div class="menu-header">
                    <h1 class="game-title">🎮 MONSTER FIGHTERS</h1>
                    <p class="game-subtitle">Retro Monster Battle Game</p>
                </div>
                
                <div class="menu-content">
                    <div class="menu-buttons">
                        <button class="menu-button primary" onclick="gameEngine.showMapMode()">
                            🗺️ Trainer Journey
                        </button>
                        <button class="menu-button" onclick="gameEngine.showTrainerSelection()">
                            ⚔️ Free Battle Mode
                        </button>
                        <button class="menu-button" onclick="gameEngine.uiManager.showTeamManagement()">
                            👥 Team Management
                        </button>
                        <button class="menu-button" onclick="window.openMonsterShop()">
                            🏪 Monster Shop
                        </button>
                        <button class="menu-button" onclick="window.openEggCollection()">
                            🥚 Egg Collection
                        </button>
                        <button class="menu-button" onclick="gameEngine.uiManager.showMonsterDex()">
                            📚 Monster Dex
                        </button>
                    </div>

                    <div class="user-info">
                        ${this.gameEngine.currentUser ? this.renderUserProfile() : this.renderGuestMessage()}
                    </div>
                </div>
            </div>
        `;
        
        // Load profile image after rendering if user is logged in
        if (this.gameEngine.currentUser) {
            this.loadUserProfileImage();
        }
    }

    // Profile image helper function (same as home.html)
    setProfileImage(primaryPath, fallbackPath) {
        const img = document.getElementById('profile-image-monster');
        if (img) {
            // Extract the base name without extension
            const getBasePath = (path) => {
                const lastDot = path.lastIndexOf('.');
                const lastSlash = path.lastIndexOf('/');
                if (lastDot > lastSlash) {
                    return path.substring(0, lastDot);
                }
                return path;
            };
            
            const primaryBasePath = getBasePath(primaryPath);
            const fallbackBasePath = getBasePath(fallbackPath);
            const extensions = ['webp', 'png', 'jpg', 'jpeg', 'jfif'];
            
            // Try loading with different extensions
            let extensionIndex = 0;
            const tryNextExtension = () => {
                if (extensionIndex < extensions.length) {
                    img.src = `${primaryBasePath}.${extensions[extensionIndex]}`;
                    extensionIndex++;
                } else {
                    // If all primary extensions fail, try fallback path with different extensions
                    extensionIndex = 0;
                    img.onerror = () => {
                        if (extensionIndex < extensions.length) {
                            img.src = `${fallbackBasePath}.${extensions[extensionIndex]}`;
                            extensionIndex++;
                        } else {
                            // If all fallback extensions fail, use default icon
                            img.src = 'Icons/default-icon.jpg';
                            img.onerror = null;
                        }
                    };
                    img.src = `${fallbackBasePath}.${extensions[0]}`;
                }
            };
            
            img.onerror = tryNextExtension;
            tryNextExtension();
        }
    }

    // Load user profile image from Firebase
    async loadUserProfileImage() {
        if (!this.gameEngine.currentUser || !window.firebaseDatabase) return;
        
        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js');
            const userRef = ref(window.firebaseDatabase, `users/${this.gameEngine.currentUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (userData && userData.icon) {
                this.setProfileImage(`Icons/Profile/${userData.icon}`, `Icons/Profile/${userData.icon}`);
            }
        } catch (error) {
            console.error('Error loading user profile image:', error);
        }
    }

    // Refresh user info section only
    refreshUserInfo() {
        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement && this.currentScreen === 'menu') {
            userInfoElement.innerHTML = this.gameEngine.currentUser ? this.renderUserProfile() : this.renderGuestMessage();
            
            // Load profile image after refreshing if user is logged in
            if (this.gameEngine.currentUser) {
                this.loadUserProfileImage();
            }
        }
    }

    // Show team management - redirect to monster-tamers.html
    showTeamManagement() {
        window.location.href = 'monster-tamers.html';
    }

    // Show monster dex - redirect to monsterdex.html
    showMonsterDex() {
        window.location.href = 'monsterdex.html';
    }

    // Show settings panel with audio controls
    showSettings() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="settings-screen">
                <div class="settings-content">
                    <h1 class="settings-title">⚙️ SETTINGS</h1>
                    
                    <div class="settings-sections">
                        <div class="settings-section">
                            <h3>🔊 Audio Settings</h3>
                            <div class="setting-item">
                                <label for="master-volume">Master Volume:</label>
                                <input type="range" id="master-volume" min="0" max="100" value="${Math.round(battleAudio.masterVolume * 100)}">
                                <span id="volume-display">${Math.round(battleAudio.masterVolume * 100)}%</span>
                            </div>
                            <div class="setting-item">
                                <label for="sounds-enabled">Sound Effects:</label>
                                <input type="checkbox" id="sounds-enabled" ${battleAudio.soundsEnabled ? 'checked' : ''}>
                            </div>
                            <div class="setting-item">
                                <label for="music-enabled">Music:</label>
                                <input type="checkbox" id="music-enabled" ${battleAudio.musicEnabled ? 'checked' : ''}>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>⚔️ Battle Settings</h3>
                            <div class="setting-item">
                                <label for="animation-speed">Animation Speed:</label>
                                <select id="animation-speed">
                                    <option value="0.5">Slow</option>
                                    <option value="1" selected>Normal</option>
                                    <option value="1.5">Fast</option>
                                    <option value="2">Very Fast</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label for="show-vfx">Visual Effects:</label>
                                <input type="checkbox" id="show-vfx" checked>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>🎮 Gameplay</h3>
                            <div class="setting-item">
                                <label for="auto-save">Auto-save Progress:</label>
                                <input type="checkbox" id="auto-save" checked>
                            </div>
                            <div class="setting-item">
                                <label for="battle-animations">Battle Animations:</label>
                                <input type="checkbox" id="battle-animations" checked>
                            </div>
                        </div>
                    </div>

                    <div class="settings-actions">
                        <button class="settings-button primary" id="save-settings">
                            💾 Save Settings
                        </button>
                        <button class="settings-button secondary" id="test-audio">
                            🔊 Test Audio
                        </button>
                        <button class="settings-button" id="reset-settings">
                            🔄 Reset to Default
                        </button>
                        <button class="settings-button back" onclick="gameEngine.returnToMenu()">
                            ← Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for settings
        this.attachSettingsEventListeners();
    }

    // Attach settings event listeners
    attachSettingsEventListeners() {
        // Volume slider
        const volumeSlider = document.getElementById('master-volume');
        const volumeDisplay = document.getElementById('volume-display');
        if (volumeSlider && volumeDisplay) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                battleAudio.setMasterVolume(volume);
                volumeDisplay.textContent = `${e.target.value}%`;
                
                // Play a test sound when adjusting volume
                battleAudio.playUISound('button_hover');
            });
        }

        // Sound effects toggle
        const soundsCheckbox = document.getElementById('sounds-enabled');
        if (soundsCheckbox) {
            soundsCheckbox.addEventListener('change', (e) => {
                battleAudio.setSoundsEnabled(e.target.checked);
                if (e.target.checked) {
                    battleAudio.playUISound('menu_confirm');
                }
            });
        }

        // Music toggle
        const musicCheckbox = document.getElementById('music-enabled');
        if (musicCheckbox) {
            musicCheckbox.addEventListener('change', (e) => {
                battleAudio.setMusicEnabled(e.target.checked);
                if (e.target.checked) {
                    battleAudio.playUISound('menu_confirm');
                }
            });
        }

        // Test audio button
        const testAudioButton = document.getElementById('test-audio');
        if (testAudioButton) {
            testAudioButton.addEventListener('click', () => {
                battleAudio.playUISound('button_click');
                setTimeout(() => battleAudio.generateMoveSound('Electric', 'Special'), 300);
                setTimeout(() => battleAudio.playHitSound(50, true), 600);
                setTimeout(() => battleAudio.generateHealSound(), 900);
            });
        }

        // Save settings button
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                battleAudio.playUISound('menu_confirm');
                this.saveSettings();
                // Show confirmation
                alert('Settings saved successfully!');
            });
        }

        // Reset settings button
        const resetButton = document.getElementById('reset-settings');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (confirm('Reset all settings to default?')) {
                    battleAudio.playUISound('menu_select');
                    this.resetSettings();
                    this.showSettings(); // Refresh the settings screen
                }
            });
        }
    }

    // Save settings to localStorage
    saveSettings() {
        const settings = {
            masterVolume: battleAudio.masterVolume,
            soundsEnabled: battleAudio.soundsEnabled,
            musicEnabled: battleAudio.musicEnabled,
            animationSpeed: document.getElementById('animation-speed')?.value || 1,
            showVFX: document.getElementById('show-vfx')?.checked || true,
            autoSave: document.getElementById('auto-save')?.checked || true,
            battleAnimations: document.getElementById('battle-animations')?.checked || true
        };
        
        localStorage.setItem('monsterFightersSettings', JSON.stringify(settings));
        console.log('⚙️ Settings saved:', settings);
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem('monsterFightersSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Apply audio settings
                battleAudio.setMasterVolume(settings.masterVolume || 0.7);
                battleAudio.setSoundsEnabled(settings.soundsEnabled !== false);
                battleAudio.setMusicEnabled(settings.musicEnabled !== false);
                
                // Apply other settings as needed
                console.log('⚙️ Settings loaded:', settings);
                return settings;
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
        return null;
    }

    // Reset settings to defaults
    resetSettings() {
        battleAudio.setMasterVolume(0.7);
        battleAudio.setSoundsEnabled(true);
        battleAudio.setMusicEnabled(true);
        
        // Clear saved settings
        localStorage.removeItem('monsterFightersSettings');
        console.log('⚙️ Settings reset to defaults');
    }

    // Add CSS animations and effects
    addBattleAnimation(type, target) {
        const targetElement = document.querySelector(`.${target}-sprite`);
        if (targetElement) {
            targetElement.classList.add(`animation-${type}`);
            setTimeout(() => {
                targetElement.classList.remove(`animation-${type}`);
            }, 1000);
        }
    }

    // Render user profile with team
    renderUserProfile() {
        const user = this.gameEngine.currentUser;
        const userTeam = this.gameEngine.userTeam || [];
        const userName = user.displayName || user.email?.split('@')[0] || 'Trainer';
        
        return `
            <div class="user-profile">
                <div class="user-header">
                    <div class="user-avatar">
                        <img id="profile-image-monster" src="" alt="${userName}" class="avatar-image">
                        <div class="online-indicator"></div>
                    </div>
                    <div class="user-details">
                        <h3 class="user-name">${userName}</h3>
                        <p class="user-status">Monster Trainer</p>
                        <div class="user-stats">
                            <span class="stat-item">
                                <span class="stat-icon">👥</span>
                                <span class="stat-value">${userTeam.length}/6</span>
                                <span class="stat-label">Team</span>
                            </span>
                            <span class="stat-item">
                                <span class="stat-icon">⭐</span>
                                <span class="stat-value">Lv.${this.calculateTrainerLevel(userTeam)}</span>
                                <span class="stat-label">Trainer</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="user-team">
                    <h4 class="team-title">
                        <span class="team-icon">⚔️</span>
                        Current Team
                        ${userTeam.length === 0 ? '<span class="team-status empty">Empty</span>' : 
                          userTeam.length === 6 ? '<span class="team-status full">Full</span>' : 
                          `<span class="team-status partial">${userTeam.length}/6</span>`}
                    </h4>
                    <div class="team-preview">
                        ${this.renderTeamSlots(userTeam)}
                    </div>
                </div>
            </div>
        `;
    }

    // Render guest message
    renderGuestMessage() {
        return `
            <div class="guest-message">
                <div class="guest-icon">👤</div>
                <h3>Welcome, Guest!</h3>
                <p>Log in to save your progress and build your monster team</p>
                <button class="login-button" onclick="window.location.href='index.html'">
                    🔐 Sign In
                </button>
            </div>
        `;
    }

    // Render team slots for preview
    renderTeamSlots(userTeam) {
        const slots = [];
        for (let i = 0; i < 6; i++) {
            const monster = userTeam[i];
            if (monster) {
                // Get XP data if XP manager is available
                const xpData = this.gameEngine.xpManager ? this.gameEngine.xpManager.getXPBarData(monster) : null;
                
                slots.push(`
                    <div class="team-slot filled" 
                         title="${monster.name} (Lv.${monster.level})"
                         draggable="true"
                         data-slot-index="${i}"
                         data-monster-uid="${monster.uid || i}">
                        <img src="/Monsters/${monster.name}.png" 
                             alt="${monster.name}"
                             class="monster-sprite"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI4Ij7inaTvuI88L3RleHQ+Cjwvc3ZnPgo='">
                        <div class="monster-level">Lv.${monster.level}</div>
                        ${xpData ? `
                            <div class="xp-mini-bar">
                                <div class="xp-mini-fill" style="width: ${xpData.progress * 100}%"></div>
                            </div>
                            <div class="xp-mini-text">${xpData.isMaxLevel ? 'MAX' : this.gameEngine.xpManager.formatXP(xpData.xpToNext)}</div>
                        ` : ''}
                    </div>
                `);
            } else {
                slots.push(`
                    <div class="team-slot empty" 
                         data-slot-index="${i}">
                        <div class="slot-placeholder">+</div>
                    </div>
                `);
            }
        }
        
        // Add drag and drop event listeners after rendering
        setTimeout(() => this.attachTeamSlotEventListeners(), 0);
        
        return slots.join('');
    }

    // Attach drag and drop event listeners to team slots
    attachTeamSlotEventListeners() {
        const teamSlots = document.querySelectorAll('.team-slot');
        if (teamSlots.length === 0) return;

        teamSlots.forEach((slot, index) => {
            // Make filled slots draggable
            if (slot.classList.contains('filled')) {
                slot.addEventListener('dragstart', (e) => this.handleTeamDragStart(e));
                slot.addEventListener('dragend', (e) => this.handleTeamDragEnd(e));
            }

            // Make all slots droppable
            slot.addEventListener('dragover', (e) => this.handleTeamDragOver(e));
            slot.addEventListener('drop', (e) => this.handleTeamDrop(e));
            slot.addEventListener('dragenter', (e) => this.handleTeamDragEnter(e));
            slot.addEventListener('dragleave', (e) => this.handleTeamDragLeave(e));
        });
    }

    // Handle drag start for team slots
    handleTeamDragStart(e) {
        const slot = e.currentTarget;
        const slotIndex = slot.dataset.slotIndex;
        const monsterUid = slot.dataset.monsterUid;
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            slotIndex: parseInt(slotIndex),
            monsterUid: monsterUid
        }));
        
        slot.classList.add('dragging');
        console.log('🎯 Started dragging monster from slot:', slotIndex);
    }

    // Handle drag end for team slots
    handleTeamDragEnd(e) {
        const slot = e.currentTarget;
        slot.classList.remove('dragging');
        
        // Remove all drop indicators
        document.querySelectorAll('.team-slot').forEach(s => {
            s.classList.remove('drag-over');
        });
    }

    // Handle drag over for team slots
    handleTeamDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    // Handle drag enter for team slots
    handleTeamDragEnter(e) {
        e.preventDefault();
        const slot = e.currentTarget;
        if (!slot.classList.contains('dragging')) {
            slot.classList.add('drag-over');
        }
    }

    // Handle drag leave for team slots
    handleTeamDragLeave(e) {
        const slot = e.currentTarget;
        // Only remove if we're actually leaving the slot
        if (!slot.contains(e.relatedTarget)) {
            slot.classList.remove('drag-over');
        }
    }

    // Handle drop for team slots
    handleTeamDrop(e) {
        e.preventDefault();
        const targetSlot = e.currentTarget;
        const targetIndex = parseInt(targetSlot.dataset.slotIndex);
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const sourceIndex = dragData.slotIndex;
            
            if (sourceIndex === targetIndex) {
                console.log('🎯 Dropped on same slot, no action needed');
                return;
            }
            
            console.log(`🔄 Moving monster from slot ${sourceIndex} to slot ${targetIndex}`);
            this.reorderTeamMonster(sourceIndex, targetIndex);
            
        } catch (error) {
            console.error('❌ Error handling team drop:', error);
        } finally {
            // Clean up visual indicators
            document.querySelectorAll('.team-slot').forEach(s => {
                s.classList.remove('drag-over', 'dragging');
            });
        }
    }

    // Reorder team monster positions
    reorderTeamMonster(fromIndex, toIndex) {
        if (!this.gameEngine.userTeam || fromIndex === toIndex) return;
        
        const team = this.gameEngine.userTeam;
        
        // Ensure indices are valid
        if (fromIndex < 0 || fromIndex >= team.length || toIndex < 0 || toIndex >= 6) {
            console.warn('❌ Invalid team reorder indices:', fromIndex, toIndex);
            return;
        }
        
        // Perform the reorder
        const monster = team[fromIndex];
        if (!monster) {
            console.warn('❌ No monster at source index:', fromIndex);
            return;
        }
        
        // Remove from old position
        team.splice(fromIndex, 1);
        
        // Insert at new position (adjust index if moving forward)
        const insertIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
        if (insertIndex >= team.length) {
            team.push(monster);
        } else {
            team.splice(insertIndex, 0, monster);
        }
        
        console.log('✅ Team reordered successfully');
        
        // Save to Firebase if user is logged in
        if (this.gameEngine.currentUser) {
            this.saveTeamOrder();
        }
        
        // Refresh the UI
        this.refreshUserInfo();
    }

    // Save team order to Firebase
    async saveTeamOrder() {
        if (!this.gameEngine.currentUser || !window.firebaseDatabase) return;
        
        try {
            const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js');
            const teamRef = ref(window.firebaseDatabase, `users/${this.gameEngine.currentUser.uid}/MonsterTeam`);
            
            // Create team data object with slot indices
            const teamData = {};
            this.gameEngine.userTeam.forEach((monster, index) => {
                if (monster && monster.uid) {
                    teamData[index] = monster.uid;
                }
            });
            
            await set(teamRef, teamData);
            console.log('✅ Team order saved to Firebase');
            
        } catch (error) {
            console.error('❌ Error saving team order:', error);
        }
    }

    // Calculate trainer level based on team
    calculateTrainerLevel(userTeam) {
        if (userTeam.length === 0) return 1;
        const avgLevel = userTeam.reduce((sum, monster) => sum + (monster.level || 1), 0) / userTeam.length;
        return Math.max(1, Math.floor(avgLevel / 2) + userTeam.length);
    }

    // Get user initials for avatar
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // Generate avatar URL from initials
    generateAvatarInitials(name) {
        const initials = this.getInitials(name);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const color = colors[name.length % colors.length];
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="${color}"/>
                <text x="40" y="48" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="bold">${initials}</text>
            </svg>
        `)}`;
    }

    // Get current screen
    getCurrentScreen() {
        return this.currentScreen;
    }

    // Show switch selection interface
    showSwitchSelection(availableMonsters = null) {
        const battleState = this.gameEngine.battleManager?.getBattleState();
        if (!battleState) return;

        const monsters = availableMonsters || battleState.playerTeam.filter(m => 
            m.currentHP > 0 && m !== battleState.activePlayer
        );

        if (monsters.length === 0) {
            this.addBattleLogMessage("No monsters available to switch!");
            return;
        }

        const battleControls = document.querySelector('.battle-controls');
        if (!battleControls) return;

        // Check if this is a forced switch (monster fainted)
        const isForcedSwitch = battleState.phase === 'switching' || (battleState.activePlayer && battleState.activePlayer.currentHP <= 0);
        const headerText = isForcedSwitch ? 
            "Choose a replacement monster:" : 
            "Choose a monster to switch in:";

        battleControls.innerHTML = `
            <div class="switch-selection">
                <h3>${headerText}</h3>
                <div class="switch-grid">
                    ${monsters.map((monster, index) => `
                        <button class="switch-monster-button" data-monster-index="${battleState.playerTeam.indexOf(monster)}">
                            <div class="switch-monster-sprite">
                                <img src="/Monsters/${monster.name}.png" 
                                     alt="${monster.name}"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI4Ij7inaQ8L3RleHQ+Cjwvc3ZnPgo='">
                            </div>
                            <div class="switch-monster-info">
                                <div class="switch-monster-name">${monster.name}</div>
                                <div class="switch-monster-level">Lv.${monster.level}</div>
                                <div class="switch-hp-bar">
                                    <div class="hp-fill ${this.getHPBarClass(monster)}" 
                                         style="width: ${(monster.currentHP / monster.maxHP) * 100}%"></div>
                                </div>
                                <div class="switch-hp-text">${monster.currentHP}/${monster.maxHP}</div>
                                ${monster.statusCondition !== 'none' ? 
                                    `<div class="status-indicator small ${monster.statusCondition}">${monster.statusCondition.substring(0,3).toUpperCase()}</div>` : ''}
                            </div>
                        </button>
                    `).join('')}
                </div>
                ${!isForcedSwitch ? `
                    <div class="switch-options">
                        <button class="option-button cancel-switch" id="cancel-switch">Back</button>
                    </div>
                ` : ''}
            </div>
        `;

        // Add event listeners for switch selection with audio
        this.attachSwitchEventListeners();
    }

    // Attach event listeners for switch selection with audio
    attachSwitchEventListeners() {
        const switchButtons = document.querySelectorAll('.switch-monster-button');
        switchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                battleAudio.playUISound('button_click');
                const monsterIndex = parseInt(e.currentTarget.dataset.monsterIndex);
                this.selectSwitch(monsterIndex);
            });
            
            button.addEventListener('mouseenter', () => {
                battleAudio.playUISound('button_hover');
            });
        });

        const cancelButton = document.getElementById('cancel-switch');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                battleAudio.playUISound('menu_select');
                this.cancelSwitch();
            });
        }
    }

    // Select a monster to switch to
    selectSwitch(monsterIndex) {
        console.log('🔄 selectSwitch called with index:', monsterIndex);
        
        if (this.gameEngine.battleManager) {
            // Check if actions are locked
            if (!this.gameEngine.battleManager.canPerformAction() && this.gameEngine.battleManager.battleState.phase !== 'switching') {
                battleAudio.playUISound('error');
                console.log('❌ Switch selection blocked - battle manager busy');
                return;
            }
            
            console.log('🎮 Calling battleManager.selectSwitch...');
            const success = this.gameEngine.battleManager.selectSwitch(monsterIndex);
            if (!success) {
                battleAudio.playUISound('error');
                console.log('❌ Switch failed');
            } else {
                console.log('✅ Switch successful');
            }
        } else {
            console.log('❌ No battle manager available');
        }
    }

    // Cancel switch and return to move selection
    cancelSwitch() {
        const battleState = this.gameEngine.battleManager?.getBattleState();
        if (battleState && battleState.phase === 'select') {
            const battleControls = document.querySelector('.battle-controls');
            if (battleControls) {
                battleControls.innerHTML = this.renderMoveSelection(battleState.activePlayer);
                this.attachMoveEventListeners();
            }
        }
    }

    // Show trainer selection screen
    showTrainerSelection() {
        this.currentScreen = 'trainer_selection';
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        const trainers = getAllTrainers();
        
        mainContent.innerHTML = `
            <div class="trainer-selection">
                <div class="selection-header">
                    <h1 class="selection-title">⚔️ TRAINER BATTLES</h1>
                    <p class="selection-subtitle">Choose your opponent</p>
                </div>
                
                <div class="trainers-grid">
                    ${trainers.map(trainer => `
                        <div class="trainer-card ${trainer.isDefeated ? 'defeated' : ''}" data-trainer-id="${trainer.id}">
                            <div class="trainer-image">
                                <img src="${trainer.sprite || 'Icons/default-trainer.png'}" 
                                     alt="${trainer.name}"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDQ0Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyMCI+8J+RpDwvdGV4dD4KPC9zdmc+Cg=='">
                                ${trainer.isDefeated ? '<div class="defeated-overlay">✓ DEFEATED</div>' : ''}
                            </div>
                            
                            <div class="trainer-info">
                                <h3 class="trainer-name">${trainer.name}</h3>
                                <p class="trainer-description">${trainer.description}</p>
                                
                                <div class="trainer-team">
                                    <h4 class="team-header">Monster Team:</h4>
                                    <div class="team-monsters">
                                        ${trainer.monsters.map(monster => `
                                            <div class="team-monster">
                                                <img src="/Monsters/${monster.species}.png" 
                                                     alt="${monster.species}"
                                                     class="monster-sprite-small"
                                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSI2Ij7inaQ8L3RleHQ+Cjwvc3ZnPgo='">
                                                <span class="monster-level">Lv.${monster.level}</span>
                                                ${monster.ivs && Object.values(monster.ivs).every(iv => iv === 31) ? 
                                                    '<span class="perfect-iv-indicator">★</span>' : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="trainer-difficulty">
                                    <span class="difficulty-label">Difficulty: </span>
                                    <span class="difficulty-value ${this.getTrainerDifficulty(trainer)}">
                                        ${this.getTrainerDifficultyText(trainer)}
                                    </span>
                                </div>
                                
                                <button class="challenge-button" onclick="gameEngine.startTrainerBattle('${trainer.id}')">
                                    ⚔️ Challenge ${trainer.name}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="selection-actions">
                    <button class="back-button" onclick="gameEngine.returnToMenu()">
                        ← Back to Menu
                    </button>
                    <button class="quick-battle-button" onclick="gameEngine.quickBattle()">
                        🎲 Quick Battle (Random)
                    </button>
                </div>
            </div>
        `;
        
        // Add CSS for trainer selection if not already added
        this.addTrainerSelectionStyles();
    }

    // Get trainer difficulty level
    getTrainerDifficulty(trainer) {
        const maxLevel = Math.max(...trainer.monsters.map(m => m.level));
        const avgIVs = trainer.monsters.map(m => {
            if (!m.ivs) return 15; // Default average
            return Object.values(m.ivs).reduce((sum, iv) => sum + iv, 0) / 6;
        });
        const avgIV = avgIVs.reduce((sum, iv) => sum + iv, 0) / avgIVs.length;
        
        if (maxLevel <= 5 && avgIV < 20) return 'easy';
        if (maxLevel <= 10 && avgIV < 25) return 'normal';
        if (maxLevel <= 15 && avgIV < 30) return 'hard';
        return 'expert';
    }

    // Get trainer difficulty text
    getTrainerDifficultyText(trainer) {
        const difficulty = this.getTrainerDifficulty(trainer);
        const difficultyTexts = {
            'easy': 'Beginner',
            'normal': 'Intermediate', 
            'hard': 'Advanced',
            'expert': 'Expert'
        };
        return difficultyTexts[difficulty] || 'Unknown';
    }

    // Add CSS styles for trainer selection
    addTrainerSelectionStyles() {
        if (document.getElementById('trainer-selection-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'trainer-selection-styles';
        style.textContent = `
            .trainer-selection {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
                font-family: 'Press Start 2P', monospace;
            }
            
            .selection-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .selection-title {
                font-size: 2rem;
                color: #00BCD4;
                margin-bottom: 0.5rem;
                text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
            }
            
            .selection-subtitle {
                font-size: 0.8rem;
                color: #E0E0E0;
                margin: 0;
            }
            
            .trainers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .trainer-card {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                border: 3px solid #00BCD4;
                border-radius: 15px;
                padding: 1.5rem;
                position: relative;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .trainer-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0, 188, 212, 0.3);
                border-color: #00E5FF;
            }
            
            .trainer-card.defeated {
                opacity: 0.7;
                border-color: #4CAF50;
            }
            
            .trainer-image {
                text-align: center;
                margin-bottom: 1rem;
                position: relative;
            }
            
            .trainer-image img {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 3px solid #00BCD4;
                background: rgba(0,0,0,0.2);
            }
            
            .defeated-overlay {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 0.2rem 0.5rem;
                border-radius: 10px;
                font-size: 0.5rem;
                border: 1px solid #66BB6A;
            }
            
            .trainer-info {
                color: white;
            }
            
            .trainer-name {
                font-size: 1rem;
                margin: 0 0 0.5rem 0;
                color: #00BCD4;
                text-align: center;
            }
            
            .trainer-description {
                font-size: 0.6rem;
                line-height: 1.4;
                margin: 0 0 1rem 0;
                color: #E0E0E0;
            }
            
            .trainer-team {
                margin-bottom: 1rem;
            }
            
            .team-header {
                font-size: 0.7rem;
                margin: 0 0 0.5rem 0;
                color: #00BCD4;
            }
            
            .team-monsters {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .team-monster {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .monster-sprite-small {
                width: 30px;
                height: 30px;
                border-radius: 5px;
                border: 1px solid #555;
            }
            
            .monster-level {
                font-size: 0.5rem;
                color: #FFD700;
                margin-top: 0.2rem;
            }
            
            .perfect-iv-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                color: #FFD700;
                font-size: 0.6rem;
                background: rgba(0,0,0,0.5);
                border-radius: 50%;
                width: 12px;
                height: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #FFD700;
            }
            
            .trainer-difficulty {
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .difficulty-label {
                font-size: 0.6rem;
                color: #E0E0E0;
            }
            
            .difficulty-value {
                font-size: 0.6rem;
                font-weight: bold;
                padding: 0.2rem 0.5rem;
                border-radius: 10px;
                margin-left: 0.5rem;
            }
            
            .difficulty-value.easy {
                background: #4CAF50;
                color: white;
            }
            
            .difficulty-value.normal {
                background: #FF9800;
                color: white;
            }
            
            .difficulty-value.hard {
                background: #F44336;
                color: white;
            }
            
            .difficulty-value.expert {
                background: #9C27B0;
                color: white;
            }
            
            .challenge-button {
                width: 100%;
                background: linear-gradient(45deg, #00BCD4, #2196F3);
                border: none;
                color: white;
                padding: 0.8rem;
                font-family: 'Press Start 2P', monospace;
                font-size: 0.6rem;
                cursor: pointer;
                border-radius: 10px;
                transition: all 0.3s ease;
                border: 2px solid #00E5FF;
            }
            
            .challenge-button:hover {
                background: linear-gradient(45deg, #2196F3, #00BCD4);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 188, 212, 0.3);
            }
            
            .selection-actions {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .back-button, .quick-battle-button {
                background: linear-gradient(45deg, #666, #888);
                border: none;
                color: white;
                padding: 0.8rem 1.5rem;
                font-family: 'Press Start 2P', monospace;
                font-size: 0.7rem;
                cursor: pointer;
                border-radius: 10px;
                transition: all 0.3s ease;
                border: 2px solid #999;
            }
            
            .quick-battle-button {
                background: linear-gradient(45deg, #FF9800, #F57C00);
                border-color: #FFB74D;
            }
            
            .back-button:hover, .quick-battle-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            @media (max-width: 768px) {
                .trainers-grid {
                    grid-template-columns: 1fr;
                }
                
                .selection-actions {
                    flex-direction: column;
                }
                
                .selection-title {
                    font-size: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Scroll battle log to bottom
    scrollBattleLogToBottom() {
        const logContent = document.getElementById('battle-log-content');
        if (logContent) {
            logContent.scrollTop = logContent.scrollHeight;
        }
    }

    // Add XP progress bars to battle UI
    addXPDisplaysToBattleUI(battleState) {
        if (!this.gameEngine.xpManager) return;

        // Add XP display to player monster
        const playerInfo = document.querySelector('.player-info');
        if (playerInfo && battleState.activePlayer) {
            addXPToBattleInfo(playerInfo, battleState.activePlayer, this.gameEngine);
        }

        // Add XP display to opponent monster (if it's a player monster, for trainer battles)
        const opponentInfo = document.querySelector('.opponent-info');
        if (opponentInfo && battleState.activeOpponent && !battleState.isWild) {
            // Only show XP for trainer battle opponents that are also player-style monsters
            const isTrainerMonster = battleState.activeOpponent.uid || battleState.activeOpponent.originalData;
            if (isTrainerMonster) {
                addXPToBattleInfo(opponentInfo, battleState.activeOpponent, this.gameEngine);
            }
        }
    }

    // Update XP display for a specific monster (used when switching)
    updateXPDisplayForMonster(infoElement, monster) {
        if (!this.gameEngine.xpManager || !monster || !infoElement) return;
        
        // Remove existing XP display
        const existingXP = infoElement.querySelector('.xp-display');
        if (existingXP) {
            existingXP.remove();
        }
        
        // Add new XP display
        addXPToBattleInfo(infoElement, monster, this.gameEngine);
    }
} 