import * as THREE from 'three';
import { Point2D, DrawingState } from '../types/Building';

export class DrawingManager {
  private scene: THREE.Scene;
  private groundPlane: THREE.Mesh;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private drawingState: DrawingState;
  private snapToGrid: boolean;
  private gridSize: number;
  private previewLine?: THREE.Line;
  private onDrawingComplete?: (points: Point2D[]) => void;
  private pointMarkers: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, groundPlane: THREE.Mesh) {
    console.log('✏️ DrawingManager: Constructor called');
    this.scene = scene;
    this.groundPlane = groundPlane;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.drawingState = {
      isDrawing: false,
      currentPoints: [],
      previewLines: []
    };
    this.snapToGrid = true;
    this.gridSize = 1;
    console.log('✅ DrawingManager: Initialized');
  }

  startDrawing(onComplete: (points: Point2D[]) => void): void {
    console.log('🎨 DrawingManager: Starting drawing mode');
    this.drawingState.isDrawing = true;
    this.drawingState.currentPoints = [];
    this.clearPreviewLines();
    this.onDrawingComplete = onComplete;
    console.log('✅ DrawingManager: Drawing mode activated');
  }

  stopDrawing(): void {
    console.log('🛑 DrawingManager: Stopping drawing mode');
    this.drawingState.isDrawing = false;
    this.clearPreviewLines();
    this.drawingState.currentPoints = [];
    console.log('✅ DrawingManager: Drawing mode stopped');
  }

  handleMouseMove(event: MouseEvent, camera: THREE.Camera, container: HTMLElement): void {
    if (!this.drawingState.isDrawing) return;

    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(this.groundPlane);

    if (intersects.length > 0 && this.drawingState.currentPoints.length > 0) {
      const point = intersects[0].point;
      const snappedPoint = this.snapToGrid ? this.snapPointToGrid(point) : point;
      this.updatePreviewLine(snappedPoint);
    }
  }

  handleClick(event: MouseEvent, camera: THREE.Camera, container: HTMLElement): void {
    console.log('🖱️ DrawingManager: Click received');
    
    if (!this.drawingState.isDrawing) {
      console.log('❌ DrawingManager: Not in drawing mode, ignoring click');
      return;
    }

    console.log('✏️ DrawingManager: Processing click for drawing');

    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('📍 DrawingManager: Mouse coordinates:', { x: this.mouse.x, y: this.mouse.y });

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(this.groundPlane);

    console.log('🎯 DrawingManager: Raycaster intersects:', intersects.length);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const snappedPoint = this.snapToGrid ? this.snapPointToGrid(point) : point;
      
      console.log('📍 DrawingManager: World point:', { x: point.x, y: point.y, z: point.z });
      console.log('📍 DrawingManager: Snapped point:', { x: snappedPoint.x, y: snappedPoint.y, z: snappedPoint.z });
      
      // Check if clicking near the starting point to close polygon
      if (this.drawingState.currentPoints.length >= 3) {
        const startPoint = this.drawingState.currentPoints[0];
        const distance = Math.sqrt(
          Math.pow(snappedPoint.x - startPoint.x, 2) + 
          Math.pow(snappedPoint.z - startPoint.z, 2)
        );
        
        console.log('📏 DrawingManager: Distance to start point:', distance);
        
        if (distance < 2.0) {
          console.log('🔄 DrawingManager: Closing polygon by clicking near start');
          this.completePolygon();
          return;
        }
      }

      this.addPoint({ x: snappedPoint.x, z: snappedPoint.z });
    } else {
      console.log('❌ DrawingManager: No intersection with ground plane');
    }
  }

  handleDoubleClick(): void {
    console.log('🖱️🖱️ DrawingManager: Double-click received');
    if (this.drawingState.isDrawing && this.drawingState.currentPoints.length >= 3) {
      console.log('✅ DrawingManager: Completing polygon with double-click');
      this.completePolygon();
    } else {
      console.log('❌ DrawingManager: Cannot complete polygon - need at least 3 points');
    }
  }

  private addPoint(point: Point2D): void {
    console.log('➕ DrawingManager: Adding point', point);
    this.drawingState.currentPoints.push(point);
    console.log('📊 DrawingManager: Total points:', this.drawingState.currentPoints.length);
    
    this.createLineFromLastPoints();
    
    // Add point visualization - MAKE IT HUGE AND SUPER BRIGHT
    const geometry = new THREE.SphereGeometry(2.0, 32, 32); // MASSIVE - 2.0 radius
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xFF4500, // Bright red-orange
      emissive: 0xFF2200, // Make it glow
      emissiveIntensity: 0.3
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(point.x, 3, point.z); // Raised very high - 3 units
    sphere.userData.type = 'drawingPoint';
    
    // Make sure the sphere is added to the scene
    this.scene.add(sphere);
    this.pointMarkers.push(sphere);
    
    console.log('🔵 DrawingManager: Added HUGE point marker at', { x: point.x, z: point.z });
    console.log('📊 DrawingManager: Scene now has', this.scene.children.length, 'children');
    
    // Force the scene to update
    this.scene.updateMatrixWorld(true);
  }

  private createLineFromLastPoints(): void {
    if (this.drawingState.currentPoints.length < 2) return;

    const points = this.drawingState.currentPoints;
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];

    console.log('📏 DrawingManager: Creating line between points:', secondLastPoint, lastPoint);

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(secondLastPoint.x, 2, secondLastPoint.z), // Raised higher
      new THREE.Vector3(lastPoint.x, 2, lastPoint.z)
    ]);

    // Make lines SUPER visible
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00FF00, // Bright green
      linewidth: 20 // SUPER thick
    });
    const line = new THREE.Line(geometry, material);
    line.userData.type = 'drawingLine';
    
    this.scene.add(line);
    this.drawingState.previewLines = this.drawingState.previewLines || [];
    this.drawingState.previewLines.push(line);
    
    console.log('📏 DrawingManager: Line added to scene');
    console.log('📊 DrawingManager: Scene now has', this.scene.children.length, 'children');
    
    // Force the scene to update
    this.scene.updateMatrixWorld(true);
  }

  private updatePreviewLine(point: THREE.Vector3): void {
    if (this.drawingState.currentPoints.length === 0) return;

    // Remove existing preview line
    if (this.previewLine) {
      this.scene.remove(this.previewLine);
    }

    const lastPoint = this.drawingState.currentPoints[this.drawingState.currentPoints.length - 1];
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(lastPoint.x, 2, lastPoint.z), // Raised higher
      new THREE.Vector3(point.x, 2, point.z)
    ]);

    const material = new THREE.LineBasicMaterial({ 
      color: 0xFFFF00, // Bright yellow for preview
      opacity: 0.8, 
      transparent: true,
      linewidth: 15
    });
    this.previewLine = new THREE.Line(geometry, material);
    this.previewLine.userData.type = 'previewLine';
    this.scene.add(this.previewLine);
  }

  private completePolygon(): void {
    console.log('🏁 DrawingManager: Completing polygon with', this.drawingState.currentPoints.length, 'points');
    
    if (this.drawingState.currentPoints.length >= 3) {
      // Add closing line - MAKE IT VISIBLE
      const points = this.drawingState.currentPoints;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(points[points.length - 1].x, 2, points[points.length - 1].z),
        new THREE.Vector3(points[0].x, 2, points[0].z)
      ]);

      const material = new THREE.LineBasicMaterial({ 
        color: 0x00FF00, // Same bright green as other lines
        linewidth: 20 
      });
      const line = new THREE.Line(geometry, material);
      line.userData.type = 'drawingLine';
      this.scene.add(line);
      this.drawingState.previewLines?.push(line);

      console.log('✅ DrawingManager: Polygon completed, calling onComplete callback');
      console.log('📊 DrawingManager: Final scene children count:', this.scene.children.length);
      
      // Force the scene to update
      this.scene.updateMatrixWorld(true);
      
      // Complete the drawing
      if (this.onDrawingComplete) {
        this.onDrawingComplete([...this.drawingState.currentPoints]);
      }
    } else {
      console.log('❌ DrawingManager: Cannot complete polygon - insufficient points');
    }
    this.stopDrawing();
  }

  private clearPreviewLines(): void {
    console.log('🧹 DrawingManager: Clearing preview lines');
    
    if (this.previewLine) {
      this.scene.remove(this.previewLine);
      this.previewLine = undefined;
    }

    this.drawingState.previewLines?.forEach(line => {
      this.scene.remove(line);
    });
    this.drawingState.previewLines = [];

    // Remove point markers
    this.pointMarkers.forEach(marker => {
      this.scene.remove(marker);
    });
    this.pointMarkers = [];
    
    console.log('✅ DrawingManager: Preview lines cleared');
    console.log('📊 DrawingManager: Scene children count after cleanup:', this.scene.children.length);
  }

  private snapPointToGrid(point: THREE.Vector3): THREE.Vector3 {
    const snapped = new THREE.Vector3(
      Math.round(point.x / this.gridSize) * this.gridSize,
      point.y,
      Math.round(point.z / this.gridSize) * this.gridSize
    );
    console.log('🧲 DrawingManager: Snapped point', { from: point, to: snapped });
    return snapped;
  }

  setSnapToGrid(snap: boolean): void {
    console.log('🧲 DrawingManager: Setting snap to grid:', snap);
    this.snapToGrid = snap;
  }

  setGridSize(size: number): void {
    console.log('📐 DrawingManager: Setting grid size:', size);
    this.gridSize = size;
  }

  isDrawing(): boolean {
    return this.drawingState.isDrawing;
  }

  getCurrentPoints(): Point2D[] {
    return [...this.drawingState.currentPoints];
  }
}