// Handles geometric placement of windows
import * as THREE from 'three';
import { WindowParametricResult } from './WindowParametricSolver';

export interface WindowPlacementConfig {
  p1: THREE.Vector2;
  p2: THREE.Vector2;
  normal: THREE.Vector2;
  edgeLength: number;
  numFloors: number;
  floorHeight: number;
  windowHeight: number;
  windowSpacing: number;
  offsetDistance: number;
  parametric: WindowParametricResult;
}

export interface WindowPlacement {
  position: THREE.Vector3;
  rotationY: number;
  scaleX: number;
}

export function placeWindowsOnEdge(cfg: WindowPlacementConfig): WindowPlacement[] {
  const result: WindowPlacement[] = [];
  const {
    p1, p2, normal, edgeLength, numFloors, floorHeight, windowHeight, windowSpacing, offsetDistance, parametric
  } = cfg;
  const verticalSpacing = windowSpacing;
  const availableVerticalSpace = floorHeight - 2 * verticalSpacing;
  const windowRows = Math.max(1, Math.floor(availableVerticalSpace / (windowHeight + verticalSpacing)));
  for (let floor = 0; floor < numFloors; floor++) {
    const baseY = floor * floorHeight;
    for (let row = 0; row < windowRows; row++) {
      const rowY = baseY + verticalSpacing + (row + 0.5) * (availableVerticalSpace / windowRows);
      for (let col = 0; col < parametric.numWindows; col++) {
        const edgePos = parametric.marginStart + col * (parametric.windowWidth + parametric.spacing) + parametric.windowWidth / 2;
        const edgeT = edgePos / edgeLength;
        const pos2D = p1.clone().lerp(p2, edgeT);
        const x = pos2D.x + normal.x * offsetDistance;
        const z = pos2D.y + normal.y * offsetDistance;
        const position = new THREE.Vector3(x, rowY, z);
        const rotationY = Math.atan2(normal.y, normal.x) + Math.PI / 2;
        const scaleX = parametric.windowWidth / (edgeLength / parametric.numWindows); // Approximate original windowWidth
        result.push({ position, rotationY, scaleX });
      }
    }
  }
  return result;
}

// Utility to create a frame geometry with a hole for the glass
export function createFrameGeometry(windowWidth: number, windowHeight: number, frameThickness: number): THREE.BufferGeometry {
  // Frame thickness is both the border width and the extrusion depth (e.g., 0.1 = 10cm)
  const outerW = windowWidth + 2 * frameThickness;
  const outerH = windowHeight + 2 * frameThickness;
  const innerW = windowWidth;
  const innerH = windowHeight;

  const shape = new THREE.Shape();
  // Outer rectangle (counter-clockwise)
  shape.moveTo(-outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, outerH / 2);
  shape.lineTo(outerW / 2, -outerH / 2);
  shape.lineTo(-outerW / 2, -outerH / 2);

  // Inner rectangle (hole, clockwise)
  const hole = new THREE.Path();
  hole.moveTo(-innerW / 2, -innerH / 2);
  hole.lineTo(-innerW / 2, innerH / 2);
  hole.lineTo(innerW / 2, innerH / 2);
  hole.lineTo(innerW / 2, -innerH / 2);
  hole.lineTo(-innerW / 2, -innerH / 2);

  shape.holes.push(hole);

  return new THREE.ExtrudeGeometry(shape, {
    depth: frameThickness, // 10cm = 0.1
    bevelEnabled: false
  });
}
