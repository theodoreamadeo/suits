import { ProcessedFrame } from "../types";

export interface MeasurementResult  {
    shoulderWidth: number;
    torsoLength: number;
    legLength: number;
    totalHeight: number;
    scaleFactor: number;
}

export interface CalibrationData {
  userHeight: number;  // User's actual height in cm
  shoulderWidth: number;  // User's actual shoulder width in cm
  cameraDistance: number;  // Distance from camera in meters
}

export const processFrame = async (frameData: string): Promise<ProcessedFrame> => {
    try {
        const response = await fetch (`http://localhost:8000/api/process-frame`, {
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
        console.error ("Error processing frame:", error);
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
    formData.append ('image_file', imageFile);
    formData.append ('image_type', 'color');

    const response = await fetch (`http://localhost:8000/api/analyze-skin-tone`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error (`HTTP error! Status: ${response.status}`);
    }
    return await response.json ();
  } catch (error) {
    console.error ("Error analyzing skin tone:", error);
    throw error;
  }
};

export const startCalibration = async (data: CalibrationData): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Calibration data:', data);
    
    const response = await fetch(`http://localhost:8000/api/body-measurement/calibrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calibration failed:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting calibration:', error);
    throw error;
  }
};


export const processBodyFrame = async (frameData: string): Promise<any> => {
  try {
    // Ensujre frameData is a valid base64 string
    if (!frameData.startsWith('data:image')) {
      console.warn ('Frame data does not have the expected format. Adfding prefix.');
      frameData = `data:image/jpeg;base64,${frameData}`;
    }
    
    const response = await fetch (`http://localhost:8000/api/body-measurement/process-body-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify ({ frame: frameData }),
    });

    if (!response.ok) {
      const errorText = await response.text ();
      console.error ('Process body frame error:', response.status, errorText);
      throw new Error (`HTTP error! Status: ${response.status}. Details: ${errorText}`);
    }

    return await response.json ();
  } catch (error) {
    console.error ("Error processing body frame:", error);
    return {
      hasPose: false,
      error: 'Failed to process body frame',
    };
  }
};