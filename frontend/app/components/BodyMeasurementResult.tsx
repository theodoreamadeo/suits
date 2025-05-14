import React from 'react';
import { BodyMeasurement } from '../services/api';

// This interface represents the format expected by our result component
interface DisplayMeasurement {
    shoulderWidth: number;
    torsoLength: number;
    leftLegLength?: number;
    rightLegLength?: number;
    unit: string;
    timestamp?: number;
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

interface BodyMeasurementResultProps {
    processedFrame: BodyFrame | null;
    measurements: DisplayMeasurement | null;
    onNewMeasurement: () => void;
    onSaveResults: (measurements: DisplayMeasurement) => void;
}

// Helper function to convert API response to display format
export const convertApiToDisplayFormat = (apiMeasurement: BodyMeasurement): DisplayMeasurement => {
  return {
    shoulderWidth: apiMeasurement.shoulder_width,
    torsoLength: apiMeasurement.torso_length,
    leftLegLength: apiMeasurement.left_leg_length,
    rightLegLength: apiMeasurement.right_leg_length,
    unit: apiMeasurement.unit,
    timestamp: apiMeasurement.timestamp,
    sizeCategories: apiMeasurement.size_categories
  };
};

const BodyMeasurementResult: React.FC<BodyMeasurementResultProps> = ({
  measurements,
  processedFrame,
  onNewMeasurement,
  onSaveResults
}) => {
  // If no measurements available, show appropriate message
  if (!measurements) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 bg-blue-600 text-white font-medium">
          Measurement Results
        </div>
        <div className="bg-gray-100 p-8 flex items-center justify-center h-96">
          <p className="text-gray-500 text-center">
            No measurements available yet. Please complete the measurement process.
          </p>
        </div>
      </div>
    );
  }

  // Get the unit from measurements
  const unit = measurements.unit || 'cm';

  // Fallback size calculation functions if sizeCategories not provided
  const getShirtSize = (shoulderWidth: number): string => {
    if (shoulderWidth < 38) return 'XS';
    if (shoulderWidth < 40) return 'S';
    if (shoulderWidth < 42) return 'M';
    if (shoulderWidth < 44) return 'L';
    if (shoulderWidth < 46) return 'XL';
    if (shoulderWidth < 48) return 'XXL';
    return 'XXXL';
  };

  const getLegSize = (legLength: number): string => {
    if (legLength < 70) return 'XS';
    if (legLength < 75) return 'S';
    if (legLength < 80) return 'M';
    if (legLength < 85) return 'L';
    if (legLength < 90) return 'XL';
    if (legLength < 95) return 'XXL';
    return 'XXXL';
  };

  const getTorsoSize = (torsoLength: number): string => {
    if (torsoLength < 40) return 'XS';
    if (torsoLength < 45) return 'S';
    if (torsoLength < 50) return 'M';
    if (torsoLength < 55) return 'L';
    if (torsoLength < 60) return 'XL';
    if (torsoLength < 65) return 'XXL';
    return 'XXXL';
  };

  const handleSaveResults = () => {
    if (measurements) {
      onSaveResults(measurements);
    }
  };

  // Calculate average leg length for display
  const displayLegLength = measurements.leftLegLength && measurements.rightLegLength ? 
    ((measurements.leftLegLength + measurements.rightLegLength) / 2) : 
    (measurements.leftLegLength || measurements.rightLegLength || 0);

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 bg-green-600 text-white font-medium flex justify-between items-center">
          <span>Your Body Measurements</span>
          <span className="text-sm bg-white text-green-600 px-2 py-1 rounded">Complete</span>
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
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Clothing Size Recommendations</h3>
                <p className="text-sm text-gray-600 mb-3">Based on your measurements, here are estimated sizes:</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {measurements.sizeCategories ? (
                    <>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Overall Size</h4>
                        <p className="text-lg font-bold">{measurements.sizeCategories.overall_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Shirt/Jacket</h4>
                        <p className="text-lg font-bold">{measurements.sizeCategories.shoulder_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Tops</h4>
                        <p className="text-lg font-bold">{measurements.sizeCategories.torso_size}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Pants</h4>
                        <p className="text-lg font-bold">{measurements.sizeCategories.leg_size}</p>
                      </div>
                    </>
                  ) : (
                    // Fallback size recommendations if not provided by backend
                    <>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Overall Size</h4>
                        <p className="text-lg font-bold">
                          {calculateOverallSize(
                            getShirtSize(measurements.shoulderWidth),
                            getTorsoSize(measurements.torsoLength),
                            getLegSize(displayLegLength)
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Shirt/Jacket</h4>
                        <p className="text-lg font-bold">{getShirtSize(measurements.shoulderWidth)}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Tops</h4>
                        <p className="text-lg font-bold">{getTorsoSize(measurements.torsoLength)}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm">
                        <h4 className="font-medium text-gray-800">Pants</h4>
                        <p className="text-lg font-bold">{getLegSize(displayLegLength)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                  {measurements.timestamp && (
                    <li>Measured on: {new Date(measurements.timestamp * 1000).toLocaleString()}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={onNewMeasurement}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Take New Measurement
            </button>
            
            <button
              onClick={handleSaveResults}
              className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Save Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate overall size based on all measurements
// This matches the logic from the Python file
const calculateOverallSize = (shoulderSize: string, torsoSize: string, legSize: string): string => {
  // Size values mapping as in the Python code
  const sizeValues: {[key: string]: number} = {
    "XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "XXL": 6, "XXXL": 7, "Unknown": 0
  };
  
  const validSizes = [shoulderSize, torsoSize, legSize].filter(size => size !== "Unknown");
  
  if (validSizes.length === 0) {
    return "Unknown";
  }
  
  // Convert sizes to numeric values
  const sizeNums = validSizes.map(size => sizeValues[size]);
  
  // Calculate average size value
  const avgSizeNum = sizeNums.reduce((acc, val) => acc + val, 0) / sizeNums.length;
  
  // Reverse the size values mapping
  const sizeValuesReversed: {[key: number]: string} = {};
  Object.entries(sizeValues).forEach(([key, value]) => {
    sizeValuesReversed[value] = key;
  });
  
  // Find closest size
  const validSizeValues = Object.values(sizeValues).filter(val => val > 0);
  const closestSizeNum = validSizeValues.reduce((prev, curr) => 
    Math.abs(curr - avgSizeNum) < Math.abs(prev - avgSizeNum) ? curr : prev
  );
  
  return sizeValuesReversed[closestSizeNum];
};

export default BodyMeasurementResult;