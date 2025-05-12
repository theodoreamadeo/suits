import React from 'react';
import { BodyFrame } from '../types';

interface BodyMeasurement {
    shoulderWidth: number;
    torsoLength: number;
    legLength: number;
    totalHeight: number;
    scaleFactor: number;
}

interface BodyMeasurementResultProps {
    processedFrame: BodyFrame | null;
    measurements: BodyMeasurement | null;
    onNewMeasurement: () => void;
    onSaveResults: (measurements: BodyMeasurement) => void;
}

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

  // Calculate clothing sizes based on measurements
  const getShirtSize = (shoulderWidth: number): string => {
    if (shoulderWidth < 38) return 'Small';
    if (shoulderWidth < 43) return 'Medium';
    if (shoulderWidth < 48) return 'Large';
    return 'X-Large';
  };

  const getPantsSize = (totalHeight: number, legLength: number): string => {
    // Waist estimate based on height (very approximate)
    let waist = 30;
    if (totalHeight < 165) waist = 28;
    if (totalHeight > 185) waist = 34;
    
    // Inseam from leg length (approximate)
    const inseam = Math.round(legLength * 0.4);
    
    return `${waist} × ${inseam}`;
  };

  const getJacketSize = (shoulderWidth: number, torsoLength: number): string => {
    if (shoulderWidth < 38) return 'Small';
    if (shoulderWidth < 43) return 'Medium';
    if (shoulderWidth < 48) return 'Large';
    return 'X-Large';
  };

  const getSuitSize = (shoulderWidth: number, totalHeight: number): string => {
    let chestSize = 36;
    if (shoulderWidth < 38) chestSize = 38;
    if (shoulderWidth < 43) chestSize = 40;
    if (shoulderWidth < 48) chestSize = 42;
    if (shoulderWidth >= 48) chestSize = 44;
    
    let length = 'R'; // Regular
    if (totalHeight < 170) length = 'S'; // Short
    if (totalHeight > 185) length = 'L'; // Long
    
    return `${chestSize}${length}`;
  };

  const handleSaveResults = () => {
    if (measurements) {
      onSaveResults(measurements);
    }
  };

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
                    <span className="text-lg">{measurements.shoulderWidth.toFixed(1)} cm</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">Torso Length:</span>
                    <span className="text-lg">{measurements.torsoLength.toFixed(1)} cm</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">Leg Length:</span>
                    <span className="text-lg">{measurements.legLength.toFixed(1)} cm</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold">Total Height:</span>
                    <span className="text-xl font-bold text-blue-700">{measurements.totalHeight.toFixed(1)} cm</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Clothing Size Recommendations</h3>
                <p className="text-sm text-gray-600 mb-3">Based on your measurements, here are estimated sizes:</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="font-medium text-gray-800">Shirt</h4>
                    <p className="text-lg font-bold">{getShirtSize(measurements.shoulderWidth)}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="font-medium text-gray-800">Pants</h4>
                    <p className="text-lg font-bold">{getPantsSize(measurements.totalHeight, measurements.legLength)}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="font-medium text-gray-800">Jacket</h4>
                    <p className="text-lg font-bold">{getJacketSize(measurements.shoulderWidth, measurements.torsoLength)}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <h4 className="font-medium text-gray-800">Suit</h4>
                    <p className="text-lg font-bold">{getSuitSize(measurements.shoulderWidth, measurements.totalHeight)}</p>
                  </div>
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
                  <li>Calibration scale: {measurements.scaleFactor.toFixed(4)} cm/pixel</li>
                  <li>Results are estimates and may vary by ±2cm</li>
                  <li>Clothing size recommendations are approximate</li>
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

export default BodyMeasurementResult;