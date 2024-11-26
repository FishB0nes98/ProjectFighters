import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';

export const characterRewards = [
    {
        xpRequired: 1000,
        rewardName: "Nature Lover",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/nature_lover"
    },
    {
        xpRequired: 2500,
        rewardName: "Julia Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Julia_Icon.png",
        databasePath: "Icons/Julia_Icon"
    },
    {
        xpRequired: 5000,
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox"
    },
    {
        xpRequired: 8500,
        rewardName: "Julia Blue Recolor",
        rewardType: "skin",
        rewardImage: "Skins/Julia Blue.jpeg",
        databasePath: "skins/Julia Blue"
    },
    {
        xpRequired: 11500,
        rewardName: "Julia Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/julia_border.png",
        databasePath: "borders/julia"
    },
    {
        xpRequired: 15000,
        rewardName: "Spirits Give Me Strength",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/spirits_strength"
    },
    {
        xpRequired: 30000,
        rewardName: "Julia Red Recolor",
        rewardType: "skin",
        rewardImage: "Skins/Julia Red.jpeg",
        databasePath: "skins/Julia Red"
    },
    {
        xpRequired: 45000,
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox"
    },
    {
        xpRequired: 50000,
        rewardName: "Julia Golden Recolor",
        rewardType: "skin",
        rewardImage: "Skins/Julia Golden.jpeg",
        databasePath: "skins/Julia Golden"
    },
    {
        xpRequired: 60000,
        rewardName: "Julia Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/julia_master"
    }
];

// R Mika's rewards array
export const rmikaRewards = [
    {
        xpRequired: 1000,
        rewardName: "Tag Team",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/tag_team"
    },
    {
        xpRequired: 2500,
        rewardName: "R Mika Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/R Mika_Icon.png",
        databasePath: "Icons/R Mika_Icon"
    },
    {
        xpRequired: 5000,
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox"
    },
    {
        xpRequired: 8500,
        rewardName: "R Mika Showstopper",
        rewardType: "skin",
        rewardImage: "Skins/R Mika Showstopper.jpeg",
        databasePath: "skins/R Mika Showstopper"
    },
    {
        xpRequired: 11500,
        rewardName: "R Mika Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/rmika_border.png",
        databasePath: "borders/rmika"
    },
    {
        xpRequired: 15000,
        rewardName: "WIIIIIIIIIIINNEEEEEER",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/winner"
    },
    {
        xpRequired: 30000,
        rewardName: "R Mika Villain",
        rewardType: "skin",
        rewardImage: "Skins/R Mika Villain.jpeg",
        databasePath: "skins/R Mika Villain"
    },
    {
        xpRequired: 45000,
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox"
    },
    {
        xpRequired: 50000,
        rewardName: "R Mika Quinn",
        rewardType: "skin",
        rewardImage: "Skins/R Mika Quinn.jpeg",
        databasePath: "skins/R Mika Quinn"
    },
    {
        xpRequired: 60000,
        rewardName: "R Mika Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/rmika_master"
    }
];
export const birdieRewards = [
    {
        xpRequired: "1000",
        rewardName: "Punk",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/punk",
    },
    {
        xpRequired: "2500",
        rewardName: "Birdie Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Birdie_Icon.png",
        databasePath: "Icons/Birdie_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Birdie Toxic",
        rewardType: "skin",
        rewardImage: "Skins/Birdie Toxic.jpeg",
        databasePath: "skins/Birdie Toxic",
    },
    {
        xpRequired: "11500",
        rewardName: "Birdie Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/birdie_border.png",
        databasePath: "borders/birdie",
    },
    {
        xpRequired: "15000",
        rewardName: "Ride or Die",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/ride_or_die",
    },
    {
        xpRequired: "30000",
        rewardName: "Birdie Metal",
        rewardType: "skin",
        rewardImage: "Skins/Birdie Metal.jpeg",
        databasePath: "skins/Birdie Metal",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Birdie Rich",
        rewardType: "skin",
        rewardImage: "Skins/Birdie Rich.jpeg",
        databasePath: "skins/Birdie Rich",
    },
    {
        xpRequired: "60000",
        rewardName: "Birdie Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/birdie_master",
    },
];
export const erronBlackRewards = [
    {
        xpRequired: "1000",
        rewardName: "Cowboy",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cowboy",
    },
    {
        xpRequired: "2500",
        rewardName: "Erron Black Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Erron Black_Icon.png",
        databasePath: "Icons/Erron Black_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Erron Black Demon",
        rewardType: "skin",
        rewardImage: "Skins/Erron Black Demon.jpeg",
        databasePath: "skins/Erron Black Demon",
    },
    {
        xpRequired: "11500",
        rewardName: "Erron Black Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/erron black_border.png",
        databasePath: "borders/erron black",
    },
    {
        xpRequired: "15000",
        rewardName: "Desert Demon",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/desert_demon",
    },
    {
        xpRequired: "30000",
        rewardName: "Erron Black White",
        rewardType: "skin",
        rewardImage: "Skins/Erron Black White.jpeg",
        databasePath: "skins/Erron Black White",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Erron Black Poker",
        rewardType: "skin",
        rewardImage: "Skins/Erron Black Poker.jpeg",
        databasePath: "skins/Erron Black Poker",
    },
    {
        xpRequired: "60000",
        rewardName: "Erron Black Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/erron black_master",
    },
];

export const chamChamRewards = [
    {
        xpRequired: "1000",
        rewardName: "Wild Cat",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/wild_cat",
    },
    {
        xpRequired: "2500",
        rewardName: "Cham Cham Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Cham Cham_Icon.png",
        databasePath: "Icons/Cham Cham_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Cham Cham Punk",
        rewardType: "skin",
        rewardImage: "Skins/Cham Cham Punk.jpeg",
        databasePath: "skins/Cham Cham Punk",
    },
    {
        xpRequired: "11500",
        rewardName: "Cham Cham Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/cham cham_border.png",
        databasePath: "borders/cham cham",
    },
    {
        xpRequired: "15000",
        rewardName: "Kitty Cat",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kitty_cat",
    },
    {
        xpRequired: "30000",
        rewardName: "Cham Cham Spring",
        rewardType: "skin",
        rewardImage: "Skins/Cham Cham Spring.jpeg",
        databasePath: "skins/Cham Cham Spring",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Cham Cham Autumn",
        rewardType: "skin",
        rewardImage: "Skins/Cham Cham Autumn.jpeg",
        databasePath: "skins/Cham Cham Autumn",
    },
    {
        xpRequired: "60000",
        rewardName: "Cham Cham Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cham cham_master",
    },
];
export const morriganRewards = [
    {
        xpRequired: "1000",
        rewardName: "Succubus",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/succubus",
    },
    {
        xpRequired: "2500",
        rewardName: "Morrigan Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Morrigan_Icon.png",
        databasePath: "Icons/Morrigan_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Morrigan Midnight",
        rewardType: "skin",
        rewardImage: "Skins/Morrigan Midnight.jpeg",
        databasePath: "skins/Morrigan Midnight",
    },
    {
        xpRequired: "11500",
        rewardName: "Morrigan Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/morrigan_border.png",
        databasePath: "borders/morrigan",
    },
    {
        xpRequired: "15000",
        rewardName: "Charming",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/charming",
    },
    {
        xpRequired: "30000",
        rewardName: "Morrigan Charm",
        rewardType: "skin",
        rewardImage: "Skins/Morrigan Charm.jpeg",
        databasePath: "skins/Morrigan Charm",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Morrigan Punk",
        rewardType: "skin",
        rewardImage: "Skins/Morrigan Punk.jpeg",
        databasePath: "skins/Morrigan Punk",
    },
    {
        xpRequired: "60000",
        rewardName: "Morrigan Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/morrigan_master",
    },
];
export const junRewards = [
    {
        xpRequired: "1000",
        rewardName: "Mother",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/mother",
    },
    {
        xpRequired: "2500",
        rewardName: "Jun Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Jun_Icon.png",
        databasePath: "Icons/Jun_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Jun Heaven",
        rewardType: "skin",
        rewardImage: "Skins/Jun Heaven.jpeg",
        databasePath: "skins/Jun Heaven",
    },
    {
        xpRequired: "11500",
        rewardName: "Jun Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/jun_border.png",
        databasePath: "borders/jun",
    },
    {
        xpRequired: "15000",
        rewardName: "Healing LIght",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/healing_light",
    },
    {
        xpRequired: "30000",
        rewardName: "Jun Bloodmoon",
        rewardType: "skin",
        rewardImage: "Skins/Jun Bloodmoon.jpeg",
        databasePath: "skins/Jun Bloodmoon",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Jun Unknown",
        rewardType: "skin",
        rewardImage: "Skins/Jun Unknown.jpeg",
        databasePath: "skins/Jun Unknown",
    },
    {
        xpRequired: "60000",
        rewardName: "Jun Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/jun_master",
    },
];
export const reptileRewards = [
    {
        xpRequired: "1000",
        rewardName: "Lizard",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/lizard",
    },
    {
        xpRequired: "2500",
        rewardName: "Reptile Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Reptile_Icon.png",
        databasePath: "Icons/Reptile_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Reptile Golden",
        rewardType: "skin",
        rewardImage: "Skins/Reptile Golden.jpeg",
        databasePath: "skins/Reptile Golden",
    },
    {
        xpRequired: "11500",
        rewardName: "Reptile Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/reptile_border.png",
        databasePath: "borders/reptile",
    },
    {
        xpRequired: "15000",
        rewardName: "Toxic",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/toxic",
    },
    {
        xpRequired: "30000",
        rewardName: "Reptile Toxic",
        rewardType: "skin",
        rewardImage: "Skins/Reptile Toxic.jpeg",
        databasePath: "skins/Reptile Toxic",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Reptile Warlord",
        rewardType: "skin",
        rewardImage: "Skins/Reptile Warlord.jpeg",
        databasePath: "skins/Reptile Warlord",
    },
    {
        xpRequired: "60000",
        rewardName: "Reptile Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/reptile_master",
    },
];

