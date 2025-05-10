from fastapi import APIRouter, UploadFile, HTTPException, File, Form
from fastapi.responses import JSONResponse
from typing import Literal
import logging
import tempfile
import os
from services.ai.skin_tone_analyzer import SkinToneAnalyzer

# Configure logging 
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize skin tone analyzer
analyzer = SkinToneAnalyzer()

@router.post("/analyze-skin-tone")
async def analyze_skin_tone (
    image_file: UploadFile = File(...),
    image_type: Literal["auto", "color", "bw"] = Form("color"),
):
    try:
        logger.info (f"Received image upload: {image_file.filename}")

        # Read the upload file data
        image_data = await image_file.read()

        # Process the image 
        result = analyzer.analyze_uploaded_image (image_data)

        if "error" in result:
            logger.error (f"Error in skin tone analysis: {result['error']}")
            if "file does not exist" in result["error"]:
                raise HTTPException(status_code=404, detail=result["error"])
            else:
                raise HTTPException(status_code=500, detail=result["error"])
        
        return result 
    
    except Exception as e:
        logger.error (f"Error processing uploaded image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing uploaded image: {str(e)}")