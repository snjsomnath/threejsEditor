import { useCallback } from 'react';
import { BuildingService } from '../services/BuildingService';
import { WindowService } from '../services/WindowService';
import { BuildingData } from '../types/building';
import { addSampleBuilding, SampleBuildingConfig } from '../utils/addSampleBuilding';

interface UseSampleBuildingsProps {
  buildingService: BuildingService | null;
  windowService: WindowService | null;
  addBuilding?: (building: BuildingData) => void;
}

/**
 * Hook for creating a debug pentagon building to test window creation.
 * DEBUG ONLY - will be removed in production.
 */
export const useSampleBuildings = ({ 
  buildingService, 
  windowService, 
  addBuilding 
}: UseSampleBuildingsProps) => {
  
  const createDebugBuilding = useCallback((config: SampleBuildingConfig = {}) => {
    if (!buildingService) {
      console.warn('BuildingService not available');
      return null;
    }

    const building = addSampleBuilding(buildingService, windowService, config);
    
    if (building && addBuilding) {
      addBuilding(building);
    }
    
    return building;
  }, [buildingService, windowService, addBuilding]);

  return {
    createDebugBuilding
  };
};
