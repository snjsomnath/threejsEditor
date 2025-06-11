import * as THREE from 'three';
import { Point3D } from '../types/building';

export class DrawingService {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createPointMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.3, position.z);
    this.scene.add(marker);
    
    return marker;
  }

  createLine(from: Point3D, to: Point3D): THREE.Line {
    const material = new THREE.LineBasicMaterial({ 
      color: 0x44ff44,
      linewidth: 2
    });
    const points = [
      new THREE.Vector3(from.x, 0.2, from.z),
      new THREE.Vector3(to.x, 0.2, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    
    this.scene.add(line);
    return line;
  }

  clearMarkers(markers: THREE.Mesh[]): void {
    markers.forEach(marker => {
      this.scene.remove(marker);
      marker.geometry.dispose();
      if (Array.isArray(marker.material)) {
        marker.material.forEach(mat => mat.dispose());
      } else {
        marker.material.dispose();
      }
    });
  }

  clearLines(lines: THREE.Line[]): void {
    lines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      if (Array.isArray(line.material)) {
        line.material.forEach(mat => mat.dispose());
      } else {
        line.material.dispose();
      }
    });
  }
}