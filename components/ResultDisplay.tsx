import React from 'react';
import { TrendScoreGauge } from './TrendScoreGauge';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  image: string;
  score: number;
  analysis: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ image, score, analysis }) => {
  const parsedImage = JSON.parse(image);
  const imageUrl = `data:${parsedImage.mimeType};base64,${parsedImage.data}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const extension = parsedImage.mimeType.split('/')[1] || 'png';
    link.download = `trendlens-ai-outfit.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <div className="flex-shrink-0 mb-4 relative group">
        <img
          src={imageUrl}
          alt="AI Generated Fashion"
          className="w-full max-h-[300px] lg:max-h-[400px] object-contain rounded-lg shadow-lg"
        />
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 bg-gray-900/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          aria-label="Download Image"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow flex flex-col md:flex-row items-center gap-4">
        <div className="flex-shrink-0">
          <TrendScoreGauge score={score} />
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-xl font-bold mb-2 text-indigo-400">AI Trend Analysis</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis}</p>
        </div>
      </div>
    </div>
  );
};