export const akumaRewards = [
    {
        xpRequired: "1000",
        rewardName: "Demon",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/demon",
    },
    {
        xpRequired: "2500",
        rewardName: "Akuma Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Akuma_Icon.png",
        databasePath: "Icons/Akuma_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Akuma Elder",
        rewardType: "skin",
        rewardImage: "Skins/Akuma Elder.jpeg",
        databasePath: "skins/Akuma Elder",
    },
    {
        xpRequired: "11500",
        rewardName: "Akuma Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/akuma_border.png",
        databasePath: "borders/akuma",
    },
    {
        xpRequired: "15000",
        rewardName: "Final Boss",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/final_boss",
    },
    {
        xpRequired: "30000",
        rewardName: "Akuma Master",
        rewardType: "skin",
        rewardImage: "Skins/Akuma Master.jpeg",
        databasePath: "skins/Akuma Master",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Akuma Enraged",
        rewardType: "skin",
        rewardImage: "Skins/Akuma Enraged.jpeg",
        databasePath: "skins/Akuma Enraged",
    },
    {
        xpRequired: "60000",
        rewardName: "Akuma Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/akuma_master",
    },
];
export const elpheltRewards = [
    {
        xpRequired: "1000",
        rewardName: "Cupid",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cupid",
    },
    {
        xpRequired: "2500",
        rewardName: "Elphelt Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Elphelt_Icon.png",
        databasePath: "Icons/Elphelt_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Elphelt Shiny",
        rewardType: "skin",
        rewardImage: "Skins/Elphelt Shiny.jpeg",
        databasePath: "skins/Elphelt Shiny",
    },
    {
        xpRequired: "11500",
        rewardName: "Elphelt Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/elphelt_border.png",
        databasePath: "borders/elphelt",
    },
    {
        xpRequired: "15000",
        rewardName: "Sniper",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/sniper",
    },
    {
        xpRequired: "30000",
        rewardName: "Elphelt Ocean",
        rewardType: "skin",
        rewardImage: "Skins/Elphelt Ocean.jpeg",
        databasePath: "skins/Elphelt Ocean",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Elphelt Black",
        rewardType: "skin",
        rewardImage: "Skins/Elphelt Black.jpeg",
        databasePath: "skins/Elphelt Black",
    },
    {
        xpRequired: "60000",
        rewardName: "Elphelt Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/elphelt_master",
    },
];
export const kotalkahnRewards = [
    {
        xpRequired: "1000",
        rewardName: "Leader",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/leader",
    },
    {
        xpRequired: "2500",
        rewardName: "Kotal Kahn Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Kotal Kahn_Icon.png",
        databasePath: "Icons/Kotal Kahn_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Kotal Kahn Warrior",
        rewardType: "skin",
        rewardImage: "Skins/Kotal Kahn Warrior.jpeg",
        databasePath: "skins/Kotal Kahn Warrior",
    },
    {
        xpRequired: "11500",
        rewardName: "Kotal Kahn Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/kotal kahn_border.png",
        databasePath: "borders/kotal kahn",
    },
    {
        xpRequired: "15000",
        rewardName: "Blood and Sun",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/blood_and_sun",
    },
    {
        xpRequired: "30000",
        rewardName: "Kotal Kahn Golden",
        rewardType: "skin",
        rewardImage: "Skins/Kotal Kahn Golden.jpeg",
        databasePath: "skins/Kotal Kahn Golden",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Kotal Kahn Leader",
        rewardType: "skin",
        rewardImage: "Skins/Kotal Kahn Leader.jpeg",
        databasePath: "skins/Kotal Kahn Leader",
    },
    {
        xpRequired: "60000",
        rewardName: "Kotal Kahn Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kotal kahn_master",
    },
];
export const scorpionRewards = [
    {
        xpRequired: "1000",
        rewardName: "Get Over Here!",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/get_over_here!",
    },
    {
        xpRequired: "2500",
        rewardName: "Scorpion Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Scorpion_Icon.png",
        databasePath: "Icons/Scorpion_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Scorpion Icy",
        rewardType: "skin",
        rewardImage: "Skins/Scorpion Icy.jpeg",
        databasePath: "skins/Scorpion Icy",
    },
    {
        xpRequired: "11500",
        rewardName: "Scorpion Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/scorpion_border.png",
        databasePath: "borders/scorpion",
    },
    {
        xpRequired: "15000",
        rewardName: "Netherrealm Champion",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/netherrealm_champion",
    },
    {
        xpRequired: "30000",
        rewardName: "Scorpion Sand",
        rewardType: "skin",
        rewardImage: "Skins/Scorpion Sand.jpeg",
        databasePath: "skins/Scorpion Sand",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Scorpion Champion",
        rewardType: "skin",
        rewardImage: "Skins/Scorpion Champion.jpeg",
        databasePath: "skins/Scorpion Champion",
    },
    {
        xpRequired: "60000",
        rewardName: "Scorpion Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/scorpion_master",
    },
];
export const peacockRewards = [
    {
        xpRequired: "1000",
        rewardName: "Gadgeteer",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/gadgeteer",
    },
    {
        xpRequired: "2500",
        rewardName: "Peacock Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Peacock_Icon.png",
        databasePath: "Icons/Peacock_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Peacock Steampunk",
        rewardType: "skin",
        rewardImage: "Skins/Peacock Steampunk.jpeg",
        databasePath: "skins/Peacock Steampunk",
    },
    {
        xpRequired: "11500",
        rewardName: "Peacock Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/peacock_border.png",
        databasePath: "borders/peacock",
    },
    {
        xpRequired: "15000",
        rewardName: "Robo-Girl",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/robo-girl",
    },
    {
        xpRequired: "30000",
        rewardName: "Peacock White",
        rewardType: "skin",
        rewardImage: "Skins/Peacock White.jpeg",
        databasePath: "skins/Peacock White",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Peacock Lucky",
        rewardType: "skin",
        rewardImage: "Skins/Peacock Lucky.jpeg",
        databasePath: "skins/Peacock Lucky",
    },
    {
        xpRequired: "60000",
        rewardName: "Peacock Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/peacock_master",
    },
];
export const angelRewards = [
    {
        xpRequired: "1000",
        rewardName: "Guardian Angel",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/guardian_angel",
    },
    {
        xpRequired: "2500",
        rewardName: "Angel Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Angel_Icon.png",
        databasePath: "Icons/Angel_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Angel Jade",
        rewardType: "skin",
        rewardImage: "Skins/Angel Jade.jpeg",
        databasePath: "skins/Angel Jade",
    },
    {
        xpRequired: "11500",
        rewardName: "Angel Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/angel_border.png",
        databasePath: "borders/angel",
    },
    {
        xpRequired: "15000",
        rewardName: "Protector",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/protector",
    },
    {
        xpRequired: "30000",
        rewardName: "Angel Dark Clouds",
        rewardType: "skin",
        rewardImage: "Skins/Angel Dark Clouds.jpeg",
        databasePath: "skins/Angel Dark Clouds",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Angel Heaven",
        rewardType: "skin",
        rewardImage: "Skins/Angel Heaven.jpeg",
        databasePath: "skins/Angel Heaven",
    },
    {
        xpRequired: "60000",
        rewardName: "Angel Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/angel_master",
    },
];
export const astarothRewards = [
    {
        xpRequired: "1000",
        rewardName: "Undead Guardian",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/undead_guardian",
    },
    {
        xpRequired: "2500",
        rewardName: "Astaroth Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Astaroth_Icon.png",
        databasePath: "Icons/Astaroth_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Astaroth Rage",
        rewardType: "skin",
        rewardImage: "Skins/Astaroth Rage.jpeg",
        databasePath: "skins/Astaroth Rage",
    },
    {
        xpRequired: "11500",
        rewardName: "Astaroth Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/astaroth_border.png",
        databasePath: "borders/astaroth",
    },
    {
        xpRequired: "15000",
        rewardName: "Axeweaver",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/axeweaver",
    },
    {
        xpRequired: "30000",
        rewardName: "Astaroth Poison",
        rewardType: "skin",
        rewardImage: "Skins/Astaroth Poison.jpeg",
        databasePath: "skins/Astaroth Poison",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Astaroth Crystal",
        rewardType: "skin",
        rewardImage: "Skins/Astaroth Crystal.jpeg",
        databasePath: "skins/Astaroth Crystal",
    },
    {
        xpRequired: "60000",
        rewardName: "Astaroth Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/astaroth_master",
    },
];
export const ibukiRewards = [
    {
        xpRequired: "1000",
        rewardName: "On The Scene!",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/on_the_scene!",
    },
    {
        xpRequired: "2500",
        rewardName: "Ibuki Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Ibuki_Icon.png",
        databasePath: "Icons/Ibuki_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Ibuki Yellow",
        rewardType: "skin",
        rewardImage: "Skins/Ibuki Yellow.jpeg",
        databasePath: "skins/Ibuki Yellow",
    },
    {
        xpRequired: "11500",
        rewardName: "Ibuki Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/ibuki_border.png",
        databasePath: "borders/ibuki",
    },
    {
        xpRequired: "15000",
        rewardName: "Shadow",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/shadow",
    },
    {
        xpRequired: "30000",
        rewardName: "Ibuki Red",
        rewardType: "skin",
        rewardImage: "Skins/Ibuki Red.jpeg",
        databasePath: "skins/Ibuki Red",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Ibuki Shadow",
        rewardType: "skin",
        rewardImage: "Skins/Ibuki Shadow.jpeg",
        databasePath: "skins/Ibuki Shadow",
    },
    {
        xpRequired: "60000",
        rewardName: "Ibuki Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/ibuki_master",
    },
];

export const raidenRewards = [
    {
        xpRequired: "1000",
        rewardName: "Thunder God",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/thunder_god",
    },
    {
        xpRequired: "2500",
        rewardName: "Raiden Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Raiden_Icon.png",
        databasePath: "Icons/Raiden_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Raiden Purple Storm",
        rewardType: "skin",
        rewardImage: "Skins/Raiden Purple Storm.jpeg",
        databasePath: "skins/Raiden Purple Storm",
    },
    {
        xpRequired: "11500",
        rewardName: "Raiden Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/raiden_border.png",
        databasePath: "borders/raiden",
    },
    {
        xpRequired: "15000",
        rewardName: "Fast as Lightning",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/fast_as_lightning",
    },
    {
        xpRequired: "30000",
        rewardName: "Raiden Yellow Lightning",
        rewardType: "skin",
        rewardImage: "Skins/Raiden Yellow Lightning.jpeg",
        databasePath: "skins/Raiden Yellow Lightning",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Raiden Dark",
        rewardType: "skin",
        rewardImage: "Skins/Raiden Dark.jpeg",
        databasePath: "skins/Raiden Dark",
    },
    {
        xpRequired: "60000",
        rewardName: "Raiden Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/raiden_master",
    },
];

