import { characters, boss, updateHpBars, updateAbilityButtons, logCombat } from './utils.js';
import { handleCharacterAttack } from './characterAbilities.js';

export function initializeGame() {
    console.log("Game initialized");
    // Add your initialization logic here
}
export function attachEventListeners() {
    document.querySelectorAll('.ability').forEach(ability => {
        ability.addEventListener('click', () => {
            const characterId = parseInt(ability.parentElement.parentElement.id.replace('character', ''));
            const abilityIndex = Array.from(ability.parentElement.children).indexOf(ability);

            if (characterId === 1 && abilityIndex === 0) { // Ayane's A1 ability
                ayaneA1();
            } else if (characterId === 4 && abilityIndex === 3) { // Siegfried's A4 ability
                siegfriedA4Spell();
            } else if (characterId === 4 && abilityIndex === 2) { // Siegfried's A2 ability
                siegfriedA2Spell();
            } else if (characterId === 5 && abilityIndex === 1) { // Kokoro's A2 ability
                kokoroA2Spell();
            } else if (characterId === 5 && abilityIndex === 2) { // Kokoro's A3 ability
                if (characters[4].kokoroA3Cooldown <= 0) {
                    kokoroA3Spell();
                    characters[4].kokoroA3Cooldown = 3; // Set cooldown to 3 turns
                    updateAbilityButtons(); // Update ability buttons state
                }
            } else if (characterId === 5 && abilityIndex === 3) { // Kokoro's A4 ability
                kokoroA4Spell();
            } else {
                handleCharacterAttack(characterId, abilityIndex);
            }
        });
    });

    const kokoroA1 = document.getElementById('kokoro-a1');
    const healingIconsContainer = document.getElementById('healing-icons-container');
    const healingIcons = document.querySelectorAll('.healing-icon');

    if (kokoroA1 && healingIconsContainer) {
        kokoroA1.addEventListener('click', () => {
            healingIconsContainer.classList.remove('hidden');
        });

        healingIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const targetId = parseInt(icon.getAttribute('data-target'));
                const targetCharacter = characters.find(character => character.id === targetId);

                if (targetCharacter && targetCharacter.hp > 0) { // Check if target character is not defeated
                    bossCanAct = false; // Prevent the boss from acting during the heal
                    targetCharacter.hp += 2050;
                    if (targetCharacter.hp > targetCharacter.maxHp) {
                        targetCharacter.hp = targetCharacter.maxHp;
                    }
                    updateHpBars();
                    checkDefeatedCharacters();
                    healingIconsContainer.classList.add('hidden');
                    bossCanAct = true; // Allow the boss to act after the heal
                    bossTurn(); // Call bossTurn function to trigger the boss attack after healing is complete

                    // Flash the character image green
                    const characterElement = document.getElementById(`character${targetId}`);
                    const characterImage = characterElement.querySelector('img');
                    characterImage.classList.add('green-flash');

                    // Remove the class after the animation completes
                    setTimeout(() => {
                        characterImage.classList.remove('green-flash');
                    }, 500);
                }
            });
        });
    }
}