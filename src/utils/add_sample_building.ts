/**
 * Standalone helper script to add pentagon sample buildings to the Three.js scene
 * 
 * This script provides a simple way to quickly add pentagon-shaped dummy buildings
 * for testing and development purposes.
 * 
 * Usage:
 * ```typescript
 * import { addSamplePentagonBuilding } from './utils/add_sample_building';
 * 
 * // Simple usage with defaults
 * const building = addSamplePentagonBuilding(threeJSCore);
 * 
 * // Custom configuration
 * const building = addSamplePentagonBuilding(threeJSCore, {
 *   centerX: 25,
 *   centerZ: 15,
 *   radius: 15,
 *   floors: 8,
 *   name: 'Custom Pentagon Building'
 * });
 * ```
 */

import * as THREE from 'three';
import { ThreeJSCore } from '../core/ThreeJSCore';
import { Point3D, BuildingConfig, BuildingData } from '../types/building';
import { BuildingService } from '../services/BuildingService';
import { getThemeColorAsHex } from './themeColors';


export interface SamplePentagonConfig {
  /** X coordinate of the pentagon center (default: 0) */
  centerX?: number;
  /** Z coordinate of the pentagon center (default: 0) */
  centerZ?: number;
  /** Radius of the pentagon (default: 12) */
  radius?: number;
  /** Number of floors (default: 5) */
  floors?: number;
  /** Height of each floor in meters (default: 3.5) */
  floorHeight?: number;
  /** Building color as hex number (default: theme blue) */
  color?: number;
  /** Building name (default: 'Pentagon Building') */
  name?: string;
  /** Building description (default: auto-generated) */
  description?: string;
  /** Window to wall ratio (default: 0.4) */
  windowToWallRatio?: number;
  /** Building program type (default: 'Office') */
  buildingProgram?: string;
  /** Structural system (default: 'Concrete') */
  structuralSystem?: string;
  /** Whether to add the building to the building manager (default: true) */
  addToManager?: boolean;
}

/**
 * Creates pentagon-shaped points around a center point
 */
function createPentagonPoints(centerX: number, centerZ: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const angleStep = (2 * Math.PI) / 5; // 72 degrees for each side
  
  // Start from the top point (angle = -PI/2 so the pentagon points upward)
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const z = centerZ + radius * Math.sin(angle);
    
    points.push({
      x: Math.round(x * 100) / 100, // Round to 2 decimal places
      y: 0,
      z: Math.round(z * 100) / 100
    });
  }
  
  return points;
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(points: Point3D[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].z;
    area -= points[j].x * points[i].z;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Creates footprint outline for the building (used for selection)
 */
function createFootprintOutline(points: Point3D[], scene: THREE.Scene): THREE.Mesh {
  const shape = new THREE.Shape();
  
  if (points.length > 0) {
    // Map coordinates correctly for the rotated mesh
    shape.moveTo(points[0].x, -points[0].z);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, -points[i].z);
    }
    shape.lineTo(points[0].x, -points[0].z); // Close the shape
  }

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: getThemeColorAsHex('--color-building-footprint', 0x00ffaa),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const footprint = new THREE.Mesh(geometry, material);
  footprint.rotation.x = -Math.PI / 2; // Lay flat on ground
  footprint.position.y = 0.05; // Slightly above ground
  footprint.visible = true;
  footprint.frustumCulled = false;

  scene.add(footprint);
  return footprint;
}

/**
 * Adds a pentagon-shaped building to the Three.js scene
 * 
 * @param threeJSCore - The ThreeJSCore instance
 * @param config - Configuration options for the pentagon building
 * @returns The created BuildingData object or null if creation failed
 */
