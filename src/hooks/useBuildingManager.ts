import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Point3D, BuildingData, BuildingConfig, BuildingTooltipData } from '../types/building';
import { createShapeFromPoints, calculateCentroid } from '../utils/geometry';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

export const useBuildingManager = (scene: THREE.Scene | null, camera: THREE.PerspectiveCamera | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
  const [buildingTooltip, setBuildingTooltip] = useState<BuildingTooltipData | null>(null);
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
      // Use points in original order with corrected coordinate mapping
      // Since we rotate the mesh by -PI/2 around X, we need to map coordinates correctly
      shape.moveTo(points[0].x, -points[0].z); // Negate Z to correct for rotation
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, -points[i].z); // Negate Z to correct for rotation
      }
      shape.lineTo(points[0].x, -points[0].z); // Close the shape
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
        
        // Always update material color immediately for responsive feedback
        const material = building.mesh.material as THREE.MeshLambertMaterial;
        material.color.setHex(config.color);
        
        // Update geometry if height changed
        const newHeight = config.floors * config.floorHeight;
        const currentHeight = building.floors * building.floorHeight;
        
        if (newHeight !== currentHeight) {
          // Remove old mesh
          scene.remove(building.mesh);
          building.mesh.geometry.dispose();
          
          // Create new geometry with updated height
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
          
          // Reapply color after geometry change
          const newMaterial = building.mesh.material as THREE.MeshLambertMaterial;
          newMaterial.color.setHex(config.color);
        }
        
        // Update building data
        updatedBuilding.floors = config.floors;
        updatedBuilding.floorHeight = config.floorHeight;
        updatedBuilding.color = config.color;
        updatedBuilding.name = config.name || updatedBuilding.name;
        updatedBuilding.description = config.description || updatedBuilding.description;
      }

      return updatedBuilding;
    }));

    // Update buildingsRef to keep it in sync
    buildingsRef.current = buildingsRef.current.map(building => {
      if (building.id !== id) return building;
      return { ...building, ...updates };
    });

    // Update selected building if it's the one being updated
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [scene, selectedBuilding]);

  const selectBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous selection
    if (selectedBuilding) {
      const material = selectedBuilding.mesh.material as THREE.MeshLambertMaterial;
      // Restore original color and remove selection effects
      material.emissive.setHex(0x000000);
      if (typeof selectedBuilding.color === 'number') {
        material.color.setHex(selectedBuilding.color);
      }
      material.transparent = false;
      material.opacity = 1.0;
    }

    // Apply selection to new building
    if (building) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      // Set selection color (orange with transparency)
      material.color.setHex(0xffa500); // orange
      material.transparent = true;
      material.opacity = 0.6; // More visible than before
      material.emissive.setHex(0x332200); // subtle orange glow
    }

    setSelectedBuilding(building);
  }, [selectedBuilding]);

  const hoverBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous hover (only if not selected)
    if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
      const material = hoveredBuilding.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x000000);
      // Restore original color
      if (typeof hoveredBuilding.color === 'number') {
        material.color.setHex(hoveredBuilding.color);
      }
    }

    // Apply hover to new building (only if not selected)
    if (building && building !== selectedBuilding) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x444444); // Gray highlight for hover
      console.log('Hovering building:', building.id, building.name);
    }

    setHoveredBuilding(building);
  }, [hoveredBuilding, selectedBuilding]);

  const showBuildingTooltip = useCallback((building: BuildingData, screenPosition: { x: number; y: number }) => {
    setBuildingTooltip({
      building,
      position: screenPosition,
      visible: true
    });
  }, []);

  const hideBuildingTooltip = useCallback(() => {
    setBuildingTooltip(null);
  }, []);

  // Convert 3D world position to screen coordinates
  const worldToScreen = useCallback((worldPosition: THREE.Vector3, camera: THREE.PerspectiveCamera): { x: number; y: number } => {
    const vector = worldPosition.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    
    return { x, y };
  }, []);

  const deleteBuilding = useCallback((id: string) => {
    if (!scene) return;

    // Hide tooltip if it's showing the building being deleted
    if (buildingTooltip?.building.id === id) {
      setBuildingTooltip(null);
    }

    setBuildings(prev => {
      const building = prev.find(b => b.id === id);
      if (building) {
        // Remove main building mesh
        scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        (building.mesh.material as THREE.Material).dispose();
        
        // Remove footprint outline
        if (building.footprintOutline) {
          scene.remove(building.footprintOutline);
          building.footprintOutline.geometry.dispose();
          (building.footprintOutline.material as THREE.Material).dispose();
        }

        // Remove any associated drawing elements (points, lines, polygons)
        const objectsToRemove = scene.children.filter(child => {
          return child.userData?.buildingId === id || 
                 child.userData?.associatedBuildingId === id ||
                 (child.userData?.isDrawingElement && child.userData?.buildingId === id) ||
                 (child.userData?.isFootprintLine && child.userData?.buildingId === id) ||
                 (child.userData?.isFootprintPoint && child.userData?.buildingId === id);
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
      }
      return prev.filter(b => b.id !== id);
    });

    // Update refs
    buildingsRef.current = buildingsRef.current.filter(b => b.id !== id);

    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
    if (hoveredBuilding?.id === id) {
      setHoveredBuilding(null);
    }
  }, [scene, selectedBuilding, hoveredBuilding, buildingTooltip]);

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
      console.warn('Scene or camera not available for building interaction');
      return null;
    }

    console.log('Building interaction called', { 
      eventType: event.type, 
      buildingsCount: buildingsRef.current.length,
      sceneChildren: scene.children.length 
    });

    // Calculate mouse position
    const rect = containerElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('Mouse position:', { x: mouse.current.x, y: mouse.current.y });

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Get all meshes in the scene (including building meshes and footprints)
    const allMeshes = scene.children.filter(child => child instanceof THREE.Mesh) as THREE.Mesh[];
    console.log('Total meshes in scene:', allMeshes.length);
    
    // Filter for building-related meshes only
    const buildingMeshes = allMeshes.filter(mesh => 
      mesh.userData.buildingId || mesh.userData.isFootprint
    );
    console.log('Building meshes found:', buildingMeshes.length);

    // Get intersections
    const intersects = raycaster.current.intersectObjects(buildingMeshes);
    console.log('Intersections found:', intersects.length);

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const intersectionPoint = intersects[0].point;

      console.log('Intersected mesh:', {
        uuid: intersectedMesh.uuid,
        userData: intersectedMesh.userData,
        position: intersectionPoint
      });

      // Get building ID from userData
      const buildingId = intersectedMesh.userData.buildingId;
      if (buildingId) {
        // Find building in current state
        const building = buildingsRef.current.find(b => b.id === buildingId);
        console.log('Found building:', building?.id);

        if (building) {
          if (event.type === 'click' || event.type === 'mouseup') {
            // Handle click - ONLY show tooltip, do NOT select building
            console.log('Showing tooltip for building click');
            const screenPos = worldToScreen(intersectionPoint, camera);
            showBuildingTooltip(building, screenPos);
            
            return {
              type: intersectedMesh.userData.isFootprint ? 'footprint' : 'building',
              building,
              action: 'tooltip'
            };
          } else if (event.type === 'mousemove') {
            // Handle hover - only if not already hovered
            if (building !== hoveredBuilding) {
              hoverBuilding(building);
            }
          }
        }
      } else {
        console.log('Intersected mesh has no buildingId');
      }
    } else {
      console.log('No intersections found');
      // No intersections - handle accordingly
      if (event.type === 'mousemove') {
        // Clear hover when not over any building
        hoverBuilding(null);
      } else if (event.type === 'click' || event.type === 'mouseup') {
        // Click on empty space - clear tooltip only (don't change selection)
        setBuildingTooltip(null);
      }
    }

    return null;
  }, [scene, camera, hoveredBuilding, hoverBuilding, showBuildingTooltip, worldToScreen]);

  const buildingStats: BuildingStats = {
    count: buildings.length,
    totalArea: buildings.reduce((sum, building) => sum + building.area, 0),
    totalFloors: buildings.reduce((sum, building) => sum + building.floors, 0)
  };

  return {
    buildings,
    selectedBuilding,
    hoveredBuilding,
    buildingTooltip,
    addBuilding,
    updateBuilding,
    selectBuilding,
    hoverBuilding,
    deleteBuilding,
    clearAllBuildings,
    exportBuildings,
    buildingStats,
    handleBuildingInteraction,
    showBuildingTooltip,
    hideBuildingTooltip
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