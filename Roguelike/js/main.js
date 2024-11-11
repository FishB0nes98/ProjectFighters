// js/main.js

// Elements
const gameContainer = document.getElementById('game-container');
const selectionScreen = document.getElementById('selection-screen');

// Selection Variables
let selectedPlayerName = '';
let selectedEnemyName = '';

// Characters
let player = { inventory: [] };
let enemy = { inventory: [] };

// Cast Time Flag
let isCasting = false;

// Selection Functions
function selectCharacter(characterName) {
    selectedPlayerName = characterName;
    console.log(`Selected Player: ${characterName}`);
}

function selectEnemy(enemyName) {
    selectedEnemyName = enemyName;
    console.log(`Selected Enemy: ${enemyName}`);
}

function startGame() {
    if (!selectedPlayerName || !selectedEnemyName) {
        alert('Please select both a character and an enemy before starting the game.');
        return;
    }
    selectionScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    initializeGame();
}

   /**
    * Initializes the game by rendering abilities and setting up the UI.
    */
   async function initializeGame() {
    try {
        await loadSaveData(); // Load save data first
        await loadItemsData(); // Load items data next
        await loadPlayerCharacter(); // Then load player character
        await loadEnemyCharacter(); // Finally, load enemy character

        loadInventory(player, 'player');
        loadInventory(enemy, 'enemy');

        renderAbilities(player, 'player');
        renderAbilities(enemy, 'enemy');

        // Ensure abilities start without cooldown
        player.abilities.forEach((ability, index) => {
            ability.onCooldown = false;
            ability.cooldownRemaining = 0;
            if (ability.cooldownTimer) {
                clearTimeout(ability.cooldownTimer);
                ability.cooldownTimer = null;
            }
        });

        enemy.abilities.forEach((ability, index) => {
            ability.onCooldown = false;
            ability.cooldownRemaining = 0;
            if (ability.cooldownTimer) {
                clearTimeout(ability.cooldownTimer);
                ability.cooldownTimer = null;
            }
            // Set initial cooldown for Acid Spit if needed
            if (ability.name === "Acid Spit" && ability.initialCooldown) {
                setEnemyAbilityCooldown(enemy, ability, index, ability.initialCooldown);
            }
        });

        // Focus the game container to capture keyboard events
        gameContainer.focus();

        displayModifiers();
        // Start Autonomous Enemy AI
        initializeEnemyAI();
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to initialize game. Please check the console for more details.');
    }
}


function initializePlayer() {
    player.damageMultiplier = 1; // Default multiplier
    player.isPoisoned = false;    // No debuff initially
    // ... other initialization code ...
}



// Function to load character/enemy JSON
async function loadCharacter(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

async function loadPlayerCharacter() {
    try {
        player = await loadCharacter(`characters/${selectedPlayerName}.json`);
        player.inventory = saveData.player.inventory || [];
        player.modifiers = saveData.player.modifiers || [];
        console.log('Player Inventory Loaded:', player.inventory); // Debugging log
        console.log('Player Modifiers Loaded:', player.modifiers); // Debugging log
        initializePlayer();
        applyModifiers(player);
        displayCharacter(player, 'player');
    } catch (error) {
        console.error('Error loading player character:', error);
        alert('Failed to load player character. Please check the console for more details.');
    }
}
// Function to display modifiers
function displayModifiers() {
    const modifiersDisplay = document.getElementById('modifiers-display');
    modifiersDisplay.innerHTML = ''; // Clear existing modifiers

    const playerModifiers = player.modifiers || [];
    playerModifiers.forEach(modifier => {
        const modifierIcon = document.createElement('div');
        modifierIcon.classList.add('modifier-icon');

        // Add the modifier image
        const img = document.createElement('img');
        img.src = modifier.image; // Use the image path from the JSON
        img.alt = modifier.name;
        img.classList.add('modifier-image');
        modifierIcon.appendChild(img);

        // Add the modifier name as a tooltip (optional)
        const tooltip = document.createElement('div');
        tooltip.classList.add('modifier-tooltip');
        tooltip.textContent = `${modifier.name}: ${modifier.type} +${modifier.value * 100}%`;
        modifierIcon.appendChild(tooltip);

        modifiersDisplay.appendChild(modifierIcon);
    });
}

function applyModifiers(character) {
    character.healingMultiplier = 1; // Default multiplier
    character.modifiers.forEach(modifier => {
        if (modifier.type === 'healing') {
            character.healingMultiplier += modifier.value;
            console.log(`Applied modifier: ${modifier.name}, Healing increased by ${modifier.value * 100}%`);
        }
    });
}

// Function to load and display the selected enemy character
async function loadEnemyCharacter() {
    try {
        enemy = await loadCharacter(`enemies/${selectedEnemyName}.json`);
        enemy.inventory = saveData.enemy.inventory || []; // Ensure inventory is initialized
        displayCharacter(enemy, 'enemy');
    } catch (error) {
        console.error('Error loading enemy character:', error);
        alert('Failed to load enemy character. Please check the console for more details.');
    }
}

// Within the displayCharacter function, ensure there's a container for debuffs
function displayCharacter(character, type) {
    const section = document.getElementById(`${type}-section`);
    const imageElement = document.getElementById(`${type}-image`);
    const hpBarContainer = document.querySelector(`#${type}-section .hp-bar-container`);
    const hpBar = document.getElementById(`${type}-hp`);
    const hpText = document.getElementById(`${type}-hp-text`);
    const abilitiesDiv = document.getElementById(`${type}-abilities`);

    // Set character image
    imageElement.src = character.image;
    imageElement.alt = `${character.name} Image`;

    // Initialize HP bar
    hpBar.style.width = '100%';
    hpText.textContent = `${character.currentHp} / ${character.hp}`;

    // Clear existing abilities
    abilitiesDiv.innerHTML = '';

    // Clear existing debuffs
    const buffsContainer = document.getElementById(`${type}-buffs`);
    buffsContainer.innerHTML = '';

    // Display abilities
    character.abilities.forEach((ability, index) => {
        const abilityButton = document.createElement('button');
        abilityButton.classList.add('ability-button');
        abilityButton.title = ability.name;

        const abilityIcon = document.createElement('img');
        abilityIcon.src = ability.icon;
        abilityIcon.alt = `${ability.name} Icon`;
        abilityIcon.classList.add('ability-icon');
        abilityButton.appendChild(abilityIcon);

        // Add Key Label
        const keyLabels = ['Q', 'W', 'E', 'R'];
        if (index < keyLabels.length) {
            const keyLabel = document.createElement('div');
            keyLabel.classList.add('key-label');
            keyLabel.textContent = keyLabels[index];
            abilityButton.appendChild(keyLabel);
        }

        // Cooldown Overlay
        const cooldownDiv = document.createElement('div');
        cooldownDiv.classList.add('cooldown');
        abilityButton.appendChild(cooldownDiv);

        // Countdown Timer Text
        const cooldownText = document.createElement('div');
        cooldownText.classList.add('cooldown-text');
        cooldownText.textContent = '';
        cooldownDiv.appendChild(cooldownText);

        // Click Event Listener
        abilityButton.addEventListener('click', () => {
            if (abilityButton.disabled) {
                console.log(`${ability.name} is on cooldown or locked.`);
                return;
            }
            if (isCasting) {
                console.log(`Currently casting another ability. Please wait.`);
                return;
            }

            console.log(`${character.name} is preparing to use ${ability.name} with a cast time of ${ability.castTime} seconds.`);

            // Set casting flag
            isCasting = true;

            // Disable all abilities during cast time
            disableAllAbilities(type);

            // Optional: Provide visual feedback for casting (e.g., show cast bar)

            // Start cast time countdown
            setTimeout(() => {
                // Execute the ability after cast time
                executeAbility(character, ability, type);

                // Set Ability on Cooldown with Countdown
                setCooldown(cooldownDiv, ability.maxCooldown, abilityButton, cooldownText);

                // Remove casting flag and re-enable abilities
                isCasting = false;
                enableAvailableAbilities(type);
            }, ability.castTime * 1000); // Convert seconds to milliseconds
        });

        abilitiesDiv.appendChild(abilityButton);

        // Initialize ability buttons as enabled
        abilityButton.disabled = false;
        abilityButton.classList.remove('disabled');
    });
}

// Function to disable all abilities for a character
function disableAllAbilities(type) {
    const abilitiesDiv = document.getElementById(`${type}-abilities`);
    const abilityButtons = abilitiesDiv.querySelectorAll('.ability-button');
    abilityButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
    });
}

