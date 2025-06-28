import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  calculateCentroid,
  calculateDistance,
  snapToGrid,
  createShapeFromPoints,
  getGroundIntersection,
  calculateSignedArea,
  isCounterClockwise,
  ensureCounterClockwise
} from '../geometry';
import { Point3D } from '../../types/building';

describe('geometry utilities', () => {
  describe('calculateCentroid', () => {
    it('should calculate centroid of a triangle', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 }
      ];
      
      const centroid = calculateCentroid(points);
      
      expect(centroid.x).toBe(1);
      expect(centroid.y).toBe(0);
      expect(centroid.z).toBe(1);
    });

    it('should calculate centroid of a square', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 0, z: 2 },
        { x: 0, y: 0, z: 2 }
      ];
      
      const centroid = calculateCentroid(points);
      
      expect(centroid.x).toBe(1);
      expect(centroid.y).toBe(0);
      expect(centroid.z).toBe(1);
    });

    it('should handle points with different y values', () => {
      const points: Point3D[] = [
        { x: 0, y: 5, z: 0 },
        { x: 6, y: 10, z: 0 },
        { x: 0, y: 15, z: 6 }
      ];
      
      const centroid = calculateCentroid(points);
      
      expect(centroid.x).toBe(2);
      expect(centroid.y).toBe(10);
      expect(centroid.z).toBe(2);
    });

    it('should handle single point', () => {
      const points: Point3D[] = [{ x: 5, y: 3, z: 7 }];
      
      const centroid = calculateCentroid(points);
      
      expect(centroid.x).toBe(5);
      expect(centroid.y).toBe(3);
      expect(centroid.z).toBe(7);
    });

    it('should handle empty array', () => {
      const points: Point3D[] = [];
      
      const centroid = calculateCentroid(points);
      
      expect(centroid.x).toBeNaN();
      expect(centroid.y).toBeNaN();
      expect(centroid.z).toBeNaN();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points on same plane', () => {
      const point1: Point3D = { x: 0, y: 0, z: 0 };
      const point2: Point3D = { x: 3, y: 0, z: 4 };
      
      const distance = calculateDistance(point1, point2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should calculate distance in 3D space', () => {
      const point1: Point3D = { x: 1, y: 2, z: 3 };
      const point2: Point3D = { x: 4, y: 6, z: 8 };
      
      const distance = calculateDistance(point1, point2);
      
      // Distance = sqrt((4-1)² + (6-2)² + (8-3)²) = sqrt(9 + 16 + 25) = sqrt(50)
      expect(distance).toBeCloseTo(Math.sqrt(50), 5);
    });

    it('should return 0 for same point', () => {
      const point: Point3D = { x: 5, y: 3, z: 7 };
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const point1: Point3D = { x: -3, y: -4, z: -5 };
      const point2: Point3D = { x: 3, y: 4, z: 5 };
      
      const distance = calculateDistance(point1, point2);
      
      // Distance = sqrt(6² + 8² + 10²) = sqrt(36 + 64 + 100) = sqrt(200)
      expect(distance).toBeCloseTo(Math.sqrt(200), 5);
    });
  });

  describe('snapToGrid', () => {
    it('should snap point to grid', () => {
      const point: Point3D = { x: 1.7, y: 5.3, z: 2.4 };
      const gridSize = 1;
      
      const snapped = snapToGrid(point, gridSize);
      
      expect(snapped.x).toBe(2);
      expect(snapped.y).toBe(5.3); // Y should remain unchanged
      expect(snapped.z).toBe(2);
    });

    it('should snap to larger grid size', () => {
      const point: Point3D = { x: 7.8, y: 10, z: 13.2 };
      const gridSize = 5;
      
      const snapped = snapToGrid(point, gridSize);
      
      expect(snapped.x).toBe(10);
      expect(snapped.y).toBe(10);
      expect(snapped.z).toBe(15);
    });

    it('should handle exact grid positions', () => {
      const point: Point3D = { x: 10, y: 5, z: 15 };
      const gridSize = 5;
      
      const snapped = snapToGrid(point, gridSize);
      
      expect(snapped.x).toBe(10);
      expect(snapped.y).toBe(5);
      expect(snapped.z).toBe(15);
    });

    it('should handle negative coordinates', () => {
      const point: Point3D = { x: -1.7, y: 0, z: -2.4 };
      const gridSize = 1;
      
      const snapped = snapToGrid(point, gridSize);
      
      expect(snapped.x).toBe(-2);
      expect(snapped.y).toBe(0);
      expect(snapped.z).toBe(-2);
    });

    it('should handle decimal grid size', () => {
      const point: Point3D = { x: 1.35, y: 0, z: 2.85 };
      const gridSize = 0.5;
      
      const snapped = snapToGrid(point, gridSize);
      
      expect(snapped.x).toBeCloseTo(1.5, 5);
      expect(snapped.y).toBe(0);
      expect(snapped.z).toBeCloseTo(3.0, 5);
    });
  });

  describe('createShapeFromPoints', () => {
    it('should create shape from triangle points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 2 }
      ];
      const centroid: Point3D = { x: 1, y: 0, z: 2/3 };
      
      const shape = createShapeFromPoints(points, centroid);
      
      expect(shape).toBeInstanceOf(THREE.Shape);
      expect(shape.curves).toHaveLength(3); // moveTo + 2 lineTo operations
    });

    it('should create shape from square points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 0, z: 2 },
        { x: 0, y: 0, z: 2 }
      ];
      const centroid: Point3D = { x: 1, y: 0, z: 1 };
      
      const shape = createShapeFromPoints(points, centroid);
      
      expect(shape).toBeInstanceOf(THREE.Shape);
      expect(shape.curves).toHaveLength(4); // moveTo + 3 lineTo operations
    });

    it('should throw error for insufficient points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 }
      ];
      const centroid: Point3D = { x: 1, y: 0, z: 0 };
      
      expect(() => createShapeFromPoints(points, centroid)).toThrow('Need at least 3 points to create a shape');
    });

    it('should handle points with different y values', () => {
      const points: Point3D[] = [
        { x: 0, y: 5, z: 0 },
        { x: 2, y: 10, z: 0 },
        { x: 1, y: 15, z: 2 }
      ];
      const centroid: Point3D = { x: 1, y: 10, z: 2/3 };
      
      const shape = createShapeFromPoints(points, centroid);
      
      expect(shape).toBeInstanceOf(THREE.Shape);
      expect(shape.curves).toHaveLength(3);
    });
  });

  describe('getGroundIntersection', () => {
    let camera: THREE.PerspectiveCamera;
    let groundPlane: THREE.Mesh;

    beforeEach(() => {
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 10, 10);
      camera.lookAt(0, 0, 0);
      
      const geometry = new THREE.PlaneGeometry(100, 100);
      const material = new THREE.MeshBasicMaterial();
      groundPlane = new THREE.Mesh(geometry, material);
      groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      groundPlane.visible = true;
    });

    it('should find intersection with ground plane', () => {
      const mouse = new THREE.Vector2(0, 0); // Center of screen
      
      const intersection = getGroundIntersection(mouse, camera, groundPlane);
      
      expect(intersection).not.toBeNull();
      expect(typeof intersection!.x).toBe('number');
      expect(typeof intersection!.y).toBe('number');
      expect(typeof intersection!.z).toBe('number');
    });

    it('should return intersection when fallback is used', () => {
      // Make ground plane invisible to force fallback
      groundPlane.visible = false;
      const mouse = new THREE.Vector2(0, 0);
      
      const intersection = getGroundIntersection(mouse, camera, groundPlane);
      
      expect(intersection).not.toBeNull();
      expect(typeof intersection!.x).toBe('number');
      expect(typeof intersection!.y).toBe('number');
      expect(typeof intersection!.z).toBe('number');
    });
  });

  describe('calculateSignedArea', () => {
    it('should calculate negative area for counter-clockwise square', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 0, z: 2 },
        { x: 0, y: 0, z: 2 }
      ];
      
      const area = calculateSignedArea(points);
      
      expect(area).toBe(-4); // This is actually clockwise in the XZ plane
    });

    it('should calculate positive area for clockwise square', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 2 },
        { x: 2, y: 0, z: 2 },
        { x: 2, y: 0, z: 0 }
      ];
      
      const area = calculateSignedArea(points);
      
      expect(area).toBe(4); // This is actually counter-clockwise in the XZ plane
    });

    it('should calculate area of triangle', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 4, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 }
      ];
      
      const area = calculateSignedArea(points);
      
      expect(area).toBe(-6); // This triangle is clockwise in XZ plane
    });

    it('should return 0 for insufficient points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 }
      ];
      
      const area = calculateSignedArea(points);
      
      expect(area).toBe(0);
    });

    it('should handle complex polygon', () => {
      // L-shaped polygon (counter-clockwise)
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 3, y: 0, z: 2 },
        { x: 1, y: 0, z: 2 },
        { x: 1, y: 0, z: 3 },
        { x: 0, y: 0, z: 3 }
      ];
      
      const area = calculateSignedArea(points);
      
      expect(area).toBe(-7); // Clockwise in XZ plane
    });
  });

  describe('isCounterClockwise', () => {
    it('should return false for points with negative area', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 0, z: 2 },
        { x: 0, y: 0, z: 2 }
      ];
      
      expect(isCounterClockwise(points)).toBe(false);
    });

    it('should return true for points with positive area', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 2 },
        { x: 2, y: 0, z: 2 },
        { x: 2, y: 0, z: 0 }
      ];
      
      expect(isCounterClockwise(points)).toBe(true);
    });

    it('should handle triangle', () => {
      const ccwTriangle: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 },
        { x: 3, y: 0, z: 0 }
      ];
      
      const cwTriangle: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 }
      ];
      
      expect(isCounterClockwise(ccwTriangle)).toBe(true);
      expect(isCounterClockwise(cwTriangle)).toBe(false);
    });

    it('should handle insufficient points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 }
      ];
      
      expect(isCounterClockwise(points)).toBe(false); // Area is 0, so not CCW
    });
  });

  describe('ensureCounterClockwise', () => {
    it('should reverse negative area points to positive', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 0, z: 2 },
        { x: 0, y: 0, z: 2 }
      ];
      
      const result = ensureCounterClockwise(points);
      
      expect(result).not.toBe(points); // Should be a new array
      expect(result).toEqual([...points].reverse()); // Should be reversed
      expect(isCounterClockwise(result)).toBe(true);
    });

    it('should return copy of already positive area points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 2 },
        { x: 2, y: 0, z: 2 },
        { x: 2, y: 0, z: 0 }
      ];
      
      const result = ensureCounterClockwise(points);
      
      expect(result).not.toBe(points); // Should be a new array
      expect(result).toEqual(points); // But with same content
      expect(isCounterClockwise(result)).toBe(true);
    });

    it('should handle triangle', () => {
      const clockwiseTriangle: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
        { x: 0, y: 0, z: 3 }
      ];
      
      const result = ensureCounterClockwise(clockwiseTriangle);
      
      expect(isCounterClockwise(result)).toBe(true);
      expect(result).toEqual([
        { x: 0, y: 0, z: 3 },
        { x: 3, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ]);
    });

    it('should handle insufficient points', () => {
      const points: Point3D[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 }
      ];
      
      const result = ensureCounterClockwise(points);
      
      expect(result).not.toBe(points); // Should be a new array
      expect(result).toEqual(points); // But with same content
    });

    it('should handle empty array', () => {
      const points: Point3D[] = [];
      
      const result = ensureCounterClockwise(points);
      
      expect(result).not.toBe(points); // Should be a new array
      expect(result).toEqual([]);
    });

    it('should handle single point', () => {
      const points: Point3D[] = [{ x: 5, y: 3, z: 7 }];
      
      const result = ensureCounterClockwise(points);
      
      expect(result).not.toBe(points); // Should be a new array
      expect(result).toEqual(points); // But with same content
    });
  });
});
