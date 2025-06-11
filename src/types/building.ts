export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BuildingConfig {
  floors: number;
  floorHeight: number;
  color: number;
  enableShadows: boolean;
  buildingType: 'residential' | 'commercial' | 'industrial';
}

export interface DrawingState {
  isDrawing: boolean;
  points: Point3D[];
  markers: THREE.Mesh[];
  lines: THREE.Line[];
  previewMarker: THREE.Mesh | null;
  previewLine: THREE.Line | null;
  snapToStart: boolean;
}

export interface BuildingData {
  id: string;
  mesh: THREE.Mesh;
  points: Point3D[];
  area: number;
  floors: number;
  floorHeight: number;
  buildingType: string;
  createdAt: Date;
}