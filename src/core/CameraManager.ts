import * as THREE from 'three';

export interface CameraConfig {
  fov?: number;
  near?: number;
  far?: number;
  position?: { x: number; y: number; z: number };
  target?: { x: number; y: number; z: number };
}

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private controls: any = null;
  private config: CameraConfig;

  constructor(aspect: number, config: CameraConfig = {}) {
    this.config = {
      fov: 35,
      near: 0.1,
      far: 1000,
      position: { x: 45, y: 45, z: 45 },
      target: { x: 0, y: 0, z: 0 },
      ...config
    };
    
    this.camera = this.createCamera(aspect);
  }

  private createCamera(aspect: number): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      this.config.fov!,
      aspect,
      this.config.near!,
      this.config.far!
    );
    
    camera.position.set(
      this.config.position!.x,
      this.config.position!.y,
      this.config.position!.z
    );
    
    camera.lookAt(
      this.config.target!.x,
      this.config.target!.y,
      this.config.target!.z
    );
    
    return camera;
  }

  async initializeControls(renderer: THREE.WebGLRenderer): Promise<void> {
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.8;
    this.controls.rotateSpeed = 0.4;
    this.controls.zoomSpeed = 0.6;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getControls(): any {
    return this.controls;
  }

  updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    if (this.controls) {
      this.controls.update();
    }
  }

  dispose(): void {
    if (this.controls) {
      this.controls.dispose();
    }
  }
}
