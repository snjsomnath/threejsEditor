import React, { useRef, useState, useEffect } from 'react';
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
import { SunController } from './SunController';
import { MiniGraphWindow } from './MiniGraphWindow';
import { DesignGraphDialog } from './DesignGraphDialog';
import { SaveConfigurationDialog } from './dialogs/SaveConfigurationDialog';
import { BuildingConfig } from '../types/building';
import type { CameraType, CameraView } from '../core/ThreeJSCore';
import { getThemeColorAsHex } from '../utils/themeColors';
import type { SunPosition } from '../utils/sunPosition';
import { addSampleBuilding } from '../utils/addSampleBuilding';
import { BuildingService } from '../services/BuildingService';
import { designExplorationService } from '../services/DesignExplorationService';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasInitializedWithSample, setHasInitializedWithSample] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showBuildingConfig, setShowBuildingConfig] = useState(false);
  const [showSunController, setShowSunController] = useState(false);
  const [showSaveConfigDialog, setShowSaveConfigDialog] = useState(false);
  const [showDesignGraphDialog, setShowDesignGraphDialog] = useState(false);

  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>({
    floors: 3,
    floorHeight: 3.5,
    color: getThemeColorAsHex('--color-building-default', 0x6366f1)
  });
  const [currentCameraType, setCurrentCameraType] = useState<CameraType>('perspective');
  // Initialize Three.js scene
  const { 
    scene, 
    camera, 
    groundPlane, 
    windowService,
    isInitialized, 
    isInitializing,
    initializationError,
    showFPS,
    toggleGrid, 
    toggleFPSCounter,
    retryInitialization,
    switchCameraType,
    setCameraView,
    updateSunPosition,
    enableBuildingFocus,
    disableBuildingFocus
  } = useThreeJS(containerRef, showGrid);
    // Initialize building management
  const { 
    buildings, 
    selectedBuilding, 
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
  } = useBuildingManager(scene, camera as THREE.PerspectiveCamera | null, windowService);

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
        
        if (result?.type === 'footprint' && result.building && !result.building.mesh.userData.isPreview) {
          setBuildingConfig({
            floors: result.building.floors,
            floorHeight: result.building.floorHeight,
            color: result.building.color || getThemeColorAsHex('--color-building-default', 0x6366f1)
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
    onUndoLastPoint: undoLastPoint,
    isDrawing: drawingState.isDrawing,
    isInitialized
  });

  // Event handlers
  const handleStartDrawing = () => {
    if (!hasInteracted) setHasInteracted(true);
    
    // If already drawing, first stop any current drawing session
    if (drawingState.isDrawing) {
      stopDrawing();
      
      // Small delay to ensure cleanup completes before restarting
      setTimeout(() => {
        selectBuilding(null);
        startDrawing();
        
        // Force immediate preview update if mouse is over the container
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const lastMouseEvent = document.createEvent('MouseEvents');
          lastMouseEvent.initMouseEvent(
            'mousemove', true, true, window, 0,
            0, 0, rect.left + rect.width/2, rect.top + rect.height/2,
            false, false, false, false, 0, null
          );
          containerRef.current.dispatchEvent(lastMouseEvent);
        }
      }, 10);
      return;
    }
    
    // Normal start drawing flow
    selectBuilding(null);
    startDrawing();
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    toggleGrid();
  };

  const handleSaveConfiguration = () => {
    setShowSaveConfigDialog(true);
  };

  const handleSaveConfigurationConfirm = (name: string) => {
    designExplorationService.saveConfiguration(buildings, name);
  };

  const handleOpenDesignGraph = () => {
    setShowDesignGraphDialog(true);
  };

  const handleReinstateConfiguration = (nodeId: string) => {
    const node = designExplorationService.reinstateConfiguration(nodeId);
    if (node && scene) {
      // Clear current buildings
      clearAllBuildings();
      
      // Recreate buildings from saved data
      const buildingService = new BuildingService(scene);
      
      node.buildings.forEach(buildingData => {
        try {
          // Create building config from saved data
          const buildingConfig: BuildingConfig = {
            floors: buildingData.floors,
            floorHeight: buildingData.floorHeight,
            color: buildingData.color || getThemeColorAsHex('--color-building-default', 0x6366f1),
            name: buildingData.name,
            description: buildingData.description,
            window_to_wall_ratio: buildingData.window_to_wall_ratio,
            window_overhang: buildingData.window_overhang,
            window_overhang_depth: buildingData.window_overhang_depth,
            wall_construction: buildingData.wall_construction,
            floor_construction: buildingData.floor_construction,
            roof_construction: buildingData.roof_construction,
            window_construction: buildingData.window_construction,
            structural_system: buildingData.structural_system,
            building_program: buildingData.building_program,
            hvac_system: buildingData.hvac_system,
            natural_ventilation: buildingData.natural_ventilation
          };

          // Create the 3D mesh
          const mesh = buildingService.createBuilding(buildingData.points, buildingConfig);
          
          // Set the original building ID to maintain consistency
          mesh.userData = {
            ...mesh.userData,
            buildingId: buildingData.id,
            name: buildingData.name,
            description: buildingData.description
          };

          // Add the building back to the manager
          addBuilding(mesh, buildingData.points, buildingData.floors, buildingData.floorHeight);
          
        } catch (error) {
          console.error('Failed to recreate building:', buildingData.id, error);
        }
      });

      console.log('Configuration reinstated:', node.name, `(${node.buildings.length} buildings)`);
    }
    setShowDesignGraphDialog(false);
  };

  const handleSaveBuilding = (updates: any) => {
    if (selectedBuilding) {
      updateBuilding(selectedBuilding.id, updates);
      selectBuilding(null);
    }
  };

  const handlePreviewBuilding = (updates: any) => {
    if (selectedBuilding) {
      updateBuilding(selectedBuilding.id, updates);
      // Don't close the dialog - keep it open for live preview
    }
  };

  const handleEditBuilding = (building: any) => {
    // Only select non-preview buildings
    if (!building.mesh.userData.isPreview && !building.mesh.userData.isDrawingElement) {
      selectBuilding(building);
    }
  };
  const handleClearAll = () => {
    clearAllBuildings();
    // Don't clear drawing elements when using the Clear All button from LeftToolbar
    // Only clear selected building and reset UI state
    selectBuilding(null);
    
    // Force service state reset
    setTimeout(() => {
      if (showBuildingConfig) setShowBuildingConfig(false);
    }, 100);
  };

  const handleSwitchCameraType = (type: CameraType) => {
    if (switchCameraType) {
      switchCameraType(type);
      setCurrentCameraType(type);
    }
  };

  const handleSetCameraView = (view: CameraView) => {
    if (setCameraView) {
      setCameraView(view, { duration: 1000 });    }
  };

  // Handle sun position updates from SunController
  const handleSunPositionChange = (sunPosition: SunPosition) => {
    if (updateSunPosition) {
      updateSunPosition(sunPosition);
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

  // Add debugging for drawing state changes
  React.useEffect(() => {
    console.log('Drawing state changed:', {
      isDrawing: drawingState.isDrawing,
      pointsCount: drawingState.points.length,
      hasPreviewMarker: !!drawingState.previewMarker,
      hasPreviewLine: !!drawingState.previewLine,
      hasPreviewBuilding: !!drawingState.previewBuilding
    });
  }, [drawingState]);

  // Initialize with a sample pentagon building when the scene is ready (only once)
  useEffect(() => {
    if (isInitialized && scene && buildings.length === 0 && !hasInitializedWithSample) {
      console.log('Initializing app with sample pentagon building...');
      
      try {
        // Create building service for sample building
        const buildingService = new BuildingService(scene);
        
        // Create a sample pentagon building at the center
        const sampleBuilding = addSampleBuilding(buildingService, windowService, {
          centerX: 0,
          centerZ: 0,
          radius: 12,
          floors: 5,
          floorHeight: 3.5,
          color: getThemeColorAsHex('--color-building-sample', 0x4A90E2),
          name: 'Welcome Pentagon Building',
          description: 'A sample pentagon building to get you started',
          windowToWallRatio: 0.4
        });

        if (sampleBuilding) {
          // Add the building to the building manager
          const managedBuilding = addBuilding(
            sampleBuilding.mesh,
            sampleBuilding.points,
            sampleBuilding.floors,
            sampleBuilding.floorHeight
          );

          if (managedBuilding) {
            console.log('✅ Sample pentagon building added successfully:', managedBuilding.id);
            
            // Set user as having interacted so welcome screen doesn't show
            setHasInteracted(true);
            // Mark that we've initialized with a sample building
            setHasInitializedWithSample(true);
          } else {
            console.error('❌ Failed to add sample building to building manager');
          }
        } else {
          console.error('❌ Failed to create sample building');
        }
      } catch (error) {
        console.error('❌ Error creating sample building:', error);
      }
    }
  }, [isInitialized, scene, buildings.length, windowService, addBuilding, hasInitializedWithSample]);
// End of sample building initialization
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
        isDrawing={drawingState.isDrawing}        isInitialized={isInitialized}
        hasBuildings={buildings.length > 0}
        onStartDrawing={handleStartDrawing}
        onShowConfig={() => setShowBuildingConfig(!showBuildingConfig)}
        onExport={exportBuildings}
        onClearAll={handleClearAll}
        onSaveConfiguration={handleSaveConfiguration}
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
      )}      {/* Building Configuration Panel */}
      {showBuildingConfig && (
        <BuildingConfigPanel
          config={buildingConfig}
          onConfigChange={setBuildingConfig}
          onClose={() => setShowBuildingConfig(false)}
        />
      )}

      {/* Sun Controller */}
      <SunController
        isOpen={showSunController}
        onToggle={() => setShowSunController(!showSunController)}
        onSunPositionChange={handleSunPositionChange}
      />

      {/* Building Edit Panel */}
      {selectedBuilding && (
        <BuildingEditPanel
          building={selectedBuilding}
          onClose={() => selectBuilding(null)}
          onSave={handleSaveBuilding}
          onPreview={handlePreviewBuilding}
          enableBuildingFocus={enableBuildingFocus}
          disableBuildingFocus={disableBuildingFocus}
        />
      )}

      {/* Mini Graph Window */}
      <MiniGraphWindow onOpenFullGraph={handleOpenDesignGraph} />

      {/* Save Configuration Dialog */}
      <SaveConfigurationDialog
        isOpen={showSaveConfigDialog}
        onClose={() => setShowSaveConfigDialog(false)}
        onSave={handleSaveConfigurationConfirm}
      />

      {/* Design Graph Dialog */}
      <DesignGraphDialog
        isOpen={showDesignGraphDialog}
        onClose={() => setShowDesignGraphDialog(false)}
        onReinstateConfiguration={handleReinstateConfiguration}
      />
    </div>
  );
};