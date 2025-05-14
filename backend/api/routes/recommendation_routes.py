from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import random
import os

# Use APIRouter instead of FastAPI for route modules
router = APIRouter()

# Models 
class RecommendationRequest(BaseModel):
    skin_tone_hex: str
    gender: str
    usage: List[str]
    footwear_preference: str  # Fixed typo from footware to footwear

class OutfitItem (BaseModel):
    id: int
    type: str
    display_name: str
    color: str
    image_url: str
    price: float

class Outfit (BaseModel):
    id: int 
    topwear: OutfitItem
    bottomwear: OutfitItem
    footwear: OutfitItem  # Fixed typo from footware to footwear

class RecommendationResponse(BaseModel):
    outfits: List[Outfit]

# Data loading
data_path = "C:\EID\suits\data\fashion-dataset\styles.csv"
image_path = "C:\EID\suits\data\fashion-dataset\images.csv"

# Load data on module initialization
try:
    data = pd.read_csv(data_path, on_bad_lines="skip")
    images = pd.read_csv(image_path, on_bad_lines="skip")
    data = data.dropna(subset=["baseColour", "season", "usage", "productDisplayName"])
except Exception as e:
    # Log the error but allow the app to start
    # The routes will raise appropriate errors when accessed
    print(f"Error loading data: {e}")
    data = None
    images = None

# Skin tone to color mapping
SKIN_TONE_COLOR_MAPPING = {
    "#373028": ["Navy Blue", "Black", "Charcoal", "Burgundy", "Maroon", "Olive", "Rust", "Gold", "Cream", "Peach"],
    "#422811": ["Navy Blue", "Brown", "Khaki", "Olive", "Maroon", "Mustard", "Teal", "Tan", "Rust", "Burgundy"],
    "#513B2E": ["Cream", "Beige", "Olive", "Burgundy", "Red", "Orange", "Mustard", "Bronze", "Teal", "Peach"],
    "#6F503C": ["Beige", "Brown", "Green", "Khaki", "Cream", "Peach", "Lime Green", "Olive", "Maroon", "Rust", "Mustard"],
    "#81654F": ["Beige", "Off White", "Sea Green", "Cream", "Lavender", "Mauve", "Burgundy", "Yellow", "Lime Green"],
    "#9D7A54": ["Olive", "Khaki", "Yellow", "Sea Green", "Turquoise Blue", "White", "Gold", "Peach"],
    "#BEA07E": ["Sea Green", "Turquoise Blue", "Pink", "Lavender", "Rose", "White", "Peach", "Teal", "Fluorescent Green"],
    "#E5C8A6": ["Turquoise Blue", "Peach", "Teal", "Pink", "Red", "Rose", "Off White", "White", "Cream", "Gold", "Yellow"],
    "#E7C1B8": ["Pink", "Rose", "Peach", "White", "Off White", "Beige", "Lavender", "Teal", "Fluorescent Green"],
    "#F3DAD6": ["White", "Cream", "Peach", "Pink", "Rose", "Lavender", "Mustard", "Lime Green", "Light Blue", "Fluorescent Green"],
    "#FBF2F3": ["Peach", "Lavender", "Pink", "White", "Off White", "Rose", "Light Blue", "Sea Green", "Fluorescent Green", "Silver", "Cream", "Tan"]
}

