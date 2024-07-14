import { characters, boss, updateHpBars, checkDefeatedCharacters, logCombat, removeBuffIcon } from './utils.js';

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

function bossSpellAttack() {
    const targets = getRandomTargetCharacters(boss.spellTargets);
    targets.forEach(target => {
        let damage = boss.spellDamage * boss.damageReduction;

        if (kokoroA4BuffActive) { // Check if the buff is active
            damage *= 0.65; // Reduce damage by 35%
        }

        target.hp -= damage;
        flashRed(target.id);
        logCombat(`Boss casts spell attack on Character ${target.id}, dealing ${damage} damage.`);
        if (target.hp <= 0) {
            alert(`Character ${target.id} defeated by boss spell!`);
            target.hp = 0;
        }
    });
    updateHpBars();
    checkDefeatedCharacters();

    // Manage the buffs and cooldowns
    if (kokoroA2BuffActive) {
        kokoroA2BuffCounter--;
        if (kokoroA2BuffCounter <= 0) {
            removeKokoroA2Buff();
        }
    }

    if (kokoroA4BuffActive) {
        kokoroA4BuffCounter--;
        if (kokoroA4BuffCounter <= 0) {
            removeKokoroA4Buff();
        }
    }

    if (kokoroA2CooldownCounter > 0) {
        kokoroA2CooldownCounter--;
    }

    if (kokoroA4CooldownCounter > 0) {
        kokoroA4CooldownCounter--;
    }
}

function bossMassiveDamageAttack() {
    const target = getRandomTargetCharacter();
    if (target && (target.id !== 1 || !ayaneImmune)) {
        let damage = boss.massiveDamage * boss.damageReduction;

        if (kokoroA4BuffActive) { // Check if the buff is active
            damage *= 0.65; // Reduce damage by 35%
        }

        target.hp -= damage;
        flashRed(target.id);
        logCombat(`Boss casts massive damage attack on Character ${target.id}, dealing ${damage} damage.`);
        if (target.hp <= 0) {
            alert(`Character ${target.id} defeated by boss massive damage!`);
            target.hp = 0;
        }
    }

    updateHpBars();
    checkDefeatedCharacters();

    // Manage the buffs and cooldowns
    if (kokoroA2BuffActive) {
        kokoroA2BuffCounter--;
        if (kokoroA2BuffCounter <= 0) {
            removeKokoroA2Buff();
        }
    }

    if (kokoroA4BuffActive) {
        kokoroA4BuffCounter--;
        if (kokoroA4BuffCounter <= 0) {
            removeKokoroA4Buff();
        }
    }

    if (kokoroA2CooldownCounter > 0) {
        kokoroA2CooldownCounter--;
    }

    if (kokoroA4CooldownCounter > 0) {
        kokoroA4CooldownCounter--;
    }
}

function bossAllTargetsAttack() {
    characters.forEach(character => {
        let damage = boss.allTargetsDamage * boss.damageReduction;

        if (kokoroA4BuffActive) { // Check if the buff is active
            damage *= 0.65; // Reduce damage by 35%
        }

        if (character.id !== 1 || !ayaneImmune) {
            character.hp -= damage;
            flashRed(character.id);
            logCombat(`Boss casts all-targets attack, dealing ${damage} damage to Character ${character.id}.`);
            if (character.hp <= 0) {
                alert(`Character ${character.id} defeated by boss's all-targets attack!`);
                character.hp = 0;
            }
        }
    });
    updateHpBars();
    checkDefeatedCharacters();

    // Manage the buffs and cooldowns
    if (kokoroA2BuffActive) {
        kokoroA2BuffCounter--;
        if (kokoroA2BuffCounter <= 0) {
            removeKokoroA2Buff();
        }
    }

    if (kokoroA4BuffActive) {
        kokoroA4BuffCounter--;
        if (kokoroA4BuffCounter <= 0) {
            removeKokoroA4Buff();
        }
    }

    if (kokoroA2CooldownCounter > 0) {
        kokoroA2CooldownCounter--;
    }

    if (kokoroA4CooldownCounter > 0) {
        kokoroA4CooldownCounter--;
    }
}

function bossRevengeAttack() {
    if (lastAttacker !== null && lastDamageDealt > 0) {
        const target = characters.find(character => character.id === lastAttacker);
        if (target && target.hp > 0 && (target.id !== 1 || !ayaneImmune)) {
            let damage = lastDamageDealt * boss.revengeMultiplier * boss.damageReduction;

            if (kokoroA4BuffActive) { // Check if the buff is active
                damage *= 0.65; // Reduce damage by 35%
            }

            target.hp -= damage;
            flashRed(target.id);
            logCombat(`Boss casts revenge attack on Character ${target.id}, dealing ${damage} damage.`);
            if (target.hp <= 0) {
                alert(`Character ${target.id} defeated by boss's revenge attack!`);
                target.hp = 0;
            }
            updateHpBars();
            checkDefeatedCharacters();
        }
    }

    // Manage the buffs and cooldowns
    if (kokoroA2BuffActive) {
        kokoroA2BuffCounter--;
        if (kokoroA2BuffCounter <= 0) {
            removeKokoroA2Buff();
        }
    }

    if (kokoroA4BuffActive) {
        kokoroA4BuffCounter--;
        if (kokoroA4BuffCounter <= 0) {
            removeKokoroA4Buff();
        }
    }

    if (kokoroA2CooldownCounter > 0) {
        kokoroA2CooldownCounter--;
    }

    if (kokoroA4CooldownCounter > 0) {
        kokoroA4CooldownCounter--;
    }
}
