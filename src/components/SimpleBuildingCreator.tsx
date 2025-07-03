import React, { useRef, useState, useEffect } from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { useDrawing } from '../hooks/useDrawing';
import { useClickHandler } from '../hooks/useClickHandler';
import { useBuildingManager } from '../hooks/useBuildingManager';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { toggleTheme } from '../utils/themeColors';
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
import { ImportConfigDialog } from './dialogs/ImportConfigDialog';
import { Tabs, TabContent } from './ui/Tabs';
import { WeatherAndLocationTab } from './WeatherAndLocationTab';
import { BuildingConfig } from '../types/building';
import type { CameraType, CameraView } from '../core/ThreeJSCore';
import { getThemeColorAsHex } from '../utils/themeColors';
import type { SunPosition } from '../utils/sunPosition';
import { addSampleBuilding } from '../utils/addSampleBuilding';
import { BuildingService } from '../services/BuildingService';
import { designExplorationService } from '../services/DesignExplorationService';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'weather' | 'model'>('model');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasInitializedWithSample, setHasInitializedWithSample] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showBuildingConfig, setShowBuildingConfig] = useState(false);
  const [showSunController, setShowSunController] = useState(false);
  const [showSaveConfigDialog, setShowSaveConfigDialog] = useState(false);
  const [showDesignGraphDialog, setShowDesignGraphDialog] = useState(false);
  const [showImportConfigDialog, setShowImportConfigDialog] = useState(false);

  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>({
    floors: 3,
    floorHeight: 3.5,
    color: getThemeColorAsHex('--color-building-default', 0x63666f1)
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
      // Only handle clicks when model tab is active
      if (activeTab !== 'model') return;
      
      if (!hasInteracted) setHasInteracted(true);
      
      if (drawingState.isDrawing) {
        addPoint(event, container);
      } else if (isInitialized && camera && scene) {
        const result = handleBuildingInteraction(event, container);
        
        if (result?.building && !result.building.mesh.userData.isPreview) {
          // Select the building to show the comprehensive BuildingEditPanel
          selectBuilding(result.building);
        } else if (!result) {
          selectBuilding(null);
        }
      }
    }, 
    () => finishBuilding(), 
    (event, container) => {
      // Only handle mouse move when model tab is active
      if (activeTab !== 'model') return;
      
      if (drawingState.isDrawing) {
        updatePreview(event, container);
      }
    },
    (event, container) => {
      // Only handle hover when model tab is active
      if (activeTab !== 'model') return;
      
      if (!drawingState.isDrawing && isInitialized && camera && scene) {
        handleBuildingInteraction(event, container);
      }
    },
    isDrawingRef
  );

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

  const handleImportConfiguration = () => {
    setShowImportConfigDialog(true);
  };

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    
    // Force Three.js scene to immediately update
    window.dispatchEvent(new CustomEvent('threejs-theme-update', { 
      detail: { theme: newTheme } 
    }));
  };

  const handleImportConfigConfirm = (config: any) => {
    try {
      // Clear current buildings
      clearAllBuildings();
      
      // Determine if config is an array of buildings or an object with buildings property
      const buildingsData = Array.isArray(config) ? config : config.buildings || [];
      
      if (!Array.isArray(buildingsData)) {
        throw new Error('Invalid configuration format');
      }

      // Recreate buildings from imported data
      const buildingService = new BuildingService(scene!);
      
      buildingsData.forEach((buildingData: any, index: number) => {
        try {
          // Validate required fields
          if (!buildingData.points || !Array.isArray(buildingData.points) || buildingData.points.length < 3) {
            throw new Error(`Building ${index + 1}: Invalid or missing points`);
          }

          // Create building config with defaults for missing properties
          const buildingConfig: BuildingConfig = {
            floors: buildingData.floors || 3,
            floorHeight: buildingData.floorHeight || 3.5,
            color: buildingData.color || getThemeColorAsHex('--color-building-default', 0x63666f1),
            name: buildingData.name || `Imported Building ${index + 1}`,
            description: buildingData.description || '',
            window_to_wall_ratio: buildingData.window_to_wall_ratio || 0.3,
            window_overhang: buildingData.window_overhang || false,
            window_overhang_depth: buildingData.window_overhang_depth || 0.5,
            wall_construction: buildingData.wall_construction || 'Standard Wall',
            floor_construction: buildingData.floor_construction || 'Standard Floor',
            roof_construction: buildingData.roof_construction || 'Standard Roof',
            window_construction: buildingData.window_construction || 'Standard Window',
            structural_system: buildingData.structural_system || 'Concrete',
            building_program: buildingData.building_program || 'Office',
            hvac_system: buildingData.hvac_system || 'Standard HVAC',
            natural_ventilation: buildingData.natural_ventilation || false
          };

          // Create the 3D mesh
          const mesh = buildingService.createBuilding(buildingData.points, buildingConfig);
          
          // Set metadata
          mesh.userData = {
            ...mesh.userData,
            buildingId: buildingData.id || `imported_${Date.now()}_${index}`,
            name: buildingConfig.name,
            description: buildingConfig.description
          };

          // Add the building to the manager
          addBuilding(mesh, buildingData.points, buildingConfig.floors, buildingConfig.floorHeight);
          
        } catch (error) {
          console.error(`Failed to import building ${index + 1}:`, error);
        }
      });

      console.log(`Successfully imported ${buildingsData.length} building(s)`);
      
    } catch (error) {
      console.error('Failed to import configuration:', error);
      // You could show an error dialog here
    }
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
            color: buildingData.color || getThemeColorAsHex('--color-building-default', 0x63666f1),
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDrawBuilding: () => {
      if (activeTab !== 'model') return;
      if (!hasInteracted) setHasInteracted(true);
      selectBuilding(null);
      startDrawing();
    },
    onToggleGrid: () => {
      if (activeTab !== 'model') return;
      setShowGrid(!showGrid);
      toggleGrid();
    },
    onToggleSnap: () => {
      if (activeTab !== 'model') return;
      setSnapToGrid(!snapToGrid);
    },
    onToggleFPS: () => {
      if (activeTab !== 'model') return;
      toggleFPSCounter();
    },
    onShowConfig: () => {
      if (activeTab !== 'model') return;
      setShowBuildingConfig(!showBuildingConfig);
    },
    onExport: () => {
      if (activeTab !== 'model') return;
      exportBuildings();
    },
    onClearAll: () => {
      if (activeTab !== 'model') return;
      clearAllBuildings();
      if (clearAllDrawingElements) clearAllDrawingElements();
      selectBuilding(null);
    },
    onEscape: () => {
      if (activeTab !== 'model') return;
      if (drawingState.isDrawing) {
        stopDrawing();
      } else if (selectedBuilding) {
        selectBuilding(null);
      } else if (showBuildingConfig) {
        setShowBuildingConfig(false);
      }
    },
    onUndoLastPoint: () => {
      if (activeTab !== 'model') return;
      undoLastPoint();
    },
    onSaveConfiguration: () => {
      if (activeTab !== 'model') return;
      handleSaveConfiguration();
    },
    onImportConfiguration: () => {
      if (activeTab !== 'model') return;
      handleImportConfiguration();
    },
    onToggleSunController: () => {
      if (activeTab !== 'model') return;
      setShowSunController(!showSunController);
    },
    onToggleTheme: handleToggleTheme, // Theme toggle should work on both tabs
    isDrawing: drawingState.isDrawing,
    isInitialized
  });

  // Add debugging for building stats changes
  React.useEffect(() => {
    console.log('Building stats updated:', {
      count: buildingStats.count,
      totalArea: buildingStats.totalArea,
      totalFloors: buildingStats.totalFloors,
      buildingIds: buildings.map(b => b.id)
    });
  }, [buildingStats, buildings]);

  // Add debugging for building state changes
  React.useEffect(() => {
    console.log('Buildings state changed:', {
      count: buildings.length,
      activeTab,
      isInitialized,
      hasInitializedWithSample,
      buildingIds: buildings.map(b => ({ id: b.id, name: b.name }))
    });
  }, [buildings, activeTab, isInitialized, hasInitializedWithSample]);

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

  // Safeguard: Re-ensure sample building exists when switching to model tab
  useEffect(() => {
    if (activeTab === 'model' && isInitialized && scene && buildings.length === 0 && hasInitializedWithSample) {
      console.log('🔄 Sample building missing when switching to model tab, recreating...');
      
      // Reset the initialization flag to allow recreation
      setHasInitializedWithSample(false);
    }
  }, [activeTab, isInitialized, scene, buildings.length, hasInitializedWithSample]);
