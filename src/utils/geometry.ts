import * as THREE from 'three';
import { Point3D } from '../types/building';

export const calculateCentroid = (points: Point3D[]): Point3D => {
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
    z: sum.z / points.length,
  };
};

export const calculateDistance = (point1: Point3D, point2: Point3D): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export const createShapeFromPoints = (points: Point3D[], centroid: Point3D): THREE.Shape => {
  if (points.length < 3) {
    throw new Error('Need at least 3 points to create a shape');
  }

  const shape = new THREE.Shape();
  
  // Map first point to shape coordinates (X->X, Z->-Y to fix flipping)
  const firstX = points[0].x - centroid.x;
  const firstY = -(points[0].z - centroid.z);
  shape.moveTo(firstX, firstY);
  
  // Add lines to other points
  for (let i = 1; i < points.length; i++) {
    const shapeX = points[i].x - centroid.x;
    const shapeY = -(points[i].z - centroid.z);
    shape.lineTo(shapeX, shapeY);
  }
  
  // Close the shape
  shape.lineTo(firstX, firstY);
  
  return shape;
};

export const getGroundIntersection = (
  mouse: THREE.Vector2,
  camera: THREE.Camera,
  groundPlane: THREE.Mesh
): Point3D | null => {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(groundPlane);
  
  if (intersects.length > 0) {
    const point = intersects[0].point;
    return { x: point.x, y: point.y, z: point.z };
  }
  
  return null;
};