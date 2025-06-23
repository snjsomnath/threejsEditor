import * as THREE from 'three';
import type { Sky } from 'three/examples/jsm/objects/Sky.js';

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
  private sky: Sky | null = null;
  private needsShadowUpdate = false;

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
    try {
      this.createSunLight();
      
      if (this.config.enableSky) {
        await this.createSky();
      }
    } catch (error) {
      console.error('Failed to initialize lighting:', error);
      throw error;
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
    try {
      const { Sky } = await import('three/examples/jsm/objects/Sky.js');
      this.sky = new Sky();
      this.sky.scale.setScalar(10000);
      this.scene.add(this.sky);
      
      this.updateSkyUniforms();
    } catch (error) {
      console.error('Failed to create sky:', error);
      throw error;
    }
  }

  private updateSkyUniforms(): void {
    if (this.sky && this.sun) {
      const sunPosition = new THREE.Vector3();
      sunPosition.copy(this.sun.position).normalize();
      this.sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    }
  }

  toggleShadowHelper(): void {
    if (this.shadowHelper) {
      this.shadowHelper.visible = !this.shadowHelper.visible;
    }
  }

  updateShadowQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    if (!this.sun || !this.sun.shadow) return;
    
    const settings = {
      'low': { size: 1024, radius: 2.5 },
      'medium': { size: 2048, radius: 1.5 },
      'high': { size: 4096, radius: 1 },
      'ultra': { size: 8192, radius: 0.5 }
    }[quality];
    
    // Properly update shadow map size
    const currentSize = this.sun.shadow.mapSize;
    if (currentSize.width !== settings.size || currentSize.height !== settings.size) {
      // Dispose old shadow map
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
      
      // Update size
      this.sun.shadow.mapSize.setScalar(settings.size);
      this.sun.shadow.radius = settings.radius;
      
      // Mark for shadow camera update
      this.needsShadowUpdate = true;
    }
    
    if (this.shadowHelper && this.needsShadowUpdate) {
      this.shadowHelper.update();
      this.needsShadowUpdate = false;
    }
  }

  updateSunPosition(x: number, y: number, z: number): void {
    if (this.sun) {
      this.sun.position.set(x, y, z);
      this.updateSkyUniforms();
      
      if (this.shadowHelper) {
        this.shadowHelper.update();
      }
    }
  }

  dispose(): void {
    // Dispose shadow helper
    if (this.shadowHelper) {
      this.scene.remove(this.shadowHelper);
      this.shadowHelper = null;
    }
    
    // Dispose sun light and shadow map
    if (this.sun) {
      if (this.sun.shadow?.map) {
        this.sun.shadow.map.dispose();
      }
      this.scene.remove(this.sun);
      this.sun = null;
    }
    
    // Dispose sky
    if (this.sky) {
      if (this.sky.material) {
        this.sky.material.dispose();
      }
      if (this.sky.geometry) {
        this.sky.geometry.dispose();
      }
      this.scene.remove(this.sky);
      this.sky = null;
    }
  }
}
