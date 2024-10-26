from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import numpy as np
import pygame
import cv2
import logging
import sys
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Optional, Literal

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base configuration
BASE_DIR = Path(__file__).parent.parent
STATIC_DIR = BASE_DIR / "static"
CAPTURES_DIR = STATIC_DIR / "captures"
CAPTURES_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Initialize camera
try:
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        logger.error("Could not open camera")
    else:
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        camera.set(cv2.CAP_PROP_FPS, 30)
        logger.info("Camera initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize camera: {e}")
    camera = None

# Initialize audio
try:
    pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
    logger.info("Audio system initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize audio: {e}")

# Global state
class GlobalState:
    def __init__(self):
        self.current_frequency = None
        self.current_sound = None
        self.current_volume = 0.9
        self.current_waveform = "sine"
        self.active_sessions = {}  # Store active experiment sessions

state = GlobalState()

# Models
class AudioRequest(BaseModel):
    frequency: float
    volume: Optional[float] = 0.9
    waveform: Optional[Literal["sine", "square", "triangle", "sawtooth"]] = "sine"

class CaptureRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class ExperimentSession(BaseModel):
    session_id: str
    frequency: float
    start_time: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    opt_in: bool = False
    image_path: Optional[str] = None

# Frequency Management Endpoints
@app.get("/api/frequencies/used")
async def get_used_frequencies():
    """Get list of frequencies that have been used"""
    try:
        # For now, return empty list until we implement database
        return {
            "status": "success",
            "frequencies": []
        }
    except Exception as e:
        logger.error(f"Error getting used frequencies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/frequencies/suggest")
async def suggest_frequency():
    """Suggest an unused frequency"""
    try:
        suggested_freq = random.randint(20, 2000)
        return {
            "status": "success",
            "frequency": suggested_freq,
            "is_new": True
        }
    except Exception as e:
        logger.error(f"Error suggesting frequency: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def read_root():
    """Root endpoint returning system status"""
    return {
        "status": "Cymatics backend is running",
        "current_frequency": state.current_frequency,
        "current_waveform": state.current_waveform,
        "current_volume": state.current_volume,
        "camera_available": camera is not None and camera.isOpened()
    }

# Audio control endpoints
@app.post("/api/audio")
async def set_audio(audio_req: AudioRequest):
    """Set and play audio with specified parameters"""
    try:
        # Update global state
        state.current_frequency = audio_req.frequency
        state.current_volume = audio_req.volume
        state.current_waveform = audio_req.waveform
        
        # Generate tone
        sample_rate = 44100
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Generate waveform
        if state.current_waveform == "sine":
            wave = np.sin(2 * np.pi * state.current_frequency * t)
        elif state.current_waveform == "square":
            wave = np.sign(np.sin(2 * np.pi * state.current_frequency * t))
        elif state.current_waveform == "triangle":
            wave = 2 * np.abs(2 * (t * state.current_frequency - np.floor(0.5 + t * state.current_frequency))) - 1
        elif state.current_waveform == "sawtooth":
            wave = 2 * (t * state.current_frequency - np.floor(0.5 + t * state.current_frequency))
        
        # Apply volume and convert to 16-bit integers
        wave = wave * state.current_volume
        audio_data = (wave * 32767).astype(np.int16)
        
        # Create stereo data
        stereo_data = np.column_stack([audio_data, audio_data])
        
        # Stop any current sound
        pygame.mixer.stop()
        
        # Create and play new sound
        state.current_sound = pygame.sndarray.make_sound(stereo_data)
        state.current_sound.play(-1)  # Loop indefinitely
        
        logger.info(f"Playing {state.current_waveform} wave at {state.current_frequency}Hz")
        return {
            "status": "success",
            "message": f"Playing {state.current_waveform} wave at {state.current_frequency}Hz"
        }
    except Exception as e:
        logger.error(f"Error setting audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop")
async def stop_audio():
    """Stop audio playback"""
    try:
        pygame.mixer.stop()
        state.current_sound = None
        return {"status": "success", "message": "Audio stopped"}
    except Exception as e:
        logger.error(f"Error stopping audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/capture")
async def capture_image(capture_req: Optional[CaptureRequest] = None):
    """Capture image from camera"""
    if not camera or not camera.isOpened():
        raise HTTPException(status_code=500, detail="Camera not available")
        
    try:
        # Capture frame
        ret, frame = camera.read()
        if not ret:
            raise HTTPException(status_code=500, detail="Failed to capture image")
        
        # Generate filename with timestamp and frequency
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        freq_str = f"{state.current_frequency}Hz" if state.current_frequency else "no_freq"
        filename = f"cymatics_{freq_str}_{timestamp}.jpg"
        
        # Save image
        image_path = CAPTURES_DIR / filename
        cv2.imwrite(str(image_path), frame)
        
        return {
            "status": "success",
            "message": "Image captured successfully",
            "filename": filename,
            "url": f"/static/captures/{filename}"
        }
    except Exception as e:
        logger.error(f"Error capturing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Experiment endpoints
@app.post("/api/experiment/start")
async def start_experiment(frequency: float):
    """Start a new cymatics experiment"""
    try:
        session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create new session
        session = ExperimentSession(
            session_id=session_id,
            frequency=frequency,
            start_time=datetime.now()
        )
        
        # Store session
        state.active_sessions[session_id] = session
        
        return {
            "status": "success",
            "session_id": session_id,
            "frequency": frequency,
            "duration": 20,  # 20 seconds experiment
            "message": "Experiment session initialized"
        }
    except Exception as e:
        logger.error(f"Error starting experiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/experiment/current")
async def get_current_experiment():
    """Get current experiment data"""
    try:
        if state.current_frequency is None:
            raise HTTPException(status_code=404, detail="No active experiment")
            
        return {
            "status": "success",
            "frequency": state.current_frequency,
            "waveform": state.current_waveform
        }
    except Exception as e:
        logger.error(f"Error getting experiment data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)