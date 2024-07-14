export const characters = [
    { id: 1, hp: 4550, maxHp: 4550, abilities: [0, 20, 15, 30] },
    { id: 2, hp: 6200, maxHp: 6200, abilities: [10, 20, 15, 30] },
    { id: 3, hp: 4115, maxHp: 4115, abilities: [755, 20, 15, 30] },
    { id: 4, hp: 5620, maxHp: 5620, abilities: [500, 0, 0, 0], buffs: [], siegfriedA4Active: false, siegfriedA4Turns: 0 },
    { id: 5, hp: 4445, maxHp: 4445, abilities: [0, 0, 0, 0], kokoroA2Cooldown: 0, kokoroA3Cooldown: 0, kokoroA4Cooldown: 0, kokoroA4Active: false, kokoroA4Turns: 0 }
];

export const boss = {
    hp: 50000, maxHp: 50000,
    attackCount: 0,
    spellDamage: 550, spellTargets: 3,
    massiveDamage: 1350,
    allTargetsDamage: 320,
    revengeMultiplier: 2,
    damageReduction: 1 // To store damage reduction state
};

export let lastAttacker = null;
export let lastDamageDealt = 0;
export let bossCanAct = true;
export let ayaneImmune = false;
export let siegfriedA4Cooldown = 0;
export let kokoroA4BuffActive = false;
export let kokoroA4BuffCounter = 0;
export let kokoroA4CooldownCounter = 0;
export let kokoroA2BuffActive = false;
export let kokoroA2BuffCounter = 0;
export let kokoroA2CooldownCounter = 0;

export function logCombat(message) {
    console.log(message);
}

export function updateHpBars() {
    characters.forEach(character => {
        const hpBar = document.getElementById(`hp${character.id}`);
        const hpText = document.getElementById(`hp-text${character.id}`);
        if (hpBar && hpText) {
            const hpPercentage = (character.hp / character.maxHp) * 100;
            hpBar.style.width = `${hpPercentage}%`;
            hpText.innerText = `${character.hp}/${character.maxHp}`;
        }
    });

    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossHpText = document.getElementById('boss-hp-text');
    if (bossHpBar && bossHpText) {
        const bossHpPercentage = (boss.hp / boss.maxHp) * 100;
        bossHpBar.style.width = `${bossHpPercentage}%`;
        bossHpText.innerText = `${boss.hp}/${boss.maxHp}`;
    }
}

export function updateAbilityButtons() {
    const siegfriedA4Button = document.querySelector('#character4 .abilities .ability:nth-child(4)');
    const kokoroA2Button = document.querySelector('#character5 .abilities .ability:nth-child(2)');
    const kokoroA3Button = document.querySelector('#character5 .abilities .ability:nth-child(3)');
    const kokoroA4Button = document.querySelector('#character5 .abilities .ability:nth-child(4)');

    if (siegfriedA4Button) {
        if (siegfriedA4Cooldown > 0) {
            siegfriedA4Button.style.filter = 'grayscale(100%)';
            siegfriedA4Button.style.pointerEvents = 'none';
        } else {
            siegfriedA4Button.style.filter = '';
            siegfriedA4Button.style.pointerEvents = '';
        }
    }

    if (kokoroA2Button) {
        if (characters[4].kokoroA2Cooldown > 0) {
            kokoroA2Button.style.filter = 'grayscale(100%)';
            kokoroA2Button.style.pointerEvents = 'none';
        } else {
            kokoroA2Button.style.filter = '';
            kokoroA2Button.style.pointerEvents = '';
        }
    }

    if (kokoroA3Button) {
        if (characters[4].kokoroA3Cooldown > 0) {
            kokoroA3Button.style.filter = 'grayscale(100%)';
            kokoroA3Button.style.pointerEvents = 'none';
        } else {
            kokoroA3Button.style.filter = '';
            kokoroA3Button.style.pointerEvents = '';
        }
    }

    if (kokoroA4Button) {
        if (characters[4].kokoroA4Cooldown > 0) {
            kokoroA4Button.style.filter = 'grayscale(100%)';
            kokoroA4Button.style.pointerEvents = 'none';
        } else {
            kokoroA4Button.style.filter = '';
            kokoroA4Button.style.pointerEvents = '';
        }
    }
}

