import React, { useState } from 'react';
import { 
  Pencil, 
  Square, 
  Trash2, 
  Download, 
  Grid3X3, 
  Move3D,
  Home,
  Settings,
  Loader2
} from 'lucide-react';

interface ControlPanelProps {
  isDrawing: boolean;
  selectedBuilding: any;
  showGrid: boolean;
  snapToGrid: boolean;
  isInitialized: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onDeleteBuilding: () => void;
  onExport: () => void;
  onToggleGrid: () => void;
  onToggleSnapToGrid: () => void;
  onUpdateHeight: (height: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isDrawing,
  selectedBuilding,
  showGrid,
  snapToGrid,
  isInitialized,
  onStartDrawing,
  onStopDrawing,
  onDeleteBuilding,
  onExport,
  onToggleGrid,
  onToggleSnapToGrid,
  onUpdateHeight
}) => {
  const [heightInput, setHeightInput] = useState(selectedBuilding?.height || 3);

  const handleHeightChange = (value: number) => {
    setHeightInput(value);
    onUpdateHeight(value);
  };

  const downloadJSON = () => {
    const data = onExport();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'buildings.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      {/* Main Control Panel */}
      <div className="fixed top-6 left-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Home className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-semibold">3D Builder</h2>
            {!isInitialized && (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>
          
          <div className="space-y-2">
            {!isDrawing ? (
              <button
                onClick={onStartDrawing}
                disabled={!isInitialized}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                          disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                          transition-all duration-200 hover:scale-105 hover:shadow-lg 
                          hover:shadow-blue-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <Pencil className="w-4 h-4" />
                <span>Draw Building</span>
              </button>
            ) : (
              <button
                onClick={onStopDrawing}
                disabled={!isInitialized}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 
                          disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                          transition-all duration-200 hover:scale-105 hover:shadow-lg 
                          hover:shadow-orange-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <Square className="w-4 h-4" />
                <span>Stop Drawing</span>
              </button>
            )}
            
            <button
              onClick={onDeleteBuilding}
              disabled={!selectedBuilding || !isInitialized}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                        disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                        transition-all duration-200 hover:scale-105 hover:shadow-lg 
                        hover:shadow-red-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            
            <button
              onClick={downloadJSON}
              disabled={!isInitialized}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 
                        disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                        transition-all duration-200 hover:scale-105 hover:shadow-lg 
                        hover:shadow-teal-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="fixed top-6 right-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h3 className="text-white font-semibold">Settings</h3>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onToggleGrid}
              disabled={!isInitialized}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 
                         hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                           showGrid && isInitialized
                             ? 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-lg hover:shadow-teal-500/25' 
                             : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                         } ${!isInitialized ? 'opacity-50' : ''}`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm">Grid</span>
            </button>
            
            <button
              onClick={onToggleSnapToGrid}
              disabled={!isInitialized}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 
                         hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                           snapToGrid && isInitialized
                             ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/25' 
                             : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                         } ${!isInitialized ? 'opacity-50' : ''}`}
            >
              <Move3D className="w-4 h-4" />
              <span className="text-sm">Snap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Building Properties Panel */}
      {selectedBuilding && (
        <div className="fixed bottom-6 left-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <Home className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold">Building Properties</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Name</label>
                <div className="text-white bg-gray-800 px-3 py-2 rounded-lg">
                  {selectedBuilding.name}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Height (m)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={heightInput}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0.5)}
                  disabled={!isInitialized}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 
                            focus:border-blue-500 focus:outline-none transition-colors duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Points</label>
                <div className="text-gray-400 text-sm bg-gray-800 px-3 py-2 rounded-lg">
                  {selectedBuilding.points?.length || 0} vertices
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="fixed bottom-6 right-6 bg-blue-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-blue-700">
          <div className="text-blue-100">
            <h3 className="font-semibold mb-2">Drawing Mode</h3>
            <div className="text-sm space-y-1">
              <p>• Click to place points</p>
              <p>• Double-click to finish</p>
              <p>• Click near start to close</p>
            </div>
          </div>
        </div>
      )}

      {/* Initialization Status */}
      {!isInitialized && (
        <div className="fixed bottom-6 center-6 left-1/2 transform -translate-x-1/2 
                        bg-blue-900/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-xl border border-blue-700">
          <div className="flex items-center space-x-2 text-sm text-blue-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Initializing 3D Engine...</span>
          </div>
        </div>
      )}
    </>
  );
};