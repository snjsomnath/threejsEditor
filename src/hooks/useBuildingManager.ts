import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Point3D, BuildingData } from '../types/building';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

export const useBuildingManager = (scene: THREE.Scene | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const buildingIdCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const addBuilding = useCallback((mesh: THREE.Mesh, points: Point3D[], floors: number, floorHeight: number, buildingType: string) => {
    if (!scene) return;

    const area = calculatePolygonArea(points);
    const building: BuildingData = {
      id: `building_${++buildingIdCounter.current}`,
      mesh,
      points,
      area,
      floors,
      floorHeight,
      buildingType,
      createdAt: new Date()
    };

    // Add click handler to mesh for selection
    mesh.userData = { buildingId: building.id };

    setBuildings(prev => [...prev, building]);
  }, [scene]);

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

  const deleteBuilding = useCallback((id: string) => {
    if (!scene) return;

    setBuildings(prev => {
      const building = prev.find(b => b.id === id);
      if (building) {
        scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        (building.mesh.material as THREE.Material).dispose();
      }
      return prev.filter(b => b.id !== id);
    });

    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
  }, [scene, selectedBuilding]);

  const clearAllBuildings = useCallback(() => {
    if (!scene) return;

    buildings.forEach(building => {
      scene.remove(building.mesh);
      building.mesh.geometry.dispose();
      (building.mesh.material as THREE.Material).dispose();
    });

    setBuildings([]);
    setSelectedBuilding(null);
  }, [scene, buildings]);

  const exportBuildings = useCallback(() => {
    const exportData = {
      version: '2.0',
      createdAt: new Date().toISOString(),
      buildings: buildings.map(building => ({
        id: building.id,
        points: building.points,
        area: building.area,
        floors: building.floors,
        floorHeight: building.floorHeight,
        buildingType: building.buildingType,
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

  // Handle building selection via click
  const handleBuildingClick = useCallback((event: MouseEvent, camera: THREE.Camera, containerElement: HTMLElement) => {
    if (!scene || !camera) return;

    const rect = containerElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    
    const buildingMeshes = buildings.map(b => b.mesh);
    const intersects = raycaster.current.intersectObjects(buildingMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const buildingId = clickedMesh.userData.buildingId;
      const building = buildings.find(b => b.id === buildingId);
      
      if (building) {
        selectBuilding(building === selectedBuilding ? null : building);
      }
    } else {
      selectBuilding(null);
    }
  }, [buildings, selectedBuilding, selectBuilding, scene]);

  const buildingStats: BuildingStats = {
    count: buildings.length,
    totalArea: buildings.reduce((sum, building) => sum + building.area, 0),
    totalFloors: buildings.reduce((sum, building) => sum + building.floors, 0)
  };

  return {
    buildings,
    selectedBuilding,
    addBuilding,
    selectBuilding,
    deleteBuilding,
    clearAllBuildings,
    exportBuildings,
    buildingStats,
    handleBuildingClick
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