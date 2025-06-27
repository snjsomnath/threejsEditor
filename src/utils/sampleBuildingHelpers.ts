/**
 * Browser console helper functions for adding sample buildings
 * 
 * Usage in browser console:
 * - addSamplePentagonBuilding() - Adds a single pentagon building
 * - addSampleOfficeBuilding() - Adds an office building
 * - addSampleResidentialBuilding() - Adds a residential building  
 * - addMultipleSampleBuildings(5) - Adds 5 buildings in a grid
 * - clearSampleBuildings() - Removes all sample buildings
 */

import { addSampleBuilding, addMultipleSampleBuildings } from './addSampleBuilding';

// Store references to sample buildings for cleanup
let sampleBuildings: any[] = [];

/**
 * Initialize the sample building helpers with scene and services
 * This should be called from the main app to set up the helpers
 */
export function initializeSampleBuildingHelpers(
  buildingService: any,
  windowService: any,
  addBuildingToManager?: (building: any) => void
) {
  // Make functions available globally for console access
  (window as any).addSamplePentagonBuilding = () => {
    const building = addSampleBuilding(buildingService, windowService, {
      centerX: 0,
      centerZ: 0,
      radius: 12,
      floors: 5,
      floorHeight: 3.5,
      name: 'Console Pentagon Building',
      description: 'Pentagon building added from browser console'
    });
    
    if (building) {
      sampleBuildings.push(building);
      if (addBuildingToManager) {
        addBuildingToManager(building);
      }
      console.log('✅ Added sample pentagon building:', building.id);
      return building;
    }
    console.error('❌ Failed to create pentagon building');
    return null;
  };

  (window as any).addSampleOfficeBuilding = () => {
    const building = addSampleBuilding(buildingService, windowService, {
      centerX: 25,
      centerZ: 0,
      radius: 15,
      floors: 8,
      floorHeight: 3.2,
      color: 0x4A90E2,
      name: 'Console Office Building',
      description: 'Office building added from browser console',
      windowToWallRatio: 0.5
    });
    
    if (building) {
      sampleBuildings.push(building);
      if (addBuildingToManager) {
        addBuildingToManager(building);
      }
      console.log('✅ Added sample office building:', building.id);
      return building;
    }
    console.error('❌ Failed to create office building');
    return null;
  };

  (window as any).addSampleResidentialBuilding = () => {
    const building = addSampleBuilding(buildingService, windowService, {
      centerX: -25,
      centerZ: 0,
      radius: 10,
      floors: 3,
      floorHeight: 2.8,
      color: 0xE2A04A,
      name: 'Console Residential Building',
      description: 'Residential building added from browser console',
      windowToWallRatio: 0.3
    });
    
    if (building) {
      sampleBuildings.push(building);
      if (addBuildingToManager) {
        addBuildingToManager(building);
      }
      console.log('✅ Added sample residential building:', building.id);
      return building;
    }
    console.error('❌ Failed to create residential building');
    return null;
  };

  (window as any).addMultipleSampleBuildings = (count: number = 3) => {
    const buildings = addMultipleSampleBuildings(buildingService, windowService, count, 40);
    
    if (buildings.length > 0) {
      sampleBuildings.push(...buildings);
      if (addBuildingToManager) {
        buildings.forEach(building => addBuildingToManager(building));
      }
      console.log(`✅ Added ${buildings.length} sample buildings in grid pattern`);
      return buildings;
    }
    console.error('❌ Failed to create sample buildings');
    return [];
  };

  (window as any).clearSampleBuildings = () => {
    const count = sampleBuildings.length;
    // Note: This would need to be implemented with proper scene cleanup
    // For now, just clear the references
    sampleBuildings = [];
    console.log(`✅ Cleared ${count} sample building references`);
    console.warn('Note: Buildings still exist in scene. Use building manager to properly remove them.');
  };

  (window as any).listSampleBuildings = () => {
    console.log('Sample buildings created:', sampleBuildings.map(b => ({
      id: b.id,
      name: b.name,
      floors: b.floors,
      area: b.area.toFixed(2)
    })));
    return sampleBuildings;
  };

  // Log available functions
  console.log('🏗️ Sample building helpers initialized!');
  console.log('Available console functions:');
  console.log('  - addSamplePentagonBuilding()');
  console.log('  - addSampleOfficeBuilding()');
  console.log('  - addSampleResidentialBuilding()');
  console.log('  - addMultipleSampleBuildings(count)');
  console.log('  - listSampleBuildings()');
  console.log('  - clearSampleBuildings()');
}

/**
 * Clean up global functions (call on app unmount)
 */
export function cleanupSampleBuildingHelpers() {
  delete (window as any).addSamplePentagonBuilding;
  delete (window as any).addSampleOfficeBuilding;
  delete (window as any).addSampleResidentialBuilding;
  delete (window as any).addMultipleSampleBuildings;
  delete (window as any).clearSampleBuildings;
  delete (window as any).listSampleBuildings;
  sampleBuildings = [];
}