/**
 * Disables player abilities that deal damage or deal damage to all enemies.
 */
function disablePlayerDamageAbilities() {
    const abilitiesDiv = document.getElementById('player-abilities');
    const abilityButtons = abilitiesDiv.querySelectorAll('.ability-button');

    abilityButtons.forEach((button, index) => {
        const ability = player.abilities[index];
        if (ability.type === 'damage' || ability.type === 'damage_all') {
            button.disabled = true;
            button.classList.add('disabled');
            button.title = `${ability.name} is disabled while enemy is in stealth.`;
        }
    });
}

/**
 * Enables player abilities that deal damage or deal damage to all enemies if they are not on cooldown.
 */
function enablePlayerDamageAbilities() {
    const abilitiesDiv = document.getElementById('player-abilities');
    const abilityButtons = abilitiesDiv.querySelectorAll('.ability-button');

    abilityButtons.forEach((button, index) => {
        const ability = player.abilities[index];
        if ((ability.type === 'damage' || ability.type === 'damage_all') && !button.classList.contains('disabled')) {
            button.disabled = false;
            button.classList.remove('disabled');
            button.title = ability.name;
        }
    });
}

// Function to enable available abilities (not on cooldown)
function enableAvailableAbilities(type) {
    const abilitiesDiv = document.getElementById(`${type}-abilities`);
    const abilityButtons = abilitiesDiv.querySelectorAll('.ability-button');
    abilityButtons.forEach(button => {
        // Only enable if not on cooldown
        const cooldownDiv = button.querySelector('.cooldown');
        if (!cooldownDiv.classList.contains('active')) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    });
}

// ... [Existing main.js code above] ...

/**
 * Executes the specified ability for a character.
 * @param {Object} character - The character using the ability.
 * @param {Object} ability - The ability being used.
 * @param {string} type - The type of character ('player' or 'enemy').
 */
function executeAbility(character, ability, type) {
    console.log(`Executing Ability: ${ability.name} (${ability.type})`);

    // Play ability sound if implemented
    playAbilitySound();

    // Determine the target based on the character type
    const target = (type === 'player') ? enemy : player;

    switch (ability.type) {
        case 'damage_all':
            damageAllEnemies(character, ability);
            const healAmount = ability.damage * (ability.healPercentage / 100) * (character.healingMultiplier || 1);
            healCharacter(character, healAmount);
            console.log(`${character.name} heals for ${healAmount} HP from ${ability.name}.`);
            break;
        case 'damage_player':
            damagePlayer(character, ability);
            break;
        case 'heal':
            const baseHeal = ability.heal;
            const modifiedHeal = baseHeal * (character.healingMultiplier || 1);
            healCharacter(character, modifiedHeal);
            console.log(`${character.name} uses ${ability.name}, healing for ${modifiedHeal} HP.`);
            break;
        case 'buff':
            applyBuff(character, ability);
            if (ability.effect && ability.effect.heal) {
                const baseBuffHeal = ability.effect.heal;
                const modifiedBuffHeal = baseBuffHeal * (character.healingMultiplier || 1);
                setTimeout(() => {
                    healCharacter(character, modifiedBuffHeal);
                    console.log(`${character.name} heals for ${modifiedBuffHeal} HP from buff ${ability.name}.`);
                }, ability.duration * 1000);
            }
            break;
        case 'damage_debuff':
            damageDebuffEnemy(character, ability);
            break;
        case 'buff_stealth':
            applyStealth(character, ability);
            break;
        case 'poison_debuff':
            applyPoisonDebuff(target, ability);
            break;
        case 'buff_evade':
            applyEvadeBuff(character, ability);
            break;
        case 'buff_damage':
            applyDamageBuff(character, ability);
            break;
        case 'stun_enemy':
            applyStunDebuff(target, ability.debuff);
            break;
        default:
            console.warn(`Unknown ability type: ${ability.type}`);
    }
}

// Example implementations for new ability types
function applyEvadeBuff(character, ability) {
    if (character.isEvading) {
        console.log(`${character.name} is already evading.`);
        return;
    }

    // Apply the evade buff
    character.isEvading = true;
    console.log(`${character.name} is evading for ${ability.buff.duration} seconds.`);

    // Display an evade indicator in the UI
    addEvadeIndicator(character);

    // Add a buff icon
    const buffIcon = document.createElement('div');
    buffIcon.classList.add('buff-icon');
    buffIcon.style.backgroundImage = `url(${ability.icon})`;
    buffIcon.id = `${character.name}-evade-buff`;
    document.getElementById(`${character.type}-buffs`).appendChild(buffIcon);

    // Remove the evade buff after the duration
    setTimeout(() => {
        character.isEvading = false;
        console.log(`${character.name} is no longer evading.`);
        removeEvadeIndicator(character);
        removeBuffIcon(character, 'evade-buff');
    }, ability.buff.duration * 1000); // Convert seconds to milliseconds
}

function removeBuffIcon(character, buffId) {
    const buffIcon = document.getElementById(`${character.name}-${buffId}`);
    if (buffIcon) {
        buffIcon.remove();
    }
}

function applyDamageBuff(character, ability) {
    if (character.damageMultiplier && character.damageMultiplier > 1) {
        console.log(`${character.name} already has a damage buff.`);
        return;
    }

    // Apply the damage buff
    character.damageMultiplier = ability.buff.multiplier;
    console.log(`${character.name}'s damage is increased by ${ability.buff.multiplier * 100}% for ${ability.buff.duration} seconds.`);

    // Add a buff icon
    const buffIcon = document.createElement('div');
    buffIcon.classList.add('buff-icon');
    buffIcon.style.backgroundImage = `url(${ability.icon})`;
    buffIcon.id = `${character.name}-damage-buff`;
    document.getElementById(`${character.type}-buffs`).appendChild(buffIcon);

    // Remove the damage buff after the duration
    setTimeout(() => {
        character.damageMultiplier = 1;
        console.log(`${character.name}'s damage buff has ended.`);
        removeBuffIcon(character, 'damage-buff');
    }, ability.buff.duration * 1000); // Convert seconds to milliseconds
}

