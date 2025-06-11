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
  
  // Add a ref to track drawing state to avoid closure issues
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pointMarkers, setPointMarkers] = useState<THREE.Mesh[]>([]);
  const [lines, setLines] = useState<THREE.Line[]>([]); // State to store lines

  // Add a ref to track points to avoid asynchronous state issues
  const currentPointsRef = useRef<THREE.Vector3[]>([]);

  // Update the ref whenever the state changes
  useEffect(() => {
    isDrawingRef.current = isDrawing;
    console.log('🔄 Drawing mode state updated:', isDrawing);
  }, [isDrawing]);

  // Update the points ref whenever the state changes
  useEffect(() => {
    currentPointsRef.current = currentPoints;
    console.log('📊 Points array updated, now has', currentPoints.length, 'points');
  }, [currentPoints]);

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

  // Keep handleClick and handleDoubleClick as defined functions for reference 
  // before they're used in removeEventListener
  const handleClick = (event: MouseEvent) => {
    processSingleClick(event);
  };

  const handleDoubleClick = (event: MouseEvent) => {
    processDoubleClick(event);
  };

  const setupEventListeners = () => {
    if (!containerRef.current) return;

    // Now these functions are defined before being referenced
    containerRef.current.removeEventListener('click', handleClick);
    containerRef.current.removeEventListener('dblclick', handleDoubleClick);

    // Use mousedown and mouseup instead to have better control
    containerRef.current.addEventListener('mousedown', handleMouseDown);
    containerRef.current.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
  };

  // Track clicks for differentiating between single and double clicks
  const clickTimeoutRef = useRef<number | null>(null);
  const isDoubleClickRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const mouseDownPosRef = useRef<{x: number, y: number} | null>(null);

  const handleMouseDown = (event: MouseEvent) => {
    // Store mouse position on mousedown
    mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!mouseDownPosRef.current) return;
    
    // Check if it's a real click (not a drag)
    const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
    if (dx > 5 || dy > 5) {
      // It's a drag, not a click
      mouseDownPosRef.current = null;
      return;
    }
    
    // It's a click, check if it's a double click
    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    
    if (timeDiff < 300) { // 300ms threshold for double-click
      console.log('🔍 Double click detected!');
      isDoubleClickRef.current = true;
      
      // Clear any pending single click
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      // Process the double-click
      processDoubleClick(event);
    } else {
      // Single click - delay processing to check for double click
      isDoubleClickRef.current = false;
      
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
      
      clickTimeoutRef.current = window.setTimeout(() => {
        if (!isDoubleClickRef.current) {
          console.log('🔍 Single click processed after delay');
          processSingleClick(event);
        }
        clickTimeoutRef.current = null;
      }, 300);
    }
    
    lastClickTimeRef.current = now;
    mouseDownPosRef.current = null;
  };

  const processSingleClick = (event: MouseEvent) => {
    console.log('🔍 Processing single click');
    // Use the ref instead of the state to avoid closure issues
    if (!isDrawingRef.current || !containerRef.current || !cameraRef.current || !groundPlaneRef.current) {
      console.log('⚠️ Cannot process click: drawing mode inactive or refs not ready', 
        { isDrawingState: isDrawing, isDrawingRef: isDrawingRef.current });
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = mouseRef.current!;
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    console.log('🖱️ Mouse coordinates:', { x: mouse.x, y: mouse.y });

    const raycaster = raycasterRef.current!;
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(groundPlaneRef.current);
    console.log('🔍 Raycaster intersects:', intersects.length);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log('📍 Adding point:', point);

      // Add point marker
      const geometry = new THREE.SphereGeometry(0.5, 16, 16); // Smaller size
      const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(point.x, 0.5, point.z); // Align with ground plane
      sceneRef.current!.add(marker);

      // Draw line to the previous point
      if (currentPoints.length > 0) {
        const previousPoint = currentPoints[currentPoints.length - 1];
        console.log('🟢 Previous point:', previousPoint);

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const pointsArray = [
          new THREE.Vector3(previousPoint.x, 0.5, previousPoint.z),
          new THREE.Vector3(point.x, 0.5, point.z),
        ];
        console.log('📏 Line points:', pointsArray);

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(pointsArray);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        sceneRef.current!.add(line);
        setLines((prev) => [...prev, line]);

        console.log('✅ Line created between:', previousPoint, 'and', point);
      } else {
        console.log('⚠️ No previous point to connect a line.');
      }

      // Also update the ref directly for immediate access
      currentPointsRef.current = [...currentPointsRef.current, point];
      setCurrentPoints((prev) => {
        const updatedPoints = [...prev, point];
        console.log('📊 Updated currentPoints:', updatedPoints);
        return updatedPoints;
      });

      setPointMarkers((prev) => [...prev, marker]);

      console.log('🔴 Point marker added at:', { x: point.x, y: 0.5, z: point.z });
    } else {
      console.log('❌ No intersection with ground plane detected.');
    }
  };

  const processDoubleClick = (event: MouseEvent) => {
    // Get points from the ref for immediate access
    const points = currentPointsRef.current;
    console.log('🔍 Processing double click with current points:', points);
    
    // Use the ref instead of the state
    if (!isDrawingRef.current || points.length < 3) {
      console.log('❌ Cannot create building - need at least 3 points, have:', points.length, 
        { isDrawingState: isDrawing, isDrawingRef: isDrawingRef.current });
      return;
    }
    
    console.log('🏁 Creating building with', points.length, 'points:', points);
    createBuilding(points);
    
    // Clear markers and lines
    pointMarkers.forEach((marker) => {
      sceneRef.current!.remove(marker);
    });
    lines.forEach((line) => {
      sceneRef.current!.remove(line);
    });
    setPointMarkers([]);
    setLines([]);
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
      // Calculate centroid for positioning
      const centroid = calculateCentroid(points);
      console.log('🎯 Building centroid:', centroid);
      
      // Create shape from points - use proper coordinate mapping
      const shape = new THREE.Shape();
      
      // Map the first point to shape coordinates (X maps to X, Z maps to Y in 2D shape)
      const firstX = points[0].x - centroid.x;
      const firstY = -(points[0].z - centroid.z); // Negate Z to fix flipping
      shape.moveTo(firstX, firstY);
      console.log('📐 Shape starts at:', { x: firstX, y: firstY });
      
      // Add lines to other points with proper coordinate mapping
      for (let i = 1; i < points.length; i++) {
        const shapeX = points[i].x - centroid.x;
        const shapeY = -(points[i].z - centroid.z); // Negate Z to fix flipping
        shape.lineTo(shapeX, shapeY);
        console.log('📐 Line to:', { x: shapeX, y: shapeY });
      }
      
      // Close the shape explicitly
      shape.lineTo(firstX, firstY);
      console.log('📐 Shape closed back to start');

      // Extrude settings - building height
      const extrudeSettings = {
        depth: 8, // Building height
        bevelEnabled: false,
        steps: 1
      };

      console.log('🏗️ Extruding with settings:', extrudeSettings);
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Rotate the geometry so it extrudes upward (Y-axis) instead of forward (Z-axis)
      geometry.rotateX(-Math.PI / 2);
      
      // Create material
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x6366f1, // Purple/blue color
        side: THREE.DoubleSide
      });
      
      const building = new THREE.Mesh(geometry, material);
      
      // Position the building at the centroid
      building.position.set(centroid.x, 0, centroid.z);
      building.castShadow = true;
      building.receiveShadow = true;
      
      console.log('🏢 Adding building to scene at position:', building.position);
      sceneRef.current.add(building);
      
      // Add a marker at the building center for verification
      const markerGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const markerMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x00ff00, // Green marker
        emissive: 0x004400,
        emissiveIntensity: 0.3
      });
      const centerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
      centerMarker.position.set(centroid.x, 4, centroid.z); // Positioned at middle height of building
      sceneRef.current.add(centerMarker);
      console.log('🟢 Center marker added at:', { x: centroid.x, y: 4, z: centroid.z });

      // Force scene update
      sceneRef.current.updateMatrixWorld(true);
      
      console.log('✅ Building created and added to scene');

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
    if (containerRef.current) {
      if (rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      containerRef.current.removeEventListener('mousedown', handleMouseDown);
      containerRef.current.removeEventListener('mouseup', handleMouseUp);
    }
    window.removeEventListener('resize', handleResize);
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
  };

  const startDrawing = () => {
    console.log('🎨 Starting drawing mode');
    setIsDrawing(true);
    // Immediately update the refs
    isDrawingRef.current = true;
    currentPointsRef.current = [];
    setCurrentPoints([]);
    setPointMarkers([]);
    setLines([]);
  };

  const stopDrawing = () => {
    console.log('🛑 Stopping drawing mode');
    
    // Clear any existing markers and lines
    pointMarkers.forEach(marker => {
      sceneRef.current!.remove(marker);
    });
    
    lines.forEach(line => {
      sceneRef.current!.remove(line);
    });
    
    setIsDrawing(false);
    // Immediately update the refs
    isDrawingRef.current = false;
    currentPointsRef.current = [];
    setCurrentPoints([]);
    setPointMarkers([]);
    setLines([]);
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