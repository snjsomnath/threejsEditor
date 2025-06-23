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
  
  // Add preview state tracking
  private previewState = {
    hasActivePreview: false,
    isClearing: false,
    sessionId: 0 // Add session tracking
  };
  
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
        linewidth: 3, // Increase line width for better visibility
        transparent: true,
        opacity: 1.0 // Make lines fully opaque
      });
      
      DrawingService.previewLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x88ff00, // Brighter green for preview lines
        linewidth: 2,
        transparent: true,
        opacity: 0.8 // Increase opacity for better visibility
      });
    }
  }

  createPointMarker(position: Point3D): THREE.Mesh {
    const marker = new THREE.Mesh(DrawingService.pointGeometry!, DrawingService.pointMaterial!);
    marker.position.set(position.x, position.y + 0.25, position.z);
    marker.castShadow = true;
    marker.receiveShadow = false;
    
    // CRITICAL: Configure for proper interaction detection
    marker.visible = true;
    marker.frustumCulled = false;
    marker.matrixAutoUpdate = true;
    marker.updateMatrix();
    marker.updateMatrixWorld(true);
    
    // Add userData for identification and cleanup
    marker.userData = {
      isDrawingElement: true,
      isPoint: true,
      type: 'footprint',
      isFootprintPoint: true
    };
    
    this.scene.add(marker);
    return marker;
  }

  createPreviewMarker(position: Point3D): THREE.Mesh {
    const marker = new THREE.Mesh(DrawingService.previewGeometry!, DrawingService.previewMaterial!);
    marker.position.set(position.x, position.y + 0.3, position.z); // Increase height for better visibility
    
    // Add userData for identification and cleanup
    marker.userData = {
      isDrawingElement: true,
      isPreviewPoint: true,
      type: 'footprint',
      isFootprintPreview: true,
      zOrder: 100 // Higher z-order for visibility
    };
    
    // Ensure it renders on top
    marker.renderOrder = 100;
    marker.frustumCulled = false; // Prevent culling issues
    
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
    marker.position.set(position.x, position.y + 0.4, position.z); // Even higher for snap markers
    
    // Add userData for identification and cleanup
    marker.userData = {
      isDrawingElement: true,
      isSnapPoint: true,
      type: 'footprint',
      isFootprintPreview: true,
      zOrder: 200 // Highest z-order
    };
    
    // Ensure it renders on top of everything
    marker.renderOrder = 200;
    marker.frustumCulled = false;
    
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
      new THREE.Vector3(from.x, 0.1, from.z), // Lower the line slightly
      new THREE.Vector3(to.x, 0.1, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, DrawingService.lineMaterial!);
    
    // Add userData for identification and cleanup
    line.userData = {
      isDrawingElement: true,
      isLine: true,
      type: 'footprint',
      isFootprintLine: true
    };
    
    this.scene.add(line);
    return line;
  }

  createPreviewLine(from: Point3D, to: Point3D): THREE.Line {
    const points = [
      new THREE.Vector3(from.x, 0.2, from.z), // Higher than regular lines for visibility
      new THREE.Vector3(to.x, 0.2, to.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, DrawingService.previewLineMaterial!);
    
    // Add userData for identification and cleanup
    line.userData = {
      isDrawingElement: true,
      isPreviewLine: true,
      type: 'footprint',
      isFootprintPreview: true,
      zOrder: 50
    };
    
    // Ensure proper rendering order
    line.renderOrder = 50;
    line.frustumCulled = false;
    
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
    // Prevent double-clearing during cleanup
    if (this.previewState.isClearing) return;
    
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

  clearAllDrawingElements(): void {
    this.previewState.isClearing = true;
    
    // Clear all animation frames
    this.animationFrameIds.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.animationFrameIds.clear();
    
    // Find and remove all drawing-related objects from scene (but preserve shared resources)
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        // Check if it's a drawing element (markers, lines, footprints) but NOT a building mesh
        if ((child.userData.isDrawingElement || 
             child.userData.isFootprint ||
             child.userData.isFootprintPoint ||
             child.userData.isFootprintLine ||
             child.userData.isFootprintPreview ||
             child.userData.isPreviewPoint ||
             child.userData.isPreviewLine ||
             child.userData.isSnapPoint) &&
            !child.userData.isBuilding && // Don't remove actual building meshes
            !child.userData.buildingId) { // Don't remove objects that belong to completed buildings
          objectsToRemove.push(child);
        }
      }
    });
    
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        // Only dispose geometry if it's NOT a shared resource
        if (obj.geometry !== DrawingService.pointGeometry && 
            obj.geometry !== DrawingService.previewGeometry &&
            obj.geometry !== DrawingService.snapGeometry) {
          obj.geometry.dispose();
        }
        
        // Only dispose material if it's NOT a shared resource
        if (obj.material !== DrawingService.pointMaterial && 
            obj.material !== DrawingService.previewMaterial &&
            obj.material !== DrawingService.snapMaterial &&
            obj.material !== DrawingService.lineMaterial &&
            obj.material !== DrawingService.previewLineMaterial) {
          (obj.material as THREE.Material).dispose();
        }
      }
    });
    
    // Reset preview state
    this.previewState.isClearing = false;
    this.previewState.hasActivePreview = false;
    this.previewState.sessionId++; // Increment session ID
  }

  // Add method to reset preview state
  resetPreviewState(): void {
    this.previewState.hasActivePreview = false;
    this.previewState.isClearing = false;
    this.previewState.sessionId++; // Increment session ID for new drawing session
    
    // Clear any remaining animation frames
    this.animationFrameIds.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.animationFrameIds.clear();
  }

  updatePreviewMarker(marker: THREE.Mesh, position: Point3D): void {
    marker.position.set(position.x, position.y + 0.3, position.z); // Maintain consistent height
  }

  updatePreviewLine(line: THREE.Line, from: Point3D, to: Point3D): void {
    const points = [
      new THREE.Vector3(from.x, 0.2, from.z), // Keep consistent height
      new THREE.Vector3(to.x, 0.2, to.z)
    ];
    
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
}