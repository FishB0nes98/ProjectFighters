import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { roles } from '../roles.js';
import { characters } from '../characterskinref.js';
import { skinToBaseCharacterMap } from '../skinmapping.js';

const firebaseConfig = {
    apiKey: "AIzaSyCqhxq6sPDU3EmuvvkBIIDJ-H6PsBc42Jg",
    authDomain: "project-fighters-by-fishb0nes.firebaseapp.com",
    databaseURL: "https://project-fighters-by-fishb0nes-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-fighters-by-fishb0nes",
    storageBucket: "project-fighters-by-fishb0nes.appspot.com",
    messagingSenderId: "867339299995",
    appId: "1:867339299995:web:99c379940014b9c05cea3e",
    measurementId: "G-LNEM6HR842"
};

// Dinamikusan importáljuk a karakter képességeket
const characterAbilities = {};

async function loadCharacterAbilities(characterName) {
    try {
        console.log(`Attempting to load abilities for ${characterName}`);
        const module = await import(`../Arena/characters/${characterName}.js`);
        console.log('Loaded module:', module);
        
        if (module[characterName]) {
            characterAbilities[characterName] = module[characterName];
            console.log(`Successfully loaded abilities for ${characterName}:`, module[characterName]);
            return true;
        } else {
            console.error(`Module loaded but ${characterName} not found in module`);
            return false;
        }
    } catch (error) {
        console.error(`Failed to load abilities for ${characterName}:`, error);
        return false;
    }
}

class ArenaGame {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.database = getDatabase(this.app);
        this.player = null;
        this.ai = {
            ai1: null,
            ai2: null,
            ai3: null
        };
        this.selectedCharacters = new Set();
        this.cooldowns = {
            player: { Q: 0, W: 0, E: 0, R: 0 },
            ai1: { Q: 0, W: 0, E: 0, R: 0 },
            ai2: { Q: 0, W: 0, E: 0, R: 0 },
            ai3: { Q: 0, W: 0, E: 0, R: 0 }
        };
        this.activeEffects = {
            player: new Set(),
            ai1: new Set(),
            ai2: new Set(),
            ai3: new Set()
        };
        this.levels = {
            player: 1,
            ai1: 1,
            ai2: 1,
            ai3: 1
        };
        this.gameTime = 0;
        this.gameTimer = null;
        this.abilityLevels = {
            player: { Q: 0, W: 0, E: 0, R: 0 },
            ai1: { Q: 0, W: 0, E: 0, R: 0 },
            ai2: { Q: 0, W: 0, E: 0, R: 0 },
            ai3: { Q: 0, W: 0, E: 0, R: 0 }
        };
        this.xp = {
            player: 0,
            ai1: 0,
            ai2: 0,
            ai3: 0
        };
        this.xpThresholds = {
            2: 50,
            3: 150,
            4: 300,
            5: 500,
            6: 750,
            7: 900,
            8: 1150,
            9: 1400,
            10: 1750,
            11: 2000,
            12: 2300,
            13: 2650,
            14: 3000,
            15: 3200,
            16: 3500,
            17: 3850,
            18: 4100,
            19: 4400,
            20: 4750,
            21: 5000,
            22: 5500,
            23: 6000,
            24: 7000
        };
        this.abilityScales = {
            Julia: {
                1: { // Q ability
                    healing: [90, 275, 450, 630, 800, 900],
                    speedBoost: 35,
                    duration: 2,
                    manaCost: 55,
                    cooldown: 6
                },
                2: { // W ability
                    manaCost: 80,
                    cooldown: 21,
                    healPercent: [30, 34, 39, 42, 44, 44]
                },
                3: { // E ability
                    damage: [25, 60, 105, 200, 350, 350],
                    manaCost: 55,
                    cooldown: 9,
                    stunChance: 35,
                    stunDuration: 1.5
                },
                4: { // R ability
                    healPercent: [50, 75, 100],
                    manaCost: 120,
                    cooldown: 125
                }
            },
            Ibuki: {
                1: { // Q ability
                    charges: 2,
                    cooldown: 6,
                    hitChance: 90,
                    damage: [95, 140, 200, 300, 400, 510],
                    adScaling: 0.5,
                    debuff: {
                        icon: 'Arena/abilityicons/ibuki_r.jfif',
                        duration: 4,
                        bonusDamageMultiplier: 0.25
                    }
                }
            }
            // További karakterek skálázása ide jön
        };
        this.buffs = {
            player: new Map(),
            ai1: new Map(),
            ai2: new Map(),
            ai3: new Map()
        };
        this.activeTooltip = null;
        this.init();

