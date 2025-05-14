'use client';
// src/app/page.tsx
import React, { useState } from 'react';
import PreferenceForm from '../components/PreferenceForm';
import OutfitRecommendations from '../components/OutfitRecommendations';
import { RecommendationRequest, RecommendationResponse, Outfit } from '../types';
import { getOutfitRecommendations } from '../services/api';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (preferences: RecommendationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOutfitRecommendations(preferences);
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    // Here you could implement additional logic like:
    // - Adding to cart
    // - Saving to favorites
    // - Proceeding to checkout
    console.log('Selected outfit:', outfit);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Fashion Recommendation System</h1>
        
        <div className="max-w-4xl mx-auto">
          {/* Success alert when outfit is selected */}
          {selectedOutfit && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">Outfit Selected!</h3>
                  <p>You've selected an outfit with:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>{selectedOutfit.topwear.display_name}</li>
                    <li>{selectedOutfit.bottomwear.display_name}</li>
                    <li>{selectedOutfit.footwear.display_name}</li>
                  </ul>
                  <p className="mt-2">
                    Total Price: ${(
                      selectedOutfit.topwear.price +
                      selectedOutfit.bottomwear.price +
                      selectedOutfit.footwear.price
                    ).toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOutfit(null)}
                  className="text-green-700 hover:text-green-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-red-700">Error</h3>
                  <p>{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Preference Form */}
          <PreferenceForm onSubmit={handleSubmit} isLoading={isLoading} />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center items-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              <span className="ml-3 text-lg">Loading recommendations...</span>
            </div>
          )}
          
          {/* Outfit Recommendations */}
          {!isLoading && recommendations && (
            <OutfitRecommendations
              recommendations={recommendations}
              onSelectOutfit={handleSelectOutfit}
            />
          )}
        </div>
      </div>
    </main>
  );
}