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

export const createShapeFromPoints = (points: Point3D[], centroid: Point3D): THREE.Shape => {
  if (points.length < 3) {
    throw new Error('Need at least 3 points to create a shape');
  }

  const shape = new THREE.Shape();
  
  // Convert 3D points to 2D shape coordinates relative to centroid
  // Use X and Z coordinates directly (Y is height, not used for ground shape)
  const firstPoint = points[0];
  const firstX = firstPoint.x - centroid.x;
  const firstY = firstPoint.z - centroid.z;
  
  shape.moveTo(firstX, firstY);
  
  // Add lines to other points
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const shapeX = point.x - centroid.x;
    const shapeY = point.z - centroid.z;
    shape.lineTo(shapeX, shapeY);
  }
  
  // Close the shape by connecting back to first point
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
    return { 
      x: Math.round(point.x * 10) / 10, // Round to 1 decimal place for cleaner coordinates
      y: 0, // Always 0 for ground level
      z: Math.round(point.z * 10) / 10 
    };
  }
  
  return null;
};