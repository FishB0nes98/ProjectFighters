import { ref, get } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js';
import songs from './songs.js';

class MusicPlayer {
    constructor() {
        this.audioElements = new Map();
        this.currentAudio = null;
        this.currentSongIndex = 0;
        this.loadedSongs = 0;
        this.currentVolume = 0.2;
        this.originalPlaylist = []; // Will be populated with owned songs
        this.shuffledPlaylist = []; // Will be populated with owned songs
        this.isShuffled = false;
        
        // Get current user and database references
        this.auth = window.firebaseAuth;
        this.database = window.firebaseDatabase;
        
        // Wait for auth state to be ready
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.initializeWithOwnedSongs();
            } else {
                console.log('Waiting for user authentication...');
                this.handleNoSongs(); // Show message until user is authenticated
            }
        });
    }

    async initializeWithOwnedSongs() {
        const user = this.auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        try {
            // Get user's owned songs from database
            const userSongsRef = ref(this.database, `users/${user.uid}/Songs`);
            const snapshot = await get(userSongsRef);
            const ownedSongs = snapshot.val() || {};

            // Filter songs array to only include owned songs
            this.originalPlaylist = songs.filter(song => {
                const songPath = song.path.split('/').pop(); // Get filename from path
                const songNameWithoutExtension = songPath.replace('.mp3', ''); // Remove .mp3
                return ownedSongs[songNameWithoutExtension] === 1; // Check if song is owned
            });

            this.shuffledPlaylist = [...this.originalPlaylist];
            this.totalSongs = this.originalPlaylist.length;

            // Initialize player UI elements
            this.initializeUIElements();

            // Disable controls until songs are loaded
            this.disableControls();
            
            // Start preloading owned songs
            if (this.totalSongs > 0) {
                await this.preloadSongs(this.originalPlaylist);
                this.setupEventListeners();
                this.initializePlaylist();
                this.enableControls();
            } else {
                this.handleNoSongs();
            }
        } catch (error) {
            console.error('Error loading owned songs:', error);
            this.handleError();
        }
    }

    initializeUIElements() {
        // Get DOM elements
        this.musicPlayer = document.querySelector('.music-player');
        this.musicToggle = document.querySelector('.music-player-toggle');
        this.playlistToggle = document.querySelector('.playlist-toggle');
        this.playlist = document.querySelector('.playlist');
        this.playBtn = document.querySelector('.play-btn');
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.volumeSlider = document.querySelector('.volume-slider');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress-bar .progress');
        this.currentTimeSpan = document.querySelector('.current-time');
        this.durationSpan = document.querySelector('.duration');
        this.songTitle = document.querySelector('.song-title');
        this.artistName = document.querySelector('.artist-name');
        this.coverArt = document.querySelector('.cover-art img');
        this.playlistItems = document.querySelector('.playlist-items');
        this.shuffleBtn = document.querySelector('.shuffle-btn');
    }

    handleNoSongs() {
        // Update UI to show no songs owned
        this.songTitle.textContent = 'No Songs Owned';
        this.artistName.textContent = 'Purchase songs to play music';
        this.disableControls();
    }

    handleError() {
        // Update UI to show error state
        this.songTitle.textContent = 'Error Loading Songs';
        this.artistName.textContent = 'Please try again later';
        this.disableControls();
    }

    async preloadSongs(playlist) {
        const loadPromises = playlist.map(song => this.preloadSong(song));
        await Promise.all(loadPromises);
        
        // Set initial volume for all audio elements
        this.audioElements.forEach(audio => {
            audio.volume = this.currentVolume;
        });
        
        console.log('All songs preloaded successfully');
    }

    preloadSong(song) {
        return new Promise((resolve, reject) => {
            if (this.audioElements.has(song.path)) {
                resolve();
                return;
            }

            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.loadedSongs++;
                console.log(`Loaded ${this.loadedSongs}/${this.totalSongs}: ${song.title}`);
                resolve();
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.error(`Error loading song: ${song.title}`, e);
                reject(e);
            });

            // Setup time update listener for progress bar
            audio.addEventListener('timeupdate', () => {
                if (audio === this.currentAudio) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    if (this.progressBar) {
                        this.progressBar.style.width = `${progress}%`;
                        this.currentTimeSpan.textContent = this.formatTime(audio.currentTime);
                        this.durationSpan.textContent = this.formatTime(audio.duration);
                    }
                }
            });

            // Setup ended listener for auto-play next
            audio.addEventListener('ended', () => {
                this.playNext();
            });

            audio.preload = 'auto';
            audio.src = song.path;
            this.audioElements.set(song.path, audio);
        });
    }

    disableControls() {
        this.playBtn.disabled = true;
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
        this.songTitle.textContent = 'Loading...';
        this.artistName.textContent = 'Please wait';
    }

    enableControls() {
        this.playBtn.disabled = false;
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;
        if (this.originalPlaylist.length > 0) {
            this.setupSong(0);
        }
    }

    initializePlaylist() {
        this.playlistItems.innerHTML = '';
        
        // Use the filtered originalPlaylist that contains only owned songs
        this.originalPlaylist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.onclick = () => this.playSong(index);
            if (index === this.currentSongIndex) {
                li.classList.add('active');
            }
            this.playlistItems.appendChild(li);
        });

        // Set up first song without playing it
        if (this.originalPlaylist.length > 0) {
            this.setupSong(0);
        } else {
            this.handleNoSongs();
        }
    }

    // New method to setup song without playing
    setupSong(index) {
        if (index >= 0 && index < this.getCurrentPlaylist().length) {
            const song = this.getCurrentPlaylist()[index];
            
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
            
            const audio = this.audioElements.get(song.path);
            if (audio) {
                this.currentAudio = audio;
                this.currentSongIndex = index;
                
                audio.volume = this.currentVolume;
                audio.currentTime = 0;
                
                // Update UI without playing
                this.updatePlayButton(false);
                this.songTitle.textContent = song.title;
                this.artistName.textContent = song.artist;
                this.coverArt.src = song.cover;
                this.updatePlaylistActiveState();
            }
        }
    }

    setupEventListeners() {
        // Toggle music player
        this.musicToggle.addEventListener('click', () => {
            this.musicPlayer.classList.toggle('active');
        });

        // Toggle playlist
        this.playlistToggle.addEventListener('click', () => {
            this.playlist.classList.toggle('active');
        });

        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // Volume
        this.volumeSlider.addEventListener('input', (e) => {
            this.currentVolume = e.target.value / 100;
            // Apply volume to all audio elements
            this.audioElements.forEach(audio => {
                audio.volume = this.currentVolume;
            });
            this.updateVolumeIcon(this.currentVolume);
        });

        // Progress bar
        this.progressContainer.addEventListener('click', (e) => {
            if (this.currentAudio) {
                const rect = this.progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.currentAudio.currentTime = this.currentAudio.duration * percent;
            }
        });

        // Add shuffle button listener
        this.shuffleBtn.addEventListener('click', () => this.shufflePlaylist());
    }

    playSong(index) {
        if (index >= 0 && index < this.getCurrentPlaylist().length) {
            const song = this.getCurrentPlaylist()[index];
            
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
            
            const audio = this.audioElements.get(song.path);
            if (audio) {
                this.currentAudio = audio;
                this.currentSongIndex = index;
                
                audio.volume = this.currentVolume;
                audio.currentTime = 0;
                audio.play();
                
                // Update UI
                this.updatePlayButton(true);
                this.songTitle.textContent = song.title;
                this.artistName.textContent = song.artist;
                this.coverArt.src = song.cover;
                this.updatePlaylistActiveState();
            }
        }
    }

    togglePlay() {
        if (this.currentAudio) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                this.updatePlayButton(true);
            } else {
                this.currentAudio.pause();
                this.updatePlayButton(false);
            }
        }
    }

    playNext() {
        let nextIndex = (this.currentSongIndex + 1) % this.getCurrentPlaylist().length;
        this.playSong(nextIndex);
    }

    playPrevious() {
        let prevIndex = (this.currentSongIndex - 1 + this.getCurrentPlaylist().length) % this.getCurrentPlaylist().length;
        this.playSong(prevIndex);
    }

    updateVolumeIcon(volume) {
        const volumeIcon = document.querySelector('.volume-control i');
        volumeIcon.className = 'fas ' + (
            volume === 0 ? 'fa-volume-mute' :
            volume < 0.33 ? 'fa-volume-off' :
            volume < 0.67 ? 'fa-volume-down' :
            'fa-volume-up'
        );
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    updatePlayButton(isPlaying = true) {
        this.playBtn.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }

    updatePlaylistActiveState() {
        // Remove active class from all playlist items
        const playlistItems = document.querySelectorAll('.playlist-items li');
        playlistItems.forEach((item, index) => {
            item.classList.remove('active');
            if (index === this.currentSongIndex) {
                item.classList.add('active');
            }
        });
    }

    shufflePlaylist() {
        if (this.originalPlaylist.length <= 1) return;
        
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active');

        if (this.isShuffled) {
            // Create a new shuffled array from originalPlaylist
            this.shuffledPlaylist = [...this.originalPlaylist];
            for (let i = this.shuffledPlaylist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.shuffledPlaylist[i], this.shuffledPlaylist[j]] = 
                [this.shuffledPlaylist[j], this.shuffledPlaylist[i]];
            }
        }

        // Update current index to match the current song's position in the new playlist
        if (this.currentAudio) {
            const currentSong = this.originalPlaylist[this.currentSongIndex];
            this.currentSongIndex = this.getCurrentPlaylist().findIndex(song => song.path === currentSong.path);
        }
    }

    getCurrentPlaylist() {
        return this.isShuffled ? this.shuffledPlaylist : this.originalPlaylist;
    }

    updatePlaylistUI() {
        this.playlistItems.innerHTML = '';
        this.getCurrentPlaylist().forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.onclick = () => this.playSong(index);
            if (index === this.currentSongIndex) {
                li.classList.add('active');
            }
            this.playlistItems.appendChild(li);
        });
    }
}

// Initialize music player
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});

export { MusicPlayer }; 