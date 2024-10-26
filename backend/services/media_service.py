from pathlib import Path
import pygame
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self, config):
        self.config = config
        self.camera = None
        self.audio_initialized = False

        # Initialize systems
        self._init_audio()
        self._init_camera()

    def _init_audio(self):
        """Initialize the audio system"""
        try:
            pygame.mixer.quit()  # Clean up any existing mixer
            pygame.mixer.init(
                frequency=self.config['SAMPLE_RATE'],
                size=self.config['SIZE'],
                channels=self.config['CHANNELS'],
                buffer=self.config['BUFFER']
            )
            self.audio_initialized = True
            logger.info("Audio system initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize audio: {e}")
            self.audio_initialized = False

    def _init_camera(self):
        """Initialize the camera system"""
        try:
            self.camera = cv2.VideoCapture(self.config['DEVICE_ID'])
            if not self.camera.isOpened():
                raise Exception("Could not open camera")
            
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.config['FRAME_WIDTH'])
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config['FRAME_HEIGHT'])
            self.camera.set(cv2.CAP_PROP_FPS, self.config['FPS'])
            
            logger.info("Camera initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            self.camera = None

    # ... rest of the class implementation remains the same ...