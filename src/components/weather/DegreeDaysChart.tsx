import React, { useState } from 'react';

interface DegreeDaysChartProps {
  dailyTemperatures: number[];
  comfortTemp: number;
  comfortBuffer: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  onComfortTempChange: (temp: number) => void;
}

export const DegreeDaysChart: React.FC<DegreeDaysChartProps> = ({
  dailyTemperatures,
  comfortTemp,
  comfortBuffer,
  heatingDegreeDays,
  coolingDegreeDays,
  onComfortTempChange
}) => {
  const [inputTemp, setInputTemp] = useState(comfortTemp.toString());

  const handleTempChange = (value: string) => {
    setInputTemp(value);
    const temp = parseFloat(value);
    if (!isNaN(temp) && temp >= 10 && temp <= 35) {
      onComfortTempChange(temp);
    }
  };
  // Calculate daily degree days
  const dailyData = dailyTemperatures.map((temp, index) => {
    const dayOfYear = index + 1;
    const month = Math.floor(dayOfYear / 30.4) + 1; // Approximate month
    
    let heatingDD = 0;
    let coolingDD = 0;
    
    if (temp < comfortTemp - comfortBuffer) {
      heatingDD = (comfortTemp - temp);
    } else if (temp > comfortTemp + comfortBuffer) {
      coolingDD = (temp - comfortTemp);
    }
    
    return {
      day: dayOfYear,
      month,
      temperature: temp,
      heatingDD,
      coolingDD
    };
  });

  // Find max values for scaling
  const maxHeatingDD = Math.max(...dailyData.map(d => d.heatingDD));
  const maxCoolingDD = Math.max(...dailyData.map(d => d.coolingDD));
  const maxDD = Math.max(maxHeatingDD, maxCoolingDD);

  // Calculate monthly totals
  const monthlyTotals = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthData = dailyData.filter(d => Math.floor((d.day - 1) / 30.4) === monthIndex);
    return {
      month: monthIndex + 1,
      heatingDDs: monthData.reduce((sum, d) => sum + d.heatingDD, 0),
      coolingDDs: monthData.reduce((sum, d) => sum + d.coolingDD, 0)
    };
  });

  const totalHeatingDDs = monthlyTotals.reduce((sum, m) => sum + m.heatingDDs, 0);
  const totalCoolingDDs = monthlyTotals.reduce((sum, m) => sum + m.coolingDDs, 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-600/40 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-2xl">📊</span>
          Heating and Cooling Degree Days
        </h3>
        
        {/* Comfort Temperature Control */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300">
            Comfort Temperature:
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="35"
              step="0.5"
              value={inputTemp}
              onChange={(e) => handleTempChange(e.target.value)}
              className="w-20 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm
                       focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
              °C
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-lg border border-blue-700/50 hover:from-blue-900/60 hover:to-blue-800/40 transition-all duration-200">
          <div className="text-blue-400 font-bold text-2xl">{heatingDegreeDays.toFixed(0)}</div>
          <div className="text-blue-300 text-sm font-medium">Annual HDDs</div>
          <div className="text-blue-200 text-xs mt-1 opacity-75">
            {totalHeatingDDs.toFixed(0)} calculated
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg border border-green-700/50 hover:from-green-900/60 hover:to-green-800/40 transition-all duration-200">
          <div className="text-green-400 font-bold text-2xl">{comfortTemp}°C ±{comfortBuffer}°</div>
          <div className="text-green-300 text-sm font-medium">Comfort Range</div>
          <div className="text-green-200 text-xs mt-1 opacity-75">
            {(comfortTemp - comfortBuffer)}°C - {(comfortTemp + comfortBuffer)}°C
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg border border-red-700/50 hover:from-red-900/60 hover:to-red-800/40 transition-all duration-200">
          <div className="text-red-400 font-bold text-2xl">{coolingDegreeDays.toFixed(0)}</div>
          <div className="text-red-300 text-sm font-medium">Annual CDDs</div>
          <div className="text-red-200 text-xs mt-1 opacity-75">
            {totalCoolingDDs.toFixed(0)} calculated
          </div>
        </div>
      </div>

      {/* Wide Daily Degree Days Chart */}
      <div className="relative h-80 bg-gray-900/60 rounded-lg border border-gray-600/40 p-4 mb-6">
        <div className="absolute inset-4">
          <svg width="100%" height="100%" viewBox="0 0 365 280" className="overflow-visible">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="30.4" height="20" patternUnits="userSpaceOnUse">
                <path d="M 30.4 0 L 0 0 0 20" fill="none" stroke="rgb(75, 85, 99)" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="365" height="200" fill="url(#grid)" />
            
            {/* Zero line */}
            <line x1="0" y1="100" x2="365" y2="100" stroke="rgb(156, 163, 175)" strokeWidth="1" opacity="0.6" />
            
            {/* Month labels */}
            {months.map((month, index) => (
              <text
                key={month}
                x={index * 30.4 + 15}
                y="195"
                textAnchor="middle"
                className="fill-gray-400 text-xs font-medium"
              >
                {month}
              </text>
            ))}
            
            {/* Y-axis labels */}
            <text x="-5" y="25" textAnchor="end" className="fill-gray-400 text-xs">+{maxDD.toFixed(0)}</text>
            <text x="-5" y="105" textAnchor="end" className="fill-gray-400 text-xs">0</text>
            <text x="-5" y="185" textAnchor="end" className="fill-gray-400 text-xs">-{maxDD.toFixed(0)}</text>
            
            {/* Daily data points */}
            {dailyData.map((data, index) => {
              const x = index * (365 / dailyData.length);
              const heatingY = 100 + (data.heatingDD / maxDD) * 80;
              const coolingY = 100 - (data.coolingDD / maxDD) * 80;
              
              return (
                <g key={index}>
                  {/* Heating degree day (below zero line) */}
                  {data.heatingDD > 0 && (
                    <rect
                      x={x - 0.5}
                      y="100"
                      width="1"
                      height={heatingY - 100}
                      fill="rgb(239, 68, 68)"
                      opacity="0.8"
                    >
                      <title>Day {data.day}: {data.heatingDD.toFixed(1)} HDD</title>
                    </rect>
                  )}
                  
                  {/* Cooling degree day (above zero line) */}
                  {data.coolingDD > 0 && (
                    <rect
                      x={x - 0.5}
                      y={coolingY}
                      width="1"
                      height={100 - coolingY}
                      fill="rgb(59, 130, 246)"
                      opacity="0.8"
                    >
                      <title>Day {data.day}: {data.coolingDD.toFixed(1)} CDD</title>
                    </rect>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Chart labels */}
        <div className="absolute top-2 left-4 text-xs text-blue-400 font-medium">CDD</div>
        <div className="absolute bottom-2 left-4 text-xs text-red-400 font-medium">HDD</div>
      </div>

      {/* Monthly Breakdown */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
          <span className="text-lg">📅</span>
          Monthly Degree Days
        </div>
        <div className="grid grid-cols-2 gap-4">
          {monthlyTotals.map((monthly, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/40 rounded-lg border border-gray-600/40">
              <div className="text-gray-300 font-medium">{months[index]}</div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">{monthly.heatingDDs.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-400">{monthly.coolingDDs.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-red-400">Heating Degree Days</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-blue-400">Cooling Degree Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
