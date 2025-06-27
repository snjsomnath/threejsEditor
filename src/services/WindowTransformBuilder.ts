// Handles transformation matrix creation
import * as THREE from 'three';

export interface WindowTransformConfig {
  position: THREE.Vector3;
  right: THREE.Vector3; // Direction along the wall (normalized)
  normal: THREE.Vector3; // Wall surface normal (normalized)
  scaleX: number;
  windowWidth: number;
  windowHeight: number;
  glassOffset: number;
}

export function buildWindowMatrices(cfg: WindowTransformConfig): { glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4 } {
  const { position, right, normal, scaleX, windowWidth, windowHeight, glassOffset } = cfg;
  // Ensure right and normal are normalized
  const rightNorm = right.clone().normalize();
  const normalNorm = normal.clone().normalize();
  // Up is always Y axis (assuming vertical walls)
  const up = new THREE.Vector3(0, 1, 0);
  // Build rotation matrix from basis vectors
  // Columns: right, up, normal
  const basis = new THREE.Matrix4();
  basis.makeBasis(rightNorm, up, normalNorm);
  const rotation = new THREE.Quaternion().setFromRotationMatrix(basis);
  // Scale in world units
  const windowScale = new THREE.Vector3(windowWidth * scaleX, windowHeight, 1);
  // Offset glass along the true normal
  const glassOffsetVec = normalNorm.clone().multiplyScalar(glassOffset);
  const glassMatrix = new THREE.Matrix4().compose(
    position.clone().add(glassOffsetVec),
    rotation,
    windowScale
  );
  const frameMatrix = new THREE.Matrix4().compose(
    position,
    rotation,
    windowScale
  );
  return { glassMatrix, frameMatrix };
}