function applyStunDebuff(target, debuff) {
    if (target.isStunned) {
        console.log(`${target.name} is already stunned.`);
        return;
    }

    // Apply the stun debuff
    target.isStunned = true;
    console.log(`${target.name} is stunned and cannot use spells for ${debuff.duration} seconds.`);

    // Display the stun overlay in the UI
    addStunOverlay(target);

    // Add a debuff icon
    const debuffIcon = document.createElement('div');
    debuffIcon.classList.add('debuff-icon');
    debuffIcon.style.backgroundImage = `url('images/abilities/stun_icon.png')`; // Ensure you have a stun icon
    debuffIcon.title = `Stunned for ${debuff.duration} seconds`;
    document.getElementById(`${target.type}-buffs`).appendChild(debuffIcon);

    // Disable target's ability buttons
    disablePlayerAbilities(target);

    // Remove the stun after the duration
    setTimeout(() => {
        target.isStunned = false;
        console.log(`${target.name} is no longer stunned and can use spells again.`);
        removeStunOverlay(target);
        debuffIcon.remove(); // Remove the debuff icon
        enablePlayerAbilities(target);
    }, debuff.duration * 1000); // Convert seconds to milliseconds
}

// ... [Rest of main.js code below] ...
/**
 * Applies stealth to the enemy.
 * @param {Object} character - The character using the ability (Reptile).
 * @param {Object} ability - The stealth ability details.
 */
function applyStealth(character, ability) {
    if (character.isStealthed) {
        console.log(`${character.name} is already in stealth mode.`);
        return;
    }

    // Apply stealth state
    character.isStealthed = true;
    console.log(`${character.name} has entered stealth mode for ${ability.duration || 7} seconds.`);

    // Update UI to reflect stealth (80% transparency)
    const type = typeCharacterMap(character);
    const imageElement = document.getElementById(`${type}-image`);
    imageElement.classList.add('stealthed');

    // Show Stealth Indicator
    const stealthIndicator = document.getElementById(`${type}-stealth-indicator`);
    if (stealthIndicator) {
        stealthIndicator.style.display = 'block';
    }

    // Prevent player from dealing damage or using damage/damage all abilities on Reptile
    disablePlayerDamageAbilities();

    // Schedule removal of stealth after duration
    const stealthDuration = ability.duration || 7; // Default to 7 seconds if not specified
    setTimeout(() => {
        removeStealth(character);
    }, stealthDuration * 1000);
}

function removeStealth(character) {
    if (!character.isStealthed) {
        console.log(`${character.name} is not in stealth mode.`);
        return;
    }

    // Remove stealth state
    character.isStealthed = false;
    console.log(`${character.name} has exited stealth mode.`);

    // Update UI to remove stealth effect
    const type = typeCharacterMap(character);
    const imageElement = document.getElementById(`${type}-image`);
    imageElement.classList.remove('stealthed');

    // Hide Stealth Indicator
    const stealthIndicator = document.getElementById(`${type}-stealth-indicator`);
    if (stealthIndicator) {
        stealthIndicator.style.display = 'none';
    }

    // Re-enable player damage abilities
    enablePlayerDamageAbilities();
}

// Helper Function to Play Ability Sound (Optional)
function playAbilitySound() {
    const abilitySound = document.getElementById('ability-sound');
    if (abilitySound) {
        abilitySound.currentTime = 0;
        abilitySound.play();
    }
}

// ... [Existing main.js code above] ...


/**
 * Deals damage directly to the player.
 * @param {Object} character - The character using the ability (enemy).
 * @param {Object} ability - The ability being used.
 */
function damagePlayer(character, ability) {
    const damage = ability.damage * (character.damageMultiplier || 1);
    applyDamage(player, damage, character.name);
}

/**
 * Displays a damage or heal indicator on the specified entity.
 * @param {string} entity - 'player' or 'enemy'
 * @param {number} amount - The amount of damage or healing.
 * @param {string} type - 'damage' or 'heal'
 */
function showIndicator(entity, amount, type) {
    const section = document.getElementById(`${entity}-section`);
    if (!section) {
        console.error(`Missing section element for "${entity}". Cannot show indicator.`);
        return;
    }

    const indicator = document.createElement('div');
    indicator.classList.add(type === 'damage' ? 'damage-indicator' : 'heal-indicator');
    indicator.textContent = `${type === 'damage' ? '-' : '+'}${amount}`;
    section.appendChild(indicator);

    // Remove indicator after animation completes
    setTimeout(() => {
        indicator.remove();
    }, 1000); // Duration should match the CSS animation duration
}

// Ensure other damage functions account for damage multiplier similarly
// ... [Rest of main.js code below] ...

// Locate the damageAllEnemies function and replace it with the following:

function damageAllEnemies(character, ability) {
    // Assuming you have a list of enemies
    const enemies = [enemy]; // Replace with actual list of enemies if applicable
    enemies.forEach(target => {
        applyDamage(target, ability.damage, character.name);
    });
}

/**
 * Retrieves the type string ('player' or 'enemy') from a character object.
 * @param {Object} character - The character object.
 * @returns {string} - 'player' or 'enemy'.
 */
function getCharacterType(character) {
    if (character.type === 'player') return 'player';
    if (character.type === 'enemy') return 'enemy';
    console.error(`Unknown character type: ${character.type}`);
    return '';
}

    /**
     * Applies healing to the specified character.
     * @param {Object} character - The character to heal.
     * @param {number} healAmount - The amount of HP to heal.
     */
// Ensure only one definition of healCharacter exists
function healCharacter(character, healAmount) {
    if (typeof healAmount !== 'number' || isNaN(healAmount)) {
        console.error(`Invalid healAmount: ${healAmount}`);
        return;
    }
    const newHp = Math.min(character.currentHp + healAmount, character.hp);
    const actualHeal = newHp - character.currentHp;
    character.currentHp = newHp;
    updateHPBar(character.type, character.currentHp);
    console.log(`${character.name} heals for ${actualHeal} HP. Current HP: ${character.currentHp}/${character.hp}`);

    // Trigger Flash Green Animation on HP Bar
    triggerFlash(character.type, 'green');

    // Show Heal Indicator
    showIndicator(character.type, actualHeal, 'heal');
}

/**
 * Deals damage directly to the player.
 * @param {Object} character - The character using the ability (enemy).
 * @param {number} damageAmount - The amount of damage to deal.
 */
