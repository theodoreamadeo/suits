// src/components/OutfitRecommendations.tsx
import React, { useState } from 'react';
import OutfitCard from './OutfitCard';
import { Outfit, OutfitItem, RecommendationResponse } from '../types';

interface OutfitRecommendationsProps {
  recommendations: RecommendationResponse;
  onSelectOutfit: (outfit: Outfit) => void;
}

const OutfitRecommendations: React.FC<OutfitRecommendationsProps> = ({
  recommendations,
  onSelectOutfit,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3; // Show 3 outfits per page
  
  // Extract all options for each clothing type
  const topwearOptions = recommendations.outfits.map(outfit => outfit.topwear);
  const bottomwearOptions = recommendations.outfits.map(outfit => outfit.bottomwear);
  const footwearOptions = recommendations.outfits.map(outfit => outfit.footwear);
  
  // Calculate total pages
  const totalPages = Math.ceil(recommendations.outfits.length / itemsPerPage);
  
  // Get current page items
  const startIdx = currentPage * itemsPerPage;
  const visibleOutfits = recommendations.outfits.slice(startIdx, startIdx + itemsPerPage);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Recommended Outfits</h2>
      
      <div className="space-y-6">
        {visibleOutfits.map((outfit, index) => (
          <OutfitCard
            key={outfit.id}
            option={startIdx + index + 1}
            outfit={outfit}
            topwearOptions={topwearOptions}
            bottomwearOptions={bottomwearOptions}
            footwearOptions={footwearOptions}
            onSelect={onSelectOutfit}
          />
        ))}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-sm">
            Page {currentPage + 1} of {totalPages}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default OutfitRecommendations;