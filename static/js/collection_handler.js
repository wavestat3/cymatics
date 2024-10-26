class CollectionHandler {
    constructor() {
        this.initializeElements();
        this.loadExperimentResult();
        this.attachEventListeners();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('collectionForm');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.phoneInput = document.getElementById('phone');
        this.optInCheckbox = document.getElementById('optIn');
        
        // Result display elements
        this.resultImage = document.getElementById('resultImage');
        this.frequencyValue = document.getElementById('frequencyValue');
        
        // Action buttons
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newExperimentBtn = document.getElementById('newExperimentBtn');
        
        // Messages
        this.successMessage = document.getElementById('successMessage');
    }

    async loadExperimentResult() {
        try {
            const response = await fetch('/api/experiment/result');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.resultImage.src = data.imagePath;
                this.frequencyValue.textContent = data.frequency;
                this.experimentData = data;
            } else {
                throw new Error('No experiment data found');
            }
        } catch (error) {
            console.error('Error loading experiment result:', error);
            // Redirect back to start if no data
            window.location.href = '/';
        }
    }

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Download button
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        
        // New experiment button
        this.newExperimentBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // Input validation
        this.emailInput.addEventListener('input', () => this.validateContactMethod());
        this.phoneInput.addEventListener('input', () => this.validateContactMethod());
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) return;
        
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            optIn: formData.get('optIn') === 'on',
            sendImage: formData.get('sendImage') === 'on',
            sendVideo: formData.get('sendVideo') === 'on'
        };

        try {
            const response = await fetch('/api/experiment/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess();
            } else {
                throw new Error('Failed to save experiment');
            }
        } catch (error) {
            console.error('Error saving experiment:', error);
            alert('Error saving your creation. Please try again.');
        }
    }

    validateForm() {
        // Require at least email or phone
        if (!this.emailInput.value && !this.phoneInput.value) {
            alert('Please provide either an email address or phone number');
            return false;
        }
        
        // Validate email if provided
        if (this.emailInput.value && !this.isValidEmail(this.emailInput.value)) {
            alert('Please enter a valid email address');
            return false;
        }
        
        // Validate phone if provided
        if (this.phoneInput.value && !this.isValidPhone(this.phoneInput.value)) {
            alert('Please enter a valid phone number');
            return false;
        }
        
        return true;
    }

    validateContactMethod() {
        // Enable/disable inputs based on what's being filled
        if (this.emailInput.value) {
            this.phoneInput.required = false;
        } else if (this.phoneInput.value) {
            this.emailInput.required = false;
        } else {
            this.emailInput.required = true;
            this.phoneInput.required = true;
        }
    }

    async handleDownload() {
        try {
            // Create download links for selected content
            if (this.form.sendImage.checked) {
                this.downloadFile(this.experimentData.imagePath, 'cymatics-pattern.jpg');
            }
            
            if (this.form.sendVideo.checked && this.experimentData.videoPath) {
                this.downloadFile(this.experimentData.videoPath, 'cymatics-video.mp4');
            }
        } catch (error) {
            console.error('Error downloading files:', error);
            alert('Error downloading files. Please try again.');
        }
    }

    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    showSuccess() {
        this.form.style.display = 'none';
        this.successMessage.style.display = 'block';
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^\+?[\d\s-]{10,}$/.test(phone);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.collectionHandler = new CollectionHandler();
});