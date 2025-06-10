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
    // Wait for DOM to be fully loaded
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                const instance = initializePlayer();
                resolve(instance);
            });
        } else {
            const instance = initializePlayer();
            resolve(instance);
        }
    });
}

function initializePlayer() {
    // DOM Elements
    const elements = {
        player: document.querySelector('.modern-music-player'),
        playBtn: document.querySelector('.play-btn'),
        prevBtn: document.querySelector('.prev-btn'),
        nextBtn: document.querySelector('.next-btn'),
        shuffleBtn: document.querySelector('.shuffle-btn'),
        repeatBtn: document.querySelector('.repeat-btn'),
        volumeBtn: document.querySelector('.volume-btn'),
        volumeSlider: document.querySelector('.volume-slider'),
        progressBar: document.querySelector('.progress-bar'),
        progress: document.querySelector('.progress'),
        currentTime: document.querySelector('.time.current'),
        totalTime: document.querySelector('.time.total'),
        albumArt: document.querySelector('.album-art'),
        trackTitle: document.querySelector('.track-title'),
        trackArtist: document.querySelector('.track-artist'),
        playlistTracks: document.querySelector('.playlist-tracks'),
        playlistToggleBtn: document.querySelector('.playlist-toggle-btn'),
        favoriteBtn: document.querySelector('.favorite-btn'),
        playlistSearch: document.querySelector('.playlist-search input'),
        playlistFilter: document.querySelector('.playlist-filter select')
    };

    // Verify all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.warn(`Music player element not found: ${key}`);
        }
    }

    // Player state
    const state = {
        currentTrack: null,
        isPlaying: false,
        audio: new Audio(),
        shuffle: false,
        repeat: false,
        volume: 1,
        playlist: [], // Will be populated after checking owned songs
        filteredPlaylist: [], // Will be populated after checking owned songs
        ownedSongs: {} // Will store the user's owned songs
    };

    // Initialize audio settings
    state.audio.volume = state.volume;

    // Check for owned songs and initialize playlist
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const database = getDatabase();
            const userSongsRef = ref(database, `users/${user.uid}/Songs`);
            try {
                const snapshot = await get(userSongsRef);
                state.ownedSongs = snapshot.val() || {};
                
                // Filter songs to only include owned ones
                state.playlist = songs.filter(song => {
                    // Check if the song is owned using the full song name format from database
                    const fullSongName = song.path.split('/').pop().replace('.mp3', '');
                    
                    // Check multiple possible formats for the song name in the database
                    return state.ownedSongs[fullSongName] === 1 || 
                           state.ownedSongs[song.title] === 1 ||
                           state.ownedSongs[`${song.title} (${song.description})`] === 1;
                });
                state.filteredPlaylist = [...state.playlist];
                
                // Update UI
                renderPlaylist();

                // Load a random song if user has any owned songs
                if (state.playlist.length > 0) {
                    const randomIndex = Math.floor(Math.random() * state.playlist.length);
                    const randomTrack = state.playlist[randomIndex];
                    
                    // Update UI without playing
                    state.currentTrack = randomTrack;
                    elements.albumArt.src = randomTrack.cover;
                    elements.trackTitle.textContent = randomTrack.title;
                    elements.trackArtist.textContent = randomTrack.artist;
                    state.audio.src = randomTrack.path;
                    
                    // Update playlist active state
                    updatePlaylistActiveState();
                }
            } catch (error) {
                console.error('Error fetching owned songs:', error);
            }
        }
    });

    // Event Listeners
    if (elements.playerToggle) {
        elements.playerToggle.addEventListener('click', () => {
            elements.player.classList.toggle('show');
        });
    }

    if (elements.playlistToggleBtn) {
        elements.playlistToggleBtn.addEventListener('click', () => {
            const panel = document.querySelector('.playlist-panel');
            if (panel) {
                panel.classList.toggle('show');
                // Update button icon
                const icon = elements.playlistToggleBtn.querySelector('i');
                if (panel.classList.contains('show')) {
                    icon.classList.remove('fa-list');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-list');
                }
            }
        });
    }

    if (elements.playBtn) {
        elements.playBtn.addEventListener('click', togglePlay);
    }

    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', playPrevious);
    }

    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', playNext);
    }

    if (elements.shuffleBtn) {
        elements.shuffleBtn.addEventListener('click', toggleShuffle);
    }

    if (elements.repeatBtn) {
        elements.repeatBtn.addEventListener('click', toggleRepeat);
    }

    if (elements.volumeBtn) {
        elements.volumeBtn.addEventListener('click', toggleMute);
    }

    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (e) => {
            updateVolume(e.target.value / 100);
        });
    }

    if (elements.progressBar) {
        elements.progressBar.addEventListener('click', seekTo);
    }

    if (elements.playlistSearch) {
        elements.playlistSearch.addEventListener('input', filterPlaylist);
    }

    if (elements.playlistFilter) {
        elements.playlistFilter.addEventListener('change', filterPlaylist);
    }

    // Audio event listeners
    state.audio.addEventListener('timeupdate', updateProgress);
    state.audio.addEventListener('ended', handleTrackEnd);
    state.audio.addEventListener('loadedmetadata', updateDuration);

    // Initialize playlist
    renderPlaylist();

    // Player functions
    function togglePlay() {
        if (!state.currentTrack) {
            playTrack(state.playlist[0]);
            return;
        }

        if (state.isPlaying) {
            state.audio.pause();
            state.isPlaying = false;
            elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            state.audio.play();
            state.isPlaying = true;
            elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }

    function playTrack(track) {
        state.currentTrack = track;
        state.audio.src = track.path;
        state.audio.play();
        state.isPlaying = true;
        
        // Update UI
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        elements.albumArt.src = track.cover;
        elements.trackTitle.textContent = track.title;
        elements.trackArtist.textContent = track.artist;
        
        // Update playlist active state
        updatePlaylistActiveState();
    }

    function playNext() {
        if (!state.currentTrack) return;
        
        const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack.id);
        let nextIndex;

        if (state.shuffle) {
            nextIndex = Math.floor(Math.random() * state.playlist.length);
        } else {
            nextIndex = (currentIndex + 1) % state.playlist.length;
        }

        playTrack(state.playlist[nextIndex]);
    }

    function playPrevious() {
        if (!state.currentTrack) return;
        
        const currentIndex = state.playlist.findIndex(track => track.id === state.currentTrack.id);
        let prevIndex;

        if (state.shuffle) {
            prevIndex = Math.floor(Math.random() * state.playlist.length);
        } else {
            prevIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length;
        }

        playTrack(state.playlist[prevIndex]);
    }

    function toggleShuffle() {
        state.shuffle = !state.shuffle;
        elements.shuffleBtn.classList.toggle('active');
    }

    function toggleRepeat() {
        state.repeat = !state.repeat;
        elements.repeatBtn.classList.toggle('active');
    }

    function toggleMute() {
        if (state.audio.volume > 0) {
            state.volume = state.audio.volume;
            updateVolume(0);
        } else {
            updateVolume(state.volume);
        }
    }

    function updateVolume(value) {
        state.audio.volume = value;
        elements.volumeSlider.value = value * 100;
        
        if (value === 0) {
            elements.volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (value < 0.5) {
            elements.volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            elements.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    function updateProgress() {
        const { currentTime, duration } = state.audio;
        if (isNaN(duration)) return;

        const progressPercent = (currentTime / duration) * 100;
        elements.progress.style.width = `${progressPercent}%`;
        elements.currentTime.textContent = formatTime(currentTime);
    }

    function updateDuration() {
        elements.totalTime.textContent = formatTime(state.audio.duration);
    }

    function seekTo(e) {
        const { duration } = state.audio;
        if (isNaN(duration)) return;

        const clickX = e.offsetX;
        const width = elements.progressBar.clientWidth;
        const seekTime = (clickX / width) * duration;
        state.audio.currentTime = seekTime;
    }

    function handleTrackEnd() {
        if (state.repeat) {
            state.audio.currentTime = 0;
            state.audio.play();
        } else {
            playNext();
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function renderPlaylist() {
        if (!elements.playlistTracks) return;

        elements.playlistTracks.innerHTML = state.filteredPlaylist
            .map(track => `
                <div class="track-item${state.currentTrack?.id === track.id ? ' active' : ''}" 
                     data-track-id="${track.id}">
                    <div class="track-item-art">
                        <img src="${track.cover}" alt="${track.title}">
                    </div>
                    <div class="track-item-info">
                        <div class="track-item-title">${track.title}</div>
                        <div class="track-item-artist">${track.artist}</div>
                    </div>
                    <div class="track-item-duration">${track.duration || '0:00'}</div>
                </div>
            `).join('');

        // Add click event listeners to playlist items
        document.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.trackId;
                const track = state.playlist.find(t => t.id === trackId);
                if (track) playTrack(track);
            });
        });

        // Update track count
        const trackCountElement = document.querySelector('.track-count');
        if (trackCountElement) {
            const count = state.filteredPlaylist.length;
            trackCountElement.textContent = `${count} track${count !== 1 ? 's' : ''}`;
        }

        // Update now playing indicator
        const nowPlayingIndicator = document.querySelector('.now-playing-indicator');
        if (nowPlayingIndicator) {
            nowPlayingIndicator.style.display = state.currentTrack ? 'flex' : 'none';
        }
    }

    function updatePlaylistActiveState() {
        document.querySelectorAll('.track-item').forEach(item => {
            const trackId = item.dataset.trackId;
            item.classList.toggle('active', trackId === state.currentTrack?.id);
        });
    }

    function filterPlaylist() {
        const searchTerm = elements.playlistSearch.value.toLowerCase();
        const filterValue = elements.playlistFilter.value;

        state.filteredPlaylist = state.playlist.filter(track => {
            const matchesSearch = track.title.toLowerCase().includes(searchTerm) ||
                                track.artist.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' ||
                                (filterValue === 'character' && track.category === 'Character Theme') ||
                                (filterValue === 'event' && track.category === 'Event Theme') ||
                                (filterValue === 'favorites' && track.isFavorite);
            return matchesSearch && matchesFilter;
        });

        renderPlaylist();
    }

    // Add close playlist button handler
    const closePlaylistBtn = document.querySelector('.close-playlist');
    if (closePlaylistBtn) {
        closePlaylistBtn.addEventListener('click', () => {
            const overlay = document.querySelector('.playlist-overlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
        });
    }

    // Return the player instance with exposed functions
    return {
        state: state,
        playTrack: playTrack,
        togglePlay: togglePlay,
        playNext: playNext,
        playPrevious: playPrevious,
        updateVolume: updateVolume,
        elements: elements
    };
} 