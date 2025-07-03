import React from 'react';

interface HumidityChartProps {
  monthlyHumidity: number[];
  avgHumidity: number;
}

export const HumidityChart: React.FC<HumidityChartProps> = ({
  monthlyHumidity,
  avgHumidity
}) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const maxHumidity = Math.max(...monthlyHumidity);
  const minHumidity = Math.min(...monthlyHumidity);

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/30 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">💧</span>
        Annual Humidity Profile
      </h3>
      
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-700/30">
          <div className="text-blue-400 font-bold text-2xl">{minHumidity.toFixed(1)}%</div>
          <div className="text-blue-300 text-sm font-medium">Minimum</div>
        </div>
        <div className="text-center p-4 bg-cyan-900/30 rounded-lg border border-cyan-700/30">
          <div className="text-cyan-400 font-bold text-2xl">{avgHumidity.toFixed(1)}%</div>
          <div className="text-cyan-300 text-sm font-medium">Average</div>
        </div>
        <div className="text-center p-4 bg-teal-900/30 rounded-lg border border-teal-700/30">
          <div className="text-teal-400 font-bold text-2xl">{maxHumidity.toFixed(1)}%</div>
          <div className="text-teal-300 text-sm font-medium">Maximum</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 bg-gray-900/50 rounded-lg border border-gray-600/30 p-4">
        <div className="absolute inset-0 flex items-end justify-around p-4">
          {monthlyHumidity.map((humidity, index) => (
            <div key={months[index]} className="flex flex-col items-center space-y-2 group">
              <div className="relative">
                <div
                  className="w-8 bg-gradient-to-t from-blue-600 via-cyan-500 to-teal-400 rounded-t transition-all duration-300 group-hover:w-10"
                  style={{ height: `${Math.max(humidity, 8)}%` }}
                  title={`${months[index]}: ${humidity.toFixed(1)}%`}
                />
                {/* Humidity value on hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
                    {humidity.toFixed(1)}%
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium transform -rotate-45 origin-center">
                {months[index]}
              </span>
            </div>
          ))}
        </div>

        {/* Comfort zones */}
        <div className="absolute inset-x-0 pointer-events-none" style={{ bottom: '30%', height: '2px' }}>
          <div className="w-full h-full bg-green-500/40 rounded"></div>
          <span className="absolute right-2 -top-5 text-xs text-green-400 font-medium">30% (Min Comfort)</span>
        </div>
        <div className="absolute inset-x-0 pointer-events-none" style={{ bottom: '60%', height: '2px' }}>
          <div className="w-full h-full bg-green-500/40 rounded"></div>
          <span className="absolute right-2 -top-5 text-xs text-green-400 font-medium">60% (Max Comfort)</span>
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

      {/* Humidity interpretation */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="flex justify-between items-center mb-2">
          <span>Annual humidity variation across months</span>
          <span>Range: {(maxHumidity - minHumidity).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-red-500/60 rounded mr-2"></div>
            Dry (&lt;30%)
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-500/60 rounded mr-2"></div>
            Comfortable (30-60%)
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-blue-500/60 rounded mr-2"></div>
            Humid (&gt;60%)
          </span>
        </div>
      </div>
    </div>
  );
};
