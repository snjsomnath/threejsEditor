/**
 * Test examples for the pentagon building helper script
 * 
 * This file demonstrates various ways to use the add_sample_building helper
 * to create pentagon-shaped dummy buildings in the Three.js scene.
 */

import { addSamplePentagonBuilding, addMultiplePentagonBuildings, addRandomPentagonBuilding } from '../utils/add_sample_building';
import type { ThreeJSCore } from '../core/ThreeJSCore';

/**
 * Example 1: Basic pentagon building
 */
export function createBasicPentagonBuilding(threeJSCore: ThreeJSCore) {
  console.log('Creating basic pentagon building...');
  
  const building = addSamplePentagonBuilding(threeJSCore);
  
  if (building) {
    console.log('✅ Basic pentagon building created:', building.id);
    return building;
  } else {
    console.error('❌ Failed to create basic pentagon building');
    return null;
  }
}

/**
 * Example 2: Custom pentagon building with specific properties
 */
export function createCustomPentagonBuilding(threeJSCore: ThreeJSCore) {
  console.log('Creating custom pentagon building...');
  
  const building = addSamplePentagonBuilding(threeJSCore, {
    centerX: 25,
    centerZ: 15,
    radius: 15,
    floors: 8,
    floorHeight: 3.2,
    color: 0x2E86AB, // Blue color
    name: 'Custom Office Tower',
    description: 'A modern office building with 8 floors',
    windowToWallRatio: 0.5,
    buildingProgram: 'Office',
    structuralSystem: 'Steel'
  });
  
  if (building) {
    console.log('✅ Custom pentagon building created:', {
      id: building.id,
      name: building.name,
      floors: building.floors,
      area: building.area.toFixed(2) + ' m²'
    });
    return building;
  } else {
    console.error('❌ Failed to create custom pentagon building');
    return null;
  }
}

/**
 * Example 3: Small residential pentagon building
 */
export function createResidentialPentagonBuilding(threeJSCore: ThreeJSCore) {
  console.log('Creating residential pentagon building...');
  
  const building = addSamplePentagonBuilding(threeJSCore, {
    centerX: -25,
    centerZ: 0,
    radius: 10,
    floors: 3,
    floorHeight: 2.8,
    color: 0xE67E22, // Orange color
    name: 'Residential Pentagon',
    description: 'A small residential building',
    windowToWallRatio: 0.3,
    buildingProgram: 'Residential',
    structuralSystem: 'Timber'
  });
  
  if (building) {
    console.log('✅ Residential pentagon building created:', building.id);
    return building;
  } else {
    console.error('❌ Failed to create residential pentagon building');
    return null;
  }
}

/**
 * Example 4: Grid of pentagon buildings
 */
export function createPentagonBuildingGrid(threeJSCore: ThreeJSCore) {
  console.log('Creating pentagon building grid...');
  
  const buildings = addMultiplePentagonBuildings(threeJSCore, 9, 40, {
    floors: 6,
    color: 0x8E44AD, // Purple color
    buildingProgram: 'Mixed Use',
    structuralSystem: 'Concrete',
    windowToWallRatio: 0.45
  });
  
  console.log(`✅ Created ${buildings.length} buildings in grid pattern`);
  return buildings;
}

/**
 * Example 5: Random pentagon buildings for testing
 */
export function createRandomPentagonBuildings(threeJSCore: ThreeJSCore, count: number = 5) {
  console.log(`Creating ${count} random pentagon buildings...`);
  
  const buildings = [];
  
  for (let i = 0; i < count; i++) {
    const building = addRandomPentagonBuilding(threeJSCore, 60);
    if (building) {
      buildings.push(building);
    }
  }
  
  console.log(`✅ Created ${buildings.length} random pentagon buildings`);
  return buildings;
}

/**
 * Example 6: Different building types showcase
 */
