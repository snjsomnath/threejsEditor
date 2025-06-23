import React from 'react';
import { Eye, EyeOff, Grid3X3, Activity } from 'lucide-react';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

interface BottomToolbarProps {
  showGrid: boolean;
  snapToGrid: boolean;
  showFPS: boolean;
  buildingStats: BuildingStats;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleFPS: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  showGrid,
  snapToGrid,
  showFPS,
  buildingStats,
  onToggleGrid,
  onToggleSnap,
  onToggleFPS
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-full border border-gray-700/50 shadow-2xl px-6 py-3">
        <div className="flex items-center space-x-6">
          {/* View Controls */}
          <div className="flex items-center space-x-3">
            {/* Grid Toggle */}
            <button
              onClick={onToggleGrid}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${showGrid 
                  ? 'bg-green-600/80 text-green-100 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              title="Toggle Grid (G)"
            >
              {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Snap to Grid */}
            <button
              onClick={onToggleSnap}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${snapToGrid 
                  ? 'bg-blue-600/80 text-blue-100 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              title="Snap to Grid (S)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            {/* FPS Counter */}
            <button
              onClick={onToggleFPS}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${showFPS 
                  ? 'bg-red-600/80 text-red-100 shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              title="Toggle FPS Counter (F)"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>

          {/* Building Stats */}
          {buildingStats.count > 0 && (
            <>
              <div className="h-4 w-px bg-gray-600" />
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-blue-400 font-medium">{buildingStats.count}</span>
                  <span className="text-gray-400">buildings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 font-medium">{buildingStats.totalArea.toFixed(0)}</span>
                  <span className="text-gray-400">m²</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-purple-400 font-medium">{buildingStats.totalFloors}</span>
                  <span className="text-gray-400">floors</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
