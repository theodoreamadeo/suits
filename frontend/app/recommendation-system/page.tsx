"use client";
// src/app/page.tsx
import React, { useEffect, useState } from "react";
import OutfitRecommendations from "../components/OutfitRecommendations";
import {
  RecommendationRequest,
  RecommendationResponse,
  Outfit,
} from "../types";
import { getOutfitRecommendations } from "../services/api";
import { useAuth } from "../context/AuthContext";

function toCamelCase(str: string) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function RecommendationSystem() {
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPreferenceAndRecommend = async () => {
      if (!token || !user) {
        setError("Not authenticated.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:8000/api/auth/preferences",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch preferences");
        const prefs = await response.json();
        if (!prefs || prefs.length === 0) {
          setError("No preferences found.");
          setIsLoading(false);
          return;
        }
        const latest = prefs[0];
        // NOTE: The recommendation API now uses GET with query parameters
        const preferences = {
          skin_tone_hex: user.skin_tone || "",
          gender: latest.gender === "male" ? "Men" : "Women",
          usage: [toCamelCase(latest.occasion || "")],
          footwear_preference: latest.footwear || "",
        };
        const data = await getOutfitRecommendations(preferences);
        setRecommendations(data.outfits || []);
        setSelectedOutfit(
          data.outfits && data.outfits.length > 0 ? data.outfits[0] : null
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get recommendations"
        );
        console.error("Error fetching recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestPreferenceAndRecommend();
  }, [token, user]);

  const handleSwitch = (type: string, item: any) => {
    if (!selectedOutfit) return;
    setSelectedOutfit({
      ...selectedOutfit,
      [type]: item,
    });
  };

  // Calculate total price for selected outfit
  const totalPrice = selectedOutfit
    ? (selectedOutfit.topwear?.price || 0) +
      (selectedOutfit.bottomwear?.price || 0) +
      (selectedOutfit.footwear?.price || 0)
    : 0;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-700">
          Error occurred
        </h2>
        <pre className="bg-red-50 p-4 rounded text-red-800 overflow-x-auto">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 min-h-screen bg-gray-50">
      {/* Left: Selected Outfit */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/3 bg-white rounded-xl shadow p-6 mb-8 md:mb-0 md:sticky md:top-8 h-fit">
        {selectedOutfit ? (
          <>
            <img
              src={selectedOutfit.topwear.image_url}
              alt="Topwear"
              className="w-40 h-40 object-contain mb-4"
            />
            <img
              src={selectedOutfit.bottomwear.image_url}
              alt="Bottomwear"
              className="w-40 h-40 object-contain mb-4"
            />
            <img
              src={selectedOutfit.footwear.image_url}
              alt="Footwear"
              className="w-40 h-40 object-contain"
            />
            <div className="mt-6 text-lg font-bold text-blue-700">
              Total: ${totalPrice.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-gray-400">No outfit selected</div>
        )}
      </div>

      {/* Right: Outfit Options */}
      <div className="flex-1 flex flex-col gap-8 max-h-[80vh] overflow-y-auto pr-2">
        {isLoading && <div className="text-center">Loading...</div>}
        {!isLoading &&
          recommendations &&
          recommendations.length > 0 &&
          recommendations.map((outfit, idx) => (
            <div
              key={outfit.id}
              className={
                "bg-gray-100 rounded-xl p-6 flex flex-col gap-2 shadow transition-all " +
                (selectedOutfit &&
                outfit.topwear.id === selectedOutfit.topwear.id &&
                outfit.bottomwear.id === selectedOutfit.bottomwear.id &&
                outfit.footwear.id === selectedOutfit.footwear.id
                  ? "border-4 border-blue-500 bg-blue-50"
                  : "")
              }
            >
              <div className="font-bold mb-2">OPTION {idx + 1}</div>
              <div className="flex items-end gap-8">
                {/* Topwear */}
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.topwear.image_url}
                    alt="Topwear"
                    className="w-20 h-20 object-contain mb-2"
                  />
                  <div className="text-sm font-semibold">
                    ${outfit.topwear.price.toFixed(2)}
                  </div>
                  {/* <button
                    className="bg-gray-300 rounded px-4 py-1 mt-1"
                    onClick={() => handleSwitch("topwear", outfit.topwear)}
                  >
                    switch
                  </button> */}
                </div>
                {/* Bottomwear */}
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.bottomwear.image_url}
                    alt="Bottomwear"
                    className="w-20 h-20 object-contain mb-2"
                  />
                  <div className="text-sm font-semibold">
                    ${outfit.bottomwear.price.toFixed(2)}
                  </div>
                  {/* <button
                    className="bg-gray-300 rounded px-4 py-1 mt-1"
                    onClick={() =>
                      handleSwitch("bottomwear", outfit.bottomwear)
                    }
                  >
                    switch
                  </button> */}
                </div>
                {/* Footwear */}
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.footwear.image_url}
                    alt="Footwear"
                    className="w-20 h-20 object-contain mb-2"
                  />
                  <div className="text-sm font-semibold">
                    ${outfit.footwear.price.toFixed(2)}
                  </div>
                  {/* <button
                    className="bg-gray-300 rounded px-4 py-1 mt-1"
                    onClick={() => handleSwitch("footwear", outfit.footwear)}
                  >
                    switch
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        {!isLoading && (!recommendations || recommendations.length === 0) && (
          <div className="text-center text-gray-500">
            No recommendations found.
          </div>
        )}
      </div>
    </div>
  );
}
