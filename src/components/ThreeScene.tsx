import React from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useErrorLogger } from '../hooks/useErrorLogger';
import { ControlPanel } from './ControlPanel';
import { ErrorDisplay } from './ErrorDisplay';
import { DebugPanel } from './DebugPanel';

export const ThreeScene: React.FC = () => {
  const {
    containerRef,
    isDrawing,
    selectedBuilding,
    showGrid,
    snapToGrid,
    isInitialized,
    startDrawing,
    stopDrawing,
    updateBuildingHeight,
    deleteSelectedBuilding,
    exportBuildings,
    toggleGrid,
    toggleSnapToGrid
  } = useThreeJS();

  const { errors, clearErrors } = useErrorLogger();

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Three.js Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
      />
      
      {/* Debug Panel */}
      <DebugPanel
        isDrawing={isDrawing}
        isInitialized={isInitialized}
        selectedBuilding={selectedBuilding}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
      />
      
      {/* Error Display */}
      <ErrorDisplay errors={errors} onClearErrors={clearErrors} />
      
      {/* Control Panels */}
      <ControlPanel
        isDrawing={isDrawing}
        selectedBuilding={selectedBuilding}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        isInitialized={isInitialized}
        onStartDrawing={startDrawing}
        onStopDrawing={stopDrawing}
        onDeleteBuilding={deleteSelectedBuilding}
        onExport={exportBuildings}
        onToggleGrid={toggleGrid}
        onToggleSnapToGrid={toggleSnapToGrid}
        onUpdateHeight={updateBuildingHeight}
      />
      
      {/* Status Bar */}
      <div className="fixed bottom-6 center-6 left-1/2 transform -translate-x-1/2 
                      bg-gray-900/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-xl border border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-orange-500' : 'bg-teal-500'}`} />
            <span>{isDrawing ? 'Drawing Mode' : 'View Mode'}</span>
          </div>
          {selectedBuilding && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Building Selected</span>
            </div>
          )}
          {isInitialized && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};