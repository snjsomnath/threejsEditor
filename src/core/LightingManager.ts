import * as THREE from 'three';

export interface LightingConfig {
  sunLightColor?: number;
  sunLightIntensity?: number;
  sunPosition?: { x: number; y: number; z: number };
  enableShadows?: boolean;
  shadowMapSize?: number;
  shadowCameraBounds?: number;
  enableSky?: boolean;
}

export class LightingManager {
  private scene: THREE.Scene;
  private config: LightingConfig;
  private sun: THREE.DirectionalLight | null = null;
  private shadowHelper: THREE.CameraHelper | null = null;

  constructor(scene: THREE.Scene, config: LightingConfig = {}) {
    this.scene = scene;
    this.config = {
      sunLightColor: 0xfaf6ed,
      sunLightIntensity: 2,
      sunPosition: { x: 110, y: 45, z: 45 },
      enableShadows: true,
      shadowMapSize: 1024,
      shadowCameraBounds: 30,
      enableSky: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    this.createSunLight();
    
    if (this.config.enableSky) {
      await this.createSky();
    }
  }

  private createSunLight(): void {
    this.sun = new THREE.DirectionalLight(
      this.config.sunLightColor!,
      this.config.sunLightIntensity!
    );
    
    this.sun.position.set(
      this.config.sunPosition!.x,
      this.config.sunPosition!.y,
      this.config.sunPosition!.z
    );
    
    if (this.config.enableShadows) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.width = this.config.shadowMapSize!;
      this.sun.shadow.mapSize.height = this.config.shadowMapSize!;
      this.sun.shadow.camera.near = 1;
      this.sun.shadow.camera.far = 200;
      
      const bounds = this.config.shadowCameraBounds!;
      this.sun.shadow.camera.left = -bounds;
      this.sun.shadow.camera.right = bounds;
      this.sun.shadow.camera.top = bounds;
      this.sun.shadow.camera.bottom = -bounds;
      this.sun.shadow.radius = 1;
      
      this.shadowHelper = new THREE.CameraHelper(this.sun.shadow.camera);
      this.shadowHelper.visible = false;
      this.scene.add(this.shadowHelper);
    }
    
    this.scene.add(this.sun);
  }

  private async createSky(): Promise<void> {
    const { Sky } = await import('three/examples/jsm/objects/Sky.js');
    const sky = new Sky();
    sky.scale.setScalar(10000);
    this.scene.add(sky);
    
    if (this.sun) {
      const sunPosition = new THREE.Vector3();
      sunPosition.copy(this.sun.position).normalize();
      sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    }
  }

  toggleShadowHelper(): void {
    if (this.shadowHelper) {
      this.shadowHelper.visible = !this.shadowHelper.visible;
    }
  }

  updateShadowQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    if (!this.sun) return;
    
    const settings = {
      'low': { size: 1024, radius: 2.5 },
      'medium': { size: 2048, radius: 1.5 },
      'high': { size: 4096, radius: 1 },
      'ultra': { size: 8192, radius: 0.5 }
    }[quality];
    
    this.sun.shadow.mapSize.width = settings.size;
    this.sun.shadow.mapSize.height = settings.size;
    this.sun.shadow.radius = settings.radius;
    
    if (this.shadowHelper) {
      this.shadowHelper.update();
    }
  }
}