// Ensure only one definition of damageCharacter exists
function damageCharacter(character, damageAmount) {
    if (typeof damageAmount !== 'number' || isNaN(damageAmount)) {
        console.error(`Invalid damageAmount: ${damageAmount}`);
        return;
    }

    if (damageAmount > 0) {
        character.currentHp = Math.max(character.currentHp - damageAmount, 0);
        console.log(`${character.name} takes ${damageAmount} damage. Current HP: ${character.currentHp}/${character.hp}`);
        updateHPBar(character.type, character.currentHp);

        // Trigger Flash Red Animation on HP Bar
        triggerFlash(character.type, 'red');

        // Show Damage Indicator
        showIndicator(character.type, damageAmount, 'damage');

        // Check if character is defeated
        if (character.currentHp <= 0) {
            console.log(`${character.name} has been defeated!`);
            endGame(character.type === 'player' ? 'loss' : 'win'); // Assuming endGame handles 'loss' and 'win'
        }
    } else {
        console.log(`${character.name} takes no damage.`);
    }
}

/**
 * Function to map character object to type string
 * @param {Object} character - The character object.
 * @returns {string} - 'player' or 'enemy'.
 */
function typeCharacterMap(character) {
    if (character.type === 'player') {
        return 'player';
    } else if (character.type === 'enemy') {
        return 'enemy';
    } else {
        console.error(`Unknown character type: ${character.type}`);
        return null;
    }
}
/**
 * Triggers a flash effect on the character's HP bar.
 * @param {string} type - 'player' or 'enemy'.
 * @param {string} color - The color to flash (e.g., 'red', 'green').
 */
function triggerFlash(type, color) {
    const hpBar = document.querySelector(`#${type}-hp`);
    if (!hpBar) {
        console.error(`Unknown entity type for flash: ${type}`);
        return;
    }
    hpBar.classList.add('flash', color);
    setTimeout(() => {
        hpBar.classList.remove('flash', color);
    }, 500); // Duration of flash effect in milliseconds
}

/**
 * Shows a damage or heal indicator above the character.
 * @param {string} type - 'player' or 'enemy'.
 * @param {number|string} amount - The amount of damage or healing.
 * @param {string} indicatorType - 'damage' or 'heal'.
 */
function showIndicator(type, amount, indicatorType) {
    const imageContainer = document.querySelector(`#${type}-section .character-image-container`);
    if (!imageContainer) {
        console.error(`Unknown entity type for indicator: ${type}`);
        return;
    }

    const indicator = document.createElement('div');
    indicator.classList.add(`${indicatorType}-indicator`);
    indicator.textContent = `${amount}`;
    
    // Position the indicator at a random position within the image container
    const posX = Math.random() * 50 + '%';
    const posY = Math.random() * 30 + '%';
    indicator.style.left = posX;
    indicator.style.top = posY;

    imageContainer.appendChild(indicator);

    // Remove the indicator after animation
    indicator.addEventListener('animationend', () => {
        indicator.remove();
    });
}

// Locate the applyBuff function and update it as follows:

function applyBuff(character, ability) {
    const buffContainer = document.getElementById(`${typeCharacterMap(character)}-buffs`);
    if (!buffContainer) {
        console.error(`Buff container not found for ${typeCharacterMap(character)}.`);
        return;
    }

    // Create Buff Icon
    const buffIcon = document.createElement('div');
    buffIcon.classList.add('buff-icon');

    // Ability Icon Image
    const iconImg = document.createElement('img');
    iconImg.src = ability.icon;
    iconImg.alt = ability.name;
    iconImg.classList.add('ability-icon'); // Reusing existing class for consistency
    iconImg.style.width = '100%';
    iconImg.style.height = '100%';
    buffIcon.appendChild(iconImg);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.classList.add('buff-tooltip');
    tooltip.textContent = ability.description;
    buffIcon.appendChild(tooltip);

    buffContainer.appendChild(buffIcon);

    // Start Buff Countdown
    setTimeout(() => {
        // Defensive Check: Ensure ability.effect.heal exists and is a number
        if (ability.effect && typeof ability.effect.heal === 'number') {
            healCharacter(character, ability.effect.heal);
            console.log(`Buff expired: ${character.name} heals for ${ability.effect.heal} HP.`);
        } else {
            console.error(`Invalid or missing 'heal' property for ability: ${ability.name}`);
        }

        // Remove Buff Icon
        buffIcon.remove();
    }, ability.duration * 1000); // Convert seconds to milliseconds
}

    /**
     * Updates the HP bar and HP text for the specified entity.
     * @param {string} entity - 'player' or 'enemy'
     * @param {number} currentHp - The current HP of the entity.
     */
    function updateHPBar(entity, currentHp) {
        let hpBar, hpText;
        if (entity === 'player') {
            hpBar = document.getElementById('player-hp');
            hpText = document.getElementById('player-hp-text');
        } else if (entity === 'enemy') {
            hpBar = document.getElementById('enemy-hp');
            hpText = document.getElementById('enemy-hp-text');
        } else {
            console.error(`Unknown entity type: ${entity}`);
            return;
        }

        const character = entity === 'player' ? player : enemy;
        const hpPercentage = Math.max((currentHp / character.hp) * 100, 0);
        hpBar.style.width = `${hpPercentage}%`;
        hpText.textContent = `${currentHp} / ${character.hp}`;
    }

// Function to set cooldown with countdown
function setCooldown(cooldownDiv, maxCooldown, abilityButton, cooldownText) {
    // Prevent multiple cooldowns
    if (cooldownDiv.classList.contains('active')) return;

    // Add active class to trigger animation
    cooldownDiv.classList.add('active');
    cooldownDiv.classList.add('cooldown-active'); // Custom class to manage enabling

    // Start cooldown animation
    setTimeout(() => {
        cooldownDiv.style.width = '100%';
    }, 100); // Delay to allow CSS transition to start

    // Initialize countdown
    let remaining = maxCooldown;
    cooldownText.textContent = remaining;
    const countdownInterval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            cooldownText.textContent = '';
        } else {
            cooldownText.textContent = remaining;
        }
    }, 1000);

    // Disable the ability button until cooldown finishes
    abilityButton.disabled = true;
    abilityButton.classList.add('disabled');

    // After cooldown, reset the cooldown overlay and enable the button
    setTimeout(() => {
        cooldownDiv.classList.remove('active');
        cooldownDiv.classList.remove('cooldown-active');
        cooldownDiv.style.width = '0%';
        abilityButton.disabled = false;
        abilityButton.classList.remove('disabled');
        clearInterval(countdownInterval);
        cooldownText.textContent = '';
    }, maxCooldown * 1000);
}

// Optional: Function to handle end of turn (for buffs/debuffs duration management)
// This requires a turn-based system to be implemented
function endTurn() {
    // Placeholder for end of turn logic
    console.log('End of turn.');
    // Handle buff/debuff duration decrement and removal
    // Implement turn-based mechanics here
}

// Key to Ability Index Mapping
const abilityKeyMap = {
    'q': 0, // Ability1
    'w': 1, // Ability2
    'e': 2, // Ability3
    'r': 3  // Ability4
};

