import React from 'react';
import { BodyMeasurement } from '../services/api';

interface DisplayMeasurement {
    shoulderWidth: number;
    torsoLength: number;
    leftLegLength?: number;
    rightLegLength?: number;
    unit: string;
    sizeCategories?: {
        shoulder_size: string;
        torso_size: string;
        leg_size: string;
        overall_size: string;
    };
}

interface BodyFrame {
  hasPose: boolean;
  visualizationImage?: string;
  statusMessage?: string;
  measurementProgress?: number;
}

interface BodyMeasurementDisplayProps {
    processedFrame: BodyFrame | null;
    measurements: DisplayMeasurement | null;
}

// Helper function to convert from API response format to display format
export const convertApiToDisplayFormat = (apiMeasurement: BodyMeasurement): DisplayMeasurement => {
  return {
    shoulderWidth: apiMeasurement.shoulder_width,
    torsoLength: apiMeasurement.torso_length,
    leftLegLength: apiMeasurement.left_leg_length,
    rightLegLength: apiMeasurement.right_leg_length,
    unit: apiMeasurement.unit,
    sizeCategories: apiMeasurement.size_categories
  };
};

const BodyMeasurementDisplay: React.FC<BodyMeasurementDisplayProps> = ({ 
  processedFrame,
  measurements
}) => {
  // If no processed frame and no measurements, show instruction
  if (!processedFrame && !measurements) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-3 bg-blue-600 text-white font-medium">
            Body Measurement Visualization
          </div>
          <div className="bg-gray-100 p-8 flex items-center justify-center h-96">
            <p className="text-gray-500 text-center">
              No body measurements available yet. Please follow the instructions to start the process.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If we have measurements, show the results
  if (measurements) {
    // Get the unit from measurements
    const unit = measurements.unit || 'cm';
    
    // Get clothing size recommendations from the backend if available
    const sizeCategories = measurements.sizeCategories;
    
    return (
      <div className="flex flex-col space-y-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-3 bg-blue-600 text-white font-medium">
            Your Body Measurements
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Measurements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Measurements</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">Shoulder Width:</span>
                      <span className="text-lg">{measurements.shoulderWidth.toFixed(1)} {unit}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium">Torso Length:</span>
                      <span className="text-lg">{measurements.torsoLength.toFixed(1)} {unit}</span>
                    </div>
                    
                    {measurements.leftLegLength && (
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-medium">Left Leg Length:</span>
                        <span className="text-lg">{measurements.leftLegLength.toFixed(1)} {unit}</span>
                      </div>
                    )}
                    
                    {measurements.rightLegLength && (
                      <div className="flex items-center justify-between pb-2">
                        <span className="font-medium">Right Leg Length:</span>
                        <span className="text-lg">{measurements.rightLegLength.toFixed(1)} {unit}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {sizeCategories && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Clothing Size Recommendations</h3>
                    <p className="text-sm text-gray-600 mb-3">Based on your measurements, here are estimated sizes:</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Overall Size</h4>
                        <p className="text-lg font-bold">{sizeCategories.overall_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Shirt/Jacket</h4>
                        <p className="text-lg font-bold">{sizeCategories.shoulder_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Tops</h4>
                        <p className="text-lg font-bold">{sizeCategories.torso_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Pants</h4>
                        <p className="text-lg font-bold">{sizeCategories.leg_size}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right side - Visualization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Body Visualization</h3>
                
                {processedFrame?.visualizationImage ? (
                  <img 
                    src={processedFrame.visualizationImage} 
                    alt="Body Measurement Visualization" 
                    className="w-full rounded-lg shadow-md"
                  />
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-64">
                    <p className="text-gray-500">Visualization not available</p>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Measurement Notes</h3>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Measurements taken at 2m distance from camera</li>
                    <li>Results are estimates and may vary by ±2cm</li>
                    <li>Clothing size recommendations are approximate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have processed frame but no measurements yet, show the visualization and progress
  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 bg-blue-600 text-white font-medium">
          Body Position Visualization
          {processedFrame?.measurementProgress !== undefined && (
            <span className="float-right text-sm font-normal">
              Progress: {processedFrame.measurementProgress}%
            </span>
          )}
        </div>
        <div className="p-4 flex items-center justify-center">
          {processedFrame?.visualizationImage ? (
            <img 
              src={processedFrame.visualizationImage} 
              alt="Body Position" 
              className="max-w-full rounded"
            />
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-96">
              <p className="text-gray-500">
                {processedFrame?.hasPose 
                  ? "Body detected. Processing visualization..."
                  : "No body detected. Please ensure your full body is visible in the camera."}
              </p>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        {processedFrame?.measurementProgress !== undefined && (
          <div className="px-4 pb-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${processedFrame.measurementProgress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="p-4 bg-blue-50">
          <h3 className="font-medium mb-2">Instructions:</h3>
          {processedFrame?.statusMessage ? (
            <p className="text-gray-600">{processedFrame.statusMessage}</p>
          ) : (
            <p className="text-gray-600">
              Please stand still facing the camera for 5 seconds. Keep your arms slightly away from your body for accurate shoulder width measurement.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyMeasurementDisplay;