import * as THREE from 'three';
import { getThemeColorAsHex } from '../utils/themeColors';

// Use CSS variables for theme colors via our utility function
const DEFAULT_COLORS = {
  get GROUND(): number { return getThemeColorAsHex('--color-ground', 0xffffff); },
  get GRID(): number { return getThemeColorAsHex('--color-grid', 0x999999); },
} as const;

export interface EnvironmentConfig {
  groundSize?: number;
  groundColor?: number;
  groundOpacity?: number;
  gridSize?: number;
  gridDivisions?: number;
  gridColor?: number;
  gridOpacity?: number; // Add this

  showGrid?: boolean;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private config: EnvironmentConfig;
  private groundPlane: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private materials: THREE.Material[] = [];

  constructor(scene: THREE.Scene, config: EnvironmentConfig = {}) {
    this.scene = scene;
    this.config = {
      groundSize: 1000,
      groundColor: DEFAULT_COLORS.GROUND,
      groundOpacity: 1,
      gridSize: 100,
      gridDivisions: 100,
      gridColor: DEFAULT_COLORS.GRID,
      gridOpacity: 1.0,
      showGrid: true,
      ...config
    };
  }

  initialize(): void {
    this.createGroundPlane();
    this.createGrid();
  }

  private createGroundPlane(): void {
    const groundGeometry = new THREE.PlaneGeometry(
      this.config.groundSize!,
      this.config.groundSize!
    );    const groundMaterial = new THREE.MeshStandardMaterial({
      color: this.config.groundColor!,
      transparent: this.config.groundOpacity! < 1,
      opacity: this.config.groundOpacity!,
      roughness: 0.9, // Increased for better shadow contrast and softer appearance
      metalness: 0.05, // Slight metalness for better reflection of ambient light
      side: THREE.DoubleSide,
      depthWrite: true,
      alphaTest: this.config.groundOpacity! < 1 ? 0.1 : 0,
      // Add these properties for better shadow reception
      shadowSide: THREE.FrontSide,
      // Control environment map intensity
      envMapIntensity: 0.2
    });
    
    this.materials.push(groundMaterial);
    
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.01;
    this.groundPlane.receiveShadow = true; // This is crucial for shadows
    this.groundPlane.castShadow = false; // Ground shouldn't cast shadows
    this.groundPlane.userData = { isGround: true };
    
    // Ensure the ground plane has proper normals for shadow reception
    groundGeometry.computeVertexNormals();
    
    this.scene.add(this.groundPlane);
    
    console.log('Ground plane created with shadow reception enabled');
  }

  private createGrid(): void {
    const gridColorCenter = new THREE.Color(this.config.gridColor!);
    const gridColorGrid = new THREE.Color(this.config.gridColor!).multiplyScalar(0.9);
    
    this.gridHelper = new THREE.GridHelper(
      this.config.gridSize!,
      this.config.gridDivisions!,
      gridColorCenter,
      gridColorGrid    );
    
    this.gridHelper.position.y = 0.005; // Slightly higher to avoid z-fighting with ground
    this.gridHelper.visible = this.config.showGrid!;
      // Fix material conflicts by properly configuring grid materials
    if (this.gridHelper.material instanceof THREE.LineBasicMaterial) {
      this.gridHelper.material.transparent = true;
      this.gridHelper.material.opacity = this.config.gridOpacity!;
      this.gridHelper.material.depthWrite = false;
      this.gridHelper.material.depthTest = true;
      this.gridHelper.material.fog = false;
      this.materials.push(this.gridHelper.material);
    } else {
      // Handle case when material is an array
      const materials = this.gridHelper.material as THREE.Material[];
      if (Array.isArray(materials)) {
        materials.forEach((material, index) => {
          if (material instanceof THREE.Material) {            material.transparent = true;
            material.opacity = index === 0 ? this.config.gridOpacity! * 1.2 : this.config.gridOpacity!;
            material.depthWrite = false;
            material.depthTest = true;
            // Only set fog property if it's a material that has this property
            if (material instanceof THREE.LineBasicMaterial || 
                material instanceof THREE.MeshBasicMaterial) {
              material.fog = false;
            }
            this.materials.push(material);
          }
        });
      }
    }
    
    this.scene.add(this.gridHelper);
  }

