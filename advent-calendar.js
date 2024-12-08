import { getDatabase, ref, get, set, update, increment } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getAllRecolors } from './recolor-data.js';

const db = getDatabase();
const auth = getAuth();

// Add this at the beginning of the file
document.addEventListener('DOMContentLoaded', () => {
    // Remove any existing event listeners first
    const adventCalendarButton = document.querySelector('.advent-calendar-button');
    if (adventCalendarButton) {
        // Remove old listeners
        adventCalendarButton.replaceWith(adventCalendarButton.cloneNode(true));
        
        // Add new listener
        document.querySelector('.advent-calendar-button')
            .addEventListener('click', openAdventCalendar, { once: true });
    }
    
    // Ensure windows are hidden on page load
    const calendarWindow = document.getElementById('advent-calendar-window');
    const rewardPopup = document.getElementById('daily-reward-popup');
    if (calendarWindow) calendarWindow.style.display = 'none';
    if (rewardPopup) rewardPopup.style.display = 'none';
});

// Function to get user's owned skins
async function getUserSkins(userId) {
    const skinsRef = ref(db, `users/${userId}/Skins`);
    const snapshot = await get(skinsRef);
    return snapshot.exists() ? Object.keys(snapshot.val()) : [];
}

// Function to get available skins from basic lootbox
async function getBasicLootboxSkins() {
    const lootboxRef = ref(db, 'Lootbox/basicbox');
    const snapshot = await get(lootboxRef);
    return snapshot.exists() ? snapshot.val() : [];
}

// Function to get a random skin the user doesn't own
async function getRandomUnownedSkin(userId) {
    const ownedSkins = await getUserSkins(userId);
    const availableSkins = await getBasicLootboxSkins();
    
    // Filter out skins the user already owns
    const unownedSkins = availableSkins.filter(skin => !ownedSkins.includes(skin));
    
    if (unownedSkins.length === 0) {
        return null; // User owns all skins
    }
    
    // Select random skin from unowned skins
    const randomIndex = Math.floor(Math.random() * unownedSkins.length);
    return unownedSkins[randomIndex];
}

