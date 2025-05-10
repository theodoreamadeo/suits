# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.segmentation_routes import router as segmentation_router
from api.routes.skin_tone_routes import router as skin_tone_router

app = FastAPI(title="Face Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(segmentation_router, prefix="/api", tags=["Segmentation"])
app.include_router(skin_tone_router, prefix="/api", tags=["Skin Tone"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)