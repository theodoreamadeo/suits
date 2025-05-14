
import React, { useState } from 'react';
import OutfitOption from './OutfitOption';
import { Outfit, OutfitItem } from '../types';

interface OutfitCardProps {
  option: number;
  outfit: Outfit;
  topwearOptions: OutfitItem[];
  bottomwearOptions: OutfitItem[];
  footwearOptions: OutfitItem[];
  onSelect: (outfit: Outfit) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  option,
  outfit,
  topwearOptions,
  bottomwearOptions,
  footwearOptions,
  onSelect,
}) => {
  const [currentOutfit, setCurrentOutfit] = useState<Outfit>(outfit);

  const handleTopwearSwitch = (newTopwear: OutfitItem) => {
    const updatedOutfit = { ...currentOutfit, topwear: newTopwear };
    setCurrentOutfit(updatedOutfit);
  };

  const handleBottomwearSwitch = (newBottomwear: OutfitItem) => {
    const updatedOutfit = { ...currentOutfit, bottomwear: newBottomwear };
    setCurrentOutfit(updatedOutfit);
  };

  const handleFootwearSwitch = (newFootwear: OutfitItem) => {
    const updatedOutfit = { ...currentOutfit, footwear: newFootwear };
    setCurrentOutfit(updatedOutfit);
  };

  const handleSelect = () => {
    onSelect(currentOutfit);
  };

  const totalPrice = (
    currentOutfit.topwear.price +
    currentOutfit.bottomwear.price +
    currentOutfit.footwear.price
  ).toFixed(2);

  return (
    <div className="bg-gray-100 p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold mb-4 text-center">OPTION {option}</h3>
      
      <div className="flex justify-between items-center mb-4">
        <OutfitOption
          item={currentOutfit.topwear}
          alternativeItems={topwearOptions}
          onSwitch={handleTopwearSwitch}
        />
        
        <OutfitOption
          item={currentOutfit.bottomwear}
          alternativeItems={bottomwearOptions}
          onSwitch={handleBottomwearSwitch}
        />
        
        <OutfitOption
          item={currentOutfit.footwear}
          alternativeItems={footwearOptions}
          onSwitch={handleFootwearSwitch}
        />
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-lg font-semibold">${totalPrice}</div>
        <button
          onClick={handleSelect}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Select Outfit
        </button>
      </div>
    </div>
  );
};

export default OutfitCard;