export function createBuildingTypesShowcase(threeJSCore: ThreeJSCore) {
  console.log('Creating building types showcase...');
  
  const buildings = [];
  
  // Office building
  buildings.push(addSamplePentagonBuilding(threeJSCore, {
    centerX: 0,
    centerZ: 40,
    radius: 12,
    floors: 10,
    color: 0x3498DB,
    name: 'Office Complex',
    buildingProgram: 'Office',
    structuralSystem: 'Steel',
    windowToWallRatio: 0.6
  }));
  
  // Residential building
  buildings.push(addSamplePentagonBuilding(threeJSCore, {
    centerX: -35,
    centerZ: 20,
    radius: 8,
    floors: 4,
    color: 0xE74C3C,
    name: 'Residential Complex',
    buildingProgram: 'Residential',
    structuralSystem: 'Timber',
    windowToWallRatio: 0.35
  }));
  
  // Retail building
  buildings.push(addSamplePentagonBuilding(threeJSCore, {
    centerX: 35,
    centerZ: 20,
    radius: 15,
    floors: 2,
    floorHeight: 4.5,
    color: 0xF39C12,
    name: 'Shopping Center',
    buildingProgram: 'Retail',
    structuralSystem: 'Concrete',
    windowToWallRatio: 0.7
  }));
  
  // Industrial building
  buildings.push(addSamplePentagonBuilding(threeJSCore, {
    centerX: 0,
    centerZ: -20,
    radius: 20,
    floors: 1,
    floorHeight: 8,
    color: 0x95A5A6,
    name: 'Warehouse',
    buildingProgram: 'Industrial',
    structuralSystem: 'Steel',
    windowToWallRatio: 0.2
  }));
  
  const successfulBuildings = buildings.filter(b => b !== null);
  console.log(`✅ Created ${successfulBuildings.length} buildings in showcase`);
  
  return successfulBuildings;
}

/**
 * Example 7: Performance test with many small buildings
 */
export function createPerformanceTest(threeJSCore: ThreeJSCore) {
  console.log('Creating performance test buildings...');
  
  const buildings = [];
  const startTime = performance.now();
  
  // Create 25 small buildings in a 5x5 grid
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      const building = addSamplePentagonBuilding(threeJSCore, {
        centerX: (x - 2) * 15,
        centerZ: (z - 2) * 15,
        radius: 4,
        floors: 2 + Math.floor(Math.random() * 3),
        color: Math.floor(Math.random() * 0xffffff),
        name: `Test Building ${x}-${z}`,
        buildingProgram: 'Office',
        windowToWallRatio: 0.4
      });
      
      if (building) {
        buildings.push(building);
      }
    }
  }
  
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);
  
  console.log(`✅ Performance test completed: ${buildings.length} buildings created in ${duration}ms`);
  
  return buildings;
}

/**
 * Main demonstration function that runs all examples
 */
export function runAllPentagonBuildingExamples(threeJSCore: ThreeJSCore) {
  console.log('🏗️ Running all pentagon building examples...');
  
  if (!threeJSCore.isReady()) {
    console.error('❌ ThreeJS core is not ready. Please wait for initialization.');
    return;
  }
  
  const results = {
    basic: createBasicPentagonBuilding(threeJSCore),
    custom: createCustomPentagonBuilding(threeJSCore),
    residential: createResidentialPentagonBuilding(threeJSCore),
    grid: createPentagonBuildingGrid(threeJSCore),
    random: createRandomPentagonBuildings(threeJSCore, 3),
    showcase: createBuildingTypesShowcase(threeJSCore),
    performance: createPerformanceTest(threeJSCore)
  };
  
  console.log('🎉 All pentagon building examples completed!');
  console.log('Results summary:', {
    basic: !!results.basic,
    custom: !!results.custom,
    residential: !!results.residential,
    gridCount: results.grid.length,
    randomCount: results.random.length,
    showcaseCount: results.showcase.length,
    performanceCount: results.performance.length
  });
  
  return results;
}

// Export individual examples for selective use
export const pentagonBuildingExamples = {
  basic: createBasicPentagonBuilding,
  custom: createCustomPentagonBuilding,
  residential: createResidentialPentagonBuilding,
  grid: createPentagonBuildingGrid,
  random: createRandomPentagonBuildings,
  showcase: createBuildingTypesShowcase,
  performance: createPerformanceTest,
  runAll: runAllPentagonBuildingExamples
};

export default pentagonBuildingExamples;
