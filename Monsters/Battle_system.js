// Battle System Integration - Shows how moves and abilities work together
import { moveRegistry } from './move_registry.js';
import { abilityRegistry } from './ability_registry.js';
import { levelUpManager } from './level_up_manager.js';

export class BattleSystem {
    constructor() {
        this.battleState = {
            turn: 0,
            fieldEffects: {
                userSide: {},
                opponentSide: {}
            },
            weather: null,
            terrain: null,
            consecutiveProtects: 0
        };
        
        // Type effectiveness chart
        this.typeChart = {
            "Normal": { "Rock": 0.5, "Ghost": 0, "Steel": 0.5 },
            "Fire": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 2, "Bug": 2, "Rock": 0.5, "Dragon": 0.5, "Steel": 2 },
            "Water": { "Fire": 2, "Water": 0.5, "Grass": 0.5, "Ground": 2, "Rock": 2, "Dragon": 0.5 },
            "Electric": { "Water": 2, "Electric": 0.5, "Grass": 0.5, "Ground": 0, "Flying": 2, "Dragon": 0.5 },
            "Grass": { "Fire": 0.5, "Water": 2, "Electric": 1, "Grass": 0.5, "Poison": 0.5, "Flying": 0.5, "Bug": 0.5, "Rock": 2, "Dragon": 0.5, "Steel": 0.5 },
            "Ice": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 0.5, "Ground": 2, "Flying": 2, "Dragon": 2, "Steel": 0.5 },
            "Fighting": { "Normal": 2, "Ice": 2, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 2, "Ghost": 0, "Dark": 2, "Steel": 2, "Fairy": 0.5 },
            "Poison": { "Grass": 2, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0, "Fairy": 2 },
            "Ground": { "Fire": 2, "Electric": 2, "Grass": 0.5, "Poison": 2, "Flying": 0, "Bug": 0.5, "Rock": 2, "Steel": 2 },
            "Flying": { "Electric": 0.5, "Grass": 2, "Ice": 0.5, "Fighting": 2, "Bug": 2, "Rock": 0.5, "Steel": 0.5 },
            "Psychic": { "Fighting": 2, "Poison": 2, "Psychic": 0.5, "Dark": 0, "Steel": 0.5 },
            "Bug": { "Fire": 0.5, "Grass": 2, "Fighting": 0.5, "Poison": 0.5, "Flying": 0.5, "Psychic": 2, "Ghost": 0.5, "Dark": 2, "Steel": 0.5, "Fairy": 0.5 },
            "Rock": { "Fire": 2, "Ice": 2, "Fighting": 0.5, "Ground": 0.5, "Flying": 2, "Bug": 2, "Steel": 0.5 },
            "Ghost": { "Normal": 0, "Psychic": 2, "Ghost": 2, "Dark": 0.5 },
            "Dragon": { "Dragon": 2, "Steel": 0.5, "Fairy": 0 },
            "Dark": { "Fighting": 0.5, "Psychic": 2, "Bug": 1, "Ghost": 2, "Dark": 0.5, "Fairy": 0.5 },
            "Steel": { "Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2, "Rock": 2, "Steel": 0.5, "Fairy": 2 },
            "Fairy": { "Fire": 0.5, "Fighting": 2, "Poison": 0.5, "Dragon": 2, "Dark": 2, "Steel": 0.5 }
        };
    }

    // Calculate type effectiveness
    calculateTypeEffectiveness(moveType, targetTypes) {
        if (!Array.isArray(targetTypes)) {
            targetTypes = [targetTypes];
        }
        
        let effectiveness = 1;
        for (const targetType of targetTypes) {
            if (this.typeChart[moveType] && this.typeChart[moveType][targetType] !== undefined) {
                effectiveness *= this.typeChart[moveType][targetType];
            }
        }
        return effectiveness;
    }

    // Calculate damage for moves
    calculateDamage(user, target, move, isCritical = false) {
        if (move.category === "Status") return 0;
        
        const level = user.level || 5;
        const attack = move.category === "Physical" ? 
            this.getEffectiveStat(user, "attack") : 
            this.getEffectiveStat(user, "specialAttack");
        const defense = move.category === "Physical" ? 
            this.getEffectiveStat(target, "defense") : 
            this.getEffectiveStat(target, "specialDefense");
        
        // Base damage formula
        let damage = ((((2 * level / 5 + 2) * move.power * attack / defense) / 50) + 2);
        
        // Critical hit multiplier
        if (isCritical) {
            damage *= 1.5;
        }
        
        // Random factor (85-100%)
        damage *= (Math.random() * 0.15 + 0.85);
        
        return Math.floor(damage);
    }

    // Get effective stat considering modifiers
    getEffectiveStat(monster, statName) {
        const baseStat = this.calculateBaseStat(monster, statName);
        const modifier = monster.statModifiers?.[statName] || 0;
        
        // Stat modifier formula: each stage is a 50% increase/decrease
        const multiplier = modifier >= 0 ? 
            (2 + modifier) / 2 : 
            2 / (2 + Math.abs(modifier));
        
        return Math.floor(baseStat * multiplier);
    }

    // Calculate base stat including IVs
    calculateBaseStat(monster, statName) {
        const baseStat = monster.stats[statName] || 50;
        const level = monster.level || 5;
        const iv = monster.ivs?.[statName] || 0;

        if (statName === "hp") {
            return this.calculateHP(baseStat, level, iv);
        }

        // For other stats: ((2 * Base + IV) * Level / 100) + 5
        return Math.floor(((2 * baseStat + iv) * level / 100) + 5);
    }

    // Calculate actual HP based on base stat, level, and IVs
    calculateHP(baseStat, level, iv) {
        return Math.floor(((2 * baseStat + iv) * level / 100) + level + 10);
    }

    // Apply stat modification
    applyStatModification(monster, stat, stages) {
        if (!monster.statModifiers) {
            monster.statModifiers = {
                attack: 0,
                defense: 0,
                specialAttack: 0,
                specialDefense: 0,
                speed: 0,
                accuracy: 0,
                evasion: 0
            };
        }
        
        const oldValue = monster.statModifiers[stat];
        monster.statModifiers[stat] = Math.max(-6, Math.min(6, monster.statModifiers[stat] + stages));
        
        return {
            success: monster.statModifiers[stat] !== oldValue,
            newValue: monster.statModifiers[stat],
            change: monster.statModifiers[stat] - oldValue
        };
    }

    // Initialize a monster with moves and abilities
    initializeMonster(monsterData, userMonster) {
        // Ensure IVs are properly initialized
        const defaultIVs = {
            hp: 31,
            attack: 31,
            defense: 31,
            specialAttack: 31,
            specialDefense: 31,
            speed: 31
        };

        const monster = {
            ...monsterData,
            ...userMonster,
            ivs: { ...defaultIVs, ...userMonster.ivs },
            currentHP: 0,  // Will be set below
            maxHP: 0,     // Will be set below
            statusCondition: "none",
            statusTurns: 0,
            moves: [],
            ability: null
        };

        // Calculate HP after IVs are properly set
        monster.maxHP = this.calculateBaseStat(monster, "hp");
        monster.currentHP = monster.maxHP;

        // Load moves
        if (monsterData.moves) {
            for (const moveData of monsterData.moves) {
                try {
                    const move = moveRegistry.getMove(moveData.name);
                    monster.moves.push(move);
                } catch (error) {
                    console.warn(`Failed to load move ${moveData.name} for ${monster.name}:`, error);
                }
            }
        }

        // Load ability
        if (monsterData.ability) {
            try {
                monster.ability = abilityRegistry.getAbility(monsterData.ability.name);
            } catch (error) {
                console.warn(`Failed to load ability ${monsterData.ability.name} for ${monster.name}:`, error);
            }
        }

        return monster;
    }

    // Execute a move with full ability integration
    executeMove(user, target, moveIndex, battleState = this.battleState) {
        if (moveIndex >= user.moves.length) {
            return { success: false, message: "Invalid move selection!" };
        }

        const move = user.moves[moveIndex];
        let result = { success: false };

        // Check PP
        if (move.pp <= 0) {
            return { success: false, message: `${move.name} has no PP left!` };
        }

        try {
            // Pre-move ability triggers (like Pixilate conversion)
            if (user.ability) {
                const abilityResult = abilityRegistry.executeAbilityHook(
                    user.ability, "move_use", user, move, target, battleState
                );
                if (abilityResult.triggered) {
                    console.log(abilityResult.message);
                }
            }

            // Execute the move - pass this battle system as battleManager for compatibility
            result = move.execute(user, target, this, battleState);

            // Reduce PP if move was attempted
            if (result.success !== false) {
                move.pp = Math.max(0, move.pp - 1);
            }

            // Handle consecutive protect tracking
            if (move.isProtectMove && move.isProtectMove()) {
                if (result.success) {
                    battleState.consecutiveProtects = (battleState.consecutiveProtects || 0) + 1;
                } else {
                    battleState.consecutiveProtects = 0;
                }
            } else {
                battleState.consecutiveProtects = 0;
            }

            // Post-move effects (field effects, status changes, etc.)
            if (result.success) {
                // Handle field effects (like Light Screen)
                this.processFieldEffects(battleState);

                // Check for ability triggers on damage dealt (for user abilities like Glacial Bloom)
                // Only trigger if not being called from enhanced battle manager (to prevent double triggers)
                if (result.damage > 0 && user.ability && !battleState.isEnhancedBattleManager) {
                    const abilityResult = abilityRegistry.executeAbilityHook(
                        user.ability, "damage_dealt", user, move, target, result.damage, battleState
                    );
                    if (abilityResult.triggered) {
                        console.log(abilityResult.message);
                        if (abilityResult.message) {
                            result.messages.push(abilityResult.message);
                        }
                    }
                }

                // Check for ability triggers on HP change
                if (result.damage > 0 && target.ability) {
                    const oldHP = target.currentHP + result.damage;
                    const abilityResult = abilityRegistry.executeAbilityHook(
                        target.ability, "hp_change", target, oldHP, target.currentHP, battleState
                    );
                    if (abilityResult.triggered) {
                        console.log(abilityResult.message);
                    }
                }
            }

        } catch (error) {
            console.error("Error executing move:", error);
            result = { success: false, message: "Move execution failed!" };
        }

        return result;
    }

    // Process field effects (like Light Screen duration)
    processFieldEffects(battleState) {
        const messages = [];
        
        // Import Light Screen dynamically to avoid circular imports
        import('./moves/light_screen.js').then(({ LightScreen }) => {
            // Decrease Light Screen turns
            const lightScreenMessage = LightScreen.decreaseTurns(battleState, "user");
            if (lightScreenMessage) {
                messages.push(lightScreenMessage);
            }

            const opponentLightScreenMessage = LightScreen.decreaseTurns(battleState, "opponent");
            if (opponentLightScreenMessage) {
                messages.push(opponentLightScreenMessage);
            }
        }).catch(error => {
            console.warn("Could not process Light Screen effects:", error);
        });

        // Process Aqua Ring healing
        import('./moves/aqua_ring.js').then(({ AquaRing }) => {
            // Process for all active monsters
            // This would need to be called for each monster in the battle
        }).catch(error => {
            console.warn("Could not process Aqua Ring effects:", error);
        });

        // Process Toxic Overload effects
        import('./moves/toxic_overload.js').then(({ ToxicOverload }) => {
            const toxicMessage = ToxicOverload.onTurnEnd(battleState);
            if (toxicMessage.message) {
                messages.push(toxicMessage.message);
            }
        }).catch(error => {
            console.warn("Could not process Toxic Overload effects:", error);
        });

        return messages;
    }

    // Start a battle and trigger ability introductions
    startBattle(userMonster, opponentMonster) {
        this.battleState.turn = 0;
        this.battleState.fieldEffects = { userSide: {}, opponentSide: {} };

        const messages = [];

        // Trigger battle start abilities
        if (userMonster.ability) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                userMonster.ability, "battle_start", userMonster, this.battleState
            );
            if (abilityResult.triggered) {
                messages.push(abilityResult.message);
            }
        }

        if (opponentMonster.ability) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                opponentMonster.ability, "battle_start", opponentMonster, this.battleState
            );
            if (abilityResult.triggered) {
                messages.push(abilityResult.message);
            }
        }

        return {
            success: true,
            messages: messages,
            battleState: this.battleState
        };
    }

    // Switch in a monster (triggers switch-in abilities)
    switchIn(monster, battleState = this.battleState) {
        const messages = [];

        if (monster.ability) {
            const abilityResult = abilityRegistry.executeAbilityHook(
                monster.ability, "switch_in", monster, battleState
            );
            if (abilityResult.triggered) {
                messages.push(abilityResult.message);
            }
        }

        return {
            success: true,
            messages: messages
        };
    }

    // Reset all moves and abilities for a monster (between battles)
    resetMonster(monster) {
        // Reset move PP
        for (const move of monster.moves) {
            move.reset();
        }

        // Reset ability
        if (monster.ability) {
            monster.ability.reset();
        }

        // Reset status
        monster.statusCondition = "none";
        monster.statusTurns = 0;
        monster.currentHP = monster.maxHP;
    }

    // Get move effectiveness preview
    getMoveEffectiveness(move, targetTypes) {
        if (move.getTypeEffectiveness) {
            return move.getTypeEffectiveness(targetTypes);
        }
        return 1; // Neutral effectiveness
    }

    // Handle monster defeat and award XP
    async handleMonsterDefeat(winner, loser, battleType = 'wild', isTrainerBattle = false) {
        const messages = [];
        
        // Award XP to the winning monster
        if (winner && winner.currentHP > 0) {
            const xpGain = levelUpManager.calculateXPGain(winner, loser, battleType, isTrainerBattle);
            const result = levelUpManager.awardXP(winner, xpGain);
            
            messages.push(`${winner.name} gained ${result.xpGained} XP!`);
            
            // Handle level-ups
            if (result.levelsGained > 0) {
                const levelUpMessages = levelUpManager.formatLevelUpMessage(result);
                messages.push(...levelUpMessages);
                
                // Save the updated monster data to Firebase
                await levelUpManager.saveMonsterData(winner);
            }
        }
        
        return {
            success: true,
            messages: messages,
            xpResult: winner ? levelUpManager.awardXP(winner, 0) : null // Get current XP info
        };
    }

    // Award XP to entire team (for trainer battles where multiple monsters participate)
    async awardTeamXP(team, defeatedMonster, battleType = 'wild', isTrainerBattle = false) {
        const results = [];
        const messages = [];
        
        for (const monster of team) {
            if (!monster || monster.currentHP <= 0) continue; // Only conscious monsters get XP
            
            const xpGain = levelUpManager.calculateXPGain(monster, defeatedMonster, battleType, isTrainerBattle);
            const result = levelUpManager.awardXP(monster, xpGain);
            result.monster = monster;
            results.push(result);
            
            messages.push(`${monster.name} gained ${result.xpGained} XP!`);
            
            // Handle level-ups
            if (result.levelsGained > 0) {
                const levelUpMessages = levelUpManager.formatLevelUpMessage(result);
                messages.push(...levelUpMessages);
            }
            
            // Save to Firebase
            await levelUpManager.saveMonsterData(monster);
        }
        
        return {
            success: true,
            messages: messages,
            results: results
        };
    }

    // Get XP progress for UI display
    getXPProgress(monster) {
        return levelUpManager.getXPProgress(monster);
    }
}

// Export singleton instance
export const battleSystem = new BattleSystem(); 