        // Stílusok hozzáadása
        const style = document.createElement('style');
        style.textContent = `
            .ability {
                position: relative;
                width: 45px;
                height: 45px;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background-size: cover;
                background-position: center;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                cursor: pointer;
                overflow: hidden;
            }

            .ability:hover {
                transform: scale(1.1);
                border-color: rgba(255, 215, 0, 0.5);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }

            .hp-bar, .mana-bar {
                height: 20px;
                margin: 1px 0;
                border-radius: 4px;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .status-bars {
                margin-bottom: 4px;
                margin-top: 4px;
            }

            .cooldown-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: none;
                justify-content: center;
                align-items: center;
                border-radius: 6px;
            }

            .cooldown-number {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 16px;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                z-index: 2;
            }

            .cooldown-circle {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
                z-index: 1;
            }

            .cooldown-circle circle {
                stroke: #4CAF50;
                stroke-width: 3;
                fill: none;
                r: 40%;
                cx: 50%;
                cy: 50%;
                stroke-dasharray: 251.2;
                stroke-dashoffset: 0;
                transition: stroke-dashoffset 0.1s linear;
            }

            @keyframes targetPulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.05); opacity: 0.6; }
                100% { transform: scale(1); opacity: 0.8; }
            }

            @keyframes floatingText {
                0% {
                    transform: translate(-50%, 0);
                    opacity: 0;
                }
                20% {
                    opacity: 1;
                }
                80% {
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50px);
                    opacity: 0;
                }
            }

            .floating-text {
                position: absolute;
                left: 50%;
                top: 40%;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                pointer-events: none;
                z-index: 1000;
                animation: floatingText 1.5s ease-out forwards;
                white-space: nowrap;
            }

            .floating-text.heal {
                color: #4CAF50;
            }

            .floating-text.damage {
                color: #ff4757;
            }

            .floating-text.crit {
                font-size: 28px;
                color: #ffd700;
            }

            .floating-text.heal.blocked {
                color: rgba(76, 175, 80, 0.6);
                font-size: 20px;
                font-style: italic;
            }

            .floating-text.heal.blocked::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(76, 175, 80, 0.6);
                transform: translateY(-50%) rotate(-10deg);
            }

            .buff-container {
                position: absolute;
                bottom: 75px;
                left: 10px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                z-index: 100;
                background: linear-gradient(to bottom, rgba(15, 15, 15, 0.85), rgba(30, 30, 30, 0.85));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 4px;
                min-width: 30px;
                min-height: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(4px);
                justify-content: flex-start;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    async init() {
        await this.initializeAuth();
        this.setupEventListeners();
        await this.initializeAllAI();
    }

    async initializeAuth() {
        return new Promise((resolve) => {
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    console.log("User is logged in:", user.uid);
                    const userRef = ref(this.database, 'users/' + user.uid);
                    const snapshot = await get(userRef);
                    const userData = snapshot.val();
                    if (userData && !userData.skins) {
                        console.log("No skins available.");
                    }
                } else {
                    console.log("User is not logged in.");
                }
                resolve();
            });
        });
    }

    createPlayerSlots() {
        const team1Container = document.querySelector('.team-1');
        const team2Container = document.querySelector('.team-2');

        team1Container.innerHTML = '';
        team2Container.innerHTML = '';

        const playerSlot = this.createPlayerSlot('player');
        playerSlot.querySelector('.character-portrait').textContent = 'Kattints karakter választáshoz';
        team1Container.appendChild(playerSlot);

        const aiSlot = this.createPlayerSlot('ai');
        aiSlot.classList.add('ai-slot');
        team2Container.appendChild(aiSlot);
    }

    createPlayerSlot(playerId) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.dataset.playerId = playerId;
        slot.innerHTML = `
            <div class="character-portrait" style="cursor: ${playerId === 'player' ? 'pointer' : 'default'}">${playerId === 'player' ? 'Kattints karakter választáshoz' : ''}</div>
            <img src="" alt="${playerId === 'player' ? 'Player' : 'AI'} Character" style="display: none;">
            <div class="status-bars">
                <div class="hp-bar"></div>
                <div class="mana-bar"></div>
            </div>
            <div class="abilities">
                <div class="ability" data-ability="1"></div>
                <div class="ability" data-ability="2"></div>
                <div class="ability" data-ability="3"></div>
                <div class="ability" data-ability="4"></div>
            </div>
        `;
        return slot;
    }

    setupEventListeners() {
        const playerSlot = document.querySelector('[data-player-id="player"]');
        const portraitDiv = playerSlot.querySelector('.character-portrait');
        
        // Csak a portréra való kattintás nyitja meg a karakter választót, és csak ha még nincs karakter kiválasztva
        portraitDiv.addEventListener('click', () => {
            if (!this.player) {
                this.openCharacterSelector(playerSlot);
            }
        });

        // Debug: F4 billentyű kezelése az R képesség feloldásához
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F4' && this.player) {
                const playerSlot = document.querySelector('[data-player-id="player"]');
                const rAbility = playerSlot.querySelector('.ability[data-ability="4"]');
                if (rAbility) {
                    rAbility.classList.remove('locked');
                    this.abilityLevels.player[4] = 1; // R képesség szintjének beállítása 1-re
                    this.updateAbilityValues(this.player, 4);
                    console.log('R ability unlocked for debugging');
                }
            }
        });

        // Képességek aktiválása kattintással
        document.querySelectorAll('.player-slot').forEach(slot => {
            const abilities = slot.querySelectorAll('.ability');
            abilities.forEach(ability => {
                ability.addEventListener('click', (e) => {
                    e.stopPropagation(); // Megakadályozza a kattintás továbbterjedését
                    if (slot.dataset.playerId === 'player' && this.player && !ability.classList.contains('locked')) {
                        this.useAbility(slot, ability.dataset.ability);
                    }
                });
            });
        });

        // QWER billentyűk és NUM5, NUM6 kezelése
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Clear' || e.key === '5') {  // NumPad 5 vagy 5 billentyű
                this.gameTime = 55;
                const timerDisplay = document.querySelector('.timer-display');
                timerDisplay.textContent = '00:55';
                return;
            }

            if (e.key === '6') {  // NumPad 6 vagy 6 billentyű
                // Minden játékos HP-jának felezése
                const allSlots = document.querySelectorAll('.player-slot');
                allSlots.forEach(slot => {
                    const playerId = slot.dataset.playerId;
                    const character = playerId === 'player' ? this.player : this.ai[playerId];
                    if (character) {
                        const oldHp = character.currentHp;
                        character.currentHp = Math.round(character.currentHp / 2);
                        const hpLost = oldHp - character.currentHp;
                        
                        // HP bar frissítése
                        this.updateHealthAndMana(slot, character.currentHp, character.currentMana);
                        
                        // Lebegő szöveg megjelenítése
                        this.showFloatingText(slot, hpLost, 'damage');
                    }
                });
                return;
            }

            if (!this.player || this.currentTargeting) return;

            const keyToAbility = {
                'q': '1',
                'w': '2',
                'e': '3',
                'r': '4',
                'Q': '1',
                'W': '2',
                'E': '3',
                'R': '4'
            };

            if (keyToAbility[e.key]) {
                const playerSlot = document.querySelector('[data-player-id="player"]');
                const ability = playerSlot.querySelector(`.ability[data-ability="${keyToAbility[e.key]}"]`);
                if (!ability.classList.contains('locked')) {
                    this.useAbility(playerSlot, keyToAbility[e.key]);
                }
            }
        });

        // Karakter választó modal eseménykezelők
        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('skin-selection-modal').style.display = 'none';
        });

        const searchInput = document.getElementById('skin-search');
        searchInput.addEventListener('input', (e) => {
            const filter = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.character-card, .skin-card');
            cards.forEach(card => {
                const name = card.querySelector('.character-name, .skin-name').textContent.toLowerCase();
                card.style.display = name.includes(filter) ? '' : 'none';
            });
        });
    }

    async openCharacterSelector(slot) {
        const modal = document.getElementById('skin-selection-modal');
        const container = document.getElementById('skin-container');
        const searchInput = document.getElementById('skin-search');

        container.innerHTML = '';
        searchInput.value = '';

        // Role-alapú karakter csoportosítás
        for (const role in roles) {
            const roleSection = document.createElement('div');
            roleSection.classList.add('role-section');

            const roleHeader = document.createElement('h3');
            roleHeader.textContent = role;
            roleHeader.classList.add('role-header');
            roleSection.appendChild(roleHeader);

            const roleCharacters = document.createElement('div');
            roleCharacters.classList.add('role-characters');

            for (const character of roles[role]) {
                const characterCard = this.createCharacterCard(character, slot);
                roleCharacters.appendChild(characterCard);
            }

            roleSection.appendChild(roleCharacters);
            container.appendChild(roleSection);
        }

        modal.style.display = 'block';
    }

    createCharacterCard(character, slot) {
        const card = document.createElement('div');
        card.classList.add('character-card');
        
        const img = document.createElement('img');
        img.src = `Icons/${character}.png`;
        img.alt = character;
        img.classList.add('character-image');
        
        const name = document.createElement('div');
        name.textContent = character;
        name.classList.add('character-name');
        
        card.appendChild(img);
        card.appendChild(name);
        
        card.addEventListener('click', () => {
            this.openSkinSelector(character, slot);
        });
        
        return card;
    }

    async openSkinSelector(character, slot) {
        const modal = document.getElementById('skin-selection-modal');
        const container = document.getElementById('skin-container');
        const searchInput = document.getElementById('skin-search');

        container.innerHTML = '';
        searchInput.value = '';

        // Vissza gomb
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.classList.add('back-button');
        backButton.addEventListener('click', () => {
            this.openCharacterSelector(slot);
        });
        container.appendChild(backButton);

        // Elérhető skinek betöltése
        const user = this.auth.currentUser;
        if (user) {
            const userSkinsRef = ref(this.database, `users/${user.uid}/skins`);
            const snapshot = await get(userSkinsRef);
            const ownedSkins = snapshot.val() || {};

            const characterSkins = characters[character] || [];
            for (const skin of characterSkins) {
                if (ownedSkins[skin]) {
                    const skinCard = this.createSkinCard(skin, slot);
                    container.appendChild(skinCard);
                }
            }
        }
    }

    createSkinCard(skin, slot) {
        const card = document.createElement('div');
        card.classList.add('skin-card');
        
        const img = document.createElement('img');
        img.src = `Loading Screen/${skin}.png`;
        img.alt = skin;
        img.classList.add('skin-image');
        
        const name = document.createElement('div');
        name.textContent = skin;
        name.classList.add('skin-name');
        
        card.appendChild(img);
        card.appendChild(name);
        
        card.addEventListener('click', () => {
            this.selectCharacter(slot, skin);
        });
        
        return card;
    }

    async selectCharacter(slot, skin) {
        const baseCharacter = skinToBaseCharacterMap[skin] || skin;
        console.log(`Selecting character: ${baseCharacter} with skin: ${skin}`);
        
        const playerId = slot.dataset.playerId;
        
        // Először betöltjük a karakter alapadatait
        const characterData = {
            name: skin,
            baseCharacter: baseCharacter,
            portrait: `Loading Screen/${skin}.png`,
            currentHp: 0,  // Ezeket majd a karakter statisztikákból töltjük be
            currentMana: 0,
            maxHp: 0,
            maxMana: 0,
            stats: {},
            playerId: playerId,
            lastRegenTime: Date.now(), // HP és mana regenerációhoz
            abilities: []
        };

        // Karakter betöltése a slotba
        if (playerId === 'player') {
            this.player = characterData;
        } else {
            this.ai[playerId] = characterData;
        }

        // Inicializáljuk az ability szinteket 1-es szintről
        this.abilityLevels[playerId] = {
            1: 1, // Q képesség
            2: 1, // W képesség
            3: 1, // E képesség
            4: 0  // R képesség (ez továbbra is 0-ról indul)
        };

        // Először betöltjük a karaktert az alapértelmezett értékekkel
        this.loadCharacter(slot, characterData);
        
        // Majd betöltjük a képességeket és statisztikákat
        try {
            console.log(`Checking abilities for ${baseCharacter}`);
            if (!characterAbilities[baseCharacter]) {
                const loaded = await loadCharacterAbilities(baseCharacter);
                if (!loaded) {
                    console.error(`Failed to load abilities for ${baseCharacter}`);
                    return;
                }
            }
            
            const charData = characterAbilities[baseCharacter];
            console.log('Loaded character data:', charData);
            
            if (charData) {
                // Frissítjük a karakter adatait a betöltött statisztikákkal és képességekkel
                characterData.maxHp = charData.stats.hp;
                characterData.maxMana = charData.stats.mana;
                characterData.currentHp = charData.stats.hp;
                characterData.currentMana = charData.stats.mana;
                characterData.stats = { ...charData.stats };
                characterData.abilities = [
                    { 
                        name: charData.abilities.Q.name,
                        icon: `Arena/abilityicons/${baseCharacter}_Q.jfif`,
                        ...charData.abilities.Q
                    },
                    {
                        name: charData.abilities.W.name,
                        icon: `Arena/abilityicons/${baseCharacter}_W.jfif`,
                        ...charData.abilities.W
                    },
                    {
                        name: charData.abilities.E.name,
                        icon: `Arena/abilityicons/${baseCharacter}_E.jfif`,
                        ...charData.abilities.E
                    },
                    {
                        name: charData.abilities.R.name,
                        icon: `Arena/abilityicons/${baseCharacter}_R.jfif`,
                        ...charData.abilities.R
                    }
                ];

                // HP és mana regeneráció időzítő indítása
                this.startRegeneration(playerId);
                
                console.log('Updated character data:', characterData);
                // Újra betöltjük a karaktert a frissített adatokkal
                this.loadCharacter(slot, characterData);
            }
        } catch (error) {
            console.error(`Error in selectCharacter for ${baseCharacter}:`, error);
        }

        document.getElementById('skin-selection-modal').style.display = 'none';

        // Lock/unlock abilities based on initial level
        const abilities = slot.querySelectorAll('.ability');
        abilities.forEach((ability, index) => {
            if (index === 3) { // A 4. képesség (R)
                ability.classList.add('locked');
            }
        });

        // Start the game timer if this is the first character selected
        if (!this.gameTimer) {
            this.startGameTimer();
        }
    }

    useAbility(slot, abilityIndex) {
        const playerId = slot.dataset.playerId;
        const character = playerId === 'player' ? this.player : this.ai[playerId];
        if (!character) return;

        // Ellenőrizzük, hogy a karakter stunned-e
        const isStunned = Array.from(this.buffs[playerId].values()).some(buff => buff.type === 'stun');
        if (isStunned) {
            this.showFloatingText(slot, "STUNNED!", 'damage');
            return;
        }

        const ability = character.abilities[abilityIndex - 1];
        if (!ability) return;

        console.log('Using ability:', ability);
        console.log('Character mana:', character.currentMana);
        console.log('Ability mana cost:', ability.manaCost);

        // Ellenőrizzük a cooldown-t
        const now = Date.now();
        if (this.cooldowns[playerId][abilityIndex] > now) {
            console.log('Ability on cooldown!');
            return;
        }

        if (character.currentMana >= ability.manaCost) {
            // Mana levonása
            character.currentMana -= ability.manaCost;
            console.log('Mana after use:', character.currentMana);

            // Képesség használata
            if (character.baseCharacter === 'Ibuki' && abilityIndex === 1) {
                this.executeIbukiQ(playerId, character, ability);
            } else {
                this.executeAbility(playerId, character, ability);
            }

            // Cooldown beállítása és vizuális megjelenítés
            this.cooldowns[playerId][abilityIndex] = now + (ability.cooldown * 1000);
            this.showCooldown(slot, abilityIndex, ability.cooldown);

            // HP és mana bar frissítése
            this.updateHealthAndMana(slot, character.currentHp, character.currentMana);

            if (playerId === 'player') {
                this.aiTeamResponse();
            }
        } else {
            console.log('Not enough mana!');
        }
    }

    // Ibuki Q képesség végrehajtása
    executeIbukiQ(playerId, character, ability) {
        const targetSlot = this.getTargetSlot(); // Implementálni kell a célpont kiválasztását
        if (!targetSlot) return;

        const targetCharacter = targetSlot.dataset.playerId === 'player' ? this.player : this.ai[targetSlot.dataset.playerId];
        if (!targetCharacter) return;

        // Találati esély ellenőrzése
        if (Math.random() * 100 > ability.hitChance) {
            console.log('Ibuki Q missed!');
            return;
        }

        // Sebzés kiszámítása
        const damage = this.calculateDamage(character, ability, 1);
        targetCharacter.currentHp = Math.max(0, targetCharacter.currentHp - damage);
        this.updateHealthAndMana(targetSlot, targetCharacter.currentHp, targetCharacter.currentMana);
        this.showFloatingText(targetSlot, damage, 'damage');

        // Debuff alkalmazása
        this.addBuff(targetSlot.dataset.playerId, {
            id: `ibuki_q_debuff_${Date.now()}`,
            name: 'Marked for Bonus Damage',
            icon: ability.debuff.icon,
            duration: ability.debuff.duration,
            type: 'debuff',
            bonusDamageMultiplier: ability.debuff.bonusDamageMultiplier
        });

        // Ha a célpont már meg van jelölve, bónusz sebzés alkalmazása
        const existingDebuff = Array.from(this.buffs[targetSlot.dataset.playerId].values()).find(buff => buff.id.startsWith('ibuki_q_debuff'));
        if (existingDebuff) {
            const bonusDamage = Math.round(damage * existingDebuff.bonusDamageMultiplier);
            targetCharacter.currentHp = Math.max(0, targetCharacter.currentHp - bonusDamage);
            this.updateHealthAndMana(targetSlot, targetCharacter.currentHp, targetCharacter.currentMana);
            this.showFloatingText(targetSlot, bonusDamage, 'damage');
            this.buffs[targetSlot.dataset.playerId].delete(existingDebuff.id);
        }
    }

    executeAbility(playerId, character, ability) {
        console.log(`${playerId} using ${ability.name}`);

        switch(ability.targeting) {
            case 'self':
                this.applySelfEffect(playerId, character, ability);
                break;
            case 'direction':
                this.applyDirectionalEffect(playerId, character, ability);
                break;
            case 'area':
                this.applyAreaEffect(playerId, character, ability);
                break;
            case 'ally':
                this.startAllyTargeting(playerId, character, ability);
                break;
            case 'enemy':
                this.startEnemyTargeting(playerId, character, ability);
                break;
            case 'instant':
                this.applyInstantEffect(playerId, character, ability);
                break;
            default:
                console.log('Unknown targeting type:', ability.targeting);
        }
    }

    applySelfEffect(playerId, character, ability) {
        if (ability.effects) {
            const effect = {
                ...ability.effects,
                startTime: Date.now(),
                ability: ability
            };
            this.activeEffects[playerId].add(effect);

            // Időzítő a hatás eltávolításához
            setTimeout(() => {
                this.activeEffects[playerId].delete(effect);
                console.log(`${ability.name} effect expired for ${playerId}`);
            }, ability.effects.duration * 1000);
        }
    }

    applyDirectionalEffect(playerId, character, ability) {
        // TODO: Implement directional targeting logic
        console.log(`Directional ability ${ability.name} used by ${playerId}`);
        
        if (ability.damage) {
            const damage = this.calculateDamage(character, ability.damage);
            console.log(`Would deal ${damage} ${ability.damage.type} damage`);
        }
    }

    applyAreaEffect(playerId, character, ability) {
        // TODO: Implement area targeting logic
        console.log(`Area ability ${ability.name} used by ${playerId}`);
        
        if (ability.damage) {
            const damage = this.calculateDamage(character, ability.damage);
            console.log(`Would deal ${damage} ${ability.damage.type} damage in ${ability.radius} radius`);
        }
    }

    calculateDamage(character, damageInfo) {
        let totalDamage = 0;

        if (damageInfo.scaling) {
            if (damageInfo.scaling.attackDamage) {
                totalDamage += character.stats.attackDamage * damageInfo.scaling.attackDamage;
            }
            if (damageInfo.scaling.bonusAttackDamage) {
                // TODO: Calculate bonus AD
                totalDamage += character.stats.attackDamage * damageInfo.scaling.bonusAttackDamage;
            }
            if (damageInfo.scaling.abilityPower) {
                totalDamage += character.stats.abilityPower * damageInfo.scaling.abilityPower;
            }
        }

        // Figyelembe vesszük az aktív hatásokat
        for (const effect of this.activeEffects[character.playerId]) {
            if (effect.damageIncrease) {
                totalDamage *= (1 + effect.damageIncrease);
            }
        }

        return Math.round(totalDamage);
    }

    loadCharacter(slot, characterData) {
        // Karakter portré beállítása
        const portraitDiv = slot.querySelector('.character-portrait');
        const img = slot.querySelector('img');
        if (characterData.portrait) {
            img.src = characterData.portrait;
            img.style.display = 'block';
            img.style.objectFit = 'cover';
            portraitDiv.innerHTML = '';

            // Modern buff konténer hozzáadása
            const buffContainer = document.createElement('div');
            buffContainer.className = 'buff-container';
            buffContainer.style.cssText = `
                position: absolute;
                bottom: 75px;
                left: 10px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                z-index: 100;
                background: linear-gradient(to bottom, rgba(15, 15, 15, 0.85), rgba(30, 30, 30, 0.85));
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 4px;
                min-width: 30px;
                min-height: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(4px);
                justify-content: flex-start;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            `;
            portraitDiv.appendChild(buffContainer);
        }

        // HP és mana beállítása
        this.updateHealthAndMana(slot, characterData.currentHp, characterData.currentMana);

        // Képességek beállítása
        const abilitiesDiv = slot.querySelector('.abilities');
        if (abilitiesDiv && characterData.abilities) {
            abilitiesDiv.innerHTML = '';
            characterData.abilities.forEach((ability, index) => {
                const abilityContainer = document.createElement('div');
                abilityContainer.className = 'ability-container';

                const upgradeButton = document.createElement('button');
                upgradeButton.className = 'upgrade-button';
                abilityContainer.appendChild(upgradeButton);

                const abilityDiv = document.createElement('div');
                abilityDiv.className = 'ability';
                const abilities = ['Q', 'W', 'E', 'R'];
                const iconPath = `Arena/abilityicons/${characterData.baseCharacter}_${abilities[index]}.jfif`;
                abilityDiv.style.backgroundImage = `url('${iconPath}')`;
                abilityDiv.dataset.ability = index + 1;

                // Hover események a képességekhez
                abilityDiv.addEventListener('mouseenter', () => {
                    const tooltipContent = this.getAbilityTooltipContent(ability, slot.dataset.playerId, index + 1);
                    this.showTooltip(abilityDiv, tooltipContent);
                    abilityDiv.style.transform = 'scale(1.1)';
                    abilityDiv.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                });

                abilityDiv.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                    abilityDiv.style.transform = 'scale(1)';
                    abilityDiv.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                });

                // Cooldown overlay
                const cooldownOverlay = document.createElement('div');
                cooldownOverlay.className = 'cooldown-overlay';

                // Cooldown szám
                const cooldownNumber = document.createElement('div');
                cooldownNumber.className = 'cooldown-number';

                // Cooldown kör
                const cooldownCircle = document.createElement('svg');
                cooldownCircle.className = 'cooldown-circle';
                cooldownCircle.innerHTML = '<circle />';

                cooldownOverlay.appendChild(cooldownCircle);
                cooldownOverlay.appendChild(cooldownNumber);
                abilityDiv.appendChild(cooldownOverlay);

                // Ha ez az R képesség és a szint < 10, akkor legyen zárolt
                if (index === 3 && this.levels[slot.dataset.playerId] < 10) {
                    abilityDiv.classList.add('locked');
                }

                abilityContainer.appendChild(abilityDiv);
                abilitiesDiv.appendChild(abilityContainer);
            });
        }
    }

    updateHealthAndMana(slot, currentHp, currentMana) {
        const character = slot.dataset.playerId === 'player' ? this.player : this.ai[slot.dataset.playerId];
        if (!character) return;

        // HP bar frissítése
        const hpBar = slot.querySelector('.hp-bar');
        const hpPercentage = (currentHp / character.maxHp) * 100;
        hpBar.style.background = `linear-gradient(90deg, #ff4757 ${hpPercentage}%, #2f3542 ${hpPercentage}%)`;
        hpBar.textContent = `${Math.round(currentHp)}/${Math.round(character.maxHp)}`;
        hpBar.style.color = 'white';
        hpBar.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)';
        hpBar.style.textAlign = 'center';
        hpBar.style.fontSize = '12px';
        hpBar.style.lineHeight = '20px';
        hpBar.style.fontWeight = 'bold';

