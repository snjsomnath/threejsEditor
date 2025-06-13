import { useState, useRef, useCallback } from 'react';
import { Point3D, DrawingState, BuildingConfig } from '../types/building';
import { DrawingService } from '../services/DrawingService';
import { BuildingService } from '../services/BuildingService';
import { getGroundIntersection, calculateDistance, snapToGrid } from '../utils/geometry';
import { useBuildingManager } from './useBuildingManager';
import * as THREE from 'three';

const SNAP_DISTANCE = 2.0;
const GRID_SIZE = 1.0;

export const useDrawing = (
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  groundPlane: THREE.Mesh | null,
  snapToGridEnabled: boolean = false,
  buildingConfig: BuildingConfig
) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    markers: [],
    lines: [],
    previewMarker: null,
    previewLine: null,
    previewBuilding: null,
    snapToStart: false
  });

  const drawingServiceRef = useRef<DrawingService | null>(null);
  const buildingServiceRef = useRef<BuildingService | null>(null);
  const mouseRef = useRef(new THREE.Vector2());
  const { addBuilding } = useBuildingManager(scene);

  // Initialize services when scene is available
  if (scene && !drawingServiceRef.current) {
    drawingServiceRef.current = new DrawingService(scene);
    buildingServiceRef.current = new BuildingService(scene);
  }

  const clearPreviewElements = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current) return;

    // Use the current state directly instead of depending on state values
    setDrawingState(prev => {
      if (prev.previewMarker) {
        drawingServiceRef.current?.clearPreviewMarker(prev.previewMarker);
      }
      if (prev.previewLine) {
        drawingServiceRef.current?.clearPreviewLine(prev.previewLine);
      }
      if (prev.previewBuilding) {
        buildingServiceRef.current?.clearPreviewBuilding(prev.previewBuilding);
      }
      
      return {
        ...prev,
        previewMarker: null,
        previewLine: null,
        previewBuilding: null
      };
    });
  }, []); // Remove dependencies to prevent infinite loops

  const startDrawing = useCallback(() => {
    // Clear any existing preview elements first
    clearPreviewElements();
    
    setDrawingState({
      isDrawing: true,
      points: [],
      markers: [],
      lines: [],
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      snapToStart: false
    });
  }, [clearPreviewElements]);

  const stopDrawing = useCallback(() => {
    if (!drawingServiceRef.current) return;

    // Clear all drawing elements
    drawingServiceRef.current.clearMarkers(drawingState.markers);
    drawingServiceRef.current.clearLines(drawingState.lines);
    clearPreviewElements();

    setDrawingState({
      isDrawing: false,
      points: [],
      markers: [],
      lines: [],
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      snapToStart: false
    });
  }, [drawingState, clearPreviewElements]);

  const undoLastPoint = useCallback(() => {
    if (!drawingServiceRef.current || drawingState.points.length === 0) return;

    const newPoints = [...drawingState.points];
    const newMarkers = [...drawingState.markers];
    const newLines = [...drawingState.lines];

    // Remove last point
    newPoints.pop();
    
    // Remove last marker
    const lastMarker = newMarkers.pop();
    if (lastMarker) {
      drawingServiceRef.current.clearMarkers([lastMarker]);
    }

    // Remove last line
    const lastLine = newLines.pop();
    if (lastLine) {
      drawingServiceRef.current.clearLines([lastLine]);
    }

    // Clear preview elements to avoid stale previews
    clearPreviewElements();

    setDrawingState(prev => ({
      ...prev,
      points: newPoints,
      markers: newMarkers,
      lines: newLines,
      previewMarker: null,
      previewLine: null,
      snapToStart: false
    }));
  }, [drawingState, clearPreviewElements]);

  const updatePreview = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current || !buildingServiceRef.current) {
      return;
    }

    // Calculate mouse coordinates
    const rect = containerElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Get intersection with ground
    let intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
    if (!intersection) return;

    // Apply grid snapping if enabled
    if (snapToGridEnabled) {
      intersection = snapToGrid(intersection, GRID_SIZE);
    }

    // Check for snapping to start point
    let finalPosition = intersection;
    let shouldSnapToStart = false;

    if (drawingState.points.length >= 3) {
      const startPoint = drawingState.points[0];
      const distanceToStart = calculateDistance(intersection, startPoint);
      
      if (distanceToStart <= SNAP_DISTANCE) {
        finalPosition = startPoint;
        shouldSnapToStart = true;
      }
    }

    // Update state with new preview elements - clear and create in one action
    setDrawingState(prev => {
      // Clear existing preview elements
      if (prev.previewMarker) {
        drawingServiceRef.current?.clearPreviewMarker(prev.previewMarker);
      }
      if (prev.previewLine) {
        drawingServiceRef.current?.clearPreviewLine(prev.previewLine);
      }
      if (prev.previewBuilding) {
        buildingServiceRef.current?.clearPreviewBuilding(prev.previewBuilding);
      }

      // Create new preview marker
      const previewMarker = shouldSnapToStart 
        ? drawingServiceRef.current?.createSnapPreviewMarker(finalPosition)
        : drawingServiceRef.current?.createPreviewMarker(finalPosition);

      // Create preview line to last point if exists
      let previewLine: THREE.Line | null = null;
      if (prev.points.length > 0) {
        const lastPoint = prev.points[prev.points.length - 1];
        previewLine = drawingServiceRef.current?.createPreviewLine(lastPoint, finalPosition) || null;
      }

      // Create preview building if we have enough points
      let previewBuilding: THREE.Mesh | null = null;
      if (prev.points.length >= 2) {
        try {
          const previewPoints = shouldSnapToStart 
            ? [...prev.points] // Complete shape when snapping to start
            : [...prev.points, finalPosition]; // Include current mouse position
            
          if (previewPoints.length >= 3) {
            previewBuilding = buildingServiceRef.current?.createPreviewBuilding(previewPoints, buildingConfig) || null;
          }
        } catch (error) {
          // Ignore errors for invalid shapes during preview
          console.debug('Preview building creation failed:', error);
        }
      }

      return {
        ...prev,
        previewMarker: previewMarker || null,
        previewLine,
        previewBuilding,
        snapToStart: shouldSnapToStart
      };
    });
  }, [drawingState.isDrawing, drawingState.points.length, camera, groundPlane, snapToGridEnabled, buildingConfig]);

  const addPoint = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current) {
      return;
    }

    // If we're snapping to start and have enough points, finish the building
    if (drawingState.snapToStart && drawingState.points.length >= 3) {
      finishBuilding();
      return;
    }

    // Calculate mouse coordinates
    const rect = containerElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Get intersection with ground
    let intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
    if (!intersection) return;

    // Apply grid snapping if enabled
    if (snapToGridEnabled) {
      intersection = snapToGrid(intersection, GRID_SIZE);
    }

    // Update state - clear preview elements and add new point
    setDrawingState(prev => {
      // Clear preview elements
      if (prev.previewMarker) {
        drawingServiceRef.current?.clearPreviewMarker(prev.previewMarker);
      }
      if (prev.previewLine) {
        drawingServiceRef.current?.clearPreviewLine(prev.previewLine);
      }
      if (prev.previewBuilding) {
        buildingServiceRef.current?.clearPreviewBuilding(prev.previewBuilding);
      }

      // Create point marker
      const marker = drawingServiceRef.current?.createPointMarker(intersection);

      // Create line to previous point if exists
      let line: THREE.Line | null = null;
      if (prev.points.length > 0) {
        const previousPoint = prev.points[prev.points.length - 1];
        line = drawingServiceRef.current?.createLine(previousPoint, intersection) || null;
      }

      return {
        ...prev,
        points: [...prev.points, intersection],
        markers: marker ? [...prev.markers, marker] : prev.markers,
        lines: line ? [...prev.lines, line] : prev.lines,
        previewMarker: null,
        previewLine: null,
        previewBuilding: null,
        snapToStart: false
      };
    });
  }, [drawingState.isDrawing, drawingState.points.length, drawingState.snapToStart, camera, groundPlane, snapToGridEnabled]);

  const finishBuilding = useCallback(() => {
    if (!buildingServiceRef.current || !drawingServiceRef.current || drawingState.points.length < 3) {
      return;
    }

    try {
      // Clear preview elements immediately
      clearPreviewElements();

      // Create the building with current configuration
      const buildingMesh = buildingServiceRef.current.createBuilding(drawingState.points, buildingConfig);
      
      // Add to building manager with detailed info
      addBuilding(
        buildingMesh, 
        drawingState.points, 
        buildingConfig.floors, 
        buildingConfig.floorHeight,
        buildingConfig.buildingType
      );

      // Clear all drawing elements
      drawingServiceRef.current.clearMarkers(drawingState.markers);
      drawingServiceRef.current.clearLines(drawingState.lines);

      setDrawingState({
        isDrawing: false,
        points: [],
        markers: [],
        lines: [],
        previewMarker: null,
        previewLine: null,
        previewBuilding: null,
        snapToStart: false
      });
    } catch (error) {
      console.error('Error creating building:', error);
    }
  }, [drawingState, buildingConfig, addBuilding, clearPreviewElements]);

  return {
    drawingState,
    startDrawing,
    stopDrawing,
    addPoint,
    finishBuilding,
    updatePreview,
    undoLastPoint
  };
};