class Champion {
    constructor(name, ad, ap, hp, mana, ms, attack_speed, abilities, talents) {
        this.name = name;
        this.ad = ad;
        this.ap = ap;
        this.hp = hp;
        this.mana = mana;
        this.ms = ms;
        this.attack_speed = attack_speed;
        this.abilities = abilities;
        this.talents = talents;
        this.current_hp = hp;
        this.current_mana = mana;
        this.cooldowns = {};
        for (let ability of abilities) {
            this.cooldowns[ability.name] = 0;
        }
    }

    useAbility(abilityName, target) {
        let ability = this.abilities.find(a => a.name === abilityName);
        if (ability && this.cooldowns[abilityName] === 0 && this.current_mana >= ability.mana_cost) {
            this.current_mana -= ability.mana_cost;
            target.current_hp -= ability.damage;
            this.cooldowns[abilityName] = ability.cooldown;
            return `${this.name} uses ${abilityName} on ${target.name}, dealing ${ability.damage} damage.`;
        }
        return `${this.name} cannot use ${abilityName}.`;
    }

    basicAttack(target) {
        target.current_hp -= this.ad;
        return `${this.name} attacks ${target.name}, dealing ${this.ad} damage.`;
    }

    tickCooldowns() {
        for (let abilityName in this.cooldowns) {
            if (this.cooldowns[abilityName] > 0) {
                this.cooldowns[abilityName]--;
            }
        }
    }

    isAlive() {
        return this.current_hp > 0;
    }
}

function parseChampionData(doc) {
    let name = doc.querySelector('h1').textContent.trim();
    let ad = parseInt(doc.querySelector('.stat .red')?.parentElement?.textContent.split('->')[1]) || 0;
    let ap = parseInt(doc.querySelector('.stat .blue')?.parentElement?.textContent.split('->')[1]) || 0;
    let hp = parseInt(doc.querySelector('.stat .green')?.parentElement?.textContent.split('->')[1]) || 0;
    let mana = doc.querySelector('.stat .orange')?.parentElement?.textContent.includes('-') ? 0 : parseInt(doc.querySelector('.stat .orange')?.parentElement?.textContent.split('->')[1]) || 0;
    let ms = parseInt(doc.querySelector('.stat .light-blue')?.parentElement?.textContent.split('->')[1]) || 0;
    let attack_speed = parseFloat(doc.querySelector('.stat .grey')?.parentElement?.textContent.split('->')[1]) || 0;

    let abilities = [];
    doc.querySelectorAll('.abilities h3').forEach((abilityEl, index) => {
        let name = abilityEl.textContent.trim();
        let damageMatch = abilityEl.nextElementSibling.nextElementSibling?.textContent.match(/\[(\d+\/?)+\]/);
        let damage = damageMatch ? parseInt(damageMatch[0].replace(/[\[\]]/g, '').split('/').pop()) : 0;
        let mana_cost = 0; // Assuming mana cost is always 0 in this structure
        let cooldownMatch = abilityEl.nextElementSibling.querySelector('.cd')?.textContent.match(/\[(\d+s)\]/);
        let cooldown = cooldownMatch ? parseInt(cooldownMatch[0].replace(/[\[\]s]/g, '')) : 0;
        abilities.push({ name, damage, mana_cost, cooldown });
    });

    let talents = []; // Extract talents if necessary

    return new Champion(name, ad, ap, hp, mana, ms, attack_speed, abilities, talents);
}

function fetchChampionData(championName) {
    return fetch(`characters/${championName} Page.html`)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(data, 'text/html');
            return parseChampionData(doc);
        });
}

function simulateMatch(champion1, champion2) {
    let log = [];
    log.push(`The match between ${champion1.name} and ${champion2.name} begins!`);

    while (champion1.isAlive() && champion2.isAlive()) {
        log.push(champion1.basicAttack(champion2));
        if (!champion2.isAlive()) {
            log.push(`${champion2.name} is defeated. ${champion1.name} wins!`);
            break;
        }

        log.push(champion2.basicAttack(champion1));
        if (!champion1.isAlive()) {
            log.push(`${champion1.name} is defeated. ${champion2.name} wins!`);
            break;
        }

        champion1.tickCooldowns();
        champion2.tickCooldowns();
    }
    return log;
}

function displayMessage(message, isUser) {
    let chatbox = document.getElementById('chatbox');
    let messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.textAlign = isUser ? 'right' : 'left';
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function sendMessage() {
    let userInput = document.getElementById('userInput').value;
    displayMessage(userInput, true);

    let [command, champion1Name, champion2Name] = userInput.split(' ');

    if (command.toLowerCase() === 'simulate' && champion1Name && champion2Name) {
        Promise.all([fetchChampionData(champion1Name), fetchChampionData(champion2Name)])
            .then(([champion1, champion2]) => {
                let log = simulateMatch(champion1, champion2);
                log.forEach(message => displayMessage(message, false));
            })
            .catch(error => {
                displayMessage(`Error: ${error.message}`, false);
            });
    } else {
        displayMessage('Please use the command format: "simulate <champion1> <champion2>"', false);
    }

    document.getElementById('userInput').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    displayMessage('Welcome to the Champion Match Simulation Chatbot! Use the command format: "simulate <champion1> <champion2>" to start a match.', false);
});
