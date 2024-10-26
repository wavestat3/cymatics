class FrequencySelector {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.startVisualizers();
        this.checkFrequencyHistory();
    }

    initializeElements() {
        // Control elements
        this.frequencyInput = document.getElementById('frequencyInput');
        this.frequencyDisplay = document.getElementById('frequencyValue');
        this.frequencyStatus = document.getElementById('frequencyStatus');
        this.previewBtn = document.getElementById('previewBtn');
        this.randomBtn = document.getElementById('randomBtn');
        this.startBtn = document.getElementById('startBtn');
        
        // Waveform buttons
        this.waveformBtns = document.querySelectorAll('.waveform-btn');
        
        // State
        this.isDragging = false;
        this.currentFrequency = 440;
        this.usedFrequencies = new Set();
    }

    attachEventListeners() {
        // Frequency input
        this.frequencyInput.addEventListener('input', (e) => {
            this.updateFrequency(parseFloat(e.target.value));
        });

        // Preview button
        this.previewBtn.addEventListener('click', () => {
            if (window.audioEngine.isPlaying) {
                this.stopPreview();
            } else {
                this.startPreview();
            }
        });

        // Random frequency button
        this.randomBtn.addEventListener('click', () => {
            this.selectRandomFrequency();
        });

        // Start experiment button
        this.startBtn.addEventListener('click', () => {
            this.startExperiment();
        });

        // Waveform selection
        this.waveformBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setWaveform(btn.dataset.type);
            });
        });

        // Dial interaction
        const dialCanvas = document.getElementById('dialCanvas');
        dialCanvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.handleDialInteraction(e);
        });
        
        dialCanvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDialInteraction(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    async checkFrequencyHistory() {
        try {
            const response = await fetch('/api/frequencies/used');
            const data = await response.json();
            this.usedFrequencies = new Set(data.frequencies);
            this.updateFrequencyStatus();
        } catch (error) {
            console.error('Error fetching frequency history:', error);
        }
    }

    updateFrequency(frequency) {
        this.currentFrequency = frequency;
        this.frequencyDisplay.textContent = frequency.toFixed(1);
        this.frequencyInput.value = frequency;
        
        // Update visualizers
        window.dialVis.draw(frequency);
        if (window.audioEngine.isPlaying) {
            window.audioEngine.setFrequency(frequency);
        }
        
        this.updateFrequencyStatus();
    }

    updateFrequencyStatus() {
        const isUsed = this.usedFrequencies.has(Math.round(this.currentFrequency));
        this.frequencyStatus.textContent = isUsed ? 
            'Previously explored frequency' : 
            'Unexplored frequency!';
        this.frequencyStatus.className = `status-indicator ${isUsed ? 'used' : 'new'}`;
    }

    handleDialInteraction(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        
        // Calculate angle from center
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += 2 * Math.PI;
        
        // Convert angle to frequency (logarithmic scale)
        const minFreq = Math.log(20);
        const maxFreq = Math.log(2000);
        const normalizedAngle = (angle + Math.PI / 2) / (2 * Math.PI);
        const frequency = Math.exp(minFreq + (maxFreq - minFreq) * normalizedAngle);
        
        this.updateFrequency(Math.round(frequency * 10) / 10);
    }

    setWaveform(type) {
        // Update UI
        this.waveformBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Update audio engine
        window.audioEngine.setWaveform(type);
    }

    async selectRandomFrequency() {
        try {
            const response = await fetch('/api/frequencies/suggest');
            const data = await response.json();
            
            if (data.frequency) {
                // Animate to new frequency
                this.animateFrequencyChange(this.currentFrequency, data.frequency);
            }
        } catch (error) {
            console.error('Error getting frequency suggestion:', error);
        }
    }

    animateFrequencyChange(start, end) {
        const duration = 1000; // 1 second animation
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const current = start + (end - start) * eased;
            this.updateFrequency(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    startPreview() {
        window.audioEngine.start();
        this.previewBtn.classList.add('active');
        window.waveformVis.start();
    }

    stopPreview() {
        window.audioEngine.stop();
        this.previewBtn.classList.remove('active');
        window.waveformVis.stop();
    }

    async startExperiment() {
        try {
            const response = await fetch('/api/experiment/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    frequency: this.currentFrequency,
                    waveform: window.audioEngine.waveform
                })
            });
            
            if (response.ok) {
                window.location.href = '/experiment.html';
            }
        } catch (error) {
            console.error('Error starting experiment:', error);
        }
    }

    startVisualizers() {
        window.dialVis.draw(this.currentFrequency);
        window.waveformVis.start();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.frequencySelector = new FrequencySelector();
});