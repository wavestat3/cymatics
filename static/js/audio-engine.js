class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentFrequency = 440;
        this.currentWaveform = 'sine';
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0;
            this.gainNode.connect(this.audioContext.destination);
            
            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.connect(this.gainNode);
            
            // Create buffer for data
            this.analyserData = new Float32Array(this.analyser.frequencyBinCount);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio engine:', error);
            return false;
        }
    }

    setFrequency(frequency, timeConstant = 0.1) {
        if (this.oscillator && this.isPlaying) {
            this.oscillator.frequency.setTargetAtTime(
                frequency,
                this.audioContext.currentTime,
                timeConstant
            );
        }
        this.currentFrequency = frequency;
    }

    setWaveform(waveform) {
        if (this.oscillator && this.isPlaying) {
            this.oscillator.type = waveform;
        }
        this.currentWaveform = waveform;
    }

    async start() {
        if (!this.audioContext) {
            await this.initialize();
        }

        if (this.isPlaying) return;

        try {
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = this.currentWaveform;
            this.oscillator.frequency.setValueAtTime(
                this.currentFrequency,
                this.audioContext.currentTime
            );

            this.oscillator.connect(this.analyser);
            this.oscillator.start();

            // Fade in
            this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.gainNode.gain.setTargetAtTime(
                0.5,
                this.audioContext.currentTime,
                0.1
            );

            this.isPlaying = true;
            return true;
        } catch (error) {
            console.error('Failed to start audio:', error);
            return false;
        }
    }

    async stop() {
        if (!this.isPlaying) return;

        try {
            // Fade out
            this.gainNode.gain.setTargetAtTime(
                0,
                this.audioContext.currentTime,
                0.1
            );

            setTimeout(() => {
                if (this.oscillator) {
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                    this.oscillator = null;
                }
                this.isPlaying = false;
            }, 100);

            return true;
        } catch (error) {
            console.error('Failed to stop audio:', error);
            return false;
        }
    }

    getAnalyserData() {
        if (!this.analyser) return null;
        this.analyser.getFloatTimeDomainData(this.analyserData);
        return this.analyserData;
    }

    // Preview mode for frequency selection
    async previewFrequency(frequency, duration = 500) {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) await this.stop();

        this.currentFrequency = frequency;
        await this.start();

        setTimeout(async () => {
            await this.stop();
            if (wasPlaying) {
                setTimeout(() => this.start(), 100);
            }
        }, duration);
    }
}

// Create global audio engine instance
window.audioEngine = new AudioEngine();