export function flashRed(characterId) {
    const characterImage = document.querySelector(`#character${characterId} img`);
    if (characterImage) {
        characterImage.classList.add('flash-red');
        setTimeout(() => {
            characterImage.classList.remove('flash-red');
        }, 500);
    }
}

export function addBuffIcon(characterId, buffSrc, buffId, buffDescription) {
    const buffContainer = characterId === 'boss' ? document.getElementById('buff-container-boss') : document.getElementById(`buff-container${characterId}`);
    if (buffContainer) {
        const buffIcon = document.createElement('img');
        buffIcon.src = buffSrc;
        buffIcon.classList.add('buff-icon');
        buffIcon.id = buffId;
        buffIcon.title = buffDescription; // Set the unique tooltip text
        buffContainer.appendChild(buffIcon);
    }
}

export function removeBuffIcon(buffId) {
    const buffIcon = document.getElementById(buffId);
    if (buffIcon) {
        buffIcon.remove();
    }
}

export function getRandomTargetCharacter() {
    const aliveCharacters = characters.filter(character => character.hp > 0);
    if (aliveCharacters.length > 0) {
        return aliveCharacters[Math.floor(Math.random() * aliveCharacters.length)];
    }
    return null;
}

export function getRandomTargetCharacters(number) {
    const aliveCharacters = characters.filter(character => character.hp > 0);
    const targets = [];
    while (targets.length < number && aliveCharacters.length > 0) {
        const randomIndex = Math.floor(Math.random() * aliveCharacters.length);
        const target = aliveCharacters.splice(randomIndex, 1)[0];
        targets.push(target);
    }
    return targets;
}

export function highlightCharacter(characterId) {
    document.querySelectorAll('.character').forEach(character => {
        character.classList.remove('highlight');
    });
    const activeCharacter = document.getElementById(`character${characterId}`);
    if (activeCharacter) {
        activeCharacter.classList.add('highlight');
    }
}

export function checkDefeatedCharacters() {
    characters.forEach(character => {
        const characterElement = document.getElementById(`character${character.id}`);
        if (characterElement) {
            if (character.hp <= 0) {
                characterElement.classList.add('defeated');
                character.hp = 0;
            } else {
                characterElement.classList.remove('defeated');
            }
        }
    });
}

export function removeKokoroA2Buff() {
    kokoroA2BuffActive = false;
    boss.damageReduction = 1; // Reset damage reduction
    removeBuffIcon('kokoro-a2-buff-boss');
    logCombat('Kokoro\'s A2 buff has expired.');
}

export function removeKokoroA4Buff() {
    kokoroA4BuffActive = false;
    characters.forEach(character => {
        removeBuffIcon(`kokoro-a4-buff-${character.id}`);
    });
    logCombat('Kokoro\'s A4 buff has expired.');
}

export function bossTurn() {
    if (bossCanAct) {
        const spellChoice = Math.floor(Math.random() * 4);
        if (spellChoice === 0) {
            bossSpellAttack();
        } else if (spellChoice === 1) {
            bossMassiveDamageAttack();
        } else if (spellChoice === 2) {
            bossAllTargetsAttack();
        } else {
            bossRevengeAttack();
        }

        boss.attackCount++;
        if (siegfriedA4Cooldown > 0) {
            siegfriedA4Cooldown--;
        }

        characters[4].kokoroA2Cooldown = Math.max(0, characters[4].kokoroA2Cooldown - 1);
        characters[4].kokoroA3Cooldown = Math.max(0, characters[4].kokoroA3Cooldown - 1);
        characters[4].kokoroA4Cooldown = Math.max(0, characters[4].kokoroA4Cooldown - 1);

        logCombat(`Boss turn. Boss attack count: ${boss.attackCount}, Siegfried A4 cooldown: ${siegfriedA4Cooldown}, Kokoro A2 cooldown: ${characters[4].kokoroA2Cooldown}, Kokoro A3 cooldown: ${characters[4].kokoroA3Cooldown}, Kokoro A4 cooldown: ${characters[4].kokoroA4Cooldown}`);
        updateAbilityButtons();
    }
}
