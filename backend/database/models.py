from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Recording(Base):
    __tablename__ = "recordings"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    frequency = Column(Float)
    waveform = Column(String)
    volume = Column(Float)
    duration = Column(Float)
    email = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    video_path = Column(String, nullable=True)
    settings = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    
    patterns = relationship("Pattern", back_populates="recording")
    analytics = relationship("Analytics", back_populates="recording")

class Pattern(Base):
    __tablename__ = "patterns"
    
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer, ForeignKey('recordings.id'))
    image_path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    analysis_data = Column(JSON, nullable=True)
    
    recording = relationship("Recording", back_populates="patterns")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer, ForeignKey('recordings.id'))
    frequency_response = Column(JSON, nullable=True)
    pattern_metrics = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    recording = relationship("Recording", back_populates="analytics")