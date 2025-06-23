import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import type { CameraType, CameraView, ViewTransitionOptions } from './CameraManager';
import { RendererManager } from './RendererManager';
import { LightingManager } from './LightingManager';
import { EnvironmentManager } from './EnvironmentManager';
import { PerformanceManager } from './PerformanceManager';

export interface ThreeJSCoreConfig {
  container: HTMLElement;
  performanceMode?: boolean;
  enablePostProcessing?: boolean;
  showGrid?: boolean;
  enableErrorBoundary?: boolean;
}

export interface CoreEventMap {
  'initialized': void;
  'error': Error;
  'resize': { width: number; height: number };
  'dispose': void;
}

export type CoreEventListener<T extends keyof CoreEventMap> = (data: CoreEventMap[T]) => void;

export class ThreeJSCore {
  private container: HTMLElement;
  private config: ThreeJSCoreConfig;
  private eventListeners = new Map<keyof CoreEventMap, Set<CoreEventListener<any>>>();
  
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private lightingManager: LightingManager;
  private environmentManager: EnvironmentManager;
  private performanceManager: PerformanceManager;
  
  private animationId: number | null = null;
  private isInitialized = false;
  private isDisposed = false;
  private resizeObserver: ResizeObserver;

  constructor(config: ThreeJSCoreConfig) {
    this.container = config.container;
    this.config = {
      enablePostProcessing: true,
      showGrid: true,
      enableErrorBoundary: true,
      ...config
    };

    try {
      // Initialize managers with dependency injection
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

      // Setup resize observer instead of window listener
      this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
      this.resizeObserver.observe(this.container);
      
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Cannot initialize disposed ThreeJSCore instance');
    }

    try {
      // Setup renderer size and add to container
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('Container has zero dimensions');
      }

      this.rendererManager.setSize(rect.width, rect.height);
      this.container.appendChild(this.rendererManager.getRenderer().domElement);
      
      // Initialize all managers with proper error handling
      await Promise.all([
        this.cameraManager.initializeControls(this.rendererManager.getRenderer()),
        this.lightingManager.initialize(),
        this.performanceManager.initialize()
      ]);
      
      this.environmentManager.initialize();
      
      // Initialize post-processing with error handling
      if (this.config.enablePostProcessing) {
        try {
          await this.rendererManager.initializeComposer(
            this.sceneManager.getScene(),
            this.cameraManager.getCamera(),
            true
          );
        } catch (error) {
          console.warn('Post-processing initialization failed, continuing without:', error);
        }
      }
      
      // Start animation loop
      this.startAnimationLoop();
      
      this.isInitialized = true;
      this.emit('initialized', undefined);
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize ThreeJS core:', errorObj);
      this.emit('error', errorObj);
      throw errorObj;
    }
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();
    const targetFPS = 60;
    const targetFrameTime = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      if (this.isDisposed) return;
      
      this.animationId = requestAnimationFrame(animate);
      
      const deltaTime = currentTime - lastTime;
      
      // Skip frame if we're running too fast (optional frame limiting)
      if (deltaTime < targetFrameTime - 1) {
        return;
      }
      
      try {
        this.performanceManager.beginFrame();
        this.performanceManager.updateFPS();
        
        this.cameraManager.update();
        
        // Get the current camera for this frame
        const currentCamera = this.cameraManager.getCurrentCamera();
        
        this.rendererManager.render(
          this.sceneManager.getScene(),
          currentCamera
        );
        
        this.performanceManager.endFrame();
        lastTime = currentTime;
      } catch (error) {
        console.error('Animation loop error:', error);
        if (this.config.enableErrorBoundary) {
          this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    
    animate(performance.now());
  }

  private handleResize(): void {
    if (this.isDisposed) return;
    
    try {
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      this.cameraManager.updateAspect(rect.width / rect.height);
      this.rendererManager.setSize(rect.width, rect.height);
      this.emit('resize', { width: rect.width, height: rect.height });
    } catch (error) {
      console.error('Resize error:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Event system
  on<T extends keyof CoreEventMap>(event: T, listener: CoreEventListener<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off<T extends keyof CoreEventMap>(event: T, listener: CoreEventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit<T extends keyof CoreEventMap>(event: T, data: CoreEventMap[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
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
    if (this.isDisposed) return;
    
    this.isDisposed = true;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.resizeObserver.disconnect();
    
    // Dispose in reverse order of creation
    this.performanceManager.dispose();
    this.environmentManager.dispose();
    this.lightingManager.dispose();
    this.cameraManager.dispose();
    this.rendererManager.dispose();
    this.sceneManager.dispose();
    
    // Remove DOM element safely
    const canvas = this.rendererManager.getRenderer().domElement;
    if (canvas.parentNode === this.container) {
      this.container.removeChild(canvas);
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    this.emit('dispose', undefined);
  }

  // Camera management methods
  switchCameraType(type: CameraType): void {
    try {
      this.cameraManager.switchCameraType(type);
      
      // Update post-processing composer with new camera if it exists
      if (this.rendererManager.getComposer()) {
        this.updateComposerCamera();
      }
    } catch (error) {
      console.error('Failed to switch camera type:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private updateComposerCamera(): void {
    try {
      // Reinitialize composer with new camera
      if (this.config.enablePostProcessing) {
        this.rendererManager.initializeComposer(
          this.sceneManager.getScene(),
          this.cameraManager.getCurrentCamera(),
          true
        ).catch(error => {
          console.warn('Failed to update composer camera:', error);
        });
      }
    } catch (error) {
      console.warn('Failed to update composer camera:', error);
    }
  }

  setCameraView(view: CameraView, options?: ViewTransitionOptions): void {
    try {
      this.cameraManager.setCameraView(view, options);
      
      // Update post-processing composer with new camera if it exists
      if (this.rendererManager.getComposer()) {
        this.updateComposerCamera();
      }
    } catch (error) {
      console.error('Failed to set camera view:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  fitCameraToObjects(objects: THREE.Object3D[], options?: ViewTransitionOptions): void {
    try {
      this.cameraManager.fitToObjects(objects, options);
    } catch (error) {
      console.error('Failed to fit camera to objects:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  fitCameraToScene(options?: ViewTransitionOptions): void {
    try {
      const objects: THREE.Object3D[] = [];
      this.getScene().traverse((object) => {
        if (object !== this.getScene() && 
            !object.userData.isGround && 
            object.type !== 'GridHelper' &&
            object.type !== 'DirectionalLight' &&
            object.type !== 'CameraHelper') {
          objects.push(object);
        }
      });
      this.cameraManager.fitToObjects(objects, options);
    } catch (error) {
      console.error('Failed to fit camera to scene:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Re-export types for external use
export type { CameraType, CameraView, ViewTransitionOptions };