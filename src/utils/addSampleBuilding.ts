import * as THREE from 'three'; // Used for type references and math operations
import { Point3D, BuildingConfig, BuildingData } from '../types/building';
import { BuildingService } from '../services/BuildingService';
import { WindowService } from '../services/WindowService';
import { getThemeColorAsHex } from './themeColors';

export interface SampleBuildingConfig {
  centerX?: number;
  centerZ?: number;
  radius?: number;
  floors?: number;
  floorHeight?: number;
  color?: number;
  name?: string;
  description?: string;
  windowToWallRatio?: number;
}

/**
 * Creates a pentagon building with 5 sides positioned around a center point
 */
export function createPentagonPoints(centerX: number = 0, centerZ: number = 0, radius: number = 10): Point3D[] {
  const points: Point3D[] = [];
  const angleStep = (2 * Math.PI) / 5; // 72 degrees for each side of pentagon
  
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
 * Creates a sample pentagon building and adds it to the scene
 */
export function addSampleBuilding(
  buildingService: BuildingService,
  windowService: WindowService | null = null,
  config: SampleBuildingConfig = {}
): BuildingData | null {
  try {
    // Default configuration
    const {
      centerX = 0,
      centerZ = 0,
      radius = 12,
      floors = 5,
      floorHeight = 3.5,
      color = getThemeColorAsHex('--color-building-sample', 0x4A90E2),
      name = 'Sample Pentagon Building',
      description = 'A sample pentagon-shaped building for testing',
      windowToWallRatio = 0.4
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
      structural_system: 'Concrete',
      building_program: 'Office',
      hvac_system: 'VAV',
      natural_ventilation: false
    };

    // Create the building mesh using BuildingService
    const buildingMesh = buildingService.createBuilding(points, buildingConfig);
    
    // Calculate area for building data
    const area = calculatePolygonArea(points);
    
    // Generate unique building ID
    const buildingId = `sample_building_${Date.now()}`;
    
    // Configure mesh userData for interaction
    buildingMesh.userData = {
      buildingId,
      interactive: true,
      clickable: true,
      type: 'building',
      isBuilding: true,
      isSample: true
    };

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
      
      windowService.addBuildingWindows(building, windowConfig);
      console.log(`Added windows to sample building: ${building.id}`);
    }

    // Log creation details
    console.log('Sample pentagon building created:', {
      id: building.id,
      name: building.name,
      center: { x: centerX, z: centerZ },
      radius,
      floors,
      floorHeight,
      points: points.length,
      area: area.toFixed(2),
      color: `#${color.toString(16).padStart(6, '0')}`,
      hasWindows: !!windowService
    });

    return building;
    
  } catch (error) {
    console.error('Error creating sample building:', error);
    return null;
  }
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(points: Point3D[]): number {
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
 * Creates multiple sample buildings in a grid pattern
 */
export function addMultipleSampleBuildings(
  buildingService: BuildingService,
  windowService: WindowService | null = null,
  count: number = 3,
  spacing: number = 30
): BuildingData[] {
  const buildings: BuildingData[] = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    
    const centerX = (col - (gridSize - 1) / 2) * spacing;
    const centerZ = (row - (gridSize - 1) / 2) * spacing;
    
    const building = addSampleBuilding(buildingService, windowService, {
      centerX,
      centerZ,
      radius: 20,
      floors: 5,
      floorHeight: 2.5,
      color: 0xffffff,
      name: `Sample Building ${i + 1}`,
      description: `Auto-generated sample building #${i + 1}`
    });
    
    if (building) {
      buildings.push(building);
    }
  }
  
  console.log(`Created ${buildings.length} sample buildings in grid pattern`);
  return buildings;
}
