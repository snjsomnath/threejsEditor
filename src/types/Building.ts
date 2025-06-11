export interface Point2D {
  x: number;
  z: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Building {
  id: string;
  name: string;
  points: Point2D[];
  height: number;
  position: Point3D;
  color: string;
  selected: boolean;
  mesh?: THREE.Mesh;
  edges?: THREE.LineSegments;
  controlPoints?: THREE.Mesh[];
  heightHandle?: THREE.Mesh;
}

export interface DrawingState {
  isDrawing: boolean;
  currentPoints: Point2D[];
  previewLines?: THREE.Line[];
}

export interface AppState {
  mode: 'view' | 'draw' | 'edit';
  buildings: Building[];
  selectedBuildingId: string | null;
  drawingState: DrawingState;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface ExportFormat {
  json: () => string;
  gltf: () => Blob;
  obj: () => string;
}