// Function to handle keyboard shortcuts with visual feedback
function handleKeyboardShortcuts(event) {
    const pressedKey = event.key.toLowerCase();
    if (abilityKeyMap.hasOwnProperty(pressedKey)) {
        const abilityIndex = abilityKeyMap[pressedKey];
        
        // Assuming 'player' is the character object for the player
        const ability = player.abilities[abilityIndex];
        
        if (!ability) {
            console.warn(`No ability assigned to key '${pressedKey.toUpperCase()}'`);
            return;
        }
        
        // Find the corresponding ability button
        const abilityButton = document.querySelector(`#player-abilities .ability-button:nth-child(${abilityIndex + 1})`);
        
        if (!abilityButton) {
            console.warn(`Ability button for key '${pressedKey.toUpperCase()}' not found.`);
            return;
        }
        
        // Check if ability is on cooldown or locked
        if (abilityButton.disabled) {
            console.log(`${ability.name} is on cooldown or locked.`);
            return;
        }
        
        // Simulate button click
        abilityButton.click();
        
        // Add a brief visual effect to indicate activation via keyboard
        abilityButton.classList.add('keyboard-activated');
        setTimeout(() => {
            abilityButton.classList.remove('keyboard-activated');
        }, 200);
    }
}

/**
 * Adds a stun overlay to the character's image to indicate they are stunned.
 * @param {Object} target - The character to add the overlay to.
 */
function addStunOverlay(target) {
    const type = typeCharacterMap(target);
    const imageElement = document.getElementById(`${type}-image`);

    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('stunned-overlay');
    overlay.id = `${type}-stunned-overlay`;

    // Append the overlay to the character image container
    imageElement.parentElement.appendChild(overlay);
}

/**
 * Removes the stun overlay from the character's image.
 * @param {Object} target - The character to remove the overlay from.
 */
