import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';
import { LightingManager } from './LightingManager';
import { EnvironmentManager } from './EnvironmentManager';
import { PerformanceManager } from './PerformanceManager';

export interface ThreeJSCoreConfig {
  container: HTMLElement;
  performanceMode?: boolean;
  enablePostProcessing?: boolean;
  showGrid?: boolean;
}

export class ThreeJSCore {
  private container: HTMLElement;
  private config: ThreeJSCoreConfig;
  
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private lightingManager: LightingManager;
  private environmentManager: EnvironmentManager;
  private performanceManager: PerformanceManager;
  
  private animationId: number | null = null;
  private isInitialized = false;

  constructor(config: ThreeJSCoreConfig) {
    this.container = config.container;
    this.config = {
      enablePostProcessing: true,
      showGrid: true,
      ...config
    };

    // Initialize managers with standard settings
    this.sceneManager = new SceneManager();
    
    const rect = this.container.getBoundingClientRect();
    this.cameraManager = new CameraManager(rect.width / rect.height);
    
    this.rendererManager = new RendererManager({
      antialias: true,
      shadows: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2)
    });
    
    this.lightingManager = new LightingManager(
      this.sceneManager.getScene(),
      { enableShadows: true }
    );
    
    this.environmentManager = new EnvironmentManager(
      this.sceneManager.getScene(),
      { showGrid: this.config.showGrid }
    );
    
    this.performanceManager = new PerformanceManager();
  }

  async initialize(): Promise<void> {
    try {
      // Setup renderer size and add to container
      const rect = this.container.getBoundingClientRect();
      this.rendererManager.setSize(rect.width, rect.height);
      this.container.appendChild(this.rendererManager.getRenderer().domElement);
      
      // Initialize all managers
      await this.cameraManager.initializeControls(this.rendererManager.getRenderer());
      await this.lightingManager.initialize();
      this.environmentManager.initialize();
      await this.performanceManager.initialize();
      
      // Initialize post-processing with standard settings
      if (this.config.enablePostProcessing) {
        await this.rendererManager.initializeComposer(
          this.sceneManager.getScene(),
          this.cameraManager.getCamera()
        );
      }
      
      // Setup resize handler
      window.addEventListener('resize', this.handleResize.bind(this));
      
      // Start animation loop
      this.startAnimationLoop();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize ThreeJS core:', error);
      throw error;
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      this.performanceManager.beginFrame();
      this.performanceManager.updateFPS();
      
      this.cameraManager.update();
      
      this.rendererManager.render(
        this.sceneManager.getScene(),
        this.cameraManager.getCamera()
      );
      
      this.performanceManager.endFrame();
    };
    
    animate();
  }

  private handleResize(): void {
    const rect = this.container.getBoundingClientRect();
    this.cameraManager.updateAspect(rect.width / rect.height);
    this.rendererManager.setSize(rect.width, rect.height);
  }

  // Public API
  getScene(): THREE.Scene {
    return this.sceneManager.getScene();
  }

  getCamera(): THREE.Camera {
    return this.cameraManager.getCamera();
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.rendererManager.getRenderer();
  }

  getGroundPlane(): THREE.Mesh | null {
    return this.environmentManager.getGroundPlane();
  }

  toggleGrid(): void {
    this.environmentManager.toggleGrid();
  }

  getGridVisibility(): boolean {
    return this.environmentManager.getGridVisibility();
  }

  toggleFPSCounter(): void {
    this.performanceManager.toggleFPSCounter();
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    this.performanceManager.dispose();
    this.cameraManager.dispose();
    this.rendererManager.dispose();
    this.sceneManager.dispose();
    
    if (this.container.contains(this.rendererManager.getRenderer().domElement)) {
      this.container.removeChild(this.rendererManager.getRenderer().domElement);
    }
  }
}