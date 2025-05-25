// Enhanced Battle Manager - Handles battle flow with VFX and animations
import { getTypeEffectiveness } from './monster-game-engine.js';
import { abilityRegistry } from '../Monsters/ability_registry.js';
import { battleVFX } from '../Monsters/animations/battle-vfx.js';
import { battleAudio } from '../Monsters/animations/battle-audio.js';
import { showLevelUpNotification, showXPGainPopup, updateXPProgressBar } from './xp-ui-utils.js';
import { awardTrainerVictoryRewards } from '../Monsters/trainer_rewards.js';

export class EnhancedBattleManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.battleState = {
            turn: 0,
            phase: 'select', // select, execute, results, switching
            playerTeam: [],
            opponentTeam: [],
            activePlayer: null,
            activeOpponent: null,
            isWild: false,
            trainer: null,
            fieldEffects: {
                playerSide: {},
                opponentSide: {}
            },
            weather: null,
            terrain: null,
            battleLog: [],
            playerCanSwitch: true,
            opponentCanSwitch: true,
            pendingSwitch: null,
            participatingMonsters: new Set() // Track which monsters actually participated
        };
        
        this.pendingActions = {
            player: null,
            opponent: null
        };

        // Animation settings
        this.animationSpeed = 1.0; // Multiplier for animation speed
        this.showVFX = true;
        this.isAnimating = false;
        this.actionsLocked = false; // Prevent input during animations/text
        this.messageQueue = [];
        this.isDisplayingMessage = false;
    }

    // Lock/unlock actions to prevent spam
    lockActions() {
        this.actionsLocked = true;
        console.log('🔒 Actions locked');
    }

    unlockActions() {
        this.actionsLocked = false;
        console.log('🔓 Actions unlocked');
    }

    // Check if actions are available
    canPerformAction() {
        return !this.actionsLocked && !this.isAnimating && !this.isDisplayingMessage && this.battleState.phase === 'select';
    }

    // Queue messages for sequential display
    async queueMessage(message) {
        console.log(`📝 Queueing message: "${message}"`);
        this.messageQueue.push(message);
        if (!this.isDisplayingMessage) {
            await this.processMessageQueue();
        }
    }

    // Process message queue with proper timing
    async processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📋 Processing message queue with ${this.messageQueue.length} messages`);
        this.isDisplayingMessage = true;
        
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            console.log(`📢 Displaying message: "${message}"`);
            this.addToBattleLog(message);
            await this.wait(800); // Wait for message to be read (reduced from 1200ms)
        }
        
        console.log(`✅ Message queue processing complete`);
        this.isDisplayingMessage = false;
    }

    // Start a new battle with enhanced animations
    async startBattle(playerTeam, opponentTeam, isWild = false, trainer = null, battleContext = 'free') {
        console.log('⚔️ Enhanced Battle starting!');
        
        if (trainer) {
            console.log(`🥊 Trainer battle against: ${trainer.name} (Context: ${battleContext})`);
        }
        
        // Initialize VFX system
        battleVFX.initialize();
        
        // Initialize battle state
        this.battleState = {
            turn: 1,
            phase: 'intro',
            playerTeam: [...playerTeam],
            opponentTeam: [...opponentTeam],
            activePlayer: playerTeam[0],
            activeOpponent: opponentTeam[0],
            isWild: isWild,
            trainer: trainer, // Store trainer information
            battleContext: battleContext, // Track battle context: 'map', 'free', 'wild'
            fieldEffects: {
                playerSide: {},
                opponentSide: {}
            },
            weather: null,
            terrain: null,
            battleLog: [],
            playerCanSwitch: true, // Always allow switching for better gameplay
            opponentCanSwitch: false,
            pendingSwitch: null,
            participatingMonsters: new Set()
        };

        // Reset monsters to full health
        for (const monster of this.battleState.playerTeam) {
            console.log(`🔄 Resetting player monster: ${monster.name}`);
            this.resetMonsterForBattle(monster);
        }
        for (const monster of this.battleState.opponentTeam) {
            console.log(`🔄 Resetting opponent monster: ${monster.name}`);
            this.resetMonsterForBattle(monster);
        }

        // Set up UI
        this.gameEngine.uiManager.showBattleScreen(this.battleState);
        console.log(`🖥️ UI initialized - Active monsters: ${this.battleState.activePlayer.name} (${this.battleState.activePlayer.currentHP}/${this.battleState.activePlayer.maxHP}), ${this.battleState.activeOpponent.name} (${this.battleState.activeOpponent.currentHP}/${this.battleState.activeOpponent.maxHP})`);
        
        // Play intro animation
        await this.playBattleIntro();

        // Trigger switch-in abilities
        await this.triggerSwitchInAbilities();

        await this.queueMessage(`Battle started! ${this.battleState.activePlayer.name} vs ${this.battleState.activeOpponent.name}!`);
        
        // Mark starting monsters as participating
        this.markAsParticipating(this.battleState.activePlayer);
        
        // Transition to select phase
        this.battleState.phase = 'select';
        this.gameEngine.uiManager.updateBattleUI(this.battleState);
        
        return true;
    }

    // Play battle intro animation
    async playBattleIntro() {
        const playerSprite = document.querySelector('.player-area .monster-sprite');
        const opponentSprite = document.querySelector('.opponent-area .monster-sprite');
        
        if (playerSprite) {
            playerSprite.classList.add('monster-entering');
        }
        if (opponentSprite) {
            opponentSprite.classList.add('monster-entering');
        }
        
        // Wait for intro animations to complete
        await this.wait(1000);
        
        if (playerSprite) {
            playerSprite.classList.remove('monster-entering');
        }
        if (opponentSprite) {
            opponentSprite.classList.remove('monster-entering');
        }
    }

    // Reset monster for battle
    resetMonsterForBattle(monster) {
        const oldHP = monster.currentHP;
        
        // Restore full HP
        monster.currentHP = monster.maxHP;
        
        console.log(`🏥 HP Restoration: ${monster.name} - ${oldHP} → ${monster.currentHP}/${monster.maxHP}`);
        
        // Clear status conditions
        monster.statusCondition = "none";
        monster.statusTurns = 0;
        
        // Reset move PP
        for (const move of monster.moves) {
            if (typeof move.reset === 'function') {
                move.reset();
            } else {
                // Fallback: manually reset PP if reset method doesn't exist
                if (move.maxPP && move.pp !== undefined) {
                    move.pp = move.maxPP;
                }
            }
        }
        
        // Reset ability
        if (monster.ability && typeof monster.ability.reset === 'function') {
            monster.ability.reset();
        }
    }

    // Mark a monster as participating in battle
    markAsParticipating(monster) {
        if (this.battleState.playerTeam.includes(monster)) {
            this.battleState.participatingMonsters.add(monster.id || monster.name);
            console.log(`🎯 ${monster.name} marked as participating in battle`);
        }
    }

    // Check if a monster participated in battle
    hasParticipated(monster) {
        return this.battleState.participatingMonsters.has(monster.id || monster.name);
    }

    // Trigger switch-in abilities with animation
    async triggerSwitchInAbilities() {
        const messages = [];
        
        if (this.battleState.activePlayer?.ability) {
            const result = abilityRegistry.executeAbilityHook(
                this.battleState.activePlayer.ability,
                "switch_in",
                this.battleState.activePlayer,
                this.battleState
            );
            if (result.triggered) {
                messages.push(result.message);
            }
        }

        if (this.battleState.activeOpponent?.ability) {
            const result = abilityRegistry.executeAbilityHook(
                this.battleState.activeOpponent.ability,
                "switch_in",
                this.battleState.activeOpponent,
                this.battleState
            );
            if (result.triggered) {
                messages.push(result.message);
            }
        }

        // Display ability messages with delay
        for (const message of messages) {
            this.addToBattleLog(message);
            await this.wait(800);
        }
    }

    // Player selects a move with enhanced flow
    async selectMove(moveIndex) {
        if (!this.canPerformAction()) {
            console.log('❌ Action blocked - animations in progress');
            return false;
        }
        
        const activeMonster = this.battleState.activePlayer;
        if (moveIndex >= activeMonster.moves.length) return false;

        const selectedMove = activeMonster.moves[moveIndex];
        
        // Check if move has enough PP
        if (selectedMove.pp <= 0) {
            await this.queueMessage(`${selectedMove.name} has no PP left!`);
            return false;
        }

        // Lock actions during turn execution
        this.lockActions();

        this.pendingActions.player = {
            type: 'move',
            moveIndex: moveIndex,
            move: selectedMove,
            user: activeMonster,
            target: this.battleState.activeOpponent,
            priority: selectedMove.priority || 0
        };

        // Get opponent action from AI
        this.pendingActions.opponent = this.gameEngine.enemyAI.selectAction(this.battleState);

        // Execute turn with animations
        await this.executeTurn();
        
        return true;
    }

    // Player chooses to switch monster
    async selectSwitch(monsterIndex) {
        if (!this.canPerformAction() && this.battleState.phase !== 'switching') {
            console.log('❌ Switch blocked - animations in progress');
            return false;
        }
        if (!this.battleState.playerCanSwitch && this.battleState.phase !== 'switching') return false;
        
        const newMonster = this.battleState.playerTeam[monsterIndex];
        if (!newMonster || newMonster === this.battleState.activePlayer) return false;
        if (newMonster.currentHP <= 0) return false;

        // Handle forced switch (when a monster fainted)
        if (this.battleState.phase === 'switching') {
            console.log('🔄 Executing forced switch...');
            
            await this.executeSwitch({
                type: 'switch',
                user: this.battleState.activePlayer,
                newMonster: newMonster
            });
            
            // Complete the forced switch
            this.battleState.phase = 'select';
            this.gameEngine.uiManager.updateBattleUI(this.battleState);
            this.unlockActions();
            
            return true;
        }

        // Normal switch during battle
        // Lock actions during turn execution
        this.lockActions();

        this.pendingActions.player = {
            type: 'switch',
            newMonster: newMonster,
            user: this.battleState.activePlayer
        };

        // Get opponent action from AI
        this.pendingActions.opponent = this.gameEngine.enemyAI.selectAction(this.battleState);

        // Execute turn with switching
        await this.executeTurn();
        
        return true;
    }

    // Execute the current turn with enhanced animations
    async executeTurn() {
        this.battleState.phase = 'execute';
        this.isAnimating = true;
        
        console.log(`🎯 Turn ${this.battleState.turn}: Executing actions`);

        // Determine action order based on priority and speed
        const actionOrder = this.determineActionOrder();
        
        // Execute actions in order with proper delays
        for (let i = 0; i < actionOrder.length; i++) {
            if (this.isBattleOver()) break;
            
            const action = actionOrder[i];
            await this.executeActionWithAnimation(action);
            
            // Delay between actions for clarity
            if (i < actionOrder.length - 1) {
                await this.wait(500);
            }
        }

        // End of turn effects
        await this.processEndOfTurnEffects();

        // Check if battle is over
        if (this.isBattleOver()) {
            await this.endBattle();
        } else {
            // Check for forced switches (fainted monsters)
            const forcedSwitches = await this.handleForcedSwitches();
            
            if (!forcedSwitches) {
                // Show turn transition effect
                await this.showTurnTransition();
                
                // Prepare for next turn
                this.battleState.turn++;
                this.battleState.phase = 'select';
                this.pendingActions = { player: null, opponent: null };
                
                // Update UI for next turn
                this.gameEngine.uiManager.updateBattleUI(this.battleState);
                
                // Add a delay before unlocking actions to let players process the turn change
                await this.wait(800);
                
                // Unlock actions for next turn
                this.unlockActions();
            }
        }
        
        this.isAnimating = false;
    }

    // Execute action with full animation
    async executeActionWithAnimation(action) {
        if (action.type === 'switch') {
            await this.executeSwitch(action);
        } else if (action.type === 'move') {
            await this.executeMoveWithAnimation(action);
        }
    }

    // Execute switch with animation and audio
    async executeSwitch(action) {
        const isPlayerAction = action.user === this.battleState.activePlayer;
        const currentMonster = action.user;
        const newMonster = action.newMonster;
        
        // Get sprite elements
        const spriteSelector = isPlayerAction ? '.player-area .monster-sprite' : '.opponent-area .monster-sprite';
        const spriteElement = document.querySelector(spriteSelector);
        
        // Play switch out sound
        battleAudio.playSwitchSound(true);
        
        // Switch out animation
        if (spriteElement) {
            spriteElement.classList.remove('monster-switching-in', 'monster-switching-out'); // Clear any existing classes
            spriteElement.classList.add('monster-switching-out');
        }
        
        await this.queueMessage(`${currentMonster.name} was withdrawn!`);
        await this.wait(800);
        
        // Update active monster BEFORE updating UI
        if (isPlayerAction) {
            this.battleState.activePlayer = newMonster;
            // Mark new monster as participating
            this.markAsParticipating(newMonster);
        } else {
            this.battleState.activeOpponent = newMonster;
        }
        
        // Update UI to show new monster (but don't trigger animations yet)
        this.gameEngine.uiManager.updateMonsterSprites(this.battleState);
        this.gameEngine.uiManager.updateHPBars(this.battleState);
        
        // Clean up switch-out animation
        if (spriteElement) {
            spriteElement.classList.remove('monster-switching-out');
        }
        
        // Play switch in sound
        battleAudio.playSwitchSound(false);
        
        // Switch in animation with new sprite element
        const newSpriteElement = document.querySelector(spriteSelector);
        if (newSpriteElement) {
            newSpriteElement.classList.remove('monster-switching-in', 'monster-switching-out'); // Clear any existing classes
            newSpriteElement.classList.add('monster-switching-in');
        }
        
        await this.queueMessage(`${newMonster.name} was sent out!`);
        await this.wait(800);
        
        // Clean up animation classes
        if (newSpriteElement) {
            newSpriteElement.classList.remove('monster-switching-in');
        }
        
        // Trigger switch-in ability
        if (newMonster.ability) {
            const result = abilityRegistry.executeAbilityHook(
                newMonster.ability,
                "switch_in",
                newMonster,
                this.battleState
            );
            if (result.triggered) {
                await this.queueMessage(result.message);
                await this.wait(800);
            }
        }
    }

    // Execute move with full VFX and animation
    async executeMoveWithAnimation(action) {
        const { move, user } = action;
        
        // Check if the user has fainted before executing the move
        if (user.currentHP <= 0) {
            console.log(`${user.name} fainted and cannot use ${move.name}!`);
            return; // Don't execute move if user is fainted
        }
        
        // Check if the user is sleeping
        if (user.statusCondition === 'sleep') {
            await this.queueMessage(`${user.name} is fast asleep!`);
            return; // Don't execute move if user is sleeping
        }
        
        // Check if the user is frozen
        if (user.statusCondition === 'frozen' || user.statusCondition === 'freeze') {
            await this.queueMessage(`${user.name} is frozen solid!`);
            return; // Don't execute move if user is frozen
        }
        
        // Check if the user is paralyzed (25% chance to not move)
        if (user.statusCondition === 'paralysis') {
            if (Math.random() < 0.25) {
                await this.queueMessage(`${user.name} is paralyzed and can't move!`);
                return; // Don't execute move if paralyzed fails
            }
        }
        
        // Determine the current target based on who is actually active now (after switches)
        const isPlayerMove = user === this.battleState.activePlayer;
        const currentTarget = isPlayerMove ? this.battleState.activeOpponent : this.battleState.activePlayer;
        
        // Ensure we're targeting the currently active monster, not the original target
        const target = currentTarget;
        
        // Get sprite elements
        const userSprite = document.querySelector(isPlayerMove ? '.player-area .monster-sprite' : '.opponent-area .monster-sprite');
        const targetSprite = document.querySelector(isPlayerMove ? '.opponent-area .monster-sprite' : '.player-area .monster-sprite');
        
        // Announce move
        await this.queueMessage(`${user.name} used ${move.name}!`);
        await this.wait(500);
        
        // Pre-move ability triggers
        if (user.ability) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                user.ability, "move_use", user, move, target, this.battleState
            );
            if (abilityResult.triggered) {
                await this.queueMessage(abilityResult.message);
                await this.wait(400);
            }
        }
        
        // Play VFX and animations
        if (this.showVFX && userSprite && targetSprite) {
            console.log(`🎨 Attempting to play VFX for ${move.name}...`);
            try {
                await battleVFX.playMoveAnimation(move, userSprite, targetSprite, move.type);
                console.log(`✅ VFX completed for ${move.name}`);
            } catch (error) {
                console.error(`❌ VFX failed for ${move.name}:`, error);
                // Continue with battle even if VFX fails
            }
        } else {
            console.log(`⚠️ VFX skipped - showVFX: ${this.showVFX}, userSprite: ${!!userSprite}, targetSprite: ${!!targetSprite}`);
            
            // Even without VFX, add some visual feedback
            if (userSprite) {
                userSprite.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    userSprite.style.transform = 'scale(1)';
                }, 300);
            }
        }
        
        // Execute the move mechanics
        // Set flag to prevent double ability triggers in battle system
        this.battleState.isEnhancedBattleManager = true;
        const result = move.execute(user, target, this);
        delete this.battleState.isEnhancedBattleManager;
        
        // Check if move missed - handle both result formats
        const moveHit = result.success !== false && result.missed !== true;
        
        if (moveHit) {
            // Show damage numbers
            if (result.damage > 0 && targetSprite) {
                const isCritical = result.critical || this.checkCriticalHit(move);
                try {
                    battleVFX.createDamageNumbers(result.damage, targetSprite, isCritical);
                    console.log(`💥 Damage numbers shown: ${result.damage}`);
                } catch (error) {
                    console.warn(`⚠️ Damage numbers failed:`, error);
                    // Create simple visual feedback as fallback
                    targetSprite.style.filter = 'brightness(1.5) hue-rotate(0deg)';
                    setTimeout(() => {
                        targetSprite.style.filter = '';
                    }, 300);
                }
            }
            
            // Update HP with animation
            await this.animateHPChange(target, result.damage, result.isHealing);
            
            // Check for ability triggers on damage dealt (for user abilities like Glacial Bloom)
            if (result.damage > 0 && user.ability) {
                const abilityResult = abilityRegistry.executeAbilityHook(
                    user.ability, "damage_dealt", user, move, target, result.damage, this.battleState
                );
                if (abilityResult.triggered) {
                    console.log('🌿 Ability triggered:', abilityResult.message);
                    if (abilityResult.message) {
                        await this.queueMessage(abilityResult.message);
                        await this.wait(400);
                    }
                    
                    // If the ability caused healing, immediately update the HP display
                    if (abilityResult.changes && abilityResult.changes.healing) {
                        console.log('💚 Healing triggered:', abilityResult.changes.healing, 'HP for', user.name);
                        // Use negative damage value to indicate healing
                        await this.animateHPChange(user, -abilityResult.changes.healing, true);
                        // Force UI update to show new HP values immediately
                        this.gameEngine.uiManager.updateHPBars(this.battleState);
                        this.gameEngine.uiManager.updateMonsterSprites(this.battleState);
                    }
                }
            }
            
            // Display result messages
            if (result.messages && result.messages.length > 0) {
                for (const message of result.messages) {
                    await this.queueMessage(message);
                    await this.wait(400);
                }
            } else if (result.message) {
                await this.queueMessage(result.message);
                await this.wait(400);
            }
            
            // Type effectiveness message
            const effectiveness = result.effectiveness || this.getTypeEffectiveness(move.type, target.types);
            if (effectiveness > 1) {
                await this.queueMessage("It's super effective!");
                await this.wait(400);
            } else if (effectiveness < 1 && effectiveness > 0) {
                await this.queueMessage("It's not very effective...");
                await this.wait(400);
            } else if (effectiveness === 0) {
                await this.queueMessage("It had no effect!");
                await this.wait(400);
            }
            
            // Handle move effects
            await this.handleMoveEffects(result, user, target);
            
            // Check if target fainted
            if (target.currentHP <= 0) {
                await this.handleFaint(target);
            }
        } else {
            // Move missed - show miss message
            if (result.messages && result.messages.length > 0 && result.messages[0].includes('missed')) {
                await this.queueMessage(result.messages[0]);
            } else {
                await this.queueMessage(`${move.name} missed!`);
            }
            await this.wait(400);
        }
    }

    // Animate HP bar changes
    async animateHPChange(monster, damage, isHealing = false) {
        const isPlayer = monster === this.battleState.activePlayer;
        const hpBarSelector = isPlayer ? '.player-area .hp-fill' : '.opponent-area .hp-fill';
        const hpBar = document.querySelector(hpBarSelector);
        
        if (!hpBar) return;
        
        const oldHP = monster.currentHP + (isHealing ? -damage : damage);
        const newHP = monster.currentHP;
        const maxHP = monster.maxHP;
        
        // Calculate new percentage
        const newPercentage = (newHP / maxHP) * 100;
        
        // Add rapid change class for immediate damage
        if (!isHealing && damage > maxHP * 0.3) {
            hpBar.classList.add('rapid-change');
        }
        
        // Update width
        hpBar.style.width = newPercentage + '%';
        
        // Update color based on HP
        if (newPercentage <= 25) {
            hpBar.className = 'hp-fill critical';
        } else if (newPercentage <= 50) {
            hpBar.className = 'hp-fill low';
        } else {
            hpBar.className = 'hp-fill';
        }
        
        // Update HP text
        const hpTextSelector = isPlayer ? '.player-area .hp-text' : '.opponent-area .hp-text';
        const hpText = document.querySelector(hpTextSelector);
        if (hpText) {
            hpText.textContent = `${newHP}/${maxHP}`;
        }
        
        // Wait for animation
        await this.wait(1200);
        
        // Remove rapid change class
        hpBar.classList.remove('rapid-change');
    }

    // Handle forced switches when monsters faint
    async handleForcedSwitches() {
        let hadForcedSwitch = false;
        
        // Check if player needs to switch
        if (this.battleState.activePlayer.currentHP <= 0) {
            const availableMonsters = this.battleState.playerTeam.filter(m => m.currentHP > 0);
            if (availableMonsters.length > 0) {
                hadForcedSwitch = true;
                await this.forcedSwitch(true, availableMonsters);
            }
        }
        
        // Check if opponent needs to switch (for trainer battles)
        if (!this.battleState.isWild && this.battleState.activeOpponent.currentHP <= 0) {
            const availableMonsters = this.battleState.opponentTeam.filter(m => m.currentHP > 0);
            if (availableMonsters.length > 0) {
                hadForcedSwitch = true;
                await this.forcedSwitch(false, availableMonsters);
            }
        }
        
        return hadForcedSwitch;
    }

    // Handle forced switch
    async forcedSwitch(isPlayer, availableMonsters) {
        this.battleState.phase = 'switching';
        
        if (isPlayer) {
            // Show switch UI to player and wait for selection
            this.gameEngine.uiManager.showSwitchSelection(availableMonsters);
            
            // The switch will be handled by the UI when player clicks
            // Don't auto-select - let player choose
            console.log('🔄 Waiting for player to select replacement monster...');
            
            // Actions will be unlocked when the switch is completed via UI
            return;
        } else {
            // AI selects replacement
            const newMonster = this.gameEngine.enemyAI.selectSwitch(availableMonsters, this.battleState);
            await this.executeSwitch({
                type: 'switch',
                user: this.battleState.activeOpponent,
                newMonster: newMonster
            });
            
            this.battleState.phase = 'select';
            this.gameEngine.uiManager.updateBattleUI(this.battleState);
            
            // Unlock actions after AI forced switch is complete
            this.unlockActions();
        }
    }

    // Handle monster fainting with animation and audio
    async handleFaint(monster) {
        const isPlayer = monster === this.battleState.activePlayer;
        const spriteSelector = isPlayer ? '.player-area .monster-sprite' : '.opponent-area .monster-sprite';
        const spriteElement = document.querySelector(spriteSelector);
        
        // Award XP for defeating a monster BEFORE showing faint animation
        if (this.gameEngine.xpManager) {
            await this.awardDefeatXP(monster);
        }
        
        // Play faint sound
        battleAudio.playFaintSound();
        
        if (spriteElement) {
            spriteElement.classList.add('monster-fainting');
        }
        
        await this.queueMessage(`${monster.name} fainted!`);
        await this.wait(1500);
        
        if (spriteElement) {
            spriteElement.classList.remove('monster-fainting');
        }
    }

    // Award XP for defeating a monster
    async awardDefeatXP(defeatedMonster) {
        const isPlayerDefeated = this.battleState.playerTeam.includes(defeatedMonster);
        const winningTeam = isPlayerDefeated ? this.battleState.opponentTeam : this.battleState.playerTeam;
        const defeatedBy = isPlayerDefeated ? this.battleState.activeOpponent : this.battleState.activePlayer;
        
        // Determine battle type
        const battleType = this.battleState.isWild ? 'wild' : 'trainer';
        
        // Award XP to the winning monster
        if (defeatedBy && this.gameEngine.xpManager) {
            const winnerXP = this.gameEngine.xpManager.calculateXPGain(defeatedBy, defeatedMonster, battleType);
            console.log(`🏆 ${defeatedBy.name} defeated ${defeatedMonster.name}! Awarding ${winnerXP} XP (Level ${defeatedBy.level}, Current XP: ${defeatedBy.xp})`);
            const oldWinnerLevel = defeatedBy.level;
            const winnerResult = this.gameEngine.xpManager.awardXP(defeatedBy, winnerXP, this.battleState.battleLog);
            console.log(`✅ Victory XP awarded! New XP: ${defeatedBy.xp}, Level: ${defeatedBy.level}`);
            
            await this.queueMessage(`${defeatedBy.name} gained ${winnerXP} XP for winning!`);
            
            // Show XP gain popup
            const winnerSprite = document.querySelector(this.battleState.playerTeam.includes(defeatedBy) ? '.player-area .monster-sprite' : '.opponent-area .monster-sprite');
            if (winnerSprite) {
                showXPGainPopup(winnerSprite, winnerXP);
            }
            
            // Update XP bar visually
            const winnerXPBar = document.querySelector(this.battleState.playerTeam.includes(defeatedBy) ? '.player-area .xp-progress-container' : '.opponent-area .xp-progress-container');
            if (winnerXPBar && this.gameEngine.xpManager) {
                updateXPProgressBar(winnerXPBar, defeatedBy, this.gameEngine, winnerResult.levelsGained > 0);
            }
            
            await this.wait(800);
            
            // Handle level ups for winner
            if (winnerResult.levelsGained > 0) {
                showLevelUpNotification(defeatedBy, oldWinnerLevel, defeatedBy.level);
                if (this.gameEngine.uiManager) {
                    this.gameEngine.uiManager.updateBattleUI(this.battleState);
                }
            }
            
            // Save XP to Firebase immediately for the winning monster
            if (this.battleState.playerTeam.includes(defeatedBy)) {
                try {
                    await this.gameEngine.xpManager.saveMonsterXP(defeatedBy);
                    console.log(`💾 Saved victory XP for ${defeatedBy.name} to Firebase`);
                } catch (error) {
                    console.error('❌ Failed to save victory XP to Firebase:', error);
                }
            }
        }
        
        // Award participation XP to the defeated monster (smaller amount)
        if (defeatedMonster && this.gameEngine.xpManager) {
            // Calculate participation XP based on level difference
            const participationMultiplier = 0.3; // 30% of normal XP for losing
            const baseParticipationXP = Math.max(5, Math.floor(defeatedMonster.level * 2));
            
            // Level difference bonus: if defeated monster was higher level, they get more XP
            const levelDiff = defeatedBy ? defeatedBy.level - defeatedMonster.level : 0;
            let levelBonus = 1.0;
            if (levelDiff > 0) {
                // Defeated monster was lower level - less bonus XP
                levelBonus = Math.max(0.5, 1.0 - (levelDiff * 0.1));
            } else if (levelDiff < 0) {
                // Defeated monster was higher level - more bonus XP
                levelBonus = 1.0 + (Math.abs(levelDiff) * 0.2);
            }
            
            const loserXP = Math.floor(baseParticipationXP * participationMultiplier * levelBonus);
            
            // Only award XP if the defeated monster is from player team
            if (isPlayerDefeated && loserXP > 0) {
                const oldLoserLevel = defeatedMonster.level;
                const loserResult = this.gameEngine.xpManager.awardXP(defeatedMonster, loserXP, this.battleState.battleLog);
                
                await this.queueMessage(`${defeatedMonster.name} gained ${loserXP} XP for participating!`);
                
                // Show XP gain popup for defeated monster
                const loserSprite = document.querySelector('.player-area .monster-sprite');
                if (loserSprite) {
                    showXPGainPopup(loserSprite, loserXP);
                }
                
                // Update XP bar visually for defeated monster
                const loserXPBar = document.querySelector('.player-area .xp-progress-container');
                if (loserXPBar && this.gameEngine.xpManager) {
                    updateXPProgressBar(loserXPBar, defeatedMonster, this.gameEngine, loserResult.levelsGained > 0);
                }
                
                await this.wait(800);
                
                // Handle level ups for loser (rare but possible)
                if (loserResult.levelsGained > 0) {
                    showLevelUpNotification(defeatedMonster, oldLoserLevel, defeatedMonster.level);
                    if (this.gameEngine.uiManager) {
                        this.gameEngine.uiManager.updateBattleUI(this.battleState);
                    }
                }
                
                // Save participation XP to Firebase immediately
                try {
                    await this.gameEngine.xpManager.saveMonsterXP(defeatedMonster);
                    console.log(`💾 Saved participation XP for ${defeatedMonster.name} to Firebase`);
                } catch (error) {
                    console.error('❌ Failed to save participation XP to Firebase:', error);
                }
            }
        }
    }

    // Determine action order with proper priority handling
    determineActionOrder() {
        const actions = [this.pendingActions.player, this.pendingActions.opponent]
            .filter(Boolean)
            .filter(action => {
                // Filter out actions from fainted monsters (except switch actions)
                if (action.type === 'switch') {
                    return true; // Always allow switch actions
                }
                return action.user && action.user.currentHP > 0;
            });
        
        return actions.sort((a, b) => {
            // Switching always goes first
            if (a.type === 'switch' && b.type !== 'switch') return -1;
            if (b.type === 'switch' && a.type !== 'switch') return 1;
            if (a.type === 'switch' && b.type === 'switch') return 0;
            
            // Then by move priority
            const priorityA = a.move?.priority || 0;
            const priorityB = b.move?.priority || 0;
            
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            
            // Then by speed
            const speedA = this.getEffectiveSpeed(a.user);
            const speedB = this.getEffectiveSpeed(b.user);
            
            if (speedA !== speedB) {
                return speedB - speedA;
            }
            
            // Speed tie: random
            return Math.random() - 0.5;
        });
    }

    // Get effective speed (including stat changes, paralysis, etc.)
    getEffectiveSpeed(monster) {
        let speed = monster.stats.speed;
        
        // Apply status conditions
        if (monster.statusCondition === 'paralysis') {
            speed = Math.floor(speed * 0.5);
        }
        
        // Apply other speed modifiers here
        
        return speed;
    }

    // Check for critical hit
    checkCriticalHit(move) {
        // Basic critical hit chance (could be enhanced with move data)
        const critChance = move.criticalRate || 6.25; // 6.25% base chance
        return Math.random() * 100 < critChance;
    }

    // Get type effectiveness
    getTypeEffectiveness(moveType, targetTypes) {
        return getTypeEffectiveness(moveType, targetTypes);
    }

    // Calculate type effectiveness - used by moves
    calculateTypeEffectiveness(moveType, targetTypes) {
        return this.getTypeEffectiveness(moveType, targetTypes);
    }

    // Calculate damage - used by moves  
    calculateDamage(user, target, move, isCritical = false) {
        const baseDamage = move.power || 40;
        const userStat = move.category === 'Physical' ? user.stats.attack : user.stats.specialAttack;
        const targetStat = move.category === 'Physical' ? target.stats.defense : target.stats.specialDefense;
        const userLevel = user.level || 50;
        
        // Basic damage formula: ((2 * Level + 10) / 250) * (Attack / Defense) * BasePower + 2
        let damage = Math.floor(((2 * userLevel + 10) / 250) * (userStat / targetStat) * baseDamage + 2);
        
        // Critical hit multiplier
        if (isCritical) {
            damage = Math.floor(damage * 1.5);
        }
        
        // Type effectiveness
        const effectiveness = this.calculateTypeEffectiveness(move.type, target.types);
        damage = Math.floor(damage * effectiveness);
        
        // Random factor (85-100%)
        const randomFactor = (Math.random() * 0.15) + 0.85;
        damage = Math.floor(damage * randomFactor);
        
        return Math.max(1, damage);
    }

    // Handle move effects like status conditions
    async handleMoveEffects(moveResult, user, target) {
        if (moveResult.effects && moveResult.effects.length > 0) {
            for (const effect of moveResult.effects) {
                await this.applyMoveEffect(effect, user, target);
            }
        }
    }

    // Apply individual move effect
    async applyMoveEffect(effect, user, target) {
        // Handle different types of effects
        if (effect.type === 'status') {
            target.statusCondition = effect.status;
            target.statusTurns = effect.duration || 0;
            await this.queueMessage(`${target.name} was ${effect.status}!`);
            await this.wait(600);
        }
        // Add more effect types as needed
    }

    // Process end of turn effects
    async processEndOfTurnEffects() {
        // Process status conditions
        await this.processStatusConditions();
        
        // Process field effects
        await this.processFieldEffects();
        
        // Process weather
        await this.processWeather();
    }

    // Process status conditions at end of turn
    async processStatusConditions() {
        const monsters = [this.battleState.activePlayer, this.battleState.activeOpponent];
        
        for (const monster of monsters) {
            if (monster.statusCondition !== 'none') {
                await this.processStatusEffect(monster);
            }
        }
    }

    // Process individual status effect
    async processStatusEffect(monster) {
        const isPlayer = monster === this.battleState.activePlayer;
        
        switch (monster.statusCondition) {
            case 'sleep':
                // Sleep status doesn't deal damage, just shows a message
                await this.queueMessage(`${monster.name} is fast asleep...`);
                await this.wait(600);
                break;
            case 'poison':
                const poisonDamage = Math.floor(monster.maxHP / 8);
                monster.currentHP = Math.max(0, monster.currentHP - poisonDamage);
                await this.queueMessage(`${monster.name} was hurt by poison!`);
                await this.animateHPChange(monster, poisonDamage);
                break;
            case 'burn':
                const burnDamage = Math.floor(monster.maxHP / 16);
                monster.currentHP = Math.max(0, monster.currentHP - burnDamage);
                await this.queueMessage(`${monster.name} was hurt by burn!`);
                await this.animateHPChange(monster, burnDamage);
                break;
            case 'freeze':
            case 'frozen':
                // Frozen status prevents movement and shows a message
                await this.queueMessage(`${monster.name} is frozen solid!`);
                await this.wait(600);
                
                // 20% chance to thaw out each turn
                if (Math.random() < 0.2) {
                    monster.statusCondition = 'none';
                    monster.statusTurns = 0;
                    await this.queueMessage(`${monster.name} thawed out!`);
                    await this.wait(600);
                }
                break;
            case 'paralyzed':
                // Paralyzed status shows a message (movement prevention is handled in move execution)
                await this.queueMessage(`${monster.name} is paralyzed!`);
                await this.wait(600);
                break;
            // Add more status conditions
        }
        
        // Decrease status duration
        if (monster.statusTurns > 0) {
            monster.statusTurns--;
            if (monster.statusTurns === 0) {
                const oldStatus = monster.statusCondition;
                monster.statusCondition = 'none';
                if (oldStatus === 'sleep') {
                    await this.queueMessage(`${monster.name} woke up!`);
                } else {
                    await this.queueMessage(`${monster.name} recovered from ${oldStatus}!`);
                }
                await this.wait(600);
            }
        }
    }

    // Process field effects
    async processFieldEffects() {
        // Process Light Screen, Reflect, etc.
        // Implementation would go here
    }

    // Process weather effects
    async processWeather() {
        if (this.battleState.weather) {
            // Process weather damage, healing, etc.
            // Implementation would go here
        }
    }

    // Check if battle is over
    isBattleOver() {
        const playerAlive = this.battleState.playerTeam.some(m => m.currentHP > 0);
        const opponentAlive = this.battleState.opponentTeam.some(m => m.currentHP > 0);
        
        return !playerAlive || !opponentAlive;
    }

    // End battle with results and audio
    async endBattle() {
        this.battleState.phase = 'results';
        this.isAnimating = true;
        
        const playerWon = this.battleState.opponentTeam.every(m => m.currentHP <= 0);
        
        if (playerWon) {
            await this.queueMessage("You won the battle!");
            // Play victory sound and animation
            battleAudio.playResultSound(true);
            await this.playVictoryAnimation();
        } else {
            await this.queueMessage("You lost the battle!");
            // Play defeat sound and animation
            battleAudio.playResultSound(false);
            await this.playDefeatAnimation();
        }
        
        // Calculate rewards
        const rewards = await this.calculateBattleRewards(playerWon);
        
        // Handle trainer rewards if this was a trainer battle
        let trainerRewards = null;
        if (playerWon && this.battleState.trainer) {
            try {
                console.log(`🏆 Awarding trainer rewards for defeating ${this.battleState.trainer.name}`);
                const trainerRewardResult = await awardTrainerVictoryRewards(this.battleState.trainer);
                if (trainerRewardResult.success) {
                    trainerRewards = trainerRewardResult;
                    await this.queueMessage(`Trainer rewards: ${trainerRewardResult.messages.join(', ')}`);
                } else {
                    console.error('Failed to award trainer rewards:', trainerRewardResult.error);
                }
                
                // Handle special trainer rewards (like eggs from Kotal Kahn)
                if (window.TrainerBattleHandler && this.gameEngine.currentUser) {
                    const specialRewards = await window.TrainerBattleHandler.handleTrainerDefeat(
                        this.battleState.trainer.id, 
                        this.gameEngine.currentUser.uid
                    );
                    
                    if (specialRewards.success && specialRewards.messages.length > 0) {
                        for (const message of specialRewards.messages) {
                            await this.queueMessage(message);
                        }
                    }
                }
            } catch (error) {
                console.error('Error awarding trainer rewards:', error);
            }
        }

        // Update map progress ONLY if this was a map mode trainer battle
        if (this.battleState.trainer && this.battleState.battleContext === 'map' && this.gameEngine.mapMode) {
            try {
                await this.gameEngine.mapMode.recordBattleAttempt(this.battleState.trainer.id, playerWon);
                console.log(`📊 Updated map progress for trainer ${this.battleState.trainer.id}: ${playerWon ? 'Victory' : 'Defeat'}`);
            } catch (error) {
                console.error('Failed to update map progress:', error);
            }
        } else if (this.battleState.trainer && this.battleState.battleContext === 'free') {
            console.log(`🎲 Free battle mode - map progress NOT updated for trainer ${this.battleState.trainer.id}`);
        }
        
        // Show results screen with trainer rewards
        this.gameEngine.uiManager.showBattleResults({
            victory: playerWon,
            rewards: rewards,
            trainerRewards: trainerRewards,
            battleStats: this.getBattleStats(),
            trainer: this.battleState.trainer
        });
        
        // Unlock actions when battle ends
        this.unlockActions();
        this.isAnimating = false;
    }

    // Play victory animation
    async playVictoryAnimation() {
        const battleField = document.querySelector('.battle-field');
        if (battleField) {
            battleField.style.filter = 'brightness(1.2) saturate(1.3)';
            await this.wait(1000);
            battleField.style.filter = 'none';
        }
    }

    // Play defeat animation
    async playDefeatAnimation() {
        const battleField = document.querySelector('.battle-field');
        if (battleField) {
            battleField.style.filter = 'brightness(0.7) saturate(0.7)';
            await this.wait(1000);
            battleField.style.filter = 'none';
        }
    }

    // Calculate battle rewards
    async calculateBattleRewards(victory) {
        if (!victory || !this.gameEngine.xpManager) {
            return { exp: 0, money: 0 };
        }
        
        // Award participation XP to all surviving team members
        const battleType = this.battleState.isWild ? 'wild' : 'trainer';
        const baseParticipationXP = battleType === 'wild' ? 25 : 40; // Further increased participation XP
        
        // Calculate average opponent level for level difference bonus
        const opponentLevels = this.battleState.opponentTeam.map(m => m.level);
        const avgOpponentLevel = opponentLevels.reduce((sum, level) => sum + level, 0) / opponentLevels.length;
        
        // Award participation XP only to monsters who actually participated in battle
        for (const monster of this.battleState.playerTeam) {
            // Only award participation XP to monsters that actually participated and are still alive
            if (monster.currentHP > 0 && this.hasParticipated(monster)) {
                // Calculate level difference bonus
                const levelDiff = avgOpponentLevel - monster.level;
                let levelMultiplier = 1.0;
                if (levelDiff > 0) {
                    // Fighting higher level opponents gives more XP
                    levelMultiplier = 1.0 + (levelDiff * 0.1);
                } else if (levelDiff < 0) {
                    // Fighting lower level opponents gives less XP
                    levelMultiplier = Math.max(0.3, 1.0 + (levelDiff * 0.05));
                }
                
                // Team participation bonus
                const participationXP = Math.floor(baseParticipationXP * (monster.level * 0.15 + 1) * levelMultiplier);
                
                if (participationXP > 0) {
                    console.log(`🎯 Awarding ${participationXP} participation XP to ${monster.name} (Level ${monster.level}, Current XP: ${monster.xp})`);
                    const result = this.gameEngine.xpManager.awardXP(monster, participationXP, this.battleState.battleLog);
                    console.log(`✅ XP awarded! New XP: ${monster.xp}, Level: ${monster.level}`);
                    await this.queueMessage(`${monster.name} gained ${participationXP} participation XP!`);
                    
                    // Show XP gain popup for team participation
                    const monsterSprite = document.querySelector('.player-area .monster-sprite');
                    if (monsterSprite) {
                        showXPGainPopup(monsterSprite, participationXP);
                    }
                    
                    // Update XP bar visually
                    const monsterXPBar = document.querySelector('.player-area .xp-progress-container');
                    if (monsterXPBar && this.gameEngine.xpManager) {
                        updateXPProgressBar(monsterXPBar, monster, this.gameEngine, result.levelsGained > 0);
                    }
                    
                    await this.wait(600);
                    
                    // Handle level ups
                    if (result.levelsGained > 0) {
                        showLevelUpNotification(monster, result.oldLevel, result.newLevel);
                        if (this.gameEngine.uiManager) {
                            this.gameEngine.uiManager.updateBattleUI(this.battleState);
                        }
                    }
                }
            } else if (!this.hasParticipated(monster)) {
                console.log(`⏭️ ${monster.name} did not participate in battle - no participation XP awarded`);
            }
        }
        
        // Additional bonus XP for defeated monsters (consolation prize)
        for (const monster of this.battleState.playerTeam) {
            if (monster.currentHP <= 0) {
                // Smaller consolation XP for fainted monsters
                const consolationXP = Math.max(2, Math.floor(baseParticipationXP * 0.2));
                
                if (consolationXP > 0) {
                    console.log(`🎯 Awarding ${consolationXP} consolation XP to ${monster.name} (Level ${monster.level}, Current XP: ${monster.xp})`);
                    const result = this.gameEngine.xpManager.awardXP(monster, consolationXP, this.battleState.battleLog);
                    console.log(`✅ Consolation XP awarded! New XP: ${monster.xp}, Level: ${monster.level}`);
                    await this.queueMessage(`${monster.name} gained ${consolationXP} consolation XP despite fainting!`);
                    
                    // Show XP gain popup for consolation XP
                    const monsterSprite = document.querySelector('.player-area .monster-sprite');
                    if (monsterSprite) {
                        showXPGainPopup(monsterSprite, consolationXP);
                    }
                    
                    // Update XP bar visually
                    const monsterXPBar = document.querySelector('.player-area .xp-progress-container');
                    if (monsterXPBar && this.gameEngine.xpManager) {
                        updateXPProgressBar(monsterXPBar, monster, this.gameEngine, result.levelsGained > 0);
                    }
                    
                    await this.wait(600);
                    
                    // Handle level ups (very rare for fainted monsters)
                    if (result.levelsGained > 0) {
                        showLevelUpNotification(monster, result.oldLevel, result.newLevel);
                        if (this.gameEngine.uiManager) {
                            this.gameEngine.uiManager.updateBattleUI(this.battleState);
                        }
                    }
                }
            }
        }
        
        // Save XP to Firebase for all team monsters
        try {
            await this.gameEngine.xpManager.saveTeamXP(this.battleState.playerTeam);
        } catch (error) {
            console.error('Failed to save team XP:', error);
        }
        
        // Calculate base money rewards
        const baseMoney = this.battleState.opponentTeam.reduce((total, monster) => {
            return total + (monster.level * 5);
        }, 0);
        
        return {
            exp: 0, // XP is handled separately above
            money: baseMoney
        };
    }

    // Get battle statistics
    getBattleStats() {
        return {
            turns: this.battleState.turn,
            playerTeamSurvivors: this.battleState.playerTeam.filter(m => m.currentHP > 0).length,
            totalPlayerTeam: this.battleState.playerTeam.length
        };
    }

    // Add message to battle log with typing effect
    addToBattleLog(message) {
        this.battleState.battleLog.push({
            message,
            timestamp: Date.now()
        });
        
        // Update UI to show the message
        this.gameEngine.uiManager.addBattleLogMessage(message);
    }

    // Utility function to wait
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms / this.animationSpeed));
    }

    // Get current battle state
    getBattleState() {
        return { ...this.battleState };
    }

    // Clean up battle resources
    cleanup() {
        battleVFX.cleanup();
        this.pendingActions = { player: null, opponent: null };
        this.isAnimating = false;
    }

    // Show turn transition effect
    async showTurnTransition() {
        const turnIndicator = document.querySelector('.turn-indicator');
        if (turnIndicator) {
            // Flash the turn indicator
            turnIndicator.style.transform = 'scale(1.2)';
            turnIndicator.style.filter = 'brightness(1.5)';
            await this.wait(300);
            turnIndicator.style.transform = 'scale(1)';
            turnIndicator.style.filter = 'brightness(1)';
        }
        
        // Add visual separator and turn announcement
        await this.queueMessage(`--- Turn ${this.battleState.turn + 1} ---`);
        await this.wait(800); // Longer wait to let players process the turn change
    }
} 