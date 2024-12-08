// Export the sticker data for use in other files
export const stickers = {
    // Regular Stickers
    "Nina_Facepalm": {
        name: "Nina Facepalm",
        image: "Stickers/Nina_Facepalm.png",
        price: 350,
        category: "regular"
    },
    "Birdie_Sacred": {
        name: "Birdie Sacred",
        image: "Stickers/Birdie_Sacred.png",
        price: 350,
        category: "regular"
    },
    "Julia_Sacred": {
        name: "Julia Sacred",
        image: "Stickers/Julia_Sacred.png",
        price: 350,
        category: "regular"
    },
    "Shoma_Shy": {
        name: "Shoma Shy",
        image: "Stickers/Shoma_Shy.png",
        price: 350,
        category: "regular"
    },
    "Mega_Man_Cry": {
        name: "Mega Man Cry",
        image: "Stickers/Mega_Man_Cry.png",
        price: 350,
        category: "regular"
    },
    "Jade_Panda_Happy": {
        name: "Jade Panda Happy",
        image: "Stickers/Jade_Panda_Happy.png",
        price: 350,
        category: "regular"
    },
    "Jade_Ayane_Embarassed": {
        name: "Jade Ayane Embarassed",
        image: "Stickers/Jade_Ayane_Embarassed.png",
        price: 350,
        category: "regular"
    },
    "Jackolantern": {
        name: "Jackolantern",
        image: "Stickers/Jackolantern.png",
        price: 350,
        category: "event",
        availability: "halloween"
    },
    "Scorpion": {
        name: "Scorpion",
        image: "Stickers/Scorpion.png",
        price: 350,
        category: "regular"
    },
    "Kuma_Eat": {
        name: "Kuma Eat",
        image: "Stickers/Kuma_Eat.png",
        price: 350,
        category: "regular"
    },
    "Kokoro_Blushing": {
        name: "Kokoro Blushing",
        image: "Stickers/Kokoro_Blushing.png",
        price: 350,
        category: "regular"
    },
    "Nina_Smoke": {
        name: "Nina Smoke",
        image: "Stickers/Nina_Smoke.png",
        price: 350,
        category: "regular"
    },
    "Rainy_Day_Julia": {
        name: "Rainy Day Julia",
        image: "Stickers/Rainy_Day_Julia.png",
        price: 350,
        category: "regular"
    },
    "Reptile_Confused": {
        name: "Reptile Confused",
        image: "Stickers/Reptile_Confused.png",
        price: 350,
        category: "regular"
    },
    "Blanka_Scared": {
        name: "Blanka Scared",
        image: "Stickers/Blanka_Scared.png",
        price: 350,
        category: "regular"
    },
    "ChamCham_V": {
        name: "ChamCham V",
        image: "Stickers/ChamCham_V.png",
        price: 350,
        category: "regular"
    },
    "Ayane_Side_Eye": {
        name: "Ayane Side Eye",
        image: "Stickers/Ayane_Side_Eye.png",
        price: 350,
        category: "regular"
    },
    "Shizumaru_Lmao": {
        name: "Shizumaru Lmao",
        image: "Stickers/Shizumaru_Lmao.png",
        price: 350,
        category: "regular"
    },
    "Rmika_Gum": {
        name: "R.Mika Gum",
        image: "Stickers/Rmika_Gum.png",
        price: 350,
        category: "regular"
    },
    "Birdie_Ate": {
        name: "Birdie Ate",
        image: "Stickers/Birdie_Ate.png",
        price: 350,
        category: "regular"
    },
    "Christie_Heart": {
        name: "Christie Heart",
        image: "Stickers/Christie_Heart.png",
        price: 350,
        category: "regular"
    },
    "Juri_Selfie": {
        name: "Juri Selfie",
        image: "Stickers/Juri_Selfie.png",
        price: 350,
        category: "regular"
    },
    "Shoma_Surprised": {
        name: "Shoma Surprised",
        image: "Stickers/Shoma_Surprised.png",
        price: 350,
        category: "regular"
    },
    "Ayane_Isthisa": {
        name: "Ayane Is this a",
        image: "Stickers/Ayane_Isthisa.png",
        price: 350,
        category: "regular"
    }
};

// Helper functions
export function getStickersByCategory(category) {
    return Object.entries(stickers)
        .filter(([_, sticker]) => sticker.category === category)
        .reduce((acc, [id, sticker]) => {
            acc[id] = sticker;
            return acc;
        }, {});
}

export function getAvailableStickers() {
    return Object.entries(stickers)
        .filter(([_, sticker]) => {
            // If it's a regular sticker or if it's an event sticker that's currently available
            return sticker.category === "regular" || 
                   (sticker.category === "event" && isEventActive(sticker.availability));
        })
        .reduce((acc, [id, sticker]) => {
            acc[id] = sticker;
            return acc;
        }, {});
}

function isEventActive(eventName) {
    const now = new Date();
    switch(eventName) {
        case "halloween":
            // Active during October
            return now.getMonth() === 9;
        // Add more events as needed
        default:
            return false;
    }
}

// Function to check if user owns a sticker
export function doesUserOwnSticker(userStickers, stickerId) {
    return userStickers && userStickers[stickerId] === 1;
}

// Function to get random sticker
export function getRandomSticker(excludeIds = []) {
    const availableStickers = Object.entries(stickers)
        .filter(([id, _]) => !excludeIds.includes(id));
    
    if (availableStickers.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableStickers.length);
    const [id, sticker] = availableStickers[randomIndex];
    return { id, ...sticker };
} 