export function addSamplePentagonBuilding(
  threeJSCore: ThreeJSCore,
  config: SamplePentagonConfig = {}
): BuildingData | null {
  try {
    // Validate that ThreeJS is initialized
    if (!threeJSCore.isReady()) {
      console.error('ThreeJS core is not ready. Please wait for initialization.');
      return null;
    }

    // Get required objects from ThreeJS core
    const scene = threeJSCore.getScene();
    const windowService = threeJSCore.getWindowService();

    // Default configuration
    const {
      centerX = 0,
      centerZ = 0,
      radius = 12,
      floors = 5,
      floorHeight = 3.5,
      color = getThemeColorAsHex('--color-building-sample', 0x4A90E2),
      name = 'Pentagon Building',
      description = `A pentagon-shaped building with ${floors} floors and ${radius}m radius`,
      windowToWallRatio = 0.4,
      buildingProgram = 'Office',
      structuralSystem = 'Concrete',
      addToManager = true
    } = config;

    // Create pentagon points
    const points = createPentagonPoints(centerX, centerZ, radius);
    
    // Create building configuration
    const buildingConfig: BuildingConfig = {
      floors,
      floorHeight,
      color,
      name,
      description,
      enableShadows: true,
      window_to_wall_ratio: windowToWallRatio,
      window_overhang: false,
      window_overhang_depth: 0.5,
      wall_construction: 'Concrete Block',
      floor_construction: 'Concrete Slab',
      roof_construction: 'Built-up Roof',
      window_construction: 'Double Glazed',
      structural_system: structuralSystem,
      building_program: buildingProgram,
      hvac_system: 'VAV',
      natural_ventilation: false
    };

    // Create building service for this operation
    const buildingService = new BuildingService(scene);
    
    // Create the building mesh
    const buildingMesh = buildingService.createBuilding(points, buildingConfig);
    
    // Calculate area for building data
    const area = calculatePolygonArea(points);
    
    // Generate unique building ID
    const buildingId = `pentagon_building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Configure mesh userData for interaction
    buildingMesh.userData = {
      buildingId,
      interactive: true,
      clickable: true,
      type: 'building',
      isBuilding: true,
      isSample: true,
      isPentagon: true
    };

    // Ensure the mesh is properly configured for shadows and interaction
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    buildingMesh.visible = true;
    buildingMesh.frustumCulled = false;
    buildingMesh.matrixAutoUpdate = true;
    buildingMesh.updateMatrix();
    buildingMesh.updateMatrixWorld(true);

    // Create building data object
    const building: BuildingData = {
      id: buildingId,
      mesh: buildingMesh,
      points,
      area,
      floors,
      floorHeight,
      createdAt: new Date(),
      name,
      description,
      color,
      footprintOutline: null,
      floorLines: null,
      window_to_wall_ratio: windowToWallRatio,
      window_overhang: buildingConfig.window_overhang,
      window_overhang_depth: buildingConfig.window_overhang_depth,
      wall_construction: buildingConfig.wall_construction,
      floor_construction: buildingConfig.floor_construction,
      roof_construction: buildingConfig.roof_construction,
      window_construction: buildingConfig.window_construction,
      structural_system: buildingConfig.structural_system,
      building_program: buildingConfig.building_program,
      hvac_system: buildingConfig.hvac_system,
      natural_ventilation: buildingConfig.natural_ventilation
    };

    // Create footprint outline for selection
    building.footprintOutline = createFootprintOutline(points, scene);
    building.footprintOutline.userData = {
      buildingId,
      isFootprint: true,
      interactive: true,
      parentBuildingId: buildingId
    };

    // Add windows if window service is available
    if (windowService) {
      const windowConfig = {
        windowWidth: 2.0,
        windowHeight: 1.5,
        windowSpacing: 1.0,
        frameThickness: 0.1,
        offsetDistance: 0.1,
        maxWindows: 50000
      };
      
      try {
        windowService.addBuildingWindows(building, windowConfig);
        console.log(`✅ Added windows to pentagon building: ${building.id}`);
      } catch (error) {
        console.warn('⚠️ Failed to add windows to building:', error);
      }
    }

    // Add the building directly to the scene
    threeJSCore.addObject(buildingMesh, {
      castShadow: true,
      receiveShadow: true
    });

    // Log creation details
    console.log('✅ Pentagon building created successfully:', {
      id: building.id,
      name: building.name,
      center: { x: centerX, z: centerZ },
      radius,
      floors,
      floorHeight,
      totalHeight: floors * floorHeight,
      points: points.length,
      area: area.toFixed(2) + ' m²',
      color: `#${color.toString(16).padStart(6, '0')}`,
      hasWindows: !!windowService,
      addedToManager: addToManager
    });

    return building;
    
  } catch (error) {
    console.error('❌ Error creating pentagon building:', error);
    return null;
  }
}

