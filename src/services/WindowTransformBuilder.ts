// Handles transformation matrix creation
import * as THREE from 'three';

export interface WindowTransformConfig {
  position: THREE.Vector3;
  rotationY: number;
  scaleX: number;
  windowWidth: number;
  windowHeight: number;
  glassOffset: number;
}

export function buildWindowMatrices(cfg: WindowTransformConfig): { glassMatrix: THREE.Matrix4, frameMatrix: THREE.Matrix4 } {
  const { position, rotationY, scaleX, windowWidth, windowHeight, glassOffset } = cfg;
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0));
  const windowScale = new THREE.Vector3(scaleX, 1, 1);
  // Glass slightly forward
  const normal = new THREE.Vector3(Math.cos(rotationY), 0, Math.sin(rotationY));
  const glassOffsetVec = normal.clone().multiplyScalar(glassOffset);
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