  getGroundPlane(): THREE.Mesh | null {
    return this.groundPlane;
  }

  getGridVisibility(): boolean {
    return this.gridHelper?.visible ?? false;
  }

  toggleGrid(): void {
    if (this.gridHelper) {
      this.gridHelper.visible = !this.gridHelper.visible;
    }
  }

  setGridVisibility(visible: boolean): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  updateGroundColor(color: number): void {
    if (this.groundPlane && this.groundPlane.material instanceof THREE.MeshStandardMaterial) {
      this.groundPlane.material.color.setHex(color);
    }
  }

  updateGridColor(color: number): void {
    if (this.gridHelper) {
      const newColor = new THREE.Color(color);
      const newColorDark = new THREE.Color(color).multiplyScalar(0.9);
      
      if (Array.isArray(this.gridHelper.material)) {
        this.gridHelper.material[0].color = newColor;
        this.gridHelper.material[1].color = newColorDark;
      }
    }
  }  updateThemeColors(): void {
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    
    // Update ground plane color
    if (this.groundPlane && this.groundPlane.material) {
      const material = this.groundPlane.material as THREE.MeshStandardMaterial;
      const groundColor = getThemeColorAsHex('--color-ground', isDarkTheme ? 0x6b6b6b : 0xffffff);
      material.color.setHex(groundColor);
      
      // Adjust material properties based on theme
      material.roughness = isDarkTheme ? 0.9 : 0.5;
      material.metalness = isDarkTheme ? 0.05 : 0.0;
      
      // Apply emissive glow in dark theme for subtle ground lighting
      if (isDarkTheme) {
        material.emissive.setHex(0x060a14);
        material.envMapIntensity = 0.1; // Lower reflectivity at night
      } else {
        material.emissive.setHex(0x000000);
        material.envMapIntensity = 0.2; // More reflectivity during day
      }
    }
    
    // Update grid color and visibility
    if (this.gridHelper) {
      const gridColor = getThemeColorAsHex('--color-grid', isDarkTheme ? 0x1e3a70 : 0x999999);
      this.updateGridColor(gridColor);
      
      // Make grid more visible but with appropriate theme-specific opacity
      if (this.gridHelper.material instanceof THREE.Material) {
        const material = this.gridHelper.material as THREE.Material;
        material.opacity = isDarkTheme ? 0.35 : 0.45;
        material.visible = true;
      } else if (Array.isArray(this.gridHelper.material)) {
        (this.gridHelper.material as THREE.Material[]).forEach((mat: THREE.Material) => {
          mat.opacity = isDarkTheme ? 0.35 : 0.45;
          mat.visible = true;
        });
      }
      
      // Ensure grid is visible regardless of theme
      this.gridHelper.visible = true;
    }
    
    // Update fog color and density based on theme
    if (this.scene.fog) {
      const fogColor = getThemeColorAsHex('--color-scene-fog', isDarkTheme ? 0x050a1c : 0xcccccc);
      (this.scene.fog as THREE.Fog).color.setHex(fogColor);
      
      // Adjust fog near/far based on theme
      if (isDarkTheme) {
        // Denser fog at night
        (this.scene.fog as THREE.Fog).near = 150;
        (this.scene.fog as THREE.Fog).far = 500;
      } else {
        // Lighter fog during day
        (this.scene.fog as THREE.Fog).near = 250;
        (this.scene.fog as THREE.Fog).far = 800;
      }
    }
  }

  dispose(): void {
    // Dispose materials
    this.materials.forEach(material => {
      material.dispose();
    });
    this.materials.length = 0;
    
    // Dispose ground plane
    if (this.groundPlane) {
      if (this.groundPlane.geometry) {
        this.groundPlane.geometry.dispose();
      }
      this.scene.remove(this.groundPlane);
      this.groundPlane = null;
    }
    
    // Dispose grid helper
    if (this.gridHelper) {
      if (this.gridHelper.geometry) {
        this.gridHelper.geometry.dispose();
      }
      this.scene.remove(this.gridHelper);
      this.gridHelper = null;
    }
  }
}
