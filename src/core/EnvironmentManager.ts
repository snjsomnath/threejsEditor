import * as THREE from 'three';

// Color constants for easy editing
const DEFAULT_COLORS = {
  GROUND: 0xffffff,
  GRID: 0x999999,
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
      groundSize: 200,
      groundColor: DEFAULT_COLORS.GROUND,
      groundOpacity: 1,
      gridSize: 500,
      gridDivisions: 500,
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
    );
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: this.config.groundColor!,
      transparent: this.config.groundOpacity! < 1,
      opacity: this.config.groundOpacity!,
      roughness: 0.8, // Increased for better shadow contrast
      metalness: 0.0, // Set to 0 for better shadow visibility
      side: THREE.DoubleSide,
      depthWrite: true,
      alphaTest: this.config.groundOpacity! < 1 ? 0.1 : 0,
      // Add these properties for better shadow reception
      shadowSide: THREE.FrontSide
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
      gridColorGrid
    );
    
    this.gridHelper.position.y = 0.001;
    this.gridHelper.visible = this.config.showGrid!;
    
    // Fix material conflicts by properly configuring grid materials
    if (this.gridHelper.material instanceof THREE.LineBasicMaterial) {
      this.gridHelper.material.transparent = true;
      this.gridHelper.material.opacity = this.config.gridOpacity!;
      this.gridHelper.material.depthWrite = false;
      this.gridHelper.material.depthTest = true;
      this.gridHelper.material.fog = false;
      this.materials.push(this.gridHelper.material);
    } else if (Array.isArray(this.gridHelper.material)) {
      this.gridHelper.material.forEach((material, index) => {
        material.transparent = true;
        material.opacity = index === 0 ? this.config.gridOpacity! * 1.2 : this.config.gridOpacity!;
        material.depthWrite = false;
        material.depthTest = true;
        material.fog = false;
        this.materials.push(material);
      });
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
