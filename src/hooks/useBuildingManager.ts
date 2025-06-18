import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Point3D, BuildingData, BuildingConfig } from '../types/building';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

export const useBuildingManager = (scene: THREE.Scene | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
  const [hoveredFootprint, setHoveredFootprint] = useState<BuildingData | null>(null);
  const buildingIdCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const addBuilding = useCallback((mesh: THREE.Mesh, points: Point3D[], floors: number, floorHeight: number) => {
    if (!scene) return;

    const area = calculatePolygonArea(points);
    const building: BuildingData = {
      id: `building_${++buildingIdCounter.current}`,
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
    building.footprintOutline.userData = { buildingId: building.id, isFootprint: true };
    building.footprintOutline.visible = false; // Hidden by default

    // Add click handler to mesh for selection
    mesh.userData = { buildingId: building.id };

    setBuildings(prev => [...prev, building]);
  }, [scene]);

  const createFootprintOutline = (points: Point3D[], scene: THREE.Scene): THREE.Mesh => {
    // Create a thin plane geometry that follows the building footprint
    const shape = new THREE.Shape();
    
    if (points.length > 0) {
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
      opacity: 0,
      side: THREE.DoubleSide
    });
    
    const footprint = new THREE.Mesh(geometry, material);
    footprint.rotation.x = -Math.PI / 2; // Lay flat on ground
    footprint.position.y = 0.05; // Slightly above ground
    
    scene.add(footprint);
    return footprint;
  };

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
      material.emissive.setHex(0x000000);
    }

    // Highlight new selection
    if (building) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x444444);
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

    buildings.forEach(building => {
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

    setBuildings([]);
    setSelectedBuilding(null);
    setHoveredBuilding(null);
    setHoveredFootprint(null);
  }, [scene, buildings]);

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
  const handleBuildingInteraction = useCallback((event: MouseEvent, camera: THREE.Camera, containerElement: HTMLElement, isDrawing: boolean) => {
    if (!scene || !camera || isDrawing) return;

    const rect = containerElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Check for footprint intersections first (they're at ground level)
    const footprintMeshes = buildings.map(b => b.footprintOutline).filter(Boolean) as THREE.Mesh[];
    const footprintIntersects = raycaster.current.intersectObjects(footprintMeshes);
    
    if (footprintIntersects.length > 0) {
      const clickedFootprint = footprintIntersects[0].object as THREE.Mesh;
      const buildingId = clickedFootprint.userData.buildingId;
      const building = buildings.find(b => b.id === buildingId);
      
      if (building) {
        if (event.type === 'mousemove') {
          hoverFootprint(building);
          hoverBuilding(null); // Clear building hover when hovering footprint
        }
        // Return the interaction result for click handling
        return { type: 'footprint', building };
      }
    } else {
      // Clear footprint hover if not hovering any footprint
      if (event.type === 'mousemove') {
        hoverFootprint(null);
      }
      
      // Check for building mesh intersections
      const buildingMeshes = buildings.map(b => b.mesh);
      const buildingIntersects = raycaster.current.intersectObjects(buildingMeshes);

      if (buildingIntersects.length > 0) {
        const clickedMesh = buildingIntersects[0].object as THREE.Mesh;
        const buildingId = clickedMesh.userData.buildingId;
        const building = buildings.find(b => b.id === buildingId);
        
        if (building) {
          if (event.type === 'click') {
            selectBuilding(building === selectedBuilding ? null : building);
          } else if (event.type === 'mousemove') {
            hoverBuilding(building);
          }
          return { type: 'building', building };
        }
      } else {
        if (event.type === 'click') {
          selectBuilding(null);
        } else if (event.type === 'mousemove') {
          hoverBuilding(null);
        }
      }
    }
    
    return null;
  }, [buildings, selectedBuilding, selectBuilding, hoverBuilding, hoverFootprint, scene]);

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