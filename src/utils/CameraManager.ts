import * as THREE from 'three';

export class CameraManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: any;
  private savedPosition: THREE.Vector3;
  private savedTarget: THREE.Vector3;
  private isInTopDownMode: boolean = false;

  constructor(
    scene: THREE.Scene,
    container: HTMLElement,
    controls: any
  ) {
    this.scene = scene;
    this.controls = controls;

    // Setup single perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Initialize saved positions
    this.savedPosition = new THREE.Vector3(15, 15, 15);
    this.savedTarget = new THREE.Vector3(0, 0, 0);

    // Set camera for controls
    if (this.controls) {
      this.controls.object = this.camera;
      this.controls.target.set(0, 0, 0);
    }

    console.log('📷 CameraManager: Single camera initialized');
    console.log('📷 Camera position:', this.camera.position);
  }

  getCurrentCamera(): THREE.Camera {
    return this.camera;
  }

  switchToPerspective(): void {
    console.log('📷 CameraManager: Switching to perspective view');
    
    if (this.isInTopDownMode && this.controls) {
      // Restore saved position and target
      this.camera.position.copy(this.savedPosition);
      this.controls.target.copy(this.savedTarget);
      
      // Re-enable all controls
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.enabled = true;
      this.controls.update();
      
      this.isInTopDownMode = false;
    }
    
    console.log('✅ CameraManager: Switched to perspective view');
    console.log('📷 Camera position:', this.camera.position);
  }

  switchToTopDown(): void {
    console.log('📷 CameraManager: Switching to top-down view');
    
    if (!this.isInTopDownMode && this.controls) {
      // Save current position and target BEFORE switching
      this.savedPosition.copy(this.camera.position);
      this.savedTarget.copy(this.controls.target);
      
      console.log('💾 CameraManager: Saved position:', this.savedPosition);
      console.log('💾 CameraManager: Saved target:', this.savedTarget);
      
      // IMMEDIATELY move camera to top-down position
      this.camera.position.set(0, 50, 0);
      this.camera.lookAt(0, 0, 0);
      this.camera.updateProjectionMatrix();
      
      // Update controls target and disable rotation
      this.controls.target.set(0, 0, 0);
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.enabled = false; // Disable during drawing
      this.controls.update();
      
      this.isInTopDownMode = true;
    }
    
    console.log('✅ CameraManager: Switched to top-down view');
    console.log('📷 Camera position:', this.camera.position);
    console.log('📷 Camera looking at:', this.controls?.target);
  }

  updateAspectRatio(width: number, height: number): void {
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    // Cleanup if needed
  }
}