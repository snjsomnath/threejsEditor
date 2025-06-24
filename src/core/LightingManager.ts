import * as THREE from 'three';
import type { Sky } from 'three/examples/jsm/objects/Sky.js';
import { getThemeColorAsHex, getThemeColorAsThreeColor } from '../utils/themeColors';

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
  private ambient: THREE.AmbientLight | null = null; // Add ambient light
  private hemiLight: THREE.HemisphereLight | null = null; // Add hemisphere light for better ambient light
  private shadowHelper: THREE.CameraHelper | null = null;
  private sky: Sky | null = null;
  private needsShadowUpdate = false;

  constructor(scene: THREE.Scene, config: LightingConfig = {}) {
    this.scene = scene;
    this.config = {      // This will be loaded from CSS variable at runtime
      sunLightColor: getThemeColorAsHex('--color-sun-light', 0xfaf6ed),
      sunLightIntensity: 1.8, // Slightly reduced intensity
      sunPosition: { x: 110, y: 45, z: 45 },
      enableShadows: true,
      shadowMapSize: 2048, // Increased for better shadow quality
      shadowCameraBounds: 30,
      enableSky: true,
      ...config
    };
  }  async initialize(): Promise<void> {
    try {
      this.createSunLight();
      this.createAmbientLight();
      this.createHemisphereLight();
      
      if (this.config.enableSky) {
        await this.createSky();
      }
    } catch (error) {
      console.error('Failed to initialize lighting:', error);
      throw error;
    }
  }
  
  private createAmbientLight(): void {    // Create subtle ambient light for softer shadows
    // Using CSS variable color via our utility function
    const ambientColor = getThemeColorAsHex('--color-ambient-light', 0xffffff);
    this.ambient = new THREE.AmbientLight(ambientColor, 0.25); // Reduced since we're adding hemisphere light
    this.scene.add(this.ambient);
  }
    private createHemisphereLight(): void {
    // Create hemisphere light for better ambient illumination
    // Using CSS variable colors via our utility function
    const skyColor = getThemeColorAsHex('--color-hemisphere-sky', 0x77a0d5);
    const groundColor = getThemeColorAsHex('--color-hemisphere-ground', 0xbcaf70);
    
    // Debug info - remove in production
    console.log('Creating hemisphere light with colors:', {
      skyColorVar: '--color-hemisphere-sky',
      skyColorHex: '0x' + skyColor.toString(16),
      groundColorVar: '--color-hemisphere-ground',
      groundColorHex: '0x' + groundColor.toString(16)
    });
    
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.30);
    this.scene.add(this.hemiLight);
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
      
      // Improved shadow camera configuration
      this.sun.shadow.camera.near = 0.5;
      this.sun.shadow.camera.far = 500;
      
      const bounds = this.config.shadowCameraBounds!;
      this.sun.shadow.camera.left = -bounds;
      this.sun.shadow.camera.right = bounds;
      this.sun.shadow.camera.top = bounds;
      this.sun.shadow.camera.bottom = -bounds;
        // Better shadow quality settings - adjusted for softer shadows
      this.sun.shadow.radius = 8; // Increased radius for softer shadow edges
      this.sun.shadow.blurSamples = 30; // More samples for smoother blur
      this.sun.shadow.bias = -0.00005; // Less negative bias to reduce artifacts
      this.sun.shadow.normalBias = 0.05; // Increased to prevent shadow acne
      
      // Position the shadow camera target at the scene center
      this.sun.target.position.set(0, 0, 0);
      this.scene.add(this.sun.target);
      
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
      
      // Update shadow camera position to follow the light
      if (this.sun.shadow && this.sun.target) {
        // Ensure the shadow camera is looking at the scene center
        this.sun.target.position.set(0, 0, 0);
        this.sun.target.updateMatrixWorld();
      }
      
      this.updateSkyUniforms();
      
      if (this.shadowHelper) {
        this.shadowHelper.update();
      }
    }
  }

  // Add method to get shadow information for debugging
  getShadowInfo(): { enabled: boolean; mapSize: number; bounds: number; position: THREE.Vector3 | null } {
    if (!this.sun) {
      return { enabled: false, mapSize: 0, bounds: 0, position: null };
    }
    
    return {
      enabled: this.sun.castShadow,
      mapSize: this.sun.shadow?.mapSize.width || 0,
      bounds: this.config.shadowCameraBounds!,
      position: this.sun.position.clone()
    };
  }

  // Expose the updateShadowBounds method
  updateShadowBounds(minBounds: number = 30, maxBounds: number = 100): void {
    if (!this.sun || !this.sun.shadow) return;
    
    // Calculate appropriate bounds based on scene size
    const bounds = Math.max(minBounds, Math.min(maxBounds, this.config.shadowCameraBounds!));
    
    this.sun.shadow.camera.left = -bounds;
    this.sun.shadow.camera.right = bounds;
    this.sun.shadow.camera.top = bounds;
    this.sun.shadow.camera.bottom = -bounds;
    this.sun.shadow.camera.updateProjectionMatrix();
    
    // Update config for future reference
    this.config.shadowCameraBounds = bounds;
    
    console.log(`Shadow bounds updated to: ${bounds}`);
    
    if (this.shadowHelper) {
      this.shadowHelper.update();
    }
  }

  updateThemeColors(): void {
    // Update sunlight color
    if (this.sun) {
      const sunColor = getThemeColorAsHex('--color-sun-light', 0xfaf6ed);
      this.sun.color.setHex(sunColor);
    }
    
    // Update ambient light color
    if (this.ambient) {
      const ambientColor = getThemeColorAsHex('--color-ambient-light', 0xffffff);
      this.ambient.color.setHex(ambientColor);
    }
    
    // Update hemisphere light colors
    if (this.hemiLight) {
      const skyColor = getThemeColorAsHex('--color-hemisphere-sky', 0xd1e5ff);
      const groundColor = getThemeColorAsHex('--color-hemisphere-ground', 0xb97a20);
      this.hemiLight.color.setHex(skyColor);
      this.hemiLight.groundColor.setHex(groundColor);
    }
  }

  // Getter methods for color debugging
  getSunLightColor(): THREE.Color {
    return this.sun ? this.sun.color : getThemeColorAsThreeColor('--color-sun-light', 0xffffff);
  }

  getAmbientLightColor(): THREE.Color {
    return this.ambient ? this.ambient.color : getThemeColorAsThreeColor('--color-ambient-light', 0xffffff);
  }

  getHemisphereSkyColor(): THREE.Color {
    return this.hemiLight ? this.hemiLight.color : getThemeColorAsThreeColor('--color-hemisphere-sky', 0xffffff);
  }

  getHemisphereGroundColor(): THREE.Color {
    return this.hemiLight ? this.hemiLight.groundColor : getThemeColorAsThreeColor('--color-hemisphere-ground', 0xffffff);
  }

  dispose(): void {
    // Dispose sun target
    if (this.sun && this.sun.target) {
      this.scene.remove(this.sun.target);
    }
    
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
