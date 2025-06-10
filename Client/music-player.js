// Music Player Class
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeating = false;
        this.volume = 0.5;
        this.playlist = [];
        this.originalPlaylist = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadPlaylist();
    }

    initializeElements() {
        // Control buttons
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.playlistBtn = document.getElementById('playlist-btn');

        // Track info elements
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        this.currentTime = document.getElementById('current-time');
        this.totalTime = document.getElementById('total-time');

        // Progress elements
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressHandle = document.querySelector('.progress-handle');

        // Volume elements
        this.volumeRange = document.getElementById('volume-range');

        // Playlist elements
        this.playlistPanel = document.getElementById('playlist-panel');
        this.playlistTracks = document.getElementById('playlist-tracks');
        this.playlistSearch = document.getElementById('playlist-search');

        // Set initial volume
        this.audio.volume = this.volume;
        this.volumeRange.value = this.volume * 100;
    }

    setupEventListeners() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());

        // Volume controls
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeRange.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleError(e));

        // Playlist search
        this.playlistSearch.addEventListener('input', (e) => this.filterPlaylist(e.target.value));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadPlaylist() {
        try {
            // Import songs from songs.js
            const songsModule = await import('../songs.js');
            const songs = songsModule.default;
            
            console.log('Available songs:', songs); // Debug log
            
            // Get user's owned songs from Firebase
            let ownedSongs = [];
            
            // Wait for authentication to be ready
            const { auth, database, ref, get } = await import('./firebase-config.js');
            
            // Wait for user to be authenticated
            const user = await new Promise((resolve) => {
                if (auth.currentUser) {
                    resolve(auth.currentUser);
                } else {
                    const unsubscribe = auth.onAuthStateChanged((user) => {
                        unsubscribe();
                        resolve(user);
                    });
                }
            });
            
            if (user) {
                try {
                    console.log('Loading songs for user:', user.uid);
                    
                    // Create a map to track which songs we've already added
                    const trackMap = {};
                    
                    // Source 1: users/{uid}/Songs (most common format)
                    const userSongsRef = ref(database, `users/${user.uid}/Songs`);
                    const songsSnapshot = await get(userSongsRef);
                    
                    if (songsSnapshot.exists()) {
                        const userSongs = songsSnapshot.val();
                        console.log('User Songs from Firebase:', userSongs);
                        
                        // Filter songs to only include owned ones
                        songs.forEach(song => {
                            // Strategy 1: Match by song ID
                            if (userSongs[song.id] === 1) {
                                console.log(`Found song by ID: ${song.id}`);
                                ownedSongs.push(song);
                                trackMap[song.id] = true;
                                return;
                            }
                            
                            // Strategy 2: Match by full song title (most common in Firebase)
                            if (userSongs[song.title] === 1) {
                                console.log(`Found song by title: ${song.title}`);
                                ownedSongs.push(song);
                                trackMap[song.id] = true;
                                return;
                            }
                            
                            // Strategy 3: Match by description (which often matches Firebase format)
                            if (userSongs[song.description] === 1) {
                                console.log(`Found song by description: ${song.description}`);
                                ownedSongs.push(song);
                                trackMap[song.id] = true;
                                return;
                            }
                            
                            // Strategy 4: Match by formatted title with description
                            const fullTitle = `${song.title} (${song.description})`;
                            if (userSongs[fullTitle] === 1) {
                                console.log(`Found song by full title: ${fullTitle}`);
                                ownedSongs.push(song);
                                trackMap[song.id] = true;
                                return;
                            }
                            
                            // Strategy 5: Check if any Firebase key contains the song title
                            for (const firebaseKey in userSongs) {
                                if (userSongs[firebaseKey] === 1) {
                                    if (firebaseKey.toLowerCase().includes(song.title.toLowerCase()) ||
                                        song.title.toLowerCase().includes(firebaseKey.toLowerCase())) {
                                        console.log(`Found song by partial match: ${firebaseKey} matches ${song.title}`);
                                        ownedSongs.push(song);
                                        trackMap[song.id] = true;
                                        return;
                                    }
                                }
                            }
                        });
                    }
                    
                    // Source 2: users/{uid}/OwnedMusic
                    const ownedMusicRef = ref(database, `users/${user.uid}/OwnedMusic`);
                    const ownedMusicSnapshot = await get(ownedMusicRef);
                    
                    if (ownedMusicSnapshot.exists()) {
                        const ownedMusic = ownedMusicSnapshot.val();
                        console.log('Found OwnedMusic:', ownedMusic);
                        
                        // For each track with value = 1, add it to the tracks array
                        for (const [trackId, owned] of Object.entries(ownedMusic)) {
                            if (owned === 1 && !trackMap[trackId]) {
                                // Find the track in songs
                                const song = songs.find(s => s.id === trackId);
                                if (song) {
                                    ownedSongs.push(song);
                                    trackMap[trackId] = true;
                                    console.log('Added owned track:', trackId);
                                }
                            }
                        }
                    }
                    
                    // Source 3: users/{uid}/Music (direct ownership)
                    const userMusicRef = ref(database, `users/${user.uid}/Music`);
                    const userMusicSnapshot = await get(userMusicRef);
                    
                    if (userMusicSnapshot.exists()) {
                        const userMusic = userMusicSnapshot.val();
                        console.log('Found Music:', userMusic);
                        
                        // Check each entry in the Music path
                        for (const [trackId, data] of Object.entries(userMusic)) {
                            if (!trackMap[trackId]) { // Avoid duplicates
                                const song = songs.find(s => s.id === trackId);
                                if (song) {
                                    ownedSongs.push(song);
                                    trackMap[trackId] = true;
                                    console.log('Added direct Music track:', trackId);
                                }
                            }
                        }
                    }
                    
                    // Source 4: users/{uid}/Purchases/Music
                    const purchasedMusicRef = ref(database, `users/${user.uid}/Purchases/Music`);
                    const purchasedMusicSnapshot = await get(purchasedMusicRef);
                    
                    if (purchasedMusicSnapshot.exists()) {
                        const purchasedMusic = purchasedMusicSnapshot.val();
                        console.log('Found Purchases/Music:', purchasedMusic);
                        
                        // For each purchased track, add it to the tracks array
                        for (const [trackId, purchased] of Object.entries(purchasedMusic)) {
                            if (purchased && !trackMap[trackId]) { // Avoid duplicates
                                const song = songs.find(s => s.id === trackId);
                                if (song) {
                                    ownedSongs.push(song);
                                    trackMap[trackId] = true;
                                    console.log('Added purchased track:', trackId);
                                }
                            }
                        }
                    }
                    
                    // Source 5: Check global Songs folder for free tracks
                    const freeMusicRef = ref(database, `Songs`);
                    const freeMusicSnapshot = await get(freeMusicRef);
                    
                    if (freeMusicSnapshot.exists()) {
                        const freeMusic = freeMusicSnapshot.val();
                        console.log('Found global Songs:', freeMusic);
                        
                        // For each free track, add it if not already added
                        for (const [trackId, data] of Object.entries(freeMusic)) {
                            if (!trackMap[trackId]) {
                                const song = songs.find(s => s.id === trackId);
                                if (song) {
                                    ownedSongs.push(song);
                                    trackMap[trackId] = true;
                                    console.log('Added free track:', trackId);
                                }
                            }
                        }
                    }
                    
                    console.log('Filtered owned songs:', ownedSongs); // Debug log
                } catch (error) {
                    console.error('Error loading user songs:', error);
                    // Fallback to empty playlist if there's an error
                    ownedSongs = [];
                }
            } else {
                console.log('No authenticated user found');
            }
            
            // Convert owned songs to music player format
            this.originalPlaylist = ownedSongs.map(song => ({
                title: song.title,
                artist: song.artist,
                src: `../${song.path}`,
                duration: "0:00", // Will be updated when loaded
                cover: song.cover ? `../${song.cover}` : null,
                description: song.description,
                id: song.id
            }));

            this.playlist = [...this.originalPlaylist];
            this.renderPlaylist();
            
            console.log('Final playlist:', this.playlist); // Debug log
            
            // Load first track if playlist exists
            if (this.playlist.length > 0) {
                this.loadTrack(0);
            } else {
                // Show message when no songs are owned
                this.trackTitle.textContent = "No Songs Owned";
                this.trackArtist.textContent = "Purchase songs from the store";
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            // Show empty playlist on error
            this.originalPlaylist = [];
            this.playlist = [];
            this.renderPlaylist();
            this.trackTitle.textContent = "No Songs Available";
            this.trackArtist.textContent = "Error loading playlist";
        }
    }

    renderPlaylist() {
        this.playlistTracks.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = `playlist-track ${index === this.currentTrackIndex ? 'active' : ''}`;
            trackElement.innerHTML = `
                <div class="track-info">
                    <div class="track-name">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${track.duration}</div>
                <div class="track-actions">
                    <button class="track-play-btn" onclick="musicPlayer.playTrack(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
            
            this.playlistTracks.appendChild(trackElement);
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = track.src;
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        
        // Update playlist UI
        this.updatePlaylistUI();
        
        // Reset progress
        this.progressFill.style.width = '0%';
        this.progressHandle.style.left = '0%';
        this.currentTime.textContent = '0:00';
    }

    playTrack(index) {
        this.loadTrack(index);
        this.play();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.playlist.length === 0) return;
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.updatePlaylistUI();
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.updatePlaylistUI();
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex = this.currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        
        let newIndex = this.currentTrackIndex + 1;
        if (newIndex >= this.playlist.length) {
            newIndex = 0;
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.volumeRange.value = this.volume * 100;
        
        // Update volume icon
        const volumeIcon = this.volumeBtn.querySelector('i');
        if (this.volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.5);
        }
    }

    seekTo(event) {
        if (!this.audio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.audio.duration;
        
        this.audio.currentTime = newTime;
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.progressHandle.style.left = `${percentage}%`;
        
        this.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.totalTime.textContent = this.formatTime(this.audio.duration);
    }

    handleTrackEnd() {
        if (this.isRepeating) {
            this.audio.currentTime = 0;
            this.play();
        } else {
            this.nextTrack();
        }
    }

    handleError(error) {
        console.error('Audio error:', error);
        this.pause();
        // Try next track if current one fails
        this.nextTrack();
    }

    updatePlaylistUI() {
        const tracks = this.playlistTracks.querySelectorAll('.playlist-track');
        tracks.forEach((track, index) => {
            track.classList.toggle('active', index === this.currentTrackIndex);
            track.classList.toggle('playing', index === this.currentTrackIndex && this.isPlaying);
            
            const playBtn = track.querySelector('.track-play-btn i');
            if (index === this.currentTrackIndex && this.isPlaying) {
                playBtn.className = 'fas fa-pause';
            } else {
                playBtn.className = 'fas fa-play';
            }
        });
    }

    filterPlaylist(searchTerm) {
        const tracks = this.playlistTracks.querySelectorAll('.playlist-track');
        const term = searchTerm.toLowerCase();
        
        tracks.forEach(track => {
            const title = track.querySelector('.track-name').textContent.toLowerCase();
            const artist = track.querySelector('.track-artist').textContent.toLowerCase();
            
            if (title.includes(term) || artist.includes(term)) {
                track.style.display = 'flex';
            } else {
                track.style.display = 'none';
            }
        });
    }

    handleKeyboard(event) {
        // Only handle if no input is focused
        if (document.activeElement.tagName === 'INPUT') return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.setVolume(this.volume + 0.1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.setVolume(this.volume - 0.1);
                break;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Public methods for external use
    addTrack(track) {
        this.originalPlaylist.push(track);
        this.playlist.push(track);
        this.renderPlaylist();
    }

    removeTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.playlist.splice(index, 1);
            this.originalPlaylist.splice(index, 1);
            
            if (index === this.currentTrackIndex) {
                this.loadTrack(Math.min(index, this.playlist.length - 1));
            } else if (index < this.currentTrackIndex) {
                this.currentTrackIndex--;
            }
            
            this.renderPlaylist();
        }
    }

    shuffle() {
        if (this.isShuffled) {
            // Restore original order
            this.playlist = [...this.originalPlaylist];
            this.isShuffled = false;
        } else {
            // Shuffle playlist
            const currentTrack = this.playlist[this.currentTrackIndex];
            this.playlist = this.shuffleArray([...this.playlist]);
            this.currentTrackIndex = this.playlist.findIndex(track => track === currentTrack);
            this.isShuffled = true;
        }
        
        this.renderPlaylist();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        return this.isRepeating;
    }

    // Method to refresh playlist (can be called when user purchases new songs)
    async refreshPlaylist() {
        await this.loadPlaylist();
    }
}

// Global functions for HTML onclick handlers
window.togglePlaylist = function() {
    const playlistPanel = document.getElementById('playlist-panel');
    playlistPanel.classList.toggle('hidden');
};

// Initialize music player when DOM is loaded
let musicPlayer;
document.addEventListener('DOMContentLoaded', () => {
    musicPlayer = new MusicPlayer();
    window.musicPlayer = musicPlayer; // Make it globally accessible
});

// Add CSS for playlist tracks
const playlistStyles = `
<style>
.playlist-track {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 4px;
}

.playlist-track:hover {
    background: rgba(255, 255, 255, 0.1);
}

.playlist-track.active {
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid rgba(0, 212, 255, 0.5);
}

.playlist-track.playing {
    background: rgba(0, 212, 255, 0.3);
}

.playlist-track .track-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.playlist-track .track-name {
    font-weight: 600;
    font-size: 0.9em;
    color: #ffffff;
}

.playlist-track .track-artist {
    font-size: 0.8em;
    color: #cccccc;
}

.playlist-track .track-duration {
    font-size: 0.8em;
    color: #cccccc;
    min-width: 40px;
}

.playlist-track .track-actions {
    display: flex;
    gap: 5px;
}

.track-play-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #ffffff;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
}

.track-play-btn:hover {
    background: rgba(0, 212, 255, 0.3);
    transform: scale(1.1);
}
</style>
`;

// Inject the styles
document.head.insertAdjacentHTML('beforeend', playlistStyles); 