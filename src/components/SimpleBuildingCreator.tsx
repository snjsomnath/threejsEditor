import React, { useRef, useState } from 'react';
import { Pencil, Square, Trash2, Undo, Save, Download, Grid3X3, Settings, Eye, EyeOff } from 'lucide-react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useDrawing } from '../hooks/useDrawing';
import { useClickHandler } from '../hooks/useClickHandler';
import { useBuildingManager } from '../hooks/useBuildingManager';
import { BuildingDetailsPanel } from './BuildingDetailsPanel';
import { BuildingConfigPanel } from './BuildingConfigPanel';
import { BuildingEditPanel } from './BuildingEditPanel';
import { BuildingConfig } from '../types/building';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showBuildingConfig, setShowBuildingConfig] = useState(false);
  const [showBuildingEdit, setShowBuildingEdit] = useState(false);
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>({
    floors: 3,
    floorHeight: 3.5,
    color: 0x6366f1,
    enableShadows: true,
    buildingType: 'residential'
  });
  
  // Initialize Three.js scene
  const { scene, camera, groundPlane, isInitialized, toggleGrid, enableAmbientOcclusion } = useThreeJS(containerRef, showGrid);
  
  // Initialize drawing functionality
  const { drawingState, startDrawing, stopDrawing, addPoint, finishBuilding, updatePreview, undoLastPoint } = useDrawing(
    scene,
    camera,
    groundPlane,
    snapToGrid,
    buildingConfig
  );

  // Initialize building management
  const { buildings, selectedBuilding, hoveredBuilding, selectBuilding, updateBuilding, clearAllBuildings, exportBuildings, buildingStats, deleteBuilding, handleBuildingInteraction } = useBuildingManager(scene);

  // Handle click events and mouse movement
  useClickHandler(
    containerRef, 
    (event, container) => {
      if (!hasInteracted) setHasInteracted(true);
      addPoint(event, container);
    }, 
    finishBuilding, 
    updatePreview,
    (event, container) => {
      if (camera) {
        handleBuildingInteraction(event, camera, container, drawingState.isDrawing);
      }
    },
    drawingState.isDrawing
  );

  const handleStartDrawing = () => {
    if (!hasInteracted) setHasInteracted(true);
    // Clear selection when starting to draw
    selectBuilding(null);
    startDrawing();
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    toggleGrid();
  };

  const handleEditBuilding = () => {
    setShowBuildingEdit(true);
  };

  const handleSaveBuilding = (updates: any) => {
    if (selectedBuilding) {
      updateBuilding(selectedBuilding.id, updates);
      setShowBuildingEdit(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Main Controls Panel */}
      <div className="fixed top-6 left-6 bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-4">
          <h2 className="text-white font-bold text-lg">Building Creator</h2>
          
          <div className="flex flex-col space-y-3">
            {!drawingState.isDrawing ? (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleStartDrawing}
                  disabled={!isInitialized}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 
                            disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                            transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Draw Building</span>
                </button>
                
                <button
                  onClick={() => setShowBuildingConfig(!showBuildingConfig)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 
                            text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Settings className="w-4 h-4" />
                  <span>Building Config</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={stopDrawing}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 
                            text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Drawing</span>
                </button>
                
                {drawingState.points.length > 0 && (
                  <button
                    onClick={undoLastPoint}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 
                              text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Undo className="w-4 h-4" />
                    <span>Undo Point</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View Controls */}
          <div className="pt-3 border-t border-gray-600 flex flex-col space-y-2">
            <button
              onClick={handleToggleGrid}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                showGrid 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Grid</span>
            </button>
            
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                snapToGrid 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Snap to Grid</span>
            </button>
          </div>

          {/* Building Stats */}
          {buildingStats.count > 0 && (
            <div className="pt-3 border-t border-gray-600">
              <div className="text-gray-300 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Buildings:</span>
                  <span className="text-blue-400 font-medium">{buildingStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Area:</span>
                  <span className="text-green-400 font-medium">{buildingStats.totalArea.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Floors:</span>
                  <span className="text-purple-400 font-medium">{buildingStats.totalFloors}</span>
                </div>
              </div>
            </div>
          )}

          {/* Management Controls */}
          {buildings.length > 0 && (
            <div className="pt-3 border-t border-gray-600 flex flex-col space-y-2">
              <button
                onClick={exportBuildings}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 
                          text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={clearAllBuildings}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 
                          text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Building Configuration Panel */}
      {showBuildingConfig && (
        <BuildingConfigPanel
          config={buildingConfig}
          onConfigChange={setBuildingConfig}
          onClose={() => setShowBuildingConfig(false)}
        />
      )}

      {/* Building Details Panel */}
      {selectedBuilding && !showBuildingEdit && (
        <BuildingDetailsPanel
          building={selectedBuilding}
          onClose={() => selectBuilding(null)}
          onEdit={handleEditBuilding}
          onDelete={() => {
            deleteBuilding(selectedBuilding.id);
            selectBuilding(null);
          }}
        />
      )}

      {/* Building Edit Panel */}
      {selectedBuilding && showBuildingEdit && (
        <BuildingEditPanel
          building={selectedBuilding}
          onClose={() => setShowBuildingEdit(false)}
          onSave={handleSaveBuilding}
        />
      )}

      {/* Drawing Instructions */}
      {drawingState.isDrawing && (
        <div className="fixed top-6 right-6 bg-blue-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-blue-700 max-w-xs">
          <div className="text-blue-100">
            <h3 className="font-bold mb-3 text-blue-200">Drawing Mode Active</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Move mouse to preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Click to place points</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span>Click near start to close</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span>Double-click to finish</span>
              </div>
              
              <div className="pt-2 mt-3 border-t border-blue-700">
                <div className="flex justify-between text-blue-200">
                  <span>Points:</span>
                  <span className="font-bold">{drawingState.points.length}</span>
                </div>
                <div className="flex justify-between text-blue-200">
                  <span>Floors:</span>
                  <span className="font-bold">{buildingConfig.floors}</span>
                </div>
                <div className="flex justify-between text-blue-200">
                  <span>Height:</span>
                  <span className="font-bold">{(buildingConfig.floors * buildingConfig.floorHeight).toFixed(1)}m</span>
                </div>
                <div className="text-xs text-blue-300 mt-1">
                  {drawingState.points.length < 3 ? 
                    `Need ${3 - drawingState.points.length} more points` : 
                    'Ready to close shape'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
                      bg-gray-900/95 backdrop-blur-sm rounded-full px-8 py-3 shadow-2xl border border-gray-700">
        <div className="flex items-center space-x-6 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${drawingState.isDrawing ? 'bg-orange-500 animate-pulse' : 'bg-teal-500'}`} />
            <span className="font-medium">{drawingState.isDrawing ? 'Drawing Mode' : 'View Mode'}</span>
          </div>
          
          {drawingState.points.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>{drawingState.points.length} points</span>
            </div>
          )}
          
          {drawingState.isDrawing && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${drawingState.snapToStart ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span>{drawingState.snapToStart ? 'Snap to close' : 'Preview active'}</span>
            </div>
          )}

          {snapToGrid && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span>Grid snap</span>
            </div>
          )}

          {buildings.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>{buildings.length} buildings</span>
            </div>
          )}

          {selectedBuilding && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Selected: {selectedBuilding.name}</span>
            </div>
          )}

          {hoveredBuilding && !selectedBuilding && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Hover: {hoveredBuilding.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Message for New Users - Only show if never interacted */}
      {!hasInteracted && !drawingState.isDrawing && buildings.length === 0 && isInitialized && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-md text-center">
            <h3 className="text-white text-xl font-bold mb-4">Welcome to Building Creator</h3>
            <p className="text-gray-300 mb-6">
              Create detailed 3D buildings with custom floors, heights, and materials. Click "Draw Building" to get started!
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Configure building details before drawing</p>
              <p>• Draw shapes with 3+ points</p>
              <p>• Click buildings to select and view details</p>
              <p>• Export your architectural designs</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};