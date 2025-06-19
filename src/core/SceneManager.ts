import * as THREE from 'three';

export interface SceneConfig {
  backgroundColor?: number;
  enableFog?: boolean;
  fogColor?: number;
  fogNear?: number;
  fogFar?: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private config: SceneConfig;

  constructor(config: SceneConfig = {}) {
    this.config = {
      backgroundColor: 0xf2f2f2,
      enableFog: false,
      fogColor: 0xcccccc,
      fogNear: 1,
      fogFar: 1000,
      ...config
    };
    
    this.scene = this.createScene();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.config.backgroundColor!);
    
    if (this.config.enableFog) {
      scene.fog = new THREE.Fog(
        this.config.fogColor!,
        this.config.fogNear!,
        this.config.fogFar!
      );
    }
    
    return scene;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  updateBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color);
  }

  dispose(): void {
    // Clean up scene resources
    this.scene.clear();
  }
}
