import * as THREE from 'three';
import { BuildingData } from '../types/building';
import { getThemeColorAsHex } from '../utils/themeColors';
import { solveWindowParams } from './WindowParametricSolver';
import { placeWindowsOnEdge, createFrameGeometry } from './WindowGeometryPlacer';
import { buildWindowMatrices } from './WindowTransformBuilder';
import { WindowAnimationManager } from './WindowAnimationManager';

interface WindowConfig {
  windowWidth: number;
  windowHeight: number;
  windowSpacing: number;
  offsetDistance: number;
  frameThickness: number;
  maxWindows?: number;
}

interface WindowMaterials {
  glass: THREE.Material;
  frame: THREE.Material;
}

export class WindowService {
  private scene: THREE.Scene;
  private glassGeometry: THREE.PlaneGeometry;
  private frameGeometry: THREE.BufferGeometry;
  private materials: WindowMaterials;
  private maxWindows: number;
  
  public glassInstancedMesh: THREE.InstancedMesh;
  public frameInstancedMesh: THREE.InstancedMesh;
  
  private currentIndex = 0;
  private buildingWindows = new Map<string, number[]>(); // Track which indices belong to which building

  private animationManager = new WindowAnimationManager();

  constructor(scene: THREE.Scene, config: WindowConfig) {
    this.scene = scene;
    this.maxWindows = config.maxWindows ?? 50000;
    
    // Create geometries
    this.glassGeometry = new THREE.PlaneGeometry(config.windowWidth, config.windowHeight);
    this.frameGeometry = createFrameGeometry(
      config.windowWidth,
      config.windowHeight,
      config.frameThickness
    );
    
    // Create materials
    this.materials = this.createMaterials();
    
    // Create instanced meshes
    this.glassInstancedMesh = new THREE.InstancedMesh(
      this.glassGeometry,
      this.materials.glass,
      this.maxWindows
    );
    
    this.frameInstancedMesh = new THREE.InstancedMesh(
      this.frameGeometry,
      this.materials.frame,
      this.maxWindows
    );
    
    // Configure instanced meshes
    this.glassInstancedMesh.castShadow = false;
    this.glassInstancedMesh.receiveShadow = true;
    this.frameInstancedMesh.castShadow = true;
    this.frameInstancedMesh.receiveShadow = true;
    
    // Add to scene
    this.scene.add(this.glassInstancedMesh);
    this.scene.add(this.frameInstancedMesh);
    
    // Initially hide all instances
    this.glassInstancedMesh.count = 0;
    this.frameInstancedMesh.count = 0;
  }  private createMaterials(): WindowMaterials {
    const glass = new THREE.MeshPhongMaterial({
      color: 0x4A90E2, // Bright blue color
      transparent: true,
      opacity: 0.7,
      reflectivity: 0.9,
      shininess: 100,
      side: THREE.DoubleSide,
      depthWrite: false, // Better transparency rendering
      emissive: 0x225588, // More pronounced blue glow
      emissiveIntensity: 0.2
    });

    const frame = new THREE.MeshLambertMaterial({
      color: getThemeColorAsHex('--color-window-frame', 0x2D2D2D) // Darker, more realistic frame color
    });

    return { glass, frame };
  }