        // Mana bar frissítése
        const manaBar = slot.querySelector('.mana-bar');
        const manaPercentage = (currentMana / character.maxMana) * 100;
        manaBar.style.background = `linear-gradient(90deg, #2e86de ${manaPercentage}%, #2f3542 ${manaPercentage}%)`;
        manaBar.textContent = `${Math.round(currentMana)}/${Math.round(character.maxMana)}`;
        manaBar.style.color = 'white';
        manaBar.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)';
        manaBar.style.textAlign = 'center';
        manaBar.style.fontSize = '12px';
        manaBar.style.lineHeight = '20px';
        manaBar.style.fontWeight = 'bold';
    }

    // AI inicializálás és viselkedés
    async initializeAllAI() {
        const aiSlots = document.querySelectorAll('[data-player-id^="ai"]');
        for (const slot of aiSlots) {
            await this.initializeAI(slot);
        }
    }

    async initializeAI(slot) {
        const availableCharacters = Object.keys(roles).flatMap(role => roles[role])
            .filter(char => !this.selectedCharacters.has(char));
        
        if (availableCharacters.length === 0) {
            console.error('No available characters for AI');
            return;
        }

        const randomChar = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        this.selectedCharacters.add(randomChar);
        
        await this.selectCharacter(slot, randomChar);
        console.log(`AI initialized with character: ${randomChar}`);
    }

    aiTeamResponse() {
        // Az AI csapat nem használ varázslatokat
        return;
    }

    startAllyTargeting(playerId, character, ability) {
        // Targeting állapot beállítása
        this.currentTargeting = {
            sourceId: playerId,
            character: character,
            ability: ability
        };

        // Overlay létrehozása
        const overlay = document.createElement('div');
        overlay.id = 'targeting-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Célpontok kiemelése
        const slots = document.querySelectorAll('.player-slot');
        slots.forEach(slot => {
            // Ellenőrizzük, hogy szövetséges-e (ugyanazon a csapaton van-e) vagy saját maga
            const isAlly = (playerId === 'player' && slot.closest('.team-1')) || 
                          (playerId.startsWith('ai') && slot.closest('.team-2'));
            const isSelf = slot.dataset.playerId === playerId;
            
            // Julia Q képessége nem célozhatja önmagát
            if (character.baseCharacter === 'Julia' && ability === character.abilities[0] && isSelf) {
                return;
            }
            
            if (isAlly || (isSelf && ability !== character.abilities[0])) {
                // Célpont konténer létrehozása
                const targetContainer = document.createElement('div');
                targetContainer.className = 'target-container';
                targetContainer.style.cssText = `
                    position: absolute;
                    top: -15px;
                    left: -15px;
                    right: -15px;
                    bottom: -15px;
                    z-index: 101;
                    pointer-events: auto;
                    cursor: pointer;
                `;

                // Célpont jelző létrehozása
                const targetIndicator = document.createElement('div');
                targetIndicator.className = 'target-indicator';
                targetIndicator.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border: 3px solid #4CAF50;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
                    animation: targetPulse 1.5s infinite;
                    pointer-events: none;
                `;

                // "Szövetséges" vagy "Önmagad" felirat
                const allyLabel = document.createElement('div');
                allyLabel.className = 'ally-label';
                allyLabel.textContent = isSelf ? 'Önmagad' : 'Szövetséges';
                allyLabel.style.cssText = `
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(76, 175, 80, 0.9);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    pointer-events: none;
                `;

                // Fénylő háttér a slot mögé
                const glowEffect = document.createElement('div');
                glowEffect.className = 'glow-effect';
                glowEffect.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0) 70%);
                    pointer-events: none;
                    z-index: -1;
                `;

                targetContainer.appendChild(glowEffect);
                targetContainer.appendChild(targetIndicator);
                targetContainer.appendChild(allyLabel);

                // Click esemény
                targetContainer.addEventListener('click', () => {
                    this.applyAllyEffect(playerId, character, ability, slot.dataset.playerId);
                    this.clearTargeting();
                });

                // Hover effektek
                targetContainer.addEventListener('mouseenter', () => {
                    targetIndicator.style.borderColor = '#69F0AE';
                    targetIndicator.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.8)';
                    glowEffect.style.background = 'radial-gradient(circle, rgba(76, 175, 80, 0.4) 0%, rgba(76, 175, 80, 0) 70%)';
                });

                targetContainer.addEventListener('mouseleave', () => {
                    targetIndicator.style.borderColor = '#4CAF50';
                    targetIndicator.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
                    glowEffect.style.background = 'radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0) 70%)';
                });

                slot.style.position = 'relative';
                slot.appendChild(targetContainer);
            }
        });

        // ESC kezelése
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.clearTargeting();
            }
        };
        document.addEventListener('keydown', escHandler);
        this.currentEscHandler = escHandler;

        // Stílusok hozzáadása
        const style = document.createElement('style');
        style.textContent = `
            @keyframes targetPulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.05); opacity: 0.6; }
                100% { transform: scale(1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    clearTargeting() {
        // Overlay eltávolítása
        const overlay = document.getElementById('targeting-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Célpont konténerek és effektek eltávolítása
        document.querySelectorAll('.target-container').forEach(container => {
            container.remove();
        });

        // ESC handler eltávolítása
        if (this.currentEscHandler) {
            document.removeEventListener('keydown', this.currentEscHandler);
            this.currentEscHandler = null;
        }

        // Targeting állapot törlése
        this.currentTargeting = null;
    }

    applyAllyEffect(sourcePlayerId, sourceCharacter, ability, targetPlayerId) {
        const targetSlot = document.querySelector(`[data-player-id="${targetPlayerId}"]`);
        const targetCharacter = targetPlayerId === 'player' ? this.player : this.ai[targetPlayerId];
        
        if (!targetCharacter) return;

        // Buff kezelése
        if (ability.effects && ability.effects.buff) {
            const buffEffect = ability.effects.buff;
            const buffId = `${ability.name}_${Date.now()}`;
            
            // Buff ikon létrehozása
            this.addBuff(targetPlayerId, {
                id: buffId,
                name: buffEffect.name,
                icon: buffEffect.icon,
                duration: buffEffect.duration,
                healPercent: buffEffect.healPercent[this.abilityLevels[sourcePlayerId][2] - 1],
                maxHp: targetCharacter.maxHp
            });
        }

        // Meglévő heal és speedBoost effektek kezelése
        if (ability.effects && ability.effects.heal) {
            // Debug log
            console.log('Healing ability used:', ability);
            console.log('Heal effect:', ability.effects.heal);
            
            // Alap gyógyítás érték kiszámítása
            let healAmount = ability.effects.heal.value;
            console.log('Base heal amount:', healAmount);
            
            if (typeof healAmount !== 'number' || isNaN(healAmount)) {
                console.error('Invalid heal amount:', healAmount);
                healAmount = 90; // Alapértelmezett érték
            }
            
            if (ability.effects.heal.isPercentage) {
                healAmount = Math.round((targetCharacter.maxHp * healAmount) / 100);
            }
            
            healAmount = Math.round(healAmount);
            console.log('Final calculated heal amount:', healAmount);
            
            // Tényleges gyógyítás kiszámítása a célpontra
            const targetCurrentHp = targetCharacter.currentHp;
            targetCharacter.currentHp = Math.min(targetCharacter.maxHp, targetCharacter.currentHp + healAmount);
            const actualTargetHeal = Math.round(targetCharacter.currentHp - targetCurrentHp);
            
            console.log('Actual heal applied:', actualTargetHeal);
            
            // Lebegő szöveg megjelenítése
            if (actualTargetHeal > 0) {
                this.showFloatingText(targetSlot, `+${actualTargetHeal}`, 'heal');
            } else {
                this.showFloatingText(targetSlot, `+${healAmount}`, 'heal', false, true);
            }
            
            // Gyógyítás alkalmazása a forrásra (Julia)
            if (sourcePlayerId !== targetPlayerId) {
                const sourceCurrentHp = sourceCharacter.currentHp;
                sourceCharacter.currentHp = Math.min(sourceCharacter.maxHp, sourceCharacter.currentHp + healAmount);
                const actualSourceHeal = Math.round(sourceCharacter.currentHp - sourceCurrentHp);
                
                const sourceSlot = document.querySelector(`[data-player-id="${sourcePlayerId}"]`);
                if (actualSourceHeal > 0) {
                    this.showFloatingText(sourceSlot, `+${actualSourceHeal}`, 'heal');
                } else {
                    this.showFloatingText(sourceSlot, `+${healAmount}`, 'heal', false, true);
                }
            }

            // Vizuális visszajelzés
            const targetImg = targetSlot.querySelector('img');
            targetImg.style.filter = 'sepia(100%) hue-rotate(90deg) saturate(200%)';
            setTimeout(() => {
                targetImg.style.filter = '';
            }, 350);

            // Ha nem önmagát gyógyította, akkor a forrás karakteren is megjelenítjük a hatást
            if (sourcePlayerId !== targetPlayerId) {
                const sourceSlot = document.querySelector(`[data-player-id="${sourcePlayerId}"]`);
                const sourceImg = sourceSlot.querySelector('img');
                sourceImg.style.filter = 'sepia(100%) hue-rotate(90deg) saturate(200%)';
                setTimeout(() => {
                    sourceImg.style.filter = '';
                }, 350);
            }

            // HP bar frissítése
            this.updateHealthAndMana(targetSlot, targetCharacter.currentHp, targetCharacter.currentMana);
            if (sourcePlayerId !== targetPlayerId) {
                const sourceSlot = document.querySelector(`[data-player-id="${sourcePlayerId}"]`);
                this.updateHealthAndMana(sourceSlot, sourceCharacter.currentHp, sourceCharacter.currentMana);
            }
        }

        // Sebesség növelés alkalmazása
        if (ability.effects.speedBoost) {
            const speedBoost = ability.effects.speedBoost;
            const duration = speedBoost.duration * 1000; // Másodpercből milliszekundumba
            
            // Sebesség növelés effekt hozzáadása
            targetCharacter.stats.movementSpeed = (targetCharacter.stats.movementSpeed || 0) + speedBoost.value;
            
            // Időzítő a sebesség növelés eltávolításához
            setTimeout(() => {
                targetCharacter.stats.movementSpeed = (targetCharacter.stats.movementSpeed || 0) - speedBoost.value;
            }, duration);
        }
    }

    showCooldown(slot, abilityIndex, cooldownTime) {
        const abilityContainer = slot.querySelector(`.ability-container:nth-child(${abilityIndex})`);
        if (!abilityContainer) return;

        const abilityDiv = abilityContainer.querySelector('.ability');
        if (!abilityDiv) return;

        const cooldownOverlay = abilityDiv.querySelector('.cooldown-overlay');
        const cooldownNumber = abilityDiv.querySelector('.cooldown-number');
        const circle = abilityDiv.querySelector('circle');

        if (!cooldownOverlay || !cooldownNumber || !circle) return;

        // Cooldown overlay megjelenítése
        cooldownOverlay.style.display = 'flex';
        circle.style.display = 'block';

        // Körkörösen csökkenő animáció beállítása
        const circumference = parseFloat(circle.getAttribute('stroke-dasharray') || '138.2');
        let timeLeft = cooldownTime;
        
        const updateCooldown = () => {
            if (timeLeft <= 0) {
                cooldownOverlay.style.display = 'none';
                circle.style.display = 'none';
                return;
            }

            // Cooldown szám frissítése
            cooldownNumber.textContent = Math.ceil(timeLeft);

            // Kör animáció frissítése
            const progress = timeLeft / cooldownTime;
            const dashoffset = circumference * (1 - progress);
            circle.style.strokeDashoffset = dashoffset;

            timeLeft -= 0.1;
            setTimeout(updateCooldown, 100);
        };

        updateCooldown();
    }

    showFloatingText(slot, text, type = 'heal', isCrit = false, isBlocked = false) {
        const floatingText = document.createElement('div');
        floatingText.className = `floating-text ${type}${isCrit ? ' crit' : ''}${isBlocked ? ' blocked' : ''}`;
        
        // Előjel hozzáadása és szám kerekítése
        if (typeof text === 'number') {
            if (type === 'heal') {
                text = '+' + Math.round(text);
                if (isBlocked) {
                    text += ' (BLOCKED)';
                }
            } else if (type === 'damage') {
                text = '-' + Math.round(text);
            }
        }
        
        floatingText.textContent = text;

        // Random X offset a szöveg pozíciójához
        const randomOffset = (Math.random() - 0.5) * 40;
        floatingText.style.transform = `translate(calc(-50% + ${randomOffset}px), 0)`;

        slot.appendChild(floatingText);

        // Automatikus eltávolítás az animáció végén
        setTimeout(() => {
            floatingText.remove();
        }, 1500);
    }

    // Példa sebzés megjelenítésére (később használható)
    applyDamage(targetSlot, targetCharacter, damageAmount, isCrit = false) {
        const roundedDamage = Math.round(damageAmount);
        targetCharacter.currentHp = Math.max(0, targetCharacter.currentHp - roundedDamage);
        this.showFloatingText(targetSlot, roundedDamage, 'damage', isCrit);
        this.updateHealthAndMana(targetSlot, targetCharacter.currentHp, targetCharacter.currentMana);
    }

    startGameTimer() {
        const timerDisplay = document.querySelector('.timer-display');
        this.gameTime = 0;
        
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Minden percben XP növelés
            if (this.gameTime > 0 && this.gameTime % 60 === 0) {
                this.giveXPToAll();
            }
        }, 1000);
    }

    giveXPToAll() {
        Object.keys(this.xp).forEach(playerId => {
            const slot = document.querySelector(`[data-player-id="${playerId}"]`);
            if (slot.querySelector('.character-portrait').textContent === '') {
                this.giveXP(playerId);
            }
        });
    }

    giveXP(playerId) {
        const currentLevel = this.levels[playerId];
        const xpGain = 50; // Alap XP gain percenként
        
        this.xp[playerId] += xpGain;
        this.updateXPDisplay(playerId);
        
        // Ellenőrizzük a szintlépést
        const nextLevel = currentLevel + 1;
        if (nextLevel in this.xpThresholds && this.xp[playerId] >= this.xpThresholds[nextLevel]) {
            this.levelUp(playerId);
        }
    }

    updateXPDisplay(playerId) {
        const slot = document.querySelector(`[data-player-id="${playerId}"]`);
        const levelDisplay = slot.querySelector('.level-display');
        const levelNumber = levelDisplay.querySelector('.level-number');
        const progressCircle = levelDisplay.querySelector('.fg');
        
        const currentLevel = this.levels[playerId];
        const currentXP = this.xp[playerId];
        
        // Számoljuk ki a következő szinthez szükséges XP-t
        const currentLevelXP = currentLevel === 1 ? 0 : this.xpThresholds[currentLevel];
        const nextLevelXP = this.xpThresholds[currentLevel + 1] || this.xpThresholds[24];
        
        // Számoljuk ki a progress százalékot
        const xpInCurrentLevel = currentXP - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const progress = xpInCurrentLevel / xpNeededForNextLevel;
        
        // Frissítsük a megjelenítést
        levelNumber.textContent = currentLevel;
        const circumference = 2 * Math.PI * 22; // r = 22 a körnek
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference * (1 - progress);

        // Tooltip frissítése
        const tooltip = levelDisplay.querySelector('.xp-tooltip') || document.createElement('div');
        tooltip.className = 'xp-tooltip';
        tooltip.textContent = `${xpInCurrentLevel}/${xpNeededForNextLevel} XP`;
        
        if (!levelDisplay.querySelector('.xp-tooltip')) {
            levelDisplay.appendChild(tooltip);
            
            // Hover események
            levelDisplay.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
            });
            
            levelDisplay.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }
    }

    levelUp(playerId) {
        console.log('Level Up triggered for:', playerId);
        this.levels[playerId]++;
        const slot = document.querySelector(`[data-player-id="${playerId}"]`);
        console.log('Found slot:', slot);
        const levelUpIndicator = slot.querySelector('.level-up-indicator');
        
        // Frissítsük az XP megjelenítést
        this.updateXPDisplay(playerId);
        
        // Mutassuk a szintlépés jelzőt
        if (levelUpIndicator) {
            levelUpIndicator.style.display = 'block';
            levelUpIndicator.textContent = 'Upgrade!';
        }
        
        // Képességek kezelése
        const abilityContainers = slot.querySelectorAll('.ability-container');
        console.log('Found ability containers:', abilityContainers.length);
        
        abilityContainers.forEach((container, index) => {
            const ability = container.querySelector('.ability');
            const upgradeButton = container.querySelector('.upgrade-button');
            const abilityKey = index + 1;
            
            console.log(`Processing ability ${abilityKey}:`, {
                currentLevel: this.abilityLevels[playerId][abilityKey],
                isLocked: ability.classList.contains('locked'),
                playerLevel: this.levels[playerId]
            });
            
            // R képesség kezelése
            if (abilityKey === 4) {
                if (this.levels[playerId] >= 10) {
                    ability.classList.remove('locked');
                    console.log('Unlocking R ability - player reached level 10');
                } else {
                    ability.classList.add('locked');
                    console.log('R ability remains locked - player below level 10');
                }
                return; // R képességet nem lehet fejleszteni
            }
            
            // Csak akkor mutatjuk az upgrade gombot, ha még fejleszthető a képesség (most 5 helyett 6 a maximum)
            if (this.abilityLevels[playerId][abilityKey] < 6) {
                console.log(`Showing upgrade button for ability ${abilityKey}`);
                upgradeButton.style.display = 'block';
                upgradeButton.classList.add('show');
                
                upgradeButton.onclick = () => {
                    console.log(`Upgrade button clicked for ability ${abilityKey}`);
                    this.upgradeAbility(playerId, abilityKey);
                    
                    // Elrejtjük az összes upgrade gombot és a level up jelzőt
                    abilityContainers.forEach(cont => {
                        const btn = cont.querySelector('.upgrade-button');
                        if (btn) {
                            btn.style.display = 'none';
                            btn.classList.remove('show');
                        }
                    });
                    
                    if (levelUpIndicator) {
                        levelUpIndicator.style.display = 'none';
                    }
                };
            } else {
                console.log(`Ability ${abilityKey} already at max level`);
                if (upgradeButton) {
                    upgradeButton.style.display = 'none';
                    upgradeButton.classList.remove('show');
                }
            }
        });

        // Ha AI karakter, automatikusan fejleszt egy képességet
        if (playerId !== 'player') {
            console.log('AI auto-upgrade');
            const availableAbilities = [1, 2, 3].filter(key => 
                this.abilityLevels[playerId][key] < 6
            );
            if (availableAbilities.length > 0) {
                const randomAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
                this.upgradeAbility(playerId, randomAbility);
                if (levelUpIndicator) {
                    levelUpIndicator.style.display = 'none';
                }
            }
        }
    }

    showAbilityUpgradeUI(playerId) {
        const modal = document.getElementById('ability-upgrade-modal');
        const optionsContainer = modal.querySelector('.ability-upgrade-options');
        const confirmButton = modal.querySelector('.confirm-upgrade-btn');
        const character = playerId === 'player' ? this.player : this.ai[playerId];
        
        if (!character || !character.abilities) return;

        modal.style.display = 'block';
        optionsContainer.innerHTML = '';
        let selectedAbility = null;

        // Csak az első 3 képességet jelenítjük meg (1, 2, 3)
        for(let i = 1; i <= 3; i++) {
            const currentLevel = this.abilityLevels[playerId][i];
            if (currentLevel >= 6) continue;

            const ability = character.abilities[i-1];
            if (!ability) continue;

            const option = document.createElement('div');
            option.className = 'ability-upgrade-option';
            
            option.innerHTML = `
                <div class="ability-icon" style="background-image: url(${ability.icon || ''})"></div>
                <div class="ability-name">${ability.name || `Ability ${i}`}</div>
                <div class="ability-upgrade-description">
                    Level: ${currentLevel} → ${currentLevel + 1}
                </div>
            `;

            option.addEventListener('click', () => {
                document.querySelectorAll('.ability-upgrade-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                selectedAbility = i;
            });

            optionsContainer.appendChild(option);
        }

        confirmButton.onclick = () => {
            if (selectedAbility) {
                this.upgradeAbility(playerId, selectedAbility);
                modal.style.display = 'none';
                
                // Elrejtjük az összes upgrade gombot és a level up jelzőt
                const slot = document.querySelector(`[data-player-id="${playerId}"]`);
                const upgradeButtons = slot.querySelectorAll('.upgrade-button');
                const levelUpIndicator = slot.querySelector('.level-up-indicator');
                
                upgradeButtons.forEach(btn => btn.classList.remove('show'));
                levelUpIndicator.style.display = 'none';
            }
        };
    }

    upgradeAbility(playerId, abilityKey) {
        const currentLevel = this.abilityLevels[playerId][abilityKey];
        if (currentLevel >= 6) return; // Maximum 6 szint

        this.abilityLevels[playerId][abilityKey]++;
        console.log(`Upgrading ability ${abilityKey} for ${playerId} to level ${this.abilityLevels[playerId][abilityKey]}`);
        
        // Frissítsük a képesség ikonját vagy jelzését
        const slot = document.querySelector(`[data-player-id="${playerId}"]`);
        const abilityElement = slot.querySelector(`.ability[data-ability="${abilityKey}"]`);
        
        if (abilityElement) {
            // Képesség szint megjelenítése
            const levelIndicator = abilityElement.querySelector('.ability-level') || document.createElement('div');
            levelIndicator.className = 'ability-level';
            levelIndicator.textContent = this.abilityLevels[playerId][abilityKey];
            if (!abilityElement.querySelector('.ability-level')) {
                abilityElement.appendChild(levelIndicator);
            }
            
            // Rövid animáció a fejlesztés jelzésére
            abilityElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                abilityElement.style.transform = 'scale(1)';
            }, 200);
        }

        // Frissítsük a karakter képességeit
        const character = playerId === 'player' ? this.player : this.ai[playerId];
        if (character) {
            console.log('Updating character abilities after upgrade:', character);
            this.updateAbilityValues(character, abilityKey);
        }
    }

    updateAbilityValues(character, abilityKey) {
        const baseCharacter = character.baseCharacter;
        const playerId = character.playerId;
        
        if (!playerId) {
            console.error('Could not find playerId for character:', character);
            return;
        }

        const abilityLevel = this.abilityLevels[playerId][abilityKey];
        console.log(`Updating ability values for ${baseCharacter}, ability ${abilityKey}, level ${abilityLevel}`);
        
        if (this.abilityScales[baseCharacter] && this.abilityScales[baseCharacter][abilityKey]) {
            const scales = this.abilityScales[baseCharacter][abilityKey];
            console.log('Ability scales:', scales);
            
            if (character.abilities[abilityKey-1]) {
                const ability = character.abilities[abilityKey-1];
                
                if (baseCharacter === 'Julia') {
                    switch(abilityKey) {
                        case 1: // Q - Windblower
                            const healValue = scales.healing[abilityLevel - 1];
                            console.log('Setting heal value to:', healValue);
                            ability.effects = {
                                heal: {
                                    value: healValue,
                                    scaling: { level: scales.healing }
                                },
                                speedBoost: {
                                    value: scales.speedBoost,
                                    duration: scales.duration
                                }
                            };
                            ability.manaCost = scales.manaCost;
                            ability.cooldown = scales.cooldown;
                            console.log('Updated Windblower ability:', ability);
                            break;

                        case 2: // W - Building Nature
                            ability.manaCost = scales.manaCost;
                            ability.cooldown = scales.cooldown;
                            ability.effects = {
                                buff: {
                                    name: "Nature's Blessing",
                                    icon: `Arena/abilityicons/${baseCharacter}_W.jfif`,
                                    duration: 6,
                                    healPercent: scales.healPercent
                                }
                            };
                            console.log('Updated Building Nature ability:', ability);
                            break;

                        case 3: // E - Knockback attack
                            ability.manaCost = scales.manaCost;
                            ability.cooldown = scales.cooldown;
                            ability.effects = {
                                damage: {
                                    value: scales.damage[abilityLevel - 1],
                                    scaling: { level: scales.damage }
                                },
                                debuff: {
                                    name: "Stunned",
                                    icon: `Arena/abilityicons/${baseCharacter}_E.jfif`,
                                    type: "stun",
                                    chance: scales.stunChance,
                                    duration: scales.stunDuration
                                }
                            };
                            console.log('Updated Knockback attack ability:', ability);
                            break;

                        case 4: // R - Strength of Spirits
                            ability.targeting = 'instant';
                            ability.manaCost = scales.manaCost;
                            ability.cooldown = scales.cooldown;
                            ability.effects = {
                                heal: {
                                    isPercentage: true,
                                    value: scales.healPercent[Math.min(2, abilityLevel - 1)]
                                }
                            };
                            break;
                    }
                }
            }
        }
    }

    addBuff(playerId, buffData) {
        const slot = document.querySelector(`[data-player-id="${playerId}"]`);
        const buffContainer = slot.querySelector('.buff-container');
        
        // Konténer láthatóvá tétele
        buffContainer.style.opacity = '1';
        buffContainer.style.visibility = 'visible';

        // Modern buff ikon létrehozása
        const buffIcon = document.createElement('div');
        buffIcon.className = 'buff-icon';
        buffIcon.style.cssText = `
            width: 26px;
            height: 26px;
            border-radius: 5px;
            background-image: url('${buffData.icon}');
            background-size: cover;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
            cursor: help;
        `;

        // Timer overlay modernebb megjelenéssel
        const timerOverlay = document.createElement('div');
        timerOverlay.className = 'buff-timer';
        timerOverlay.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, ${buffData.type === 'stun' ? '#ff4757, #ff6b81' : '#4CAF50, #81C784'});
            transform-origin: left;
            border-radius: 0 0 4px 4px;
            box-shadow: 0 0 4px ${buffData.type === 'stun' ? 'rgba(255, 71, 87, 0.4)' : 'rgba(76, 175, 80, 0.4)'};
        `;
        buffIcon.appendChild(timerOverlay);

        // Tooltip tartalom
        const tooltipContent = buffData.type === 'stun' ? `
            <div style="font-weight: bold; color: #ff4757; margin-bottom: 4px; font-size: 13px;">
                ${buffData.name}
            </div>
            <div style="color: #E0E0E0; margin-bottom: 4px;">
                Stunned
            </div>
            <div style="color: #9E9E9E; font-size: 11px;">
                Cannot use abilities for ${buffData.duration} seconds
            </div>
        ` : `
            <div style="font-weight: bold; color: #81C784; margin-bottom: 4px; font-size: 13px;">
                ${buffData.name}
            </div>
            <div style="color: #E0E0E0; margin-bottom: 4px;">
                Delayed Healing
            </div>
            <div style="color: #9E9E9E; font-size: 11px;">
                After ${buffData.duration} seconds, heals for ${buffData.healPercent}% of maximum health
            </div>
        `;

        // Fejlesztett hover események
        buffIcon.addEventListener('mouseenter', () => {
            this.showTooltip(buffIcon, tooltipContent);
            buffIcon.style.transform = 'scale(1.1)';
            buffIcon.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            buffIcon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        });

        buffIcon.addEventListener('mouseleave', () => {
            this.hideTooltip();
            buffIcon.style.transform = 'scale(1)';
            buffIcon.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            buffIcon.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        });

        buffContainer.appendChild(buffIcon);

        // Buff tárolása
        this.buffs[playerId].set(buffData.id, {
            ...buffData,
            element: buffIcon,
            timer: timerOverlay
        });

        // Ha stun, akkor szürkítsük ki a képességeket és tegyük őket használhatatlanná
        if (buffData.type === 'stun') {
            const abilities = slot.querySelectorAll('.ability');
            abilities.forEach(ability => {
                ability.style.filter = 'grayscale(100%) brightness(70%)';
                ability.style.pointerEvents = 'none'; // Letiltjuk a kattintást
                ability.style.cursor = 'not-allowed';
            });
            // Mutassuk a STUNNED! feliratot
            this.showFloatingText(slot, "STUNNED!", 'damage', true);
        }

        // Timer animáció és buff eltávolítás
        const startTime = Date.now();
        const duration = buffData.duration * 1000;
        
        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = duration - elapsed;
            
            if (remaining <= 0) {
                // Ha stun volt, állítsuk vissza a képességek megjelenését és működését
                if (buffData.type === 'stun') {
                    const abilities = slot.querySelectorAll('.ability');
                    abilities.forEach(ability => {
                        ability.style.filter = '';
                        ability.style.pointerEvents = ''; // Visszaállítjuk a kattinthatóságot
                        ability.style.cursor = 'pointer';
                    });
                } else if (buffData.healPercent) {
                    // Csak ha gyógyító buff volt
                    const targetCharacter = playerId === 'player' ? this.player : this.ai[playerId];
                    const healAmount = Math.round(buffData.maxHp * (buffData.healPercent / 100));
                    
                    targetCharacter.currentHp = Math.min(targetCharacter.maxHp, targetCharacter.currentHp + healAmount);
                    this.updateHealthAndMana(slot, targetCharacter.currentHp, targetCharacter.currentMana);
                    this.showFloatingText(slot, healAmount, 'heal');
                }
                
                // Buff eltávolítása
                buffIcon.remove();
                this.buffs[playerId].delete(buffData.id);

                // Ha nincs több buff, elrejtjük a konténert
                if (this.buffs[playerId].size === 0) {
                    buffContainer.style.opacity = '0';
                    buffContainer.style.visibility = 'hidden';
                }
                return;
            }

            // Timer frissítése
            const progress = remaining / duration;
            timerOverlay.style.transform = `scaleX(${progress})`;
            requestAnimationFrame(updateTimer);
        };

        requestAnimationFrame(updateTimer);
    }

    // Új általános tooltip kezelő metódus
    showTooltip(element, content) {
        // Ha van aktív tooltip, eltávolítjuk
        if (this.activeTooltip) {
            this.activeTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'game-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: all 0.2s ease;
            background: linear-gradient(to bottom, rgba(15, 15, 15, 0.95), rgba(30, 30, 30, 0.95));
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: normal;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            z-index: 9999;
            min-width: 200px;
            max-width: 300px;
        `;

        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);
        this.activeTooltip = tooltip;

        const updatePosition = () => {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        };

        // Kezdeti pozícionálás
        updatePosition();
        // Kis késleltetéssel újra pozícionáljuk (a tartalom betöltése után)
        setTimeout(updatePosition, 0);

        tooltip.style.opacity = '1';
        return tooltip;
    }

    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.style.opacity = '0';
            setTimeout(() => {
                if (this.activeTooltip) {
                    this.activeTooltip.remove();
                    this.activeTooltip = null;
                }
            }, 200);
        }
    }

    // Segédmetódus a képesség leírás generálásához
    getAbilityDescription(ability, playerId, abilityIndex) {
        let description = '';
        
        if (ability.effects) {
            if (ability.effects.heal) {
                let healValue;
                if (ability.effects.heal.isPercentage) {
                    const currentLevel = this.abilityLevels[playerId]?.[abilityIndex] || 1;
                    const scales = this.abilityScales[this.player.baseCharacter]?.[abilityIndex];
                    if (scales && scales.healPercent) {
                        healValue = scales.healPercent[Math.min(2, currentLevel - 1)];
                        const nextLevel = currentLevel < 3 ? scales.healPercent[currentLevel] : null;
                        
                        description += `Heals all allies to ${healValue}% of their maximum HP`;
                        if (nextLevel) {
                            description += ` → ${nextLevel}%`;
                        }
                        description += ` (Level ${currentLevel})`;
                    }
                } else {
                    healValue = ability.effects.heal.value || ability.effects.heal.base;
                    description += `Heals for ${healValue}`;
                }
                
                if (ability.effects.speedBoost) {
                    description += ` and grants ${ability.effects.speedBoost.value}% movement speed for ${ability.effects.speedBoost.duration}s`;
                }
            } else if (ability.effects.buff) {
                const currentLevel = this.abilityLevels[playerId]?.[abilityIndex] || 1;
                const healPercent = ability.effects.buff.healPercent[currentLevel - 1];
                const nextLevel = currentLevel < 6 ? ability.effects.buff.healPercent[currentLevel] : null;
                
                description += `Places a buff that heals for ${healPercent}%`;
                if (nextLevel) {
                    description += ` → ${nextLevel}%`;
                }
                description += ` of max health after ${ability.effects.buff.duration}s (Level ${currentLevel})`;
            } else if (ability.effects.damage || ability.effects.stun) {
                const currentLevel = this.abilityLevels[playerId]?.[abilityIndex] || 1;
                const scales = this.abilityScales[this.player.baseCharacter]?.[abilityIndex];
                
                if (scales && scales.damage) {
                    const currentDamage = scales.damage[currentLevel - 1];
                    const nextDamage = currentLevel < 6 ? scales.damage[currentLevel] : null;
                    
                    description += `Deals ${currentDamage} damage`;
                    if (nextDamage) {
                        description += ` → ${nextDamage}`;
                    }
                    description += ` (Level ${currentLevel})`;
                }
                
                if (scales && scales.stunChance) {
                    description += `\n${scales.stunChance}% chance to stun the target for ${scales.stunDuration}s`;
                }
            }
        }

        return description || 'No description available';
    }

    // Új metódus a képesség tooltip tartalmának generálásához
    getAbilityTooltipContent(ability, playerId, abilityIndex) {
        return `
            <div style="font-weight: bold; color: #81C784; margin-bottom: 4px; font-size: 13px;">
                ${ability.name}
            </div>
            <div style="color: #E0E0E0; margin-bottom: 4px;">
                Mana Cost: ${ability.manaCost}
                <span style="margin-left: 10px;">Cooldown: ${ability.cooldown}s</span>
            </div>
            <div style="color: #9E9E9E; font-size: 11px;">
                ${this.getAbilityDescription(ability, playerId, abilityIndex)}
            </div>
        `;
    }

    // Új metódus az ellenség célzáshoz
    startEnemyTargeting(playerId, character, ability) {
        // Targeting állapot beállítása
        this.currentTargeting = {
            sourceId: playerId,
            character: character,
            ability: ability
        };

        // Overlay létrehozása
        const overlay = document.createElement('div');
        overlay.id = 'targeting-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Célpontok kiemelése
        const slots = document.querySelectorAll('.player-slot');
        slots.forEach(slot => {
            // Ellenőrizzük, hogy ellenség-e (másik csapatban van-e)
            const isEnemy = (playerId === 'player' && slot.closest('.team-2')) || 
                          (playerId.startsWith('ai') && slot.closest('.team-1'));
            
            if (isEnemy) {
                // Célpont konténer létrehozása
                const targetContainer = document.createElement('div');
                targetContainer.className = 'target-container';
                targetContainer.style.cssText = `
                    position: absolute;
                    top: -15px;
                    left: -15px;
                    right: -15px;
                    bottom: -15px;
                    z-index: 101;
                    pointer-events: auto;
                    cursor: pointer;
                `;

                // Célpont jelző létrehozása
                const targetIndicator = document.createElement('div');
                targetIndicator.className = 'target-indicator';
                targetIndicator.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border: 3px solid #ff4757;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(255, 71, 87, 0.5);
                    animation: targetPulse 1.5s infinite;
                    pointer-events: none;
                `;

                // "Ellenség" felirat
                const enemyLabel = document.createElement('div');
                enemyLabel.className = 'enemy-label';
                enemyLabel.textContent = 'Ellenség';
                enemyLabel.style.cssText = `
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 71, 87, 0.9);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    pointer-events: none;
                `;

                // Fénylő háttér
                const glowEffect = document.createElement('div');
                glowEffect.className = 'glow-effect';
                glowEffect.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle, rgba(255, 71, 87, 0.2) 0%, rgba(255, 71, 87, 0) 70%);
                    pointer-events: none;
                    z-index: -1;
                `;

                targetContainer.appendChild(glowEffect);
                targetContainer.appendChild(targetIndicator);
                targetContainer.appendChild(enemyLabel);

                // Click esemény
                targetContainer.addEventListener('click', () => {
                    this.applyEnemyEffect(playerId, character, ability, slot.dataset.playerId);
                    this.clearTargeting();
                });

                // Hover effektek
                targetContainer.addEventListener('mouseenter', () => {
                    targetIndicator.style.borderColor = '#ff6b81';
                    targetIndicator.style.boxShadow = '0 0 30px rgba(255, 71, 87, 0.8)';
                    glowEffect.style.background = 'radial-gradient(circle, rgba(255, 71, 87, 0.4) 0%, rgba(255, 71, 87, 0) 70%)';
                });

                targetContainer.addEventListener('mouseleave', () => {
                    targetIndicator.style.borderColor = '#ff4757';
                    targetIndicator.style.boxShadow = '0 0 20px rgba(255, 71, 87, 0.5)';
                    glowEffect.style.background = 'radial-gradient(circle, rgba(255, 71, 87, 0.2) 0%, rgba(255, 71, 87, 0) 70%)';
                });

                slot.style.position = 'relative';
                slot.appendChild(targetContainer);
            }
        });

        // ESC kezelése
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.clearTargeting();
            }
        };
        document.addEventListener('keydown', escHandler);
        this.currentEscHandler = escHandler;
    }

    // Új metódus az ellenségre ható képességek alkalmazásához
    applyEnemyEffect(sourcePlayerId, sourceCharacter, ability, targetPlayerId) {
        const targetSlot = document.querySelector(`[data-player-id="${targetPlayerId}"]`);
        const targetCharacter = targetPlayerId === 'player' ? this.player : this.ai[targetPlayerId];
        
        if (!targetCharacter) return;

        // Sebzés alkalmazása
        if (ability.effects.damage) {
            const damageAmount = this.calculateDamage(sourceCharacter, ability.effects.damage, 3);
            
            targetCharacter.currentHp = Math.max(0, targetCharacter.currentHp - damageAmount);
            this.updateHealthAndMana(targetSlot, targetCharacter.currentHp, targetCharacter.currentMana);
            this.showFloatingText(targetSlot, damageAmount, 'damage');

            // Stun esély ellenőrzése
            if (ability.effects.debuff && ability.effects.debuff.type === 'stun') {
                const stunChance = ability.effects.debuff.chance;
                if (Math.random() * 100 < stunChance) {
                    // Stun debuff hozzáadása
                    this.addBuff(targetPlayerId, {
                        id: `stun_${Date.now()}`,
                        name: ability.effects.debuff.name,
                        icon: ability.effects.debuff.icon,
                        duration: ability.effects.debuff.duration,
                        type: 'stun'
                    });
                }
            }
        }
    }

    startRegeneration(playerId) {
        // 0.5 másodpercenként frissítjük a regenerációt
        setInterval(() => {
            const character = playerId === 'player' ? this.player : this.ai[playerId];
            if (!character) return;

            const now = Date.now();
            const timeDiff = (now - character.lastRegenTime) / 1000; // másodpercekben
            character.lastRegenTime = now;

            // HP regeneráció
            if (character.currentHp < character.maxHp) {
                character.currentHp = Math.min(
                    character.maxHp,
                    character.currentHp + (character.stats.hpRegen * timeDiff)
                );
            }

            // Mana regeneráció
            if (character.currentMana < character.maxMana) {
                character.currentMana = Math.min(
                    character.maxMana,
                    character.currentMana + (character.stats.manaRegen * timeDiff)
                );
            }

            // UI frissítése
            const slot = document.querySelector(`[data-player-id="${playerId}"]`);
            if (slot) {
                this.updateHealthAndMana(slot, character.currentHp, character.currentMana);
            }
        }, 500);
    }

    // Frissített sebzés számítás
    calculateDamage(character, damageInfo, abilityIndex) {
        let totalDamage = Math.round(damageInfo.base || 0);

        // Alap sebzés a szint alapján
        if (damageInfo.scaling && damageInfo.scaling.level) {
            const currentLevel = this.abilityLevels[character.playerId][abilityIndex] || 1;
            totalDamage = Math.round(damageInfo.scaling.level[currentLevel - 1]);
        }

        // AD skálázás (Julia E képességéhez)
        if (character.baseCharacter === 'Julia' && abilityIndex === 3) {
            totalDamage = Math.round(totalDamage + character.stats.attackDamage); // 100% AD skálázás
        }

        // Figyelembe vesszük az aktív hatásokat
        for (const effect of this.activeEffects[character.playerId]) {
            if (effect.damageIncrease) {
                totalDamage = Math.round(totalDamage * (1 + effect.damageIncrease));
            }
        }

        return Math.round(totalDamage);
    }

    applyInstantEffect(playerId, character, ability) {
        if (character.baseCharacter === 'Julia' && ability.name === "Strength of Spirits") {
            // Megkeressük az összes szövetségest
            const isPlayerTeam = playerId === 'player';
            const slots = document.querySelectorAll('.player-slot');
            const abilityLevel = this.abilityLevels[playerId][4] || 1; // R képesség szintje
            const healPercent = this.abilityScales.Julia[4].healPercent[abilityLevel - 1];

            slots.forEach(slot => {
                const targetId = slot.dataset.playerId;
                const isAlly = (isPlayerTeam && slot.closest('.team-1')) || 
                             (!isPlayerTeam && slot.closest('.team-2'));
                
                if (isAlly) {
                    const targetCharacter = targetId === 'player' ? this.player : this.ai[targetId];
                    if (targetCharacter && targetCharacter.currentHp > 0) {
                        const targetMaxHp = targetCharacter.maxHp;
                        const healAmount = Math.floor((targetMaxHp * healPercent) / 100);
                        const oldHp = Math.floor(targetCharacter.currentHp);
                        
                        targetCharacter.currentHp = Math.min(targetMaxHp, healAmount);
                        const actualHeal = Math.floor(targetCharacter.currentHp - oldHp);
                        
                        if (actualHeal > 0) {
                            this.showFloatingText(slot, Math.floor(actualHeal), 'heal');
                            this.updateHealthAndMana(slot, Math.floor(targetCharacter.currentHp), Math.floor(targetCharacter.currentMana));
                            
                            // Vizuális visszajelzés
                            const targetImg = slot.querySelector('img');
                            targetImg.style.filter = 'sepia(100%) hue-rotate(90deg) saturate(300%)';
                            setTimeout(() => {
                                targetImg.style.filter = '';
                            }, 500);
                        }
                    }
                }
            });
        }
    }
}

// Játék inicializálása amikor az oldal betöltődött
document.addEventListener('DOMContentLoaded', () => {
    window.arenaGame = new ArenaGame();
}); 