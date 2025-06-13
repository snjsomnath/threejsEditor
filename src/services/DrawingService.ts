import * as THREE from 'three';
import { Point3D } from '../types/building';

export class DrawingService {
  private scene: THREE.Scene;
  private animationFrameIds: Map<THREE.Mesh, number> = new Map();
  
  // Reusable geometries and materials for better performance
  private static pointGeometry: THREE.SphereGeometry | null = null;
  private static previewGeometry: THREE.SphereGeometry | null = null;
  private static snapGeometry: THREE.SphereGeometry | null = null;
  
  private static pointMaterial: THREE.MeshLambertMaterial | null = null;
  private static previewMaterial: THREE.MeshLambertMaterial | null = null;
  private static snapMaterial: THREE.MeshLambertMaterial | null = null;
  private static lineMaterial: THREE.LineBasicMaterial | null = null;
  private static previewLineMaterial: THREE.LineBasicMaterial | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeSharedResources();
  }

  private initializeSharedResources(): void {
    if (!DrawingService.pointGeometry) {
      DrawingService.pointGeometry = new THREE.SphereGeometry(0.25, 12, 12);
      DrawingService.previewGeometry = new THREE.SphereGeometry(0.2, 12, 12);
      DrawingService.snapGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      
      DrawingService.pointMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff4444,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
      });
      
      DrawingService.previewMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
        emissive: 0x004400,
        emissiveIntensity: 0.3
      });
      
      DrawingService.snapMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.9,
        emissive: 0xffff00,
        emissiveIntensity: 0.4
      });
      
      DrawingService.lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff88,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      
      DrawingService.previewLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x88ff88,
        linewidth: 1,
        transparent: true,
        opacity: 0.5
      });
    }
  }

  createPointMarker(position: Point3D): THREE.Mesh {
    const marker = new THREE.Mesh(DrawingService.pointGeometry!, DrawingService.pointMaterial!);
    marker.position.set(position.x, position.y + 0.25, position.z);
    marker.castShadow = true;
    this.scene.add(marker);
    return marker;
  }

  createPreviewMarker(position: Point3D): THREE.Mesh {
    const marker = new THREE.Mesh(DrawingService.previewGeometry!, DrawingService.previewMaterial!);
    marker.position.set(position.x, position.y + 0.2, position.z);
    this.scene.add(marker);
    return marker;
  }

  createSnapPreviewMarker(position: Point3D): THREE.Mesh {
    // Create a new material instance for animation (can't share animated materials)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
      emissive: 0xffff00,
      emissiveIntensity: 0.4
    });
    
    const marker = new THREE.Mesh(DrawingService.snapGeometry!, material);
    marker.position.set(position.x, position.y + 0.3, position.z);
    this.scene.add(marker);
    
    // Optimized pulsing animation
    let isActive = true;
    const animate = () => {
      if (!isActive || !this.scene.children.includes(marker)) {
        return;
      }
      
      const time = Date.now() * 0.008;
      const scale = 1 + Math.sin(time) * 0.3;
      marker.scale.setScalar(scale);
      
      const intensity = 0.4 + Math.sin(time * 1.5) * 0.2;
      (marker.material as THREE.MeshLambertMaterial).emissiveIntensity = intensity;
      
      const frameId = requestAnimationFrame(animate);
      this.animationFrameIds.set(marker, frameId);
    };
    
    (marker as any).stopAnimation = () => { isActive = false; };
    animate();
    return marker;
  }

  createLine(from: Point3D, to: Point3D): THREE.Line {
    const points = [
      new THREE.Vector3(from.x, 0.3, from.z),
      new THREE.Vector3(to.x, 0.3, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, DrawingService.lineMaterial!);
    
    this.scene.add(line);
    return line;
  }

  createPreviewLine(from: Point3D, to: Point3D): THREE.Line {
    const points = [
      new THREE.Vector3(from.x, 0.2, from.z),
      new THREE.Vector3(to.x, 0.2, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, DrawingService.previewLineMaterial!);
    
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
    // Stop any ongoing animations
    if (this.animationFrameIds.has(marker)) {
      const frameId = this.animationFrameIds.get(marker)!;
      cancelAnimationFrame(frameId);
      this.animationFrameIds.delete(marker);
    }
    
    // Stop animation if it's a snap marker
    if ((marker as any).stopAnimation) {
      (marker as any).stopAnimation();
    }
    
    this.scene.remove(marker);
    // Only dispose geometry if it's not shared
    if (marker.geometry !== DrawingService.pointGeometry && 
        marker.geometry !== DrawingService.previewGeometry && 
        marker.geometry !== DrawingService.snapGeometry) {
      marker.geometry.dispose();
    }
    // Only dispose material if it's not shared
    if (marker.material !== DrawingService.pointMaterial && 
        marker.material !== DrawingService.previewMaterial) {
      (marker.material as THREE.Material).dispose();
    }
  }

  clearPreviewLine(line: THREE.Line): void {
    this.scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }
}