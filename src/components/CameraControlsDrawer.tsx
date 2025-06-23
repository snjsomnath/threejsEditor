import React from 'react';
import { 
  Camera, 
  X, 
  Focus, 
  ArrowUp, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  Move3D,
  RotateCcw,
  ZoomIn,
  MousePointer
} from 'lucide-react';
import type { CameraType, CameraView } from '../core/ThreeJSCore';

interface CameraControlsDrawerProps {
  isOpen: boolean;
  currentCameraType: CameraType;
  onClose: () => void;
  onSwitchCameraType: (type: CameraType) => void;
  onSetCameraView: (view: CameraView) => void;
}

const viewGroups = {
  'Quick Views': [
    { key: 'perspective' as CameraView, label: 'Perspective', icon: Focus },
    { key: 'top' as CameraView, label: 'Top', icon: ArrowUp },
    { key: 'front' as CameraView, label: 'Front', icon: Eye },
    { key: 'right' as CameraView, label: 'Right', icon: ArrowRight },
    { key: 'left' as CameraView, label: 'Left', icon: ArrowLeft },
  ],
  'Isometric': [
    { key: 'northeast' as CameraView, label: 'NE', icon: Move3D },
    { key: 'southeast' as CameraView, label: 'SE', icon: Move3D },
    { key: 'southwest' as CameraView, label: 'SW', icon: Move3D },
    { key: 'northwest' as CameraView, label: 'NW', icon: Move3D },
  ]
};

export const CameraControlsDrawer: React.FC<CameraControlsDrawerProps> = ({
  isOpen,
  currentCameraType,
  onClose,
  onSwitchCameraType,
  onSetCameraView
}) => {
  const handleCameraTypeChange = (type: CameraType) => {
    onSwitchCameraType(type);
  };

  const handleViewSelect = (view: CameraView) => {
    onSetCameraView(view);
    // Don't close drawer immediately - let user see the change
    setTimeout(() => onClose(), 500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
        onClick={onClose}
      />
      
      {/* Drawer - More Compact */}
      <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-4 w-full max-w-xl">
          
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-medium">Camera Controls</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Camera Type Selection */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Camera Type</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCameraTypeChange('perspective')}
                className={`p-2.5 rounded-lg border transition-all duration-200 group text-sm
                  ${currentCameraType === 'perspective'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-400'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Focus className="w-4 h-4" />
                  <span className="font-medium">Perspective</span>
                </div>
              </button>
              
              <button
                onClick={() => handleCameraTypeChange('orthographic')}
                className={`p-2.5 rounded-lg border transition-all duration-200 group text-sm
                  ${currentCameraType === 'orthographic'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-400'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span className="font-medium">Orthographic</span>
                </div>
              </button>
            </div>
          </div>

          {/* Compact View Selection */}
          <div className="space-y-3">
            {Object.entries(viewGroups).map(([groupName, views]) => (
              <div key={groupName}>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {groupName}
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {views.map((view) => {
                    const IconComponent = view.icon;
                    return (
                      <button
                        key={view.key}
                        onClick={() => handleViewSelect(view.key)}
                        className="group p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                                 bg-white dark:bg-gray-800/30 hover:border-blue-300 dark:hover:border-blue-400 
                                 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                 active:scale-95 transition-all duration-150"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-xs group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                            {view.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Compact Controls Instructions */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center justify-center w-6 h-5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                  L
                </div>
                <div className="flex items-center space-x-1">
                  <RotateCcw className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Orbit</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center justify-center w-6 h-5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                  R
                </div>
                <div className="flex items-center space-x-1">
                  <MousePointer className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pan</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center justify-center w-6 h-5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                  ⚬
                </div>
                <div className="flex items-center space-x-1">
                  <ZoomIn className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Zoom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};