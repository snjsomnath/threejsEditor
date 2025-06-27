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

export const snapToGrid = (point: Point3D, gridSize: number): Point3D => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: point.y,
    z: Math.round(point.z / gridSize) * gridSize
  };
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
  console.log('getGroundIntersection called', { 
    mouse: { x: mouse.x, y: mouse.y }, 
    hasCamera: !!camera, 
    hasGroundPlane: !!groundPlane,
    groundPlaneVisible: groundPlane.visible,
    groundPlanePosition: groundPlane.position,
    groundPlaneRotation: groundPlane.rotation
  });
  
  const raycaster = new THREE.Raycaster();
  
  // Set raycaster from camera with mouse coordinates
  raycaster.setFromCamera(mouse, camera);
  
  console.log('Raycaster ray:', {
    origin: raycaster.ray.origin,
    direction: raycaster.ray.direction
  });
  
  // Try intersecting with the ground plane specifically
  const intersects = raycaster.intersectObject(groundPlane, false);
  
  console.log('Raycaster intersects:', intersects.length);
  
  if (intersects.length > 0) {
    const point = intersects[0].point;
    const result = { x: point.x, y: point.y, z: point.z };
    console.log('Ground intersection found:', result);
    return result;
  }
  
  // IMPROVED FALLBACK: Use a more reliable plane intersection method
  // Create a mathematical plane at y=0 regardless of the mesh
  const groundMathPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const planeIntersectPoint = new THREE.Vector3();
  const ray = raycaster.ray;
  
  const didIntersect = ray.intersectPlane(groundMathPlane, planeIntersectPoint);
  
  if (didIntersect) {
    const result = { x: planeIntersectPoint.x, y: 0, z: planeIntersectPoint.z };
    console.log('Mathematical plane intersection found:', result);
    return result;
  }
  
  // Original fallback method as last resort
  if (Math.abs(ray.direction.y) > 0.0001) { // Avoid division by zero
    const t = -ray.origin.y / ray.direction.y;
    if (t > 0) { // Only intersections in front of camera
      const intersection = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
      const result = { x: intersection.x, y: 0, z: intersection.z };
      console.log('Manual ground intersection found:', result);
      return result;
    }
  }
  
  console.log('No ground intersection');
  return null;
};

/**
 * Calculate the signed area of a polygon using the shoelace formula.
 * Positive area indicates counter-clockwise (anti-clockwise) winding,
 * negative area indicates clockwise winding.
 */
export const calculateSignedArea = (points: Point3D[]): number => {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += (points[j].x - points[i].x) * (points[j].z + points[i].z);
  }
  
  return area / 2;
};

/**
 * Check if polygon points are in counter-clockwise (anti-clockwise) order.
 * Returns true if anti-clockwise, false if clockwise.
 */
export const isCounterClockwise = (points: Point3D[]): boolean => {
  return calculateSignedArea(points) > 0;
};

/**
 * Ensure polygon points are in counter-clockwise (anti-clockwise) order.
 * If the points are clockwise, this function will reverse their order.
 * Returns a new array with points in anti-clockwise order.
 */
export const ensureCounterClockwise = (points: Point3D[]): Point3D[] => {
  if (points.length < 3) return [...points];
  
  // If already counter-clockwise, return a copy
  if (isCounterClockwise(points)) {
    return [...points];
  }
  
  // Reverse the order to make it counter-clockwise
  return [...points].reverse();
};