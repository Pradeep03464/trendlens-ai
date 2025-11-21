
import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface TrendScoreGaugeProps {
  score: number;
}

export const TrendScoreGauge: React.FC<TrendScoreGaugeProps> = ({ score }) => {
  const data = [{ name: 'score', value: score }];
  
  const scoreColor =
    score > 80 ? '#4ade80' : // green-400
    score > 60 ? '#facc15' : // yellow-400
    score > 40 ? '#fb923c' : // orange-400
    '#f87171'; // red-400

  return (
    <div className="w-36 h-36 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            fill={scoreColor}
          />
          <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) rotate(90) scale(50)">
              <stop stopColor={scoreColor} stopOpacity="0.2"/>
              <stop offset="1" stopColor={scoreColor} stopOpacity="0"/>
            </radialGradient>
          </defs>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl font-bold" style={{ color: scoreColor }}>{score}</span>
          <p className="text-xs text-gray-400 -mt-1">Score</p>
        </div>
      </div>
    </div>
  );
};
