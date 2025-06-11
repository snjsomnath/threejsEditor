export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BuildingConfig {
  height: number;
  color: number;
  enableShadows: boolean;
}

export interface DrawingState {
  isDrawing: boolean;
  points: Point3D[];
  markers: THREE.Mesh[];
  lines: THREE.Line[];
  previewMarker: THREE.Mesh | null;
}