export const yugoRewards = [
    {
        xpRequired: "1000",
        rewardName: "Werewolf",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/werewolf",
    },
    {
        xpRequired: "2500",
        rewardName: "Yugo Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Yugo_Icon.png",
        databasePath: "Icons/Yugo_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Yugo Silver Wolf",
        rewardType: "skin",
        rewardImage: "Skins/Yugo Silver Wolf.jpeg",
        databasePath: "skins/Yugo Silver Wolf",
    },
    {
        xpRequired: "11500",
        rewardName: "Yugo Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/yugo_border.png",
        databasePath: "borders/yugo",
    },
    {
        xpRequired: "15000",
        rewardName: "Predator",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/predator",
    },
    {
        xpRequired: "30000",
        rewardName: "Yugo Blood Hunter",
        rewardType: "skin",
        rewardImage: "Skins/Yugo Blood Hunter.jpeg",
        databasePath: "skins/Yugo Blood Hunter",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Yugo Night",
        rewardType: "skin",
        rewardImage: "Skins/Yugo Night.jpeg",
        databasePath: "skins/Yugo Night",
    },
    {
        xpRequired: "60000",
        rewardName: "Yugo Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/yugo_master",
    },
];
export const talimRewards = [
    {
        xpRequired: "1000",
        rewardName: "Wind Bender",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/wind_bender",
    },
    {
        xpRequired: "2500",
        rewardName: "Talim Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Talim_Icon.png",
        databasePath: "Icons/Talim_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Talim River",
        rewardType: "skin",
        rewardImage: "Skins/Talim River.jpeg",
        databasePath: "skins/Talim River",
    },
    {
        xpRequired: "11500",
        rewardName: "Talim Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/talim_border.png",
        databasePath: "borders/talim",
    },
    {
        xpRequired: "15000",
        rewardName: "Dual Blade Specialist",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/dual_blade_specialist",
    },
    {
        xpRequired: "30000",
        rewardName: "Talim Sunset",
        rewardType: "skin",
        rewardImage: "Skins/Talim Sunset.jpeg",
        databasePath: "skins/Talim Sunset",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Talim Red",
        rewardType: "skin",
        rewardImage: "Skins/Talim Red.jpeg",
        databasePath: "skins/Talim Red",
    },
    {
        xpRequired: "60000",
        rewardName: "Talim Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/talim_master",
    },
];

export const noelRewards = [
    {
        xpRequired: "1000",
        rewardName: "Cop",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cop",
    },
    {
        xpRequired: "2500",
        rewardName: "Noel Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Noel_Icon.png",
        databasePath: "Icons/Noel_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Noel Crimson",
        rewardType: "skin",
        rewardImage: "Skins/Noel Crimson.jpeg",
        databasePath: "skins/Noel Crimson",
    },
    {
        xpRequired: "11500",
        rewardName: "Noel Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/noel_border.png",
        databasePath: "borders/noel",
    },
    {
        xpRequired: "15000",
        rewardName: "Double Pistol",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/double_pistol",
    },
    {
        xpRequired: "30000",
        rewardName: "Noel Black",
        rewardType: "skin",
        rewardImage: "Skins/Noel Black.jpeg",
        databasePath: "skins/Noel Black",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Noel Bubblegum",
        rewardType: "skin",
        rewardImage: "Skins/Noel Bubblegum.jpeg",
        databasePath: "skins/Noel Bubblegum",
    },
    {
        xpRequired: "60000",
        rewardName: "Noel Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/noel_master",
    },
];

export const blankaRewards = [
    {
        xpRequired: "1000",
        rewardName: "The Beast",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/the_beast",
    },
    {
        xpRequired: "2500",
        rewardName: "Blanka Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Blanka_Icon.png",
        databasePath: "Icons/Blanka_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Blanka Dawn",
        rewardType: "skin",
        rewardImage: "Skins/Blanka Dawn.jpeg",
        databasePath: "skins/Blanka Dawn",
    },
    {
        xpRequired: "11500",
        rewardName: "Blanka Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/blanka_border.png",
        databasePath: "borders/blanka",
    },
    {
        xpRequired: "15000",
        rewardName: "Destroyer",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/destroyer",
    },
    {
        xpRequired: "30000",
        rewardName: "Blanka Black",
        rewardType: "skin",
        rewardImage: "Skins/Blanka Black.jpeg",
        databasePath: "skins/Blanka Black",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Blanka Sand",
        rewardType: "skin",
        rewardImage: "Skins/Blanka Sand.jpeg",
        databasePath: "skins/Blanka Sand",
    },
    {
        xpRequired: "60000",
        rewardName: "Blanka Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/blanka_master",
    },
];

export const ninaRewards = [
    {
        xpRequired: "1000",
        rewardName: "Silent Assassin",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/silent_assassin",
    },
    {
        xpRequired: "2500",
        rewardName: "Nina Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Nina_Icon.png",
        databasePath: "Icons/Nina_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Nina Casual",
        rewardType: "skin",
        rewardImage: "Skins/Nina Casual.jpeg",
        databasePath: "skins/Nina Casual",
    },
    {
        xpRequired: "11500",
        rewardName: "Nina Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/nina_border.png",
        databasePath: "borders/nina",
    },
    {
        xpRequired: "15000",
        rewardName: "Deadly Beauty",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/deadly_beauty",
    },
    {
        xpRequired: "30000",
        rewardName: "Nina Black Widow",
        rewardType: "skin",
        rewardImage: "Skins/Nina Black Widow.jpeg",
        databasePath: "skins/Nina Black Widow",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Nina Red Leopard",
        rewardType: "skin",
        rewardImage: "Skins/Nina Red Leopard.jpeg",
        databasePath: "skins/Nina Red Leopard",
    },
    {
        xpRequired: "60000",
        rewardName: "Nina Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/nina_master",
    },
];

