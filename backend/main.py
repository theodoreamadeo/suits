# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes.segmentation_routes import router as segmentation_router
from backend.api.routes.skin_tone_routes import router as skin_tone_router
from backend.api.routes.body_measurement_routes import router as body_measurement_router
from backend.api.routes.recommendation_routes_correct import router as recommendation_router
from backend.api.auth import router as auth_router
from backend.api.led_control import router as led_control_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="SUITS Singapore Body Measurement API")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log startup message
@app.on_event("startup")
async def startup_event():
    logger.info("Starting SUITS Singapore Body Measurement API")
    logger.info("API is ready to accept connections")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(segmentation_router, prefix="/api", tags=["Segmentation"])
app.include_router(skin_tone_router, prefix="/api", tags=["Skin Tone"])
app.include_router(body_measurement_router, prefix="/api", tags=["Body Measurement"])
app.include_router(recommendation_router, prefix="/api", tags=["Recommendation"])
app.include_router(led_control_router, prefix="/api", tags=["LED Control"])

# Root endpoint for basic API information
@app.get("/")
async def root():
    return {
        "name": "SUITS Singapore Body Measurement API",
        "version": "1.0.0",
        "description": "API for body measurements and size recommendations",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Log startup configuration
    logger.info("Starting uvicorn server")
    
    # Run the server with hot reload for development
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )