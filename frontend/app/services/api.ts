import { ProcessedFrame } from "../types";

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