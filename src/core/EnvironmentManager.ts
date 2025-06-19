import * as THREE from 'three';

export interface EnvironmentConfig {
  groundSize?: number;
  groundColor?: number;
  groundOpacity?: number;
  gridSize?: number;
  gridDivisions?: number;
  gridColor?: number;
  showGrid?: boolean;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private config: EnvironmentConfig;
  private groundPlane: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  constructor(scene: THREE.Scene, config: EnvironmentConfig = {}) {
    this.scene = scene;
    this.config = {
      groundSize: 200,
      groundColor: 0xffffff,
      groundOpacity: 1,
      gridSize: 50,
      gridDivisions: 50,
      gridColor: 0x999999,
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
      transparent: true,
      opacity: this.config.groundOpacity!,
      roughness: 0.9,
      metalness: 0.2,
      side: THREE.DoubleSide,
      depthWrite: true
    });
    
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.01;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.userData = { isGround: true };
    
    this.scene.add(this.groundPlane);
  }

  private createGrid(): void {
    const gridColorCenter = new THREE.Color(this.config.gridColor!);
    const gridColorGrid = new THREE.Color(this.config.gridColor!).multiplyScalar(0.7);
    
    this.gridHelper = new THREE.GridHelper(
      this.config.gridSize!,
      this.config.gridDivisions!,
      gridColorCenter,
      gridColorGrid
    );
    
    this.gridHelper.position.y = 0.001;
    this.gridHelper.visible = this.config.showGrid!;
    
    // Improve grid material properties
    if (this.gridHelper.material instanceof THREE.Material) {
      this.gridHelper.material.transparent = true;
      this.gridHelper.material.opacity = 0.6;
      this.gridHelper.material.depthWrite = false;
      this.gridHelper.material.depthTest = true;
    } else if (Array.isArray(this.gridHelper.material)) {
      this.gridHelper.material.forEach(material => {
        material.transparent = true;
        material.opacity = 0.6;
        material.depthWrite = false;
        material.depthTest = true;
      });
    }
    
    this.scene.add(this.gridHelper);
  }

  getGroundPlane(): THREE.Mesh | null {
    return this.groundPlane;
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
}