# Color harmony maps
COMPLEMENTARY_MAP = {
    "Navy Blue": ["Orange", "Copper"],
    "Blue": ["Orange", "Gold"],
    "Silver": ["Black", "Charcoal"],
    "Black": ["White", "Beige"],
    "Grey": ["Maroon", "Burgundy"],
    "Green": ["Red", "Maroon"],
    "Purple": ["Yellow", "Gold"],
    "White": ["Black", "Navy Blue"],
    "Beige": ["Brown", "Burgundy"],
    "Brown": ["Beige", "Cream"],
    "Bronze": ["Turquoise Blue", "Teal"],
    "Teal": ["Orange", "Copper"],
    "Copper": ["Blue", "Teal"],
    "Pink": ["Green", "Olive"],
    "Off White": ["Charcoal", "Navy Blue"],
    "Maroon": ["Grey", "Teal"],
    "Red": ["Green", "Teal"],
    "Khaki": ["Brown", "Olive"],
    "Orange": ["Blue", "Teal"],
    "Yellow": ["Purple", "Lavender"],
    "Charcoal": ["Off White", "Beige"],
    "Gold": ["Blue", "Navy Blue"],
    "Steel": ["Rust", "Copper"],
    "Tan": ["Brown", "Burgundy"],
    "Multi": ["Depends on context"],
    "Magenta": ["Lime Green", "Sea Green"],
    "Lavender": ["Peach", "Pink"],
    "Sea Green": ["Magenta", "Maroon"],
    "Cream": ["Burgundy", "Coffee Brown"],
    "Peach": ["Lavender", "Turquoise Blue"],
    "Olive": ["Pink", "Beige"],
    "Skin": ["Nude", "Beige"],
    "Burgundy": ["Cream", "Olive"],
    "Coffee Brown": ["Cream", "Beige"],
    "Grey Melange": ["Rust", "Steel"],
    "Rust": ["Steel", "Turquoise Blue"],
    "Rose": ["Olive", "Sea Green"],
    "Lime Green": ["Magenta", "Lavender"],
    "Mauve": ["Peach", "Turquoise Blue"],
    "Turquoise Blue": ["Bronze", "Rust"],
    "Metallic": ["Depends on shade"],
    "Mustard": ["Navy Blue", "Teal"],
    "Taupe": ["Grey", "Charcoal"],
    "Nude": ["Beige", "Cream"],
    "Mushroom Brown": ["Beige", "Tan"],
    "Fluorescent Green": ["Magenta", "Pink"],
}

# Analogous color relationships
ANALOGOUS_MAP = {
    "Navy Blue": ["Blue", "Steel", "Charcoal"],
    "Blue": ["Navy Blue", "Teal", "Turquoise Blue"],
    "Silver": ["Grey", "White", "Steel"],
    "Black": ["Charcoal", "Grey", "Steel"],
    "Grey": ["Silver", "Charcoal", "Steel"],
    "Green": ["Sea Green", "Olive", "Teal"],
    "Purple": ["Magenta", "Lavender", "Mauve"],
    "White": ["Off White", "Cream", "Silver"],
    "Beige": ["Tan", "Cream", "Nude"],
    "Brown": ["Burgundy", "Coffee Brown", "Khaki"],
    "Bronze": ["Copper", "Gold", "Rust"],
    "Teal": ["Turquoise Blue", "Green", "Sea Green"],
    "Copper": ["Bronze", "Rust", "Steel"],
    "Pink": ["Rose", "Lavender", "Mauve"],
    "Off White": ["Cream", "White", "Beige"],
    "Maroon": ["Burgundy", "Rust", "Brown"],
    "Red": ["Maroon", "Rust", "Burgundy"],
    "Khaki": ["Olive", "Tan", "Brown"],
    "Orange": ["Mustard", "Rust", "Copper"],
    "Yellow": ["Mustard", "Gold", "Peach"],
    "Charcoal": ["Grey", "Black", "Steel"],
    "Gold": ["Mustard", "Bronze", "Copper"],
    "Steel": ["Silver", "Charcoal", "Grey"],
    "Tan": ["Beige", "Cream", "Brown"],
    "Multi": ["Depends on the dominant colors"],
    "Magenta": ["Purple", "Lavender", "Mauve"],
    "Lavender": ["Pink", "Peach", "Mauve"],
    "Sea Green": ["Teal", "Green", "Turquoise Blue"],
    "Cream": ["Beige", "Off White", "Nude"],
    "Peach": ["Orange", "Lavender", "Pink"],
    "Olive": ["Khaki", "Green", "Brown"],
    "Skin": ["Nude", "Beige", "Cream"],
    "Burgundy": ["Maroon", "Brown", "Rust"],
    "Coffee Brown": ["Brown", "Beige", "Burgundy"],
    "Grey Melange": ["Grey", "Silver", "Steel"],
    "Rust": ["Copper", "Orange", "Bronze"],
    "Rose": ["Pink", "Mauve", "Lavender"],
    "Lime Green": ["Fluorescent Green", "Yellow", "Sea Green"],
    "Mauve": ["Lavender", "Pink", "Peach"],
    "Turquoise Blue": ["Teal", "Sea Green", "Blue"],
    "Metallic": ["Depends on shade"],
    "Mustard": ["Gold", "Yellow", "Khaki"],
    "Taupe": ["Grey", "Charcoal", "Brown"],
    "Nude": ["Beige", "Skin", "Cream"],
    "Mushroom Brown": ["Beige", "Tan", "Brown"],
    "Fluorescent Green": ["Lime Green", "Sea Green", "Teal"],
}

NEUTRALS = {"Black", "White", "Beige", "Cream", "Off White", "Grey", "Charcoal", "Steel", "Taupe", "Mushroom Brown"}