// Sample rewards data with Day 1 being dynamic
const adventRewards = {
    1: { 
        name: "Random Skin", 
        image: "res/img/rewards/mystery_skin.jpg",
        isSpecial: true 
    },
    2: { 
        name: "600 FM", 
        image: "res/img/fm.png",
        type: 'FM',
        amount: 600
    },
    3: { 
        name: "Snowman Icon", 
        image: "Icons/Profile/snowman.jpeg",
        folder: 'Icons',
        iconName: 'snowman'
    },
    4: {
        name: "Mystery Gift",
        image: "res/img/rewards/mystery_gift.jpg",
        isRandom: true,
        rewards: [
            { type: 'CM', amount: 15000, chance: 80, image: 'res/img/cm.png', name: '15,000 CM' },
            { type: 'FM', amount: 500, chance: 15, image: 'res/img/fm.png', name: '500 FM' },
            { type: 'SKIN', chance: 5, image: 'res/img/rewards/mystery_skin.jpg', name: 'Random Skin' }
        ]
    },
    5: { 
        name: "Winter Lili Icon", 
        image: "Icons/Profile/winter_lili.jpeg",
        folder: 'Icons',
        iconName: 'winter_lili'
    },
    6: {
        name: "Random Holiday Sticker",
        image: "res/img/rewards/mystery_sticker.jpg",
        isRandomSticker: true,
        stickers: [
            { name: "Elf Shizumaru Sticker", image: "Stickers/elf_shizumaru.png", stickerName: "elf_shizumaru" },
            { name: "Santa Kuma Sticker", image: "Stickers/santa_kuma.png", stickerName: "santa_kuma" }
        ]
    },
    7: {
        name: "Random Holiday Icon",
        image: "res/img/rewards/mystery_icon.jpg",
        isRandomIcon: true,
        icons: [
            { 
                name: "Santa Kuma Icon", 
                image: "Icons/Profile/santa_kuma.jpeg", 
                iconName: "santa_kuma" 
            },
            { 
                name: "Santa Panda Icon", 
                image: "Icons/Profile/santa_panda.jpeg", 
                iconName: "santa_panda" 
            }
        ]
    },
    8: {
        name: "Mystery Box",
        image: "res/img/rewards/mystery_box.jpg",
        isRandomBox: true,
        rewards: [
            { 
                type: 'LOOTBOX', 
                chance: 50, 
                image: 'res/img/basicbox.png', 
                name: 'Free Lootbox',
                folder: 'freelootbox'
            },
            { 
                type: 'SKIN', 
                chance: 50, 
                image: 'res/img/rewards/mystery_skin.jpg', 
                name: 'Random Skin' 
            }
        ]
    },
    9: {
        name: "Random Recolor Skin",
        image: "res/img/rewards/mystery_skin.jpg",
        isRecolor: true
    },
    10: {
        name: "Random FM",
        image: "res/img/fm.png",
        isRandom: true,
        rewards: [
            { type: 'FM', amount: 500, chance: 65, image: 'res/img/fm.png', name: '500 FM' },
            { type: 'FM', amount: 1000, chance: 20, image: 'res/img/fm.png', name: '1000 FM' },
            { type: 'FM', amount: 2000, chance: 15, image: 'res/img/fm.png', name: '2000 FM' }
        ]
    },
    11: {
        name: "Random Skin Recolor",
        image: "res/img/rewards/mystery_skin.jpg",
        isRecolor: true
    },
    12: {
        name: "Santa Claus Title",
        image: "res/img/rewards/title.jpg",
        type: 'TITLE',
        titleName: 'Santa Claus'
    },
    13: {
        name: "Free Lootbox",
        image: "res/img/basicbox.png",
        type: 'LOOTBOX',
        folder: 'freelootbox'
    },
    14: {
        name: "Winter Mega Man Icon",
        image: "Icons/Profile/winter_megaman.jpeg",
        folder: 'Icons',
        iconName: 'winter_megaman'
    },
    15: {
        name: "10,000 CM",
        image: "res/img/cm.png",
        type: 'CM',
        amount: 10000
    },
    16: {
        name: "Chibi Sub Zero Winter Sticker",
        image: "Stickers/chibi_subzero_winter.png",
        type: 'STICKER',
        stickerName: 'chibi_subzero_winter'
    },
    17: {
        name: "Random Skin Recolor",
        image: "res/img/rewards/mystery_skin.jpg",
        isRecolor: true
    },
    18: {
        name: "Chibi Cham Cham Winter Icon",
        image: "Icons/Profile/chibi_chamcham_winter.jpeg",
        folder: 'Icons',
        iconName: 'chibi_chamcham_winter'
    },
    19: {
        name: "Random Currency",
        image: "res/img/rewards/mystery_currency.jpg",
        isRandom: true,
        rewards: [
            { type: 'CM', amount: 10000, chance: 50, image: 'res/img/cm.png', name: '10,000 CM' },
            { type: 'FM', amount: 1000, chance: 50, image: 'res/img/fm.png', name: '1000 FM' }
        ]
    },
    20: {
        name: "Snowflake Title",
        image: "res/img/rewards/title.jpg",
        type: 'TITLE',
        titleName: 'Snowflake'
    },
    21: {
        name: "Random Skin Recolor",
        image: "res/img/rewards/mystery_skin.jpg",
        isRecolor: true
    },
    22: {
        name: "Free Lootbox",
        image: "res/img/basicbox.png",
        type: 'LOOTBOX',
        folder: 'freelootbox'
    }
};

// Function to check if user has already opened a day
async function hasOpenedDay(userId, day) {
    const adventRef = ref(db, `users/${userId}/advent2024/day${day}`);
    const snapshot = await get(adventRef);
    return snapshot.exists() && snapshot.val() === true;
}

// Function to mark day as opened
async function markDayAsOpened(userId, day) {
    await set(ref(db, `users/${userId}/advent2024/day${day}`), true);
}

// Add function to get random reward based on weights
function getRandomReward(rewards) {
    const total = rewards.reduce((sum, reward) => sum + reward.chance, 0);
    let random = Math.random() * total;
    
    for (const reward of rewards) {
        if (random < reward.chance) {
            return reward;
        }
        random -= reward.chance;
    }
    return rewards[0]; // Fallback to first reward
}

// Update the showReward function to handle random rewards
async function showReward(day) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to claim rewards');
        return;
    }

    if (!isDateAvailable(day)) {
        alert(`This reward will be available on December ${day}!`);
        return;
    }

    const alreadyOpened = await hasOpenedDay(user.uid, day);
    if (alreadyOpened) {
        alert('You have already claimed this day\'s reward!');
        return;
    }

    const reward = adventRewards[day];
    if (reward) {
        const calendarContent = document.querySelector('.advent-calendar-content');
        calendarContent.innerHTML = `
            <span class="close-button" data-action="closeCalendar">&times;</span>
            <div class="reward-display">
                <h2 id="reward-name"></h2>
                <img id="reward-image" src="" alt="Reward">
            </div>`;

        const rewardImage = document.getElementById('reward-image');
        const rewardName = document.getElementById('reward-name');
        
        try {
            if (reward.type === 'TITLE') {
                // Handle title rewards
                rewardName.textContent = `New Title: ${reward.titleName}`;
                rewardImage.src = reward.image;
                
                // Save title to user's collection
                await update(ref(db), {
                    [`users/${user.uid}/Titles/${reward.titleName}`]: 1,
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
            } else if (reward.type === 'FM') {
                // Handle FM reward
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);
                const currentFM = (snapshot.val()?.FM || 0) + reward.amount;
                
                await update(ref(db), {
                    [`users/${user.uid}/FM`]: currentFM,
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
                
                rewardName.textContent = reward.name;
                rewardImage.src = reward.image;
            } else if (reward.type === 'CM') {
                // Handle CM reward
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);
                const currentCM = (snapshot.val()?.CM || 0) + reward.amount;
                
                await update(ref(db), {
                    [`users/${user.uid}/CM`]: currentCM,
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
                
                rewardName.textContent = reward.name;
                rewardImage.src = reward.image;
            } else if (reward.type === 'STICKER') {
                // Handle sticker reward
                await update(ref(db), {
                    [`users/${user.uid}/Stickers/${reward.stickerName}`]: 1,
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
                
                rewardName.textContent = reward.name;
                rewardImage.src = reward.image;
            } else if (reward.type === 'LOOTBOX') {
                // Handle lootbox reward
                await update(ref(db), {
                    [`users/${user.uid}/inventory/${reward.folder}`]: increment(1),
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
                
                rewardName.textContent = reward.name;
                rewardImage.src = reward.image;
            } else if (reward.isRandom) {
                // Handle random rewards
                const selectedReward = getRandomReward(reward.rewards);
                rewardName.textContent = selectedReward.name;
                rewardImage.src = selectedReward.image;

                if (selectedReward.type === 'CM') {
                    const userRef = ref(db, `users/${user.uid}`);
                    const snapshot = await get(userRef);
                    const currentCM = (snapshot.val()?.CM || 0) + selectedReward.amount;
                    await update(ref(db), {
                        [`users/${user.uid}/CM`]: currentCM,
                        [`users/${user.uid}/advent2024/day${day}`]: true
                    });
                } else if (selectedReward.type === 'FM') {
                    const userRef = ref(db, `users/${user.uid}`);
                    const snapshot = await get(userRef);
                    const currentFM = (snapshot.val()?.FM || 0) + selectedReward.amount;
                    await update(ref(db), {
                        [`users/${user.uid}/FM`]: currentFM,
                        [`users/${user.uid}/advent2024/day${day}`]: true
                    });
                }
            } else if (reward.isRecolor) {
                // Handle recolor rewards
                const recolors = await getAvailableRecolors();
                if (!recolors || recolors.length === 0) {
                    alert('No recolors available');
                    return;
                }
                
                const randomIndex = Math.floor(Math.random() * recolors.length);
                const selectedRecolor = recolors[randomIndex];
                
                rewardName.textContent = `New Recolor: ${selectedRecolor}`;
                rewardImage.src = `Skins/${selectedRecolor}.png`;
                
                await update(ref(db), {
                    [`users/${user.uid}/skins/${selectedRecolor}`]: 1,
                    [`users/${user.uid}/advent2024/day${day}`]: true
                });
            }

            // Update the calendar day visual
            const dayBox = document.querySelector(`.calendar-day[data-day="${day}"]`);
            if (dayBox) {
                dayBox.classList.add('opened');
            }

        } catch (error) {
            console.error('Error processing reward:', error);
            alert('There was an error processing your reward. Please try again.');
        }
    }
}

// Add this function to check if a day is available
function isDateAvailable(day) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const adventDate = new Date(currentYear, 11, day); // 11 is December (0-based months)
    return now >= adventDate;
}

// Add this function to check if the calendar is active
function isCalendarActive() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const calendarStart = new Date(currentYear, 11, 1); // December 1st
    const calendarEnd = new Date(currentYear, 11, 24, 23, 59, 59); // December 24th end of day
    return now >= calendarStart && now <= calendarEnd;
}

// Update the openAdventCalendar function
async function openAdventCalendar() {
    try {
        console.log('Opening advent calendar...');
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to view the advent calendar');
            return;
        }

        if (!isCalendarActive()) {
            alert('The advent calendar is only available during December 1-24!');
            return;
        }

        const calendarWindow = document.getElementById('advent-calendar-window');
        if (!calendarWindow) {
            console.error('Calendar window element not found');
            return;
        }
        
        calendarWindow.style.display = 'block';
        
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) {
            console.error('Calendar grid element not found');
            return;
        }
        
        // Clear existing calendar days
        calendarGrid.innerHTML = '';
        
        // Generate calendar days and check opened status
        for (let i = 1; i <= 24; i++) {
            const dayBox = document.createElement('div');
            dayBox.className = 'calendar-day';
            dayBox.textContent = i;
            dayBox.setAttribute('data-day', i);
            
            const dateAvailable = isDateAvailable(i);
            const opened = await hasOpenedDay(user.uid, i);

            if (opened) {
                dayBox.classList.add('opened');
            } else if (!dateAvailable) {
                dayBox.classList.add('locked');
            }
            
            if (dateAvailable && !opened) {
                dayBox.onclick = () => showReward(i);
            } else {
                dayBox.style.cursor = 'not-allowed';
            }
            
            calendarGrid.appendChild(dayBox);
        }
        
        console.log('Calendar opened successfully');
    } catch (error) {
        console.error('Error opening advent calendar:', error);
    }
}

function closeAdventCalendar() {
    document.getElementById('advent-calendar-window').style.display = 'none';
}

// Function to get random skin using the lootbox logic
async function getRandomLootboxSkin(userId) {
    const lootboxRef = ref(db, 'lootbox/basicbox');
    const userRef = ref(db, `users/${userId}`);
    
    try {
        // Get lootbox skins and their weights
        const lootboxSnapshot = await get(lootboxRef);
        const lootboxSkins = lootboxSnapshot.val();
        
        // Get user's current skins
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const userSkins = userData.skins || {};

        if (!lootboxSkins) {
            console.error("No skins available in lootbox");
            return null;
        }

        // Filter out skins that the user already owns
        const availableSkins = {};
        for (const [skin, weight] of Object.entries(lootboxSkins)) {
            if (!userSkins[skin]) {
                availableSkins[skin] = weight;
            }
        }

        if (Object.keys(availableSkins).length === 0) {
            console.log("User owns all available skins");
            return null;
        }

        // Get random skin based on weight
        const randomSkin = getRandomSkin(availableSkins);
        
        // Update user's skins in the database
        await set(ref(db, `users/${userId}/skins/${randomSkin}`), 1);
        
        return randomSkin;
    } catch (error) {
        console.error("Error getting random skin:", error);
        return null;
    }
}

// Helper function to get random skin based on weights
function getRandomSkin(skins) {
    const totalWeight = Object.values(skins).reduce((acc, val) => acc + val, 0);
    const rand = Math.random() * totalWeight;
    let sum = 0;
    
    for (const [skin, weight] of Object.entries(skins)) {
        sum += weight;
        if (rand <= sum) {
            return skin;
        }
    }
}

function closeRewardPopup() {
    document.getElementById('daily-reward-popup').style.display = 'none';
}

// Add CSS for opened days
const style = document.createElement('style');
style.textContent = `
    .calendar-day.opened {
        background-color: #666;
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    .calendar-day.locked {
        background-color: #444;
        cursor: not-allowed;
        opacity: 0.5;
        position: relative;
    }
    
    .calendar-day.locked::after {
        content: '🔒';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.2em;
    }
`;
document.head.appendChild(style);

// Update the getAvailableRecolors function
async function getAvailableRecolors() {
    return getAllRecolors();
}

// Export functions to be used in home.html
export {
    openAdventCalendar,
    closeAdventCalendar,
    showReward,
    closeRewardPopup
}; 