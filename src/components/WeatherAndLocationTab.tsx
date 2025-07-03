import React, { useState, useRef } from 'react';
import { EPWParser, EPWProcessedData, ComfortAnalysis, WindRoseData } from '../services/EPWParser';
import { TemperatureChart } from './weather/TemperatureChart';
import { HumidityChart } from './weather/HumidityChart';
import { WindRose } from './weather/WindRose';
import { DegreeDaysChart } from './weather/DegreeDaysChart';
import { swedishCities, SwedishCity } from '../data/swedishCities';

export const WeatherAndLocationTab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<SwedishCity>({
    city: 'Gothenburg',
    region: 'Västra Götaland',
    latitude: 57.66300,
    longitude: 12.28000,
    timezone: 'Europe/Stockholm',
    zipUrl: 'https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/VG_Vastra_Gotaland/SWE_VG_Goteborg.City.AP.025120_TMYx.2009-2023.zip',
    epwFileName: 'SWE_VG_Goteborg.City.AP.025120_TMYx.2009-2023.epw'
  });

  const [weatherData, setWeatherData] = useState<EPWProcessedData | null>(null);
  const [comfortAnalysis, setComfortAnalysis] = useState<ComfortAnalysis | null>(null);
  const [windRoseData, setWindRoseData] = useState<WindRoseData | null>(null);
  const [comfortTemp, setComfortTemp] = useState(21);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ count: number; totalSize: number; entries: Array<{ fileName: string; timestamp: Date; size: number }> }>({ count: 0, totalSize: 0, entries: [] });

  const loadWeatherData = async (location: SwedishCity) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading weather data for ${location.city}`);
      
      // Use proxy URL in development, direct URL in production
      const isDevelopment = import.meta.env.DEV;
      const zipUrl = isDevelopment 
        ? location.zipUrl.replace('https://climate.onebuilding.org', '/api/climate')
        : location.zipUrl;
      
      // Use EPWParser's cached remote ZIP method
      const data = await EPWParser.parseEPWFromRemoteZip(zipUrl, location.epwFileName);
      
      setWeatherData(data);
      
      // Calculate comfort analysis
      const comfort = EPWParser.calculateComfortAnalysis(data.hourlyData, comfortTemp);
      setComfortAnalysis(comfort);
      
      // Generate wind rose data
      const windRose = EPWParser.generateWindRoseData(data.hourlyData);
      setWindRoseData(windRose);
      
      // Update cache info for status display
      updateCacheInfo();
      
    } catch (err) {
      console.error('Failed to load weather data:', err);
      if (err instanceof Error && err.message.includes('quota')) {
        setError(`Storage limit reached. ${err.message}. Try clearing the cache or using a smaller EPW file.`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load weather data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (location: SwedishCity) => {
    setSelectedLocation(location);
    await loadWeatherData(location);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.epw')) {
      setError('Please select a valid EPW file');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await EPWParser.parseEPWFile(file);
      setWeatherData(data);
      
      // Update selected location with file data
      setSelectedLocation({
        city: data.header.location || 'Custom Location',
        region: data.header.country || 'Unknown',
        latitude: data.header.latitude,
        longitude: data.header.longitude,
        timezone: 'Europe/Stockholm', // Default for custom files
        zipUrl: '',
        epwFileName: file.name
      });
      
      // Calculate comfort analysis
      const comfort = EPWParser.calculateComfortAnalysis(data.hourlyData, comfortTemp);
      setComfortAnalysis(comfort);
      
      // Generate wind rose data
      const windRose = EPWParser.generateWindRoseData(data.hourlyData);
      setWindRoseData(windRose);
      
    } catch (err) {
      console.error('Failed to parse EPW file:', err);
      if (err instanceof Error && err.message.includes('quota')) {
        setError(`Storage limit reached. ${err.message}. Try clearing the cache or using a smaller EPW file.`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to parse EPW file');
      }
    } finally {
      setIsLoading(false);
      // Update cache info after any operation
      updateCacheInfo();
    }
  };

  const handleComfortTempChange = (newTemp: number) => {
    setComfortTemp(newTemp);
    if (weatherData) {
      const comfort = EPWParser.calculateComfortAnalysis(weatherData.hourlyData, newTemp);
      setComfortAnalysis(comfort);
    }
  };

  // Update cache info
  const updateCacheInfo = () => {
    const info = EPWParser.getCacheInfo();
    setCacheInfo(info);
  };

  // Get cache status for warnings
  const getCacheStatus = () => {
    return EPWParser.getCacheStatus();
  };

  // Clear cache
  const handleClearCache = () => {
    EPWParser.clearCache();
    updateCacheInfo();
  };

  // Toggle cache info display
  const toggleCacheInfo = () => {
    if (!showCacheInfo) {
      updateCacheInfo();
    }
    setShowCacheInfo(!showCacheInfo);
  };

  // Load default weather data on mount
  React.useEffect(() => {
    loadWeatherData(selectedLocation);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-b border-blue-700/30 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">🌤️</span>
            Weather & Climate Analysis
          </h1>
          <p className="text-blue-200 text-lg">
            Configure location and analyze climate data for building performance
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900/95 rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-white text-xl font-bold mb-2">Loading Weather Data</h3>
                <p className="text-gray-300">Parsing EPW file and generating analysis...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 rounded-xl p-6 border border-red-600/50 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="text-red-400 text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-red-200 text-lg font-semibold mb-2">Error Loading Weather Data</h3>
                  <p className="text-red-300 mb-4">{error}</p>
                  
                  {error.includes('CORS') || error.includes('Failed to fetch') && (
                    <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4 mb-4">
                      <h4 className="text-yellow-200 font-semibold mb-2 flex items-center gap-2">
                        <span>ℹ️</span>
                        CORS Limitation Notice
                      </h4>
                      <p className="text-yellow-100 text-sm mb-3">
                        Due to browser security policies, we cannot directly download weather data from Climate.OneBuilding.org. 
                        However, you can still access the weather data by:
                      </p>
                      <ul className="text-yellow-100 text-sm space-y-1 mb-3">
                        <li>• Manually downloading EPW files from the source link below</li>
                        <li>• Using the "Upload EPW File" feature above</li>
                        <li>• Running the application from a server with proper CORS configuration</li>
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        <a 
                          href="https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600/80 hover:bg-yellow-600 
                                   text-white rounded-lg transition-all duration-200 font-medium text-sm"
                        >
                          <span>🔗</span>
                          Download EPW Files
                        </a>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600/80 hover:bg-blue-600 
                                   text-white rounded-lg transition-all duration-200 font-medium text-sm"
                        >
                          <span>📂</span>
                          Upload EPW File
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg 
                             transition-all duration-200 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cache Status Warning */}
          {(() => {
            const status = getCacheStatus();
            return status.isNearLimit && (
              <div className="bg-gradient-to-r from-yellow-900/80 to-orange-900/80 rounded-xl p-4 border border-yellow-600/50 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-400 text-2xl">💾</div>
                  <div className="flex-1">
                    <h3 className="text-yellow-200 text-lg font-semibold mb-1">Cache Storage Nearly Full</h3>
                    <p className="text-yellow-100 text-sm mb-3">
                      Cache is {status.usagePercent.toFixed(1)}% full ({(status.totalSize / 1024 / 1024).toFixed(1)} MB used). 
                      Consider clearing old cache entries to ensure smooth operation.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearCache}
                        className="px-3 py-1 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded 
                                 transition-all duration-200 font-medium text-sm"
                      >
                        Clear Cache
                      </button>
                      <button
                        onClick={toggleCacheInfo}
                        className="px-3 py-1 bg-orange-600/80 hover:bg-orange-600 text-white rounded 
                                 transition-all duration-200 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Current Location & File Upload */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-600/30 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Current Selection */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Current Location
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">City</div>
                    <div className="text-white font-semibold">{selectedLocation.city}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Region</div>
                    <div className="text-white font-semibold">{selectedLocation.region}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Coordinates</div>
                    <div className="text-cyan-400 font-mono text-sm">
                      {selectedLocation.latitude.toFixed(2)}°N, {Math.abs(selectedLocation.longitude).toFixed(2)}°E
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Data Source</div>
                    <div className="text-green-400 font-mono text-xs">
                      Climate.OneBuilding
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-xl">📂</span>
                  Custom EPW File
                </h2>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors duration-200">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".epw"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <div className="text-2xl mb-2">☁️</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 
                             text-white rounded-lg transition-all duration-200 font-medium shadow-lg
                             ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Upload EPW File
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Select a custom .epw weather file
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Swedish Cities Grid */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 border border-gray-600/30 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">🇸🇪</span>
              Swedish Cities
            </h2>
            
            {/* CORS Notice */}
            <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✅</span>
                <div>
                  <h4 className="text-green-200 font-medium text-sm mb-1">Proxy Configuration Active</h4>
                  <p className="text-green-100 text-xs">
                    Development server is configured with CORS proxy. City data should load automatically.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {swedishCities.map((city) => (
                <button
                  key={`${city.city}-${city.region}`}
                  onClick={() => handleLocationSelect(city)}
                  disabled={isLoading}
                  className={`p-2 rounded-lg text-left transition-all duration-200 border ${
                    selectedLocation.city === city.city && selectedLocation.region === city.region
                      ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-500/60 text-blue-300 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-700/40 border-gray-600/40 text-gray-300 hover:bg-gray-600/40 hover:border-gray-500/60'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium text-sm mb-1">{city.city}</div>
                  <div className="text-xs opacity-75 mb-1">{city.region}</div>
                  <div className="text-xs font-mono opacity-60">
                    {city.latitude.toFixed(1)}°N
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weather Data Visualizations */}
          {weatherData && (
            <div className="space-y-8">
              {/* Temperature Chart - Full Width */}
              <TemperatureChart
                monthlyTemperatures={weatherData.monthlyAverages.temperature}
                minTemp={weatherData.annualStats.minTemperature}
                maxTemp={weatherData.annualStats.maxTemperature}
                avgTemp={weatherData.annualStats.avgTemperature}
                hourlyData={weatherData.hourlyData?.map((point) => ({
                  dryBulbTemp: point.dryBulbTemperature,
                  hour: point.hour,
                  day: point.day,
                  month: point.month
                }))}
              />

              {/* Humidity Chart */}
              <HumidityChart
                monthlyHumidity={weatherData.monthlyAverages.humidity}
                avgHumidity={weatherData.annualStats.avgHumidity}
              />

              {/* Degree Days Chart - Full Width */}
              {weatherData.dailyAverages && comfortAnalysis && (
                <DegreeDaysChart
                  dailyTemperatures={weatherData.dailyAverages.temperature}
                  comfortTemp={comfortTemp}
                  comfortBuffer={1}
                  heatingDegreeDays={comfortAnalysis.heatingDegreeDays}
                  coolingDegreeDays={comfortAnalysis.coolingDegreeDays}
                  onComfortTempChange={handleComfortTempChange}
                />
              )}

              {/* Bottom Row - Wind Rose */}
              <div className="flex justify-center">
                {windRoseData && (
                  <div className="w-full max-w-2xl">
                    <WindRose
                      windRoseData={windRoseData}
                      avgWindSpeed={weatherData.annualStats.avgWindSpeed}
                      predominantDirection={weatherData.annualStats.predominantWindDirection}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Climate Summary */}
          {weatherData && (
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Climate Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Data Source</div>
                  <div className="text-white font-medium">{weatherData.header.dataSource}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Station ID</div>
                  <div className="text-white font-medium">{weatherData.header.stationId}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Elevation</div>
                  <div className="text-white font-medium">{weatherData.header.elevation.toFixed(0)} m</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Timezone</div>
                  <div className="text-white font-medium">{selectedLocation.timezone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Cache Management */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-6 border border-gray-600/30 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-2xl">💾</span>
              Cache Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">
                  Weather data is cached locally to improve performance and reduce network requests.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleCacheInfo}
                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg 
                             transition-all duration-200 font-medium"
                  >
                    {showCacheInfo ? 'Hide' : 'Show'} Cache Info
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg 
                             transition-all duration-200 font-medium"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
              
              {showCacheInfo && (
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                  {(() => {
                    const status = getCacheStatus();
                    return (
                      <>
                        {status.isNearLimit && (
                          <div className="bg-yellow-900/50 border border-yellow-600/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-yellow-200 text-sm font-medium">
                              <span>⚠️</span>
                              Cache Near Limit ({status.usagePercent.toFixed(1)}% used)
                            </div>
                            <p className="text-yellow-100 text-xs mt-1">
                              Consider clearing old cache entries to avoid storage issues.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-gray-400 text-sm">Cached Files</div>
                            <div className="text-white font-semibold">{cacheInfo.count}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm">Used Space</div>
                            <div className="text-white font-semibold">
                              {(cacheInfo.totalSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-sm">Cache Limit</div>
                            <div className="text-white font-semibold">
                              {(status.maxSize / 1024 / 1024).toFixed(0)} MB
                            </div>
                          </div>
                        </div>
                        
                        {/* Cache usage bar */}
                        <div className="w-full bg-gray-600/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              status.usagePercent > 90 ? 'bg-red-500' : 
                              status.usagePercent > 80 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(status.usagePercent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-gray-400 text-xs text-center">
                          {status.usagePercent.toFixed(1)}% of cache limit used
                        </div>
                      </>
                    );
                  })()}
                  
                  {cacheInfo.entries.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <div className="text-gray-400 text-sm font-medium">Cached Files:</div>
                      {cacheInfo.entries.map((entry, index) => (
                        <div key={index} className="bg-gray-600/30 rounded p-2 text-sm">
                          <div className="text-white font-mono">{entry.fileName}</div>
                          <div className="text-gray-400 flex justify-between">
                            <span>{entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}</span>
                            <span>{(entry.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Data Source Attribution */}
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-6 border border-blue-700/30 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
              <span className="text-xl">🌍</span>
              Climate Data Source
            </h2>
            <div className="space-y-4">
              <p className="text-blue-200">
                Weather data is sourced from <strong>Climate.OneBuilding.org</strong>, providing 
                high-quality TMY (Typical Meteorological Year) data for building energy analysis.
              </p>
              
              <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-blue-200 font-semibold mb-2">How to Access Weather Data:</h4>
                <ol className="text-blue-100 text-sm space-y-2">
                  <li>1. Visit the Sweden climate data page using the link below</li>
                  <li>2. Navigate to your desired city/region folder</li>
                  <li>3. Download the appropriate .zip file (contains .epw weather data)</li>
                  <li>4. Extract the .epw file from the zip</li>
                  <li>5. Use the "Upload EPW File" feature above to analyze the data</li>
                </ol>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="https://climate.onebuilding.org/WMO_Region_6_Europe/SWE_Sweden/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 
                           text-white rounded-lg transition-all duration-200 font-medium"
                >
                  <span>🔗</span>
                  Download Sweden Climate Data
                </a>
                <span className="text-blue-300 text-sm">
                  2009-2023 TMY Data Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
