class CymaticsStream {
    constructor() {
        this.ws = null;
        this.videoElement = document.getElementById('cameraFeed');
        this.connected = false;
        this.sessionActive = false;
    }

    async connect() {
        try {
            this.ws = new WebSocket(`ws://${window.location.host}/ws/stream`);
            
            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };
            
            this.ws.onopen = () => {
                this.connected = true;
                console.log('Connected to stream');
            };
            
            this.ws.onclose = () => {
                this.connected = false;
                console.log('Disconnected from stream');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connect(), 5000);
            };
        } catch (error) {
            console.error('Connection error:', error);
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'frame':
                this.updateVideo(message.data);
                break;
            case 'session_started':
                this.sessionActive = true;
                this.onSessionStart?.(message);
                break;
            case 'session_completed':
                this.sessionActive = false;
                this.onSessionComplete?.(message);
                break;
            case 'error':
                console.error('Stream error:', message.message);
                break;
        }
    }

    updateVideo(frameData) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Update video element with new frame
            if (this.videoElement) {
                this.videoElement.srcObject = canvas.captureStream();
            }
        };
        img.src = 'data:image/jpeg;base64,' + frameData;
    }

    async startSession(frequency, duration = 20) {
        if (!this.connected) return;
        
        await this.ws.send(JSON.stringify({
            type: 'start_session',
            frequency,
            duration
        }));
    }

    async stopSession() {
        if (!this.connected || !this.sessionActive) return;
        
        await this.ws.send(JSON.stringify({
            type: 'stop_session'
        }));
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}