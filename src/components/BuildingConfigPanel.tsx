import React from 'react';
import { X } from 'lucide-react';
import { BuildingConfig } from '../types/building';
import { getThemeColorAsHex } from '../utils/themeColors';

interface BuildingConfigPanelProps {
  config: BuildingConfig;
  onConfigChange: (config: BuildingConfig) => void;
  onClose: () => void;
}

const colorOptions = [
  { name: 'Blue', value: getThemeColorAsHex('--color-building-blue', 0x3b82f6) },
  { name: 'Green', value: getThemeColorAsHex('--color-building-green', 0x10b981) },
  { name: 'Purple', value: getThemeColorAsHex('--color-building-purple', 0x8b5cf6) },
  { name: 'Orange', value: getThemeColorAsHex('--color-building-orange', 0xf59e0b) },
  { name: 'Red', value: getThemeColorAsHex('--color-building-red', 0xef4444) },
  { name: 'Cyan', value: getThemeColorAsHex('--color-building-cyan', 0x06b6d4) },
  { name: 'Pink', value: getThemeColorAsHex('--color-building-pink', 0xec4899) },
  { name: 'Gray', value: getThemeColorAsHex('--color-building-gray', 0x6b7280) }
];

export const BuildingConfigPanel: React.FC<BuildingConfigPanelProps> = ({
  config,
  onConfigChange,
  onClose
}) => {
  const updateConfig = (updates: Partial<BuildingConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="fixed top-6 left-80 bg-gray-900/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-700 w-64">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-xs">Building Configuration</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Floors */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Floors: {config.floors}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={config.floors}
            onChange={(e) => updateConfig({ floors: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Floor Height */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Height: {config.floorHeight}m
          </label>
          <input
            type="range"
            min="2.5"
            max="6"
            step="0.1"
            value={config.floorHeight}
            onChange={(e) => updateConfig({ floorHeight: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>2.5m</span>
            <span>6.0m</span>
          </div>
        </div>

        {/* Total Height Display */}
        <div className="bg-gray-800/50 rounded-lg p-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-xs">Total:</span>
            <span className="text-blue-400 font-bold text-xs">
              {(config.floors * config.floorHeight).toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Color</label>
          <div className="grid grid-cols-4 gap-1">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => updateConfig({ color: color.value })}
                className={`w-full h-6 rounded border-2 transition-all ${
                  config.color === color.value
                    ? 'border-white scale-105'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: `#${color.value.toString(16).padStart(6, '0')}` }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};