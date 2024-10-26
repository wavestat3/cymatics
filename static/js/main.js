let isPlaying = false;
let currentFrequency = 440;
let analyser;
let canvas;
let canvasCtx;
let animationFrame;
let lastUpdate = 0;

// Initialize visualization
function initVisualization() {
    canvas = document.getElementById('waveformCanvas');
    canvasCtx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Draw waveform
function drawWaveform() {
    const now = performance.now();
    const deltaTime = now - lastUpdate;
    lastUpdate = now;

    const width = canvas.width;
    const height = canvas.height;
    
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    canvasCtx.fillRect(0, 0, width, height);
    
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = isPlaying ? '#34c759' : '#0071e3';
    canvasCtx.beginPath();
    
    const waveform = document.getElementById('waveformSelect').value;
    const frequency = parseFloat(document.getElementById('frequencySlider').value);
    const volume = parseFloat(document.getElementById('volumeSlider').value);
    
    for (let x = 0; x < width; x++) {
        const t = (x / width) * (Math.PI * 2) + (now / 1000);
        let y = 0;
        
        switch (waveform) {
            case 'sine':
                y = Math.sin(t * frequency);
                break;
            case 'square':
                y = Math.sign(Math.sin(t * frequency));
                break;
            case 'triangle':
                y = Math.asin(Math.sin(t * frequency)) * 2 / Math.PI;
                break;
            case 'sawtooth':
                y = ((t * frequency) % 1) * 2 - 1;
                break;
        }
        
        y = y * volume * (height / 3) + (height / 2);
        
        if (x === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
    }
    
    canvasCtx.stroke();
    
    if (isPlaying) {
        animationFrame = requestAnimationFrame(drawWaveform);
    }
}

async function updateAudio() {
    try {
        const response = await fetch('/api/audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frequency: parseFloat(document.getElementById('frequencySlider').value),
                volume: parseFloat(document.getElementById('volumeSlider').value),
                waveform: document.getElementById('waveformSelect').value
            })
        });
        const data = await response.json();
        document.getElementById('status').textContent = data.message;
        document.body.classList.toggle('playing', isPlaying);
    } catch (error) {
        document.getElementById('status').textContent = 'Error: ' + error.message;
    }
}

function setFrequency(freq) {
    document.getElementById('frequencySlider').value = freq;
    document.getElementById('frequencyDisplay').textContent = `${freq} Hz`;
    if (isPlaying) {
        updateAudio();
    }
}

async function togglePlay() {
    isPlaying = !isPlaying;
    const playButton = document.getElementById('playButton');
    
    if (isPlaying) {
        playButton.innerHTML = '<i class="fas fa-pause"></i> Pause';
        await updateAudio();
        drawWaveform();
    } else {
        await stopAudio();
        playButton.innerHTML = '<i class="fas fa-play"></i> Play';
    }
}

async function stopAudio() {
    try {
        const response = await fetch('/api/stop', { method: 'POST' });
        const data = await response.json();
        document.getElementById('status').textContent = data.message;
        isPlaying = false;
        document.getElementById('playButton').innerHTML = '<i class="fas fa-play"></i> Play';
        document.body.classList.remove('playing');
        cancelAnimationFrame(animationFrame);
    } catch (error) {
        document.getElementById('status').textContent = 'Error: ' + error.message;
    }
}

async function captureImage() {
    try {
        const response = await fetch('/api/capture', { method: 'POST' });
        const data = await response.json();
        if (data.status === 'success') {
            const img = document.getElementById('capturedImage');
            img.src = data.url;
            img.style.display = 'block';
            setTimeout(() => {
                img.style.display = 'none';
            }, 3000);
        }
        document.getElementById('status').textContent = data.message;
    } catch (error) {
        document.getElementById('status').textContent = 'Error: ' + error.message;
    }
}

// Event listeners
document.getElementById('frequencySlider').addEventListener('input', (e) => {
    document.getElementById('frequencyDisplay').textContent = `${parseFloat