function removeStunOverlay(target) {
    const type = typeCharacterMap(target);
    const overlay = document.getElementById(`${type}-stunned-overlay`);
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Removes a specified indicator.
 * @param {string} indicatorType - The type of indicator ('status', 'damage', 'heal').
 * @param {string} indicatorId - The ID of the indicator to remove.
 */
function removeIndicator(indicatorType, indicatorId) {
    const indicator = document.getElementById(indicatorId);
    if (indicator) {
        indicator.remove();
    } else {
        console.error(`Indicator with ID "${indicatorId}" not found.`);
    }
}


// Attach the keydown event listener
window.addEventListener('keydown', handleKeyboardShortcuts);

/**
 * Applies a debuff to the target.
 * @param {Object} target - The character to apply the debuff to.
 * @param {Object} debuff - The debuff details from the ability.
 */
function applyDebuff(target, debuff) {
    console.log(`${target.name} is affected by ${debuff.type} debuff.`);

    const buffsContainer = document.getElementById(`${target.type}-buffs`);
    if (!buffsContainer) {
        console.error(`Buffs container for "${target.type}" not found.`);
        return;
    }

    // Create debuff icon element
    const debuffIcon = document.createElement('div');
    debuffIcon.classList.add('buff-icon', 'debuff-icon');
    debuffIcon.style.backgroundImage = `url('${debuff.icon}')`;

    // Create tooltip for debuff
    const tooltip = document.createElement('div');
    tooltip.classList.add('buff-tooltip', 'debuff-tooltip');
    tooltip.textContent = debuff.description;
    debuffIcon.appendChild(tooltip);

    buffsContainer.appendChild(debuffIcon);

    // Apply specific debuff effects
    switch (debuff.type) {
        case 'stun':
            applyStunEffect(target, debuff.duration);
            break;
        case 'acid_debuff':
            applyAcidDebuff(target, debuff);
            break;
        // Add more cases for different debuff types as needed
        default:
            console.warn(`Debuff type "${debuff.type}" not recognized.`);
    }

    // Remove debuff icon after duration
    setTimeout(() => {
        debuffIcon.remove();
        console.log(`${target.name} is no longer affected by "${debuff.type}" debuff.`);
    }, debuff.duration * 1000);
}


   /**
    * Loads the inventory for the specified character and renders it in the UI.
    * @param {Object} character - The character object containing inventory data.
    * @param {string} type - The type of character ('player' or 'enemy').
    */
   function loadInventory(character, type) {
    const inventoryContainer = document.getElementById(`${type}-inventory`);
    const inventorySlots = inventoryContainer.querySelectorAll('.inventory-slot');

    for (let i = 0; i < inventorySlots.length; i++) {
        const slot = inventorySlots[i];
        const itemName = saveData[type].inventory[i];

        if (itemName) {
            const itemDetails = itemsData.items.find(item => item.name === itemName);
            if (itemDetails) {
                slot.innerHTML = ''; // Clear any existing content

                const img = document.createElement('img');
                img.src = itemDetails.icon;
                img.alt = itemDetails.name;
                img.classList.add('item-icon');
                slot.appendChild(img);

                // Remove any text or number display
                slot.classList.remove('empty');
                slot.disabled = false;

                const newSlot = slot.cloneNode(true);
                slot.parentNode.replaceChild(newSlot, slot);

                newSlot.addEventListener('click', () => {
                    useItem(character, i);
                });
            } else {
                console.warn(`Item "${itemName}" not found in items.json.`);
                displayEmptySlot(slot, i);
            }
        } else {
            displayEmptySlot(slot, i);
        }
    }
}

   /**
    * Handles the usage of an inventory item.
    * @param {Object} character - The character using the item.
    * @param {number} slotIndex - The index of the inventory slot.
    */
   function useItem(character, slotIndex) {
    
    if (!character || !character.inventory) {
        console.error('Invalid character or inventory.');
        return;
    }

    console.log('Attempting to use item from inventory:', character.inventory); // Debugging log

    const itemName = character.inventory[slotIndex];
    
    if (!itemName) {
        console.log('No item in this slot to use.');
        return;
    }

    // Find item details from itemsData
    const item = itemsData.items.find(item => item.name === itemName);
    if (!item) {
        console.log(`Item "${itemName}" not found.`);
        return;
    }

    console.log(`${character.name} used ${item.name}!`);

    // Implement item effects based on itemType
    switch (item.effect.itemType) {
        case 'heal':
            healCharacter(character, item.effect.value); // Apply heal to the character
            playHealSound();
            break;
        // Add more cases for different effect types as needed
        default:    
            console.log(`Effect type "${item.effect.itemType}" not implemented.`);
    }

    // Remove the used item from the inventory
    character.inventory.splice(slotIndex, 1);
    console.log('Updated Inventory:', character.inventory); // Debugging log

    // Update the saveData to reflect the inventory change
    if (character.type === 'player') {
        saveData.player.inventory = character.inventory;
    } else if (character.type === 'enemy') {
        saveData.enemy.inventory = character.inventory;
    }

    // Persist the updated save data
    saveGameData();

    // Update the inventory UI
    updateInventoryUI(character, slotIndex);
}

/**
 * Plays the heal sound effect.
 */
function playHealSound() {
    const healSound = document.getElementById('heal-sound');
    if (healSound) {
        healSound.currentTime = 0;
        healSound.play();
    }
}

/**
* Updates the inventory UI after an item has been used.
* @param {Object} character - The character whose inventory is updated.
* @param {number} slotIndex - The index of the inventory slot to update.
*/
function updateInventoryUI(character, slotIndex) {
   const type = typeCharacterMap(character);
   if (!type) {
       console.error('Character type not recognized.');
       return;
   }

   const inventoryContainer = document.getElementById(`${type}-inventory`);
   const inventorySlots = inventoryContainer.querySelectorAll('.inventory-slot');
   const slot = inventorySlots[slotIndex];

   const itemName = saveData[type].inventory[slotIndex];

   if (itemName) {
       const itemDetails = itemsData.items.find(item => item.name === itemName);
       if (itemDetails) {
           // Set the slot to display the item's icon
           slot.innerHTML = `<img src="${itemDetails.icon}" alt="${itemDetails.name}" class="item-icon">`;

           // Enable the slot button
           slot.classList.remove('empty');
           slot.disabled = false;

           // Remove existing event listeners by cloning the node
           const newSlot = slot.cloneNode(true);
           slot.parentNode.replaceChild(newSlot, slot);

           // Add click event listener to use the item
           newSlot.addEventListener('click', () => {
               useItem(character, slotIndex);
           });
       } else {
           console.warn(`Item "${itemName}" not found in items.json.`);
           displayEmptySlot(slot, slotIndex);
       }
   } else {
       // If no item is present, display the slot as empty
       displayEmptySlot(slot, slotIndex);
   }
}

/**
 * Displays an empty inventory slot.
 * @param {HTMLElement} slot - The inventory slot element.
 * @param {number} index - The slot index.
 */
function displayEmptySlot(slot, index) {
    slot.innerHTML = `${index + 1}`;
    slot.classList.remove('tooltip');
    slot.classList.add('empty');
    slot.disabled = true;

    // Remove existing event listeners by cloning the node
    const newSlot = slot.cloneNode(true);
    slot.parentNode.replaceChild(newSlot, slot);
}

// Inventory Data
let allItems = {};

// Global variables to store save and items data
let saveData = {};
let itemsData = {};

/**
 * Loads the save data from save.json or localStorage.
 */
/**
 * Loads the save data from save.json first, then localStorage if save.json is unavailable.
 */
async function loadSaveData() {
    try {
        // Attempt to fetch save.json
        const response = await fetch('save.json');
        if (!response.ok) {
            throw new Error(`Failed to load save.json: ${response.statusText}`);
        }
        saveData = await response.json();
        console.log('Save data loaded from save.json:', saveData);

        // Save to localStorage for persistence
        saveGameData();
    } catch (error) {
        console.warn('Failed to load save.json:', error);
        console.log('Attempting to load save data from localStorage.');

        // Fallback to localStorage
        const savedData = localStorage.getItem('saveData');
        if (savedData) {
            saveData = JSON.parse(savedData);
            console.log('Save data loaded from localStorage:', saveData);
        } else {
            // Initialize saveData if neither save.json nor localStorage has data
            saveData = {
                player: { inventory: [] },
                enemy: { inventory: [] }
            };
            console.warn('Initialized empty saveData.');
            saveGameData();
        }
    }

    // Ensure that both player and enemy inventories exist
    if (!saveData.player) {
        saveData.player = { inventory: [] };
        console.warn('Initialized player inventory in saveData.');
    }
    if (!saveData.enemy) {
        saveData.enemy = { inventory: [] };
        console.warn('Initialized enemy inventory in saveData.');
    }

    // Log inventory contents for debugging
    console.log('Player Inventory:', saveData.player.inventory);
    console.log('Enemy Inventory:', saveData.enemy.inventory);
}

/**
 * Loads the items data from items.json.
 */
async function loadItemsData() {
    try {
        const response = await fetch('items.json');
        if (!response.ok) {
            throw new Error(`Failed to load items data: ${response.statusText}`);
        }
        itemsData = await response.json();
        console.log('Items data loaded:', itemsData);
    } catch (error) {
        console.error('Error loading items data:', error);
        alert('Failed to load items data. Please check the console for more details.');
    }
}

/**
 * Saves the current game data to localStorage.
 */
/**
 * Saves the current game data to localStorage.
 */
function saveGameData() {
    try {
        const dataToSave = JSON.stringify(saveData);
        localStorage.setItem('saveData', dataToSave);
        console.log('Game data saved to localStorage.');
    } catch (error) {
        console.error('Error saving game data:', error);
        alert('Failed to save game data. Please check the console for more details.');
    }
}

/**
 * Initializes the Autonomous Enemy AI.
 * The enemy will use available abilities as soon as they are off cooldown.
 */
function initializeEnemyAI() {
    // Start the ability cycle
    setInterval(checkAndUseAbilities, 500); // Check every 0.5 seconds
}

/**
 * Checks and uses available abilities for the enemy.
 */
function checkAndUseAbilities() {
    // Check if the ultimate ability (4th ability) is available
    const ultimateIndex = 3; // Assuming the 4th ability is at index 3
    const ultimateAbility = enemy.abilities[ultimateIndex];

    if (!ultimateAbility.onCooldown) {
        console.log(`${enemy.name} uses ${ultimateAbility.name}!`);
        executeAbility(enemy, ultimateAbility, enemy.type);
        setEnemyAbilityCooldown(enemy, ultimateAbility, ultimateIndex);
        return; // Exit after using the ultimate ability
    }

    // Check other abilities (1st, 2nd, and 3rd)
    for (let i = 0; i < enemy.abilities.length - 1; i++) {
        const ability = enemy.abilities[i];
        if (!ability.onCooldown) {
            console.log(`${enemy.name} uses ${ability.name}!`);
            executeAbility(enemy, ability, enemy.type);
            setEnemyAbilityCooldown(enemy, ability, i);
            break; // Use only one ability at a time
        }
    }
}

/**
 * Sets the cooldown for a used ability.
 * @param {Object} character - The character using the ability.
 * @param {Object} ability - The ability being used.
 * @param {number} index - The index of the ability.
 */
function setAbilityCooldown(character, ability, index) {
    ability.onCooldown = true;
    ability.remainingCooldown = ability.cooldown; // Initialize remaining cooldown
    updateAbilityUI(character, index); // Update UI when cooldown starts

    // Start the countdown interval
    ability.cooldownInterval = setInterval(() => {
        ability.remainingCooldown -= 1;
        updateAbilityUI(character, index);

        if (ability.remainingCooldown <= 0) {
            clearInterval(ability.cooldownInterval);
            ability.onCooldown = false;
            ability.cooldownInterval = null;
            console.log(`${character.name}'s ability "${ability.name}" is ready to use again.`);
            updateAbilityUI(character, index); // Final UI update when cooldown ends
        }
    }, 1000); // Update every second
}

/**
 * Updates the UI for a character's ability to reflect cooldown status.
 * @param {Object} character - The character whose ability UI is being updated.
 * @param {number} index - The index of the ability.
 */
function updateAbilityUI(character, index) {
    const abilitiesDiv = document.getElementById(`${character.type}-abilities`);
    const abilityButton = abilitiesDiv.querySelector(`.ability-button[data-index="${index}"]`);
    const cooldownDiv = abilityButton.querySelector('.cooldown');
    const cooldownText = abilityButton.querySelector('.cooldown-text');

    if (character.abilities[index].onCooldown) {
        const percentage = (character.abilities[index].remainingCooldown / character.abilities[index].cooldown) * 100;
        cooldownDiv.style.width = `${percentage}%`;
        cooldownText.textContent = character.abilities[index].remainingCooldown;
    } else {
        cooldownDiv.style.width = '0%';
        cooldownText.textContent = '';
    }
}

/**
 * Helper Function to Get Ability Index by Name
 * @param {string} abilityName - The name of the ability.
 * @returns {number} - The index of the ability in the abilities array.
 */
function selectedAbilityIndex(abilityName) {
    return enemy.abilities.findIndex(ability => ability.name === abilityName);
}


/**
 * Applies a poison debuff to the player.
 * @param {Object} character - The character using the ability (Reptile).
 * @param {Object} ability - The poison ability details.
 */
function applyPoisonDebuff(character, ability) {
    if (player.isPoisoned) {
        console.log(`Player is already poisoned.`);
        return;
    }

    // Apply poison state
    player.isPoisoned = true;
    player.damageMultiplier = ability.damageMultiplier; // Set to 2 for double damage
    console.log(`Player has been poisoned for ${ability.duration} seconds.`);

    // Update UI to reflect poison (show poison indicator)
    const poisonIndicator = document.getElementById('player-poison-indicator');
    if (poisonIndicator) {
        poisonIndicator.style.display = 'block';
    }

    // Add 'poisoned' class to player's image for flashing effect
    const playerImage = document.getElementById('player-image');
    if (playerImage) {
        playerImage.classList.add('poisoned');
    }

    // Prevent player from dealing damage or using damage/damage all abilities on Reptile
    disablePlayerDamageAbilities();

    // Remove poison after duration
    setTimeout(() => {
        player.isPoisoned = false;
        player.damageMultiplier = 1; // Reset damage multiplier
        console.log(`Player's poison debuff has expired.`);

        // Update UI to remove poison indicator
        if (poisonIndicator) {
            poisonIndicator.style.display = 'none';
        }

        // Remove 'poisoned' class from player's image
        if (playerImage) {
            playerImage.classList.remove('poisoned');
        }

        // Re-enable player damage abilities
        enablePlayerDamageAbilities();
    }, ability.duration * 1000); // Convert seconds to milliseconds
}

/**
 * Removes the poison debuff from the player.
 */
function removePoisonDebuff() {
    if (!player.isPoisoned) {
        console.log(`Player is not poisoned.`);
        return;
    }

    // Remove poison state
    player.isPoisoned = false;
    player.damageMultiplier = 1; // Reset damage multiplier
    console.log(`Player's poison debuff has been manually removed.`);

    // Update UI to remove poison indicator
    const poisonIndicator = document.getElementById('player-poison-indicator');
    if (poisonIndicator) {
        poisonIndicator.style.display = 'none';
    }

    // Remove 'poisoned' class from player's image
    const playerImage = document.getElementById('player-image');
    if (playerImage) {
        playerImage.classList.remove('poisoned');
    }

    // Re-enable player damage abilities
    enablePlayerDamageAbilities();
}

   /**
    * Renders abilities for a character.
    * @param {Object} character - The character whose abilities are being rendered.
    */
   function renderAbilities(character) {
    const abilitiesDiv = document.getElementById(`${character.type}-abilities`);
    abilitiesDiv.innerHTML = ''; // Clear existing abilities

    character.abilities.forEach((ability, index) => {
        const abilityButton = document.createElement('button');
        abilityButton.classList.add('ability-button');
        abilityButton.setAttribute('data-index', index);

        // Ability Icon
        const iconImg = document.createElement('img');
        iconImg.src = ability.icon;
        iconImg.alt = ability.name;
        iconImg.classList.add('ability-icon');
        abilityButton.appendChild(iconImg);

        // Cooldown Overlay
        const cooldownDiv = document.createElement('div');
        cooldownDiv.classList.add('cooldown');
        abilityButton.appendChild(cooldownDiv);

        // Cooldown Text
        const cooldownText = document.createElement('span');
        cooldownText.classList.add('cooldown-text');
        cooldownDiv.appendChild(cooldownText);

        // Ability Description Tooltip
        const tooltip = document.createElement('div');
        tooltip.classList.add('ability-tooltip');
        tooltip.textContent = ability.description;
        abilityButton.appendChild(tooltip);

        // Display the keyboard shortcut key
        const keyLabel = document.createElement('div');
        keyLabel.classList.add('key-label');
        keyLabel.textContent = getAbilityKeyLabel(index);
        abilityButton.appendChild(keyLabel);

        if (character.type === 'enemy') {
            // Disable enemy abilities from being clickable
            abilityButton.disabled = true; // Disable the button
            abilityButton.classList.add('disabled'); // Optionally add a disabled style
        } else {
            // Add event listener for player abilities
            abilityButton.addEventListener('click', () => {
                executeAbility(player, ability, 'player');
                setPlayerAbilityCooldown(player, ability, index);
                // Re-render abilities to update cooldown UI
                renderAbilities(player);
            });

            // If ability is on cooldown, set the cooldown UI
            if (ability.onCooldown) {
                setCooldown(cooldownDiv, ability.cooldownRemaining || ability.cooldown, abilityButton, cooldownText, ability);
            }
        }

        abilitiesDiv.appendChild(abilityButton);
    });
}

/**
 * Returns the keyboard key label for the given ability index.
 * @param {number} index - The index of the ability.
 * @returns {string} - The key label.
 */
function getAbilityKeyLabel(index) {
    const keyMap = ['Q', 'W', 'E', 'R']; // Assuming these are the keys for abilities 1-4
    return keyMap[index] || '';
}

/**
 * Removes the stealth effect from the target.
 * @param {Object} target - The character to remove stealth from.
 */
function removeStealth(target) {
    target.isStealthed = false;
    console.log(`${target.name} is no longer in stealth.`);

    // Update UI to remove stealth indicator
    const stealthIndicator = document.getElementById(`${target.type}-stealth-indicator`);
    if (stealthIndicator) {
        stealthIndicator.style.display = 'none';
    }

    // Remove 'stealthed' class from the target's image
    const targetImage = document.getElementById(`${target.type}-image`);
    if (targetImage) {
        targetImage.classList.remove('stealthed');
    }
}

// Function to set cooldown for player abilities
function setPlayerAbilityCooldown(player, ability, index, initialCooldown = null) {
    const cooldownTime = initialCooldown !== null ? initialCooldown : ability.cooldown;
    ability.onCooldown = true;
    ability.cooldownRemaining = cooldownTime;

    const cooldownDiv = document.querySelector(`#player-abilities .ability-button[data-index="${index}"] .cooldown`);
    const cooldownText = cooldownDiv.querySelector('.cooldown-text');

    cooldownDiv.style.width = '100%';
    cooldownText.textContent = cooldownTime;

    const interval = setInterval(() => {
        ability.cooldownRemaining -= 1;
        cooldownText.textContent = ability.cooldownRemaining;

        if (ability.cooldownRemaining <= 0) {
            clearInterval(interval);
            ability.onCooldown = false;
            cooldownDiv.style.width = '0%';
            cooldownText.textContent = '';
        }
    }, 1000);
}

// Function to set cooldown for enemy abilities
function setEnemyAbilityCooldown(enemy, ability, index, initialCooldown = null) {
    const cooldownTime = initialCooldown !== null ? initialCooldown : ability.cooldown;
    ability.onCooldown = true;
    ability.cooldownRemaining = cooldownTime;

    const cooldownDiv = document.querySelector(`#enemy-abilities .ability-button[data-index="${index}"] .cooldown`);
    const cooldownText = cooldownDiv.querySelector('.cooldown-text');

    cooldownDiv.style.width = '100%';
    cooldownText.textContent = cooldownTime;

    const interval = setInterval(() => {
        ability.cooldownRemaining -= 1;
        cooldownText.textContent = ability.cooldownRemaining;

        if (ability.cooldownRemaining <= 0) {
            clearInterval(interval);
            ability.onCooldown = false;
            cooldownDiv.style.width = '0%';
            cooldownText.textContent = '';
        }
    }, 1000);
}

function damageDebuffEnemy(character, ability) {
    // Apply initial damage
    applyDamage(enemy, ability.damage, character.name);

    // Apply debuff damage over time if applicable
    if (ability.debuff && ability.debuff.damagePerSecond) {
        const interval = setInterval(() => {
            applyDamage(enemy, ability.debuff.damagePerSecond, character.name);
        }, 1000);

        setTimeout(() => {
            clearInterval(interval);
        }, ability.debuff.duration * 1000);
    }
}

function updateHpDisplay(character) {
    const hpBar = document.getElementById(`${character.type}-hp`);
    const hpText = document.getElementById(`${character.type}-hp-text`);

    // Calculate the percentage of HP remaining
    const hpPercentage = (character.currentHp / character.hp) * 100;

    // Update the width of the HP bar
    hpBar.style.width = `${hpPercentage}%`;

    // Update the HP text display
    hpText.textContent = `${character.currentHp} / ${character.hp}`;

    // Ensure HP doesn't drop below zero
    if (character.currentHp < 0) {
        character.currentHp = 0;
    }
}

// Example of setting up an event listener for inventory slots
document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
    slot.addEventListener('click', () => {
        // Determine if the slot belongs to the player or enemy
        const inventorySection = slot.closest('.inventory-section');
        const character = inventorySection.id.includes('player') ? player : enemy;

        // Call useItem with the correct character and slot index
        useItem(character, index);
    });
});