// End of sample building initialization

  // Define tabs
  const tabs = [
    { 
      id: 'weather', 
      label: 'Weather & Location',
      icon: '🌤️'
    },
    { 
      id: 'model', 
      label: 'Model',
      icon: '🏗️'
    }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'weather' | 'model');
    
    // When switching to model tab, ensure the Three.js canvas is properly sized and visible
    if (tabId === 'model' && containerRef.current) {
      // Force a resize event to ensure the renderer matches the container size
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Also ensure the canvas is properly visible
        const canvas = containerRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.style.display = 'block';
        }
        
        // Debug: Check if buildings are still in the scene
        if (scene && buildings.length > 0) {
          console.log('Tab switch to model - Buildings status:', {
            buildingsCount: buildings.length,
            sceneChildren: scene.children.length,
            buildingIds: buildings.map(b => b.id)
          });
          
          // Ensure buildings are still visible in the scene
          buildings.forEach(building => {
            if (building.mesh.parent !== scene) {
              console.warn('Building mesh not in scene, re-adding:', building.id);
              scene.add(building.mesh);
              if (building.footprintOutline) scene.add(building.footprintOutline);
              if (building.floorLines) scene.add(building.floorLines);
            }
          });
        }
      }, 100);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-950 flex flex-col">
      {/* Tab Navigation */}
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
      
      <TabContent className="flex-1 relative">
        {/* Three.js Container - Always mounted but conditionally visible */}
        <div 
          ref={containerRef} 
          className={`w-full h-full ${activeTab === 'model' ? 'visible' : 'invisible'}`}
          style={{
            position: activeTab === 'model' ? 'relative' : 'absolute',
            zIndex: activeTab === 'model' ? 1 : -1,
            pointerEvents: activeTab === 'model' ? 'auto' : 'none'
          }}
        />
        
        {/* Weather Tab Content */}
        {activeTab === 'weather' && (
          <div className="absolute inset-0 z-10 pt-16">
            <WeatherAndLocationTab />
          </div>
        )}
        
        {/* Model Tab UI Elements - Only shown when model tab is active */}
        {activeTab === 'model' && (
          <>
            {/* Left Toolbar */}
            <LeftToolbar
              isDrawing={drawingState.isDrawing}
              isInitialized={isInitialized}
              hasBuildings={buildings.length > 0}
              onStartDrawing={handleStartDrawing}
              onShowConfig={() => setShowBuildingConfig(!showBuildingConfig)}
              onExport={exportBuildings}
              onClearAll={handleClearAll}
              onSaveConfiguration={handleSaveConfiguration}
              onImportConfiguration={handleImportConfiguration}
              onToggleSunController={() => setShowSunController(!showSunController)}
              onToggleTheme={handleToggleTheme}
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
            <div className="absolute inset-0 pointer-events-none z-20">
              <FloatingInstructions
                mode={getInstructionMode()}
                drawingPoints={drawingState.points.length}
                buildingCount={buildings.length}
                onDismissWelcome={() => setHasInteracted(true)}
              />
            </div>

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
          </>
        )}
      </TabContent>
      
      {/* Global Overlays and Dialogs */}
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

      {/* Save Configuration Dialog */}
      <SaveConfigurationDialog
        isOpen={showSaveConfigDialog}
        onClose={() => setShowSaveConfigDialog(false)}
        onSave={handleSaveConfigurationConfirm}
      />

      {/* Import Configuration Dialog */}
      <ImportConfigDialog
        isOpen={showImportConfigDialog}
        onClose={() => setShowImportConfigDialog(false)}
        onImport={handleImportConfigConfirm}
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