export const ayaneRewards = [
    {
        xpRequired: "1000",
        rewardName: "Crimson Butterfly",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/crimson_butterfly",
    },
    {
        xpRequired: "2500",
        rewardName: "Ayane Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Ayane_Icon.png",
        databasePath: "Icons/Ayane_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Ayane Sunset",
        rewardType: "skin",
        rewardImage: "Skins/Ayane Sunset.jpeg",
        databasePath: "skins/Ayane Sunset",
    },
    {
        xpRequired: "11500",
        rewardName: "Ayane Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/ayane_border.png",
        databasePath: "borders/ayane",
    },
    {
        xpRequired: "15000",
        rewardName: "Twilight Assassin",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/twilight_assassin",
    },
    {
        xpRequired: "30000",
        rewardName: "Ayane Cold",
        rewardType: "skin",
        rewardImage: "Skins/Ayane Cold.jpeg",
        databasePath: "skins/Ayane Cold",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Ayane Wild",
        rewardType: "skin",
        rewardImage: "Skins/Ayane Wild.jpeg",
        databasePath: "skins/Ayane Wild",
    },
    {
        xpRequired: "60000",
        rewardName: "Ayane Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/ayane_master",
    },
];
export const siegfriedRewards = [
    {
        xpRequired: "1000",
        rewardName: "Knight of Redemption",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/knight_of_redemption",
    },
    {
        xpRequired: "2500",
        rewardName: "Siegfried Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Siegfried_Icon.png",
        databasePath: "Icons/Siegfried_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Siegfried Copper",
        rewardType: "skin",
        rewardImage: "Skins/Siegfried Copper.jpeg",
        databasePath: "skins/Siegfried Copper",
    },
    {
        xpRequired: "11500",
        rewardName: "Siegfried Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/siegfried_border.png",
        databasePath: "borders/siegfried",
    },
    {
        xpRequired: "15000",
        rewardName: "Warden of the Soul Edge",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/warden_of_the_soul_edge",
    },
    {
        xpRequired: "30000",
        rewardName: "Siegfried Dark",
        rewardType: "skin",
        rewardImage: "Skins/Siegfried Dark.jpeg",
        databasePath: "skins/Siegfried Dark",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Siegfried Hero",
        rewardType: "skin",
        rewardImage: "Skins/Siegfried Hero.jpeg",
        databasePath: "skins/Siegfried Hero",
    },
    {
        xpRequired: "60000",
        rewardName: "Siegfried Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/siegfried_master",
    },
];
export const shomaRewards = [
    {
        xpRequired: "1000",
        rewardName: "Sporty",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/sporty",
    },
    {
        xpRequired: "2500",
        rewardName: "Shoma Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Shoma_Icon.jpeg",
        databasePath: "Icons/Shoma_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Shoma Red",
        rewardType: "skin",
        rewardImage: "Skins/Shoma Red.png",
        databasePath: "skins/Shoma Red",
    },
    {
        xpRequired: "11500",
        rewardName: "Shoma Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/shoma_border.png",
        databasePath: "borders/shoma",
    },
    {
        xpRequired: "15000",
        rewardName: "Baller",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/baller",
    },
    {
        xpRequired: "30000",
        rewardName: "Shoma Green",
        rewardType: "skin",
        rewardImage: "Skins/Shoma Green.png",
        databasePath: "skins/Shoma Green",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Shoma Silver",
        rewardType: "skin",
        rewardImage: "Skins/Shoma Silver.jpeg",
        databasePath: "skins/Shoma Silver",
    },
    {
        xpRequired: "60000",
        rewardName: "Shoma Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/shoma_master",
    },
];
export const subzeroRewards = [
    {
        xpRequired: "1000",
        rewardName: "Cold As Ice",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cold_as_ice",
    },
    {
        xpRequired: "2500",
        rewardName: "Sub Zero Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Sub Zero_Icon.jpeg",
        databasePath: "Icons/Sub Zero_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Sub Zero Frozen",
        rewardType: "skin",
        rewardImage: "Skins/Sub Zero Frozen.jpeg",
        databasePath: "skins/Sub Zero Frozen",
    },
    {
        xpRequired: "11500",
        rewardName: "Sub Zero Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/sub zero_border.png",
        databasePath: "borders/sub zero",
    },
    {
        xpRequired: "15000",
        rewardName: "Frozen Hearted",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/frozen_hearted",
    },
    {
        xpRequired: "30000",
        rewardName: "Sub Zero Tundra",
        rewardType: "skin",
        rewardImage: "Skins/Sub Zero Tundra.jpeg",
        databasePath: "skins/Sub Zero Tundra",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Sub Zero Frostbite",
        rewardType: "skin",
        rewardImage: "Skins/Sub Zero Frostbite.jpeg",
        databasePath: "skins/Sub Zero Frostbite",
    },
    {
        xpRequired: "60000",
        rewardName: "Sub Zero Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/sub zero_master",
    },
];

export const kokoroRewards = [
    {
        xpRequired: "1000",
        rewardName: "Enchanter",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/enchanter",
    },
    {
        xpRequired: "2500",
        rewardName: "Kokoro Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Kokoro_Icon.png",
        databasePath: "Icons/Kokoro_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Kokoro Black",
        rewardType: "skin",
        rewardImage: "Skins/Kokoro Black.jpeg",
        databasePath: "skins/Kokoro Black",
    },
    {
        xpRequired: "11500",
        rewardName: "Kokoro Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/kokoro_border.png",
        databasePath: "borders/kokoro",
    },
    {
        xpRequired: "15000",
        rewardName: "Daughter",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/daughter",
    },
    {
        xpRequired: "30000",
        rewardName: "Kokoro Flowerstorm",
        rewardType: "skin",
        rewardImage: "Skins/Kokoro Flowerstorm.jpeg",
        databasePath: "skins/Kokoro Flowerstorm",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Kokoro Red Rose",
        rewardType: "skin",
        rewardImage: "Skins/Kokoro Red Rose.jpeg",
        databasePath: "skins/Kokoro Red Rose",
    },
    {
        xpRequired: "60000",
        rewardName: "Kokoro Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kokoro_master",
    },
];

export const eagleRewards = [
    {
        xpRequired: "1000",
        rewardName: "Hunter",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/hunter",
    },
    {
        xpRequired: "2500",
        rewardName: "Eagle Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Eagle_Icon.png",
        databasePath: "Icons/Eagle_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Eagle Green",
        rewardType: "skin",
        rewardImage: "Skins/Eagle Green.jpeg",
        databasePath: "skins/Eagle Green",
    },
    {
        xpRequired: "11500",
        rewardName: "Eagle Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/eagle_border.png",
        databasePath: "borders/eagle",
    },
    {
        xpRequired: "15000",
        rewardName: "Air Strike",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/air_strike",
    },
    {
        xpRequired: "30000",
        rewardName: "Eagle Purple",
        rewardType: "skin",
        rewardImage: "Skins/Eagle Purple.jpeg",
        databasePath: "skins/Eagle Purple",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Eagle Black",
        rewardType: "skin",
        rewardImage: "Skins/Eagle Black.jpeg",
        databasePath: "skins/Eagle Black",
    },
    {
        xpRequired: "60000",
        rewardName: "Eagle Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/eagle_master",
    },
];
export const sophitiaRewards = [
    {
        xpRequired: "1000",
        rewardName: "Chosen by the Gods",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/chosen_by_the_gods",
    },
    {
        xpRequired: "2500",
        rewardName: "Sophitia Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Sophitia_Icon.png",
        databasePath: "Icons/Sophitia_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Sophitia Sunset",
        rewardType: "skin",
        rewardImage: "Skins/Sophitia Sunset.jpeg",
        databasePath: "skins/Sophitia Sunset",
    },
    {
        xpRequired: "11500",
        rewardName: "Sophitia Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/sophitia_border.png",
        databasePath: "borders/sophitia",
    },
    {
        xpRequired: "15000",
        rewardName: "WWarrior of Divine Grace",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/wwarrior_of_divine_grace",
    },
    {
        xpRequired: "30000",
        rewardName: "Sophitia Dark",
        rewardType: "skin",
        rewardImage: "Skins/Sophitia Dark.jpeg",
        databasePath: "skins/Sophitia Dark",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Sophitia Dawn",
        rewardType: "skin",
        rewardImage: "Skins/Sophitia Dawn.jpeg",
        databasePath: "skins/Sophitia Dawn",
    },
    {
        xpRequired: "60000",
        rewardName: "Sophitia Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/sophitia_master",
    },
];

export const shizumaruRewards = [
    {
        xpRequired: "1000",
        rewardName: "Little Samurai",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/little_samurai",
    },
    {
        xpRequired: "2500",
        rewardName: "Shizumaru Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Shizumaru_Icon.png",
        databasePath: "Icons/Shizumaru_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Shizumaru Dark",
        rewardType: "skin",
        rewardImage: "Skins/Shizumaru Dark.jpeg",
        databasePath: "skins/Shizumaru Dark",
    },
    {
        xpRequired: "11500",
        rewardName: "Shizumaru Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/shizumaru_border.png",
        databasePath: "borders/shizumaru",
    },
    {
        xpRequired: "15000",
        rewardName: "Demon Child",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/demon_child",
    },
    {
        xpRequired: "30000",
        rewardName: "Shizumaru Light",
        rewardType: "skin",
        rewardImage: "Skins/Shizumaru Light.jpeg",
        databasePath: "skins/Shizumaru Light",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Shizumaru Punch",
        rewardType: "skin",
        rewardImage: "Skins/Shizumaru Punch.jpeg",
        databasePath: "skins/Shizumaru Punch",
    },
    {
        xpRequired: "60000",
        rewardName: "Shizumaru Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/shizumaru_master",
    },
];

