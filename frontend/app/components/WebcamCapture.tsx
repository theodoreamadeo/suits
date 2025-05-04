import React, { useEffect, useRef, useState } from 'react';
import { processFrame } from '../services/api';
import { ProcessedFrame } from '../types';

interface WebcamCaptureProps {
    onFrameProcessed: (processedFrame: ProcessedFrame) => void;
    isCapturing: boolean;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onFrameProcessed, isCapturing}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const processingRef = useRef<boolean>(false);

    // Start webcam stream
    useEffect(() => {
        const startWebcam = async () => {
          try {
            const userMedia = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user',
              },
            });
            
            if (videoRef.current) {
              videoRef.current.srcObject = userMedia;
            }
            setStream(userMedia);
            setError('');
          } catch (err) {
            setError('Failed to access webcam. Please ensure your camera is connected and permissions are granted.');
            console.error('Error accessing webcam:', err); 
          }
        };
    
        startWebcam();
    
        // Cleanup function
        return () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      }, []);

      // Process frames when isCapturing is true
      useEffect(() => {
        if (!isCapturing || !videoRef.current || !canvasRef.current) return;
    
        let animationFrameId: number;
    
        const captureAndProcessFrame = async () => {
          if (!processingRef.current && videoRef.current && canvasRef.current) {
            processingRef.current = true;
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (!context) return;
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to base64 image
            const frameData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Send to backend for processing
            try {
              // Log the request being sent
              console.log('Sending frame to backend for processing...');
              
              // For debugging, let's add a fallback mock response
              let result;
              try {
                result = await processFrame(frameData);
                console.log('Received response from backend:', result);
              } catch (apiError) {
                console.error('Backend API error:', apiError);
                // If API fails, use a mock response to see if the UI is working
                console.log('Using mock response for debugging');
                result = {
                  meshVisualization: frameData, // Use the camera feed as placeholder
                  segmentedFace: frameData,
                  hasFace: true,
                  fps: 30
                };
              }
              
              onFrameProcessed(result);
            } catch (err) {
              console.error('Error in frame processing flow:', err);
            } finally {
              processingRef.current = false;
            }
          }
          
          // Schedule next frame capture
          animationFrameId = requestAnimationFrame(captureAndProcessFrame);
        };
    
        captureAndProcessFrame();
    
        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        };
      }, [isCapturing, onFrameProcessed]);

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
          
          {/* Debug info - consider removing in production */}
          <div className="mt-2 text-xs text-gray-500">
            Capture status: {isCapturing ? 'Active' : 'Inactive'}
          </div>
        </div>
      );
};

export default WebcamCapture;