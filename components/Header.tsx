
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-6 text-center border-b border-gray-700/50">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
        TrendLens AI
      </h1>
      <p className="mt-2 text-lg text-gray-400">AI-Powered Fashion Trend Forecasting</p>
    </header>
  );
};
