import React from 'react';
import { ProcessedFrame } from '../types';

interface FaceMeshDisplayProps {
    processedFrame: ProcessedFrame | null;
}

const FaceMeshDisplay: React.FC <FaceMeshDisplayProps> = ({ processedFrame }) => {
    if (!processedFrame || !processedFrame.hasFace) {
        return (
            <div className= "flex flex-col space-y-4">
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-96">
                    <p className="text-gray-500 text-center">
                        No face detected. Please ensure your face is visible in the camera view.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 bg-indigo-600 text-white font-medium">
                Face Mesh
                {processedFrame.fps && (
                  <span className="float-right text-sm font-normal">
                    {processedFrame.fps.toFixed(1)} FPS
                  </span>
                )}
              </div>
              <div className="p-4 flex items-center justify-center">
                {processedFrame.meshVisualization ? (
                  <img 
                    src={processedFrame.meshVisualization} 
                    alt="Face Mesh" 
                    className="max-w-full rounded"
                  />
                ) : (
                  <p className="text-gray-500">No mesh visualization available</p>
                )}
              </div>
            </div>
    
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 bg-indigo-600 text-white font-medium">
                Segmented Face
              </div>
              <div className="p-4 flex items-center justify-center">
                {processedFrame.segmentedFace ? (
                  <img 
                    src={processedFrame.segmentedFace} 
                    alt="Segmented Face" 
                    className="max-w-full rounded"
                  />
                ) : (
                  <p className="text-gray-500">No segmented face available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ); 
};

export default FaceMeshDisplay;