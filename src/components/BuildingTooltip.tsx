import React from 'react';
import { Edit, Trash2, Building } from 'lucide-react';
import { BuildingData } from '../types/building';

interface BuildingTooltipProps {
  building: BuildingData;
  position: { x: number; y: number };
  onEdit: (building: BuildingData) => void;
  onDelete: (buildingId: string) => void;
  onClose: () => void;
}

export const BuildingTooltip: React.FC<BuildingTooltipProps> = ({
  building,
  position,
  onEdit,
  onDelete,
  onClose
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(building);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${building.name || 'Unnamed Building'}"?`)) {
      onDelete(building.id);
      onClose();
    }
  };

  return (
    <>
      {/* Invisible backdrop to close tooltip */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Tooltip */}
      <div
        className="fixed z-50 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-600 p-4 min-w-64"
        style={{
          left: Math.min(position.x, window.innerWidth - 280),
          top: Math.max(position.y - 120, 10),
          transform: position.x > window.innerWidth - 280 ? 'translateX(-100%)' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: `#${(building.color || 0x3b82f6).toString(16).padStart(6, '0')}` }}
          />
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">
            {building.name || 'Unnamed Building'}
          </span>
        </div>

        {/* Building Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Area:</span>
            <span className="text-green-400 font-medium">{building.area.toFixed(1)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Floors:</span>
            <span className="text-blue-400 font-medium">{building.floors}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Height:</span>
            <span className="text-purple-400 font-medium">
              {(building.floors * building.floorHeight).toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 
                      text-white rounded text-sm transition-colors flex-1"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 
                      text-white rounded text-sm transition-colors flex-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </>
  );
};
