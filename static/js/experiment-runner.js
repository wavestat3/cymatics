class ExperimentRunner {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.attachEventListeners();
        this.loadExperimentData();
    }

    initializeElements() {
        // Video elements
        this.cameraFeed = document.getElementById('cameraFeed');
        this.capturedImage = document.getElementById('capturedImage');
        
        // Control elements
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.nextButton = document.getElementById('nextButton');
        
        // Display elements
        this.frequencyDisplay = document.getElementById('frequencyValue');
        this.timerDisplay = document.getElementById('timer');
        this.statusDisplay = document.getElementById('statusDisplay');
        this.timestampDisplay = document.getElementById('timestamp');
    }

    initializeState() {
        this.isRecording = false;
        this.experimentData = null;
        this.timer = null;
        this.timeRemaining = 20; // Default duration
        this.updateTimestamp();
        
        // Update timestamp every second
        setInterval(() => this.updateTimestamp(), 1000);
    }

    attachEventListeners() {
        this.startButton.addEventListener('click', () => this.startExperiment());
        this.stopButton.addEventListener('click', () => this.stopExperiment());
        this.nextButton.addEventListener('click', () => this.proceedToCollection());
    }

    async loadExperimentData() {
        try {
            const response = await fetch('/api/experiment/current');
            this.experimentData = await response.json();
            
            if (this.experimentData) {
                this.frequencyDisplay.textContent = this.experimentData.frequency;
                this.updateStatus('Ready to begin experiment');
            } else {
                this.updateStatus('Error: No experiment data found');
                this.startButton.disabled = true;
            }
        } catch (error) {
            console.error('Error loading experiment data:', error);
            this.updateStatus('Error loading experiment data');
            this.startButton.disabled = true;
        }
    }

    async startExperiment() {
        try {
            // Start recording on server
            const response = await fetch('/api/experiment/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    frequency: this.experimentData.frequency,
                    duration: this.timeRemaining
                })
            });

            if (!response.ok) throw new Error('Failed to start recording');

            // Update UI
            this.isRecording = true;
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.cameraFeed.classList.add('recording');
            
            // Start countdown
            this.startCountdown();
            
            // Play audio both locally and on server
            await this.playAudio();
            
            this.updateStatus('Recording in progress...');
        } catch (error) {
            console.error('Error starting experiment:', error);
            this.updateStatus('Error starting experiment');
        }
    }

    async stopExperiment() {
        try {
            // Stop recording on server
            const response = await fetch('/api/experiment/stop', {
                method: 'POST'
            });

            const data = await response.json();
            
            // Stop countdown and audio
            clearInterval(this.timer);
            this.stopAudio();
            
            // Update UI
            this.isRecording = false;
            this.stopButton.disabled = true;
            this.cameraFeed.classList.remove('recording');
            
            // Display captured image
            if (data.imagePath) {
                this.capturedImage.src = data.imagePath;
                this.capturedImage.style.display = 'block';
                this.nextButton.style.display = 'block';
            }
            
            this.updateStatus('Recording complete');
        } catch (error) {
            console.error('Error stopping experiment:', error);
            this.updateStatus('Error stopping recording');
        }
    }

    startCountdown() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.timerDisplay.textContent = this.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.stopExperiment();
            } else if (this.timeRemaining <= 3) {
                // Add visual feedback for final seconds
                this.timerDisplay.classList.add('pulse');
            }
        }, 1000);
    }

    async playAudio() {
        try {
            // Create and configure audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = this.experimentData.waveform || 'sine';
            oscillator.frequency.setValueAtTime(
                this.experimentData.frequency, 
                audioContext.currentTime
            );
            
            // Apply fade in
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Start oscillator
            oscillator.start();
            
            // Store for stopping later
            this.audioContext = audioContext;
            this.oscillator = oscillator;
            this.gainNode = gainNode;
            
        } catch (error) {
            console.error('Error playing audio:', error);
            this.updateStatus('Error playing audio');
        }
    }

    stopAudio() {
        if (this.gainNode && this.oscillator) {
            // Fade out
            this.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.1
            );
            
            // Stop after fade
            setTimeout(() => {
                this.oscillator.stop();
                this.audioContext.close();
            }, 100);
        }
    }

    updateTimestamp() {
        const now = new Date();
        this.timestampDisplay.textContent = now.toLocaleString();
    }

    updateStatus(message) {
        this.statusDisplay.textContent = message;
    }

    proceedToCollection() {
        window.location.href = '/collection.html';
    }

    // Cleanup when leaving page
    cleanup() {
        this.stopAudio();
        clearInterval(this.timer);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.experimentRunner = new ExperimentRunner();
});

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
    if (window.experimentRunner) {
        window.experimentRunner.cleanup();
    }
});