def get_complementary(color, palette):
    """Return a complementary color from the palette."""
    complementary_colors = COMPLEMENTARY_MAP.get(color, [])
    valid_colors = [c for c in complementary_colors if c in palette]
    return random.choice(valid_colors) if valid_colors else None

def get_analogous(color, palette):
    """Return an analogous color from the palette."""
    analogous_colors = ANALOGOUS_MAP.get(color, [])
    valid_colors = [c for c in analogous_colors if c in palette]
    return random.choice(valid_colors) if valid_colors else None

def get_neutral(palette):
    """Return a neutral color from the palette."""
    valid_neutrals = [c for c in palette if c in NEUTRALS]
    return random.choice(valid_neutrals) if valid_neutrals else None

def get_image_url(item_id):
    """Get image URL for an item ID"""
    try:
        item_image = images[images['filename'] == f"{item_id}.jpg"].iloc[0]
        return item_image.link
    except:
        # Return a placeholder if image not found
        return "https://via.placeholder.com/200"

def generate_price():
    """Generate a random price for demonstration purposes"""
    return round(random.uniform(19.99, 79.99), 2)

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_outfits(request: RecommendationRequest):
    try:
        if data is None or images is None:
            raise HTTPException(status_code=500, detail="Data not loaded properly. Check server logs.")
            
        # Get recommended colors based on skin tone
        recommended_colors = SKIN_TONE_COLOR_MAPPING.get(request.skin_tone_hex, [])
        if not recommended_colors:
            recommended_colors = SKIN_TONE_COLOR_MAPPING["#422811"]  # Default if tone not found
        
        # Filter items based on gender and recommended colors
        filtered_data = data[data['gender'] == request.gender]
        filtered_data = filtered_data[filtered_data['baseColour'].isin(recommended_colors)]
        
        # Filter by category and usage
        topwear = filtered_data[filtered_data['subCategory'] == 'Topwear']
        topwear = topwear[topwear['usage'].isin(request.usage)]
        
        bottomwear = filtered_data[filtered_data['subCategory'] == 'Bottomwear']
        bottomwear = bottomwear[bottomwear['usage'].isin(request.usage)]
        
        footwear = filtered_data[filtered_data['masterCategory'] == 'Footwear']
        
        # Further filter footwear if preference provided
        if request.footwear_preference and request.footwear_preference != "Any":
            footwear = footwear[footwear['articleType'] == request.footwear_preference]
        
        # Generate outfit combinations
        outfit_combinations = []
        outfit_id = 1
        
        # Ensure we have items in each category
        if len(topwear) < 1 or len(bottomwear) < 1 or len(footwear) < 1:
            raise HTTPException(status_code=404, detail="Not enough items found for the specified criteria")
        
        # Get sample of items (up to 10 of each)
        top_samples = topwear.sample(min(10, len(topwear)))
        bottom_samples = bottomwear.sample(min(10, len(bottomwear)))
        foot_samples = footwear.sample(min(10, len(footwear)))
        
        # Generate up to 10 unique combinations
        combinations = []
        for _ in range(10):
            top = top_samples.sample(1).iloc[0]
            bottom = bottom_samples.sample(1).iloc[0]
            foot = foot_samples.sample(1).iloc[0]
            
            # Create outfit
            outfit = Outfit(
                id=outfit_id,
                topwear=OutfitItem(
                    id=int(top.id),
                    type="Topwear",
                    display_name=top.productDisplayName,
                    color=top.baseColour,
                    image_url=get_image_url(top.id),
                    price=generate_price()
                ),
                bottomwear=OutfitItem(
                    id=int(bottom.id),
                    type="Bottomwear",
                    display_name=bottom.productDisplayName,
                    color=bottom.baseColour,
                    image_url=get_image_url(bottom.id),
                    price=generate_price()
                ),
                footwear=OutfitItem(
                    id=int(foot.id),
                    type="Footwear",
                    display_name=foot.productDisplayName,
                    color=foot.baseColour,
                    image_url=get_image_url(foot.id),
                    price=generate_price()
                )
            )
            
            combinations.append(outfit)
            outfit_id += 1
        
        return RecommendationResponse(outfits=combinations)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# For mock data testing
@router.get("/mock-recommend")
async def mock_recommend():
    """Endpoint to get mock recommendations"""
    request = RecommendationRequest(
        skin_tone_hex="#422811",
        gender="Women",
        usage=["Casual"],
        footwear_preference="Saree"  # Fixed typo
    )
    return await recommend_outfits(request)