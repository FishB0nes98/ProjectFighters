const recolorData = {
    "Lunar Festival Kokoro": {
        base: "Lunar Festival Kokoro",
        recolors: ["Sweet"],
        availability: {
            "Sweet": false
        }
    },
    "Winter Festival Lili": {
        base: "Winter Festival Lili",
        recolors: ["Holiday", "Snowy Blush", "Golden", "Snowflake"],
        availability: {
            "Holiday": false,
            "Snowy Blush": false,
            "Golden": false,
            "Snowflake": false
        }
    },
    "Steamcore MegaMan": {
        base: "Steamcore MegaMan",
        recolors: ["Copper", "Silver", "Golden", "Metal"]
    },
    "Sacred Ceremony Julia": {
        base: "Sacred Ceremony Julia",
        recolors: ["Sweetheart", "Black Velvet", "Champagne", "Romance"]
    },
    "Jade Scorpion": {
        base: "Jade Scorpion",
        recolors: ["Topaz", "Bloodstone", "Rose Quartz", "Agate"]
    },
    "Battle Bistro Shizumaru": {
        base: "Battle Bistro Shizumaru",
        recolors: ["Fast Food", "Sweet", "Frosted Whisk", "Blackberry"]
    },
    "Witch Julia": {
        base: "Witch Julia",
        recolors: ["Nature", "Wicked", "Scarlet", "Enchanted"]
    },
    "Voidborn Nina": {
        base: "Voidborn Nina",
        recolors: ["Warlock", "Eclipse", "Devil Countess", "Desert"]
    },
    "Arcade Sub Zero": {
        base: "Arcade Sub Zero",
        recolors: ["Cybernetic Surge", "Galactic Void", "Frosty Forest"]
    },
    "River Spirit Julia": {
        base: "River Spirit Julia",
        recolors: ["Golden"],
        availability: {
            "Golden": false
        }
    },
    "Forest Behemoth Astaroth": {
        base: "Forest Behemoth Astaroth",
        recolors: ["Opulent", "Rosy", "Ashen", "Gilded"]
    },
    "Pajama Party Cham Cham": {
        base: "Pajama Party Cham Cham",
        recolors: ["Cotton Candy", "Peachy Keen", "Aqua Dream", "Berry Burst"]
    },
    "Goth Elphelt": {
        base: "Goth Elphelt",
        recolors: ["Golden", "Crimson Noir", "Midnight Azure", "White"]
    },
    "High Elf Morrigan": {
        base: "High Elf Morrigan",
        recolors: ["Jade", "Darkness", "Ghost", "Silver Crimson"]
    },
    "Schoolboy Siegfried": {
        base: "Schoolboy Siegfried",
        recolors: ["Azure", "Obsidian Sapphire", "Regal Midnight", "Crimson"]
    },
    "Neon Core Raiden": {
        base: "Neon Core Raiden",
        recolors: ["Scarlet", "Emerald", "White", "Silver"]
    },
    "Pirate Shoma": {
        base: "Pirate Shoma",
        recolors: ["Blue", "Violet", "Jade", "Monochrome"]
    },
    "Infernal Ibuki": {
        base: "Infernal Ibuki",
        recolors: ["Greenfire", "Blue Flame", "Silver Flame", "Golden Flame"]
    },
    // Basic recolors as separate sections
    "Shoma Basic": {
        base: "Shoma",
        recolors: ["Schoolboy"]
    },
    "Raiden Basic": {
        base: "Raiden",
        recolors: ["Red"]
    },
    "Cham Cham Basic": {
        base: "Cham Cham",
        recolors: ["Monochrome"]
    },
    "Reptile Basic": {
        base: "Reptile",
        recolors: ["Sand"]
    },
    "Blanka Basic": {
        base: "Blanka",
        recolors: ["Red"]
    },
    "Ibuki Basic": {
        base: "Ibuki",
        recolors: ["Red"]
    },
    "Scorpion Basic": {
        base: "Scorpion",
        recolors: ["Spider", "Blossom"]
    },
    "Talim Basic": {
        base: "Talim",
        recolors: ["Bloody"]
    }
};

// Helper function to get all available recolors
function getAllRecolors() {
    const allRecolors = [];
    Object.values(recolorData).forEach(skinSet => {
        skinSet.recolors.forEach(recolor => {
            // For basic recolors, use the base name
            if (skinSet.base === "Basic") {
                allRecolors.push(recolor);
            } else {
                // For themed recolors, combine the base name
                allRecolors.push(`${skinSet.base} ${recolor}`);
            }
        });
    });
    return allRecolors;
} 

// Helper function to check if a skin is a recolor
function isRecolor(skinName) {
    return getAllRecolors().includes(skinName);
}

// Helper function to get base skin for a recolor
function getBaseSkin(recolorName) {
    for (const [baseSkin, data] of Object.entries(recolorData)) {
        if (data.recolors.some(recolor => `${data.base} ${recolor}` === recolorName)) {
            return data.base;
        }
    }
    return null;
}

// Export the data and helper functions
export {
    recolorData,
    getAllRecolors,
    isRecolor,
    getBaseSkin
};