import * as THREE from 'three';
import { Point3D } from '../types/building';

export class DrawingService {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createPointMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.5, position.z);
    this.scene.add(marker);
    
    return marker;
  }

  createPreviewMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 12, 12);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.3, position.z);
    this.scene.add(marker);
    
    return marker;
  }

  createSnapPreviewMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      emissive: 0xffff00,
      emissiveIntensity: 0.2
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.4, position.z);
    this.scene.add(marker);
    
    // Add pulsing animation for snap indicator
    const animate = () => {
      const time = Date.now() * 0.005;
      marker.scale.setScalar(1 + Math.sin(time) * 0.2);
      requestAnimationFrame(animate);
    };
    animate();
    
    return marker;
  }

  createLine(from: Point3D, to: Point3D): THREE.Line {
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const points = [
      new THREE.Vector3(from.x, 0.5, from.z),
      new THREE.Vector3(to.x, 0.5, to.z)
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
      (marker.material as THREE.Material).dispose();
    });
  }

  clearLines(lines: THREE.Line[]): void {
    lines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
  }

  clearPreviewMarker(marker: THREE.Mesh): void {
    this.scene.remove(marker);
    marker.geometry.dispose();
    (marker.material as THREE.Material).dispose();
  }
}