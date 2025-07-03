import React from 'react';
import { ComfortAnalysis } from '../../services/EPWParser';

interface ComfortAnalysisProps {
  analysis: ComfortAnalysis;
  comfortTemp: number;
  onComfortTempChange: (temp: number) => void;
}

// Helper function to format large numbers with better readability
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    return (num / 1000).toFixed(0) + 'K';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

// Helper function to format numbers with thousands separators
const formatWithCommas = (num: number): string => {
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const ComfortAnalysisChart: React.FC<ComfortAnalysisProps> = ({
  analysis,
  comfortTemp,
  onComfortTempChange
}) => {
  const comfortBuffer = 1; // ±1°C comfort range

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    onComfortTempChange(temp);
  };

  const totalHours = 8760; // Hours in a year (corrected)

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-600/40 shadow-2xl">
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">🏠</span>
        Comfort Analysis
      </h3>
      
      {/* Enhanced Comfort Temperature Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Comfort Temperature: {comfortTemp}°C (±{comfortBuffer}°C buffer)
        </label>
        <div className="relative">
          <input
            type="range"
            min="16"
            max="28"
            step="0.5"
            value={comfortTemp}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, 
                #3B82F6 0%, 
                #3B82F6 ${((comfortTemp - comfortBuffer - 16) / 12) * 100}%, 
                #10B981 ${((comfortTemp - comfortBuffer - 16) / 12) * 100}%, 
                #10B981 ${((comfortTemp + comfortBuffer - 16) / 12) * 100}%, 
                #EF4444 ${((comfortTemp + comfortBuffer - 16) / 12) * 100}%, 
                #EF4444 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>16°C</span>
            <span className="text-blue-400">Too Cold</span>
            <span className="text-green-400">Comfort Zone</span>
            <span className="text-red-400">Too Hot</span>
            <span>28°C</span>
          </div>
          {/* Comfort zone indicator */}
          <div className="absolute top-4 left-0 right-0 h-2 pointer-events-none">
            <div 
              className="absolute h-2 bg-green-400/30 rounded"
              style={{
                left: `${((comfortTemp - comfortBuffer - 16) / 12) * 100}%`,
                width: `${(2 * comfortBuffer / 12) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Degree Days Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg border border-blue-700/50 hover:from-blue-900/60 hover:to-blue-800/40 transition-all duration-200">
          <div className="text-blue-400 font-bold text-2xl mb-1">
            {formatNumber(analysis.heatingDegreeDays)}
          </div>
          <div className="text-blue-300 text-sm font-medium">Heating Degree Days</div>
          <div className="text-blue-200 text-xs mt-1 opacity-75">
            Daily average below comfort zone
          </div>
          <div className="text-blue-200 text-xs mt-1 opacity-60 font-mono">
            ({formatWithCommas(analysis.heatingDegreeDays)})
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg border border-red-700/50 hover:from-red-900/60 hover:to-red-800/40 transition-all duration-200">
          <div className="text-red-400 font-bold text-2xl mb-1">
            {formatNumber(analysis.coolingDegreeDays)}
          </div>
          <div className="text-red-300 text-sm font-medium">Cooling Degree Days</div>
          <div className="text-red-200 text-xs mt-1 opacity-75">
            Daily average above comfort zone
          </div>
          <div className="text-red-200 text-xs mt-1 opacity-60 font-mono">
            ({formatWithCommas(analysis.coolingDegreeDays)})
          </div>
        </div>
      </div>

      {/* Enhanced Degree Hours Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-lg border border-cyan-700/50 hover:from-cyan-900/60 hover:to-cyan-800/40 transition-all duration-200">
          <div className="text-cyan-400 font-bold text-2xl mb-1">
            {formatNumber(analysis.heatingDegreeHours)}
          </div>
          <div className="text-cyan-300 text-sm font-medium">Heating Degree Hours</div>
          <div className="text-cyan-200 text-xs mt-1 opacity-75">
            Hourly temperatures below comfort
          </div>
          <div className="text-cyan-200 text-xs mt-1 opacity-60 font-mono">
            ({formatWithCommas(analysis.heatingDegreeHours)})
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-lg border border-orange-700/50 hover:from-orange-900/60 hover:to-orange-800/40 transition-all duration-200">
          <div className="text-orange-400 font-bold text-2xl mb-1">
            {formatNumber(analysis.coolingDegreeHours)}
          </div>
          <div className="text-orange-300 text-sm font-medium">Cooling Degree Hours</div>
          <div className="text-orange-200 text-xs mt-1 opacity-75">
            Hourly temperatures above comfort
          </div>
          <div className="text-orange-200 text-xs mt-1 opacity-60 font-mono">
            ({formatWithCommas(analysis.coolingDegreeHours)})
          </div>
        </div>
      </div>

      {/* Enhanced Comfort Summary */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-200 mb-3">
          <span className="font-medium">Annual Comfort Percentage</span>
          <span className="font-bold text-lg text-green-400">{analysis.comfortPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-5 overflow-hidden border border-gray-600/30">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-5 rounded-full transition-all duration-500 shadow-lg relative"
            style={{ width: `${Math.min(analysis.comfortPercentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>{formatWithCommas(analysis.comfortableHours)} comfortable hours</span>
          <span>{formatWithCommas(totalHours)} total hours</span>
        </div>
      </div>

      {/* Enhanced Annual Hours Breakdown */}
      <div className="space-y-4">
        <div className="text-sm text-gray-200 font-medium flex items-center gap-2">
          <span className="text-lg">📊</span>
          Annual Hours Distribution
        </div>
        <div className="relative">
          <div className="h-10 flex rounded-lg overflow-hidden border border-gray-600/50 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium hover:from-blue-400 hover:to-blue-500 transition-all duration-200"
              style={{ width: `${(analysis.heatingDegreeHours / totalHours) * 100}%` }}
              title={`Heating: ${((analysis.heatingDegreeHours / totalHours) * 100).toFixed(1)}% (${formatWithCommas(analysis.heatingDegreeHours)} hours)`}
            >
              {((analysis.heatingDegreeHours / totalHours) * 100) > 12 ? 'Heating' : ''}
            </div>
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-medium hover:from-green-400 hover:to-green-500 transition-all duration-200"
              style={{ width: `${analysis.comfortPercentage}%` }}
              title={`Comfort: ${analysis.comfortPercentage.toFixed(1)}% (${formatWithCommas(analysis.comfortableHours)} hours)`}
            >
              {analysis.comfortPercentage > 15 ? 'Comfort Zone' : ''}
            </div>
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-medium hover:from-red-400 hover:to-red-500 transition-all duration-200"
              style={{ width: `${(analysis.coolingDegreeHours / totalHours) * 100}%` }}
              title={`Cooling: ${((analysis.coolingDegreeHours / totalHours) * 100).toFixed(1)}% (${formatWithCommas(analysis.coolingDegreeHours)} hours)`}
            >
              {((analysis.coolingDegreeHours / totalHours) * 100) > 12 ? 'Cooling' : ''}
            </div>
          </div>
        </div>
        
        {/* Enhanced Legend */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-center p-3 bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg border border-blue-700/40 hover:from-blue-900/50 hover:to-blue-800/30 transition-all duration-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 shadow-sm" />
            <div className="text-center">
              <div className="text-blue-300 font-medium">Heating</div>
              <div className="text-blue-400 text-xs">{((analysis.heatingDegreeHours / totalHours) * 100).toFixed(1)}%</div>
            </div>
          </div>
          <div className="flex items-center justify-center p-3 bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg border border-green-700/40 hover:from-green-900/50 hover:to-green-800/30 transition-all duration-200">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-sm" />
            <div className="text-center">
              <div className="text-green-300 font-medium">Comfort</div>
              <div className="text-green-400 text-xs">{analysis.comfortPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <div className="flex items-center justify-center p-3 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-lg border border-red-700/40 hover:from-red-900/50 hover:to-red-800/30 transition-all duration-200">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm" />
            <div className="text-center">
              <div className="text-red-300 font-medium">Cooling</div>
              <div className="text-red-400 text-xs">{((analysis.coolingDegreeHours / totalHours) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
