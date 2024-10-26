from fastapi import WebSocket
import asyncio
import cv2
import base64
import json
import logging
from typing import Dict, Set, Optional
from datetime import datetime
import numpy as np
from .media_service import MediaService

logger = logging.getLogger(__name__)

class StreamingService:
    def __init__(self, media_service: MediaService):
        self.media_service = media_service
        self.active_connections: Set[WebSocket] = set()
        self.active_sessions: Dict[str, dict] = {}
        self._stream_task: Optional[asyncio.Task] = None
        
    async def connect(self, websocket: WebSocket):
        """Handle new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")
        
    async def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection."""
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Remaining connections: {len(self.active_connections)}")
        
        # If no more connections, stop streaming
        if not self.active_connections and self._stream_task:
            self._stream_task.cancel()
            self._stream_task = None

    async def broadcast_frame(self, frame: np.ndarray):
        """Broadcast frame to all connected clients."""
        if not self.active_connections:
            return

        try:
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            # Convert to base64
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Create message with frame data and timestamp
            message = {
                'type': 'frame',
                'data': frame_base64,
                'timestamp': datetime.now().isoformat()
            }
            
            # Broadcast to all clients
            for connection in self.active_connections.copy():
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending frame to client: {e}")
                    await self.disconnect(connection)
                    
        except Exception as e:
            logger.error(f"Error broadcasting frame: {e}")

    async def start_stream(self):
        """Start the video stream."""
        if self._stream_task:
            return
        
        self._stream_task = asyncio.create_task(self._stream_loop())
        logger.info("Stream started")

    async def _stream_loop(self):
        """Main streaming loop."""
        try:
            while self.active_connections:
                if not self.media_service.camera:
                    await asyncio.sleep(1)
                    continue
                
                ret, frame = self.media_service.camera.read()
                if not ret:
                    logger.error("Failed to read camera frame")
                    await asyncio.sleep(0.1)
                    continue
                
                # Add overlays if in session
                if self.media_service.current_session:
                    frame = self.media_service._add_overlay(frame)
                    frame = self.media_service._add_watermark(frame)
                
                await self.broadcast_frame(frame)
                
                # Control frame rate
                await asyncio.sleep(1/30)  # 30 FPS
                
        except asyncio.CancelledError:
            logger.info("Stream loop cancelled")
        except Exception as e:
            logger.error(f"Error in stream loop: {e}")
        finally:
            self._stream_task = None

    async def handle_client_message(self, websocket: WebSocket, message: dict):
        """Handle incoming messages from clients."""
        try:
            msg_type = message.get('type')
            
            if msg_type == 'start_session':
                frequency = message.get('frequency')
                duration = message.get('duration', 20.0)
                
                # Start new session
                session = await self.media_service.start_session(frequency, duration)
                
                # Notify all clients
                await self.broadcast_session_status({
                    'type': 'session_started',
                    'session_id': session['id'],
                    'frequency': frequency,
                    'duration': duration
                })
                
            elif msg_type == 'stop_session':
                if self.media_service.current_session:
                    # Capture final image
                    image_path = await self.media_service.capture_image()
                    
                    # Notify clients
                    await self.broadcast_session_status({
                        'type': 'session_completed',
                        'session_id': self.media_service.current_session['id'],
                        'image_path': str(image_path)
                    })
                    
            elif msg_type == 'audio_sync':
                # Handle audio synchronization
                server_timestamp = datetime.now().timestamp()
                await websocket.send_json({
                    'type': 'audio_sync_response',
                    'server_time': server_timestamp,
                    'client_time': message.get('client_time')
                })
                
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
            await websocket.send_json({
                'type': 'error',
                'message': str(e)
            })

    async def broadcast_session_status(self, status: dict):
        """Broadcast session status to all clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(status)
            except Exception as e:
                logger.error(f"Error broadcasting status: {e}")
                await self.disconnect(connection)