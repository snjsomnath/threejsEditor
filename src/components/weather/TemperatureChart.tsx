import React from 'react';

interface TemperatureChartProps {
  monthlyTemperatures: number[];
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({
  monthlyTemperatures,
  minTemp,
  maxTemp,
  avgTemp
}) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Normalize temperatures for visualization (0-100 scale)
  const tempRange = maxTemp - minTemp;
  const normalizedTemps = monthlyTemperatures.map(temp => 
    tempRange > 0 ? ((temp - minTemp) / tempRange) * 100 : 50
  );

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/30 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">🌡️</span>
        Annual Temperature Profile
      </h3>
      
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-700/30">
          <div className="text-blue-400 font-bold text-2xl">{minTemp.toFixed(1)}°C</div>
          <div className="text-blue-300 text-sm font-medium">Minimum</div>
        </div>
        <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-700/30">
          <div className="text-green-400 font-bold text-2xl">{avgTemp.toFixed(1)}°C</div>
          <div className="text-green-300 text-sm font-medium">Average</div>
        </div>
        <div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-700/30">
          <div className="text-red-400 font-bold text-2xl">{maxTemp.toFixed(1)}°C</div>
          <div className="text-red-300 text-sm font-medium">Maximum</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 bg-gray-900/50 rounded-lg border border-gray-600/30 p-4">
        <div className="absolute inset-0 flex items-end justify-around p-4">
          {normalizedTemps.map((temp, index) => (
            <div key={months[index]} className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div
                  className="w-8 bg-gradient-to-t from-blue-500 via-green-500 to-red-500 rounded-t transition-all duration-300 group-hover:w-10"
                  style={{ height: `${Math.max(temp, 8)}%` }}
                  title={`${months[index]}: ${monthlyTemperatures[index].toFixed(1)}°C`}
                />
                {/* Temperature value on hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
                    {monthlyTemperatures[index].toFixed(1)}°C
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium transform -rotate-45 origin-center">
                {months[index]}
              </span>
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[25, 50, 75].map((percent) => (
            <div
              key={percent}
              className="absolute inset-x-0 border-t border-gray-600/20"
              style={{ bottom: `${percent}%` }}
            />
          ))}
        </div>
      </div>

      {/* Temperature scale */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <span>Annual temperature variation across months</span>
          <span>Range: {(maxTemp - minTemp).toFixed(1)}°C</span>
        </div>
      </div>
    </div>
  );
};
