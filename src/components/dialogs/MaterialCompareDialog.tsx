import React from 'react';
import { X, ArrowDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface MaterialOption {
  label: string;
  value: string;
  uValue?: number;
  co2?: number;
  cost?: number;
  lifespan?: number;
  pros?: string[];
  cons?: string[];
}

interface MaterialCompareDialogProps {
  title: string;
  options: MaterialOption[];
  currentValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  type: 'wall' | 'floor' | 'roof' | 'window' | 'structural';
}

export const MaterialCompareDialog: React.FC<MaterialCompareDialogProps> = ({
  title,
  options,
  currentValue,
  onClose,
  onSelect,
  type
}) => {  // Helper function to get descriptions based on type
  const getTypeInfo = () => {
    switch (type) {
      case 'wall':
        return {
          title: 'Wall Construction',
          description: 'The wall assembly affects thermal performance, embodied carbon, and cost. Lower U-values indicate better insulation.',
          uValueExplained: 'Heat transfer coefficient (W/m²K) - lower is better',
          co2Explained: 'Embodied carbon (kg CO₂e/m²) - lower is better',
          diagram: '🧱'
        };
      case 'floor':
        return {
          title: 'Floor Construction',
          description: 'Floor construction affects thermal mass, sound insulation, and heat loss to ground or unheated spaces.',
          uValueExplained: 'Heat transfer coefficient (W/m²K) - lower is better',
          co2Explained: 'Embodied carbon (kg CO₂e/m²) - lower is better',
          diagram: '🏗️'
        };
      case 'roof':
        return {
          title: 'Roof Construction',
          description: 'Roof insulation is critical for preventing heat loss in winter and heat gain in summer. It significantly impacts energy performance.',
          uValueExplained: 'Heat transfer coefficient (W/m²K) - lower is better',
          co2Explained: 'Embodied carbon (kg CO₂e/m²) - lower is better',
          diagram: '🏠'
        };
      case 'window':
        return {
          title: 'Window Construction',
          description: 'Windows affect daylighting, views, ventilation, and heat transfer. Multiple glazing layers and gas fills improve insulation.',
          uValueExplained: 'Heat transfer coefficient (W/m²K) - lower is better',
          co2Explained: 'Embodied carbon (kg CO₂e/m²) - lower is better',
          diagram: '🪟'
        };
      case 'structural':
        return {
          title: 'Structural System',
          description: 'The structural system transfers loads to the ground and gives the building its strength and stability. It affects spans, construction time, and embodied carbon.',
          uValueExplained: 'Structural efficiency - higher is better',
          co2Explained: 'Embodied carbon (kg CO₂e/m²) - lower is better',
          diagram: '🏛️'
        };
    }
  };

  const typeInfo = getTypeInfo();

  // Sort options by U-value (lowest first)
  const sortedOptions = [...options].sort((a, b) => {
    // Extract U-value from label if not provided directly
    const getUValue = (option: MaterialOption) => {
      if (option.uValue) return option.uValue;
      const match = option.label.match(/U: (\d+\.\d+)/);
      return match ? parseFloat(match[1]) : 999;
    };
    
    return getUValue(a) - getUValue(b);
  });

  // Helper function to render performance rating
  const renderRating = (value: number, max: number, better: 'lower' | 'higher') => {
    // Normalize to 0-5 scale
    let normalizedValue = better === 'lower' 
      ? 5 - ((value / max) * 5) 
      : (value / max) * 5;
    
    normalizedValue = Math.max(0, Math.min(5, normalizedValue));
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-5 rounded-sm ${
              i < normalizedValue 
                ? 'bg-green-500' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Extract U-values for all materials for normalization
  const allUValues = sortedOptions.map(opt => {
    const match = opt.label.match(/U: (\d+\.\d+)/);
    return match ? parseFloat(match[1]) : (opt.uValue || 0);
  });
  
  const maxUValue = Math.max(...allUValues);
  
  // Extract CO2 values for normalization
  const allCO2Values = sortedOptions.map(opt => {
    const match = opt.label.match(/CO₂: (\d+)/);
    return match ? parseInt(match[1]) : (opt.co2 || 0);
  });
  
  const maxCO2 = Math.max(...allCO2Values);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
            <div>
              <h2 className="text-lg font-semibold text-white">{typeInfo.title} Comparison</h2>
              <p className="text-sm text-gray-400 mt-1">{typeInfo.description}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Educational diagram */}
            <div className="mb-8 p-5 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{typeInfo.diagram}</div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">Key Performance Indicators</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-start space-x-2">
                      <ArrowDown className="w-4 h-4 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white">U-Value</p>
                        <p className="text-xs text-gray-400">{typeInfo.uValueExplained}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <ArrowDown className="w-4 h-4 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white">Embodied Carbon</p>
                        <p className="text-xs text-gray-400">{typeInfo.co2Explained}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Material comparison table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-800/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      U-Value
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Embodied Carbon
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Relative Performance
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedOptions.map((option, index) => {
                    // Extract values from label if not provided directly
                    const uValueMatch = option.label.match(/U: (\d+\.\d+)/);
                    const co2Match = option.label.match(/CO₂: (\d+)/);
                    
                    const uValue = option.uValue || (uValueMatch ? parseFloat(uValueMatch[1]) : null);
                    const co2 = option.co2 || (co2Match ? parseInt(co2Match[1]) : null);
                    
                    const isSelected = option.value === currentValue;
                    
                    return (
                      <tr 
                        key={option.value}
                        className={`${isSelected ? 'bg-blue-900/20' : index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} 
                                   hover:bg-gray-700/20 transition-colors`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-white">
                                {option.value}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 max-w-[200px]">
                                {option.pros && option.pros.length > 0 && (
                                  <div className="mt-1">
                                    <span className="text-green-400">✓</span> {option.pros[0]}
                                  </div>
                                )}
                                {option.cons && option.cons.length > 0 && (
                                  <div className="mt-1">
                                    <span className="text-red-400">✗</span> {option.cons[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-white">
                            {uValue ? `${uValue} W/m²K` : 'N/A'}
                          </div>
                          {uValue && uValue < 0.8 && (
                            <div className="text-xs text-green-400 mt-1">
                              Excellent insulation
                            </div>
                          )}
                          {uValue && uValue >= 0.8 && uValue < 1.5 && (
                            <div className="text-xs text-blue-400 mt-1">
                              Good insulation
                            </div>
                          )}
                          {uValue && uValue >= 1.5 && (
                            <div className="text-xs text-yellow-400 mt-1">
                              Basic insulation
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-white">
                            {co2 ? `${co2} kg/m²` : 'N/A'}
                          </div>
                          {co2 && co2 < 50 && (
                            <div className="text-xs text-green-400 mt-1">
                              Low carbon
                            </div>
                          )}
                          {co2 && co2 >= 50 && co2 < 100 && (
                            <div className="text-xs text-blue-400 mt-1">
                              Medium carbon
                            </div>
                          )}
                          {co2 && co2 >= 100 && (
                            <div className="text-xs text-yellow-400 mt-1">
                              High carbon
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400 w-14">Thermal:</span>
                              {uValue && renderRating(uValue, maxUValue, 'lower')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400 w-14">Carbon:</span>
                              {co2 && renderRating(co2, maxCO2, 'lower')}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                              Selected
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelect(option.value)}
                              className="inline-flex items-center px-3 py-1 border border-gray-600 rounded-lg text-xs font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                            >
                              Select
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between">
            <div className="flex items-center text-yellow-400 text-xs">
              <Info className="w-4 h-4 mr-2" />
              Selecting materials with lower U-values and embodied carbon improves building performance
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
