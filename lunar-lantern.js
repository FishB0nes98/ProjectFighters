import { getAuth } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { stickers } from './sticker-data.js';
import { recolorData } from './recolor-data.js';

const lunarSkins = [
    "Lunar Festival Lili",
    "Lunar Festival Scorpion",
    "Lunar Festival Reptile",
    "Lunar Festival Noel",
    "Lunar Festival Siegfried",
    "Lunar Festival Kokoro"
];

const rewards = [
    { item: "Phoenix R Mika", chance: 8, type: "skin" },
    { item: "Blanka Red", chance: 10, type: "skin" },
    { item: "Samurai Shizumaru", chance: 8, type: "skin" },
    { item: "Feather Dancer Mai", chance: 8, type: "skin" },
    { item: "Lunar Festival 2024 Theme Song", chance: 20, type: "music" },
    { item: "Lunar Festival Lili", chance: 0.5, type: "skin" },
    { item: "Lunar Festival Scorpion", chance: 0.5, type: "skin" },
    { item: "Lunar Festival Reptile", chance: 0.5, type: "skin" },
    { item: "Lunar Festival Noel", chance: 0.5, type: "skin" },
    { item: "Lunar Festival Siegfried", chance: 0.5, type: "skin" },
    { item: "Lunar Festival Kokoro", chance: 0.5, type: "skin" },
    { item: "FM", chance: 10, type: "currency", amount: 100 },
    { item: "FM", chance: 2, type: "currency", amount: 1000 },
    { item: "FM", chance: 1.5, type: "currency", amount: 2000 },
    { item: "CM", chance: 15, type: "currency", amount: 5000 },
    { item: "CM", chance: 12.5, type: "currency", amount: 25000 },
    { item: "Lunar Ticket", chance: 5, type: "currency", amount: 2 },
    { item: "Lootbox", chance: 5, type: "lootbox", amount: 1 },
    { item: "Random Sticker", chance: 15, type: "sticker" },
    { item: "Random Recolor", chance: 15, type: "recolor" },
    { item: "Random Lunar Skin", chance: 3.5, type: "lunarSkin" }
];

let openedLanterns = new Set();
let lastRefreshTime = null;

// Make functions globally available
window.openLunarWindow = function() {
    const window = document.getElementById('lunar-lantern-window');
    window.style.display = 'flex';
    updateTicketDisplay();
    checkAndResetLanterns();
}

window.closeLunarWindow = function() {
    const window = document.getElementById('lunar-lantern-window');
    window.style.display = 'none';
}

window.openLantern = async function(index) {
    if (openedLanterns.has(index)) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const database = getDatabase();
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (!userData.lunarTickets || userData.lunarTickets < 1) {
        alert('Nincs elég Lunar Ticketed!');
        return;
    }

    // Get random reward
    const reward = getRandomReward();
    const updates = {};
    updates['lunarTickets'] = (userData.lunarTickets || 0) - 1;

    let rewardImage = '';
    let rewardText = '';

    // Process reward
    switch (reward.type) {
        case "currency":
            updates[reward.item] = (userData[reward.item] || 0) + reward.amount;
            rewardImage = `res/img/${reward.item.toLowerCase()}.png`;
            rewardText = `${reward.amount} ${reward.item}`;
            break;

        case "skin":
            updates[`skins/${reward.item}`] = 1;
            rewardImage = `Loading Screen/${reward.item}.png`;
            rewardText = reward.item;
            break;

        case "sticker":
            const randomSticker = getRandomSticker(userData.Stickers || {});
            if (randomSticker) {
                updates[`Stickers/${randomSticker}`] = 1;
                rewardImage = `Stickers/${randomSticker}.png`;
                rewardText = randomSticker;
            }
            break;

        case "recolor":
            const randomRecolor = getRandomRecolor(userData.skins || {});
            if (randomRecolor) {
                updates[`skins/${randomRecolor}`] = 1;
                rewardImage = `Skins/${randomRecolor}.png`;
                rewardText = randomRecolor;
            }
            break;

        case "lunarSkin":
            const randomLunarSkin = getRandomLunarSkin(userData.skins || {});
            if (randomLunarSkin) {
                updates[`skins/${randomLunarSkin}`] = 1;
                rewardImage = `Loading Screen/${randomLunarSkin}.png`;
                rewardText = randomLunarSkin;
            }
            break;

        case "lootbox":
            updates['lootboxes'] = (userData.lootboxes || 0) + reward.amount;
            rewardImage = 'res/img/lootbox.png';
            rewardText = 'Free Lootbox';
            break;
    }

    // Save opened lantern state
    updates[`openedLanterns/${index}`] = {
        opened: true,
        rewardImage: rewardImage,
        rewardText: rewardText
    };

    // Update database
    await update(userRef, updates);
    
    // Update UI
    const lanternContainer = document.querySelectorAll('.lantern-container')[index];
    const lantern = lanternContainer.querySelector('.lantern');
    lantern.style.opacity = '0.5';
    lantern.style.pointerEvents = 'none';
    openedLanterns.add(index);
    
    // Show reward
    showReward(rewardImage, rewardText, index);
    
    // Update ticket display
    updateTicketDisplay();
}

window.closeRewardPopup = function() {
    const popup = document.getElementById('reward-popup');
    popup.style.display = 'none';
}

