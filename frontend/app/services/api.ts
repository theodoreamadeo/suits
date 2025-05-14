import { ProcessedFrame, RecommendationRequest, RecommendationResponse } from "../types";

// Define types for the body measurement responses
export interface BodyMeasurement {
  shoulder_width: number;
  torso_length: number;
  left_leg_length: number;
  right_leg_length: number;
  unit: string;
  timestamp: number;
  size_categories?: {
    shoulder_size: string;
    torso_size: string;
    leg_size: string;
    overall_size: string;
  };
  visualization_image?: string;
}

export interface ScaleFactorData {
  scale_factor: number;  // Scale factor in cm/px
}

export interface MeasurementSaveData extends BodyMeasurement {
  notes?: string;
}

// Original functions

export const processFrame = async (frameData: string): Promise<ProcessedFrame> => {
    try {
        const response = await fetch(`http://localhost:8000/api/process-frame`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ frame: frameData }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error processing frame:", error);
        return {
            meshVisualization: "",
            segmentedFace: "",
            hasFace: false,
            fps: 0,
        };
    }
};

export const analyzeSkinToneUpload = async (imageFile: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('image_type', 'color');

    const response = await fetch(`http://localhost:8000/api/analyze-skin-tone`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error analyzing skin tone:", error);
    throw error;
  }
};

export async function getOutfitRecommendations(
  preferences: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`http://localhost:8000/api/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching outfit recommendations:', error);
    // Return mock data in case of error (for development)
    return getMockRecommendations();
  }
}

/**
 * Fetches mock outfit recommendations (for testing)
 */
export async function getMockRecommendations(): Promise<RecommendationResponse> {
  try {
    const response = await fetch(`http://localhost:8000/api/mock-recommend`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching mock recommendations:', error);
    
    // Fallback mock data if API is unavailable
    return {
      outfits: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        topwear: {
          id: 100 + i,
          type: 'Topwear',
          display_name: `Mock Topwear ${i + 1}`,
          color: 'Navy Blue',
          image_url: 'https://via.placeholder.com/150',
          price: 9.99 + i
        },
        bottomwear: {
          id: 200 + i,
          type: 'Bottomwear',
          display_name: `Mock Bottomwear ${i + 1}`,
          color: 'Grey',
          image_url: 'https://via.placeholder.com/150',
          price: 19.99 + i
        },
        footwear: {
          id: 300 + i,
          type: 'Footwear',
          display_name: `Mock Footwear ${i + 1}`,
          color: 'Brown',
          image_url: 'https://via.placeholder.com/150',
          price: 29.99 + i
        }
      }))
    };
  }
}

export const processBodyFrame = async (frameData: string): Promise<BodyMeasurement | { message: string }> => {
  try {
    // Ensure frameData is a valid base64 string
    if (!frameData.startsWith('data:image')) {
      console.warn('Frame data does not have the expected format. Adding prefix.');
      frameData = `data:image/jpeg;base64,${frameData}`;
    }
    
    const response = await fetch(`http://localhost:8000/api/body-measurement/process-body-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frame: frameData }),
    });

    // Special handling for 202 status (pose not stable yet)
    if (response.status === 202) {
      const data = await response.json();
      return { message: data.message || "Pose not stable yet" };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Process body frame error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
    }

    const measurements = await response.json();
    return measurements as BodyMeasurement;
  } catch (error) {
    console.error("Error processing body frame:", error);
    return {
      message: error instanceof Error ? error.message : 'Failed to process body frame',
    };
  }
};

export const getLatestMeasurements = async (): Promise<BodyMeasurement | { message: string }> => {
  try {
    const response = await fetch(`http://localhost:8000/api/body-measurement/latest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return { message: "No measurements available" };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get latest measurements error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting latest measurements:", error);
    return {
      message: error instanceof Error ? error.message : 'Failed to get measurements',
    };
  }
};

export const saveMeasurement = async (data: MeasurementSaveData): Promise<{ success: boolean; message: string; filename: string }> => {
  try {
    const response = await fetch(`http://localhost:8000/api/body-measurement/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save measurement error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving measurement:", error);
    throw error;
  }
};

// Helper function to convert from snake_case to camelCase if needed for frontend
export const convertMeasurementToCamelCase = (measurement: BodyMeasurement): any => {
  const {
    shoulder_width,
    torso_length,
    left_leg_length,
    right_leg_length,
    unit,
    timestamp,
    size_categories,
    visualization_image,
    ...rest
  } = measurement;

  let camelCaseCategories = undefined;
  if (size_categories) {
    camelCaseCategories = {
      shoulderSize: size_categories.shoulder_size,
      torsoSize: size_categories.torso_size,
      legSize: size_categories.leg_size,
      overallSize: size_categories.overall_size,
    };
  }

  return {
    shoulderWidth: shoulder_width,
    torsoLength: torso_length,
    leftLegLength: left_leg_length,
    rightLegLength: right_leg_length,
    unit,
    timestamp,
    sizeCategories: camelCaseCategories,
    visualizationImage: visualization_image,
    ...rest
  };
};