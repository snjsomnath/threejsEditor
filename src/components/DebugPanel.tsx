import React from 'react';
import { Bug, Camera, Mouse, Grid3X3 } from 'lucide-react';

interface DebugPanelProps {
  isDrawing: boolean;
  isInitialized: boolean;
  selectedBuilding: any;
  showGrid: boolean;
  snapToGrid: boolean;
  cameraMode?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isDrawing,
  isInitialized,
  selectedBuilding,
  showGrid,
  snapToGrid,
  cameraMode = 'perspective'
}) => {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-700">
      <div className="flex items-center space-x-4 text-xs text-gray-300">
        <div className="flex items-center space-x-1">
          <Bug className="w-3 h-3" />
          <span>Debug</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Init: {isInitialized ? 'OK' : 'FAIL'}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Mouse className="w-3 h-3" />
          <span>Mode: {isDrawing ? 'DRAW' : 'VIEW'}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Camera className="w-3 h-3" />
          <span>Cam: {cameraMode.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Grid3X3 className="w-3 h-3" />
          <span>Grid: {showGrid ? 'ON' : 'OFF'}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${snapToGrid ? 'bg-blue-500' : 'bg-gray-500'}`} />
          <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
        </div>
        
        {selectedBuilding && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Selected: {selectedBuilding.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};