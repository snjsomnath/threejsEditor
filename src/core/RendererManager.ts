import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

export interface RendererConfig {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  alpha?: boolean;
  shadows?: boolean;
  shadowType?: THREE.ShadowMapType;
  pixelRatio?: number;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
}

export class RendererManager {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private passes: Pass[] = [];
  private config: RendererConfig;

  constructor(config: RendererConfig = {}) {
    this.config = {
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
      shadows: true,
      shadowType: THREE.PCFSoftShadowMap,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.2,
      ...config
    };
    
    this.renderer = this.createRenderer();
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      alpha: this.config.alpha,
      stencil: false
    });
    
    renderer.shadowMap.enabled = this.config.shadows!;
    renderer.shadowMap.type = this.config.shadowType!;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = this.config.toneMapping!;
    renderer.toneMappingExposure = this.config.toneMappingExposure!;
    
    return renderer;
  }

  async initializeComposer(scene: THREE.Scene, camera: THREE.Camera, enablePostProcessing: boolean = true): Promise<void> {
    if (!enablePostProcessing) return;
    
    try {
      const [
        { EffectComposer },
        { RenderPass },
        { SAOPass },
        { OutputPass }
      ] = await Promise.all([
        import('three/examples/jsm/postprocessing/EffectComposer.js'),
        import('three/examples/jsm/postprocessing/RenderPass.js'),
        import('three/examples/jsm/postprocessing/SAOPass.js'),
        import('three/examples/jsm/postprocessing/OutputPass.js')
      ]);

      // Dispose existing composer
      this.disposeComposer();

      this.composer = new EffectComposer(this.renderer);
      
      const renderPass = new RenderPass(scene, camera);
      this.composer.addPass(renderPass);
      this.passes.push(renderPass);

      const saoPass = new SAOPass(scene, camera, false, true);
      saoPass.params.saoBias = 0.5;
      saoPass.params.saoIntensity = 0.01;
      saoPass.params.saoScale = 5;
      saoPass.params.saoKernelRadius = 10;
      saoPass.params.saoMinResolution = 0.01;
      saoPass.params.saoBlur = true;
      saoPass.params.saoBlurRadius = 2;
      saoPass.params.saoBlurStdDev = 1;
      saoPass.params.saoBlurDepthCutoff = 0.01;
      this.composer.addPass(saoPass);
      this.passes.push(saoPass);

      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);
      this.passes.push(outputPass);
      
    } catch (error) {
      console.error('Failed to initialize post-processing composer:', error);
      throw new Error(`Post-processing initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getComposer(): EffectComposer | null {
    return this.composer;
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.config.pixelRatio!);
    
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.composer) {
      // Update composer's render pass camera if it changed
      if (this.passes.length > 0 && 'camera' in this.passes[0]) {
        const renderPass = this.passes[0] as any;
        if (renderPass.camera !== camera) {
          renderPass.camera = camera;
        }
      }
      this.composer.render();
    } else {
      this.renderer.render(scene, camera);
    }
  }

  private disposeComposer(): void {
    if (this.composer) {
      this.passes.forEach(pass => {
        if ('dispose' in pass && typeof pass.dispose === 'function') {
          pass.dispose();
        }
      });
      this.passes.length = 0;
      this.composer.dispose();
      this.composer = null;
    }
  }

  dispose(): void {
    this.disposeComposer();
    
    // Dispose renderer resources
    this.renderer.forceContextLoss();
    this.renderer.dispose();
    
    // Clear render lists
    this.renderer.info.memory.geometries = 0;
    this.renderer.info.memory.textures = 0;
  }
}