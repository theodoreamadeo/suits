from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import cv2
import numpy as np
import base64
import tempfile
import os
from datetime import datetime
import json
import re

# Import the body measurement class
from services.ai.body_measurement import BodyMeasurement

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the body measurement service
bodyMeasure = BodyMeasurement()

# Data models
class CalibrationRequest(BaseModel):
    userHeight: float
    shoulderWidth: float
    cameraDistance: float = 2.0

class FrameRequest(BaseModel):
    frame: str  # Base64 encoded image

class MeasurementSaveRequest(BaseModel):
    shoulderWidth: float
    torsoLength: float
    legLength: float
    totalHeight: float
    scaleFactor: float
    notes: Optional[str] = None

# helper function for decoding base64 images
def decode_base64_image(base64_img):
    """
    Decode base64 image to OpenCV format with enhanced error handling
    """
    try:
        # Log the first part of the image string for debugging
        logger.info(f"Decoding base64 image, first 50 chars: {base64_img[:50]}...")
        
        # Check if the string is empty
        if not base64_img:
            logger.error("Empty base64 string received")
            return None
        
        # Remove data URL prefix if present
        if ';base64,' in base64_img:
            base64_img = base64_img.split(';base64,')[1]
            logger.info("Removed data URL prefix")
        elif ',' in base64_img:
            base64_img = base64_img.split(',')[1]
            logger.info("Removed partial URL prefix")
            
        # Check if the base64 string is valid
        if not re.match(r'^[A-Za-z0-9+/]+={0,2}$', base64_img):
            logger.error("Invalid base64 format")
            return None
            
        # Decode base64 string to bytes
        img_bytes = base64.b64decode(base64_img)
        logger.info(f"Decoded base64 to {len(img_bytes)} bytes")
        
        # Check if we got any bytes
        if not img_bytes:
            logger.error("Decoded base64 resulted in empty bytes")
            return None
            
        # Convert bytes to numpy array
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        logger.info(f"Converted to numpy array of size {img_array.size}")
        
        # Check if array is not empty
        if img_array.size == 0:
            logger.error("Empty array after fromBuffer")
            return None
            
        # Decode the numpy array as an image
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is not None:
            logger.info(f"Successfully decoded image with shape {img.shape}")
        else:
            logger.error("Failed to decode image from bytes")
        
        return img
        
    except Exception as e:
        logger.error(f"Error decoding base64 image: {str(e)}")
        return None

# Routes
@router.post("/body-measurement/calibrate")
async def calibrate(data: CalibrationRequest):
    """Initialize calibration with user's actual measurements"""
    try:
        # Log the received calibration data
        logger.info(f"Received calibration request: {data}")
        
        # Validate input
        if data.userHeight <= 0 or data.shoulderWidth <= 0:
            raise HTTPException(
                status_code=400, 
                detail="Height and shoulder width must be positive values"
            )
            
        # Initialize the body measurement service with calibration data
        result = bodyMeasure.initialize_calibration(
            user_height_cm=data.userHeight,
            shoulder_width_cm=data.shoulderWidth,
            camera_distance_m=data.cameraDistance
        )
        
        logger.info(f"Calibration result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in calibration initialization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/body-measurement/process-body-frame")
async def process_frame(request: FrameRequest):
    """Process a single video frame for body measurements"""
    try:
        frame_length = len(request.frame) if request.frame else 0
        logger.info(f"Received frame data with length: {frame_length}")
        
        if not request.frame or frame_length < 100:
            logger.error("Received empty or invalid frame data")
            raise HTTPException(
                status_code=400, 
                detail="Empty or invalid frame data received"
            )
        
        # Decode the base64 image
        image = decode_base64_image(request.frame)
        if image is None:
            logger.error("Could not decode base64 image")
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Process the frame with the body measurement service
        logger.info(f"Processing frame with shape: {image.shape}")
        result = bodyMeasure.process_frame(image)
        
        # Log the result structure
        logger.info(f"Processed frame. Result keys: {result.keys()}")
        if 'visualizationImage' in result:
            vis_length = len(result['visualizationImage']) if result['visualizationImage'] else 0
            logger.info(f"Visualization image length: {vis_length}")
        
        return result
    
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/body-measurement/save")
async def save_measurement(data: MeasurementSaveRequest):
    """Save a measurement to storage"""
    try:
        # Log the received measurement data
        logger.info(f"Saving measurement data: {data}")
        
        # Create a unique filename based on timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"measurement_{timestamp}.json"
        
        # Create measurements directory if it doesn't exist
        measurements_dir = "measurements"
        os.makedirs(measurements_dir, exist_ok=True)
        
        # Save measurement data to file
        filepath = os.path.join(measurements_dir, filename)
        with open(filepath, "w") as f:
            json.dump(data.dict(), f, indent=2)
            
        logger.info(f"Measurement saved to {filepath}")
        
        return {
            "success": True,
            "message": "Measurement saved successfully",
            "filename": filename
        }
        
    except Exception as e:
        logger.error(f"Error saving measurement: {e}")
        raise HTTPException(status_code=500, detail=str(e))