  addBuildingWindows(building: BuildingData, config: WindowConfig): void {
    if (!building.points || building.points.length < 3) return;

    // Remove existing windows for this building
    this.removeBuildingWindows(building.id);

    const footprint: THREE.Vector2[] = building.points.map(p => new THREE.Vector2(p.x, p.z));
    const numFloors = building.floors ?? 1;
    const floorHeight = building.floorHeight ?? 3;
    const wwr = building.window_to_wall_ratio ?? 0.4;

    const {
      windowWidth,
      windowHeight,
      windowSpacing,
      offsetDistance
    } = config;

    const buildingIndices: number[] = [];
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];
      const edgeVec = new THREE.Vector2().subVectors(p2, p1);
      const edgeLength = edgeVec.length();
      if (edgeLength < windowWidth * 0.5) continue;
      const dir = edgeVec.clone().normalize();
      const normal = new THREE.Vector2(dir.y, -dir.x);
      // Use parametric solver
      const parametric = solveWindowParams({
        edgeLength,
        windowWidth,
        windowHeight,
        windowSpacing,
        wwr
      });
      if (!parametric || parametric.numWindows < 1) continue;
      // Use geometry placer
      const placements = placeWindowsOnEdge({
        p1,
        p2,
        normal,
        edgeLength,
        numFloors,
        floorHeight,
        windowHeight,
        windowSpacing,
        offsetDistance,
        parametric
      });
      for (const placement of placements) {
        if (this.currentIndex >= this.maxWindows) {
          console.warn('Maximum number of windows reached');
          break;
        }
        // Use transform builder
        const { glassMatrix, frameMatrix } = buildWindowMatrices({
          position: placement.position,
          rotationY: placement.rotationY,
          scaleX: placement.scaleX,
          windowWidth,
          windowHeight,
          glassOffset: 0.02
        });
        this.glassInstancedMesh.setMatrixAt(this.currentIndex, glassMatrix);
        this.frameInstancedMesh.setMatrixAt(this.currentIndex, frameMatrix);
        buildingIndices.push(this.currentIndex);
        this.currentIndex++;
      }
    }
    this.buildingWindows.set(building.id, buildingIndices);
    this.updateInstanceCounts();
    console.log(`Added ${buildingIndices.length} windows for building ${building.id}. Total windows: ${this.currentIndex}`);
  }

  removeBuildingWindows(buildingId: string): void {
    const indices = this.buildingWindows.get(buildingId);
    if (!indices) return;

    // Create a set of indices to remove for efficient lookup
    const indicesToRemove = new Set(indices);
    
    // Compact the instanced meshes by moving non-removed instances
    let writeIndex = 0;
    const tempMatrix = new THREE.Matrix4();
    
    for (let readIndex = 0; readIndex < this.currentIndex; readIndex++) {
      if (!indicesToRemove.has(readIndex)) {
        if (writeIndex !== readIndex) {
          // Move this instance to the write position
          this.glassInstancedMesh.getMatrixAt(readIndex, tempMatrix);
          this.glassInstancedMesh.setMatrixAt(writeIndex, tempMatrix);
          
          this.frameInstancedMesh.getMatrixAt(readIndex, tempMatrix);
          this.frameInstancedMesh.setMatrixAt(writeIndex, tempMatrix);
        }
        writeIndex++;
      }
    }

    // Update current index
    this.currentIndex = writeIndex;
    
    // Update building indices map (shift indices down)
    const indexMapping = new Map<number, number>();
    let newIndex = 0;
    for (let oldIndex = 0; oldIndex < this.currentIndex + indices.length; oldIndex++) {
      if (!indicesToRemove.has(oldIndex)) {
        indexMapping.set(oldIndex, newIndex++);
      }
    }

    // Update all building index arrays
    for (const [id, buildingIndices] of this.buildingWindows.entries()) {
      if (id !== buildingId) {
        const updatedIndices = buildingIndices
          .map(idx => indexMapping.get(idx))
          .filter(idx => idx !== undefined) as number[];
        this.buildingWindows.set(id, updatedIndices);
      }
    }    // Remove the building from the map
    this.buildingWindows.delete(buildingId);
    this.updateInstanceCounts();
    
    // Debug logging
    console.log(`Removed windows for building ${buildingId}. Total windows: ${this.currentIndex}`);
  }

  private updateInstanceCounts(): void {
    this.glassInstancedMesh.count = this.currentIndex;
    this.frameInstancedMesh.count = this.currentIndex;
    this.glassInstancedMesh.instanceMatrix.needsUpdate = true;
    this.frameInstancedMesh.instanceMatrix.needsUpdate = true;
  }
  updateBuildingWindows(building: BuildingData, config: WindowConfig): void {
    // For now, use the existing method - but this can be optimized
    this.addBuildingWindows(building, config);
  }

  // New efficient update method that only updates matrices for a specific building
  updateBuildingWindowsEfficient(building: BuildingData, config: WindowConfig): void {
    if (!building.points || building.points.length < 3) return;

    const existingIndices = this.buildingWindows.get(building.id);
    if (!existingIndices) {
      // If building doesn't have windows yet, add them normally
      this.addBuildingWindows(building, config);
      return;
    }

    // Calculate new window configuration
    const newWindowData = calculateWindowMatrices(building, config);
      if (newWindowData.length === existingIndices.length) {
      // Same number of windows - just update matrices
      for (let i = 0; i < newWindowData.length; i++) {
        const index = existingIndices[i];
        this.glassInstancedMesh.setMatrixAt(index, newWindowData[i].glassMatrix);
        this.frameInstancedMesh.setMatrixAt(index, newWindowData[i].frameMatrix);
      }
      
      // Mark for update
      this.glassInstancedMesh.instanceMatrix.needsUpdate = true;
      this.frameInstancedMesh.instanceMatrix.needsUpdate = true;
    } else if (newWindowData.length < existingIndices.length) {
      // Fewer windows - update existing and clear unused indices
      for (let i = 0; i < newWindowData.length; i++) {
        const index = existingIndices[i];
        this.glassInstancedMesh.setMatrixAt(index, newWindowData[i].glassMatrix);
        this.frameInstancedMesh.setMatrixAt(index, newWindowData[i].frameMatrix);
      }
      
      // Clear leftover matrices to prevent ghost windows
      const identity = new THREE.Matrix4().makeScale(0, 0, 0); // Make invisible
      for (let i = newWindowData.length; i < existingIndices.length; i++) {
        const index = existingIndices[i];
        this.glassInstancedMesh.setMatrixAt(index, identity);
        this.frameInstancedMesh.setMatrixAt(index, identity);
      }
      
      // Update building indices to reflect new count
      this.buildingWindows.set(building.id, existingIndices.slice(0, newWindowData.length));
      
      // Mark for update
      this.glassInstancedMesh.instanceMatrix.needsUpdate = true;
      this.frameInstancedMesh.instanceMatrix.needsUpdate = true;
    } else {
      // More windows needed - use full rebuild
      this.addBuildingWindows(building, config);
    }
  }  // Method to animate window updates for smoother transitions
  updateBuildingWindowsSmooth(building: BuildingData, config: WindowConfig, duration: number = 300): void {
    if (!building.points || building.points.length < 3) return;
    this.animationManager.cancelBuildingAnimation(building.id);
    const existingIndices = this.buildingWindows.get(building.id);
    if (!existingIndices) {
      this.addBuildingWindows(building, config);
      return;
    }
    const newWindowData = calculateWindowMatrices(building, config);
    if (newWindowData.length === existingIndices.length) {
      this.animationManager.animateWindowTransition(
        building.id,
        existingIndices,
        this.glassInstancedMesh,
        this.frameInstancedMesh,
        newWindowData,
        duration
      );
    } else {
      this.updateBuildingWindowsEfficient(building, config);
    }
  }
  dispose(): void {
    this.animationManager.dispose();
    // Remove from scene
    this.scene.remove(this.glassInstancedMesh);
    this.scene.remove(this.frameInstancedMesh);
    
    // Dispose geometries
    this.glassGeometry.dispose();
    this.frameGeometry.dispose();
    
    // Dispose materials
    this.materials.glass.dispose();
    this.materials.frame.dispose();
    
    // Clear references
    this.buildingWindows.clear();
  }

  getBuildingWindowCount(buildingId: string): number {
    return this.buildingWindows.get(buildingId)?.length ?? 0;
  }

  getTotalWindowCount(): number {
    return this.currentIndex;
  }
}

