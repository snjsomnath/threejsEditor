import * as THREE from 'three';
import { Point3D, BuildingConfig } from '../types/building';
import { calculateCentroid, createShapeFromPoints } from '../utils/geometry';

export class BuildingService {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
    
    // Create material
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
      side: THREE.DoubleSide
    });
    
    const building = new THREE.Mesh(geometry, material);
    
    // Position at centroid
    building.position.set(centroid.x, 0, centroid.z);
    
    if (config.enableShadows) {
      building.castShadow = true;
      building.receiveShadow = true;
    }
    
    this.scene.add(building);
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
    this.scene.add(marker);
    
    return marker;
  }
}