function addEvadeIndicator(character) {
    const evadeIndicator = document.createElement('div');
    evadeIndicator.classList.add('evade-indicator');
    evadeIndicator.textContent = 'Evading';
    document.getElementById(`${character.type}-section`).appendChild(evadeIndicator);
}

function removeEvadeIndicator(character) {
    const evadeIndicator = document.querySelector(`#${character.type}-section .evade-indicator`);
    if (evadeIndicator) {
        evadeIndicator.remove();
    }
}

function damageEnemy(character, ability) {
    const damage = ability.damage * (character.damageMultiplier || 1);
    applyDamage(enemy, damage, character.name);
}

function applyDamage(target, damage, sourceName) {
    if (target.isEvading) {
        console.log(`${target.name} evaded the attack from ${sourceName}.`);
        return;
    }
    target.currentHp -= damage;
    updateHpDisplay(target);
    console.log(`${sourceName} deals ${damage} damage to ${target.name}. Current HP: ${target.currentHp}`);
}

function disablePlayerAbilities(target) {
    if (target.type === 'player') {
        const abilityButtons = document.querySelectorAll(`#${target.type}-abilities .ability-button`);
        abilityButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }
}

function enablePlayerAbilities(target) {
    if (target.type === 'player') {
        const abilityButtons = document.querySelectorAll(`#${target.type}-abilities .ability-button`);
        abilityButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
    }
}

