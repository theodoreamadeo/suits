'use client';

import React, { useEffect, useRef, useState } from 'react';
import { processBodyFrame, BodyMeasurement } from '../services/api';

interface WebcamCaptureForBodyMeasurementProps {
    onFrameProcessed: (frame: any) => void; // Using any for flexibility with your existing code
    isCapturing: boolean;
    isMeasuring: boolean;
}

const WebcamCaptureForBodyMeasurement: React.FC<WebcamCaptureForBodyMeasurementProps> = ({ 
  onFrameProcessed, 
  isCapturing,
  isMeasuring,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const processingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const requestIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const measurementDurationMs = 5000; // 5 seconds
  const startTimeRef = useRef<number>(0);
  const measurementIntervalMs = 500; // Check for measurements every 500ms

  // Start webcam stream
  useEffect(() => {
    const startWebcam = async () => {
      try {
        // Stop any existing stream first
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = userMedia;
          
          // Wait for video to be loaded
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            videoRef.current?.play().catch(e => {
              console.error("Error playing video:", e);
              setError("Could not play video: " + e.message);
            });
          };
        }
        
        setStream(userMedia);
        setError('');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError('Failed to access webcam: ' + errorMessage);
        console.error('Error accessing webcam:', err);
      }
    };
    
    if (isCapturing && !stream) {
      startWebcam();
    } else if (!isCapturing && stream) {
      // Stop the stream when capture is toggled off
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing, stream]);

  // Process frames when isCapturing is true and measuring
  useEffect(() => {
    // Clear any existing interval
    if (requestIntervalRef.current) {
      clearInterval(requestIntervalRef.current);
      requestIntervalRef.current = null;
    }
    
    // Only process frames if we're capturing and measuring
    if (!isCapturing || !isMeasuring || !videoRef.current || !canvasRef.current) {
      // Cancel any existing animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    console.log(`Frame processing activated - Measuring: ${isMeasuring}`);
    
    // Reset measurement progress and start time when beginning measurement
    setMeasurementProgress(0);
    startTimeRef.current = Date.now();
    
    const captureAndProcessFrame = async () => {
      if (processingRef.current) {
        return; // Skip if already processing
      }
      
      processingRef.current = true;
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
          processingRef.current = false;
          return;
        }
        
        // Make sure video is actually playing
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          console.log("Video not ready yet, waiting...");
          processingRef.current = false;
          return;
        }
        
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Could not get canvas context');
          processingRef.current = false;
          return;
        }
        
        // Make sure video has actual dimensions before proceeding
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.log("Video dimensions not available yet");
          processingRef.current = false;
          return;
        }
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Validate the frame data
        if (!frameData || frameData === 'data:,' || frameData === 'data:image/jpeg;base64,') {
          console.error('Invalid frame data generated from canvas');
          processingRef.current = false;
          return;
        }
        
        // Calculate current progress
        const elapsedTime = Date.now() - startTimeRef.current;
        const currentProgress = Math.min(100, Math.floor((elapsedTime / measurementDurationMs) * 100));
        setMeasurementProgress(currentProgress);
        
        // Send to backend for processing
        try {
          // Log the request being sent
          console.log('Sending frame to backend for processing...');
          
          const result = await processBodyFrame(frameData);
          console.log('Received response from backend:', result);
          
          // Convert the response to match expected format in your app
          if ('message' in result) {
            // Still waiting for stable pose
            const formattedResult = {
              hasPose: true,
              visualizationImage: frameData,
              statusMessage: result.message,
              measurementProgress: currentProgress
            };
            
            onFrameProcessed(formattedResult);
          } else {
            // We have measurements from the API
            // Convert the snake_case response to your existing format
            const measurements = {
              shoulderWidth: result.shoulder_width,
              torsoLength: result.torso_length,
              leftLegLength: result.left_leg_length,
              rightLegLength: result.right_leg_length,
              unit: result.unit,
              scaleFactor: result.unit === 'cm' ? 1.0 : null,
              sizeCategories: result.size_categories
            };
            
            // Format for your existing UI
            const formattedResult = {
              hasPose: true,
              visualizationImage: result.visualization_image || frameData,
              measurements: measurements,
              measurementProgress: 100
            };
            
            onFrameProcessed(formattedResult);
            
            // If we got measurements, we can stop
            if (requestIntervalRef.current) {
              console.log("Measurements obtained, stopping interval");
              clearInterval(requestIntervalRef.current);
              requestIntervalRef.current = null;
            }
          }
          
        } catch (apiError) {
          console.error('Backend API error:', apiError);
          
          // If API fails, use a mock response for debugging
          const mockResult = {
            hasPose: true,
            visualizationImage: frameData,
            error: "Failed to get measurements from backend",
            measurementProgress: currentProgress
          };
          
          onFrameProcessed(mockResult);
        } finally {
          processingRef.current = false;
        }
      } catch (err) {
        console.error('Error capturing frame:', err);
        processingRef.current = false;
      }
    };
    
    console.log("Starting measurement process");
    
    // For measurement, try multiple times during the 5-second period
    requestIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTimeRef.current;
      
      // Update progress
      const currentProgress = Math.min(100, Math.floor((elapsedTime / measurementDurationMs) * 100));
      setMeasurementProgress(currentProgress);
      
      // Process frame
      captureAndProcessFrame();
      
      // Check if we've reached the end of the measurement period
      if (elapsedTime >= measurementDurationMs) {
        console.log("Measurement period complete");
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current);
          requestIntervalRef.current = null;
        }
      }
    }, measurementIntervalMs);
    
    // Cleanup function
    return () => {
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current);
        requestIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isCapturing, isMeasuring, onFrameProcessed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return (
    <div className="relative">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg shadow-lg w-full max-w-xl mx-auto"
      />
      <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for processing */}
      
      {/* Status information */}
      <div className="mt-2 text-xs text-gray-500">
        Status: {isCapturing ? (
          isMeasuring ? 
            `Measuring body dimensions... Please stand still (${measurementProgress}%)` : 
            'Ready'
        ) : 'Inactive'}
      </div>
      
      {/* Progress bar */}
      {isMeasuring && isCapturing && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${measurementProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default WebcamCaptureForBodyMeasurement;