export const kagomeRewards = [
    {
        xpRequired: "1000",
        rewardName: "Brave Girl",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/brave_girl",
    },
    {
        xpRequired: "2500",
        rewardName: "Kagome Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Kagome_Icon.png",
        databasePath: "Icons/Kagome_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Kagome Red",
        rewardType: "skin",
        rewardImage: "Skins/Kagome Red.jpeg",
        databasePath: "skins/Kagome Red",
    },
    {
        xpRequired: "11500",
        rewardName: "Kagome Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/kagome_border.png",
        databasePath: "borders/kagome",
    },
    {
        xpRequired: "15000",
        rewardName: "Archer",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/archer",
    },
    {
        xpRequired: "30000",
        rewardName: "Kagome Bubblegum",
        rewardType: "skin",
        rewardImage: "Skins/Kagome Bubblegum.jpeg",
        databasePath: "skins/Kagome Bubblegum",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Kagome Ocean",
        rewardType: "skin",
        rewardImage: "Skins/Kagome Ocean.jpeg",
        databasePath: "skins/Kagome Ocean",
    },
    {
        xpRequired: "60000",
        rewardName: "Kagome Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kagome_master",
    },
];
export const aliceRewards = [
    {
        xpRequired: "1000",
        rewardName: "Bunny Hop",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/bunny_hop",
    },
    {
        xpRequired: "2500",
        rewardName: "Alice Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Alice_Icon.png",
        databasePath: "Icons/Alice_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Alice Mystic",
        rewardType: "skin",
        rewardImage: "Skins/Alice Mystic.jpeg",
        databasePath: "skins/Alice Mystic",
    },
    {
        xpRequired: "11500",
        rewardName: "Alice Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/alice_border.png",
        databasePath: "borders/alice",
    },
    {
        xpRequired: "15000",
        rewardName: "Furry",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/furry",
    },
    {
        xpRequired: "30000",
        rewardName: "Alice Dark",
        rewardType: "skin",
        rewardImage: "Skins/Alice Dark.jpeg",
        databasePath: "skins/Alice Dark",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Alice Red",
        rewardType: "skin",
        rewardImage: "Skins/Alice Red.jpeg",
        databasePath: "skins/Alice Red",
    },
    {
        xpRequired: "60000",
        rewardName: "Alice Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/alice_master",
    },
];
export const shinnokRewards = [
    {
        xpRequired: "1000",
        rewardName: "Fallen Elder God",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/fallen_elder_god",
    },
    {
        xpRequired: "2500",
        rewardName: "Shinnok Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Shinnok_Icon.png",
        databasePath: "Icons/Shinnok_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Shinnok Enchanter",
        rewardType: "skin",
        rewardImage: "Skins/Shinnok Enchanter.jpeg",
        databasePath: "skins/Shinnok Enchanter",
    },
    {
        xpRequired: "11500",
        rewardName: "Shinnok Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/shinnok_border.png",
        databasePath: "borders/shinnok",
    },
    {
        xpRequired: "15000",
        rewardName: "Chaos Maker",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/chaos_maker",
    },
    {
        xpRequired: "30000",
        rewardName: "Shinnok Warlock",
        rewardType: "skin",
        rewardImage: "Skins/Shinnok Warlock.jpeg",
        databasePath: "skins/Shinnok Warlock",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Shinnok Dark Mage",
        rewardType: "skin",
        rewardImage: "Skins/Shinnok Dark Mage.jpeg",
        databasePath: "skins/Shinnok Dark Mage",
    },
    {
        xpRequired: "60000",
        rewardName: "Shinnok Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/shinnok_master",
    },
];

export const fangRewards = [
    {
        xpRequired: "1000",
        rewardName: "Mad Scientist",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/mad_scientist",
    },
    {
        xpRequired: "2500",
        rewardName: "FANG Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/FANG_Icon.png",
        databasePath: "Icons/FANG_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "FANG Dark",
        rewardType: "skin",
        rewardImage: "Skins/FANG Dark.jpeg",
        databasePath: "skins/FANG Dark",
    },
    {
        xpRequired: "11500",
        rewardName: "FANG Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/fang_border.png",
        databasePath: "borders/fang",
    },
    {
        xpRequired: "15000",
        rewardName: "Crazy Alchemist",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/crazy_alchemist",
    },
    {
        xpRequired: "30000",
        rewardName: "FANG Trader",
        rewardType: "skin",
        rewardImage: "Skins/FANG Trader.jpeg",
        databasePath: "skins/FANG Trader",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "FANG Poision",
        rewardType: "skin",
        rewardImage: "Skins/FANG Poision.jpeg",
        databasePath: "skins/FANG Poision",
    },
    {
        xpRequired: "60000",
        rewardName: "FANG Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/fang_master",
    },
];

export const maiRewards = [
    {
        xpRequired: "1000",
        rewardName: "Elegant",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/elegant",
    },
    {
        xpRequired: "2500",
        rewardName: "Mai Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Mai_Icon.png",
        databasePath: "Icons/Mai_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Mai Blue",
        rewardType: "skin",
        rewardImage: "Skins/Mai Blue.jpeg",
        databasePath: "skins/Mai Blue",
    },
    {
        xpRequired: "11500",
        rewardName: "Mai Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/mai_border.png",
        databasePath: "borders/mai",
    },
    {
        xpRequired: "15000",
        rewardName: "Firestarter",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/firestarter",
    },
    {
        xpRequired: "30000",
        rewardName: "Mai Grey",
        rewardType: "skin",
        rewardImage: "Skins/Mai Grey.jpeg",
        databasePath: "skins/Mai Grey",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Mai Light",
        rewardType: "skin",
        rewardImage: "Skins/Mai Light.jpeg",
        databasePath: "skins/Mai Light",
    },
    {
        xpRequired: "60000",
        rewardName: "Mai Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/mai_master",
    },
];


export const liliRewards = [
    {
        xpRequired: "1000",
        rewardName: "Rich",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/rich",
    },
    {
        xpRequired: "2500",
        rewardName: "Lili Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Lili_Icon.png",
        databasePath: "Icons/Lili_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Lili Red",
        rewardType: "skin",
        rewardImage: "Skins/Lili Red.jpeg",
        databasePath: "skins/Lili Red",
    },
    {
        xpRequired: "11500",
        rewardName: "Lili Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/lili_border.png",
        databasePath: "borders/lili",
    },
    {
        xpRequired: "15000",
        rewardName: "Flawless",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/flawless",
    },
    {
        xpRequired: "30000",
        rewardName: "Lili Dark",
        rewardType: "skin",
        rewardImage: "Skins/Lili Dark.jpeg",
        databasePath: "skins/Lili Dark",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Lili Golden",
        rewardType: "skin",
        rewardImage: "Skins/Lili Golden.jpeg",
        databasePath: "skins/Lili Golden",
    },
    {
        xpRequired: "60000",
        rewardName: "Lili Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/lili_master",
    },
];

