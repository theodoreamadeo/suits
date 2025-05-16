"use client";

import { useState, useCallback } from "react";
import WebcamCapture from "../components/WebcamCapture";
import FaceMeshDisplay from "../components/FaceMeshDisplay";
import SkinToneAnalysis from "../components/SkinToneAnalysis";
import { ProcessedFrame } from "../types";
import { analyzeSkinToneUpload } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuitMe() {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [processedFrame, setProcessedFrame] = useState<ProcessedFrame | null>(
    null
  );
  const [skinToneAnalysis, setSkinToneAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { token, refreshUser } = useAuth();
  const router = useRouter();

  const handleFrameProcessed = useCallback((frame: ProcessedFrame) => {
    setProcessedFrame(frame);
  }, []);

  const toggleCapture = () => {
    setIsCapturing((prev) => !prev);
    if (!isCapturing) {
      // Reset previous results when starting capture
      setSkinToneAnalysis(null);
      setError("");
    }
  };

  const saveSkinTone = async (skinTone: string) => {
    if (!token) return;
    await fetch("http://localhost:8000/api/auth/skin-tone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ skin_tone: skinTone }),
    });
  };

  const handleAnalyzeSkinTone = async () => {
    if (!processedFrame || !processedFrame.hasFace) {
      setError("No face detected to analyze.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError("");

      // Convert base64 to blob
      const base64Response = await fetch(processedFrame.segmentedFace);
      const blob = await base64Response.blob();

      // Create a file from the blob
      const imageFile = new File([blob], "face.jpg", { type: "image/jpeg" });

      // Use the new direct upload function
      const analysisResult = await analyzeSkinToneUpload(imageFile);
      setSkinToneAnalysis(analysisResult);
      // Save skin tone to backend if available
      if (
        analysisResult &&
        analysisResult.faces &&
        analysisResult.faces[0]?.skin_tone
      ) {
        await saveSkinTone(analysisResult.faces[0].skin_tone);
      }
    } catch (err) {
      console.error("Error in skin tone analysis:", err);
      setError("Failed to analyze skin tone. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = async () => {
    await refreshUser();
    router.push("/preference-form");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2 font-kontol">
            Face Mesh & Skin Tone Analysis
          </h1>
          <p className="text-gray-600 text-kontol">
            Capture, visualize, and analyze your face in real-time
          </p>
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
                      ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                      : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
                  }`}
                >
                  {isCapturing ? "Stop Capture" : "Start Capture"}
                </button>

                <button
                  onClick={handleAnalyzeSkinTone}
                  disabled={!processedFrame?.hasFace || isAnalyzing}
                  className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    !processedFrame?.hasFace || isAnalyzing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
                  }`}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Skin Tone"}
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
                  <li>Click "Analyze Skin Tone" when ready</li>
                </ol>
              </div>
            </div>

            <WebcamCapture
              onFrameProcessed={handleFrameProcessed}
              isCapturing={isCapturing}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <FaceMeshDisplay processedFrame={processedFrame} />
            <SkinToneAnalysis
              analysisResult={skinToneAnalysis}
              isLoading={isAnalyzing}
            />
            {skinToneAnalysis &&
              skinToneAnalysis.faces &&
              skinToneAnalysis.faces[0]?.skin_tone &&
              !isAnalyzing && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold shadow"
                  >
                    Next
                  </button>
                </div>
              )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Face Mesh & Skin Tone Analysis © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
