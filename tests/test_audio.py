import pygame
import numpy as np
import time
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_audio():
    try:
        # Audio settings
        AUDIO_CONFIG = {
            'SAMPLE_RATE': 44100,
            'SIZE': -16,
            'CHANNELS': 2,
            'BUFFER': 512
        }
        
        # Initialize pygame mixer
        pygame.mixer.init(
            frequency=AUDIO_CONFIG['SAMPLE_RATE'],
            size=AUDIO_CONFIG['SIZE'],
            channels=AUDIO_CONFIG['CHANNELS'],
            buffer=AUDIO_CONFIG['BUFFER']
        )
        
        logger.info("Pygame mixer initialized successfully")
        
        # Generate test tone
        frequency = 440  # A4 note
        duration = 1.0   # seconds
        sample_rate = AUDIO_CONFIG['SAMPLE_RATE']
        
        # Generate samples
        t = np.linspace(0, duration, int(sample_rate * duration))
        tone = np.sin(2 * np.pi * frequency * t)
        audio_data = (tone * 32767).astype(np.int16)
        
        # Make it stereo
        stereo_data = np.column_stack([audio_data, audio_data])
        
        logger.info("Audio data generated successfully")
        
        # Create and play sound
        sound = pygame.sndarray.make_sound(stereo_data)
        sound.play()
        
        logger.info(f"Playing {frequency}Hz tone for {duration} seconds...")
        time.sleep(duration)
        
        # Clean up
        pygame.mixer.quit()
        logger.info("Audio test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Audio test failed: {e}")
        return False

if __name__ == "__main__":
    test_audio()