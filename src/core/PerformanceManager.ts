import type Stats from 'three/examples/jsm/libs/stats.module.js';
import { getThemeColorAsHex } from '../utils/themeColors';

export interface PerformanceConfig {
  enableFPSCounter?: boolean;
  enableStats?: boolean;
  fpsUpdateInterval?: number;
}

export class PerformanceManager {
  private config: PerformanceConfig;
  private fpsCounter: HTMLDivElement | null = null;
  private stats: Stats | null = null;
  private fpsData = { frames: 0, lastTime: performance.now(), fps: 0 };

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableFPSCounter: false,
      enableStats: false,
      fpsUpdateInterval: 1000,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.config.enableStats) {
      try {
        await this.initializeStats();
      } catch (error) {
        console.warn('Failed to initialize performance stats:', error);
      }
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
      this.stats.dom.style.zIndex = '1001';
    } catch (error) {
      console.warn('Failed to load Stats.js:', error);
      throw error;
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
        color: var(--color-performance-good);
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
    
    if (now >= this.fpsData.lastTime + this.config.fpsUpdateInterval!) {
      this.fpsData.fps = Math.round((this.fpsData.frames * 1000) / (now - this.fpsData.lastTime));
      this.fpsData.frames = 0;
      this.fpsData.lastTime = now;
      
      this.fpsCounter.textContent = `FPS: ${this.fpsData.fps}`;      // Color coding for performance indication using CSS variables
      if (this.fpsData.fps < 30) {
        this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-poor', 0xff4444).toString(16).padStart(6, '0')}`;
      } else if (this.fpsData.fps < 50) {
        this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-medium', 0xffaa00).toString(16).padStart(6, '0')}`;
      } else {
        this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-good', 0x00ff00).toString(16).padStart(6, '0')}`;
      }
    }
  }

  updateThemeColors(): void {
    if (!this.fpsCounter) return;
    
    // Update FPS counter colors based on current performance
    if (this.fpsData.fps < 30) {
      this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-poor', 0xff4444).toString(16).padStart(6, '0')}`;
    } else if (this.fpsData.fps < 50) {
      this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-medium', 0xffaa00).toString(16).padStart(6, '0')}`;
    } else {
      this.fpsCounter.style.color = `#${getThemeColorAsHex('--color-performance-good', 0x00ff00).toString(16).padStart(6, '0')}`;
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
    if (this.fpsCounter?.parentNode) {
      this.fpsCounter.parentNode.removeChild(this.fpsCounter);
      this.fpsCounter = null;
    }
    
    if (this.stats?.dom?.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
      this.stats = null;
    }
  }
}