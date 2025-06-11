import React, { useRef } from 'react';
import { Pencil, Square, Trash2, Undo, Save, Download } from 'lucide-react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useDrawing } from '../hooks/useDrawing';
import { useClickHandler } from '../hooks/useClickHandler';
import { useBuildingManager } from '../hooks/useBuildingManager';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Three.js scene
  const { scene, camera, groundPlane, isInitialized } = useThreeJS(containerRef);
  
  // Initialize drawing functionality
  const { drawingState, startDrawing, stopDrawing, addPoint, finishBuilding, updatePreview, undoLastPoint } = useDrawing(
    scene,
    camera,
    groundPlane
  );

  // Initialize building management
  const { buildings, clearAllBuildings, exportBuildings, buildingStats } = useBuildingManager(scene);

  // Handle click events and mouse movement
  useClickHandler(containerRef, addPoint, finishBuilding, updatePreview);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Main Controls Panel */}
      <div className="fixed top-6 left-6 bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-4">
          <h2 className="text-white font-bold text-lg">Building Creator</h2>
          
          <div className="flex flex-col space-y-3">
            {!drawingState.isDrawing ? (
              <button
                onClick={startDrawing}
                disabled={!isInitialized}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 
                          disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                          transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Pencil className="w-4 h-4" />
                <span>Draw Building</span>
              </button>
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

      {/* Drawing Instructions */}
      {drawingState.isDrawing && (
        <div className="fixed top-6 right-6 bg-blue-900/95 backdrop-blur-sm rounded-xl p-5 shadow-2xl border border-blue-700 max-w-xs">
          <div className="text-blue-100">
            <h3 className="font-bold mb-3 text-blue-200">Drawing Mode Active</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Move mouse to preview placement</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Click to place points</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span>Click near start to close shape</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span>Double-click anywhere to finish</span>
              </div>
              
              <div className="pt-2 mt-3 border-t border-blue-700">
                <div className="flex justify-between text-blue-200">
                  <span>Points placed:</span>
                  <span className="font-bold">{drawingState.points.length}</span>
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

          {buildings.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>{buildings.length} buildings</span>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Message for New Users */}
      {!drawingState.isDrawing && buildings.length === 0 && isInitialized && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-md text-center">
            <h3 className="text-white text-xl font-bold mb-4">Welcome to Building Creator</h3>
            <p className="text-gray-300 mb-6">
              Create custom 3D buildings by drawing their footprints. Click "Draw Building" to get started!
            </p>
            <div className="text-sm text-gray-400">
              <p>• Draw shapes with 3+ points</p>
              <p>• Buildings are automatically extruded</p>
              <p>• Export your creations when done</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};