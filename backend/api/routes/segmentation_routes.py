# backend/api/routes/segmentation.py
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import os
import tempfile
from datetime import datetime
import sys
import uuid

# Add the parent directory to sys.path to import the segmentation service
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from services.ai.segmentation_services import (
    FaceLandmarker, FaceLandmarkerOptions, BaseOptions, VisionRunningMode,
    get_triangulation, get_facial_features, draw_mesh,
    create_face_mask
)

router = APIRouter()

# Initialize face landmarker once when the module is loaded
model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                         "models", "face_landmarker.task")

options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True)

face_landmarker = FaceLandmarker.create_from_options(options)

# Models
class FrameRequest(BaseModel):
    frame: str  # Base64 encoded image

class SaveFaceResponse(BaseModel):
    savedPath: str

class AnalyzeSkinToneRequest(BaseModel):
    imagePath: str

# Helper function to decode base64 image
def decode_base64_image(base64_img):
    # Remove data URL prefix if present
    if ',' in base64_img:
        base64_img = base64_img.split(',')[1]
    
    # Decode base64 string to bytes
    img_bytes = base64.b64decode(base64_img)
    
    # Convert bytes to numpy array
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    
    # Decode the numpy array as an image
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    return img

# Helper function to encode image to base64
def encode_image_to_base64(image):
    # Convert numpy array to jpg
    _, buffer = cv2.imencode('.jpg', image)
    
    # Convert to base64 and then to string
    base64_img = base64.b64encode(buffer).decode('utf-8')
    
    # Add data URL prefix
    return f"data:image/jpeg;base64,{base64_img}"

@router.post("/process-frame")
async def process_frame(request: FrameRequest):
    try:
        # Decode the base64 image
        image = decode_base64_image(request.frame)
        
        # Convert to RGB (MediaPipe requires RGB)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Create MediaPipe Image
        import mediapipe as mp
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        
        # Process the image
        detection_result = face_landmarker.detect(mp_image)
        
        # Initialize response object
        response = {
            "meshVisualization": "",
            "segmentedFace": "",
            "hasFace": False,
            "fps": 0  # Placeholder for FPS
        }
        
        # Check if a face was detected
        if detection_result.face_landmarks:
            response["hasFace"] = True
            
            # Get triangulation and facial features
            triangulation = get_triangulation()
            facial_features = get_facial_features()
            
            # Draw mesh visualization
            face_landmarks = detection_result.face_landmarks[0]  # First face
            mesh_visualization = draw_mesh(image.copy(), face_landmarks, triangulation, facial_features)
            
            # Create face mask and segmented face
            face_mask = create_face_mask(image, face_landmarks)
            segmented_face = cv2.bitwise_and(image, image, mask=face_mask)
            
            # Encode results as base64
            response["meshVisualization"] = encode_image_to_base64(mesh_visualization)
            response["segmentedFace"] = encode_image_to_base64(segmented_face)
            
            # Placeholder FPS (could be calculated on the frontend)
            response["fps"] = 30
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))