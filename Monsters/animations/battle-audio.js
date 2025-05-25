// Battle Audio System - Sound effects for monster battles
export class BattleAudio {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.soundsEnabled = true;
        this.musicEnabled = true;
        this.loadedSounds = new Map();
        this.currentBGM = null;
        this.initialized = false;
    }

    // Initialize the audio system
    initialize() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.preloadSounds();
            this.initialized = true;
            console.log('🔊 Battle Audio system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.soundsEnabled = false;
        }
    }

    // Preload common battle sounds
    async preloadSounds() {
        const soundEffects = {
            // Move type sounds
            'move_water': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2t2QXBS2N2u/Nei4FJHjM7+CTQQQGNO7N1/sEtMeCZsS1c',
            'move_fire': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2t2QXBS2N2u/NeiUFJHjM7+CTQA',
            'move_electric': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFA',
            'move_grass': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoU',
            
            // Battle events
            'hit_normal': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEA',
            'hit_critical': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+Pw',
            'heal': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LM',
            'faint': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2Q',
            'switch_in': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559N',
            'switch_out': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt',
            
            // UI sounds
            'menu_select': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUF',
            'menu_confirm': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNw',
            'button_hover': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LD',
            
            // Battle flow
            'victory': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2t2Q',
            'defeat': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFA',
        };

        // Note: In a real implementation, you would load actual audio files
        // For now, we'll create simple oscillator-based sounds
        for (const [name, data] of Object.entries(soundEffects)) {
            this.loadedSounds.set(name, data);
        }
    }

    // Play move sound based on type
    playMoveSound(moveType, moveCategory = 'Physical') {
        if (!this.soundsEnabled || !this.initialized) return;

        // Always use procedural sound generation for consistent audio
        this.generateMoveSound(moveType, moveCategory);
    }

    // Generate procedural sound for moves
    generateMoveSound(moveType, moveCategory) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Type-specific frequencies and patterns
        const typeFrequencies = {
            'Water': { base: 220, variation: 50, wave: 'sine' },
            'Fire': { base: 440, variation: 100, wave: 'sawtooth' },
            'Electric': { base: 880, variation: 200, wave: 'square' },
            'Grass': { base: 330, variation: 40, wave: 'triangle' },
            'Ice': { base: 550, variation: 30, wave: 'sine' },
            'Rock': { base: 110, variation: 20, wave: 'sawtooth' },
            'Fighting': { base: 180, variation: 60, wave: 'square' },
            'Psychic': { base: 660, variation: 150, wave: 'triangle' },
            'Normal': { base: 350, variation: 80, wave: 'triangle' }
        };

        const typeData = typeFrequencies[moveType] || typeFrequencies['Normal'];
        
        oscillator.type = typeData.wave;
        oscillator.frequency.setValueAtTime(typeData.base, this.audioContext.currentTime);
        
        // Add frequency modulation for more interesting sounds
        if (moveCategory === 'Special') {
            oscillator.frequency.exponentialRampToValueAtTime(
                typeData.base + typeData.variation, 
                this.audioContext.currentTime + 0.1
            );
        }

        // Volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // Play hit sound with intensity based on damage
    playHitSound(damage, isCritical = false, isHealing = false) {
        if (!this.soundsEnabled || !this.initialized) return;

        if (isHealing) {
            this.generateHealSound();
        } else if (isCritical) {
            this.generateCriticalHitSound(damage);
        } else {
            this.generateHitSound(damage);
        }
    }

    // Generate hit sound based on damage
    generateHitSound(damage) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const noiseGain = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Damage intensity affects frequency and volume
        const intensity = Math.min(damage / 100, 2); // Cap at 2x intensity
        const baseFreq = 120 + (intensity * 80);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.audioContext.currentTime + 0.1);

        const volume = this.masterVolume * (0.2 + intensity * 0.3);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // Generate critical hit sound
    generateCriticalHitSound(damage) {
        if (!this.audioContext) return;

        // Create a more dramatic sound with multiple oscillators
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                const freq = 200 + (i * 100) + (damage / 10);
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioContext.currentTime + 0.05);

                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            }, i * 30);
        }
    }

    // Generate healing sound
    generateHealSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.linearRampToValueAtTime(659, this.audioContext.currentTime + 0.2); // E5
        oscillator.frequency.linearRampToValueAtTime(784, this.audioContext.currentTime + 0.4); // G5

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    // Play UI sound effects
    playUISound(soundName) {
        if (!this.soundsEnabled || !this.initialized) return;

        switch (soundName) {
            case 'button_hover':
                this.generateUISound(800, 'sine', 0.1, 0.1);
                break;
            case 'button_click':
                this.generateUISound(600, 'square', 0.15, 0.05);
                break;
            case 'menu_select':
                this.generateUISound(1000, 'triangle', 0.2, 0.1);
                break;
            case 'error':
                this.generateUISound(200, 'sawtooth', 0.3, 0.2);
                break;
        }
    }

    // Generate UI sound
    generateUISound(frequency, waveType, volume, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play switch sounds
    playSwitchSound(isOut = false) {
        if (!this.soundsEnabled || !this.initialized) return;

        if (isOut) {
            // Switch out - descending sound
            this.generateSwitchSound(500, 250, 0.3);
        } else {
            // Switch in - ascending sound
            this.generateSwitchSound(250, 500, 0.3);
        }
    }

    // Generate switch sound
    generateSwitchSound(startFreq, endFreq, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.25, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play faint sound
    playFaintSound() {
        if (!this.soundsEnabled || !this.initialized) return;

        // Dramatic descending sound for fainting
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1.0);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }

    // Play victory/defeat sounds
    playResultSound(victory = true) {
        if (!this.soundsEnabled || !this.initialized) return;

        if (victory) {
            this.playVictoryFanfare();
        } else {
            this.playDefeatSound();
        }
    }

    // Play victory fanfare
    playVictoryFanfare() {
        if (!this.audioContext) return;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }

    // Play defeat sound
    playDefeatSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1.5);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1.5);
    }

    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setSoundsEnabled(enabled) {
        this.soundsEnabled = enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
    }

    // Clean up audio resources
    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.loadedSounds.clear();
        this.initialized = false;
    }
}

// Export singleton instance
export const battleAudio = new BattleAudio(); 