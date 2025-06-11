import React from 'react';
import { X, Trash2, Home, Building, Factory, Edit } from 'lucide-react';
import { BuildingData } from '../types/building';

interface BuildingDetailsPanelProps {
  building: BuildingData;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const BuildingDetailsPanel: React.FC<BuildingDetailsPanelProps> = ({
  building,
  onClose,
  onDelete,
  onEdit
}) => {
  const getBuildingIcon = (type: string) => {
    switch (type) {
      case 'residential': return <Home className="w-5 h-5" />;
      case 'commercial': return <Building className="w-5 h-5" />;
      case 'industrial': return <Factory className="w-5 h-5" />;
      default: return <Building className="w-5 h-5" />;
    }
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
    <div className="fixed top-6 right-6 bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-gray-700 w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={getBuildingTypeColor(building.buildingType)}>
            {getBuildingIcon(building.buildingType)}
          </div>
          <div>
            <h3 className="text-white font-bold">{building.name || 'Building Details'}</h3>
            {building.description && (
              <p className="text-xs text-gray-400 mt-1">{building.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Building Type */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Type</span>
            <span className={`font-medium capitalize ${getBuildingTypeColor(building.buildingType)}`}>
              {building.buildingType}
            </span>
          </div>
        </div>

        {/* Dimensions */}
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
          <h4 className="text-white font-medium text-sm mb-2">Dimensions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Area:</span>
              <span className="text-blue-400 font-medium">{building.area.toFixed(1)} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Floors:</span>
              <span className="text-green-400 font-medium">{building.floors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Floor Height:</span>
              <span className="text-purple-400 font-medium">{building.floorHeight}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total Height:</span>
              <span className="text-orange-400 font-medium">{(building.floors * building.floorHeight).toFixed(1)}m</span>
            </div>
          </div>
        </div>

        {/* Floor Details */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-white font-medium text-sm mb-2">Floor Information</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Floor Area:</span>
              <span className="text-cyan-400 font-medium">{(building.area * building.floors).toFixed(1)} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Usable Space:</span>
              <span className="text-yellow-400 font-medium">{(building.area * building.floors * 0.85).toFixed(1)} m²</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-white font-medium text-sm mb-2">Information</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">ID:</span>
              <span className="text-gray-400 font-mono text-xs">{building.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Created:</span>
              <span className="text-gray-400">{building.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Points:</span>
              <span className="text-gray-400">{building.points.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-700 space-y-2">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 
                      text-white rounded-lg transition-all duration-200 font-medium"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Building</span>
          </button>
          
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 
                      text-white rounded-lg transition-all duration-200 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Building</span>
          </button>
        </div>
      </div>
    </div>
  );
};