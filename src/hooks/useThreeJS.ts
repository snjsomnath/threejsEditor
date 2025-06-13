/**
 * useThreeJS Hook
 * 
 * This custom React hook encapsulates the initialization and management of a Three.js 3D scene.
 * It handles the creation of essential Three.js components including:
 * - Scene: The container for all 3D objects
 * - Camera: Perspective camera that determines the viewpoint
 * - Renderer: WebGL renderer that draws the scene
 * - Lighting: Multiple light sources for realistic rendering
 * - Controls: Orbit controls for user interaction
 * - Ground plane and grid: For spatial reference
 * - Post-processing: Effects like ambient occlusion for visual enhancement
 * 
 * Usage:
 * const { scene, camera, renderer, isInitialized, toggleGrid } = useThreeJS(containerRef, showGrid);
 * 
 * @param containerRef - React ref to the DOM element that will contain the Three.js canvas
 * @param showGrid - Boolean to control grid visibility (default: true)
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Point3D } from '../types/building';

// Theme options for scene appearance
const THEMES = {
  LIGHT: {
    // Environment
    BACKGROUND: 0xf2f2f2,      // Clean white background
    GROUND: 0xf2f2f2,           // White ground
    GRID: 0x999999,             // Darker grid for better visibility
    
    // Lighting
    SUN_LIGHT: 0xfaf6ed,        // Sun directional light - white or warm white: 0xffffff or 0xfff5e6
    HEMI_SKY: 0xffffff,         // Hemisphere light sky color
    HEMI_GROUND: 0xdedede,      // Hemisphere light ground color
    RIM_LIGHT: 0xcccccc,        // Add this property
  },
  DARK: {
    // Environment
    BACKGROUND: 0x222222,       // Dark gray background
    GROUND: 0x333333,           // Dark ground
    GRID: 0x555555,             // Grid lines - medium gray
    
    // Lighting
    SUN_LIGHT: 0xeaeaea,        // Sun directional light - slightly off-white
    HEMI_SKY: 0xeaeaea,         // Hemisphere light sky color
    HEMI_GROUND: 0x444444,      // Hemisphere light ground color
    RIM_LIGHT: 0x888888,        // Add this property
  }
};

// Select the active theme
const COLORS = THEMES.LIGHT;

export const useThreeJS = (containerRef: React.RefObject<HTMLDivElement>, showGrid: boolean = true) => {
  // Refs to store Three.js objects for later access and to prevent recreation on re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null); // OrbitControls is imported dynamically
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const composerRef = useRef<any>(null); // EffectComposer is imported dynamically
  const shadowHelperRef = useRef<THREE.CameraHelper | null>(null); // New ref for shadow helper
  const aoPassRef = useRef<any>(null); // Store the SAO pass for later control
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // FPS Counter state and refs
  const [showFPS, setShowFPS] = useState(false);
  const fpsCounterRef = useRef<HTMLDivElement | null>(null);
  const fpsStatsRef = useRef<{ frames: number; lastTime: number; fps: number }>({
    frames: 0,
    lastTime: performance.now(),
    fps: 0
  });
  
  // Add stats ref for performance monitoring
  const statsRef = useRef<any>(null);
  
  // Add performance mode state
  const [performanceMode, setPerformanceMode] = useState(false);

  /**
   * Creates a test box for scene verification
   */
  const createTestBox = (position: Point3D, size: number = 10): THREE.Mesh => {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const box = new THREE.Mesh(geometry, material);
    
    box.position.set(position.x, position.y + size / 2, position.z);
    box.castShadow = true;
    box.receiveShadow = true;
    
    if (sceneRef.current) {
      sceneRef.current.add(box);
    }
    
    return box;
  };

  /**
   * Animation loop - updates controls and renders the scene
   * This function calls itself recursively using requestAnimationFrame
   * to create a smooth animation loop synced with the display refresh rate
   */
  const startAnimationLoop = useCallback(() => {
    console.log('🎬 Animation loop starting...');
    let animationId: number;
    let frameCount = 0;
    let lastLogTime = performance.now();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      frameCount++;
      
      // Log every 60 frames (roughly once per second at 60fps)
      const now = performance.now();
      if (frameCount % 60 === 0) {
        const fps = 60000 / (now - lastLogTime);
        console.log(`🎭 Animation loop running, FPS: ${fps.toFixed(1)}, Frame: ${frameCount}`);
        lastLogTime = now;
      }
      
      // Begin stats monitoring if enabled
      if (statsRef.current) {
        statsRef.current.begin();
      }
      
      // Update FPS counter - make sure this runs every frame
      if (showFPS) {
        updateFPSCounter();
      }
      
      // Update orbit controls to enable smooth damping effect
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Render the scene with post-processing effects
      try {
        if (composerRef.current && !performanceMode) {
          composerRef.current.render();
        } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
          // Fallback to basic rendering if composer is not available or in performance mode
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } else {
          console.warn('⚠️ Missing renderer components:', {
            renderer: !!rendererRef.current,
            scene: !!sceneRef.current,
            camera: !!cameraRef.current
          });
        }
      } catch (renderError) {
        console.error('❌ Render error:', renderError);
      }
      
      // End stats monitoring if enabled
      if (statsRef.current) {
        statsRef.current.end();
      }
    };
    
    animate();
    
    // Store animation ID for cleanup
    return () => {
      console.log('🛑 Cleaning up animation loop...');
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [showFPS, performanceMode]);

  /**
   * Initialize the Three.js scene on component mount
   * The cleanup function is returned to handle disposal when the component unmounts
   */
  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true;
    let initializationStarted = false; // Prevent double initialization
    
    const initializeWithRetry = async (retryCount = 0) => {
      if (!isMounted || initializationStarted) return;
      initializationStarted = true;
      
      try {
        await initializeScene();
        if (isMounted) {
          console.log('✅ Scene initialization complete, setting state...');
          setIsInitialized(true);
          setInitializationError(null);
        }
      } catch (error) {
        console.error(`Scene initialization failed (attempt ${retryCount + 1}):`, error);
        initializationStarted = false; // Allow retry
        
        if (isMounted) {
          setInitializationError(`Failed to initialize 3D scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Retry up to 3 times with increasing delays
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            setTimeout(() => {
              if (isMounted) {
                console.log(`Retrying scene initialization in ${delay}ms...`);
                initializeWithRetry(retryCount + 1);
              }
            }, delay);
          } else {
            setIsInitialized(false);
          }
        }
      }
    };
    
    initializeWithRetry();
    
    return () => {
      isMounted = false;
      cleanup();
    };
  }, []); // Remove containerRef.current dependency to prevent double init

  // Separate effect to start animation loop after scene is initialized
  useEffect(() => {
    if (isInitialized && sceneRef.current && rendererRef.current && cameraRef.current) {
      console.log('🎬 Starting animation loop after initialization...');
      const stopAnimation = startAnimationLoop();
      
      return () => {
        console.log('🛑 Stopping animation loop...');
        if (stopAnimation) stopAnimation();
      };
    }
  }, [isInitialized, startAnimationLoop]);

  /**
   * React to changes in the showGrid prop by updating grid visibility
   * This allows external control of grid visibility without reinitializing the scene
   */
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  /**
   * Sets up the entire Three.js environment
   * This is the core function that initializes all 3D components
   */
  const initializeScene = async () => {
    if (!containerRef.current) {
      throw new Error('Container ref is not available');
    }

    if (isInitializing) {
      console.log('Scene initialization already in progress, skipping...');
      return;
    }

    setIsInitializing(true);
    setInitializationError(null);

    try {
      // Check if container has valid dimensions
      const rect = containerRef.current.getBoundingClientRect();
      console.log('📐 Container dimensions:', { width: rect.width, height: rect.height });
      
      if (rect.width === 0 || rect.height === 0) {
        throw new Error('Container has zero dimensions');
      }

      // Check if we already have a canvas in the container (prevent double mounting)
      const existingCanvas = containerRef.current.querySelector('canvas');
      if (existingCanvas) {
        console.log('🔄 Canvas already exists in container, cleaning up...');
        containerRef.current.removeChild(existingCanvas);
      }

      console.log('🎭 Creating Three.js scene...');

      // SCENE
      // -----
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(COLORS.BACKGROUND);
      sceneRef.current = scene;
      console.log('✅ Scene created');

      // CAMERA
      // ----__
      const camera = new THREE.PerspectiveCamera(
        35,
        rect.width / rect.height,
        0.1,
        1000
      );
      camera.position.set(45, 45, 45);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
      console.log('📷 Camera created at position:', camera.position);

      // RENDERER
      // --------
      console.log('🖥️ Creating WebGL renderer...');
      const renderer = new THREE.WebGLRenderer({ 
        antialias: !performanceMode,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
        alpha: false,
        stencil: false
      });
      
      // Validate WebGL context
      const gl = renderer.getContext();
      if (!gl || gl.isContextLost()) {
        throw new Error('WebGL context is not available or lost');
      }
      console.log('✅ WebGL context validated');

      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(performanceMode ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !performanceMode;
      renderer.shadowMap.type = performanceMode ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      
      console.log('🎨 Renderer configured:', {
        size: { width: rect.width, height: rect.height },
        pixelRatio: renderer.getPixelRatio(),
        shadows: renderer.shadowMap.enabled,
        shadowType: renderer.shadowMap.type
      });
      
      // Handle context loss
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.warn('⚠️ WebGL context lost, attempting to restore...');
        setInitializationError('WebGL context lost - attempting to restore');
      });
      
      renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.log('✅ WebGL context restored');
        setInitializationError(null);
      });

      // Add canvas to container
      console.log('📺 Adding canvas to container...');
      console.log('📺 Container element:', containerRef.current);
      console.log('📺 Canvas element:', renderer.domElement);
      
      // Ensure the container is ready and canvas is properly styled
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Verify the canvas was actually added
      const canvasAdded = containerRef.current.contains(renderer.domElement);
      console.log('✅ Canvas added to DOM:', canvasAdded);
      
      if (!canvasAdded) {
        throw new Error('Failed to add canvas to container');
      }

      // POST-PROCESSING (Skip in performance mode)
      // --------------
      if (!performanceMode) {
        console.log('🎞️ Loading post-processing modules...');
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
        console.log('✅ Post-processing modules loaded');

        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

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
        composer.addPass(saoPass);
        
        aoPassRef.current = saoPass;

        const outputPass = new OutputPass();
        composer.addPass(outputPass);

        composerRef.current = composer;
        console.log('✅ Post-processing composer created');
      } else {
        console.log('⚡ Skipping post-processing (performance mode)');
      }
      
      // CONTROLS
      // --------
      console.log('🎮 Loading orbit controls...');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.minDistance = 5;
      controls.maxDistance = 100;
      controls.enablePan = true;
      controls.panSpeed = 0.8;
      controls.rotateSpeed = 0.4;
      controls.zoomSpeed = 0.6;
      controlsRef.current = controls;
      console.log('✅ Orbit controls created');

      // GROUND PLANE
      // ------------
      console.log('🌍 Creating ground plane...');
      const groundGeometry = new THREE.PlaneGeometry(200, 200);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.GROUND,
        transparent: true,
        opacity: 0.9,
        roughness: 0.9,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.position.y = 0;
      groundPlane.receiveShadow = true;
      groundPlane.userData = { isGround: true };
      scene.add(groundPlane);
      groundPlaneRef.current = groundPlane;
      console.log('✅ Ground plane created and added to scene');

      // GRID HELPER
      // -----------
      console.log('🕸️ Creating grid helper...');
      const gridHelper = new THREE.GridHelper(50, 50, COLORS.GRID, COLORS.GRID);
      gridHelper.visible = showGrid;
      scene.add(gridHelper);
      gridHelperRef.current = gridHelper;
      console.log('✅ Grid helper created');

      // LIGHTING
      // --------
      console.log('💡 Setting up lighting...');
      const sun = new THREE.DirectionalLight(COLORS.SUN_LIGHT, 2);
      sun.position.set(110, 45, 45);
      sun.castShadow = true;
      
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 200;
      sun.shadow.camera.left = -30;
      sun.shadow.camera.right = 30;
      sun.shadow.camera.top = 30;
      sun.shadow.camera.bottom = -30;
      sun.shadow.radius = 1;
      
      const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
      shadowHelper.visible = false;
      scene.add(shadowHelper);
      shadowHelperRef.current = shadowHelper;
      
      scene.add(sun);
      console.log('✅ Directional light and shadows configured');

      // SKY
      // ---
      console.log('☁️ Loading sky...');
      const { Sky } = await import('three/examples/jsm/objects/Sky.js');
      const sky = new Sky();
      sky.scale.setScalar(10000);
      scene.add(sky);
      
      const sunPosition = new THREE.Vector3();
      sunPosition.copy(sun.position).normalize();
      sky.material.uniforms['sunPosition'].value.copy(sunPosition);
      console.log('✅ Sky created');
      
      // PERFORMANCE OPTIMIZATION
      // -----------------------
      if (aoPassRef.current) {
        aoPassRef.current.params.saoKernelRadius = 4;
        aoPassRef.current.params.saoMinResolution = 0.01;
        aoPassRef.current.params.saoScale = 0.1;
      }
      
      // Create test objects
      console.log('🎲 Creating test objects...');
      const testBox = createTestBox({ x: -15, y: 0, z: -15 }, 5);
      testBox.castShadow = true;
      testBox.receiveShadow = true;
      
      const objects = [
        { position: {x: 5, y: 0, z: 10}, size: 3, color: 0x808080 },
        { position: {x: -10, y: 0, z: 5}, size: 4, color: 0xffffff },
        { position: {x: 10, y: 0, z: -8}, size: 2, color: 0x808080 }
      ];
      
      objects.forEach((obj, index) => {
        let geometry, material, mesh;
        
        const randomShape = Math.floor(Math.random() * 3);
        if (randomShape === 0) {
          geometry = new THREE.SphereGeometry(obj.size, 32, 32);
        } else if (randomShape === 1) {
          geometry = new THREE.BoxGeometry(obj.size, obj.size * 2, obj.size);
        } else {
          geometry = new THREE.ConeGeometry(obj.size, obj.size * 2, 16);
        }
        
        material = new THREE.MeshStandardMaterial({ 
          color: obj.color,
          roughness: 0.7,
          metalness: 0.2
        });
        
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(obj.position.x, obj.position.y + obj.size, obj.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        console.log(`✅ Test object ${index + 1} created`);
      });

      // EVENTS
      // ------
      console.log('📱 Setting up resize handler...');
      window.addEventListener('resize', handleResize);

      // Final verification - Enhanced
      const finalVerification = {
        sceneChildren: scene.children.length,
        rendererCanvas: !!renderer.domElement,
        canvasInDOM: document.body.contains(renderer.domElement),
        containerHasCanvas: containerRef.current.contains(renderer.domElement),
        canvasParent: renderer.domElement.parentElement,
        canvasDisplayStyle: renderer.domElement.style.display,
        canvasWidth: renderer.domElement.style.width,
        canvasHeight: renderer.domElement.style.height,
        containerChildren: containerRef.current.children.length,
        cameraPosition: camera.position,
        groundPlaneInScene: scene.children.some(child => child === groundPlane)
      };
      
      console.log('🔍 Final scene verification:', finalVerification);
      
      // Ensure canvas is visible and properly sized
      if (!finalVerification.containerHasCanvas) {
        throw new Error('Canvas not properly attached to container');
      }
      
      // Force an initial render to test everything is working
      console.log('🎬 Testing initial render...');
      if (composerRef.current && !performanceMode) {
        composerRef.current.render();
        console.log('✅ Initial composer render successful');
      } else {
        renderer.render(scene, camera);
        console.log('✅ Initial basic render successful');
      }
      
      console.log('🎉 Three.js scene initialized successfully');
      
    } catch (error) {
      console.error('❌ Error during scene initialization:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown initialization error');
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Handles window resize events by updating the camera aspect ratio and renderer size
   * This ensures the scene looks correct when the container is resized
   */
  const handleResize = () => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current || !composerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Update camera aspect ratio
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    // Resize renderer and composer
    rendererRef.current.setSize(width, height);
    composerRef.current.setSize(width, height);
  };

  // Simple FPS counter implementation
  const updateFPSCounter = () => {
    const stats = fpsStatsRef.current;
    const now = performance.now();
    
    stats.frames++;
    
    if (now >= stats.lastTime + 1000) {
      stats.fps = Math.round((stats.frames * 1000) / (now - stats.lastTime));
      stats.frames = 0;
      stats.lastTime = now;
      
      if (fpsCounterRef.current) {
        fpsCounterRef.current.textContent = `FPS: ${stats.fps}`;
      }
    }
  };

  // Toggle FPS counter visibility
  const toggleFPSCounter = useCallback(() => {
    setShowFPS(prev => {
      const newShowFPS = !prev;
      
      if (newShowFPS && !fpsCounterRef.current) {
        // Create FPS counter element
        const fpsDiv = document.createElement('div');
        fpsDiv.style.cssText = `
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
        fpsDiv.textContent = 'FPS: --';
        document.body.appendChild(fpsDiv);
        fpsCounterRef.current = fpsDiv;
      } else if (!newShowFPS && fpsCounterRef.current) {
        // Remove FPS counter element
        document.body.removeChild(fpsCounterRef.current);
        fpsCounterRef.current = null;
      }
      
      return newShowFPS;
    });
  }, []);

  // Unified function to control visual quality settings
  const updateSceneQuality = (settings: {
    grid?: boolean;
    ao?: boolean | 'off' | 'low' | 'medium' | 'high';
    shadows?: 'low' | 'medium' | 'high' | 'ultra';
    showHelpers?: boolean;
  }) => {
    // Grid visibility
    if (settings.grid !== undefined && gridHelperRef.current) {
      gridHelperRef.current.visible = settings.grid;
    }
    
    // Ambient occlusion
    if (settings.ao !== undefined && aoPassRef.current) {
      if (typeof settings.ao === 'boolean') {
        aoPassRef.current.enabled = settings.ao;
      } else {
        // Quality presets
        aoPassRef.current.enabled = settings.ao !== 'off';
        
        if (settings.ao !== 'off') {
          const aoSettings = {
            'low': { radius: 10, intensity: 0.01, blur: 2 },
            'medium': { radius: 20, intensity: 0.02, blur: 4 },
            'high': { radius: 30, intensity: 0.03, blur: 8 }
          }[settings.ao];
          
          aoPassRef.current.params.saoKernelRadius = aoSettings.radius;
          aoPassRef.current.params.saoIntensity = aoSettings.intensity;
          aoPassRef.current.params.saoBlurRadius = aoSettings.blur;
        }
      }
    }
    
    // Shadow quality
    if (settings.shadows && sceneRef.current) {
      const sun = sceneRef.current.children.find(
        child => child instanceof THREE.DirectionalLight && child.castShadow
      ) as THREE.DirectionalLight | undefined;
      
      if (sun) {
        const shadowSettings = {
          'low': { size: 1024, radius: 2.5 },
          'medium': { size: 2048, radius: 1.5 },
          'high': { size: 4096, radius: 1 },
          'ultra': { size: 8192, radius: 0.5 }
        }[settings.shadows];
        
        sun.shadow.mapSize.width = shadowSettings.size;
        sun.shadow.mapSize.height = shadowSettings.size;
        sun.shadow.radius = shadowSettings.radius;
      }
    }
    
    // Debug helpers
    if (settings.showHelpers !== undefined && shadowHelperRef.current) {
      shadowHelperRef.current.visible = settings.showHelpers;
    }
  };

  /**
   * Cleanup function that disposes of Three.js resources
   * This prevents memory leaks when the component unmounts
   */
  const cleanup = () => {
    // Remove FPS counter if it exists
    if (fpsCounterRef.current) {
      document.body.removeChild(fpsCounterRef.current);
      fpsCounterRef.current = null;
    }
    
    // Remove the canvas element from the DOM
    if (containerRef.current && rendererRef.current) {
      try {
        if (containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
          console.log('🧹 Canvas removed from container');
        }
      } catch (error) {
        console.warn('Error removing canvas:', error);
      }
    }
    
    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    
    // Dispose of Three.js objects to free memory
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (composerRef.current) {
      composerRef.current.dispose();
    }
  };

  // Add a performance monitoring function
  const enablePerformanceMonitoring = () => {
    if (typeof window !== 'undefined') {
      // Dynamic import Stats.js for performance monitoring
      import('three/examples/jsm/libs/stats.module.js').then(({ default: Stats }) => {
        const stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
        
        // Position in top-right corner
        stats.dom.style.position = 'absolute';
        stats.dom.style.top = '0px';
        stats.dom.style.right = '0px';
        stats.dom.style.left = 'auto';
        
        // Store stats in ref so animate function can use it
        statsRef.current = stats;
      });
    }
  };

  // Add a new function to toggle shadow debugging visibility
  const toggleShadowHelper = () => {
    if (sceneRef.current && shadowHelperRef.current) {
      shadowHelperRef.current.visible = !shadowHelperRef.current.visible;
    }
  };

  // Enhanced shadow quality toggle function
  const toggleShadowQuality = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    if (!sceneRef.current) return;
    
    // Find the directional light
    const sun = sceneRef.current.children.find(
      child => child instanceof THREE.DirectionalLight && child.castShadow
    ) as THREE.DirectionalLight | undefined;
    
    if (!sun) return;
    
    // Apply shadow settings based on quality level
    switch (quality) {
      case 'low':
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.radius = 2.5;
        break;
      case 'medium':
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.radius = 1.5;
        break;
      case 'high':
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.radius = 1;
        break;
      case 'ultra':
        sun.shadow.mapSize.width = 8192;
        sun.shadow.mapSize.height = 8192;
        sun.shadow.radius = 0.5;
        break;
    }
    
    // Update shadow camera if helper exists
    if (shadowHelperRef.current) {
      shadowHelperRef.current.update();
    }
  };

  // Add performance mode toggle
  const togglePerformanceMode = useCallback(() => {
    setPerformanceMode(prev => {
      const newMode = !prev;
      
      if (newMode) {
        // Performance mode optimizations
        updateSceneQuality({
          shadows: 'low',
          ao: 'off',
          showHelpers: false
        });
        
        // Reduce pixel ratio for better performance
        if (rendererRef.current) {
          rendererRef.current.setPixelRatio(1);
        }
      } else {
        // Restore quality settings
        updateSceneQuality({
          shadows: 'medium',
          ao: 'medium',
          showHelpers: false
        });
        
        // Restore pixel ratio
        if (rendererRef.current) {
          rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }
      
      return newMode;
    });
  }, []);

  // Add the missing retryInitialization function
  const retryInitialization = useCallback(() => {
    if (isInitializing) {
      console.log('Initialization already in progress, skipping retry...');
      return;
    }
    
    console.log('Retrying scene initialization...');
    setInitializationError(null);
    setIsInitialized(false);
    
    // Clean up any existing resources before retry
    cleanup();
    
    // Retry initialization
    if (containerRef.current) {
      initializeScene().then(() => {
        setIsInitialized(true);
        setInitializationError(null);
      }).catch((error) => {
        console.error('Retry failed:', error);
        setInitializationError(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsInitialized(false);
      });
    }
  }, [isInitializing, containerRef]);

  // Return enhanced API with error handling and performance
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    groundPlane: groundPlaneRef.current,
    isInitialized,
    isInitializing,
    initializationError,
    showFPS,
    performanceMode,
    toggleFPSCounter,
    togglePerformanceMode,
    retryInitialization,
    toggleGrid: () => {
      if (gridHelperRef.current) {
        gridHelperRef.current.visible = !gridHelperRef.current.visible;
      }
    },
    updateSceneQuality,
    toggleShadowHelper,
    toggleShadowQuality,
    
    // For development only - consider removing in production
    debugHelpers: {
      createTestBox,
      enablePerformanceMonitoring
    }
  };
};