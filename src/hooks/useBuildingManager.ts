import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Point3D } from '../types/building';

interface BuildingData {
  id: string;
  mesh: THREE.Mesh;
  points: Point3D[];
  area: number;
  createdAt: Date;
}

interface BuildingStats {
  count: number;
  totalArea: number;
}

export const useBuildingManager = (scene: THREE.Scene | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const buildingIdCounter = useRef(0);

  const addBuilding = useCallback((mesh: THREE.Mesh, points: Point3D[]) => {
    if (!scene) return;

    const area = calculatePolygonArea(points);
    const building: BuildingData = {
      id: `building_${++buildingIdCounter.current}`,
      mesh,
      points,
      area,
      createdAt: new Date()
    };

    setBuildings(prev => [...prev, building]);
  }, [scene]);

  const removeBuilding = useCallback((id: string) => {
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
  }, [scene]);

  const clearAllBuildings = useCallback(() => {
    if (!scene) return;

    buildings.forEach(building => {
      scene.remove(building.mesh);
      building.mesh.geometry.dispose();
      (building.mesh.material as THREE.Material).dispose();
    });

    setBuildings([]);
  }, [scene, buildings]);

  const exportBuildings = useCallback(() => {
    const exportData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      buildings: buildings.map(building => ({
        id: building.id,
        points: building.points,
        area: building.area,
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

  const buildingStats: BuildingStats = {
    count: buildings.length,
    totalArea: buildings.reduce((sum, building) => sum + building.area, 0)
  };

  return {
    buildings,
    addBuilding,
    removeBuilding,
    clearAllBuildings,
    exportBuildings,
    buildingStats
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