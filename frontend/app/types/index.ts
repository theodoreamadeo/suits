export interface Point {
    x: number;
    y: number;
}

export interface FaceLandmark {
    landmark: Point[];
}

export interface ProcessedFrame {
    meshVisualization: string;
    segmentedFace: string;
    hasFace: boolean;
    fps:number;
}

export interface BodyFrame {
    hasPose: boolean;
    visualizationImage?: string;
    measurements ?: {
        shoulderWidth: number;
        torsoLength: number;
        legLength: number;
        totalHeight: number;
        scaleFactor: number;
    };
    calibrationStatus ?: {
        samples: number;
        required: number;
        isCalibrated: boolean;
    };
    calibrationData ?: {
        userHeight: number;
        shoulderWidth: number;
        cameraDistance: number;
    }
}

export interface MeasurementResultExport {
    timestamp: string;
    userInfo: {
        providedHeight: number;
        providedShoulderWidth: number;
    };
    measurements: {
        shoulderWidth: number;
        torsoLength: number;
        legLength: number;
        totalHeight: number;
        scaleFactor: number;
    };
}

export interface OutfitItem {
  id: number;
  type: string;
  display_name: string;
  color: string;
  image_url: string;
  price: number;
}

export interface Outfit {
  id: number;
  topwear: OutfitItem;
  bottomwear: OutfitItem;
  footwear: OutfitItem;
}

export interface RecommendationResponse {
  outfits: Outfit[];
}

export interface RecommendationRequest {
  skin_tone_hex: string;
  gender: string;
  usage: string[];
  footwear_preference: string;
}

export interface SkinTone {
  id: string;
  hex: string;
  name: string;
}

export interface SelectOption {
  value: string;
  label: string;
}