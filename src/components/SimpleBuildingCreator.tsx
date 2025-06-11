import React, { useRef } from 'react';
import { Pencil, Square } from 'lucide-react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useDrawing } from '../hooks/useDrawing';
import { useClickHandler } from '../hooks/useClickHandler';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Three.js scene
  const { scene, camera, groundPlane, isInitialized } = useThreeJS(containerRef);
  
  // Initialize drawing functionality
  const { drawingState, startDrawing, stopDrawing, addPoint, finishBuilding } = useDrawing(
    scene,
    camera,
    groundPlane
  );

  // Handle click events
  useClickHandler(containerRef, addPoint, finishBuilding);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Controls Panel */}
      <div className="fixed top-6 left-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-3">
          <h2 className="text-white font-semibold">Building Creator</h2>
          
          {!drawingState.isDrawing ? (
            <button
              onClick={startDrawing}
              disabled={!isInitialized}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                        disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                        transition-all duration-200"
            >
              <Pencil className="w-4 h-4" />
              <span>Draw Building</span>
            </button>
          ) : (
            <button
              onClick={stopDrawing}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 
                        text-white rounded-lg transition-all duration-200"
            >
              <Square className="w-4 h-4" />
              <span>Stop Drawing</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawing Instructions */}
      {drawingState.isDrawing && (
        <div className="fixed bottom-6 right-6 bg-blue-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-blue-700">
          <div className="text-blue-100">
            <h3 className="font-semibold mb-2">Drawing Mode</h3>
            <div className="text-sm space-y-1">
              <p>• Click to place points</p>
              <p>• Double-click to finish building</p>
              <p>• Need at least 3 points</p>
              <p>• Points: {drawingState.points.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
                      bg-gray-900/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-xl border border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${drawingState.isDrawing ? 'bg-orange-500' : 'bg-teal-500'}`} />
            <span>{drawingState.isDrawing ? 'Drawing Mode' : 'View Mode'}</span>
          </div>
          {drawingState.points.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{drawingState.points.length} points</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};