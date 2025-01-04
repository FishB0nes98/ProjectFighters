import { ref, get, getDatabase } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import songs from './songs.js';

// Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export function initMusicPlayer() {
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let audio = new Audio();
    let availableSongs = [];
    
    // Get DOM elements
    const musicPlayer = document.querySelector('.music-player');
    const playBtn = musicPlayer.querySelector('.play-btn');
    const prevBtn = musicPlayer.querySelector('.prev-btn');
    const nextBtn = musicPlayer.querySelector('.next-btn');
    const shuffleBtn = musicPlayer.querySelector('.shuffle-btn');
    const volumeSlider = musicPlayer.querySelector('.volume-slider');
    const progressBar = musicPlayer.querySelector('.progress');
    const progressHandle = musicPlayer.querySelector('.progress-handle');
    const currentTimeDisplay = musicPlayer.querySelector('.current-time');
    const durationDisplay = musicPlayer.querySelector('.duration');
    const coverArt = musicPlayer.querySelector('.cover-art img');
    const songTitle = musicPlayer.querySelector('.song-title');
    const artistName = musicPlayer.querySelector('.artist-name');
    const playlistItems = musicPlayer.querySelector('.playlist-items');
    const musicPlayerToggle = document.querySelector('.music-player-toggle');
    const playlistToggle = musicPlayer.querySelector('.playlist-toggle');

    // Initialize volume
    audio.volume = volumeSlider.value / 100;

    // Get user's owned songs from Firebase
    const auth = getAuth();
    const database = getDatabase();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userSongsRef = ref(database, `users/${user.uid}/Songs`);
                const snapshot = await get(userSongsRef);
                const ownedSongs = snapshot.val() || {};

                // Filter songs based on ownership
                availableSongs = songs.filter(song => {
                    const songName = song.path.split('/').pop().replace('.mp3', '');
                    return ownedSongs[songName] === 1;
                });

                // Clear existing playlist
                playlistItems.innerHTML = '';

                // Load songs into playlist
                availableSongs.forEach((song, index) => {
                    const li = document.createElement('li');
                    li.textContent = song.title;
                    li.addEventListener('click', () => {
                        currentSongIndex = index;
                        loadSong();
                        playSong();
                    });
                    playlistItems.appendChild(li);
                });

                // Load initial song if available
                if (availableSongs.length > 0) {
                    // Start with a random song
                    currentSongIndex = Math.floor(Math.random() * availableSongs.length);
                    loadSong();
                }
            } catch (error) {
                console.error('Error loading owned songs:', error);
            }
        }
    });

    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        if (isShuffle) {
            shuffleToNextSong();
        } else {
            nextSong();
        }
    });

    // Progress bar click handling
    const progressContainer = musicPlayer.querySelector('.progress-container');
    progressContainer.addEventListener('click', setProgress);

    // Toggle music player visibility
    musicPlayerToggle.addEventListener('click', () => {
        musicPlayer.classList.toggle('show');
    });

    // Toggle playlist visibility
    playlistToggle.addEventListener('click', () => {
        musicPlayer.classList.toggle('show-playlist');
    });

    function loadSong() {
        if (availableSongs.length === 0) return;
        
        const song = availableSongs[currentSongIndex];
        audio.src = song.path;
        coverArt.src = song.cover;
        songTitle.textContent = song.title;
        artistName.textContent = `${song.artist}`;
        
        // Update playlist selection
        const playlistItems = musicPlayer.querySelectorAll('.playlist-items li');
        playlistItems.forEach((item, index) => {
            if (index === currentSongIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function playSong() {
        if (availableSongs.length === 0) return;
        
        musicPlayer.classList.add('playing');
        playBtn.querySelector('i').classList.remove('fa-play');
        playBtn.querySelector('i').classList.add('fa-pause');
        audio.play();
        isPlaying = true;
    }

    function pauseSong() {
        musicPlayer.classList.remove('playing');
        playBtn.querySelector('i').classList.remove('fa-pause');
        playBtn.querySelector('i').classList.add('fa-play');
        audio.pause();
        isPlaying = false;
    }

    function togglePlay() {
        if (availableSongs.length === 0) return;
        
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    }

    function prevSong() {
        if (availableSongs.length === 0) return;
        
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = availableSongs.length - 1;
        }
        loadSong();
        playSong();
    }

    function nextSong() {
        if (availableSongs.length === 0) return;
        
        currentSongIndex++;
        if (currentSongIndex >= availableSongs.length) {
            currentSongIndex = 0;
        }
        loadSong();
        playSong();
    }

    function shuffleToNextSong() {
        if (availableSongs.length <= 1) return;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * availableSongs.length);
        } while (newIndex === currentSongIndex);
        currentSongIndex = newIndex;
        loadSong();
        playSong();
    }

    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    }

    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        progressHandle.style.left = `${progressPercent}%`;
        
        // Update time displays
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    }

    function setProgress(e) {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
} 