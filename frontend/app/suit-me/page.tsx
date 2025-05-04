'use client';

import { useState, useCallback } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import FaceMeshDisplay from '../components/FaceMeshDisplay';
import { ProcessedFrame } from '../types';

export default function Home() {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [processedFrame, setProcessedFrame] = useState<ProcessedFrame | null>(null);
  const [error, setError] = useState<string>('');

  const handleFrameProcessed = useCallback((frame: ProcessedFrame) => {
    setProcessedFrame(frame);
  }, []);

  const toggleCapture = () => {
    setIsCapturing(prev => !prev);
    if (!isCapturing) {
      // Reset previous results when starting capture
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">Face Mesh Visualization</h1>
          <p className="text-gray-600">Capture and visualize your face in real-time</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              
              <div className="space-y-4">
                <button
                  onClick={toggleCapture}
                  className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isCapturing
                      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                      : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                  }`}
                >
                  {isCapturing ? 'Stop Capture' : 'Start Capture'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Click "Start Capture" to enable your webcam</li>
                  <li>Position your face in frame until detected</li>
                  <li>The face mesh will appear in real-time</li>
                </ol>
              </div>
            </div>
            
            <WebcamCapture 
              onFrameProcessed={handleFrameProcessed} 
              isCapturing={isCapturing} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <FaceMeshDisplay processedFrame={processedFrame} />
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Face Mesh Visualization App © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}