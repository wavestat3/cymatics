class WaveformVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.lastFrameTime = 0;
        
        // Visualization settings
        this.settings = {
            primaryColor: '#00E7FF',
            secondaryColor: '#FF00E7',
            backgroundColor: '#232323',
            lineWidth: 2,
            glowBlur: 10,
            glowAlpha: 0.5
        };
        
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Set default styles
        this.ctx.lineWidth = this.settings.lineWidth;
        this.ctx.strokeStyle = this.settings.primaryColor;
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stop() {
        this.isAnimating = false;
    }

    animate(timestamp = 0) {
        if (!this.isAnimating) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get audio data
        const audioData = window.audioEngine.getAnalyserData();
        if (audioData) {
            this.drawWaveform(audioData, deltaTime);
        }
        
        requestAnimationFrame((t) => this.animate(t));
    }

    drawWaveform(audioData, deltaTime) {
        const { data, bufferLength } = audioData;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        // Draw with glow effect
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < bufferLength; i++) {
            const v = data[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        // Add glow effect
        this.ctx.shadowBlur = this.settings.glowBlur;
        this.ctx.shadowColor = this.settings.primaryColor;
        this.ctx.strokeStyle = this.settings.primaryColor;
        this.ctx.stroke();
        
        // Reset shadow for next frame
        this.ctx.shadowBlur = 0;
    }
}

class FrequencyDialVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Dial settings
        this.settings = {
            minFreq: 20,
            maxFreq: 2000,
            segments: 60,
            innerRadius: 0.6,
            outerRadius: 0.9,
            markerSize: 0.05,
            rotationOffset: -Math.PI / 2
        };
        
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.radius = Math.min(this.canvas.width, this.canvas.height) / 2;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    draw(currentFrequency) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw segments
        for (let i = 0; i < this.settings.segments; i++) {
            const angle = (i / this.settings.segments) * Math.PI * 2;
            const freq = this.angleToFrequency(angle);
            const isActive = Math.abs(freq - currentFrequency) < 10;
            
            this.drawSegment(angle, isActive);
        }
        
        // Draw current frequency marker
        this.drawMarker(currentFrequency);
    }

    drawSegment(angle, isActive) {
        const innerRadius = this.radius * this.settings.innerRadius;
        const outerRadius = this.radius * this.settings.outerRadius;
        
        // Calculate segment coordinates
        const startAngle = angle;
        const endAngle = angle + (Math.PI * 2) / this.settings.segments;
        
        // Draw segment arc
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, outerRadius, startAngle, endAngle);
        this.ctx.arc(this.centerX, this.centerY, innerRadius, endAngle, startAngle, true);
        this.ctx.closePath();
        
        // Style segment
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, innerRadius,
            this.centerX, this.centerY, outerRadius
        );
        
        if (isActive) {
            gradient.addColorStop(0, '#00E7FF');
            gradient.addColorStop(1, '#FF00E7');
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00E7FF';
        } else {
            gradient.addColorStop(0, '#2A2A2A');
            gradient.addColorStop(1, '#1A1A1A');
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    drawMarker(frequency) {
        const angle = this.frequencyToAngle(frequency);
        const radius = this.radius * this.settings.outerRadius;
        
        this.ctx.beginPath();
        this.ctx.arc(
            this.centerX + Math.cos(angle) * radius,
            this.centerY + Math.sin(angle) * radius,
            this.radius * this.settings.markerSize,
            0,
            Math.PI * 2
        );
        
        this.ctx.fillStyle = '#00E7FF';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00E7FF';
        this.ctx.fill();
    }

    angleToFrequency(angle) {
        const normalized = (angle + Math.PI * 2 - this.settings.rotationOffset) % (Math.PI * 2) / (Math.PI * 2);
        return this.settings.minFreq + (this.settings.maxFreq - this.settings.minFreq) * normalized;
    }

    frequencyToAngle(frequency) {
        const normalized = (frequency - this.settings.minFreq) / (this.settings.maxFreq - this.settings.minFreq);
        return normalized * Math.PI * 2 + this.settings.rotationOffset;
    }
}

// Initialize visualizers
window.waveformVis = new WaveformVisualizer('waveformCanvas');
window.dialVis = new FrequencyDialVisualizer('dialCanvas');