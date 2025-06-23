import React, { useState } from 'react';
import { Eye, EyeOff, Grid3X3, Activity, ChevronUp, Camera, View, X } from 'lucide-react';
import type { CameraType, CameraView } from '../core/ThreeJSCore';

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
  currentCameraType: CameraType;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleFPS: () => void;
  onSwitchCameraType: (type: CameraType) => void;
  onSetCameraView: (view: CameraView) => void;
}

const viewGroups = {
  'Quick Views': [
    { key: 'perspective' as CameraView, label: 'Perspective', icon: '🎯' },
    { key: 'top' as CameraView, label: 'Top', icon: '⬆️' },
    { key: 'front' as CameraView, label: 'Front', icon: '👁️' },
    { key: 'right' as CameraView, label: 'Right', icon: '➡️' },
    { key: 'left' as CameraView, label: 'Left', icon: '⬅️' },
  ],
  'Isometric': [
    { key: 'northeast' as CameraView, label: 'NE', icon: '↗️' },
    { key: 'southeast' as CameraView, label: 'SE', icon: '↘️' },
    { key: 'southwest' as CameraView, label: 'SW', icon: '↙️' },
    { key: 'northwest' as CameraView, label: 'NW', icon: '↖️' },
  ]
};

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  showGrid,
  snapToGrid,
  showFPS,
  buildingStats,
  currentCameraType,
  onToggleGrid,
  onToggleSnap,
  onToggleFPS,
  onSwitchCameraType,
  onSetCameraView
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleCameraTypeChange = (type: CameraType) => {
    onSwitchCameraType(type);
  };

  const handleViewSelect = (view: CameraView) => {
    onSetCameraView(view);
    // Don't close drawer immediately - let user see the change
    setTimeout(() => setIsDrawerOpen(false), 500);
  };

  return (
    <>
      {/* Camera Controls Drawer - More Compact */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer - More Compact */}
          <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center">
            <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl p-4 w-full max-w-2xl">
              
              {/* Compact Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <h3 className="text-white font-medium">Camera Controls</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Camera Type Selection */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCameraTypeChange('perspective')}
                    className={`p-2 rounded-lg border transition-all duration-200 text-sm
                      ${currentCameraType === 'perspective'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-blue-400'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📐</span>
                      <span className="font-medium">Perspective</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleCameraTypeChange('orthographic')}
                    className={`p-2 rounded-lg border transition-all duration-200 text-sm
                      ${currentCameraType === 'orthographic'
                        ? 'border-green-500 bg-green-500/10 text-green-300'
                        : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-green-400'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📏</span>
                      <span className="font-medium">Orthographic</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Compact View Selection */}
              <div className="space-y-3">
                {Object.entries(viewGroups).map(([groupName, views]) => (
                  <div key={groupName}>
                    <h5 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                      {groupName}
                    </h5>
                    <div className="grid grid-cols-5 gap-2">
                      {views.map((view) => (
                        <button
                          key={view.key}
                          onClick={() => handleViewSelect(view.key)}
                          className="group p-2 rounded-lg border border-gray-600 bg-gray-800/30 
                                   hover:border-gray-400 hover:bg-gray-700/40 
                                   active:scale-95 transition-all duration-150"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-xl group-hover:scale-110 transition-transform duration-150">
                              {view.icon}
                            </span>
                            <span className="text-white font-medium text-xs group-hover:text-blue-300 transition-colors">
                              {view.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact Instructions */}
              <div className="mt-4 pt-3 border-t border-gray-700/50">
                <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-4 bg-gray-700 rounded text-center text-xs">L</div>
                    <span>Orbit</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-4 bg-gray-700 rounded text-center text-xs">R</div>
                    <span>Pan</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-4 bg-gray-700 rounded text-center text-xs">⚬</div>
                    <span>Zoom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Toolbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full border border-gray-700/50 shadow-2xl px-6 py-3">
          <div className="flex items-center space-x-6">
            {/* View Controls */}
            <div className="flex items-center space-x-3">
              {/* Camera Controls Trigger */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  ${isDrawerOpen 
                    ? 'bg-purple-600/80 text-purple-100 shadow-lg scale-110' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                title="Camera Controls"
              >
                <Camera className="w-4 h-4" />
              </button>

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

            {/* Current Camera Type Indicator */}
            <div className="flex items-center space-x-2">
              <div className="h-4 w-px bg-gray-600" />
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentCameraType === 'perspective' ? 'bg-blue-400' : 'bg-green-400'
                }`} />
                <span className="text-xs text-gray-300 font-medium capitalize">
                  {currentCameraType}
                </span>
              </div>
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
    </>
  );
};
