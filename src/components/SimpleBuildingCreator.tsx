import React, { useRef, useState } from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useDrawing } from '../hooks/useDrawing';
import { useClickHandler } from '../hooks/useClickHandler';
import { useBuildingManager } from '../hooks/useBuildingManager';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { LeftToolbar } from './LeftToolbar';
import { BottomToolbar } from './BottomToolbar';
import { FloatingInstructions } from './FloatingInstructions';
import { BuildingConfigPanel } from './BuildingConfigPanel';
import { BuildingEditPanel } from './BuildingEditPanel';
import { BuildingTooltip } from './BuildingTooltip';
import { BuildingConfig } from '../types/building';
import type { CameraType, CameraView } from '../core/ThreeJSCore';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showBuildingConfig, setShowBuildingConfig] = useState(false);
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>({
    floors: 3,
    floorHeight: 3.5,
    color: 0x6366f1
  });
  const [currentCameraType, setCurrentCameraType] = useState<CameraType>('perspective');
  
  // Initialize Three.js scene
  const { 
    scene, 
    camera, 
    groundPlane, 
    isInitialized, 
    isInitializing,
    initializationError,
    showFPS,
    toggleGrid, 
    toggleFPSCounter,
    retryInitialization,
    switchCameraType,
    getCurrentCameraType,
    setCameraView
  } = useThreeJS(containerRef, showGrid);
  
  // Initialize building management
  const { 
    buildings, 
    selectedBuilding, 
    hoveredBuilding, 
    buildingTooltip,
    selectBuilding, 
    updateBuilding, 
    clearAllBuildings, 
    exportBuildings, 
    buildingStats, 
    deleteBuilding, 
    handleBuildingInteraction,
    addBuilding,
    hideBuildingTooltip
  } = useBuildingManager(scene, camera);

  // Initialize drawing functionality
  const { 
    drawingState, 
    startDrawing, 
    stopDrawing, 
    addPoint, 
    finishBuilding, 
    updatePreview, 
    undoLastPoint, 
    clearAllDrawingElements 
  } = useDrawing(
    scene,
    camera,
    groundPlane,
    snapToGrid,
    buildingConfig,
    addBuilding
  );

  // Handle click events and mouse movement
  const isDrawingRef = React.useRef(drawingState.isDrawing);
  React.useEffect(() => {
    isDrawingRef.current = drawingState.isDrawing;
  }, [drawingState.isDrawing]);

  useClickHandler(
    containerRef,
    (event, container) => {
      if (!hasInteracted) setHasInteracted(true);
      
      if (drawingState.isDrawing) {
        addPoint(event, container);
      } else if (isInitialized && camera && scene) {
        const result = handleBuildingInteraction(event, container);
        
        if (result?.type === 'footprint') {
          setBuildingConfig({
            floors: result.building.floors,
            floorHeight: result.building.floorHeight,
            color: result.building.color || 0x6366f1
          });
          setShowBuildingConfig(true);
        } else if (!result) {
          selectBuilding(null);
        }
      }
    }, 
    () => finishBuilding(), 
    (event, container) => {
      if (drawingState.isDrawing) {
        updatePreview(event, container);
      }
    },
    (event, container) => {
      if (!drawingState.isDrawing && isInitialized && camera && scene) {
        handleBuildingInteraction(event, container);
      }
    },
    isDrawingRef
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDrawBuilding: () => {
      if (!hasInteracted) setHasInteracted(true);
      selectBuilding(null);
      startDrawing();
    },
    onToggleGrid: () => {
      setShowGrid(!showGrid);
      toggleGrid();
    },
    onToggleSnap: () => setSnapToGrid(!snapToGrid),
    onToggleFPS: toggleFPSCounter,
    onShowConfig: () => setShowBuildingConfig(!showBuildingConfig),
    onExport: exportBuildings,
    onClearAll: () => {
      clearAllBuildings();
      if (clearAllDrawingElements) clearAllDrawingElements();
      selectBuilding(null);
    },
    onEscape: () => {
      if (drawingState.isDrawing) {
        stopDrawing();
      } else if (selectedBuilding) {
        selectBuilding(null);
      } else if (showBuildingConfig) {
        setShowBuildingConfig(false);
      }
    },
    isDrawing: drawingState.isDrawing,
    isInitialized
  });

  // Event handlers
  const handleStartDrawing = () => {
    if (!hasInteracted) setHasInteracted(true);
    selectBuilding(null);
    startDrawing();
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    toggleGrid();
  };

  const handleSaveBuilding = (updates: any) => {
    if (selectedBuilding) {
      updateBuilding(selectedBuilding.id, updates);
      selectBuilding(null);
    }
  };

  const handleEditBuilding = (building: any) => {
    selectBuilding(building);
  };

  const handleClearAll = () => {
    clearAllBuildings();
    if (clearAllDrawingElements) clearAllDrawingElements();
    selectBuilding(null);
  };

  const handleSwitchCameraType = (type: CameraType) => {
    if (switchCameraType) {
      switchCameraType(type);
      setCurrentCameraType(type);
    }
  };

  const handleSetCameraView = (view: CameraView) => {
    if (setCameraView) {
      setCameraView(view, { duration: 1000 });
    }
  };

  // Determine instruction mode
  const getInstructionMode = () => {
    if (!hasInteracted && !drawingState.isDrawing && buildings.length === 0 && isInitialized) {
      return 'welcome';
    }
    if (drawingState.isDrawing) {
      return 'drawing';
    }
    if (!drawingState.isDrawing && buildings.length > 0 && !selectedBuilding && !showBuildingConfig) {
      return 'selection';
    }
    return null;
  };

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {isInitializing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 rounded-2xl p-8 shadow-2xl border border-gray-700/50 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-white text-xl font-bold mb-2">Initializing 3D Scene</h3>
            <p className="text-gray-300 text-sm">Setting up WebGL renderer...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {initializationError && !isInitializing && (
        <div className="fixed inset-0 bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-red-900/95 rounded-2xl p-8 shadow-2xl border border-red-700/50 text-center max-w-md">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-white text-xl font-bold mb-4">Scene Initialization Failed</h3>
            <p className="text-red-100 mb-6 text-sm">{initializationError}</p>
            <button
              onClick={retryInitialization}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                        transition-all duration-200 font-medium shadow-lg"
            >
              Retry Initialization
            </button>
          </div>
        </div>
      )}

      {/* Left Toolbar */}
      <LeftToolbar
        isDrawing={drawingState.isDrawing}
        isInitialized={isInitialized}
        hasBuildings={buildings.length > 0}
        onStartDrawing={handleStartDrawing}
        onShowConfig={() => setShowBuildingConfig(!showBuildingConfig)}
        onExport={exportBuildings}
        onClearAll={handleClearAll}
      />

      {/* Bottom Toolbar */}
      <BottomToolbar
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showFPS={showFPS}
        buildingStats={buildingStats}
        currentCameraType={currentCameraType}
        onToggleGrid={handleToggleGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onToggleFPS={toggleFPSCounter}
        onSwitchCameraType={handleSwitchCameraType}
        onSetCameraView={handleSetCameraView}
      />

      {/* Floating Instructions */}
      <FloatingInstructions
        mode={getInstructionMode()}
        drawingPoints={drawingState.points.length}
        buildingCount={buildings.length}
        onDismissWelcome={() => setHasInteracted(true)}
      />

      {/* Building Tooltip */}
      {buildingTooltip && (
        <BuildingTooltip
          building={buildingTooltip.building}
          position={buildingTooltip.position}
          onEdit={handleEditBuilding}
          onDelete={deleteBuilding}
          onClose={hideBuildingTooltip}
        />
      )}

      {/* Building Configuration Panel */}
      {showBuildingConfig && (
        <BuildingConfigPanel
          config={buildingConfig}
          onConfigChange={setBuildingConfig}
          onClose={() => setShowBuildingConfig(false)}
        />
      )}

      {/* Building Edit Panel */}
      {selectedBuilding && (
        <BuildingEditPanel
          building={selectedBuilding}
          onClose={() => selectBuilding(null)}
          onSave={handleSaveBuilding}
        />
      )}
    </div>
  );
};