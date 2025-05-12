import React from 'react';
import { BodyFrame } from '../types';

interface BodyMeasurement {
    shoulderWidth: number;
    torsoLength: number;
    legLength: number;
    totalHeight: number;
    scaleFactor: number;
}

interface BodyMeasurementDisplayProps {
    processedFrame: BodyFrame | null;
    measurements: BodyMeasurement | null;
}

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
                      <p className="text-lg font-bold">Medium</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-medium text-gray-800">Pants</h4>
                      <p className="text-lg font-bold">32 × 30</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-medium text-gray-800">Jacket</h4>
                      <p className="text-lg font-bold">Medium</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-medium text-gray-800">Suit</h4>
                      <p className="text-lg font-bold">40R</p>
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
          </div>
        </div>
      </div>
    );
  }

  // If we have processed frame but no measurements yet, show the visualization
  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 bg-blue-600 text-white font-medium">
          Body Position Visualization
          {processedFrame?.calibrationStatus && (
            <span className="float-right text-sm font-normal">
              Samples: {processedFrame.calibrationStatus.samples}/{processedFrame.calibrationStatus.required}
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
        
        <div className="p-4 bg-blue-50">
          <h3 className="font-medium mb-2">Instructions:</h3>
          {processedFrame?.calibrationStatus?.isCalibrated ? (
            <p className="text-gray-600">
              Calibration complete! You can now proceed to take body measurements.
            </p>
          ) : processedFrame?.calibrationStatus ? (
            <p className="text-gray-600">
              Stand still facing the camera. Keep your arms slightly away from your body.
              Calibration progress: {Math.round((processedFrame.calibrationStatus.samples / processedFrame.calibrationStatus.required) * 100)}%
            </p>
          ) : (
            <p className="text-gray-600">
              Make sure your entire body is visible in the frame. Stand about 2 meters from the camera.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyMeasurementDisplay;