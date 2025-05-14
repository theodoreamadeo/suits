from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
import logging
import cv2
import numpy as np
import base64
import os
from datetime import datetime
import json
import re

# Import the body measurement class
from services.ai.measurement import BodyMeasurement

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the body measurement service
bodyMeasure = BodyMeasurement()

# Data models
class FrameRequest(BaseModel):
    frame: str  # Base64 encoded image

class SetScaleFactorRequest(BaseModel):
    scale_factor: float  # Scale factor in cm/px

class MeasurementResponse(BaseModel):
    shoulder_width: Optional[float]
    torso_length: Optional[float]
    hip_width: Optional[float]
    left_leg_length: Optional[float]
    right_leg_length: Optional[float]
    unit: str
    timestamp: float
    size_categories: Optional[Dict[str, str]] = None
    visualization_image: Optional[str] = None

class MeasurementSaveRequest(BaseModel):
    shoulder_width: float
    torso_length: float
    hip_width: float
    left_leg_length: float
    right_leg_length: float
    unit: str
    timestamp: float
    size_categories: Optional[Dict[str, str]] = None
    notes: Optional[str] = None

# Helper function for decoding base64 images
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

# Helper function to encode an image to base64
def encode_image_to_base64(image):
    """
    Encode OpenCV image to base64 string
    """
    try:
        if image is None:
            logger.error("Cannot encode None image")
            return None
            
        # Encode image to jpg format
        success, buffer = cv2.imencode('.jpg', image)
        if not success:
            logger.error("Failed to encode image")
            return None
            
        # Convert to base64
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_image}"
        
    except Exception as e:
        logger.error(f"Error encoding image to base64: {str(e)}")
        return None

# Routes
@router.post("/body-measurement/process-body-frame", response_model=MeasurementResponse)
async def process_frame(request: FrameRequest):
    """
    Process a single video frame for body measurements.
    Returns measurements, sizing info, and visualization.
    """
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
        measurements = bodyMeasure.process_frame(image)
        
        # If no measurements were obtained (pose not stable)
        if measurements is None:
            logger.info("No stable measurements obtained yet")
            return JSONResponse(
                status_code=202,  # Accepted but not complete
                content={"message": "Pose not stable or detection incomplete"}
            )
        
        # Log the measurement keys
        logger.info(f"Measurements obtained: {measurements.keys()}")
        
        # Encode the processed image to base64 for response
        visualization_image = encode_image_to_base64(image)
        
        # Create response with measurements and visualization
        response_data = {
            **measurements,  # Include all measurements from the dictionary
            "visualization_image": visualization_image
        }
        
        return response_data
    
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/body-measurement/latest")
async def get_latest_measurements():
    """
    Get the latest measurements without processing a new frame
    """
    try:
        # Get the latest stored measurements
        measurements = bodyMeasure.get_latest_measurements()
        
        if not measurements:
            return JSONResponse(
                status_code=404,
                content={"message": "No measurements available"}
            )
            
        return measurements
        
    except Exception as e:
        logger.error(f"Error getting latest measurements: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/body-measurement/save")
async def save_measurement(data: MeasurementSaveRequest):
    """
    Save a measurement to storage
    """
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