function applyDamageAndDebuff(target, ability) {
    // Deal damage to the target
    target.currentHp -= ability.damage;
    console.log(`${target.name} takes ${ability.damage} damage from ${ability.name}.`);

    // Check if the ability has a debuff
    if (ability.debuff) {
        const debuff = ability.debuff;

        // Apply the debuff effect
        if (debuff.type === 'stun') {
            applyStunDebuff(target, debuff);
        } else {
            // Handle other debuff types if necessary
            console.log(`${target.name} is affected by ${debuff.type} debuff.`);
        }

        // Add a debuff icon
        const debuffIcon = document.createElement('div');
        debuffIcon.classList.add('debuff-icon');
        debuffIcon.style.backgroundImage = `url('${debuff.icon}')`;
        debuffIcon.title = debuff.description;
        document.getElementById(`${target.type}-buffs`).appendChild(debuffIcon);

        // Remove the debuff icon after the duration
        setTimeout(() => {
            debuffIcon.remove();
            console.log(`${target.name} is no longer affected by ${debuff.type} debuff.`);
        }, debuff.duration * 1000);
    }
}

function applyStunDebuff(target, debuff) {
    if (target.isStunned) {
        console.log(`${target.name} is already stunned.`);
        return;
    }

    // Apply the stun debuff
    target.isStunned = true;
    console.log(`${target.name} is stunned and cannot use spells for ${debuff.duration} seconds.`);

    // Disable target's ability buttons
    disablePlayerAbilities(target);

    // Remove the stun after the duration
    setTimeout(() => {
        target.isStunned = false;
        console.log(`${target.name} is no longer stunned and can use spells again.`);
        enablePlayerAbilities(target);
    }, debuff.duration * 1000); // Convert seconds to milliseconds
}

function applyDebuff(target, debuff) {
    console.log(`${target.name} is affected by ${debuff.type} debuff.`);

    // Add a debuff icon
    const debuffIcon = document.createElement('div');
    debuffIcon.classList.add('debuff-icon');
    debuffIcon.style.backgroundImage = `url('${debuff.icon}')`;
    debuffIcon.title = debuff.description;
    document.getElementById(`${target.type}-buffs`).appendChild(debuffIcon);

    // Apply specific debuff effects
    switch (debuff.type) {
        case 'stun':
            applyStunEffect(target, debuff.duration);
            break;
        case 'damage_over_time':
            applyDotEffect(target, debuff);
            break;
        // Add more cases for different debuff types as needed
        default:
            console.warn(`Debuff type "${debuff.type}" not recognized.`);
    }

    // Remove the debuff icon after the duration
    setTimeout(() => {
        debuffIcon.remove();
        console.log(`${target.name} is no longer affected by ${debuff.type} debuff.`);
    }, debuff.duration * 1000);
}

function applyStunEffect(target, duration) {
    if (target.isStunned) {
        console.log(`${target.name} is already stunned.`);
        return;
    }

    target.isStunned = true;
    console.log(`${target.name} is stunned and cannot use spells for ${duration} seconds.`);
    disablePlayerAbilities(target);

    setTimeout(() => {
        target.isStunned = false;
        console.log(`${target.name} is no longer stunned and can use spells again.`);
        enablePlayerAbilities(target);
    }, duration * 1000);
}

function applyDotEffect(target, debuff) {
    const dotInterval = setInterval(() => {
        target.currentHp -= debuff.damagePerSecond;
        console.log(`${target.name} takes ${debuff.damagePerSecond} damage from ${debuff.type}.`);
        updateHpDisplay(target);
    }, 1000);

    setTimeout(() => {
        clearInterval(dotInterval);
    }, debuff.duration * 1000);
}