async function checkAndResetLanterns() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const database = getDatabase();
    const userRef = ref(database, `users/${user.uid}/lastLanternRefresh`);
    const snapshot = await get(userRef);
    const lastRefresh = snapshot.val();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (!lastRefresh || lastRefresh < today) {
        resetLanterns();
        // Update last refresh time
        await update(ref(database, `users/${user.uid}`), {
            lastLanternRefresh: Date.now()
        });
    } else {
        // Load opened lanterns state
        const openedStateRef = ref(database, `users/${user.uid}/openedLanterns`);
        const openedStateSnapshot = await get(openedStateRef);
        const openedState = openedStateSnapshot.val() || {};

        // Apply opened state
        Object.entries(openedState).forEach(([index, data]) => {
            if (data.opened) {
                const lanternContainer = document.querySelectorAll('.lantern-container')[parseInt(index)];
                if (lanternContainer) {
                    lanternContainer.classList.add('opened');
                    const lantern = lanternContainer.querySelector('.lantern');
                    if (lantern) {
                        lantern.classList.add('opened');
                        lantern.style.opacity = '0.5';
                        lantern.style.pointerEvents = 'none';
                    }
                    // Recreate reward preview
                    const rewardPreview = lanternContainer.querySelector('.reward-preview');
                    if (rewardPreview && data.rewardImage) {
                        const previewImg = document.createElement('img');
                        previewImg.src = data.rewardImage;
                        previewImg.alt = data.rewardText || 'Reward';
                        rewardPreview.innerHTML = '';
                        rewardPreview.appendChild(previewImg);
                    }
                }
                openedLanterns.add(parseInt(index));
            }
        });
    }
}

function resetLanterns() {
    const lanternContainers = document.querySelectorAll('.lantern-container');
    lanternContainers.forEach(container => {
        container.classList.remove('opened');
        const lantern = container.querySelector('.lantern');
        if (lantern) {
            lantern.classList.remove('opened');
            lantern.style.opacity = '1';
            lantern.style.pointerEvents = 'auto';
        }
        const preview = container.querySelector('.reward-preview');
        if (preview) {
            preview.innerHTML = '';
        }
    });
    openedLanterns.clear();

    // Clear opened state in database
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        const database = getDatabase();
        update(ref(database, `users/${user.uid}`), {
            openedLanterns: null
        });
    }
}

async function updateTicketDisplay() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const database = getDatabase();
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    document.getElementById('lunar-ticket-amount').textContent = userData.lunarTickets || 0;
}

function getRandomReward() {
    const totalChance = rewards.reduce((sum, reward) => sum + reward.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const reward of rewards) {
        if (random < reward.chance) {
            return reward;
        }
        random -= reward.chance;
    }
    
    return rewards[0]; // Fallback to first reward
}

function getRandomSticker(ownedStickers) {
    // Filter out stickers that the user already owns
    const availableStickers = {};
    for (const [sticker, weight] of Object.entries(stickers)) {
        if (!ownedStickers[sticker]) {
            availableStickers[sticker] = weight;
        }
    }
    
    if (Object.keys(availableStickers).length === 0) return null;
    
    // Randomly select a sticker based on weight
    const totalWeight = Object.values(availableStickers).reduce((acc, val) => acc + val, 0);
    let random = Math.random() * totalWeight;
    let sum = 0;
    
    for (const [sticker, weight] of Object.entries(availableStickers)) {
        sum += weight;
        if (random <= sum) {
            return sticker;
        }
    }
    
    return Object.keys(availableStickers)[0]; // Fallback to first available sticker
}

function getRandomRecolor(ownedSkins) {
    // Create weighted list of available recolors
    const availableRecolors = {};
    
    Object.entries(recolorData).forEach(([baseSkin, data]) => {
        data.recolors.forEach(recolor => {
            const fullName = `${data.base} ${recolor}`;
            if (!ownedSkins[fullName] && (!data.availability || data.availability[recolor] !== false)) {
                // Use the weight from recolorData if available, otherwise default to 1
                availableRecolors[fullName] = data.weights?.[recolor] || 1;
            }
        });
    });
    
    if (Object.keys(availableRecolors).length === 0) return null;
    
    // Randomly select a recolor based on weight
    const totalWeight = Object.values(availableRecolors).reduce((acc, val) => acc + val, 0);
    let random = Math.random() * totalWeight;
    let sum = 0;
    
    for (const [recolor, weight] of Object.entries(availableRecolors)) {
        sum += weight;
        if (random <= sum) {
            return recolor;
        }
    }
    
    return Object.keys(availableRecolors)[0]; // Fallback to first available recolor
}

function getRandomLunarSkin(ownedSkins) {
    // Create weighted list of available lunar skins
    const availableSkins = {};
    
    lunarSkins.forEach(skin => {
        if (!ownedSkins[skin]) {
            // All lunar skins have equal weight (1)
            availableSkins[skin] = 1;
        }
    });
    
    if (Object.keys(availableSkins).length === 0) return null;
    
    // Randomly select a skin based on weight
    const totalWeight = Object.values(availableSkins).reduce((acc, val) => acc + val, 0);
    let random = Math.random() * totalWeight;
    let sum = 0;
    
    for (const [skin, weight] of Object.entries(availableSkins)) {
        sum += weight;
        if (random <= sum) {
            return skin;
        }
    }
    
    return Object.keys(availableSkins)[0]; // Fallback to first available skin
}

function showReward(imageSrc, text) {
    const popup = document.getElementById('reward-popup');
    const image = document.getElementById('reward-image');
    const textElement = document.getElementById('reward-text');
    
    image.src = imageSrc;
    textElement.textContent = text;
    popup.style.display = 'flex';
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make functions globally available
    window.openLunarWindow = openLunarWindow;
    window.closeLunarWindow = closeLunarWindow;
    window.openLantern = openLantern;
    window.closeRewardPopup = closeRewardPopup;
    window.showReward = showReward;
}); 