import * as THREE from 'three';

export class TextService {
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.canvas.width = 512;
    this.canvas.height = 256;
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
    sprite.scale.set(10, 5, 5); // Adjust scale as needed
    sprite.userData.isLengthLabel = true;
    
    this.scene.add(sprite);
    return sprite;
  }

  updateLengthLabel(sprite: THREE.Sprite, text: string, position: THREE.Vector3): void {
    // Update position
    sprite.position.copy(position);
    
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
    this.context.font = '48px Arial, sans-serif';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    
    // Draw background
    const textMetrics = this.context.measureText(text);
    const padding = 20;
    const bgWidth = textMetrics.width + padding * 2;
    const bgHeight = 60;
    const bgX = (this.canvas.width - bgWidth) / 2;
    const bgY = (this.canvas.height - bgHeight) / 2;
    
    // Background with rounded corners
    this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.context.lineWidth = 2;
    
    this.roundRect(bgX, bgY, bgWidth, bgHeight, 10);
    this.context.fill();
    this.context.stroke();
    
    // Draw text
    this.context.fillStyle = '#ffffff';
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
