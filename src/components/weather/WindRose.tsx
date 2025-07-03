import React, { useState } from 'react';
import { WindRoseData } from '../../services/EPWParser';

interface WindRoseProps {
  windRoseData: WindRoseData;
  avgWindSpeed: number;
  predominantDirection: number;
}

// Helper function to format percentages
const formatPercentage = (value: number): string => {
  if (value < 0.1 && value > 0) return '<0.1%';
  if (value < 1) return value.toFixed(1) + '%';
  return value.toFixed(0) + '%';
};

export const WindRose: React.FC<WindRoseProps> = ({
  windRoseData,
  avgWindSpeed,
  predominantDirection
}) => {
  const { directions, frequencies } = windRoseData;
  const [hoveredSector, setHoveredSector] = useState<{direction: string, speedRange: string, frequency: number} | null>(null);
  
  // Find max frequency for scaling
  const maxFrequency = Math.max(...frequencies.flat());
  
  // Convert predominant direction to compass direction
  const predominantIndex = Math.floor(((predominantDirection + 11.25) % 360) / 22.5);
  const predominantCompass = directions[predominantIndex] || 'N';

  // Calculate total wind frequency
  const totalFrequency = frequencies.flat().reduce((sum, freq) => sum + freq, 0);

  // Enhanced color scale for different speed ranges with better contrast
  const speedColors = [
    '#1E40AF', // 0-2 m/s - deep blue
    '#0EA5E9', // 2-4 m/s - sky blue
    '#10B981', // 4-6 m/s - emerald
    '#F59E0B', // 6-8 m/s - amber
    '#EF4444', // 8-10 m/s - red
    '#A855F7', // 10-15 m/s - purple
    '#EC4899'  // 15+ m/s - pink
  ];

  // Calculate calm percentage (very low wind speeds)
  const calmPercentage = 100 - totalFrequency;

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-600/40 shadow-2xl backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">🌪️</span>
        Wind Rose Analysis
      </h3>
      
      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-cyan-900/40 rounded-lg border border-cyan-700/40 hover:bg-cyan-900/50 transition-colors duration-200">
          <div className="text-cyan-400 font-bold text-xl">{avgWindSpeed.toFixed(1)} m/s</div>
          <div className="text-cyan-300 text-sm font-medium">Average Speed</div>
        </div>
        <div className="text-center p-4 bg-green-900/40 rounded-lg border border-green-700/40 hover:bg-green-900/50 transition-colors duration-200">
          <div className="text-green-400 font-bold text-xl">{predominantCompass}</div>
          <div className="text-green-300 text-sm font-medium">Predominant Dir.</div>
        </div>
        <div className="text-center p-4 bg-blue-900/40 rounded-lg border border-blue-700/40 hover:bg-blue-900/50 transition-colors duration-200">
          <div className="text-blue-400 font-bold text-xl">{formatPercentage(calmPercentage)}</div>
          <div className="text-blue-300 text-sm font-medium">Calm Conditions</div>
        </div>
      </div>

      {/* Enhanced Wind Rose Chart */}
      <div className="relative w-full max-w-lg mx-auto mb-6">
        <div className="aspect-square bg-gray-900/60 rounded-lg border border-gray-600/40 p-6 backdrop-blur-sm">
          <svg viewBox="0 0 260 260" className="w-full h-full">
            {/* Background circles with enhanced styling */}
            <defs>
              <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgb(75, 85, 99)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(31, 41, 55)" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            
            <g className="stroke-gray-500 fill-none stroke-width-0.8 opacity-60">
              <circle cx="130" cy="130" r="25" strokeDasharray="2,2" />
              <circle cx="130" cy="130" r="50" strokeDasharray="3,2" />
              <circle cx="130" cy="130" r="75" strokeDasharray="4,2" />
              <circle cx="130" cy="130" r="100" strokeDasharray="5,2" />
              <circle cx="130" cy="130" r="120" />
            </g>
            
            {/* Enhanced frequency scale labels */}
            <g className="fill-gray-300 text-xs font-medium">
              <text x="135" y="110" className="text-xs" textAnchor="start">{formatPercentage(maxFrequency * 0.2)}</text>
              <text x="135" y="85" className="text-xs" textAnchor="start">{formatPercentage(maxFrequency * 0.4)}</text>
              <text x="135" y="60" className="text-xs" textAnchor="start">{formatPercentage(maxFrequency * 0.6)}</text>
              <text x="135" y="35" className="text-xs" textAnchor="start">{formatPercentage(maxFrequency * 0.8)}</text>
              <text x="135" y="15" className="text-xs font-bold" textAnchor="start">{formatPercentage(maxFrequency)}</text>
            </g>
            
            {/* Direction lines with subtle styling */}
            <g className="stroke-gray-500 stroke-width-0.5 opacity-40">
              {directions.map((_, index) => {
                const angle = (index * 22.5 - 90) * (Math.PI / 180);
                const x2 = 130 + 125 * Math.cos(angle);
                const y2 = 130 + 125 * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1="130"
                    y1="130"
                    x2={x2}
                    y2={y2}
                  />
                );
              })}
            </g>

            {/* Enhanced wind frequency sectors with interactivity */}
            {directions.map((direction, dirIndex) => {
              const angle = (dirIndex * 22.5 - 90) * (Math.PI / 180);
              let cumulativeLength = 0;
              
              return (
                <g key={direction}>
                  {frequencies[dirIndex].map((freq, speedIndex) => {
                    if (freq === 0) return null;
                    
                    const normalizedFreq = (freq / maxFrequency) * 110; // Scale to max radius of 110
                    const startRadius = cumulativeLength + 15; // Start from center with offset
                    const endRadius = startRadius + normalizedFreq;
                    
                    // Create a wider sector for better visibility
                    const sectorWidth = 12 * (Math.PI / 180); // 12 degrees width
                    const startAngle = angle - sectorWidth / 2;
                    const endAngle = angle + sectorWidth / 2;
                    
                    // Calculate sector coordinates
                    const x1Start = 130 + startRadius * Math.cos(startAngle);
                    const y1Start = 130 + startRadius * Math.sin(startAngle);
                    const x1End = 130 + endRadius * Math.cos(startAngle);
                    const y1End = 130 + endRadius * Math.sin(startAngle);
                    
                    const x2Start = 130 + startRadius * Math.cos(endAngle);
                    const y2Start = 130 + startRadius * Math.sin(endAngle);
                    const x2End = 130 + endRadius * Math.cos(endAngle);
                    const y2End = 130 + endRadius * Math.sin(endAngle);
                    
                    cumulativeLength += normalizedFreq;
                    
                    // Create path for the sector
                    const pathData = [
                      `M ${x1Start} ${y1Start}`,
                      `L ${x1End} ${y1End}`,
                      `A ${endRadius} ${endRadius} 0 0 1 ${x2End} ${y2End}`,
                      `L ${x2Start} ${y2Start}`,
                      `A ${startRadius} ${startRadius} 0 0 0 ${x1Start} ${y1Start}`,
                      'Z'
                    ].join(' ');
                    
                    const speedRange = getSpeedLabel(speedIndex);
                    
                    return (
                      <path
                        key={`${dirIndex}-${speedIndex}`}
                        d={pathData}
                        fill={speedColors[speedIndex]}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.5"
                        opacity="0.9"
                        className="hover:opacity-100 transition-all duration-300 cursor-pointer hover:stroke-white hover:stroke-2"
                        onMouseEnter={() => setHoveredSector({
                          direction,
                          speedRange,
                          frequency: freq
                        })}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        <title>
                          {direction}: {formatPercentage(freq)} at {speedRange} m/s
                        </title>
                      </path>
                    );
                  })}
                </g>
              );
            })}

            {/* Enhanced cardinal direction labels */}
            {[
              { dir: 'N', angle: 0 },
              { dir: 'NE', angle: 45 },
              { dir: 'E', angle: 90 },
              { dir: 'SE', angle: 135 },
              { dir: 'S', angle: 180 },
              { dir: 'SW', angle: 225 },
              { dir: 'W', angle: 270 },
              { dir: 'NW', angle: 315 }
            ].map(({ dir, angle }) => {
              const radian = (angle - 90) * (Math.PI / 180);
              const x = 130 + 145 * Math.cos(radian);
              const y = 130 + 145 * Math.sin(radian);
              const isPredominant = dir === predominantCompass;
              
              return (
                <g key={dir}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isPredominant ? "18" : "14"}
                    fill={isPredominant ? "rgba(34, 197, 94, 0.3)" : "rgba(75, 85, 99, 0.4)"}
                    stroke={isPredominant ? "rgb(34, 197, 94)" : "rgb(156, 163, 175)"}
                    strokeWidth={isPredominant ? "2" : "1"}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-sm font-bold ${isPredominant ? 'fill-green-400' : 'fill-white'}`}
                  >
                    {dir}
                  </text>
                </g>
              );
            })}

            {/* Enhanced center with gradient and calm indicator */}
            <circle cx="130" cy="130" r="12" fill="url(#centerGradient)" stroke="rgb(156, 163, 175)" strokeWidth="1" />
            <text x="130" y="150" textAnchor="middle" className="fill-gray-300 text-xs font-medium">
              Calm
            </text>
            <text x="130" y="162" textAnchor="middle" className="fill-gray-400 text-xs">
              {formatPercentage(calmPercentage)}
            </text>
          </svg>
        </div>
        
        {/* Hover tooltip */}
        {hoveredSector && (
          <div className="absolute top-4 right-4 bg-gray-900/95 text-white p-3 rounded-lg border border-gray-600 shadow-xl backdrop-blur-sm">
            <div className="text-sm font-bold">{hoveredSector.direction}</div>
            <div className="text-xs text-gray-300">{hoveredSector.speedRange} m/s</div>
            <div className="text-xs text-blue-400 font-medium">{formatPercentage(hoveredSector.frequency)}</div>
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
          <span className="text-lg">💨</span>
          Wind Speed Classifications
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {speedColors.map((color, index) => {
            const speedRange = getSpeedLabel(index);
            const beaufortScale = getBeaufortScale(index);
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/40 hover:bg-gray-700/60 transition-colors duration-200">
                <div
                  className="w-5 h-5 rounded-full border-2 border-gray-400/50 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="text-gray-200 font-medium">{speedRange} m/s</div>
                  <div className="text-gray-400 text-xs">{beaufortScale}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Analysis Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-lg border border-gray-600/40">
        <div className="text-sm text-gray-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-100">Analysis Summary:</span>
            <span className="text-xs text-gray-400">8,760 hourly observations</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-300 font-medium">Wind Conditions</div>
              <div className="text-gray-400">Active winds: {formatPercentage(totalFrequency)}</div>
              <div className="text-gray-400">Calm periods: {formatPercentage(calmPercentage)}</div>
            </div>
            <div>
              <div className="text-gray-300 font-medium">Frequency Scale</div>
              <div className="text-gray-400">Max: {formatPercentage(maxFrequency)}</div>
              <div className="text-gray-400">From center outward</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getSpeedLabel(index: number): string {
  const labels = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-15', '15+'];
  return labels[index] || '';
}

function getBeaufortScale(index: number): string {
  const scales = [
    'Light air',
    'Light breeze', 
    'Gentle breeze',
    'Moderate breeze',
    'Fresh breeze',
    'Strong breeze',
    'Near gale+'
  ];
  return scales[index] || '';
}
