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

    // Calculate centroid for positioning
    const centroid = calculateCentroid(points);
    
    // Create 2D shape from points
    const shape = createShapeFromPoints(points, centroid);
    
    // Extrude the shape to create 3D geometry
    const extrudeSettings = {
      depth: config.height,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Create material
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
      side: THREE.DoubleSide
    });
    
    const building = new THREE.Mesh(geometry, material);
    
    // Position the building at the centroid
    building.position.set(centroid.x, 0, centroid.z);
    
    // Rotate so the extrusion goes up (Y-axis)
    building.rotation.x = -Math.PI / 2;
    
    if (config.enableShadows) {
      building.castShadow = true;
      building.receiveShadow = true;
    }
    
    this.scene.add(building);
    return building;
  }

  createDebugMarker(position: Point3D, color: number = 0x00ff00): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(position.x, position.y + 0.3, position.z);
    this.scene.add(marker);
    
    return marker;
  }
}