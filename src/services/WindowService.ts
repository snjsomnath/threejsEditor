import * as THREE from 'three';
import { BuildingData } from '../types/building';
import { getThemeColorAsHex } from '../utils/themeColors';

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
  private frameGeometry: THREE.BoxGeometry;
  private materials: WindowMaterials;
  private maxWindows: number;
  
  public glassInstancedMesh: THREE.InstancedMesh;
  public frameInstancedMesh: THREE.InstancedMesh;
  
  private currentIndex = 0;
  private buildingWindows = new Map<string, number[]>(); // Track which indices belong to which building

  // Animation support for smooth window transitions
  private animatingBuildings = new Set<string>();
  private animationFrameId: number | null = null;

  constructor(scene: THREE.Scene, config: WindowConfig) {
    this.scene = scene;
    this.maxWindows = config.maxWindows ?? 50000;
    
    // Create geometries
    this.glassGeometry = new THREE.PlaneGeometry(config.windowWidth, config.windowHeight);
    this.frameGeometry = new THREE.BoxGeometry(
      config.windowWidth + config.frameThickness,
      config.windowHeight + config.frameThickness,
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

    const buildingIndices: number[] = [];    // Process each edge of the building footprint
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];

      const edgeVec = new THREE.Vector2().subVectors(p2, p1);
      const edgeLength = edgeVec.length();
      
      // Skip very short edges
      if (edgeLength < windowWidth * 0.5) continue;
      
      const dir = edgeVec.clone().normalize();
      const normal = new THREE.Vector2(-dir.y, dir.x); // Outward normal      // Calculate window distribution based on WWR
      const wallAreaPerFloor = edgeLength * floorHeight;
      
      // Determine optimal number of windows and their dimensions
      const minWindowWidth = windowWidth * 0.7; // Allow smaller windows
      const maxWindowWidth = windowWidth * 1.5; // Allow larger windows
      const minSpacing = windowSpacing * 0.5;
      
      // Try different numbers of windows to find best fit
      let bestConfig = null;
      let bestScore = -1;
      
      for (let numWindows = 1; numWindows <= Math.floor(edgeLength / minWindowWidth); numWindows++) {
        const availableWidth = edgeLength - minSpacing * 2; // Leave minimum margins
        const totalSpacing = minSpacing * (numWindows - 1);
        const windowAreaWidth = availableWidth - totalSpacing;
        
        if (windowAreaWidth <= 0) continue;
        
        const calculatedWindowWidth = windowAreaWidth / numWindows;
        
        // Check if window width is within acceptable range
        if (calculatedWindowWidth < minWindowWidth || calculatedWindowWidth > maxWindowWidth) continue;
        
        const windowArea = calculatedWindowWidth * windowHeight * numWindows;
        const areaRatio = windowArea / wallAreaPerFloor;
        
        // Score based on how close we get to target WWR
        const score = 1 - Math.abs(areaRatio - wwr);
        
        if (score > bestScore) {
          bestScore = score;
          bestConfig = {
            numWindows,
            windowWidth: calculatedWindowWidth,
            spacing: minSpacing,
            marginStart: (edgeLength - (calculatedWindowWidth * numWindows + minSpacing * (numWindows - 1))) / 2
          };
        }
      }
      
      if (!bestConfig || bestConfig.numWindows < 1) continue;

      // Calculate vertical distribution
      const verticalSpacing = windowSpacing;
      const availableVerticalSpace = floorHeight - 2 * verticalSpacing;
      const windowRows = Math.max(1, Math.floor(availableVerticalSpace / (windowHeight + verticalSpacing)));

      // Place windows with the optimized configuration
      for (let floor = 0; floor < numFloors; floor++) {
        const baseY = floor * floorHeight;

        for (let row = 0; row < windowRows; row++) {
          const rowY = baseY + verticalSpacing + (row + 0.5) * (availableVerticalSpace / windowRows);

          for (let col = 0; col < bestConfig.numWindows; col++) {
            if (this.currentIndex >= this.maxWindows) {
              console.warn('Maximum number of windows reached');
              break;
            }

            // Calculate window position along the edge
            const edgePos = bestConfig.marginStart + col * (bestConfig.windowWidth + bestConfig.spacing) + bestConfig.windowWidth / 2;
            const edgeT = edgePos / edgeLength;

            const pos2D = p1.clone().lerp(p2, edgeT);
            const x = pos2D.x + normal.x * offsetDistance;
            const z = pos2D.y + normal.y * offsetDistance;

            const position = new THREE.Vector3(x, rowY, z);
            
            // Fix window orientation - make windows face outward from building
            const rotationY = Math.atan2(dir.y, dir.x);
            const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0));

            // Scale based on calculated window width
            const scaleX = bestConfig.windowWidth / windowWidth;
            const windowScale = new THREE.Vector3(scaleX, 1, 1);

            // Create transformation matrices with proper forward offset for glass
            const glassOffset = new THREE.Vector3(normal.x * 0.02, 0, normal.y * 0.02); // Glass slightly forward
            const glassMatrix = new THREE.Matrix4().compose(
              position.clone().add(glassOffset),
              rotation,
              windowScale
            );

            const frameMatrix = new THREE.Matrix4().compose(
              position,
              rotation,
              windowScale
            );

            // Set matrices for both glass and frame
            this.glassInstancedMesh.setMatrixAt(this.currentIndex, glassMatrix);
            this.frameInstancedMesh.setMatrixAt(this.currentIndex, frameMatrix);

            buildingIndices.push(this.currentIndex);
            this.currentIndex++;
          }
        }
      }
    }

    // Store indices for this building
    this.buildingWindows.set(building.id, buildingIndices);
    this.updateInstanceCounts();
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
    }

    // Remove the building from the map
    this.buildingWindows.delete(buildingId);
    this.updateInstanceCounts();
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
    const newWindowData = this.calculateWindowMatrices(building, config);
    
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
    } else {
      // Different number of windows - use full rebuild
      this.addBuildingWindows(building, config);
    }
  }

  // Method to animate window updates for smoother transitions
  updateBuildingWindowsSmooth(building: BuildingData, config: WindowConfig, duration: number = 300): void {
    if (!building.points || building.points.length < 3) return;

    const existingIndices = this.buildingWindows.get(building.id);
    if (!existingIndices) {
      // If building doesn't have windows yet, add them normally
      this.addBuildingWindows(building, config);
      return;
    }

    // Calculate new window configuration
    const newWindowData = this.calculateWindowMatrices(building, config);
    
    if (newWindowData.length === existingIndices.length) {
      // Same number of windows - animate the transition
      this.animateWindowTransition(building.id, existingIndices, newWindowData, duration);
    } else {
      // Different number of windows - use regular update
      this.updateBuildingWindowsEfficient(building, config);
    }
  }
  private animateWindowTransition(
    buildingId: string, 
    indices: number[], 
    targetData: Array<{glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4}>,
    duration: number
  ): void {
    const startTime = performance.now();
    const startMatrices = indices.map(() => ({
      glass: new THREE.Matrix4(),
      frame: new THREE.Matrix4()
    }));

    // Store current matrices
    indices.forEach((index, i) => {
      this.glassInstancedMesh.getMatrixAt(index, startMatrices[i].glass);
      this.frameInstancedMesh.getMatrixAt(index, startMatrices[i].frame);
    });

    this.animatingBuildings.add(buildingId);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother animation
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Interpolate matrices using decompose/compose
      indices.forEach((index, i) => {
        const startGlass = startMatrices[i].glass;
        const startFrame = startMatrices[i].frame;
        const targetGlass = targetData[i].glassMatrix;
        const targetFrame = targetData[i].frameMatrix;

        // Decompose start matrices
        const startGlassPos = new THREE.Vector3();
        const startGlassQuat = new THREE.Quaternion();
        const startGlassScale = new THREE.Vector3();
        startGlass.decompose(startGlassPos, startGlassQuat, startGlassScale);

        const startFramePos = new THREE.Vector3();
        const startFrameQuat = new THREE.Quaternion();
        const startFrameScale = new THREE.Vector3();
        startFrame.decompose(startFramePos, startFrameQuat, startFrameScale);

        // Decompose target matrices
        const targetGlassPos = new THREE.Vector3();
        const targetGlassQuat = new THREE.Quaternion();
        const targetGlassScale = new THREE.Vector3();
        targetGlass.decompose(targetGlassPos, targetGlassQuat, targetGlassScale);

        const targetFramePos = new THREE.Vector3();
        const targetFrameQuat = new THREE.Quaternion();
        const targetFrameScale = new THREE.Vector3();
        targetFrame.decompose(targetFramePos, targetFrameQuat, targetFrameScale);

        // Interpolate components
        const currentGlassPos = startGlassPos.clone().lerp(targetGlassPos, eased);
        const currentGlassQuat = startGlassQuat.clone().slerp(targetGlassQuat, eased);
        const currentGlassScale = startGlassScale.clone().lerp(targetGlassScale, eased);

        const currentFramePos = startFramePos.clone().lerp(targetFramePos, eased);
        const currentFrameQuat = startFrameQuat.clone().slerp(targetFrameQuat, eased);
        const currentFrameScale = startFrameScale.clone().lerp(targetFrameScale, eased);

        // Compose new matrices
        const currentGlass = new THREE.Matrix4().compose(currentGlassPos, currentGlassQuat, currentGlassScale);
        const currentFrame = new THREE.Matrix4().compose(currentFramePos, currentFrameQuat, currentFrameScale);

        this.glassInstancedMesh.setMatrixAt(index, currentGlass);
        this.frameInstancedMesh.setMatrixAt(index, currentFrame);
      });

      // Mark for update
      this.glassInstancedMesh.instanceMatrix.needsUpdate = true;
      this.frameInstancedMesh.instanceMatrix.needsUpdate = true;

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animatingBuildings.delete(buildingId);
        if (this.animatingBuildings.size === 0) {
          this.animationFrameId = null;
        }
      }
    };

    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Helper method to calculate window matrices without adding them to the mesh
  private calculateWindowMatrices(building: BuildingData, config: WindowConfig): Array<{glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4}> {
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
    } = config;    // Process each edge of the building footprint
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];

      const edgeVec = new THREE.Vector2().subVectors(p2, p1);
      const edgeLength = edgeVec.length();
      
      // Skip very short edges
      if (edgeLength < windowWidth * 0.5) continue;
      
      const dir = edgeVec.clone().normalize();
      const normal = new THREE.Vector2(-dir.y, dir.x); // Outward normal

      // Calculate window distribution based on WWR
      const wallAreaPerFloor = edgeLength * floorHeight;
      
      // Determine optimal number of windows and their dimensions
      const minWindowWidth = windowWidth * 0.7; // Allow smaller windows
      const maxWindowWidth = windowWidth * 1.5; // Allow larger windows
      const minSpacing = windowSpacing * 0.5;
      
      // Try different numbers of windows to find best fit
      let bestConfig = null;
      let bestScore = -1;
      
      for (let numWindows = 1; numWindows <= Math.floor(edgeLength / minWindowWidth); numWindows++) {
        const availableWidth = edgeLength - minSpacing * 2; // Leave minimum margins
        const totalSpacing = minSpacing * (numWindows - 1);
        const windowAreaWidth = availableWidth - totalSpacing;
        
        if (windowAreaWidth <= 0) continue;
        
        const calculatedWindowWidth = windowAreaWidth / numWindows;
        
        // Check if window width is within acceptable range
        if (calculatedWindowWidth < minWindowWidth || calculatedWindowWidth > maxWindowWidth) continue;
        
        const windowArea = calculatedWindowWidth * windowHeight * numWindows;
        const areaRatio = windowArea / wallAreaPerFloor;
        
        // Score based on how close we get to target WWR
        const score = 1 - Math.abs(areaRatio - wwr);
        
        if (score > bestScore) {
          bestScore = score;
          bestConfig = {
            numWindows,
            windowWidth: calculatedWindowWidth,
            spacing: minSpacing,
            marginStart: (edgeLength - (calculatedWindowWidth * numWindows + minSpacing * (numWindows - 1))) / 2
          };
        }
      }
      
      if (!bestConfig || bestConfig.numWindows < 1) continue;

      // Calculate vertical distribution
      const verticalSpacing = windowSpacing;
      const availableVerticalSpace = floorHeight - 2 * verticalSpacing;
      const windowRows = Math.max(1, Math.floor(availableVerticalSpace / (windowHeight + verticalSpacing)));

      // Place windows with the optimized configuration
      for (let floor = 0; floor < numFloors; floor++) {
        const baseY = floor * floorHeight;

        for (let row = 0; row < windowRows; row++) {
          const rowY = baseY + verticalSpacing + (row + 0.5) * (availableVerticalSpace / windowRows);

          for (let col = 0; col < bestConfig.numWindows; col++) {
            // Calculate window position along the edge
            const edgePos = bestConfig.marginStart + col * (bestConfig.windowWidth + bestConfig.spacing) + bestConfig.windowWidth / 2;
            const edgeT = edgePos / edgeLength;

            const pos2D = p1.clone().lerp(p2, edgeT);
            const x = pos2D.x + normal.x * offsetDistance;
            const z = pos2D.y + normal.y * offsetDistance;

            const position = new THREE.Vector3(x, rowY, z);
            
            // Fix window orientation - make windows face outward from building
            const rotationY = Math.atan2(dir.y, dir.x);
            const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0));

            // Scale based on calculated window width
            const scaleX = bestConfig.windowWidth / windowWidth;
            const windowScale = new THREE.Vector3(scaleX, 1, 1);

            // Create transformation matrices with proper forward offset for glass
            const glassOffset = new THREE.Vector3(normal.x * 0.02, 0, normal.y * 0.02); // Glass slightly forward
            const glassMatrix = new THREE.Matrix4().compose(
              position.clone().add(glassOffset),
              rotation,
              windowScale
            );

            const frameMatrix = new THREE.Matrix4().compose(
              position,
              rotation,
              windowScale
            );

            matrices.push({ glassMatrix, frameMatrix });
          }
        }
      }
    }

    return matrices;
  }

  updateThemeColors(): void {
    // Update glass material
    const glassMaterial = this.materials.glass as THREE.MeshPhongMaterial;
    glassMaterial.color.setHex(getThemeColorAsHex('--color-window-glass', 0x87CEEB));
    
    // Update frame material
    const frameMaterial = this.materials.frame as THREE.MeshLambertMaterial;
    frameMaterial.color.setHex(getThemeColorAsHex('--color-window-frame', 0x4A4A4A));
  }
  dispose(): void {
    // Cancel any ongoing animations
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animatingBuildings.clear();
    
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
