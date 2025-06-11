import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export const useThreeJS = (containerRef: React.RefObject<HTMLDivElement>, showGrid: boolean = true) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const composerRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    initializeScene();
    return cleanup;
  }, []);

  // Update grid visibility when showGrid prop changes
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  const initializeScene = async () => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing for ambient occlusion
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { SSAOPass } = await import('three/examples/jsm/postprocessing/SSAOPass.js');
    const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // SSAO Pass for ambient occlusion
    const ssaoPass = new SSAOPass(scene, camera, containerRef.current.clientWidth, containerRef.current.clientHeight);
    ssaoPass.kernelRadius = 8;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    ssaoPass.output = SSAOPass.OUTPUT.Default;
    composer.addPass(ssaoPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerRef.current = composer;

    // Controls
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x444444,
      transparent: true,
      opacity: 0.8
    });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    groundPlaneRef.current = groundPlane;

    // Enhanced Grid - Make sure it's visible by default
    const gridHelper = new THREE.GridHelper(100, 100, 0x666666, 0x333333);
    gridHelper.visible = showGrid; // Use the prop value
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x8bb6ff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 10, -20);
    scene.add(rimLight);

    // Event listeners
    window.addEventListener('resize', handleResize);

    // Start render loop
    animate();
    setIsInitialized(true);
  };

  const handleResize = () => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current || !composerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
    composerRef.current.setSize(width, height);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (composerRef.current) {
      composerRef.current.render();
    }
  };

  const toggleGrid = () => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = !gridHelperRef.current.visible;
    }
  };

  const enableAmbientOcclusion = (enabled: boolean) => {
    // This is handled by the SSAO pass in the composer
    // Could add toggle functionality here if needed
  };

  const cleanup = () => {
    if (containerRef.current && rendererRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
    }
    window.removeEventListener('resize', handleResize);
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (composerRef.current) {
      composerRef.current.dispose();
    }
  };

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    groundPlane: groundPlaneRef.current,
    isInitialized,
    toggleGrid,
    enableAmbientOcclusion
  };
};