/**
 * Adds multiple pentagon buildings in a grid pattern
 * 
 * @param threeJSCore - The ThreeJSCore instance
 * @param count - Number of buildings to create (default: 3)
 * @param spacing - Distance between buildings (default: 30)
 * @param baseConfig - Base configuration for all buildings
 * @returns Array of created BuildingData objects
 */
export function addMultiplePentagonBuildings(
  threeJSCore: ThreeJSCore,
  count: number = 3,
  spacing: number = 30,
  baseConfig: Partial<SamplePentagonConfig> = {}
): BuildingData[] {
  const buildings: BuildingData[] = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    const centerX = (col - (gridSize - 1) / 2) * spacing;
    const centerZ = (row - (gridSize - 1) / 2) * spacing;
    
    // Randomize some properties for variety
    const buildingConfig: SamplePentagonConfig = {
      ...baseConfig,
      centerX,
      centerZ,
      radius: baseConfig.radius || 8 + Math.random() * 6, // Random radius 8-14
      floors: baseConfig.floors || Math.floor(3 + Math.random() * 7), // Random floors 3-9
      floorHeight: baseConfig.floorHeight || 3 + Math.random(), // Random height 3-4
      color: baseConfig.color || Math.floor(Math.random() * 0xffffff), // Random color
      name: baseConfig.name || `Pentagon Building ${i + 1}`,
      description: baseConfig.description || `Auto-generated pentagon building #${i + 1} in grid pattern`
    };
    
    const building = addSamplePentagonBuilding(threeJSCore, buildingConfig);
    
    if (building) {
      buildings.push(building);
    }
  }
  
  console.log(`✅ Created ${buildings.length} pentagon buildings in grid pattern`);
  return buildings;
}

/**
 * Creates a random pentagon building at a random location
 * 
 * @param threeJSCore - The ThreeJSCore instance
 * @param bounds - The bounds within which to place the building (default: ±50)
 * @returns The created BuildingData object or null
 */
export function addRandomPentagonBuilding(
  threeJSCore: ThreeJSCore,
  bounds: number = 50
): BuildingData | null {
  const randomConfig: SamplePentagonConfig = {
    centerX: (Math.random() - 0.5) * bounds * 2,
    centerZ: (Math.random() - 0.5) * bounds * 2,
    radius: 8 + Math.random() * 12, // 8-20m radius
    floors: Math.floor(2 + Math.random() * 8), // 2-9 floors
    floorHeight: 2.5 + Math.random() * 2, // 2.5-4.5m floor height
    color: Math.floor(Math.random() * 0xffffff),
    name: `Random Pentagon ${Math.floor(Math.random() * 1000)}`,
    description: 'Randomly generated pentagon building'
  };
  
  return addSamplePentagonBuilding(threeJSCore, randomConfig);
}

// Make functions available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).addSamplePentagonBuilding = (_config?: SamplePentagonConfig) => {
    console.warn('Global addSamplePentagonBuilding: ThreeJSCore instance required. Please use the exported function directly.');
    console.log('Usage: import { addSamplePentagonBuilding } from "./utils/add_sample_building";');
  };
  
  console.log('🏗️ Pentagon building helper loaded!');
  console.log('Available functions:');
  console.log('  - addSamplePentagonBuilding(threeJSCore, config?)');
  console.log('  - addMultiplePentagonBuildings(threeJSCore, count?, spacing?, baseConfig?)');
  console.log('  - addRandomPentagonBuilding(threeJSCore, bounds?)');
}

export default addSamplePentagonBuilding;
