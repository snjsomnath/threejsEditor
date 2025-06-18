import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Point3D, BuildingData, BuildingConfig } from '../types/building';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

export const useBuildingManager = (scene: THREE.Scene | null, camera: THREE.PerspectiveCamera | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
  const [hoveredFootprint, setHoveredFootprint] = useState<BuildingData | null>(null);
  const buildingIdCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const buildingsRef = useRef<BuildingData[]>([]);

  // Keep buildingsRef in sync with buildings state
  useEffect(() => {
    buildingsRef.current = buildings;
    console.log('Buildings updated:', buildings.map(b => b.id));
  }, [buildings]);

  const createFootprintOutline = (points: Point3D[], scene: THREE.Scene): THREE.Mesh => {
    // Create a thin plane geometry that follows the building footprint
    const shape = new THREE.Shape();
    
    if (points.length > 0) {
      // Use points in original order, but adjust the shape creation
      shape.moveTo(points[0].x, points[0].z);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].z);
      }
      shape.lineTo(points[0].x, points[0].z); // Close the shape
    }

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const footprint = new THREE.Mesh(geometry, material);
    footprint.rotation.x = -Math.PI / 2; // Lay flat on ground
    footprint.position.y = 0.05; // Slightly above ground
    footprint.visible = true;
    footprint.frustumCulled = false;
    
    scene.add(footprint);
    return footprint;
  };

  const addBuilding = useCallback((mesh: THREE.Mesh, points: Point3D[], floors: number, floorHeight: number) => {
    if (!scene) return;

    const area = calculatePolygonArea(points);
    const buildingId = `building_${++buildingIdCounter.current}`;
    
    // Add click handler to mesh for selection
    mesh.userData = { buildingId };
    mesh.visible = true;
    mesh.frustumCulled = false;
    
    // Ensure material is properly set up for interaction
    if (mesh.material) {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.depthTest = true;
      material.transparent = false;
      material.side = THREE.FrontSide;
    }

    const building: BuildingData = {
      id: buildingId,
      mesh,
      points,
      area,
      floors,
      floorHeight,
      createdAt: new Date(),
      name: `Building`,
      description: '',
      color: (mesh.material as THREE.MeshLambertMaterial).color.getHex(),
      footprintOutline: null
    };

    // Create footprint outline for selection
    building.footprintOutline = createFootprintOutline(points, scene);
    building.footprintOutline.userData = { buildingId, isFootprint: true };
    building.footprintOutline.visible = true;
    building.footprintOutline.frustumCulled = false;

    // Ensure mesh is added to the scene
    if (!scene.children.includes(mesh)) {
      scene.add(mesh);
    }

    // Debug: confirm mesh is in scene
    console.log('Adding building to scene:', {
      id: building.id,
      mesh: mesh.uuid,
      footprint: building.footprintOutline.uuid,
      sceneChildren: scene.children.length,
      userData: {
        mesh: mesh.userData,
        footprint: building.footprintOutline.userData
      }
    });

    // Update both state and ref synchronously
    const newBuildings = [...buildingsRef.current, building];
    buildingsRef.current = newBuildings;
    setBuildings(newBuildings);

    // Debug: verify building was added
    console.log('Building added:', {
      id: building.id,
      buildingsCount: newBuildings.length,
      buildingsIds: newBuildings.map(b => b.id)
    });

    return building; // Return the building for immediate use
  }, [scene]);

  const updateBuilding = useCallback((id: string, updates: Partial<BuildingData> & { config?: BuildingConfig }) => {
    if (!scene) return;

    setBuildings(prev => prev.map(building => {
      if (building.id !== id) return building;

      const updatedBuilding = { ...building, ...updates };
      
      // If config is provided, update the 3D mesh
      if (updates.config) {
        const config = updates.config;
        
        // Update geometry if height changed
        const newHeight = config.floors * config.floorHeight;
        const currentHeight = building.floors * building.floorHeight;
        
        if (newHeight !== currentHeight) {
          // Remove old mesh
          scene.remove(building.mesh);
          building.mesh.geometry.dispose();
          
          // Create new geometry with updated height
          const { createShapeFromPoints, calculateCentroid } = require('../utils/geometry');
          const centroid = calculateCentroid(building.points);
          const shape = createShapeFromPoints(building.points, centroid);
          
          const extrudeSettings = {
            depth: newHeight,
            bevelEnabled: false,
            steps: 1
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          geometry.rotateX(-Math.PI / 2);
          
          // Update mesh
          building.mesh.geometry = geometry;
          building.mesh.position.set(centroid.x, 0, centroid.z);
          
          // Re-add to scene
          scene.add(building.mesh);
        }
        
        // Update material color
        const material = building.mesh.material as THREE.MeshLambertMaterial;
        material.color.setHex(config.color);
        
        // Update building data
        updatedBuilding.floors = config.floors;
        updatedBuilding.floorHeight = config.floorHeight;
        updatedBuilding.color = config.color;
      }

      return updatedBuilding;
    }));

    // Update selected building if it's the one being updated
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [scene, selectedBuilding]);

  const selectBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous selection
    if (selectedBuilding) {
      const material = selectedBuilding.mesh.material as THREE.MeshLambertMaterial;
      // Restore original color and opacity
      material.emissive.setHex(0x000000);
      if (typeof selectedBuilding.color === 'number') {
        material.color.setHex(selectedBuilding.color);
      }
      material.transparent = false;
      material.opacity = 1.0;
    }

    // Highlight new selection
    if (building) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      // Set to very transparent orange
      material.color.setHex(0xffa500); // orange
      material.transparent = true;
      material.opacity = 0.2;
      material.emissive.setHex(0xffa500); // strong orange glow
    }

    setSelectedBuilding(building);
  }, [selectedBuilding]);

  const hoverBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous hover (only if not selected)
    if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
      const material = hoveredBuilding.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x000000);
    }

    // Highlight new hover (only if not selected)
    if (building && building !== selectedBuilding) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x222222);
      // Log to console when hovering a building
      console.log('Hovering building:', building.id, building.name);
    }

    setHoveredBuilding(building);
  }, [hoveredBuilding, selectedBuilding]);

  const hoverFootprint = useCallback((building: BuildingData | null) => {
    // Hide previous footprint outline
    if (hoveredFootprint && hoveredFootprint.footprintOutline) {
      const material = hoveredFootprint.footprintOutline.material as THREE.MeshBasicMaterial;
      material.opacity = 0;
    }

    // Show new footprint outline with animation
    if (building && building.footprintOutline) {
      const material = building.footprintOutline.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3;
      
      // Create pulsing animation
      const animate = () => {
        if (building === hoveredFootprint && building.footprintOutline) {
          const time = Date.now() * 0.004;
          const opacity = 0.2 + Math.sin(time) * 0.15;
          material.opacity = opacity;
          material.color.setHex(0x00ffaa + Math.floor(Math.sin(time * 2) * 0x001100));
          requestAnimationFrame(animate);
        }
      };
      animate();
    }

    setHoveredFootprint(building);
  }, [hoveredFootprint]);

  const deleteBuilding = useCallback((id: string) => {
    if (!scene) return;

    setBuildings(prev => {
      const building = prev.find(b => b.id === id);
      if (building) {
        scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        (building.mesh.material as THREE.Material).dispose();
        
        // Remove footprint outline
        if (building.footprintOutline) {
          scene.remove(building.footprintOutline);
          building.footprintOutline.geometry.dispose();
          (building.footprintOutline.material as THREE.Material).dispose();
        }
      }
      return prev.filter(b => b.id !== id);
    });

    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
    if (hoveredBuilding?.id === id) {
      setHoveredBuilding(null);
    }
    if (hoveredFootprint?.id === id) {
      setHoveredFootprint(null);
    }
  }, [scene, selectedBuilding, hoveredBuilding, hoveredFootprint]);

  const clearAllBuildings = useCallback(() => {
    if (!scene) return;

    buildingsRef.current.forEach(building => {
      scene.remove(building.mesh);
      building.mesh.geometry.dispose();
      (building.mesh.material as THREE.Material).dispose();
      
      // Remove footprint outline
      if (building.footprintOutline) {
        scene.remove(building.footprintOutline);
        building.footprintOutline.geometry.dispose();
        (building.footprintOutline.material as THREE.Material).dispose();
      }
    });

    // Also remove any other footprint-related objects (lines, points, etc.)
    const objectsToRemove = scene.children.filter(child => {
      // Remove objects that might be footprint lines or points
      return child.userData?.isFootprintLine || 
             child.userData?.isFootprintPoint || 
             child.userData?.isDrawingElement ||
             child.userData?.isPolygonFootprint ||
             (child instanceof THREE.Line) ||
             (child instanceof THREE.Points);
    });

    objectsToRemove.forEach(obj => {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    // Clear both ref and state
    buildingsRef.current = [];
    setBuildings([]);
    setSelectedBuilding(null);
    setHoveredBuilding(null);
    setHoveredFootprint(null);
  }, [scene]);

  const exportBuildings = useCallback(() => {
    const exportData = {
      version: '2.1',
      createdAt: new Date().toISOString(),
      buildings: buildings.map(building => ({
        id: building.id,
        name: building.name,
        description: building.description,
        points: building.points,
        area: building.area,
        floors: building.floors,
        floorHeight: building.floorHeight,
        color: building.color,
        totalHeight: building.floors * building.floorHeight,
        createdAt: building.createdAt.toISOString()
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [buildings]);

  // Handle building and footprint interaction via mouse events
  const handleBuildingInteraction = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!scene || !camera) {
      console.warn('Scene or camera not available');
      return null;
    }

    // Calculate mouse position
    const rect = containerElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Get all meshes in the scene
    const meshes = scene.children.filter(child => child instanceof THREE.Mesh) as THREE.Mesh[];
    console.log('Found meshes:', meshes.length, meshes);

    // Get intersections
    const intersects = raycaster.current.intersectObjects(meshes);
    console.log('Raycast intersects:', intersects.length, intersects);

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      console.log('Intersected mesh userData:', intersectedMesh.userData);

      // Get building ID from userData
      const buildingId = intersectedMesh.userData.buildingId;
      if (buildingId) {
        // Find building in current state
        const building = buildingsRef.current.find(b => b.id === buildingId);
        console.log('Found building:', building, 'type:', typeof building);

        if (building) {
          // Handle hover
          hoverBuilding(building);
          
          // Handle click
          if (event.type === 'click') {
            if (intersectedMesh.userData.isFootprint) {
              // Handle footprint click
              hoverFootprint(building);
              return { type: 'footprint', building };
            } else {
              // Handle building click
              selectBuilding(building);
              return { type: 'building', building };
            }
          }
        } else {
          console.warn('Building not found for ID:', buildingId, 'Available buildings:', buildingsRef.current);
        }
      }
    } else {
      // Clear hover states when not over any building
      hoverBuilding(null);
      hoverFootprint(null);
    }

    return null;
  }, [scene, camera, hoverBuilding, hoverFootprint, selectBuilding]);

  const buildingStats: BuildingStats = {
    count: buildings.length,
    totalArea: buildings.reduce((sum, building) => sum + building.area, 0),
    totalFloors: buildings.reduce((sum, building) => sum + building.floors, 0)
  };

  return {
    buildings,
    selectedBuilding,
    hoveredBuilding,
    hoveredFootprint,
    addBuilding,
    updateBuilding,
    selectBuilding,
    hoverBuilding,
    hoverFootprint,
    deleteBuilding,
    clearAllBuildings,
    exportBuildings,
    buildingStats,
    handleBuildingInteraction
  };
};

// Helper function to calculate polygon area using shoelace formula
const calculatePolygonArea = (points: Point3D[]): number => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].z;
    area -= points[j].x * points[i].z;
  }
  
  return Math.abs(area) / 2;
};