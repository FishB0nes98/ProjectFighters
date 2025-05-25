// Enemy AI - Intelligent opponent for battles
import { getTypeEffectiveness } from './monster-game-engine.js';

export class EnemyAI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.difficulty = 'normal'; // easy, normal, hard
        this.personalityType = 'balanced'; // aggressive, defensive, balanced, smart
    }

    // Select an action for the AI
    selectAction(battleState) {
        const aiMonster = battleState.activeOpponent;
        const playerMonster = battleState.activePlayer;
        
        // Simple move selection for now
        const moveIndex = this.selectBestMove(aiMonster, playerMonster);
        
        return {
            type: 'move',
            moveIndex: moveIndex,
            move: aiMonster.moves[moveIndex],
            user: aiMonster,
            target: playerMonster,
            priority: aiMonster.moves[moveIndex].priority || 0
        };
    }

    // Select the best move based on AI intelligence
    selectBestMove(aiMonster, targetMonster) {
        const moves = aiMonster.moves;
        let bestMoveIndex = 0;
        let bestScore = -1000;

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const score = this.evaluateMove(move, aiMonster, targetMonster);
            
            if (score > bestScore) {
                bestScore = score;
                bestMoveIndex = i;
            }
        }

        // Add some randomness based on difficulty
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
            // 30% chance to pick random move on easy
            return Math.floor(Math.random() * moves.length);
        }

        return bestMoveIndex;
    }

    // Evaluate a move's effectiveness
    evaluateMove(move, user, target) {
        let score = 0;

        // Can't use moves with no PP
        if (move.pp <= 0) {
            return -1000;
        }

        // Base move power
        if (move.power > 0) {
            score += move.power;

            // STAB bonus
            if (user.types.includes(move.type)) {
                score += 20;
            }

            // Type effectiveness
            const effectiveness = getTypeEffectiveness(move.type, target.types);
            if (effectiveness > 1) {
                score += 50; // Super effective
            } else if (effectiveness < 1) {
                score -= 30; // Not very effective
            } else if (effectiveness === 0) {
                score -= 100; // No effect
            }

            // Damage potential
            const estimatedDamage = this.estimateDamage(move, user, target);
            score += estimatedDamage / 10;

            // Prioritize moves that can KO
            if (estimatedDamage >= target.currentHP) {
                score += 100; // High priority for KO moves
            }

            // Consider accuracy
            score += (move.accuracy - 100) / 2; // Lose points for low accuracy
        }

        // Evaluate status/support moves
        if (move.category === "Status") {
            score += this.evaluateStatusMove(move, user, target);
        }

        // Personality-based adjustments
        score += this.applyPersonalityBonus(move, user, target);

        // Priority moves get bonus when target is low HP
        if (move.priority > 0 && target.currentHP < target.maxHP * 0.3) {
            score += 30;
        }

        // Multi-hit moves are good against low HP targets
        if (move.effects && move.effects.includes('multi_hit') && target.currentHP < target.maxHP * 0.5) {
            score += 25;
        }

        console.log(`🤖 AI evaluating ${move.name}: score ${score}`);
        return score;
    }

    // Estimate damage a move would deal
    estimateDamage(move, attacker, defender) {
        if (move.power <= 0) return 0;

        const level = attacker.level;
        const attack = move.category === "Physical" ? attacker.stats.attack : attacker.stats.specialAttack;
        const defense = move.category === "Physical" ? defender.stats.defense : defender.stats.specialDefense;
        const basePower = move.power;

        // Simplified damage calculation
        let damage = Math.floor(((2 * level + 10) / 250) * (attack / defense) * basePower + 2);

        // STAB
        if (attacker.types.includes(move.type)) {
            damage = Math.floor(damage * 1.5);
        }

        // Type effectiveness
        const effectiveness = getTypeEffectiveness(move.type, defender.types);
        damage = Math.floor(damage * effectiveness);

        // Use average random factor
        damage = Math.floor(damage * 0.925); // 92.5% average

        return Math.max(1, damage);
    }

    // Evaluate status/support moves
    evaluateStatusMove(move, user, target) {
        let score = 0;

        switch (move.name) {
            case "Heal Bell":
                // Good if user or team has status conditions
                if (user.statusCondition !== "none") {
                    score += 60;
                }
                break;

            case "Light Screen":
                // Good against special attackers
                const targetIsSpecialAttacker = target.stats.specialAttack > target.stats.attack;
                if (targetIsSpecialAttacker) {
                    score += 40;
                }
                break;

            default:
                // Generic status move value
                score += 20;
                break;
        }

        return score;
    }

    // Apply personality-based bonuses
    applyPersonalityBonus(move, user, target) {
        let bonus = 0;

        switch (this.personalityType) {
            case 'aggressive':
                // Prefer high-damage moves
                if (move.power >= 80) {
                    bonus += 20;
                }
                // Dislike status moves
                if (move.category === "Status") {
                    bonus -= 15;
                }
                break;

            case 'defensive':
                // Prefer status and support moves
                if (move.category === "Status") {
                    bonus += 25;
                }
                // Prefer moves with good accuracy
                if (move.accuracy >= 95) {
                    bonus += 10;
                }
                break;

            case 'smart':
                // Prefer type-effective moves
                const effectiveness = getTypeEffectiveness(move.type, target.types);
                if (effectiveness > 1) {
                    bonus += 30;
                }
                // Avoid ineffective moves more strongly
                if (effectiveness < 1) {
                    bonus -= 20;
                }
                break;

            case 'balanced':
            default:
                // No special preferences
                break;
        }

        return bonus;
    }

    // Set AI difficulty
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        console.log(`🤖 AI difficulty set to: ${difficulty}`);
    }

    // Set AI personality
    setPersonality(personality) {
        this.personalityType = personality;
        console.log(`🤖 AI personality set to: ${personality}`);
    }

    // Advanced move prediction (for harder difficulties)
    predictPlayerMove(battleState) {
        // Could analyze player patterns and predict likely moves
        // For now, just assume random move
        const playerMoves = battleState.activePlayer.moves;
        return Math.floor(Math.random() * playerMoves.length);
    }

    // Evaluate switching (for future implementation)
    evaluateSwitch(currentMonster, availableMonsters, opponent) {
        // If current monster is fainted, we must switch
        if (currentMonster.currentHP <= 0) {
            return true;
        }

        // Don't switch if we have no other monsters
        if (!availableMonsters || availableMonsters.length === 0) {
            return false;
        }

        // Calculate how good our current matchup is
        const currentMatchupScore = this.evaluateMatchup(currentMonster, opponent);
        
        // Find best alternative matchup
        let bestAlternativeScore = -1000;
        for (const monster of availableMonsters) {
            if (monster.currentHP <= 0) continue; // Skip fainted monsters
            const matchupScore = this.evaluateMatchup(monster, opponent);
            bestAlternativeScore = Math.max(bestAlternativeScore, matchupScore);
        }

        // Switch if alternative is significantly better (20% better)
        return bestAlternativeScore > currentMatchupScore * 1.2;
    }

    // Evaluate how good a matchup is between two monsters
    evaluateMatchup(monster, opponent) {
        let score = 0;

        // Type effectiveness evaluation
        for (const monsterType of monster.types) {
            for (const opponentType of opponent.types) {
                const effectiveness = getTypeEffectiveness(monsterType, [opponentType]);
                if (effectiveness > 1) {
                    score += 30; // Good matchup
                } else if (effectiveness < 1) {
                    score -= 30; // Bad matchup
                } else if (effectiveness === 0) {
                    score -= 50; // Terrible matchup
                }
            }
        }

        // Consider HP status
        const hpPercentage = monster.currentHP / monster.maxHP;
        if (hpPercentage < 0.3) {
            score -= 40; // Very low HP
        } else if (hpPercentage < 0.5) {
            score -= 20; // Low HP
        }

        // Consider status conditions
        if (monster.statusCondition !== 'none') {
            score -= 25; // Status conditions are bad
        }

        // Consider stat differences
        const attackAdvantage = monster.stats.attack - opponent.stats.defense;
        const spAttackAdvantage = monster.stats.specialAttack - opponent.stats.specialDefense;
        score += (attackAdvantage + spAttackAdvantage) / 10;

        return score;
    }

    // Select which monster to switch to
    selectSwitch(availableMonsters, battleState) {
        if (!availableMonsters || availableMonsters.length === 0) {
            throw new Error('No available monsters to switch to');
        }

        const opponent = battleState.activePlayer;
        let bestMonster = null;
        let bestScore = -1000;

        // Evaluate each available monster
        for (const monster of availableMonsters) {
            if (monster.currentHP <= 0) continue; // Skip fainted monsters
            
            const score = this.evaluateMatchup(monster, opponent);
            
            // Add some randomness based on difficulty
            const randomFactor = this.difficulty === 'easy' ? Math.random() * 30 - 15 : 0;
            const finalScore = score + randomFactor;

            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestMonster = monster;
            }
        }

        // If no valid monster found (all fainted), return the first one
        if (!bestMonster) {
            console.warn('No valid monster found for switching, using first available');
            return availableMonsters[0];
        }

        console.log(`🤖 AI switching to ${bestMonster.name} (score: ${bestScore})`);
        return bestMonster;
    }

    // Dynamic difficulty adjustment based on battle progress
    adjustDifficulty(battleState) {
        const playerTeamHP = this.calculateTeamHP(battleState.playerTeam);
        const aiTeamHP = this.calculateTeamHP(battleState.opponentTeam);
        
        // If AI is losing badly, make it smarter
        if (aiTeamHP < playerTeamHP * 0.5) {
            this.setPersonality('smart');
        }
        // If AI is winning easily, add some randomness
        else if (aiTeamHP > playerTeamHP * 1.5) {
            this.setPersonality('balanced');
        }
    }

    // Calculate total team HP percentage
    calculateTeamHP(team) {
        let totalCurrentHP = 0;
        let totalMaxHP = 0;
        
        for (const monster of team) {
            totalCurrentHP += monster.currentHP;
            totalMaxHP += monster.maxHP;
        }
        
        return totalMaxHP > 0 ? (totalCurrentHP / totalMaxHP) : 0;
    }

    // Generate AI commentary (for fun)
    generateComment(move, effectiveness) {
        const comments = {
            superEffective: [
                "Excellent! A super effective move!",
                "That's the way to do it!",
                "Perfect type matchup!"
            ],
            notVeryEffective: [
                "Hmm, not the best choice...",
                "That wasn't very effective.",
                "Maybe I should try something else..."
            ],
            miss: [
                "Oops! Missed!",
                "So close!",
                "Better luck next time!"
            ],
            critical: [
                "Critical hit! Amazing!",
                "What a strike!",
                "Perfect timing!"
            ]
        };

        let category = 'normal';
        if (effectiveness > 1) category = 'superEffective';
        else if (effectiveness < 1) category = 'notVeryEffective';

        const categoryComments = comments[category] || [];
        if (categoryComments.length > 0) {
            return categoryComments[Math.floor(Math.random() * categoryComments.length)];
        }

        return "";
    }
} 