export const megamanRewards = [
    {
        xpRequired: "1000",
        rewardName: "Cyber Warrior",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/cyber_warrior",
    },
    {
        xpRequired: "2500",
        rewardName: "Mega Man Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Mega Man_Icon.png",
        databasePath: "Icons/Mega Man_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Mega Man Violet",
        rewardType: "skin",
        rewardImage: "Skins/Mega Man Violet.jpeg",
        databasePath: "skins/Mega Man Violet",
    },
    {
        xpRequired: "11500",
        rewardName: "Mega Man Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/mega man_border.png",
        databasePath: "borders/mega man",
    },
    {
        xpRequired: "15000",
        rewardName: "Defender of the Future",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/defender_of_the_future",
    },
    {
        xpRequired: "30000",
        rewardName: "Mega Man Evil",
        rewardType: "skin",
        rewardImage: "Skins/Mega Man Evil.jpeg",
        databasePath: "skins/Mega Man Evil",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Mega Man Monochrome",
        rewardType: "skin",
        rewardImage: "Skins/Mega Man Monochrome.jpeg",
        databasePath: "skins/Mega Man Monochrome",
    },
    {
        xpRequired: "60000",
        rewardName: "Mega Man Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/mega man_master",
    },
];

export const christieRewards = [
    {
        xpRequired: "1000",
        rewardName: "Dancer",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/dancer",
    },
    {
        xpRequired: "2500",
        rewardName: "Christie Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Christie_Icon.png",
        databasePath: "Icons/Christie_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Christie Black",
        rewardType: "skin",
        rewardImage: "Skins/Christie Black.jpeg",
        databasePath: "skins/Christie Black",
    },
    {
        xpRequired: "11500",
        rewardName: "Christie Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/christie_border.png",
        databasePath: "borders/christie",
    },
    {
        xpRequired: "15000",
        rewardName: "Go Easy On Me!",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/go_easy_on_me!",
    },
    {
        xpRequired: "30000",
        rewardName: "Christie Samba",
        rewardType: "skin",
        rewardImage: "Skins/Christie Samba.jpeg",
        databasePath: "skins/Christie Samba",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Christie Wind",
        rewardType: "skin",
        rewardImage: "Skins/Christie Wind.jpeg",
        databasePath: "skins/Christie Wind",
    },
    {
        xpRequired: "60000",
        rewardName: "Christie Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/christie_master",
    },
];
export const kumaRewards = [
    {
        xpRequired: "1000",
        rewardName: "Grizzly Bear",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/grizzly_bear",
    },
    {
        xpRequired: "2500",
        rewardName: "Kuma Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Kuma_Icon.png",
        databasePath: "Icons/Kuma_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Kuma Hunter",
        rewardType: "skin",
        rewardImage: "Skins/Kuma Hunter.jpeg",
        databasePath: "skins/Kuma Hunter",
    },
    {
        xpRequired: "11500",
        rewardName: "Kuma Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/kuma_border.png",
        databasePath: "borders/kuma",
    },
    {
        xpRequired: "15000",
        rewardName: "Wild",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/wild",
    },
    {
        xpRequired: "30000",
        rewardName: "Kuma Black",
        rewardType: "skin",
        rewardImage: "Skins/Kuma Black.jpeg",
        databasePath: "skins/Kuma Black",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Kuma Pink",
        rewardType: "skin",
        rewardImage: "Skins/Kuma Pink.jpeg",
        databasePath: "skins/Kuma Pink",
    },
    {
        xpRequired: "60000",
        rewardName: "Kuma Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kuma_master",
    },
];
export const kabalRewards = [
    {
        xpRequired: "1000",
        rewardName: "Gas",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/gas",
    },
    {
        xpRequired: "2500",
        rewardName: "Kabal Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Kabal_Icon.png",
        databasePath: "Icons/Kabal_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Kabal Blue",
        rewardType: "skin",
        rewardImage: "Skins/Kabal Blue.jpeg",
        databasePath: "skins/Kabal Blue",
    },
    {
        xpRequired: "11500",
        rewardName: "Kabal Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/kabal_border.png",
        databasePath: "borders/kabal",
    },
    {
        xpRequired: "15000",
        rewardName: "Speedy",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/speedy",
    },
    {
        xpRequired: "30000",
        rewardName: "Kabal Red",
        rewardType: "skin",
        rewardImage: "Skins/Kabal Red.jpeg",
        databasePath: "skins/Kabal Red",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Kabal Yellow",
        rewardType: "skin",
        rewardImage: "Skins/Kabal Yellow.jpeg",
        databasePath: "skins/Kabal Yellow",
    },
    {
        xpRequired: "60000",
        rewardName: "Kabal Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/kabal_master",
    },
];
export const juriRewards = [
    {
        xpRequired: "1000",
        rewardName: "Dark",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/dark",
    },
    {
        xpRequired: "2500",
        rewardName: "Juri Icon",
        rewardType: "icon",
        rewardImage: "Icons/Profile/Juri_Icon.jpeg",
        databasePath: "Icons/Juri_Icon",
    },
    {
        xpRequired: "5000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "8500",
        rewardName: "Juri Red",
        rewardType: "skin",
        rewardImage: "Skins/Juri Red.jpeg",
        databasePath: "skins/Juri Red",
    },
    {
        xpRequired: "11500",
        rewardName: "Juri Loading Screen Border",
        rewardType: "border",
        rewardImage: "borders/juri_border.png",
        databasePath: "borders/juri",
    },
    {
        xpRequired: "15000",
        rewardName: "Let's Play",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/let's_play",
    },
    {
        xpRequired: "30000",
        rewardName: "Juri Dark",
        rewardType: "skin",
        rewardImage: "Skins/Juri Dark.jpeg",
        databasePath: "skins/Juri Dark",
    },
    {
        xpRequired: "45000",
        rewardName: "Free Lootbox",
        rewardType: "lootbox",
        rewardImage: "res/img/basicbox.png",
        databasePath: "freelootbox",
    },
    {
        xpRequired: "50000",
        rewardName: "Juri Monochrome",
        rewardType: "skin",
        rewardImage: "Skins/Juri Monochrome.jpeg",
        databasePath: "skins/Juri Monochrome",
    },
    {
        xpRequired: "60000",
        rewardName: "Juri Master",
        rewardType: "title",
        rewardImage: "titles/titleimage.jpeg",
        databasePath: "titles/juri_master",
    },
];



