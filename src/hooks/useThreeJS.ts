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
   * Initialize the Three.js scene on component mount
   * The cleanup function is returned to handle disposal when the component unmounts
   */
  useEffect(() => {
    if (!containerRef.current) return;

    initializeScene();
    return cleanup;
  }, []);

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
    if (!containerRef.current) return;

    // SCENE
    // -----
    // The Scene is the container for all 3D objects, lights, and cameras
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.BACKGROUND);
    sceneRef.current = scene;

    // CAMERA
    // ------
    // The PerspectiveCamera mimics human eye perception with perspective
    const camera = new THREE.PerspectiveCamera(
      35, // Field of view (FOV) in degrees - higher values create more distortion
      containerRef.current.clientWidth / containerRef.current.clientHeight, // Aspect ratio
      0.1, // Near clipping plane - objects closer than this won't be rendered
      1000 // Far clipping plane - objects farther than this won't be rendered
    );
    // Position the camera in 3D space (x, y, z)
    camera.position.set(45, 45, 45);
    camera.lookAt(0, 0, 0); // Point camera at the origin
    cameraRef.current = camera;

    // RENDERER
    // --------
    // The WebGLRenderer draws the 3D scene using WebGL
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, // Smooths jagged edges
      powerPreference: "high-performance" // Hints to browser to prioritize performance
    });
    // Match renderer size to container
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    // Limit pixel ratio for better performance while maintaining quality
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Enable shadow mapping for realistic shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows with better quality
    // Color management settings for more accurate colors
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Tone mapping converts HDR values to the displayable range
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic tone mapping
    renderer.toneMappingExposure = 1.2; // Slightly brighter scene
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // POST-PROCESSING
    // --------------
    // Post-processing applies effects after the scene is rendered
    // Dynamically import to reduce initial bundle size
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { SAOPass } = await import('three/examples/jsm/postprocessing/SAOPass.js'); // Use SAO instead of SSAO
    const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');

    // EffectComposer manages the rendering pipeline with multiple passes
    const composer = new EffectComposer(renderer);
    // RenderPass renders the scene with the camera
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Scalable Ambient Obscurance (SAO) - more efficient than SSAO
    const saoPass = new SAOPass(scene, camera, false, true);
    saoPass.params.saoBias = 0.5;
    saoPass.params.saoIntensity = 0.02; // Lower intensity for better performance
    saoPass.params.saoScale = 10;
    saoPass.params.saoKernelRadius = 20;
    saoPass.params.saoMinResolution = 0;
    saoPass.params.saoBlur = true;
    saoPass.params.saoBlurRadius = 4;
    saoPass.params.saoBlurStdDev = 2;
    saoPass.params.saoBlurDepthCutoff = 0.01;
    composer.addPass(saoPass);
    
    // Store reference to the SAO pass
    aoPassRef.current = saoPass;

    // OutputPass handles color space conversion for the final output
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerRef.current = composer;
    
    // CONTROLS
    // --------
    // OrbitControls allow the user to navigate the scene with mouse/touch
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Adds inertia to camera movement
    controls.dampingFactor = 0.1; // Amount of inertia
    controls.maxPolarAngle = Math.PI / 2.1; // Limit vertical rotation to prevent going below ground
    controls.minDistance = 5; // Minimum zoom distance
    controls.maxDistance = 100; // Maximum zoom distance
    controlsRef.current = controls;

    // GROUND PLANE
    // ------------
    // A flat surface that serves as a reference point and shadow receiver
    const groundGeometry = new THREE.PlaneGeometry(200, 200); // Make it much larger
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.GROUND,
      transparent: true,
      opacity: 0.9,
      roughness: 0.9,
      metalness: 0.2,
      side: THREE.DoubleSide // Ensure both sides are rendered for raycasting
    });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal (x-z plane)
    groundPlane.position.y = 0; // Ensure it's exactly at y=0
    groundPlane.receiveShadow = true;
    // Make sure the ground plane is raycastable
    groundPlane.userData = { isGround: true };
    scene.add(groundPlane);
    groundPlaneRef.current = groundPlane;

    // GRID HELPER
    // -----------
    // Creates a grid for visual reference of scale and position
    const gridHelper = new THREE.GridHelper(50, 50, COLORS.GRID, COLORS.GRID);
    gridHelper.visible = showGrid; // Initial visibility based on prop
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // LIGHTING
    // --------
    // Realistic sun lighting with stronger shadows
    const sun = new THREE.DirectionalLight(COLORS.SUN_LIGHT, 2);
    sun.position.set(110, 45, 45); // Better angle for shadows
    sun.castShadow = true;
    
    // High-quality shadow settings
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    
    // Adjust camera frustum to tightly fit the scene for better shadow resolution
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    
    // Fine-tuned bias settings to reduce shadow acne and peter-panning
    // sun.shadow.bias = -0.0001; // More precise bias
    // sun.shadow.normalBias = 0.02; // Good for high-poly models
    
    // Softer shadow edges
    sun.shadow.radius = 1;
    
    // Add a shadow camera helper for debugging (initially hidden)
    const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
    shadowHelper.visible = false; // Hidden by default
    scene.add(shadowHelper);
    shadowHelperRef.current = shadowHelper;
    
    scene.add(sun);
    
    // Add a fill light to soften shadows
    // const fillLight = new THREE.DirectionalLight(COLORS.SUN_LIGHT, 0.3);
    // fillLight.position.set(-30, 20, -30);
    // fillLight.castShadow = false; // No shadows from fill light
    // scene.add(fillLight);

    // Add procedural Sky
    const { Sky } = await import('three/examples/jsm/objects/Sky.js');
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    // Set Sky shader uniforms for realistic atmospheric scattering
    // const skyUniforms = sky.material.uniforms;
    // skyUniforms['turbidity'].value = 10; // Atmospheric turbidity
    // skyUniforms['rayleigh'].value = 2; // Rayleigh scattering
    // skyUniforms['mieCoefficient'].value = 0.005; // Mie scattering coefficient
    // skyUniforms['mieDirectionalG'].value = 0.8; // Mie directional scattering
    
    // Position sun for lighting and sky shader
    const sunPosition = new THREE.Vector3();
    sunPosition.copy(sun.position).normalize();
    sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    
    // Enhanced rim light for edge definition
    // const rimLight = new THREE.DirectionalLight(COLORS.RIM_LIGHT, 0.3);
    // rimLight.position.set(-100, 50, -100);
    // scene.add(rimLight);

    // PERFORMANCE OPTIMIZATION
    // -----------------------
    // Make SAO optional or reduce quality for better performance
    if (aoPassRef.current) {
      aoPassRef.current.params.saoKernelRadius = 4; // Reduced for better performance
      aoPassRef.current.params.saoMinResolution = 0.01;
      aoPassRef.current.params.saoScale = 0.1; // Correct parameter (not saoMaxResolution)
    }
    
    // Create a test box with clear shadow casting
    const testBox = createTestBox({ x: -15, y: 0, z: -15 }, 5);
    testBox.castShadow = true;
    testBox.receiveShadow = true;
    
    // Create some additional test objects to better demonstrate shadows
    // Gray colour : 0x808080
    // white colour : 0xffffff
    const objects = [
      { position: {x: 5, y: 0, z: 10}, size: 3, color: 0x808080 },
      { position: {x: -10, y: 0, z: 5}, size: 4, color: 0xffffff },
      { position: {x: 10, y: 0, z: -8}, size: 2, color: 0x808080 }
    ];
    
    objects.forEach(obj => {
      // Create different geometric shapes
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
    });

    // EVENTS & ANIMATION LOOP
    // -----------------------
    // Handle window resizing to maintain correct aspect ratio
    window.addEventListener('resize', handleResize);

    // Start the animation loop
    animate();
    setIsInitialized(true);
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

  /**
   * Animation loop - updates controls and renders the scene
   * This function calls itself recursively using requestAnimationFrame
   * to create a smooth animation loop synced with the display refresh rate
   */
  const animate = () => {
    requestAnimationFrame(animate);
    
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
    if (composerRef.current) {
      composerRef.current.render();
    } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
      // Fallback to basic rendering if composer is not available
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    // End stats monitoring if enabled
    if (statsRef.current) {
      statsRef.current.end();
    }
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
      containerRef.current.removeChild(rendererRef.current.domElement);
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
      
      // Disable post-processing in performance mode
      if (newMode && composerRef.current && rendererRef.current) {
        // Switch to basic rendering
        composerRef.current = null;
      } else if (!newMode && rendererRef.current && sceneRef.current && cameraRef.current) {
        // Re-initialize post-processing if needed
        // This would require storing the composer setup in a separate function
      }
      
      // Adjust shadow quality
      updateSceneQuality({
        shadows: newMode ? 'low' : 'medium',
        ao: newMode ? 'off' : 'medium'
      });
      
      return newMode;
    });
  }, []);

  // Return only essential objects and a simplified API
  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    groundPlane: groundPlaneRef.current,
    isInitialized,
    showFPS,
    performanceMode,
    toggleFPSCounter,
    togglePerformanceMode,
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