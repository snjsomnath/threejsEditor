import { BuildingData } from './building';

export interface DesignMetrics {
  heatingDemand: number; // kWh/m²/year
  spatialDaylightAutonomy: number; // percentage
  globalWarmingPotential: number; // kg CO2 eq/m²
}

export interface DesignNode {
  id: string;
  timestamp: Date;
  name: string;
  buildings: BuildingData[];
  metrics: DesignMetrics;
  parentId?: string;
  position?: { x: number; y: number }; // For graph layout
}

export interface DesignExplorationGraph {
  nodes: DesignNode[];
  edges: { from: string; to: string }[];
  currentNodeId?: string;
}

export interface GraphPosition {
  x: number;
  y: number;
}
