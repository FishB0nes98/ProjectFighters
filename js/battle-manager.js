// Battle Manager - Handles turn-based battle logic
import { moveRegistry } from '../Monsters/move_registry.js';
import { abilityRegistry } from '../Monsters/ability_registry.js';
import { showLevelUpNotification, showXPGainPopup, updateXPProgressBar } from './xp-ui-utils.js';
import { getTypeEffectiveness } from './monster-game-engine.js';

export class BattleManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.battleState = {
            turn: 0,
            phase: 'select', // select, execute, results
            playerTeam: [],
            opponentTeam: [],
            activePlayer: null,
            activeOpponent: null,
            isWild: false,
            fieldEffects: {
                playerSide: {},
                opponentSide: {}
            },
            weather: null,
            terrain: null,
            battleLog: [],
            participatingMonsters: new Set() // Track which monsters actually participated
        };
        
        this.pendingActions = {
            player: null,
            opponent: null
        };
    }

    // Start a new battle
    startBattle(playerTeam, opponentTeam, isWild = false, trainer = null, battleContext = 'free') {
        console.log('⚔️ Battle starting!');
        
        // Initialize battle state
        this.battleState = {
            turn: 1,
            phase: 'select',
            playerTeam: [...playerTeam],
            opponentTeam: [...opponentTeam],
            activePlayer: playerTeam[0],
            activeOpponent: opponentTeam[0],
            isWild: isWild,
            trainer: trainer,
            battleContext: battleContext, // Track battle context for legacy compatibility
            fieldEffects: {
                playerSide: {},
                opponentSide: {}
            },
            weather: null,
            terrain: null,
            battleLog: [],
            participatingMonsters: new Set()
        };

        // Reset monsters to full health
        for (const monster of this.battleState.playerTeam) {
            this.resetMonsterForBattle(monster);
        }
        for (const monster of this.battleState.opponentTeam) {
            this.resetMonsterForBattle(monster);
        }

        // Mark starting monster as participating
        this.markAsParticipating(this.battleState.activePlayer);

        // Trigger switch-in abilities
        this.triggerSwitchInAbilities();

        // Set up UI
        this.gameEngine.uiManager.showBattleScreen(this.battleState);

        this.addToBattleLog(`Battle started! ${this.battleState.activePlayer.name} vs ${this.battleState.activeOpponent.name}!`);
        
        return true;
    }

    // Reset monster for battle
    resetMonsterForBattle(monster) {
        monster.currentHP = monster.maxHP;
        monster.statusCondition = "none";
        monster.statusTurns = 0;
        
        // Reset move PP
        for (const move of monster.moves) {
            move.reset();
        }
        
        // Reset ability
        if (monster.ability) {
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

    // Trigger switch-in abilities
    triggerSwitchInAbilities() {
        if (this.battleState.activePlayer?.ability) {
            const result = abilityRegistry.executeAbilityHook(
                this.battleState.activePlayer.ability,
                "switch_in",
                this.battleState.activePlayer,
                this.battleState
            );
            if (result.triggered) {
                this.addToBattleLog(result.message);
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
                this.addToBattleLog(result.message);
            }
        }
    }

    // Player selects a move
    selectMove(moveIndex) {
        if (this.battleState.phase !== 'select') return false;
        
        const activeMonster = this.battleState.activePlayer;
        if (moveIndex >= activeMonster.moves.length) return false;

        const selectedMove = activeMonster.moves[moveIndex];
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

        // Execute turn
        this.executeTurn();
        
        return true;
    }

    // Execute the current turn
    executeTurn() {
        this.battleState.phase = 'execute';
        console.log(`🎯 Turn ${this.battleState.turn}: Executing actions`);

        // Determine action order based on priority and speed
        const actionOrder = this.determineActionOrder();
        
        // Execute actions in order
        for (const action of actionOrder) {
            if (this.isBattleOver()) break;
            
            this.executeAction(action);
        }

        // End of turn effects
        this.processEndOfTurnEffects();

        // Check if battle is over
        if (this.isBattleOver()) {
            this.endBattle();
        } else {
            // Prepare for next turn
            this.battleState.turn++;
            this.battleState.phase = 'select';
            this.pendingActions = { player: null, opponent: null };
            
            // Update UI for next turn
            this.gameEngine.uiManager.updateBattleUI(this.battleState);
        }
    }

    // Determine the order of actions based on priority and speed
    determineActionOrder() {
        const actions = [this.pendingActions.player, this.pendingActions.opponent].filter(Boolean);
        
        return actions.sort((a, b) => {
            // Higher priority goes first
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
            // Same priority: faster monster goes first
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
        
        // Paralysis halves speed
        if (monster.statusCondition === 'paralysis') {
            speed = Math.floor(speed / 2);
        }
        
        return speed;
    }

    // Execute a single action
    executeAction(action) {
        if (action.type === 'move') {
            this.executeMoveAction(action);
        }
        // Could add other action types like items, switching, etc.
    }

    // Execute a move action
    executeMoveAction(action) {
        const { user, target, move, moveIndex } = action;
        
        // Check if user can move (not fainted, not frozen, etc.)
        if (!this.canMonsterMove(user)) {
            return;
        }

        // Trigger pre-move ability effects (like Pixilate)
        if (user.ability) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                user.ability,
                "move_use",
                user,
                move,
                target,
                this.battleState
            );
            if (abilityResult.triggered) {
                this.addToBattleLog(abilityResult.message);
            }
        }

        // Execute the move
        const moveResult = this.executeMove(user, target, move);
        
        if (moveResult.success) {
            this.addToBattleLog(moveResult.message);
            
            // Handle damage
            if (moveResult.damage > 0) {
                this.applyDamage(target, moveResult.damage, move);
            }
            
            // Handle recoil
            if (moveResult.recoilDamage > 0) {
                this.applyDamage(user, moveResult.recoilDamage, null, true);
            }
            
            // Handle special effects
            this.handleMoveEffects(moveResult, user, target);
        } else {
            this.addToBattleLog(moveResult.message);
        }
    }

    // Execute a move with full damage calculation
    executeMove(user, target, move) {
        // PP check
        if (move.pp <= 0) {
            return {
                success: false,
                message: `${user.name} tried to use ${move.name}, but it has no PP left!`
            };
        }

        move.pp--;

        // Accuracy check
        const hitChance = Math.random() * 100;
        if (hitChance > move.accuracy) {
            return {
                success: false,
                message: `${user.name} used ${move.name}, but it missed!`
            };
        }

        let damage = 0;
        let isCritical = false;

        // Calculate damage for damaging moves
        if (move.power > 0) {
            damage = this.calculateDamage(user, target, move);
            isCritical = this.checkCriticalHit(move);
            
            if (isCritical) {
                damage = Math.floor(damage * 1.5);
            }

            // Apply Light Screen reduction for special moves
            if (move.category === "Special" && this.battleState.fieldEffects.playerSide.lightScreen) {
                damage = Math.floor(damage * 0.5);
            }
        }

        let message = `${user.name} used ${move.name}!`;
        
        if (damage > 0) {
            if (isCritical) {
                message += ` A critical hit!`;
            }
            message += ` It dealt ${damage} damage!`;
        }

        // Handle recoil
        let recoilDamage = 0;
        if (move.effects && move.effects.includes('recoil') && damage > 0) {
            recoilDamage = Math.floor(damage * 0.25); // 25% recoil
            message += ` ${user.name} took ${recoilDamage} recoil damage!`;
        }

        return {
            success: true,
            damage: damage,
            recoilDamage: recoilDamage,
            message: message,
            critical: isCritical,
            effects: move.effects || []
        };
    }

    // Calculate damage using Pokemon formula
    calculateDamage(attacker, defender, move) {
        const level = attacker.level;
        const attack = move.category === "Physical" ? attacker.stats.attack : attacker.stats.specialAttack;
        const defense = move.category === "Physical" ? defender.stats.defense : defender.stats.specialDefense;
        const basePower = move.power;

        // Base damage formula
        let damage = Math.floor(((2 * level + 10) / 250) * (attack / defense) * basePower + 2);

        // STAB (Same Type Attack Bonus)
        if (attacker.types.includes(move.type)) {
            damage = Math.floor(damage * 1.5);
        }

        // Type effectiveness
        const effectiveness = getTypeEffectiveness(move.type, defender.types);
        damage = Math.floor(damage * effectiveness);

        // Random factor (85-100%)
        const randomFactor = (Math.random() * 0.15) + 0.85;
        damage = Math.floor(damage * randomFactor);

        return Math.max(1, damage);
    }

    // Check for critical hit
    checkCriticalHit(move) {
        let critChance = 6.25; // Base 1/16 chance
        
        // Some moves have higher crit ratios
        if (move.critRatio && move.critRatio > 1) {
            critChance = 12.5; // 1/8 chance
        }

        return Math.random() * 100 <= critChance;
    }

    // Apply damage to a monster
    applyDamage(target, damage, move = null, isRecoil = false) {
        const oldHP = target.currentHP;
        target.currentHP = Math.max(0, target.currentHP - damage);
        
        // Trigger HP change abilities
        if (target.ability && !isRecoil) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                target.ability,
                "hp_change",
                target,
                oldHP,
                target.currentHP,
                this.battleState
            );
            if (abilityResult.triggered) {
                this.addToBattleLog(abilityResult.message);
            }
        }

        // Check if monster fainted
        if (target.currentHP <= 0) {
            this.addToBattleLog(`${target.name} fainted!`);
            this.handleFaint(target);
        }
    }

    // Handle monster fainting
    handleFaint(monster) {
        // Award XP to the monster that caused the faint
        if (this.gameEngine.xpManager) {
            this.awardDefeatXP(monster);
        }
        
        // Remove field effects specific to this monster
        // Could trigger abilities that activate on fainting
        
        // Check if team has any remaining monsters
        const isPlayerMonster = this.battleState.playerTeam.includes(monster);
        const team = isPlayerMonster ? this.battleState.playerTeam : this.battleState.opponentTeam;
        
        const remainingMonsters = team.filter(m => m.currentHP > 0);
        
        if (remainingMonsters.length === 0) {
            // Team wiped out
            this.battleState.winner = isPlayerMonster ? 'opponent' : 'player';
        } else if (monster === this.battleState.activePlayer || monster === this.battleState.activeOpponent) {
            // Need to switch in next monster
            this.forceSwitch(isPlayerMonster);
        }
    }

    // Award XP for defeating a monster
    awardDefeatXP(defeatedMonster) {
        const isPlayerDefeated = this.battleState.playerTeam.includes(defeatedMonster);
        const winningTeam = isPlayerDefeated ? this.battleState.opponentTeam : this.battleState.playerTeam;
        const defeatedBy = isPlayerDefeated ? this.battleState.activeOpponent : this.battleState.activePlayer;
        
        // Determine battle type
        const battleType = this.battleState.isWild ? 'wild' : 'trainer';
        
        // Award XP to the winning monster
        if (defeatedBy && this.gameEngine.xpManager) {
            const winnerXP = this.gameEngine.xpManager.calculateXPGain(defeatedBy, defeatedMonster, battleType);
            const oldWinnerLevel = defeatedBy.level;
            const winnerResult = this.gameEngine.xpManager.awardXP(defeatedBy, winnerXP, this.battleState.battleLog);
            
            this.addToBattleLog(`${defeatedBy.name} gained ${winnerXP} XP for winning!`);
            
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
            
            // Handle level ups for winner
            if (winnerResult.levelsGained > 0) {
                showLevelUpNotification(defeatedBy, oldWinnerLevel, defeatedBy.level);
                if (this.gameEngine.uiManager) {
                    this.gameEngine.uiManager.updateBattleUI(this.battleState);
                }
            }
            
            // Save XP to Firebase immediately for the winning monster
            if (this.battleState.playerTeam.includes(defeatedBy)) {
                this.gameEngine.xpManager.saveMonsterXP(defeatedBy).then(() => {
                    console.log(`💾 Saved victory XP for ${defeatedBy.name} to Firebase`);
                }).catch(error => {
                    console.error('❌ Failed to save victory XP to Firebase:', error);
                });
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
                
                this.addToBattleLog(`${defeatedMonster.name} gained ${loserXP} XP for participating!`);
                
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
                
                // Handle level ups for loser (rare but possible)
                if (loserResult.levelsGained > 0) {
                    showLevelUpNotification(defeatedMonster, oldLoserLevel, defeatedMonster.level);
                    if (this.gameEngine.uiManager) {
                        this.gameEngine.uiManager.updateBattleUI(this.battleState);
                    }
                }
                
                // Save participation XP to Firebase immediately
                this.gameEngine.xpManager.saveMonsterXP(defeatedMonster).then(() => {
                    console.log(`💾 Saved participation XP for ${defeatedMonster.name} to Firebase`);
                }).catch(error => {
                    console.error('❌ Failed to save participation XP to Firebase:', error);
                });
            }
        }
    }

    // Force switch when active monster faints
    forceSwitch(isPlayer) {
        const team = isPlayer ? this.battleState.playerTeam : this.battleState.opponentTeam;
        const remainingMonsters = team.filter(m => m.currentHP > 0);
        
        if (remainingMonsters.length > 0) {
            const nextMonster = remainingMonsters[0];
            
            if (isPlayer) {
                this.battleState.activePlayer = nextMonster;
            } else {
                this.battleState.activeOpponent = nextMonster;
            }
            
            this.addToBattleLog(`${nextMonster.name} was sent out!`);
            
            // Trigger switch-in ability
            if (nextMonster.ability) {
                const result = abilityRegistry.executeAbilityHook(
                    nextMonster.ability,
                    "switch_in",
                    nextMonster,
                    this.battleState
                );
                if (result.triggered) {
                    this.addToBattleLog(result.message);
                }
            }
        }
    }

    // Handle special move effects
    handleMoveEffects(moveResult, user, target) {
        if (!moveResult.effects) return;

        for (const effect of moveResult.effects) {
            switch (effect) {
                case 'light_screen_active':
                    this.battleState.fieldEffects.playerSide.lightScreen = {
                        turnsRemaining: 5,
                        reduction: 0.5
                    };
                    break;
                    
                case 'status_heal':
                    // Heal Bell effect already handled in move execution
                    break;
            }
        }
    }

    // Process end of turn effects
    processEndOfTurnEffects() {
        // Decrease field effect durations
        this.processFieldEffects();
        
        // Status condition effects (poison, burn, etc.)
        this.processStatusConditions();
    }

    // Process field effects like Light Screen
    processFieldEffects() {
        // Player side effects
        if (this.battleState.fieldEffects.playerSide.lightScreen) {
            this.battleState.fieldEffects.playerSide.lightScreen.turnsRemaining--;
            
            if (this.battleState.fieldEffects.playerSide.lightScreen.turnsRemaining <= 0) {
                delete this.battleState.fieldEffects.playerSide.lightScreen;
                this.addToBattleLog("The Light Screen faded away!");
            }
        }

        // Opponent side effects
        if (this.battleState.fieldEffects.opponentSide.lightScreen) {
            this.battleState.fieldEffects.opponentSide.lightScreen.turnsRemaining--;
            
            if (this.battleState.fieldEffects.opponentSide.lightScreen.turnsRemaining <= 0) {
                delete this.battleState.fieldEffects.opponentSide.lightScreen;
                this.addToBattleLog("The opponent's Light Screen faded away!");
            }
        }
    }

    // Process status conditions
    processStatusConditions() {
        for (const monster of [...this.battleState.playerTeam, ...this.battleState.opponentTeam]) {
            if (monster.currentHP <= 0) continue;
            
            switch (monster.statusCondition) {
                case 'sleep':
                    // Sleep status doesn't deal damage, just shows a message
                    this.addToBattleLog(`${monster.name} is fast asleep...`);
                    break;
                case 'poison':
                    const poisonDamage = Math.floor(monster.maxHP / 8);
                    this.applyDamage(monster, poisonDamage);
                    this.addToBattleLog(`${monster.name} took poison damage!`);
                    break;
                    
                case 'burn':
                    const burnDamage = Math.floor(monster.maxHP / 16);
                    this.applyDamage(monster, burnDamage);
                    this.addToBattleLog(`${monster.name} took burn damage!`);
                    break;
            }
            
            // Decrease status condition duration
            if (monster.statusTurns > 0) {
                monster.statusTurns--;
                if (monster.statusTurns <= 0) {
                    const oldStatus = monster.statusCondition;
                    monster.statusCondition = "none";
                    if (oldStatus === 'sleep') {
                        this.addToBattleLog(`${monster.name} woke up!`);
                    } else {
                        this.addToBattleLog(`${monster.name} recovered from ${oldStatus}!`);
                    }
                }
            }
        }
    }

    // Check if monster can move
    canMonsterMove(monster) {
        if (monster.currentHP <= 0) {
            return false;
        }
        
        // Sleeping monsters can't move
        if (monster.statusCondition === 'sleep') {
            this.addToBattleLog(`${monster.name} is fast asleep!`);
            return false;
        }
        
        // Frozen monsters can't move (simplified)
        if (monster.statusCondition === 'frozen' || monster.statusCondition === 'freeze') {
            this.addToBattleLog(`${monster.name} is frozen solid!`);
            
            // 20% chance to thaw out each turn
            if (Math.random() < 0.2) {
                monster.statusCondition = 'none';
                monster.statusTurns = 0;
                this.addToBattleLog(`${monster.name} thawed out!`);
                return true; // Can move after thawing
            }
            
            return false;
        }
        
        // Paralyzed monsters have a 25% chance to not move
        if (monster.statusCondition === 'paralysis') {
            if (Math.random() < 0.25) {
                this.addToBattleLog(`${monster.name} is paralyzed and can't move!`);
                return false;
            }
        }
        
        return true;
    }

    // Check if battle is over
    isBattleOver() {
        const playerAlive = this.battleState.playerTeam.some(m => m.currentHP > 0);
        const opponentAlive = this.battleState.opponentTeam.some(m => m.currentHP > 0);
        
        if (!playerAlive) {
            this.battleState.winner = 'opponent';
            return true;
        }
        
        if (!opponentAlive) {
            this.battleState.winner = 'player';
            return true;
        }
        
        return false;
    }

    // End the battle
    endBattle() {
        console.log(`🏆 Battle ended! Winner: ${this.battleState.winner}`);
        
        if (this.battleState.winner === 'player') {
            this.addToBattleLog('You won the battle!');
        } else {
            this.addToBattleLog('You lost the battle!');
        }
        
        // Calculate rewards, experience, etc.
        this.calculateBattleRewards();
        
        // Update UI
        this.gameEngine.uiManager.showBattleResults(this.battleState);
        
        // Return to previous state
        this.gameEngine.gameState = 'menu';
    }

    // Calculate battle rewards
    async calculateBattleRewards() {
        if (this.battleState.winner === 'player' && this.gameEngine.xpManager) {
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
                        const result = this.gameEngine.xpManager.awardXP(monster, participationXP, this.battleState.battleLog);
                        this.addToBattleLog(`${monster.name} gained ${participationXP} participation XP!`);
                        
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
                        const result = this.gameEngine.xpManager.awardXP(monster, consolationXP, this.battleState.battleLog);
                        this.addToBattleLog(`${monster.name} gained ${consolationXP} consolation XP despite fainting!`);
                        
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
        }
    }

    // Add message to battle log
    addToBattleLog(message) {
        this.battleState.battleLog.push(message);
        console.log(`📝 ${message}`);
        
        // Update UI with new message
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.addBattleMessage(message);
        }
    }

    // Get current battle state
    getBattleState() {
        return this.battleState;
    }
} 