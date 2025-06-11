import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Home, Building, Factory, Edit3, Layers, Ruler } from 'lucide-react';
import { BuildingData, BuildingConfig } from '../types/building';

interface BuildingEditPanelProps {
  building: BuildingData;
  onClose: () => void;
  onSave: (updates: Partial<BuildingData> & { config?: BuildingConfig }) => void;
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

export const BuildingEditPanel: React.FC<BuildingEditPanelProps> = ({
  building,
  onClose,
  onSave
}) => {
  const [editedBuilding, setEditedBuilding] = useState({
    name: building.name || `${building.buildingType} Building`,
    buildingType: building.buildingType,
    floors: building.floors,
    floorHeight: building.floorHeight,
    color: building.color || 0x3b82f6,
    enableShadows: building.enableShadows !== false,
    description: building.description || ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const originalData = {
      name: building.name || `${building.buildingType} Building`,
      buildingType: building.buildingType,
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6,
      enableShadows: building.enableShadows !== false,
      description: building.description || ''
    };

    const hasChanged = JSON.stringify(editedBuilding) !== JSON.stringify(originalData);
    setHasChanges(hasChanged);
  }, [editedBuilding, building]);

  const updateField = (field: string, value: any) => {
    setEditedBuilding(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updates = {
      name: editedBuilding.name,
      buildingType: editedBuilding.buildingType,
      floors: editedBuilding.floors,
      floorHeight: editedBuilding.floorHeight,
      color: editedBuilding.color,
      enableShadows: editedBuilding.enableShadows,
      description: editedBuilding.description,
      config: {
        floors: editedBuilding.floors,
        floorHeight: editedBuilding.floorHeight,
        color: editedBuilding.color,
        enableShadows: editedBuilding.enableShadows,
        buildingType: editedBuilding.buildingType as 'residential' | 'commercial' | 'industrial'
      }
    };
    
    onSave(updates);
  };

  const handleReset = () => {
    setEditedBuilding({
      name: building.name || `${building.buildingType} Building`,
      buildingType: building.buildingType,
      floors: building.floors,
      floorHeight: building.floorHeight,
      color: building.color || 0x3b82f6,
      enableShadows: building.enableShadows !== false,
      description: building.description || ''
    });
  };

  const getBuildingIcon = (type: string) => {
    const buildingType = buildingTypes.find(t => t.id === type);
    if (buildingType) {
      const IconComponent = buildingType.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <Building className="w-5 h-5" />;
  };

  const getBuildingTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'text-green-400';
      case 'commercial': return 'text-blue-400';
      case 'industrial': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={getBuildingTypeColor(editedBuilding.buildingType)}>
              {getBuildingIcon(editedBuilding.buildingType)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Building</h2>
              <p className="text-sm text-gray-400">ID: {building.id}</p>
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Edit3 className="w-5 h-5" />
              <span>Basic Information</span>
            </h3>
            
            {/* Building Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Building Name</label>
              <input
                type="text"
                value={editedBuilding.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white 
                          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter building name..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={editedBuilding.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white 
                          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Enter building description..."
              />
            </div>

            {/* Building Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Building Type</label>
              <div className="grid grid-cols-1 gap-2">
                {buildingTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => updateField('buildingType', type.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        editedBuilding.buildingType === type.id
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
              <Ruler className="w-5 h-5" />
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

            {/* Advanced Options */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Enable Shadows</span>
              <button
                onClick={() => updateField('enableShadows', !editedBuilding.enableShadows)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editedBuilding.enableShadows ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editedBuilding.enableShadows ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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