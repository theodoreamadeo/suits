import React from 'react';

interface SkinToneAnalysisProps {
  analysisResult: any;
  isLoading: boolean;
}

const SkinToneAnalysis: React.FC<SkinToneAnalysisProps> = ({ analysisResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Skin Tone Analysis</h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!analysisResult || !analysisResult.faces || analysisResult.faces.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Skin Tone Analysis</h2>
        <p className="text-gray-500">No analysis data available.</p>
      </div>
    );
  }

  // Extract the first face data (assuming there's only one face analyzed)
  const faceData = analysisResult.faces[0];
  const dominantColors = faceData.dominant_colors || [];
  const skinTone = faceData.skin_tone || '';
  const toneLabel = faceData.tone_label || '';
  const accuracy = faceData.accuracy || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-3 bg-purple-600 text-white font-medium">
        Skin Tone Analysis
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Skin tone color display */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Skin Tone</h3>
            
            {/* Display the skin tone color */}
            <div className="flex items-center space-x-4">
              <div 
                className="w-20 h-20 rounded-lg shadow border border-gray-200" 
                style={{ backgroundColor: skinTone }}
              ></div>
              <div>
                <p className="font-medium">{toneLabel}</p>
                <p className="text-sm text-gray-500">Color code: {skinTone}</p>
                <p className="text-sm text-gray-500">Accuracy: {accuracy}%</p>
              </div>
            </div>
            
            {/* Recommendations based on tone label */}
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-700 mb-2">Recommendations</h4>
              <p className="text-sm text-gray-700">
                Based on your {toneLabel} skin tone, colors that would complement you include{' '}
                {toneLabel === 'A' ? 'cool blues, purples, and pinks' : 
                 toneLabel === 'B' ? 'jewel tones and cool neutrals' : 
                 toneLabel === 'C' ? 'warm earthy tones and soft neutrals' : 
                 toneLabel === 'D' ? 'rich browns, oranges, and yellows' : 
                 toneLabel === 'E' ? 'deep reds, vibrant yellows, and oranges' : 
                 toneLabel === 'F' ? 'vibrant colors that create contrast' : 
                 'various complementary colors'}.
              </p>
            </div>
          </div>
          
          {/* Right side - Dominant colors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dominant Colors</h3>
            
            <div className="space-y-3">
              {dominantColors.map((colorData: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-lg shadow mr-4" 
                    style={{ backgroundColor: colorData.color }}
                  ></div>
                  <div>
                    <p className="font-medium">{colorData.color}</p>
                    <p className="text-sm text-gray-500">{(parseFloat(colorData.percent) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinToneAnalysis;