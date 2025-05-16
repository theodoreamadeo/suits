"use client";
// src/app/page.tsx
import React, { useEffect, useState } from "react";
import { getOutfitRecommendations } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowBigRightDash } from "lucide-react";

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
    <div className="flex flex-row gap-12 justify-center pl-12">
      <div className="flex flex-col items-center justify-center w-1/5 ">
        {selectedOutfit ? (
          <>
            <img
              src={selectedOutfit.topwear.image_url}
              alt="Topwear"
              className="w-50 h-50 object-contain mb-4"
            />
            <img
              src={selectedOutfit.bottomwear.image_url}
              alt="Bottomwear"
              className="w-50 h-50 object-contain mb-4"
            />
            <img
              src={selectedOutfit.footwear.image_url}
              alt="Footwear"
              className="w-50 h-50 object-contain"
            />
            <div className="mt-6 text-lg font-bold text-green-900">
              Total: ${totalPrice.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-gray-400">No outfit selected</div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-8 max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading && <div className="text-center">Loading...</div>}
        {!isLoading &&
          recommendations &&
          recommendations.length > 0 &&
          recommendations.map((outfit, idx) => (
            <div
              key={outfit.id}
              className={
                "bg-[#DDDED8] rounded-4xl p-6 flex flex-row items-center shadow w-3xl" +
                (selectedOutfit &&
                outfit.topwear.id === selectedOutfit.topwear.id &&
                outfit.bottomwear.id === selectedOutfit.bottomwear.id &&
                outfit.footwear.id === selectedOutfit.footwear.id
                  ? " border-4 border-[#B6BAAB]"
                  : "")
              }
              onClick={() => {
                setSelectedOutfit(outfit);
              }}
            >
              <div className="font-bold text-lg mr-8">OPTION {idx + 1}</div>
              <div className="flex items-end gap-8">
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.topwear.image_url}
                    alt="Topwear"
                    className="w-40 h-40 object-contain mb-2"
                  />
                  <div className="text-sm font-bold">
                    ${outfit.topwear.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.bottomwear.image_url}
                    alt="Bottomwear"
                    className="w-40 h-40 object-contain mb-2"
                  />
                  <div className="text-sm font-bold">
                    ${outfit.bottomwear.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={outfit.footwear.image_url}
                    alt="Footwear"
                    className="w-40 h-40 object-contain mb-2"
                  />
                  <div className="text-sm font-bold">
                    ${outfit.footwear.price.toFixed(2)}
                  </div>
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
      <div className="flex flex-col items-center justify-center ml-15 ">
        <ArrowBigRightDash
          width={150}
          height={150}
          color="#90977a"
          className="hover:scale-105"
        />
        <p className="text-xs font-bold">Click here to confirm the option!</p>
      </div>
    </div>
  );
}