function calculateWindowMatrices(building: BuildingData, config: WindowConfig): Array<{glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4}> {
  const matrices: Array<{glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4}> = [];
  const footprint: THREE.Vector2[] = building.points.map(p => new THREE.Vector2(p.x, p.z));
  const numFloors = building.floors ?? 1;
  const floorHeight = building.floorHeight ?? 3;
  const wwr = building.window_to_wall_ratio ?? 0.4;
  const {
    windowWidth,
    windowHeight,
    windowSpacing,
    offsetDistance
  } = config;
  for (let i = 0; i < footprint.length; i++) {
    const p1 = footprint[i];
    const p2 = footprint[(i + 1) % footprint.length];
    const edgeVec = new THREE.Vector2().subVectors(p2, p1);
    const edgeLength = edgeVec.length();
    if (edgeLength < windowWidth * 0.5) continue;
    const dir = edgeVec.clone().normalize();
    const normal = new THREE.Vector2(dir.y, -dir.x);
    const parametric = solveWindowParams({
      edgeLength,
      windowWidth,
      windowHeight,
      windowSpacing,
      wwr
    });
    if (!parametric || parametric.numWindows < 1) continue;
    const placements = placeWindowsOnEdge({
      p1,
      p2,
      normal,
      edgeLength,
      numFloors,
      floorHeight,
      windowHeight,
      windowSpacing,
      offsetDistance,
      parametric
    });
    for (const placement of placements) {
      matrices.push(buildWindowMatrices({
        position: placement.position,
        rotationY: placement.rotationY,
        scaleX: placement.scaleX,
        windowWidth,
        windowHeight,
        glassOffset: 0.02
      }));
    }
  }
  return matrices;
}
