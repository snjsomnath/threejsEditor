import * as THREE from 'three';
import { Point3D, BuildingConfig } from '../types/building';
import { calculateCentroid, createShapeFromPoints } from '../utils/geometry';

export class BuildingService {
  private scene: THREE.Scene;
  
  // Reusable geometries and materials for better performance
  private static debugMaterial: THREE.MeshLambertMaterial | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeSharedResources();
  }

  private initializeSharedResources(): void {
    if (!BuildingService.debugMaterial) {
      BuildingService.debugMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.3
      });
    }
  }

  createBuilding(points: Point3D[], config: BuildingConfig): THREE.Mesh {
    if (points.length < 3) {
      throw new Error('Need at least 3 points to create a building');
    }

    const centroid = calculateCentroid(points);
    const shape = createShapeFromPoints(points, centroid);
    
    // Calculate height from floors and floorHeight
    const height = config.height || (config.floors * config.floorHeight);
    
    // Extrude the shape to create 3D geometry
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
      steps: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Rotate geometry so it extrudes upward (Y-axis)
    geometry.rotateX(-Math.PI / 2);
    
    // Create material with proper shadow settings
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
      side: THREE.DoubleSide
    });
    
    const building = new THREE.Mesh(geometry, material);
    
    // Position at centroid
    building.position.set(centroid.x, 0, centroid.z);
    
    // IMPORTANT: Enable shadows explicitly
    building.castShadow = true;
    building.receiveShadow = true;
    
    // Ensure proper userData for interaction
    building.userData = { 
      type: 'building',
      interactive: true,
      clickable: true,
      castsShadows: true
    };
    
    // Add to scene (don't use this.scene.add directly)
    this.scene.add(building);
    
    console.log('Building created with shadows enabled:', {
      castShadow: building.castShadow,
      receiveShadow: building.receiveShadow,
      position: building.position,
      height: height
    });
    
    return building;
  }

  createPreviewBuilding(points: Point3D[], config: BuildingConfig): THREE.Mesh {
    if (points.length < 3) {
      throw new Error('Need at least 3 points to create a preview building');
    }

    const centroid = calculateCentroid(points);
    const shape = createShapeFromPoints(points, centroid);
    
    // Calculate height from floors and floorHeight
    const height = config.height || (config.floors * config.floorHeight);
    
    // Extrude the shape to create 3D geometry
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
      steps: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Rotate geometry so it extrudes upward (Y-axis)
    geometry.rotateX(-Math.PI / 2);
    
    // Create semi-transparent preview material
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      wireframe: false
    });
    
    const previewBuilding = new THREE.Mesh(geometry, material);
    
    // Position at centroid
    previewBuilding.position.set(centroid.x, 0, centroid.z);
    
    // Enable shadows for preview too (helps with visualization)
    previewBuilding.castShadow = true;
    previewBuilding.receiveShadow = true;
    
    // Add userData for identification and cleanup
    previewBuilding.userData = {
      isDrawingElement: true,
      isPreview: true,
      type: 'footprint',
      isFootprintPreview: true,
      castsShadows: true
    };
    
    this.scene.add(previewBuilding);
    return previewBuilding;
  }

  clearPreviewBuilding(building: THREE.Mesh): void {
    this.scene.remove(building);
    building.geometry.dispose();
    (building.material as THREE.Material).dispose();
  }

  updatePreviewBuilding(building: THREE.Mesh, points: Point3D[], config: BuildingConfig): void {
    if (points.length < 3) {
      return;
    }

    const centroid = calculateCentroid(points);
    const shape = createShapeFromPoints(points, centroid);
    
    // Calculate height from floors and floorHeight
    const height = config.height || (config.floors * config.floorHeight);
    
    // Extrude the shape to create 3D geometry
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
      steps: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Rotate geometry so it extrudes upward (Y-axis)
    geometry.rotateX(-Math.PI / 2);
    
    // Update building geometry and position
    building.geometry.dispose();
    building.geometry = geometry;
    building.position.set(centroid.x, 0, centroid.z);
  }

  createDebugMarker(position: Point3D, color: number = 0x00ff00): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.5, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, position.y, position.z);
    marker.userData = { isDebugMarker: true, temporary: true };
    this.scene.add(marker);
    
    return marker;
  }

  clearDebugMarkers(): void {
    const markersToRemove = this.scene.children.filter(
      child => child.userData?.isDebugMarker
    );
    
    markersToRemove.forEach(marker => {
      this.scene.remove(marker);
      if (marker instanceof THREE.Mesh) {
        marker.geometry.dispose();
        if (marker.material !== BuildingService.debugMaterial) {
          (marker.material as THREE.Material).dispose();
        }
      }
    });
  }
}