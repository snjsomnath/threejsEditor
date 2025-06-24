import * as THREE from 'three';
import { getThemeColorAsHex } from '../utils/themeColors';

export class TextService {
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  
  // Add a state tracking object to match other services
  private labelState = {
    sessionId: 0
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.canvas.width = 512;
    this.canvas.height = 256;
  }

  resetPreviewState(): void {
    // Increment session ID to mark a fresh drawing session
    this.labelState.sessionId++;
    console.log('TextService preview state reset for new session:', this.labelState.sessionId);
  }

  createLengthLabel(text: string, position: THREE.Vector3): THREE.Sprite {
    // Create texture from text
    const texture = this.createTextTexture(text);
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      depthTest: false,
      depthWrite: false
    });

    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(8, 4, 4); // Reduce scale slightly for better readability
    sprite.userData.isLengthLabel = true;
    
    // Ensure it renders on top of other objects
    sprite.renderOrder = 150; // Higher than marker's renderOrder (100)
    sprite.frustumCulled = false; // Prevent culling issues
    
    // Position the label slightly higher to be more visible
    sprite.position.y += 0.5; // Lift it above the grid
    
    this.scene.add(sprite);
    return sprite;
  }

  updateLengthLabel(sprite: THREE.Sprite, text: string, position: THREE.Vector3): void {
    // Update position (maintain the height adjustment)
    const newPosition = position.clone(); // Clone to avoid modifying the original
    newPosition.y += 0.5; // Keep consistent with createLengthLabel
    sprite.position.copy(newPosition);
    
    // Ensure render order is maintained
    sprite.renderOrder = 150;
    
    // Update texture with new text
    const texture = this.createTextTexture(text);
    const material = sprite.material as THREE.SpriteMaterial;
    if (material.map) {
      material.map.dispose();
    }
    material.map = texture;
  }

  private createTextTexture(text: string): THREE.CanvasTexture {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set font and style
    this.context.font = '32px Arial, sans-serif'; // Smaller font for better readability
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    
    // Draw background
    const textMetrics = this.context.measureText(text);
    const padding = 12;
    const bgWidth = textMetrics.width + padding * 2;    const bgHeight = 40; // Smaller height
    const bgX = (this.canvas.width - bgWidth) / 2;
    const bgY = (this.canvas.height - bgHeight) / 2;
    
    // Background with rounded corners
    const bgColor = getThemeColorAsHex('--color-text-label-bg', 0x000000);
    const borderColor = getThemeColorAsHex('--color-text-label-border', 0xFFFFFF);
    
    // Convert hex colors to rgba for canvas
    const bgColorObj = new THREE.Color(bgColor);
    const borderColorObj = new THREE.Color(borderColor);
    
    this.context.fillStyle = `rgba(${Math.floor(bgColorObj.r * 255)}, ${Math.floor(bgColorObj.g * 255)}, ${Math.floor(bgColorObj.b * 255)}, 0.9)`;
    this.context.strokeStyle = `rgba(${Math.floor(borderColorObj.r * 255)}, ${Math.floor(borderColorObj.g * 255)}, ${Math.floor(borderColorObj.b * 255)}, 0.8)`;
    this.context.lineWidth = 2;
    
    this.roundRect(bgX, bgY, bgWidth, bgHeight, 8);    this.context.fill();
    this.context.stroke();
    
    // Draw text
    const textColor = getThemeColorAsHex('--color-text-label', 0xffffff);
    const textColorObj = new THREE.Color(textColor);
    this.context.fillStyle = `rgb(${Math.floor(textColorObj.r * 255)}, ${Math.floor(textColorObj.g * 255)}, ${Math.floor(textColorObj.b * 255)})`;
    this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();
  }

  clearLengthLabel(sprite: THREE.Sprite): void {
    this.scene.remove(sprite);
    const material = sprite.material as THREE.SpriteMaterial;
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

  clearAllLabels(labels: THREE.Sprite[]): void {
    labels.forEach(label => this.clearLengthLabel(label));
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${(distance * 100).toFixed(0)}cm`;
    } else if (distance < 1000) {
      return `${distance.toFixed(1)}m`;
    } else {
      return `${(distance / 1000).toFixed(2)}km`;
    }
  }
}
