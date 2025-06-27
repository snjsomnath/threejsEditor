import { useCallback } from 'react';
import { BuildingService } from '../services/BuildingService';
import { WindowService } from '../services/WindowService';
import { BuildingData } from '../types/building';
import { addSampleBuilding, addMultipleSampleBuildings, SampleBuildingConfig } from '../utils/addSampleBuilding';

interface UseSampleBuildingsProps {
  buildingService: BuildingService | null;
  windowService: WindowService | null;
  addBuilding?: (building: BuildingData) => void;
}

/**
 * Hook that provides functions to add sample buildings to the scene
 */
export const useSampleBuildings = ({ 
  buildingService, 
  windowService, 
  addBuilding 
}: UseSampleBuildingsProps) => {
  
  const createSampleBuilding = useCallback((config: SampleBuildingConfig = {}) => {
    if (!buildingService) {
      console.warn('BuildingService not available');
      return null;
    }

    const building = addSampleBuilding(buildingService, windowService, config);
    
    if (building && addBuilding) {
      // If we have an addBuilding callback (from building manager), use it
      // to properly integrate with the building management system
      addBuilding(building);
    }
    
    return building;
  }, [buildingService, windowService, addBuilding]);

  const createMultipleSampleBuildings = useCallback((count: number = 3, spacing: number = 30) => {
    if (!buildingService) {
      console.warn('BuildingService not available');
      return [];
    }

    const buildings = addMultipleSampleBuildings(buildingService, windowService, count, spacing);
    
    if (addBuilding) {
      // Add each building to the building manager
      buildings.forEach(building => addBuilding(building));
    }
    
    return buildings;
  }, [buildingService, windowService, addBuilding]);

  const createSamplePentagon = useCallback((centerX: number = 0, centerZ: number = 0, radius: number = 12) => {
    return createSampleBuilding({
      centerX,
      centerZ,
      radius,
      floors: 5,
      floorHeight: 3.5,
      name: 'Sample Pentagon Building',
      description: 'A pentagon-shaped building for testing'
    });
  }, [createSampleBuilding]);

  const createSampleOfficeBuilding = useCallback((centerX: number = 0, centerZ: number = 0) => {
    return createSampleBuilding({
      centerX,
      centerZ,
      radius: 15,
      floors: 8,
      floorHeight: 3.2,
      color: 0x4A90E2,
      name: 'Sample Office Building',
      description: 'A tall office building with multiple floors',
      windowToWallRatio: 0.5
    });
  }, [createSampleBuilding]);

  const createSampleResidentialBuilding = useCallback((centerX: number = 0, centerZ: number = 0) => {
    return createSampleBuilding({
      centerX,
      centerZ,
      radius: 10,
      floors: 3,
      floorHeight: 2.8,
      color: 0xE2A04A,
      name: 'Sample Residential Building',
      description: 'A small residential building',
      windowToWallRatio: 0.3
    });
  }, [createSampleBuilding]);

  return {
    createSampleBuilding,
    createMultipleSampleBuildings,
    createSamplePentagon,
    createSampleOfficeBuilding,
    createSampleResidentialBuilding
  };
};
