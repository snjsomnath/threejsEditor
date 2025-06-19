export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BuildingConfig {
  floors: number;
  floorHeight: number;
  color: number;
  height?: number; // Computed property for BuildingService
  enableShadows?: boolean; // Optional property to enable/disable shadows
}

export interface DrawingState {
  isDrawing: boolean;
  points: Point3D[];
  markers: THREE.Mesh[];
  lines: THREE.Line[];
  lengthLabels: THREE.Sprite[]; // Add this line
  previewMarker: THREE.Mesh | null;
  previewLine: THREE.Line | null;
  previewBuilding: THREE.Mesh | null;
  previewLengthLabel: THREE.Sprite | null; // Add this line
  snapToStart: boolean;
}

export interface BuildingData {
  id: string;
  mesh: THREE.Mesh;
  points: Point3D[];
  area: number;
  floors: number;
  floorHeight: number;
  createdAt: Date;
  name?: string;
  description?: string;
  color?: number;
  footprintOutline?: THREE.Mesh | null;
}

export interface BuildingTooltipData {
  building: BuildingData;
  position: { x: number; y: number };
  visible: boolean;
}