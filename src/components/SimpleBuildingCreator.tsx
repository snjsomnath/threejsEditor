import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Pencil, Square } from 'lucide-react';

export const SimpleBuildingCreator: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pointMarkers, setPointMarkers] = useState<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    initializeThreeJS();

    return () => {
      cleanup();
    };
  }, []);

  const initializeThreeJS = async () => {
    if (!containerRef.current) return;

    console.log('🚀 Initializing Three.js');

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

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    scene.add(groundPlane);
    groundPlaneRef.current = groundPlane;

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x666666, 0x444444);
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Test cube to verify scene is working
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(10, 1, 10);
    scene.add(testCube);
    console.log('🧪 Test cube added at (10, 1, 10)');

    // Raycaster and mouse
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Event listeners
    setupEventListeners();

    // Start render loop
    animate();

    setIsInitialized(true);
    console.log('✅ Three.js initialized');
  };

  const setupEventListeners = () => {
    if (!containerRef.current) return;

    containerRef.current.addEventListener('click', handleClick);
    containerRef.current.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('resize', handleResize);
  };

  const handleClick = (event: MouseEvent) => {
    if (!isDrawing || !containerRef.current || !cameraRef.current || !groundPlaneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = mouseRef.current!;
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = raycasterRef.current!;
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(groundPlaneRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log('📍 Adding point:', point);
      
      // Add point marker - MAKE IT HUGE AND BRIGHT
      const geometry = new THREE.SphereGeometry(1.0, 16, 16);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xff0000,
        emissive: 0x440000,
        emissiveIntensity: 0.2
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(point.x, 2, point.z); // Raised high above ground
      sceneRef.current!.add(marker);

      setPointMarkers(prev => [...prev, marker]);
      setCurrentPoints(prev => [...prev, point]);
      
      console.log('🔴 Point marker added at:', { x: point.x, y: 2, z: point.z });
    }
  };

  const handleDoubleClick = () => {
    if (!isDrawing || currentPoints.length < 3) {
      console.log('❌ Cannot create building - need at least 3 points, have:', currentPoints.length);
      return;
    }
    
    console.log('🏁 Creating building with', currentPoints.length, 'points:', currentPoints);
    createBuilding(currentPoints);
    
    // Clear markers
    pointMarkers.forEach(marker => {
      sceneRef.current!.remove(marker);
    });
    setPointMarkers([]);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const createBuilding = (points: THREE.Vector3[]) => {
    if (!sceneRef.current || points.length < 3) {
      console.log('❌ Cannot create building - insufficient data');
      return;
    }

    console.log('🏢 Creating building with points:', points);

    try {
      // Create shape from points - use X,Z coordinates (ground plane)
      const shape = new THREE.Shape();
      
      // Start at first point
      shape.moveTo(points[0].x, points[0].z);
      console.log('📐 Shape starts at:', { x: points[0].x, z: points[0].z });
      
      // Add lines to other points
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].z);
        console.log('📐 Line to:', { x: points[i].x, z: points[i].z });
      }
      
      // Close the shape explicitly
      shape.lineTo(points[0].x, points[0].z);
      console.log('📐 Shape closed back to start');

      // Extrude settings - EXTRUDE UPWARD
      const extrudeSettings = {
        depth: 8, // Building height - BIGGER
        bevelEnabled: false,
        steps: 1
      };

      console.log('🏗️ Extruding with settings:', extrudeSettings);
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Use the EXACT same material as test objects
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xff0000, // Bright red
        side: THREE.DoubleSide // Render both sides
      });
      
      const building = new THREE.Mesh(geometry, material);
      
      // Position the building properly - RAISE IT UP
      building.position.set(0, 0, 0); // Start at ground level
      building.rotation.x = 0; // No rotation
      building.castShadow = true;
      building.receiveShadow = true;
      
      console.log('🏢 Adding building to scene at position:', building.position);
      sceneRef.current.add(building);
      
      // Force scene update
      sceneRef.current.updateMatrixWorld(true);
      
      console.log('✅ Building created and added to scene');
      console.log('📊 Scene now has', sceneRef.current.children.length, 'children');

      // Add a marker at the building center for verification
      const centroid = calculateCentroid(points);
      const markerGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const markerMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x00ff00, // Green marker
        emissive: 0x004400,
        emissiveIntensity: 0.3
      });
      const centerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
      centerMarker.position.set(centroid.x, 10, centroid.z); // High above building
      sceneRef.current.add(centerMarker);
      console.log('🟢 Center marker added at:', { x: centroid.x, y: 10, z: centroid.z });

    } catch (error) {
      console.error('❌ Error creating building:', error);
    }
  };

  const calculateCentroid = (points: THREE.Vector3[]) => {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      z: acc.z + point.z
    }), { x: 0, z: 0 });

    return {
      x: sum.x / points.length,
      z: sum.z / points.length
    };
  };

  const handleResize = () => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const cleanup = () => {
    if (containerRef.current && rendererRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  const startDrawing = () => {
    console.log('🎨 Starting drawing mode');
    setIsDrawing(true);
    setCurrentPoints([]);
    setPointMarkers([]);
  };

  const stopDrawing = () => {
    console.log('🛑 Stopping drawing mode');
    
    // Clear any existing markers
    pointMarkers.forEach(marker => {
      sceneRef.current!.remove(marker);
    });
    
    setIsDrawing(false);
    setCurrentPoints([]);
    setPointMarkers([]);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Simple Controls */}
      <div className="fixed top-6 left-6 bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-gray-700">
        <div className="flex flex-col space-y-3">
          <h2 className="text-white font-semibold">Building Creator</h2>
          
          {!isDrawing ? (
            <button
              onClick={startDrawing}
              disabled={!isInitialized}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                        disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg 
                        transition-all duration-200"
            >
              <Pencil className="w-4 h-4" />
              <span>Draw Building</span>
            </button>
          ) : (
            <button
              onClick={stopDrawing}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 
                        text-white rounded-lg transition-all duration-200"
            >
              <Square className="w-4 h-4" />
              <span>Stop Drawing</span>
            </button>
          )}
        </div>
      </div>

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="fixed bottom-6 right-6 bg-blue-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-blue-700">
          <div className="text-blue-100">
            <h3 className="font-semibold mb-2">Drawing Mode</h3>
            <div className="text-sm space-y-1">
              <p>• Click to place red points</p>
              <p>• Double-click to finish building</p>
              <p>• Need at least 3 points</p>
              <p>• Points: {currentPoints.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
                      bg-gray-900/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-xl border border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-orange-500' : 'bg-teal-500'}`} />
            <span>{isDrawing ? 'Drawing Mode' : 'View Mode'}</span>
          </div>
          {currentPoints.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{currentPoints.length} points</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};