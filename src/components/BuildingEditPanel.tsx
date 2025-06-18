import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Layers, Palette } from 'lucide-react';
import { BuildingData, BuildingConfig } from '../types/building';

interface BuildingEditPanelProps {
  building: BuildingData;
  onClose: () => void;
  onSave: (updates: Partial<BuildingData> & { config?: BuildingConfig }) => void;
}

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

export const BuildingEditPanel: React.FC<BuildingEditPanelProps> = ({
  building,
  onClose,
  onSave
}) => {
  const [editedBuilding, setEditedBuilding] = useState({
    name: building.name || 'Unnamed Building',
    floors: building.floors,
    floorHeight: building.floorHeight,
    color: building.color || 0x3b82f6
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const originalData = {
      name: building.name || 'Unnamed Building',
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6
    };

    const hasChanged = JSON.stringify(editedBuilding) !== JSON.stringify(originalData);
    setHasChanges(hasChanged);
  }, [editedBuilding, building]);

  const updateField = (field: string, value: any) => {
    setEditedBuilding(prev => ({ ...prev, [field]: value }));
    
    // Apply color changes immediately for responsive feedback
    if (field === 'color' && building.mesh && building.mesh.material) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.color.setHex(value);
    }
  };

  const handleSave = () => {
    const updates = {
      name: editedBuilding.name,
      floors: editedBuilding.floors,
      floorHeight: editedBuilding.floorHeight,
      color: editedBuilding.color,
      config: {
        floors: editedBuilding.floors,
        floorHeight: editedBuilding.floorHeight,
        color: editedBuilding.color
      }
    };
    
    onSave(updates);
  };

  const handleReset = () => {
    const resetData = {
      name: building.name || 'Unnamed Building',
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6
    };
    
    setEditedBuilding(resetData);
    
    // Reset color in 3D view immediately
    if (building.mesh && building.mesh.material) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.color.setHex(resetData.color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Building</h2>
              <p className="text-sm text-gray-400">{building.name || 'Unnamed Building'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Building Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Building Name
            </label>
            <input
              type="text"
              value={editedBuilding.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter building name"
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5" />
              <span>Dimensions</span>
            </h3>

            {/* Floors */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Floors: {editedBuilding.floors}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={editedBuilding.floors}
                onChange={(e) => updateField('floors', parseInt(e.target.value))}
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
                Floor Height: {editedBuilding.floorHeight}m
              </label>
              <input
                type="range"
                min="2.5"
                max="6"
                step="0.1"
                value={editedBuilding.floorHeight}
                onChange={(e) => updateField('floorHeight', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>2.5m</span>
                <span>6.0m</span>
              </div>
            </div>

            {/* Calculated Values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Total Height:</span>
                  <span className="text-blue-400 font-bold">
                    {(editedBuilding.floors * editedBuilding.floorHeight).toFixed(1)}m
                  </span>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Floor Area:</span>
                  <span className="text-green-400 font-bold">
                    {building.area.toFixed(1)} m²
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </h3>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Building Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateField('color', color.value)}
                    className={`w-full h-12 rounded-lg border-2 transition-all ${
                      editedBuilding.color === color.value
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: `#${color.value.toString(16).padStart(6, '0')}` }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Building Stats */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-white font-medium text-sm mb-3">Building Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Floor Area:</span>
                  <span className="text-cyan-400 font-medium">
                    {(building.area * editedBuilding.floors).toFixed(1)} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Usable Space:</span>
                  <span className="text-yellow-400 font-medium">
                    {(building.area * editedBuilding.floors * 0.85).toFixed(1)} m²
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Points:</span>
                  <span className="text-purple-400 font-medium">{building.points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Created:</span>
                  <span className="text-gray-400 font-medium">
                    {building.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white 
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 
                        disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                        transition-all duration-200 font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};