import React from 'react';
import { X, Home, Building, Factory } from 'lucide-react';
import { BuildingConfig } from '../types/building';

interface BuildingConfigPanelProps {
  config: BuildingConfig;
  onConfigChange: (config: BuildingConfig) => void;
  onClose: () => void;
}

const buildingTypes = [
  { id: 'residential', name: 'Residential', icon: Home, color: 0x10b981 },
  { id: 'commercial', name: 'Commercial', icon: Building, color: 0x3b82f6 },
  { id: 'industrial', name: 'Industrial', icon: Factory, color: 0xf59e0b }
];

const colorOptions = [
  { name: 'Blue', value: 0x3b82f6 },
  { name: 'Green', value: 0x10b981 },
  { name: 'Purple', value: 0x8b5cf6 },
  { name: 'Orange', value: 0xf59e0b },
  { name: 'Red', value: 0xef4444 },
  { name: 'Cyan', value: 0x06b6d4 },
  { name: 'Pink', value: 0xec4899 },
  { name: 'Gray', value: 0x6b7280 }
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
    <div className="fixed top-6 left-80 bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-gray-700 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">Building Configuration</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Building Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Building Type</label>
          <div className="grid grid-cols-1 gap-2">
            {buildingTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => updateConfig({ 
                    buildingType: type.id as any,
                    color: type.color 
                  })}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                    config.buildingType === type.id
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floors */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Floors: {config.floors}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={config.floors}
            onChange={(e) => updateConfig({ floors: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {/* Floor Height */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Floor Height: {config.floorHeight}m
          </label>
          <input
            type="range"
            min="2.5"
            max="6"
            step="0.1"
            value={config.floorHeight}
            onChange={(e) => updateConfig({ floorHeight: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2.5m</span>
            <span>6.0m</span>
          </div>
        </div>

        {/* Total Height Display */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Total Height:</span>
            <span className="text-blue-400 font-bold">
              {(config.floors * config.floorHeight).toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Building Color</label>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => updateConfig({ color: color.value })}
                className={`w-full h-10 rounded-lg border-2 transition-all ${
                  config.color === color.value
                    ? 'border-white scale-110'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                style={{ backgroundColor: `#${color.value.toString(16).padStart(6, '0')}` }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Enable Shadows</span>
            <button
              onClick={() => updateConfig({ enableShadows: !config.enableShadows })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enableShadows ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enableShadows ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};