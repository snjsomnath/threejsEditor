import * as THREE from 'three';

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
  private composer: any = null;
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

    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

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

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getComposer(): any {
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
      this.composer.render();
    } else {
      this.renderer.render(scene, camera);
    }
  }

  dispose(): void {
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
  }
}