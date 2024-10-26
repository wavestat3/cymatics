import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
CAPTURES_DIR = STATIC_DIR / "captures"
LOG_DIR = BASE_DIR / "logs"

# Ensure directories exist
for dir_path in [DATA_DIR, STATIC_DIR, CAPTURES_DIR, LOG_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/cymatics.db")

# Audio settings
AUDIO_CONFIG = {
    'SAMPLE_RATE': 44100,
    'SIZE': -16,
    'CHANNELS': 2,
    'BUFFER': 512,
    'MAX_FREQUENCY': 2000,
    'MIN_FREQUENCY': 20,
    'DEFAULT_VOLUME': 0.9,
    'DEFAULT_DURATION': 1.0
}

# Camera settings
CAMERA_CONFIG = {
    'DEVICE_ID': 0,
    'FRAME_WIDTH': 1280,
    'FRAME_HEIGHT': 720,
    'FPS': 30,
    'CAPTURE_FORMAT': 'MJPG'
}

# Media settings
MEDIA_CONFIG = {
    'WATERMARK_PATH': STATIC_DIR / "watermark" / "watermark.png",
    'VIDEO_CODEC': 'mp4v',
    'VIDEO_FPS': 30,
    'IMAGE_QUALITY': 95,
    'MAX_FILE_SIZE': 100 * 1024 * 1024  # 100MB
}

# Email settings (if needed)
EMAIL_CONFIG = {
    'SMTP_SERVER': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'SMTP_PORT': int(os.getenv('SMTP_PORT', '587')),
    'SMTP_USERNAME': os.getenv('SMTP_USERNAME', ''),
    'SMTP_PASSWORD': os.getenv('SMTP_PASSWORD', ''),
    'FROM_EMAIL': os.getenv('FROM_EMAIL', ''),
    'USE_TLS': True
}

# Session settings
SESSION_CONFIG = {
    'DEFAULT_DURATION': 20,  # seconds
    'MIN_DURATION': 5,
    'MAX_DURATION': 60,
    'COUNTDOWN_DURATION': 3  # seconds for countdown
}