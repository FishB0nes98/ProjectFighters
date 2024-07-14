import { bossTurn, flashRed, addBuffIcon, removeBuffIcon, logCombat, updateHpBars, checkDefeatedCharacters, highlightCharacter, bossCanAct, } from './utils.js';
import { characters, boss } from './utils.js';
import { lastAttacker } from './bossLogic.js';

export function ayaneA1() {
    const damage = 420;
    const isImmune = Math.random() < 0.5; // 50% chance

    // Apply damage to the boss
    boss.hp -= damage;
    logCombat(`Ayane's A1 deals ${damage} damage to the boss.`);
    updateHpBars();

    // Check for boss defeat
    if (boss.hp <= 0) {
        alert('Boss defeated by Ayane!');
        boss.hp = 0;
        updateHpBars();
    }

    // Apply immunity to Ayane if the random chance succeeds
    if (isImmune) {
        ayaneImmune = true;
        logCombat('Ayane is immune to the next attack.');
        // Optionally, you can set a visual indicator for the immunity
    } else {
        ayaneImmune = false;
    }

    // Update HP bars and check defeated characters
    checkDefeatedCharacters();

    // Call the boss's turn
    bossTurn();
}

export function siegfriedA2Spell() {
    const siegfried = characters.find(character => character.id === 4);
    if (siegfried.hp > 0 && siegfriedA2Cooldown <= 0) { // Ensure Siegfried is not defeated and cooldown is 0
        siegfried.siegfriedA2Active = true;
        siegfried.siegfriedA2Turns = 3; // Lasts for 4 turns
        logCombat('Siegfried casts A2, healing 35% of his HP back and applying buff');
        highlightCharacter(4);
        siegfriedA2Cooldown = 7; // Set cooldown to 10 boss attacks
        bossTurn();
        updateHpBars();
        checkDefeatedCharacters();

        // Display Siegfried's A2 buff icon
        addBuffIcon(4, 'res/img/raid/siegfrieda2.jfif', 'siegfried-a2-buff', 'Takes 20% less damage');
    }
}

export function siegfriedA4Spell() {
    const siegfried = characters.find(character => character.id === 4);
    if (siegfried.hp > 0 && siegfriedA4Cooldown <= 0) { // Ensure Siegfried is not defeated and cooldown is 0
        siegfried.siegfriedA4Active = true;
        siegfried.siegfriedA4Turns = 4; // Lasts for 4 turns
        logCombat('Siegfried casts A4, dealing 3x damage for 4 turns and healing 30% of the damage dealt.');
        highlightCharacter(4);
        siegfriedA4Cooldown = 10; // Set cooldown to 10 boss attacks
        bossTurn();
        updateHpBars();
        checkDefeatedCharacters();

        // Display Siegfried's A4 buff icon
        addBuffIcon(4, 'res/img/raid/siegfrieda4.jfif', 'siegfried-a4-buff', 'Deals 3x damage and heals 30% of damage dealt');
    }
}

export function kokoroA2Spell() {
    const kokoro = characters.find(character => character.id === 5);
    if (kokoro.hp > 0 && kokoro.kokoroA2Cooldown <= 0) { // Ensure Kokoro is not defeated and cooldown is 0
        kokoroA2BuffActive = true;
        kokoroA2BuffCounter = 3; // Buff lasts for 3 boss attacks
        boss.damageReduction = 0.5; // Reduce boss damage by 50%
        logCombat('Kokoro casts A2, reducing boss damage by 50% for 3 boss attacks.');
        highlightCharacter(5);
        kokoro.kokoroA2Cooldown = 7; // Set cooldown to 7 boss attacks
        kokoroA2CooldownCounter = 7;
        addBuffIcon('boss', 'res/img/raid/kokoroa2.jfif', `kokoro-a2-buff-boss`, 'Deals 50% less damage for 3 attacks');
        bossTurn();
        updateHpBars();
        checkDefeatedCharacters();
    }
}

export function kokoroA3Spell() {
    bossCanAct = false; // Prevent the boss from acting during the heal
    characters.forEach(character => {
        if (character.hp > 0) { // Check if character is not defeated
            character.hp += 920;
            if (character.hp > character.maxHp) {
                character.hp = character.maxHp;
            }

            // Flash the character image green
            const characterElement = document.getElementById(`character${character.id}`);
            const characterImage = characterElement.querySelector('img');
            characterImage.classList.add('green-flash');

            // Remove the class after the animation completes
            setTimeout(() => {
                characterImage.classList.remove('green-flash');
            }, 500);
        }
    });
    updateHpBars();
    checkDefeatedCharacters();
    bossCanAct = true; // Allow the boss to act after the heal
    bossTurn(); // Call bossTurn function to trigger the boss attack after healing is complete
}

export function kokoroA4Spell() {
    const kokoro = characters.find(character => character.id === 5);
    if (kokoro.hp > 0 && kokoro.kokoroA4Cooldown <= 0) { // Ensure Kokoro is not defeated and cooldown is 0
        kokoroA4BuffActive = true;
        kokoroA4BuffCounter = 7; // Buff lasts for 7 boss turns
        logCombat('Kokoro casts A4, reducing damage taken by allies by 35% for 7 boss turns.');
        highlightCharacter(5);
        kokoro.kokoroA4Cooldown = 16; // Set cooldown to 16 boss attacks
        kokoroA4CooldownCounter = 16;
        characters.forEach(character => {
            addBuffIcon(character.id, 'res/img/raid/kokoroa4.jfif', `kokoro-a4-buff-${character.id}`, 'Takes 35% less damage from boss attacks');
        });
        bossTurn();
        updateHpBars();
        checkDefeatedCharacters();
    }
}

export function handleCharacterAttack(characterId, abilityIndex) {
    const damage = characters[characterId - 1].abilities[abilityIndex];
    if (characters[characterId - 1].hp > 0) {
        highlightCharacter(characterId);
        if (characterId === 4 && characters[characterId - 1].siegfriedA4Active) {
            const enhancedDamage = damage * 3; // Apply 3x damage
            boss.hp -= enhancedDamage;
            characters[characterId - 1].hp += Math.floor(enhancedDamage * 0.3); // Heal Siegfried
            if (characters[characterId - 1].hp > characters[characterId - 1].maxHp) {
                characters[characterId - 1].hp = characters[characterId - 1].maxHp; // Cap HP to max
            }
            logCombat(`Siegfried casts enhanced attack, dealing ${enhancedDamage} damage and healing ${Math.floor(enhancedDamage * 0.3)} HP.`);
        } else {
            boss.hp -= damage;
            logCombat(`Character ${characterId} casts attack, dealing ${damage} damage.`);
        }
        if (boss.hp <= 0) {
            alert('Boss defeated!');
            boss.hp = 0; // Ensure the boss HP doesn't go negative
        } else {
            lastAttacker = characterId;
            lastDamageDealt = damage;
            if (characters[characterId - 1].siegfriedA4Active) {
                characters[characterId - 1].siegfriedA4Turns--;
                if (characters[characterId - 1].siegfriedA4Turns <= 0) {
                    characters[characterId - 1].siegfriedA4Active = false; // Deactivate A4 after 3 turns
                    removeBuffIcon('siegfried-a4-buff'); // Remove buff icon
                }
            }
            bossTurn();
        }

        updateHpBars();
        checkDefeatedCharacters();
    }
}