import { useState, useRef, useCallback, useEffect } from 'react';
import { Point3D, DrawingState, BuildingConfig } from '../types/building';
import { DrawingService } from '../services/DrawingService';
import { BuildingService } from '../services/BuildingService';
import { getGroundIntersection, calculateDistance, snapToGrid } from '../utils/geometry';
import { useBuildingManager } from './useBuildingManager';
import * as THREE from 'three';

const SNAP_DISTANCE = 2.0;
const GRID_SIZE = 1.0;

// Direct preview state management - bypassing React state for immediate updates
interface PreviewState {
  marker: THREE.Mesh | null;
  line: THREE.Line | null;
  building: THREE.Mesh | null;
}

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
  const updatePreviewDebounceRef = useRef<number | null>(null);
  
  // Direct preview state - not managed by React for immediate updates
  const previewStateRef = useRef<PreviewState>({
    marker: null,
    line: null,
    building: null
  });

  // Initialize services when scene is available - use useEffect for proper timing
  useEffect(() => {
    if (scene && !drawingServiceRef.current) {
      console.log('Initializing drawing services...');
      drawingServiceRef.current = new DrawingService(scene);
      buildingServiceRef.current = new BuildingService(scene);
      console.log('Drawing services initialized');
    }
  }, [scene]);

  // Professional preview clearing - immediate and guaranteed
  const clearAllPreviews = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current) return;

    const preview = previewStateRef.current;
    
    // Clear from scene immediately
    if (preview.marker) {
      drawingServiceRef.current.clearPreviewMarker(preview.marker);
      preview.marker = null;
    }
    if (preview.line) {
      drawingServiceRef.current.clearPreviewLine(preview.line);
      preview.line = null;
    }
    if (preview.building) {
      buildingServiceRef.current.clearPreviewBuilding(preview.building);
      preview.building = null;
    }

    // Update React state to keep it in sync (but don't depend on it for clearing)
    setDrawingState(prev => ({
      ...prev,
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      snapToStart: false
    }));
  }, []);

  const startDrawing = useCallback(() => {
    // Clear all previews immediately
    clearAllPreviews();
    
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
  }, [clearAllPreviews]);

  const stopDrawing = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current) return;

    // Clear all previews first
    clearAllPreviews();

    setDrawingState(prev => {
      // Clear all existing elements from scene
      drawingServiceRef.current?.clearMarkers(prev.markers);
      drawingServiceRef.current?.clearLines(prev.lines);

      return {
        isDrawing: false,
        points: [],
        markers: [],
        lines: [],
        previewMarker: null,
        previewLine: null,
        previewBuilding: null,
        snapToStart: false
      };
    });
  }, [clearAllPreviews]);

  const undoLastPoint = useCallback(() => {
    if (!drawingServiceRef.current || drawingState.points.length === 0) return;

    // Clear previews immediately first
    clearAllPreviews();

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

    setDrawingState(prev => ({
      ...prev,
      points: newPoints,
      markers: newMarkers,
      lines: newLines,
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      snapToStart: false
    }));
  }, [drawingState.points, drawingState.markers, drawingState.lines, clearAllPreviews]);

  const updatePreview = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    // Cancel any pending updates
    if (updatePreviewDebounceRef.current) {
      cancelAnimationFrame(updatePreviewDebounceRef.current);
    }
    
    updatePreviewDebounceRef.current = requestAnimationFrame(() => {
      if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current || !buildingServiceRef.current) {
        clearAllPreviews();
        return;
      }

      // Calculate mouse coordinates
      const rect = containerElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        clearAllPreviews();
        return;
      }

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Get intersection with ground
      let intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
      
      if (!intersection) {
        clearAllPreviews();
        return;
      }

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

      // CRITICAL: Clear all existing previews BEFORE creating new ones
      clearAllPreviews();

      // Create new preview elements and store them directly
      const preview = previewStateRef.current;
      
      try {
        // Create preview marker
        preview.marker = shouldSnapToStart 
          ? drawingServiceRef.current.createSnapPreviewMarker(finalPosition)
          : drawingServiceRef.current.createPreviewMarker(finalPosition);

        // Create preview line to last point
        if (drawingState.points.length > 0) {
          const lastPoint = drawingState.points[drawingState.points.length - 1];
          preview.line = drawingServiceRef.current.createPreviewLine(lastPoint, finalPosition);
        }

        // Create preview building
        if (drawingState.points.length >= 2) {
          const previewPoints = shouldSnapToStart 
            ? [...drawingState.points]
            : [...drawingState.points, finalPosition];
            
          if (previewPoints.length >= 3) {
            preview.building = buildingServiceRef.current.createPreviewBuilding(previewPoints, buildingConfig);
          }
        }

        // Update React state for UI consistency (but don't depend on it for rendering)
        setDrawingState(prev => ({
          ...prev,
          previewMarker: preview.marker,
          previewLine: preview.line,
          previewBuilding: preview.building,
          snapToStart: shouldSnapToStart
        }));

      } catch (error) {
        console.error('Error creating preview elements:', error);
        clearAllPreviews();
      }
    });
  }, [drawingState.isDrawing, drawingState.points, camera, groundPlane, snapToGridEnabled, buildingConfig, clearAllPreviews]);

  const finishBuilding = useCallback(() => {
    if (!buildingServiceRef.current || !drawingServiceRef.current || drawingState.points.length < 3) {
      console.log('Cannot finish building - insufficient conditions');
      return;
    }

    try {
      console.log('Finishing building with points:', drawingState.points);
      
      // Clear ALL previews immediately - this is critical
      clearAllPreviews();

      // Create the building with current configuration
      const buildingMesh = buildingServiceRef.current.createBuilding(drawingState.points, buildingConfig);
      
      // Add to building manager
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
      
      console.log('Building finished successfully');
    } catch (error) {
      console.error('Error creating building:', error);
    }
  }, [drawingState.points, drawingState.markers, drawingState.lines, buildingConfig, addBuilding, clearAllPreviews]);

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
    
    if (!intersection) {
      return;
    }

    // Apply grid snapping if enabled
    if (snapToGridEnabled) {
      intersection = snapToGrid(intersection, GRID_SIZE);
    }

    // IMMEDIATELY clear all previews before adding point
    clearAllPreviews();

    // Create point marker
    const marker = drawingServiceRef.current.createPointMarker(intersection);

    // Create line to previous point if exists
    let line: THREE.Line | null = null;
    if (drawingState.points.length > 0) {
      try {
        const previousPoint = drawingState.points[drawingState.points.length - 1];
        line = drawingServiceRef.current.createLine(previousPoint, intersection);
      } catch (error) {
        console.error('Error creating line:', error);
      }
    }

    setDrawingState(prev => ({
      ...prev,
      points: [...prev.points, intersection],
      markers: marker ? [...prev.markers, marker] : prev.markers,
      lines: line ? [...prev.lines, line] : prev.lines,
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      snapToStart: false
    }));
  }, [drawingState.isDrawing, drawingState.points, drawingState.snapToStart, camera, groundPlane, snapToGridEnabled, finishBuilding, clearAllPreviews]);

  // Cleanup on unmount - ensure no orphaned objects
  useEffect(() => {
    return () => {
      if (updatePreviewDebounceRef.current) {
        cancelAnimationFrame(updatePreviewDebounceRef.current);
      }
      
      // Final cleanup of all previews
      clearAllPreviews();
    };
  }, [clearAllPreviews]);

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