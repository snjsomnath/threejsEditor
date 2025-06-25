import * as THREE from 'three';

export class WindowAnimationManager {
  private animatingBuildings = new Set<string>();
  private animationFrameId: number | null = null;

  animateWindowTransition(
    buildingId: string,
    indices: number[],
    glassInstancedMesh: THREE.InstancedMesh,
    frameInstancedMesh: THREE.InstancedMesh,
    targetData: Array<{ glassMatrix: THREE.Matrix4; frameMatrix: THREE.Matrix4 }>,
    duration: number,
    onFinish?: () => void
  ) {
    const startTime = performance.now();
    const startMatrices = indices.map(() => ({
      glass: new THREE.Matrix4(),
      frame: new THREE.Matrix4(),
    }));
    indices.forEach((index, i) => {
      glassInstancedMesh.getMatrixAt(index, startMatrices[i].glass);
      frameInstancedMesh.getMatrixAt(index, startMatrices[i].frame);
    });
    this.animatingBuildings.add(buildingId);
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      indices.forEach((index, i) => {
        const startGlass = startMatrices[i].glass;
        const startFrame = startMatrices[i].frame;
        const targetGlass = targetData[i].glassMatrix;
        const targetFrame = targetData[i].frameMatrix;
        const startGlassPos = new THREE.Vector3();
        const startGlassQuat = new THREE.Quaternion();
        const startGlassScale = new THREE.Vector3();
        startGlass.decompose(startGlassPos, startGlassQuat, startGlassScale);
        const startFramePos = new THREE.Vector3();
        const startFrameQuat = new THREE.Quaternion();
        const startFrameScale = new THREE.Vector3();
        startFrame.decompose(startFramePos, startFrameQuat, startFrameScale);
        const targetGlassPos = new THREE.Vector3();
        const targetGlassQuat = new THREE.Quaternion();
        const targetGlassScale = new THREE.Vector3();
        targetGlass.decompose(targetGlassPos, targetGlassQuat, targetGlassScale);
        const targetFramePos = new THREE.Vector3();
        const targetFrameQuat = new THREE.Quaternion();
        const targetFrameScale = new THREE.Vector3();
        targetFrame.decompose(targetFramePos, targetFrameQuat, targetFrameScale);
        const currentGlassPos = startGlassPos.clone().lerp(targetGlassPos, eased);
        const currentGlassQuat = startGlassQuat.clone().slerp(targetGlassQuat, eased);
        const currentGlassScale = startGlassScale.clone().lerp(targetGlassScale, eased);
        const currentFramePos = startFramePos.clone().lerp(targetFramePos, eased);
        const currentFrameQuat = startFrameQuat.clone().slerp(targetFrameQuat, eased);
        const currentFrameScale = startFrameScale.clone().lerp(targetFrameScale, eased);
        const currentGlass = new THREE.Matrix4().compose(currentGlassPos, currentGlassQuat, currentGlassScale);
        const currentFrame = new THREE.Matrix4().compose(currentFramePos, currentFrameQuat, currentFrameScale);
        glassInstancedMesh.setMatrixAt(index, currentGlass);
        frameInstancedMesh.setMatrixAt(index, currentFrame);
      });
      glassInstancedMesh.instanceMatrix.needsUpdate = true;
      frameInstancedMesh.instanceMatrix.needsUpdate = true;
      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animatingBuildings.delete(buildingId);
        if (this.animatingBuildings.size === 0) {
          this.animationFrameId = null;
        }
        if (onFinish) onFinish();
      }
    };
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(animate);
    }
  }

  cancelBuildingAnimation(buildingId: string) {
    if (this.animatingBuildings.has(buildingId)) {
      this.animatingBuildings.delete(buildingId);
      if (this.animatingBuildings.size === 0 && this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animatingBuildings.clear();
  }
}
