import { useEffect, useRef, useState } from 'react';
import { ThreeManager } from '../utils/ThreeManager';
import { Building } from '../types/Building';

export const useThreeJS = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const threeManagerRef = useRef<ThreeManager | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (containerRef.current && !threeManagerRef.current) {
      console.log('🚀 useThreeJS: Creating ThreeManager');
      threeManagerRef.current = new ThreeManager(containerRef.current);
      
      // Wait for initialization to complete
      const checkInitialization = () => {
        if (threeManagerRef.current?.isReady()) {
          console.log('✅ useThreeJS: ThreeManager is ready');
          setIsInitialized(true);
        } else {
          console.log('⏳ useThreeJS: Waiting for ThreeManager to be ready...');
          setTimeout(checkInitialization, 100);
        }
      };
      checkInitialization();
    }

    return () => {
      if (threeManagerRef.current) {
        console.log('🧹 useThreeJS: Disposing ThreeManager');
        threeManagerRef.current.dispose();
        threeManagerRef.current = null;
      }
    };
  }, []);

  const startDrawing = () => {
    console.log('🎨 useThreeJS: startDrawing called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready yet');
      return;
    }
    
    console.log('✅ useThreeJS: Starting drawing mode');
    setIsDrawing(true);
    
    threeManagerRef.current.startDrawing(() => {
      console.log('🏁 useThreeJS: Drawing completed');
      setIsDrawing(false);
      updateSelectedBuilding();
    });
  };

  const stopDrawing = () => {
    console.log('🛑 useThreeJS: stopDrawing called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready');
      return;
    }
    
    threeManagerRef.current.stopDrawing();
    setIsDrawing(false);
    console.log('✅ useThreeJS: Drawing stopped');
  };

  const updateSelectedBuilding = () => {
    if (!isInitialized || !threeManagerRef.current) return;
    
    const building = threeManagerRef.current.getSelectedBuilding();
    console.log('🏢 useThreeJS: Selected building updated:', building);
    setSelectedBuilding(building);
  };

  const updateBuildingHeight = (height: number) => {
    console.log('📏 useThreeJS: updateBuildingHeight called', height);
    
    if (!isInitialized || !threeManagerRef.current || !selectedBuilding) {
      console.warn('❌ useThreeJS: Cannot update height - missing requirements');
      return;
    }
    
    threeManagerRef.current.updateBuildingHeight(selectedBuilding.id, height);
    updateSelectedBuilding();
  };

  const deleteSelectedBuilding = () => {
    console.log('🗑️ useThreeJS: deleteSelectedBuilding called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready');
      return;
    }
    
    threeManagerRef.current.deleteSelectedBuilding();
    setSelectedBuilding(null);
  };

  const exportBuildings = () => {
    console.log('📤 useThreeJS: exportBuildings called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready');
      return '';
    }
    
    return threeManagerRef.current.exportBuildings();
  };

  const toggleGrid = () => {
    console.log('📐 useThreeJS: toggleGrid called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready');
      return;
    }
    
    const newShowGrid = !showGrid;
    console.log('📐 useThreeJS: Setting grid visible:', newShowGrid);
    setShowGrid(newShowGrid);
    threeManagerRef.current.setGridVisible(newShowGrid);
  };

  const toggleSnapToGrid = () => {
    console.log('🧲 useThreeJS: toggleSnapToGrid called');
    
    if (!isInitialized || !threeManagerRef.current) {
      console.warn('❌ useThreeJS: ThreeManager not ready');
      return;
    }
    
    const newSnapToGrid = !snapToGrid;
    console.log('🧲 useThreeJS: Setting snap to grid:', newSnapToGrid);
    setSnapToGrid(newSnapToGrid);
    threeManagerRef.current.setSnapToGrid(newSnapToGrid);
  };

  return {
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
  };
};