// Helper function to get rewards for Julia
export function getJuliaRewards(userId) {
    return characterRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Shizumaru
export function getShizumaruRewards(userId) {
    return shizumaruRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

//Helper function to get rewards for kabal
export function getkabalRewards(userId) {
    return kabalRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

//Helper function to get rewards for Kuma
export function getkumaRewards(userId) {
    return kumaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Mai
export function getMaiRewards(userId) {
    return maiRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Megaman
export function getmegamanRewards(userId) {
    return megamanRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}


// Helper function to get rewards for Juri
export function getJuriRewards(userId) {
    return juriRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Lili
export function getLiliRewards(userId) {
    return liliRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Christie
export function getChristieRewards(userId) {
    return christieRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Sophitia
export function getSophitiaRewards(userId) {
    return sophitiaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}


// Helper function to get rewards for Fang
export function getFangRewards(userId) {
    return fangRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Alice
export function getAliceRewards(userId) {
    return aliceRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Shinnok
export function getShinnokRewards(userId) {
    return shinnokRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Kagome
export function getKagomeRewards(userId) {
    return kagomeRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Ayane
export function getAyaneRewards(userId) {
    return ayaneRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Shoma
export function getShomaRewards(userId) {
    return shomaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Eagle
export function getEagleRewards(userId) {
    return eagleRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}


// Helper function to get rewards for Kokoro
export function getKokoroRewards(userId) {
    return kokoroRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Sub Zero
export function getsubZeroRewards(userId) {
    return subzeroRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Siegfried
export function getSiegfriedRewards(userId) {
    return siegfriedRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}   


// Helper function to get rewards for Reptile
export function getReptileRewards(userId) {
    return reptileRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Nina
export function getNinaRewards(userId) {
    return ninaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Talim
export function getTalimRewards(userId) {
    return talimRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}


// Helper function to get rewards for Ibuki
export function getIbukiRewards(userId) {
    return ibukiRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Yugo
export function getYugoRewards(userId) {
    return yugoRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Noël
export function getNoelRewards(userId) {
    return noelRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Raiden
export function getRaidenRewards(userId) {
    return raidenRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Blanka
export function getBlankaRewards(userId) {
    return blankaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for R.Mika
export function getRMikaRewards(userId) {
    return rmikaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Akuma
export function getAkumaRewards(userId) {
    return akumaRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Peacock
export function getPeacockRewards(userId) {
    return peacockRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Birdie
export function getBirdieRewards(userId) {
    return birdieRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Erron Black
export function getErronBlackRewards(userId) {
    return erronBlackRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Astaroth
export function getAstarothRewards(userId) {
    return astarothRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Scorpion
export function getScorpionRewards(userId) {
    return scorpionRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Cham Cham
export function getChamChamRewards(userId) {
    return chamChamRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Morrigan
export function getMorriganRewards(userId) {
    return morriganRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Jun
export function getJunRewards(userId) {
    return junRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Elphelt
export function getElpheltRewards(userId) {
    return elpheltRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to get rewards for Kotal Kahn
export function getKotalKahnRewards(userId) {
    return kotalkahnRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}



// Helper function to get rewards for Angel
export function getAngelRewards(userId) {
    return angelRewards.map(reward => ({
        ...reward,
        databasePath: `users/${userId}/${reward.databasePath}`
    }));
}

// Helper function to check if a reward is unlocked
export function isRewardUnlocked(characterXP, rewardXP) {
    return characterXP >= rewardXP;
}

// Helper function to get next available reward
export function getNextReward(characterXP, character) {
    const rewardsArray = character === 'R Mika' ? rmikaRewards : characterRewards;
    return rewardsArray.find(reward => reward.xpRequired > characterXP);
}



// Updated claimReward function with proper database reference
export async function claimReward(database, userId, reward, character) {
    try {
        const updates = {};
        
        switch(reward.rewardType) {
            case 'title':
                updates[`users/${userId}/titles/${reward.databasePath.split('/').pop()}`] = true;
                break;
            case 'icon':
                updates[`users/${userId}/Icons/${reward.databasePath.split('/').pop()}`] = 1;
                break;
            case 'border':
                updates[`users/${userId}/borders/${reward.databasePath.split('/').pop()}`] = true;
                break;
            case 'skin':
                updates[`users/${userId}/skins/${reward.databasePath.split('/').pop()}`] = true;
                break;
            case 'lootbox':
                const lootboxRef = ref(database, `users/${userId}/freelootbox`);
                const lootboxSnap = await get(lootboxRef);
                const currentLootboxes = lootboxSnap.val() || 0;
                updates[`users/${userId}/freelootbox`] = currentLootboxes + 1;
                break;
        }
        
        // Mark reward as claimed under the character's progress
        updates[`users/${userId}/characters/${character}/claimedRewards/${reward.rewardName}`] = true;
        
        return update(ref(database), updates);
    } catch (error) {
        console.error('Error claiming reward:', error);
        throw error;
    }
}

// Update these helper functions to handle both characters
export function calculateProgress(currentXP, nextRewardXP, character) {
    const rewardsArray = 
        character === 'R Mika' ? rmikaRewards : 
        character === 'Birdie' ? birdieRewards : 
        character === 'Erron Black' ? erronBlackRewards : 
        character === 'Cham Cham' ? chamChamRewards : 
        character === 'Morrigan' ? morriganRewards : 
        character === 'Jun' ? junRewards :
        character === 'Reptile' ? reptileRewards :
        character === 'Akuma' ? akumaRewards :
        character === 'Elphelt' ? elpheltRewards :
        character === 'Kotal Kahn' ? kotalkahnRewards :
        character === 'Scorpion' ? scorpionRewards :
        character === 'Peacock' ? peacockRewards :
        character === 'Angel' ? angelRewards :
        character === 'Astaroth' ? astarothRewards :
        character === 'Ibuki' ? ibukiRewards :
        character === 'Raiden' ? raidenRewards :
        character === 'Yugo' ? yugoRewards :
        character === 'Talim' ? talimRewards :
        character === 'Noel' ? noelRewards :
        character === 'Blanka' ? blankaRewards :
        character === 'Nina' ? ninaRewards :
        character === 'Ayane' ? ayaneRewards :
        character === 'Siegfried' ? siegfriedRewards :
        character === 'Shoma' ? shomaRewards :
        character === 'Sub Zero' ? subzeroRewards :
        character === 'Kokoro' ? kokoroRewards :
        character === 'Shizumaru' ? shizumaruRewards :
        character === 'Eagle' ? eagleRewards :
        character === 'Sophitia' ? sophitiaRewards :
        character === 'Kagome' ? kagomeRewards :
        character === 'Alice' ? aliceRewards :
        character === 'Shinnok' ? shinnokRewards :
        character === 'Fang' ? fangRewards :
        character === 'Lili' ? liliRewards :
        character === 'Mega Man' ? megamanRewards :
        character === 'Mai' ? maiRewards :
        character === 'Christie' ? christieRewards :
        character === 'Kuma' ? kumaRewards :
        character === 'Kabal' ? kabalRewards :
        character === 'Juri' ? juriRewards :
        characterRewards; 
    
    const previousReward = rewardsArray
        .filter(reward => reward.xpRequired <= currentXP)
        .pop() || { xpRequired: 0 };
    
    const progress = (currentXP - previousReward.xpRequired) / 
                    (nextRewardXP - previousReward.xpRequired) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
}

export function getRewardTier(xp) {
    if (xp >= 50000) return 'MASTER';
    if (xp >= 30000) return 'EXPERT';
    if (xp >= 15000) return 'ADVANCED';
    if (xp >= 5000) return 'INTERMEDIATE';
    return 'BEGINNER';
} 