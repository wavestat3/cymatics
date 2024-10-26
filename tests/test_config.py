import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

import logging
from backend.config.settings import (
    AUDIO_CONFIG,
    CAMERA_CONFIG,
    MEDIA_CONFIG,
    STATIC_DIR,
    CAPTURES_DIR
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_config():
    logger.info("Testing configuration...")
    
    # Test audio config
    assert AUDIO_CONFIG['SAMPLE_RATE'] == 44100, "Invalid sample rate"
    assert AUDIO_CONFIG['SIZE'] == -16, "Invalid size"
    assert AUDIO_CONFIG['CHANNELS'] == 2, "Invalid channels"
    assert AUDIO_CONFIG['BUFFER'] == 512, "Invalid buffer size"
    logger.info("Audio configuration valid")
    
    # Test camera config
    assert CAMERA_CONFIG['DEVICE_ID'] >= 0, "Invalid device ID"
    assert CAMERA_CONFIG['FRAME_WIDTH'] > 0, "Invalid frame width"
    assert CAMERA_CONFIG['FRAME_HEIGHT'] > 0, "Invalid frame height"
    assert CAMERA_CONFIG['FPS'] > 0, "Invalid FPS"
    logger.info("Camera configuration valid")
    
    # Test paths
    assert STATIC_DIR.exists(), "Static directory doesn't exist"
    assert CAPTURES_DIR.exists(), "Captures directory doesn't exist"
    logger.info("Directory structure valid")
    
    return True

if __name__ == "__main__":
    try:
        test_config()
        print("Configuration test passed!")
    except AssertionError as e:
        print(f"Configuration test failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")