import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { DrawingManager } from './DrawingManager';
import { BuildingManager } from './BuildingManager';

export class ThreeManager {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private cameraManager: CameraManager | null = null;
  private drawingManager: DrawingManager | null = null;
  private buildingManager: BuildingManager | null = null;
  private controls: any = null;
  private groundPlane: THREE.Mesh;
  private gridHelper: THREE.GridHelper;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private animationId?: number;
  private container: HTMLElement;
  private isInitialized = false;

  constructor(container: HTMLElement) {
    console.log('🏗️ ThreeManager: Constructor called');
    this.container = container;
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Initialize camera FIRST
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);
    console.log('📷 ThreeManager: Camera initialized at position:', this.camera.position);

    // Initialize renderer with better settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Create ground plane
    this.createGroundPlane();

    // Create grid
    this.createGrid();

    // Setup lighting
    this.setupLighting();

    // Add some test objects to verify rendering
    this.addTestObjects();

    // Start the initialization process
    this.initialize();
  }

  private addTestObjects(): void {
    console.log('🧪 ThreeManager: Adding test objects');
    
    // Add a test cube to verify rendering is working
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(5, 1, 5);
    testCube.userData.type = 'testObject';
    this.scene.add(testCube);
    
    // Add a test sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const testSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    testSphere.position.set(-5, 1, -5);
    testSphere.userData.type = 'testObject';
    this.scene.add(testSphere);
    
    console.log('✅ ThreeManager: Test objects added');
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🔄 ThreeManager: Starting initialization');
      
      // Initialize controls with the main camera
      await this.initializeControls();
      console.log('✅ ThreeManager: Controls initialized');

      // Initialize camera manager with the main camera and controls
      this.cameraManager = new CameraManager(this.scene, this.container, this.controls);
      // Override the camera manager's camera with our main camera
      this.cameraManager.camera = this.camera;
      console.log('✅ ThreeManager: CameraManager initialized');

      // Initialize other managers
      this.drawingManager = new DrawingManager(this.scene, this.groundPlane);
      console.log('✅ ThreeManager: DrawingManager initialized');
      
      this.buildingManager = new BuildingManager(this.scene);
      console.log('✅ ThreeManager: BuildingManager initialized');

      // Setup event listeners
      this.setupEventListeners();
      console.log('✅ ThreeManager: Event listeners setup');

      // Start render loop
      this.animate();
      console.log('✅ ThreeManager: Animation loop started');

      this.isInitialized = true;
      console.log('🎉 ThreeManager: Initialization complete!');
    } catch (error) {
      console.error('❌ ThreeManager: Failed to initialize:', error);
    }
  }

  // Public method to check if initialization is complete
  isReady(): boolean {
    const ready = this.isInitialized;
    console.log('🔍 ThreeManager: isReady check:', ready);
    return ready;
  }

  private createGroundPlane(): void {
    console.log('🌍 ThreeManager: Creating ground plane');
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x444444, // Made it lighter so we can see drawing better
      transparent: true,
      opacity: 0.9 // Made it more opaque
    });
    this.groundPlane = new THREE.Mesh(geometry, material);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.userData.type = 'groundPlane';
    this.scene.add(this.groundPlane);
    console.log('✅ ThreeManager: Ground plane created');
  }

  private createGrid(): void {
    console.log('📐 ThreeManager: Creating grid');
    this.gridHelper = new THREE.GridHelper(100, 100, 0x666666, 0x444444); // Made grid more visible
    this.gridHelper.userData.type = 'grid';
    this.scene.add(this.gridHelper);
    console.log('✅ ThreeManager: Grid created');
  }

  private setupLighting(): void {
    console.log('💡 ThreeManager: Setting up lighting');
    // Ambient light - BRIGHTER
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased from 0.6 to 0.8
    this.scene.add(this.ambientLight);

    // Directional light - BRIGHTER
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased from 0.8 to 1.0
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.scene.add(this.directionalLight);
    console.log('✅ ThreeManager: Lighting setup complete');
  }

  private async initializeControls(): Promise<void> {
    console.log('🎮 ThreeManager: Initializing controls');
    // Import OrbitControls dynamically
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    
    // Use the main camera for controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    console.log('✅ ThreeManager: Controls initialized with main camera');
  }

  private setupEventListeners(): void {
    console.log('👂 ThreeManager: Setting up event listeners');
    
    // Disable context menu on right click
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse events for drawing and editing
    this.container.addEventListener('mousemove', (event) => {
      if (!this.isInitialized || !this.drawingManager || !this.buildingManager) return;
      
      if (this.drawingManager.isDrawing()) {
        this.drawingManager.handleMouseMove(event, this.camera, this.container);
      } else {
        this.buildingManager.handleMouseMove(
          event, 
          this.camera, 
          this.container,
          this.groundPlane
        );
      }
    });

    this.container.addEventListener('click', (event) => {
      console.log('🖱️ ThreeManager: Click event received');
      if (!this.isInitialized || !this.drawingManager) {
        console.log('❌ ThreeManager: Click ignored - not initialized or missing managers');
        return;
      }
      
      if (this.drawingManager.isDrawing()) {
        console.log('✏️ ThreeManager: Processing click for drawing');
        event.stopPropagation();
        event.preventDefault();
        this.drawingManager.handleClick(event, this.camera, this.container);
      } else {
        console.log('👁️ ThreeManager: Click ignored - not in drawing mode');
      }
    });

    this.container.addEventListener('dblclick', (event) => {
      console.log('🖱️🖱️ ThreeManager: Double-click event received');
      if (!this.isInitialized || !this.drawingManager) {
        console.log('❌ ThreeManager: Double-click ignored - not initialized');
        return;
      }
      
      if (this.drawingManager.isDrawing()) {
        console.log('✏️ ThreeManager: Processing double-click for drawing');
        event.stopPropagation();
        event.preventDefault();
        this.drawingManager.handleDoubleClick();
      }
    });

    this.container.addEventListener('mousedown', (event) => {
      if (!this.isInitialized || !this.drawingManager || !this.buildingManager) return;
      
      if (!this.drawingManager.isDrawing()) {
        this.buildingManager.handleMouseDown(event, this.camera, this.container);
      }
    });

    this.container.addEventListener('mouseup', () => {
      if (!this.isInitialized || !this.buildingManager) return;
      
      this.buildingManager.handleMouseUp();
    });

    // Resize handler
    window.addEventListener('resize', () => {
      if (!this.isInitialized) return;
      
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    
    console.log('✅ ThreeManager: Event listeners setup complete');
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Always update controls when they exist and are enabled
    if (this.controls) {
      this.controls.update();
    }
    
    // Use the main camera for rendering
    this.renderer.render(this.scene, this.camera);
  };

  // Public methods - now they will work once initialization is complete
  startDrawing(onComplete: (points: any[]) => void): void {
    console.log('🎨 ThreeManager: startDrawing called');
    
    if (!this.isInitialized) {
      console.error('❌ ThreeManager: Cannot start drawing - not initialized');
      return;
    }
    
    if (!this.cameraManager) {
      console.error('❌ ThreeManager: Cannot start drawing - no camera manager');
      return;
    }
    
    if (!this.drawingManager) {
      console.error('❌ ThreeManager: Cannot start drawing - no drawing manager');
      return;
    }
    
    if (!this.buildingManager) {
      console.error('❌ ThreeManager: Cannot start drawing - no building manager');
      return;
    }
    
    console.log('✅ ThreeManager: All managers ready, starting drawing mode');
    
    // Switch to top-down view FIRST
    console.log('📷 ThreeManager: About to switch to top-down view');
    this.cameraManager.switchToTopDown();
    console.log('📷 ThreeManager: Switched to top-down view');
    
    this.drawingManager.startDrawing((points) => {
      console.log('🎯 ThreeManager: Drawing completed with points:', points);
      const building = this.buildingManager!.createBuilding(points);
      console.log('🏢 ThreeManager: Building created:', building);
      
      // Switch back to perspective view
      this.cameraManager!.switchToPerspective();
      console.log('📷 ThreeManager: Switched back to perspective view');
      
      onComplete(points);
    });
    
    console.log('🎨 ThreeManager: Drawing mode activated');
  }

  stopDrawing(): void {
    console.log('🛑 ThreeManager: stopDrawing called');
    
    if (!this.isInitialized || !this.drawingManager || !this.cameraManager) {
      console.log('❌ ThreeManager: Cannot stop drawing - managers not ready');
      return;
    }
    
    this.drawingManager.stopDrawing();
    this.cameraManager.switchToPerspective();
    
    console.log('✅ ThreeManager: Drawing mode stopped');
  }

  getSelectedBuilding() {
    if (!this.isInitialized || !this.buildingManager) return null;
    return this.buildingManager.getSelectedBuilding();
  }

  updateBuildingHeight(id: string, height: number): void {
    console.log('📏 ThreeManager: updateBuildingHeight called', { id, height });
    if (!this.isInitialized || !this.buildingManager) return;
    this.buildingManager.updateBuildingHeight(id, height);
  }

  deleteSelectedBuilding(): void {
    console.log('🗑️ ThreeManager: deleteSelectedBuilding called');
    if (!this.isInitialized || !this.buildingManager) return;
    
    const selected = this.buildingManager.getSelectedBuilding();
    if (selected) {
      console.log('🗑️ ThreeManager: Deleting building:', selected.id);
      this.buildingManager.deleteBuilding(selected.id);
    } else {
      console.log('❌ ThreeManager: No building selected to delete');
    }
  }

  exportBuildings(): string {
    console.log('📤 ThreeManager: exportBuildings called');
    if (!this.isInitialized || !this.buildingManager) return '';
    return this.buildingManager.exportToJSON();
  }

  setGridVisible(visible: boolean): void {
    console.log('📐 ThreeManager: setGridVisible called', visible);
    this.gridHelper.visible = visible;
  }

  setSnapToGrid(snap: boolean): void {
    console.log('🧲 ThreeManager: setSnapToGrid called', snap);
    if (!this.isInitialized || !this.drawingManager) return;
    this.drawingManager.setSnapToGrid(snap);
  }

  dispose(): void {
    console.log('🧹 ThreeManager: dispose called');
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.buildingManager) {
      this.buildingManager.dispose();
    }
    if (this.cameraManager) {
      this.cameraManager.dispose();
    }
    this.renderer.dispose();
  }
}