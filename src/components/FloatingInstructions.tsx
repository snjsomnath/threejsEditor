import React from 'react';

interface FloatingInstructionsProps {
  mode: 'drawing' | 'selection' | 'welcome' | null;
  drawingPoints?: number;
  buildingCount?: number;
  onDismissWelcome?: () => void;
}

export const FloatingInstructions: React.FC<FloatingInstructionsProps> = ({
  mode,
  drawingPoints = 0,
  buildingCount = 0,
  onDismissWelcome
}) => {
  if (mode === 'drawing') {
    return (
      <div className="fixed top-6 right-6 bg-blue-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-blue-700/50 max-w-xs">
        <div className="text-blue-100">
          <h3 className="font-bold mb-3 text-blue-200 text-sm">Drawing Mode</h3>
          <div className="text-xs space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
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
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>ESC to cancel</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span>Backspace to undo</span>
            </div>
            
            <div className="pt-2 mt-2 border-t border-blue-700/50">
              <div className="text-blue-200 text-xs">
                Points: <span className="font-bold">{drawingPoints}</span>
                {drawingPoints < 3 && (
                  <span className="text-blue-300 block">
                    Need {3 - drawingPoints} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'selection' && buildingCount > 0) {
    return (
      <div className="fixed top-6 right-6 bg-cyan-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-cyan-700/50 max-w-xs">
        <div className="text-cyan-100">
          <h3 className="font-bold mb-2 text-cyan-200 text-sm">Selection Mode</h3>
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Click footprint to configure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span>Click building for details</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Press D to start drawing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'welcome') {
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50 max-w-md text-center pointer-events-auto relative">
          <button
            onClick={onDismissWelcome}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-white text-xl font-bold mb-4">Building Creator</h3>
          <p className="text-gray-300 mb-6 text-sm">
            Create detailed 3D buildings with precision and ease. Start by configuring your building or jump right into drawing.
          </p>
          <div className="text-xs text-gray-400 space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">D</kbd>
              <span>Start drawing</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">G</kbd>
              <span>Toggle grid</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">S</kbd>
              <span>Snap to grid</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">ESC</kbd>
              <span>Cancel action</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
