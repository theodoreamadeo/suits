'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { processBodyFrame, saveMeasurement } from '../services/api';
import BodyMeasurementDisplay from '../components/BodyMeasurementDisplay';
import BodyMeasurementResult, { convertApiToDisplayFormat } from '../components/BodyMeasurementResult';
import WebcamCaptureForBodyMeasurement from '../components/WebcamCaptureForBodyMeasurement';
import { BodyFrame } from '../types';

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

export default function BodyMeasurement() {
  // Default values for measurements - used for fallback
  const defaultHeight = '170';
  const defaultShoulderWidth = '40.5';
  
  // Main state variables
  const [isCapturing, setIsCapturing] = useState<boolean>(false); // Start with camera off by default
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [processedFrame, setProcessedFrame] = useState<BodyFrame | null>(null);
  const [measurements, setMeasurements] = useState<DisplayMeasurement | null>(null);
  const [error, setError] = useState<string>('');
  const [measurementProgress, setMeasurementProgress] = useState<number>(0);
  const [measurementComplete, setMeasurementComplete] = useState<boolean>(false);
  const measurementDurationMs = 5000; // 5 seconds for measurement
  const measurementStartTimeRef = useRef<number>(0);
  
  const handleFrameProcessed = useCallback((frame: any) => {
    console.log('Frame processed:', frame);
    setProcessedFrame(frame);
    
    // Update measurement progress if available
    if (frame.measurementProgress !== undefined) {
      setMeasurementProgress(frame.measurementProgress);
      
      // If measurement is complete, move to complete state
      if (frame.measurementProgress >= 100 && isMeasuring) {
        console.log("Measurement progress complete");
        setIsMeasuring(false);
        setMeasurementComplete(true);
      }
    }
    
    // Handle measurements from the updated API
    if ('message' in frame) {
      // This is a status update, not measurements
      console.log("Status update:", frame.message);
    } else if (frame.measurements) {
      // Using the old format
      console.log("Measurements received (old format):", frame.measurements);
      
      // Convert to our display format
      const displayMeasurements: DisplayMeasurement = {
        shoulderWidth: frame.measurements.shoulderWidth,
        torsoLength: frame.measurements.torsoLength,
        leftLegLength: frame.measurements.leftLegLength,
        rightLegLength: frame.measurements.rightLegLength,
        unit: 'cm',
      };
      
      // Always update measurements when they're available
      setMeasurements(displayMeasurements);
      
      // Only complete the process if we're actually in measuring state
      if (isMeasuring) {
        console.log("Completing measurement process");
        setIsMeasuring(false);
        setMeasurementComplete(true);
      }
    } else if (frame.shoulder_width) {
      // This is a direct measurement from the new API
      console.log("Measurements received (new API format):", frame);
      
      // Convert to our display format
      const displayMeasurements: DisplayMeasurement = {
        shoulderWidth: frame.shoulder_width,
        torsoLength: frame.torso_length,
        leftLegLength: frame.left_leg_length,
        rightLegLength: frame.right_leg_length,
        unit: frame.unit,
        sizeCategories: frame.size_categories,
        timestamp: frame.timestamp
      };
      
      // Always update measurements when they're available
      setMeasurements(displayMeasurements);
      
      // Only complete the process if we're actually in measuring state
      if (isMeasuring) {
        console.log("Completing measurement process");
        setIsMeasuring(false);
        setMeasurementComplete(true);
      }
    }
  }, [isMeasuring]);

  // Start the camera when the Start Capture button is clicked
  const startCapture = () => {
    console.log("Starting capture");
    setIsCapturing(true);
    setError('');
    setMeasurementProgress(0);
    setMeasurements(null);
    setMeasurementComplete(false);
  };

  const stopCapture = () => {
    setIsCapturing(false);
    setIsMeasuring(false);
  };

  const beginMeasurement = () => {
    setIsMeasuring(true);
    setMeasurementProgress(0);
    measurementStartTimeRef.current = Date.now();
    console.log("Beginning measurement process");
    
    // Add a safety timeout to prevent getting stuck in measuring state
    // If no measurement result is received within 10 seconds, use the latest processed frame
    const measurementTimeout = setTimeout(() => {
      if (isMeasuring) {
        console.log("Measurement timeout reached. Creating fallback measurements.");
        
        // Create fallback measurements based on defaults
        const fallbackMeasurements: DisplayMeasurement = {
          shoulderWidth: parseFloat(defaultShoulderWidth),
          torsoLength: parseFloat(defaultHeight) * 0.3, // Approximate torso as 30% of height
          leftLegLength: parseFloat(defaultHeight) * 0.45,  // Approximate legs as 45% of height
          rightLegLength: parseFloat(defaultHeight) * 0.45,  // Same for right leg
          unit: 'cm',
          timestamp: Date.now() / 1000
        };
        
        // Set the measurements and complete the process
        setMeasurements(fallbackMeasurements);
        setIsMeasuring(false);
        setMeasurementComplete(true);
      }
    }, 10000);
    
    // Clean up the timeout if measurement completes normally
    return () => clearTimeout(measurementTimeout);
  };

  // Update progress based on elapsed time
  useEffect(() => {
    if (isMeasuring) {
      const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - measurementStartTimeRef.current;
        const progress = Math.min(100, Math.floor((elapsedTime / measurementDurationMs) * 100));
        setMeasurementProgress(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      return () => clearInterval(progressInterval);
    }
  }, [isMeasuring]);

  const handleNewMeasurement = () => {
    setMeasurements(null);
    setMeasurementComplete(false);
    setIsCapturing(true);
    setMeasurementProgress(0);
    
    // Give a moment for the UI to update before starting measurement
    setTimeout(() => {
      beginMeasurement();
    }, 500);
  };

  const handleSaveResults = async (measurementsData: DisplayMeasurement) => {
    if (!measurementsData) return;
    
    try {
      // First, try to save to the backend if available
      try {
        // Convert DisplayMeasurement to the format expected by the API
        const apiMeasurementData = {
          shoulder_width: measurementsData.shoulderWidth,
          torso_length: measurementsData.torsoLength,
          left_leg_length: measurementsData.leftLegLength || 0,
          right_leg_length: measurementsData.rightLegLength || 0,
          unit: measurementsData.unit,
          timestamp: Date.now() / 1000,
          size_categories: measurementsData.sizeCategories,
          notes: `Default measurements used: Height: ${defaultHeight}cm, Shoulder width: ${defaultShoulderWidth}cm`
        };
        
        // Call the API to save measurements
        const saveResult = await saveMeasurement(apiMeasurementData);
        console.log("Measurements saved to backend:", saveResult);
      } catch (apiError) {
        console.warn("Could not save to backend API, falling back to download:", apiError);
      }
      
      // Always provide a download as a fallback
      // Create a more comprehensive results object
      const resultsData = {
        timestamp: new Date().toISOString(),
        userInfo: {
          providedHeight: parseFloat(defaultHeight),
          providedShoulderWidth: parseFloat(defaultShoulderWidth),
        },
        measurements: measurementsData,
        // You can add more metadata here if needed
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(resultsData, null, 2);
      
      // Create a blob with the data
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `body-measurements-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving measurements:", error);
      setError("Failed to save measurements. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Body Measurement System</h1>
          <p className="text-gray-600">Accurately measure your body dimensions using computer vision</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              
              <div className="space-y-4">
                {!isCapturing ? (
                  <button
                    onClick={startCapture}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Start Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopCapture}
                      className="w-full py-2 px-4 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Stop Capture
                    </button>
                    
                    {!isMeasuring && !measurements && !measurementComplete && (
                      <button
                        onClick={beginMeasurement}
                        className="w-full py-2 px-4 rounded-md font-medium bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Start Measurement
                      </button>
                    )}
                    
                    {isMeasuring && (
                      <div className="space-y-3">
                        <div className="w-full py-2 px-4 rounded-md font-medium bg-gray-200 text-gray-700">
                          Measuring... Please stand still.
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${measurementProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                          {measurementProgress}% complete
                        </div>
                        
                        {/* Debug option to force completing measurement */}
                        <button
                          onClick={() => {
                            console.log("Forcing measurement completion");
                            // Create default measurements if none available
                            if (!measurements) {
                              const fallbackMeasurements: DisplayMeasurement = {
                                shoulderWidth: parseFloat(defaultShoulderWidth),
                                torsoLength: parseFloat(defaultHeight) * 0.3,
                                leftLegLength: parseFloat(defaultHeight) * 0.45,
                                rightLegLength: parseFloat(defaultHeight) * 0.45,
                                unit: 'cm'
                              };
                              setMeasurements(fallbackMeasurements);
                            }
                            
                            // Complete the measurement process
                            setIsMeasuring(false);
                            setMeasurementComplete(true);
                          }}
                          className="w-full py-1 px-2 text-sm rounded-md font-medium bg-yellow-600 hover:bg-yellow-700 text-white focus:outline-none"
                        >
                          Force Complete (Debug)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  {!isCapturing && (
                    <>
                      <li>Click "Start Camera" to activate your webcam</li>
                      <li>Position yourself about 2 meters from the camera</li>
                      <li>Make sure your full body is visible in the frame</li>
                    </>
                  )}
                  {isCapturing && isMeasuring && (
                    <>
                      <li className="font-semibold">Stand with arms slightly away from your body</li>
                      <li>Keep your entire body visible in the frame</li>
                      <li>Remain still for 5 seconds until measurement completes</li>
                    </>
                  )}
                  {isCapturing && !isMeasuring && (
                    <>
                      <li>Click "Start Measurement" when ready</li>
                      <li>Stand 2 meters from camera</li>
                      <li>You must remain still for 5 seconds during measurement</li>
                    </>
                  )}
                </ol>
              </div>
            </div>
            
            <WebcamCaptureForBodyMeasurement 
              onFrameProcessed={handleFrameProcessed}
              isCapturing={isCapturing}
              isMeasuring={isMeasuring}
            />
            
            <div className="text-center text-sm text-gray-500">
              Status: {isCapturing ? (isMeasuring ? 'Measuring...' : 'Ready') : 'Inactive'}
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Show either the measurement display or results based on state */}
            {(measurementComplete || measurements) ? (
              <BodyMeasurementResult 
                measurements={measurements || {
                  shoulderWidth: parseFloat(defaultShoulderWidth),
                  torsoLength: parseFloat(defaultHeight) * 0.3,
                  leftLegLength: parseFloat(defaultHeight) * 0.45,
                  rightLegLength: parseFloat(defaultHeight) * 0.45,
                  unit: 'cm'
                }}
                processedFrame={processedFrame}
                onNewMeasurement={handleNewMeasurement}
                onSaveResults={handleSaveResults}
              />
            ) : (
              <BodyMeasurementDisplay 
                processedFrame={processedFrame} 
                measurements={null}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Body Measurement System © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}