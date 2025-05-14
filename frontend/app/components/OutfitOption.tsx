// src/components/OutfitOption.tsx
import React from 'react';
import Image from 'next/image';
import { OutfitItem } from '../types';

interface OutfitOptionProps {
  item: OutfitItem;
  alternativeItems: OutfitItem[];
  onSwitch: (newItem: OutfitItem) => void;
}

const OutfitOption: React.FC<OutfitOptionProps> = ({ 
  item, 
  alternativeItems, 
  onSwitch 
}) => {
  // Find current index of the item in alternatives
  const currentIndex = alternativeItems.findIndex(alt => alt.id === item.id);
  
  const handleSwitch = () => {
    // If we can't find the current item in alternatives, just use the first alternative
    if (currentIndex === -1 && alternativeItems.length > 0) {
      onSwitch(alternativeItems[0]);
      return;
    }
    
    // Get the next item in rotation
    const nextIndex = (currentIndex + 1) % alternativeItems.length;
    onSwitch(alternativeItems[nextIndex]);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 md:w-40 md:h-40 relative mb-2 rounded overflow-hidden bg-gray-100">
        <Image
          src={item.image_url}
          alt={item.display_name}
          fill
          className="object-cover"
        />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm md:text-base">${item.price.toFixed(2)}</p>
        <button 
          onClick={handleSwitch}
          className="mt-1 px-4 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300 transition-colors"
        >
          switch
        </button>
      </div>
    </div>
  );
};

export default OutfitOption;