import * as THREE from 'three';
import { Point3D } from '../types/building';

export class DrawingService {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createPointMarker(position: Point3D): THREE.Mesh {
    // Smaller, more subtle point markers
    const geometry = new THREE.SphereGeometry(0.25, 12, 12);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.25, position.z);
    marker.castShadow = true;
    this.scene.add(marker);
    
    return marker;
  }

  createPreviewMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.2, 12, 12);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7,
      emissive: 0x004400,
      emissiveIntensity: 0.3
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.2, position.z);
    this.scene.add(marker);
    
    return marker;
  }

  createSnapPreviewMarker(position: Point3D): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
      emissive: 0xffff00,
      emissiveIntensity: 0.4
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.set(position.x, 0.3, position.z);
    this.scene.add(marker);
    
    // Enhanced pulsing animation
    const animate = () => {
      const time = Date.now() * 0.008;
      const scale = 1 + Math.sin(time) * 0.3;
      marker.scale.setScalar(scale);
      
      // Animate emissive intensity
      const intensity = 0.4 + Math.sin(time * 1.5) * 0.2;
      (marker.material as THREE.MeshLambertMaterial).emissiveIntensity = intensity;
      
      requestAnimationFrame(animate);
    };
    animate();
    
    return marker;
  }

  createLine(from: Point3D, to: Point3D): THREE.Line {
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00ff88,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const points = [
      new THREE.Vector3(from.x, 0.3, from.z),
      new THREE.Vector3(to.x, 0.3, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    
    this.scene.add(line);
    return line;
  }

  createPreviewLine(from: Point3D, to: Point3D): THREE.Line {
    const material = new THREE.LineBasicMaterial({ 
      color: 0x88ff88,
      linewidth: 1,
      transparent: true,
      opacity: 0.5,
      linecap: 'round',
      linejoin: 'round'
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

  clearPreviewLine(line: THREE.Line): void {
    this.scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }
}