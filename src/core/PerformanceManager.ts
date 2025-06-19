export interface PerformanceConfig {
  enableFPSCounter?: boolean;
  enableStats?: boolean;
  performanceMode?: boolean;
}

export class PerformanceManager {
  private config: PerformanceConfig;
  private fpsCounter: HTMLDivElement | null = null;
  private stats: any = null;
  private fpsData = { frames: 0, lastTime: performance.now(), fps: 0 };

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableFPSCounter: false,
      enableStats: false,
      performanceMode: false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.config.enableStats) {
      await this.initializeStats();
    }
  }

  private async initializeStats(): Promise<void> {
    try {
      const { default: Stats } = await import('three/examples/jsm/libs/stats.module.js');
      this.stats = new Stats();
      this.stats.showPanel(0);
      document.body.appendChild(this.stats.dom);
      
      this.stats.dom.style.position = 'absolute';
      this.stats.dom.style.top = '0px';
      this.stats.dom.style.right = '0px';
      this.stats.dom.style.left = 'auto';
    } catch (error) {
      console.warn('Failed to load Stats.js:', error);
    }
  }

  toggleFPSCounter(): void {
    if (this.fpsCounter) {
      document.body.removeChild(this.fpsCounter);
      this.fpsCounter = null;
    } else {
      this.fpsCounter = document.createElement('div');
      this.fpsCounter.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        padding: 8px 12px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        border-radius: 4px;
        z-index: 1000;
        pointer-events: none;
        user-select: none;
      `;
      this.fpsCounter.textContent = 'FPS: --';
      document.body.appendChild(this.fpsCounter);
    }
  }

  updateFPS(): void {
    if (!this.fpsCounter) return;
    
    const now = performance.now();
    this.fpsData.frames++;
    
    if (now >= this.fpsData.lastTime + 1000) {
      this.fpsData.fps = Math.round((this.fpsData.frames * 1000) / (now - this.fpsData.lastTime));
      this.fpsData.frames = 0;
      this.fpsData.lastTime = now;
      
      this.fpsCounter.textContent = `FPS: ${this.fpsData.fps}`;
    }
  }

  beginFrame(): void {
    if (this.stats) {
      this.stats.begin();
    }
  }

  endFrame(): void {
    if (this.stats) {
      this.stats.end();
    }
  }

  dispose(): void {
    if (this.fpsCounter) {
      document.body.removeChild(this.fpsCounter);
      this.fpsCounter = null;
    }
    
    if (this.stats && this.stats.dom) {
      document.body.removeChild(this.stats.dom);
      this.stats = null;
    }
  }
}
