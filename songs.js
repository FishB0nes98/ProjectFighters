// songs.js - List of all available songs with their IDs for the music player
// Note: IDs should match the keys used in Firebase FavoriteMusic

const songs = [
    {
        id: "razor_kisses",
        title: "Razor Kisses",
        artist: "Rebellious",
        path: "Songs/Razor Kisses (Rebellious Ayane Theme).mp3",
        description: "Rebellious Ayane's Theme",
        cover: "Loading Screen/Rebellious Ayane.png"
    },
    {
        id: "love_and_fire",
        title: "Love and Fire",
        artist: "Rebellious",
        path: "Songs/Love and Fire (Rebellious Anna Theme).mp3",
        description: "Rebellious Anna's Theme",
        cover: "Loading Screen/Rebellious Anna.png"
    },
    {
        id: "neon_chains",
        title: "Neon Chains",
        artist: "Rebellious",
        path: "Songs/Neon Chains (Rebellious Kabal Theme).mp3",
        description: "Rebellious Kabal's Theme",
        cover: "Loading Screen/Rebellious Kabal.png"
    },
    {
        id: "unstoppable_ice",
        title: "Unstoppable Ice",
        artist: "Monster Trainer",
        path: "Songs/Unstoppable Ice (Monster Trainer Ayane Theme).mp3",
        description: "Monster Trainer Ayane's Theme",
        cover: "Loading Screen/Monster Trainer Ayane.png"
    },
    {
        id: "trainers_pride",
        title: "Trainer's Pride",
        artist: "Monster Trainer",
        path: "Songs/Trainers Pride (Monster Trainer Kokoro Theme).mp3",
        description: "Monster Trainer Kokoro's Theme",
        cover: "Loading Screen/Monster Trainer Kokoro.png"
    },
    {
        id: "infernos_rise",
        title: "Inferno's Rise",
        artist: "Monster Trainer",
        path: "Songs/Infernos Rise (Monster Trainer Shoma Theme).mp3",
        description: "Monster Trainer Shoma's Theme",
        cover: "Loading Screen/Monster Trainer Shoma.png"
    },
    {
        id: "animal_instinct",
        title: "Animal Instinct",
        artist: "Tokyo Mew Mew",
        path: "Songs/animal_instinct_tokyo_mew_mew.mp3",
        description: "Tokyo Mew Mew Battle Theme",
        cover: "Event/Tokyo Mew Mew Event 2.png"
    },
    {
        id: "team_up",
        title: "Team Up",
        artist: "Tokyo Mew Mew",
        path: "Songs/team_up_tokyo_mew_mew.mp3",
        description: "Tokyo Mew Mew Victory Theme",
        cover: "Loading Screen/Tokyo Mew Mew Ayane.png"
    },
    {
        id: "born_of_light",
        title: "Born of Light",
        artist: "Celestial Protector",
        path: "Songs/Born of Light (Celestial Protector Lili Theme).mp3",
        description: "Celestial Protector Lili's Theme",
        cover: "Loading Screen/Celestial Protector Lili.png"
    },
    {
        id: "twilight_shadows",
        title: "Twilight Shadows",
        artist: "Celestial Protector",
        path: "Songs/Twilight Shadows (Celestial Protector Juri Theme).mp3",
        description: "Celestial Protector Juri's Theme",
        cover: "Loading Screen/Celestial Protector Juri.png"
    },
    {
        id: "starlit_sky",
        title: "Starlit Sky",
        artist: "Celestial Protector",
        path: "Songs/Starlit Sky (Celestial Protector R Mika Theme).mp3",
        description: "Celestial Protector R Mika's Theme",
        cover: "Loading Screen/Celestial Protector R Mika.png"
    },
    {
        id: "love_day",
        title: "Love Day 2024",
        artist: "Event Theme",
        path: "Songs/Love Day 2024 (Event Theme).mp3",
        description: "Love Day 2024 Event Theme",
        cover: "Event/Love Day Event.webp"
    },
    {
        id: "date_night_prep",
        title: "Date Night Prep",
        artist: "Date Night",
        path: "Songs/Date Night Prep (Date Night Mega Man Theme).mp3",
        description: "Date Night Mega Man's Theme",
        cover: "Loading Screen/Date Night Mega Man.png"
    },
    {
        id: "lovely_wind",
        title: "Lovely Wind",
        artist: "Lovely Theme",
        path: "Songs/Lovely Wind (Lovely Kagome Theme).mp3",
        description: "Lovely Kagome's Theme",
        cover: "Loading Screen/Lovely Kagome.png"
    },
    {
        id: "moonlight",
        title: "Moonlight",
        artist: "Lunar Festival",
        path: "Songs/Moonlight (Lunar Festival Kokoro Theme).mp3",
        description: "Lunar Festival Kokoro's Theme",
        cover: "Loading Screen/Lunar Festival Kokoro.png"
    },
    {
        id: "lunar_festival",
        title: "Lunar Festival 2024",
        artist: "Event Theme",
        path: "Songs/Lunar Festival 2024 (Event Theme).mp3",
        description: "Lunar Festival 2024 Event Theme",
        cover: "Event/Lunar Festival 2024 Event.png"
    },
    {
        id: "welcome_to_atlantis",
        title: "Welcome To Atlantis",
        artist: "Event Theme",
        path: "Songs/Welcome To Atlantis (Event Theme).mp3",
        description: "Atlantean Event Theme",
        cover: "Event/Atlantis Event.jpeg"
    },
    {
        id: "under_the_sea",
        title: "Under the Sea",
        artist: "Atlantean",
        path: "Songs/Under the Sea (Atlantean Christie Theme).mp3",
        description: "Atlantean Christie's Theme",
        cover: "Loading Screen/Atlantean Christie.png"
    },
    {
        id: "capoeira_queen",
        title: "Capoeira Queen",
        artist: "Character Theme",
        path: "Songs/Capoeira Queen (Christie Theme).mp3",
        description: "Christie's Character Theme",
        cover: "Loading Screen/Christie.png"
    },
    {
        id: "forest_wanderer",
        title: "Forest Wanderer",
        artist: "Character Theme",
        path: "Songs/Forest Wanderer (Julia Theme).mp3",
        description: "Julia's Character Theme",
        cover: "Loading Screen/Julia.png"
    },
    {
        id: "skater_boy_riffs",
        title: "Skater Boy Riffs",
        artist: "Skater Theme",
        path: "Songs/Skater Boy Riffs (Skater Shoma Theme).mp3",
        description: "Skater Shoma's Theme",
        cover: "Loading Screen/Skater Shoma.png"
    },
    {
        id: "snowball_princess",
        title: "Snowball Princess",
        artist: "Winter Festival",
        path: "Songs/Snowball Princess (Winter Festival Lili Theme).mp3",
        description: "Winter Festival Lili's Theme",
        cover: "Loading Screen/Winter Festival Lili.png"
    },
    {
        id: "flight_of_the_snow_queen",
        title: "Flight of the Snow Queen",
        artist: "Winter Festival",
        path: "Songs/Flight of the Snow Queen Angel (Winter Queen Angel Theme).mp3",
        description: "Winter Queen Angel's Theme",
        cover: "Loading Screen/Winter Queen Angel.png"
    },
    {
        id: "jingle_bells",
        title: "Jingle Bells",
        artist: "Winter Festival",
        path: "Songs/Jingle Bells (Winter Festival Shizumaru Theme).mp3",
        description: "Winter Festival Shizumaru's Theme",
        cover: "Loading Screen/Winter Festival Shizumaru.png"
    },
];

export default songs; 