// Level Up Demo - Demonstrates the level-up system during battles
import { BattleSystem } from './battle_system.js';
import { levelUpManager } from './level_up_manager.js';

export function demonstrateLevelUpSystem() {
    console.log("🎮 Level-Up System Demo");
    console.log("========================");
    
    // Create a battle system instance
    const battleSystem = new BattleSystem();
    
    // Create sample monsters for demonstration
    const playerMonster = {
        name: "Blobby",
        level: 4,
        experience: 800, // Close to level 5
        stats: {
            hp: 80,
            attack: 75,
            defense: 70,
            specialAttack: 90,
            specialDefense: 85,
            speed: 95
        },
        currentHP: 80,
        maxHP: 80,
        uid: "demo_player_monster",
        types: ["Water", "Dragon"]
    };
    
    const opponentMonster = {
        name: "Sharx",
        level: 6,
        experience: 1500,
        stats: {
            hp: 85,
            attack: 95,
            defense: 75,
            specialAttack: 70,
            specialDefense: 70,
            speed: 100
        },
        currentHP: 0, // Defeated
        maxHP: 85,
        uid: "demo_opponent_monster",
        types: ["Water", "Dark"]
    };
    
    console.log(`\n🔵 Player Monster: ${playerMonster.name}`);
    console.log(`   Level: ${playerMonster.level}`);
    console.log(`   Experience: ${playerMonster.experience}`);
    console.log(`   Stats: HP ${playerMonster.stats.hp}, ATK ${playerMonster.stats.attack}, DEF ${playerMonster.stats.defense}`);
    console.log(`   Current HP: ${playerMonster.currentHP}/${playerMonster.maxHP}`);
    
    console.log(`\n🔴 Opponent Monster: ${opponentMonster.name} (Defeated)`);
    console.log(`   Level: ${opponentMonster.level}`);
    console.log(`   Stats: HP ${opponentMonster.stats.hp}, ATK ${opponentMonster.stats.attack}, DEF ${opponentMonster.stats.defense}`);
    
    // Show XP progress before battle
    const xpProgressBefore = levelUpManager.getXPProgress(playerMonster);
    console.log(`\n📊 XP Progress Before Battle:`);
    console.log(`   Current XP: ${xpProgressBefore.currentXP}`);
    console.log(`   Progress to next level: ${Math.round(xpProgressBefore.progress * 100)}%`);
    console.log(`   XP needed for next level: ${xpProgressBefore.xpToNext}`);
    
    // Demonstrate XP calculation
    const xpGain = levelUpManager.calculateXPGain(playerMonster, opponentMonster, 'wild', false);
    console.log(`\n💫 Calculated XP Gain: ${xpGain}`);
    console.log(`   Base calculation factors:`);
    console.log(`   - Level difference: ${opponentMonster.level - playerMonster.level} (opponent higher = bonus)`);
    console.log(`   - Battle type: Wild (1.0x multiplier)`);
    console.log(`   - Opponent level bonus: ${Math.floor(opponentMonster.level * 1.2)}`);
    
    // Award XP and handle level-up
    console.log(`\n🎉 Awarding XP...`);
    const result = levelUpManager.awardXP(playerMonster, xpGain);
    
    console.log(`\n📈 XP Award Results:`);
    console.log(`   XP Gained: ${result.xpGained}`);
    console.log(`   Old Level: ${result.oldLevel} → New Level: ${result.newLevel}`);
    console.log(`   Levels Gained: ${result.levelsGained}`);
    console.log(`   Old XP: ${result.oldXP} → New XP: ${result.newXP}`);
    
    if (result.levelsGained > 0) {
        console.log(`\n🎊 LEVEL UP! ${playerMonster.name} reached level ${result.newLevel}!`);
        
        if (result.statIncreases) {
            console.log(`\n📊 Stat Increases:`);
            console.log(`   HP: +${result.statIncreases.hp}`);
            console.log(`   Attack: +${result.statIncreases.attack}`);
            console.log(`   Defense: +${result.statIncreases.defense}`);
            console.log(`   Special Attack: +${result.statIncreases.specialAttack}`);
            console.log(`   Special Defense: +${result.statIncreases.specialDefense}`);
            console.log(`   Speed: +${result.statIncreases.speed}`);
        }
        
        console.log(`\n🏥 Level-up healing: ${playerMonster.name} recovered some HP!`);
        console.log(`   Current HP: ${playerMonster.currentHP}/${playerMonster.maxHP}`);
        
        // Show formatted level-up messages
        const levelUpMessages = levelUpManager.formatLevelUpMessage(result);
        console.log(`\n💬 Battle Log Messages:`);
        levelUpMessages.forEach(message => console.log(`   ${message}`));
    }
    
    // Show final stats
    console.log(`\n🔵 Final Monster Stats:`);
    console.log(`   Level: ${playerMonster.level}`);
    console.log(`   Experience: ${playerMonster.experience}`);
    console.log(`   HP: ${playerMonster.stats.hp} (Max HP: ${playerMonster.maxHP})`);
    console.log(`   Attack: ${playerMonster.stats.attack}`);
    console.log(`   Defense: ${playerMonster.stats.defense}`);
    console.log(`   Special Attack: ${playerMonster.stats.specialAttack}`);
    console.log(`   Special Defense: ${playerMonster.stats.specialDefense}`);
    console.log(`   Speed: ${playerMonster.stats.speed}`);
    console.log(`   Current HP: ${playerMonster.currentHP}/${playerMonster.maxHP}`);
    
    // Show XP progress after battle
    const xpProgressAfter = levelUpManager.getXPProgress(playerMonster);
    console.log(`\n📊 XP Progress After Battle:`);
    console.log(`   Current XP: ${xpProgressAfter.currentXP}`);
    console.log(`   Progress to next level: ${Math.round(xpProgressAfter.progress * 100)}%`);
    console.log(`   XP needed for next level: ${xpProgressAfter.xpToNext}`);
    
    // Demonstrate trainer battle XP bonus
    console.log(`\n🏆 Trainer Battle Bonus Demo:`);
    const trainerXPGain = levelUpManager.calculateXPGain(playerMonster, opponentMonster, 'trainer', true);
    console.log(`   Wild battle XP: ${xpGain}`);
    console.log(`   Trainer battle XP: ${trainerXPGain} (${Math.round((trainerXPGain / xpGain) * 100)}% of wild)`);
    
    // Demonstrate team XP (multiple monsters)
    console.log(`\n👥 Team XP Demo:`);
    const teamMember1 = {
        name: "Buzzy",
        level: 3,
        experience: 400,
        stats: { hp: 70, attack: 65, defense: 60, specialAttack: 80, specialDefense: 75, speed: 85 },
        currentHP: 70,
        maxHP: 70,
        uid: "demo_team_member_1"
    };
    
    const teamMember2 = {
        name: "Smouldimp",
        level: 5,
        experience: 1200,
        stats: { hp: 75, attack: 85, defense: 65, specialAttack: 95, specialDefense: 70, speed: 80 },
        currentHP: 75,
        maxHP: 75,
        uid: "demo_team_member_2"
    };
    
    const team = [teamMember1, teamMember2];
    
    console.log(`   Team members before XP:`);
    team.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} - Level ${member.level} (${member.experience} XP)`);
    });
    
    // Award team XP (simulated - without Firebase saving)
    const teamResults = [];
    team.forEach(member => {
        const memberXPGain = levelUpManager.calculateXPGain(member, opponentMonster, 'wild', false);
        const memberResult = levelUpManager.awardXP(member, memberXPGain);
        memberResult.monster = member;
        teamResults.push(memberResult);
    });
    
    console.log(`\n   Team XP results:`);
    teamResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.monster.name}:`);
        console.log(`      XP gained: ${result.xpGained}`);
        console.log(`      Level: ${result.oldLevel} → ${result.newLevel}`);
        if (result.levelsGained > 0) {
            console.log(`      🎉 LEVEL UP! Gained ${result.levelsGained} level(s)!`);
        }
    });
    
    console.log(`\n✅ Level-Up System Demo Complete!`);
    console.log(`\n📝 Integration Notes:`);
    console.log(`   • Call battleSystem.handleMonsterDefeat() when a monster is defeated`);
    console.log(`   • Call battleSystem.awardTeamXP() for trainer battles with multiple participants`);
    console.log(`   • Use battleSystem.getXPProgress() to display XP bars in UI`);
    console.log(`   • Monster data is automatically saved to Firebase on level-up`);
    console.log(`   • Level-ups provide stat increases and small HP healing`);
    console.log(`   • XP gain scales with level difference and battle type`);
}

// Export the demo function
export { demonstrateLevelUpSystem }; 