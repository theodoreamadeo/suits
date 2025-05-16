from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
import pandas as pd
import random
import os
import traceback
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s %(message)s')

router = APIRouter()

# Models
class RecommendationRequest(BaseModel):
    skin_tone_hex: str
    gender: str
    usage: List[str]
    footwear_preference: str

class OutfitItem(BaseModel):
    id: int
    type: str
    display_name: str
    color: str
    image_url: str
    price: float

class Outfit(BaseModel):
    id: int
    topwear: OutfitItem
    bottomwear: OutfitItem
    footwear: OutfitItem

class RecommendationResponse(BaseModel):
    outfits: List[Outfit]

# Data loading
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(BASE_DIR, "styles.csv")
image_path = os.path.join(BASE_DIR, "images.csv")

logging.info(f"Loading styles from: {data_path}")
logging.info(f"Loading images from: {image_path}")
logging.info(f"Styles CSV exists: {os.path.exists(data_path)}")
logging.info(f"Images CSV exists: {os.path.exists(image_path)}")

def load_data():
    try:
        data = pd.read_csv(data_path, on_bad_lines="skip")
        images = pd.read_csv(image_path, on_bad_lines="skip")
        data = data.dropna(subset=["baseColour", "season", "usage", "productDisplayName"])
        logging.debug(f"[DEBUG] Data loaded: {len(data)} rows, Images loaded: {len(images)} rows")
        return data, images
    except Exception as e:
        logging.error(f"[ERROR] Failed to load data: {e}")
        return None, None

data, images = load_data()

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

def get_image_url(item_id):
    try:
        item_image = images[images['filename'] == f"{item_id}.jpg"].iloc[0]
        return item_image.link
    except Exception as e:
        logging.debug(f"[DEBUG] Image not found for {item_id}: {e}")
        return "https://via.placeholder.com/200"

def generate_price():
    return round(random.uniform(19.99, 79.99), 2)

@router.get("/recommend", response_model=RecommendationResponse)
async def recommend_outfits(
    skin_tone_hex: str = Query(...),
    gender: str = Query(...),
    usage: str = Query(..., description="Comma-separated usage values, e.g. 'casual,formal'"),
    footwear_preference: str = Query(...)
):
    try:
        if data is None or images is None:
            logging.error(f"[DEBUG] Data or images not loaded. data is None: {data is None}, images is None: {images is None}")
            raise HTTPException(status_code=500, detail="Data not loaded properly. Check server logs.")

        # Convert usage string to list
        usage_list = [u.strip() for u in usage.split(",") if u.strip()]
        logging.info(f"[DEBUG] Received request: skin_tone_hex={skin_tone_hex}, gender={gender}, usage={usage_list}, footwear_preference={footwear_preference}")
        recommended_colors = SKIN_TONE_COLOR_MAPPING.get(skin_tone_hex, [])
        if not recommended_colors:
            recommended_colors = SKIN_TONE_COLOR_MAPPING["#422811"]
        logging.debug(f"[DEBUG] Recommended colors: {recommended_colors}")

        filtered_data = data[data['gender'] == gender]
        filtered_data = filtered_data[filtered_data['baseColour'].isin(recommended_colors)]
        logging.debug(f"[DEBUG] Filtered data by gender and color: {len(filtered_data)} rows")

        topwear = filtered_data[filtered_data['subCategory'] == 'Topwear']
        topwear = topwear[topwear['usage'].isin(usage_list)]
        logging.debug(f"[DEBUG] Topwear count: {len(topwear)}")

        bottomwear = filtered_data[filtered_data['subCategory'] == 'Bottomwear']
        bottomwear = bottomwear[bottomwear['usage'].isin(usage_list)]
        logging.debug(f"[DEBUG] Bottomwear count: {len(bottomwear)}")

        footwear = filtered_data[filtered_data['masterCategory'] == 'Footwear']
        if footwear_preference and footwear_preference != "Any":
            footwear = footwear[footwear['articleType'] == footwear_preference]
        logging.debug(f"[DEBUG] Footwear count: {len(footwear)}")

        if len(topwear) < 1 or len(bottomwear) < 1 or len(footwear) < 1:
            logging.warning(f"[DEBUG] Not enough items: topwear={len(topwear)}, bottomwear={len(bottomwear)}, footwear={len(footwear)}")
            raise HTTPException(status_code=404, detail="Not enough items found for the specified criteria")

        top_samples = topwear.sample(min(3, len(topwear)))
        bottom_samples = bottomwear.sample(min(3, len(bottomwear)))
        foot_samples = footwear.sample(min(3, len(footwear)))

        combinations = []
        outfit_id = 1
        for _ in range(3):
            top = top_samples.sample(1).iloc[0]
            bottom = bottom_samples.sample(1).iloc[0]
            foot = foot_samples.sample(1).iloc[0]
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
        logging.info(f"[DEBUG] Returning {len(combinations)} outfit combinations")
        return RecommendationResponse(outfits=combinations)
    except Exception as e:
        logging.error("[ERROR] Exception in recommend_outfits:")
        traceback.print_exc()
        if data is None or images is None:
            raise HTTPException(status_code=500, detail="Data not loaded properly. Check server logs.")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")
