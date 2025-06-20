import { useState, useRef, useCallback, useEffect } from 'react';
import { Point3D, DrawingState, BuildingConfig, BuildingData } from '../types/building';
import { DrawingService } from '../services/DrawingService';
import { BuildingService } from '../services/BuildingService';
import { TextService } from '../services/TextService'; // Add this import
import { getGroundIntersection, calculateDistance, snapToGrid } from '../utils/geometry';
import { useBuildingManager } from './useBuildingManager';
import * as THREE from 'three';

const SNAP_DISTANCE = 2.0;
const GRID_SIZE = 1.0;
const MOUSE_MOVE_THROTTLE = 8; // Smooth preview updates

// Direct preview state management - bypassing React state for immediate updates
interface PreviewState {
  marker: THREE.Mesh | null;
  line: THREE.Line | null;
  building: THREE.Mesh | null;
  lengthLabel: THREE.Sprite | null; // Add this line
  lastPosition: Point3D | null;
  lastUpdateTime: number;
  isUpdating: boolean; // Prevent overlapping updates
}

export const useDrawing = (
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  groundPlane: THREE.Mesh | null,
  snapToGridEnabled: boolean = false,
  buildingConfig: BuildingConfig,
  addBuilding: (mesh: THREE.Mesh, points: Point3D[], floors: number, floorHeight: number) => BuildingData | undefined
) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    markers: [],  
    lines: [],
    lengthLabels: [], // Add this line
    previewMarker: null,
    previewLine: null,
    previewBuilding: null,
    previewLengthLabel: null, // Add this line
    snapToStart: false
  });

  const drawingServiceRef = useRef<DrawingService | null>(null);
  const buildingServiceRef = useRef<BuildingService | null>(null);
  const textServiceRef = useRef<TextService | null>(null); // Add this line
  const mouseRef = useRef(new THREE.Vector2());
  const { addBuilding: buildingManagerAddBuilding } = useBuildingManager(scene);
  
  // Enhanced preview state with position tracking and timing
  const previewStateRef = useRef<PreviewState>({
    marker: null,
    line: null,
    building: null,
    lengthLabel: null, // Add this line
    lastPosition: null,
    lastUpdateTime: 0,
    isUpdating: false
  });

  // Initialize services when scene is available - use useEffect for proper timing
  useEffect(() => {
    if (scene && !drawingServiceRef.current) {
      console.log('Initializing drawing services...');
      try {
        drawingServiceRef.current = new DrawingService(scene);
        buildingServiceRef.current = new BuildingService(scene);
        textServiceRef.current = new TextService(scene); // Add this line
        console.log('Drawing services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize drawing services:', error);
        // Clear refs if initialization failed
        drawingServiceRef.current = null;
        buildingServiceRef.current = null;
        textServiceRef.current = null; // Add this line
      }
    }
  }, [scene]);

  // Add a separate effect to handle groundPlane availability
  useEffect(() => {
    if (groundPlane) {
      console.log('Ground plane is now available for drawing');
    }
  }, [groundPlane]);

  // Add a validation function to ensure services are ready
  const validateServices = useCallback(() => {
    if (!scene) {
      console.warn('Scene not available for drawing');
      return false;
    }
    if (!camera) {
      console.warn('Camera not available for drawing');
      return false;
    }
    if (!groundPlane) {
      console.warn('Ground plane not available for drawing');
      return false;
    }
    if (!drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current) { // Update this line
      console.warn('Drawing services not initialized');
      return false;
    }
    return true;
  }, [scene, camera, groundPlane]);

  // Enhanced preview clearing with validation
  const clearAllPreviews = useCallback(() => {
    // Only validate scene and services for clearing - groundPlane not required for cleanup
    if (!scene || !drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current) return; // Update this line

    const preview = previewStateRef.current;
    
    // Only clear if objects exist
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
    if (preview.lengthLabel) { // Add this block
      textServiceRef.current.clearLengthLabel(preview.lengthLabel);
      preview.lengthLabel = null;
    }

    // Reset position tracking
    preview.lastPosition = null;
    preview.isUpdating = false;

    // Minimal React state update - only when actually clearing
    setDrawingState(prev => prev.previewMarker || prev.previewLine || prev.previewBuilding || prev.previewLengthLabel ? ({ // Update this line
      ...prev,
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    }) : prev);
  }, [scene]);

  const clearAllDrawingElements = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current) return; // Update this line

    // Clear all previews first
    clearAllPreviews();

    // Clear all drawing elements using the service
    drawingServiceRef.current.clearAllDrawingElements();
    
    // Clear all length labels
    setDrawingState(prev => {
      if (prev.lengthLabels.length > 0) {
        textServiceRef.current?.clearAllLabels(prev.lengthLabels);
      }
      return prev;
    });

    // Reset drawing state completely
    setDrawingState({
      isDrawing: false,
      points: [],
      markers: [],
      lines: [],
      lengthLabels: [], // Add this line
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    });
  }, [clearAllPreviews]);

  const startDrawing = useCallback(() => {
    // Clear all previews immediately
    clearAllPreviews();
    
    setDrawingState({
      isDrawing: true,
      points: [],
      markers: [],
      lines: [],
      lengthLabels: [], // Add this line
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    });
  }, [clearAllPreviews]);

  const stopDrawing = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current) return; // Update this line

    // Clear all previews first
    clearAllPreviews();

    setDrawingState(prev => {
      // Clear all existing elements from scene
      drawingServiceRef.current?.clearMarkers(prev.markers);
      drawingServiceRef.current?.clearLines(prev.lines);
      textServiceRef.current?.clearAllLabels(prev.lengthLabels); // Add this line

      return {
        isDrawing: false,
        points: [],
        markers: [],
        lines: [],
        lengthLabels: [], // Add this line
        previewMarker: null,
        previewLine: null,
        previewBuilding: null,
        previewLengthLabel: null, // Add this line
        snapToStart: false
      };
    });
  }, [clearAllPreviews]);

  const undoLastPoint = useCallback(() => {
    if (!drawingServiceRef.current || !textServiceRef.current || drawingState.points.length === 0) return; // Update this line

    // Clear previews immediately first
    clearAllPreviews();

    const newPoints = [...drawingState.points];
    const newMarkers = [...drawingState.markers];
    const newLines = [...drawingState.lines];
    const newLengthLabels = [...drawingState.lengthLabels]; // Add this line

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

    // Remove last length label
    const lastLengthLabel = newLengthLabels.pop(); // Add this block
    if (lastLengthLabel) {
      textServiceRef.current.clearLengthLabel(lastLengthLabel);
    }

    setDrawingState(prev => ({
      ...prev,
      points: newPoints,
      markers: newMarkers,
      lines: newLines,
      lengthLabels: newLengthLabels, // Add this line
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    }));
  }, [drawingState.points, drawingState.markers, drawingState.lines, drawingState.lengthLabels, clearAllPreviews]); // Update this line

  // Enhanced updatePreview with standard performance
  const updatePreview = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    // Early validation - only proceed if ALL required components are ready
    if (!validateServices()) {
      return;
    }

    const now = performance.now();
    const preview = previewStateRef.current;
    
    // Standard throttling for smooth updates
    const throttleMs = MOUSE_MOVE_THROTTLE;
    
    // Prevent overlapping updates and throttle for performance
    if (preview.isUpdating || now - preview.lastUpdateTime < throttleMs) {
      return;
    }
    
    preview.isUpdating = true;
    preview.lastUpdateTime = now;

    // Use direct animation frame for immediate response
    requestAnimationFrame(() => {
      if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current) { // Update this line
        preview.isUpdating = false;
        if (preview.marker || preview.line || preview.building || preview.lengthLabel) { // Update this line
          clearAllPreviews();
        }
        return;
      }

      try {
        // Calculate mouse coordinates
        const rect = containerElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          preview.isUpdating = false;
          return;
        }

        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Get ground intersection
        const intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
        if (!intersection) {
          preview.isUpdating = false;
          return;
        }

        // Apply snap to grid if enabled
        const snappedPosition = snapToGridEnabled ? snapToGrid(intersection, GRID_SIZE) : intersection;

        // Check for snap to start point
        const points = drawingState.points;
        let snapToStart = false;
        let snapActive = false;
        if (points.length > 2) {
          const startPoint = points[0];
          const distance = calculateDistance(snappedPosition, startPoint);
          if (distance < SNAP_DISTANCE) {
            snappedPosition.x = startPoint.x;
            snappedPosition.z = startPoint.z;
            snapToStart = true;
            snapActive = true;
          }
        }

        // Highlight first marker if snapping to start
        if (points.length > 0 && drawingState.markers.length > 0) {
          const firstMarker = drawingState.markers[0];
          const mat = firstMarker.material as THREE.MeshLambertMaterial;
          if (snapActive) {
            mat.color.setHex(0xffff00);
            mat.emissive.setHex(0xffff00);
            mat.emissiveIntensity = 0.7;
            mat.opacity = 1.0;
            mat.transparent = false;
          } else {
            // Restore to default (red)
            mat.color.setHex(0xff4444);
            mat.emissive.setHex(0xff0000);
            mat.emissiveIntensity = 0.2;
            mat.opacity = 1.0;
            mat.transparent = false;
          }
        }

        // Update preview marker
        if (!preview.marker) {
          preview.marker = drawingServiceRef.current.createPreviewMarker(snappedPosition);
        } else {
          drawingServiceRef.current.updatePreviewMarker(preview.marker, snappedPosition);
        }

        // Update preview line if we have points
        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          if (!preview.line) {
            preview.line = drawingServiceRef.current.createPreviewLine(lastPoint, snappedPosition);
          } else {
            drawingServiceRef.current.updatePreviewLine(preview.line, lastPoint, snappedPosition);
          }

          // Update preview length label
          const distance = calculateDistance(lastPoint, snappedPosition);
          const midPoint = new THREE.Vector3(
            (lastPoint.x + snappedPosition.x) / 2,
            Math.max(lastPoint.y, snappedPosition.y) + 1.5, // Slightly above the line
            (lastPoint.z + snappedPosition.z) / 2
          );
          const distanceText = textServiceRef.current.formatDistance(distance);

          if (!preview.lengthLabel) {
            preview.lengthLabel = textServiceRef.current.createLengthLabel(distanceText, midPoint);
          } else {
            textServiceRef.current.updateLengthLabel(preview.lengthLabel, distanceText, midPoint);
          }
        }

        // Update preview building
        if (points.length >= 2) {
          const buildingPoints = [...points, snappedPosition];
          if (!preview.building) {
            preview.building = buildingServiceRef.current.createPreviewBuilding(buildingPoints, buildingConfig);
          } else {
            buildingServiceRef.current.updatePreviewBuilding(preview.building, buildingPoints, buildingConfig);
          }
        }

        // Update React state for snap to start
        if (drawingState.snapToStart !== snapToStart) {
          setDrawingState(prev => ({ ...prev, snapToStart }));
        }

        preview.lastPosition = snappedPosition;
      } catch (error) {
        console.error('Error updating preview:', error);
      } finally {
        preview.isUpdating = false;
      }
    });
  }, [camera, groundPlane, drawingState.isDrawing, drawingState.points, drawingState.snapToStart, buildingConfig, snapToGridEnabled, clearAllPreviews, validateServices]);

  // Standard throttling
  const THROTTLE_MS = 8; // Standard performance for smooth updates
  // Throttled update function
  const throttledUpdatePreview = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      return (event: MouseEvent, containerElement: HTMLElement) => {
        if (timeoutId) return; // Skip if already scheduled
        
        timeoutId = setTimeout(() => {
          updatePreview(event, containerElement);
          timeoutId = null;
        }, THROTTLE_MS);
      };
    })(),
    [updatePreview]
  );

  const finishBuilding = useCallback(() => {
    if (!drawingServiceRef.current || !buildingServiceRef.current || !textServiceRef.current || !scene) return; // Update this line

    // Clear all previews first
    clearAllPreviews();

    // Only create building if we have enough points
    if (drawingState.points.length >= 3) {
      try {
        // Create the building mesh
        const buildingMesh = buildingServiceRef.current.createBuilding(drawingState.points, buildingConfig);
        
        // Ensure the mesh is properly configured for interaction
        buildingMesh.userData.interactive = true;
        buildingMesh.userData.clickable = true;
        
        // Add the building to the building manager
        const building = addBuilding(
          buildingMesh,
          drawingState.points,
          buildingConfig.floors,
          buildingConfig.floorHeight
        );

        if (!building) {
          console.error('Failed to add building to building manager');
          return;
        }

        console.log('Building created and added:', building.id);

        // IMPORTANT: Associate all current drawing elements with this building ID
        // This ensures they get cleaned up when the building is deleted
        const drawingElements = [...drawingState.markers, ...drawingState.lines, ...drawingState.lengthLabels]; // Update this line
        drawingElements.forEach(element => {
          if (element.userData) {
            element.userData.buildingId = building.id;
            element.userData.belongsToBuilding = building.id;
          }
        });

      } catch (error) {
        console.error('Error creating building:', error);
      }
    }

    // Clear all existing drawing elements from scene before resetting state
    drawingServiceRef.current.clearMarkers(drawingState.markers);
    drawingServiceRef.current.clearLines(drawingState.lines);
    textServiceRef.current.clearAllLabels(drawingState.lengthLabels); // Add this line

    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      points: [],
      markers: [],
      lines: [],
      lengthLabels: [], // Add this line
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    });
  }, [drawingState.points, drawingState.markers, drawingState.lines, drawingState.lengthLabels, buildingConfig, scene, clearAllPreviews, addBuilding]); // Update this line

  const addPoint = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!validateServices()) {
      console.warn('Cannot add point - services not ready');
      return;
    }

    if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current || !textServiceRef.current) { // Update this line
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

    // Snap to start point if close enough
    const points = drawingState.points;
    if (points.length > 2) {
      const startPoint = points[0];
      const distance = calculateDistance(intersection, startPoint);
      if (distance < SNAP_DISTANCE) {
        intersection.x = startPoint.x;
        intersection.z = startPoint.z;
        // Finish building if snapping to start
        finishBuilding();
        return;
      }
    }

    // IMMEDIATELY clear all previews before adding point
    clearAllPreviews();

    // Create point marker
    const marker = drawingServiceRef.current.createPointMarker(intersection);

    // Create line to previous point if exists
    let line: THREE.Line | null = null;
    let lengthLabel: THREE.Sprite | null = null; // Add this line
    if (drawingState.points.length > 0) {
      try {
        const previousPoint = drawingState.points[drawingState.points.length - 1];
        line = drawingServiceRef.current.createLine(previousPoint, intersection);
        
        // Create length label for the line
        const distance = calculateDistance(previousPoint, intersection);
        const midPoint = new THREE.Vector3(
          (previousPoint.x + intersection.x) / 2,
          Math.max(previousPoint.y, intersection.y) + 1.5,
          (previousPoint.z + intersection.z) / 2
        );
        const distanceText = textServiceRef.current.formatDistance(distance);
        lengthLabel = textServiceRef.current.createLengthLabel(distanceText, midPoint);
      } catch (error) {
        console.error('Error creating line:', error);
      }
    }

    setDrawingState(prev => ({
      ...prev,
      points: [...prev.points, intersection],
      markers: marker ? [...prev.markers, marker] : prev.markers,
      lines: line ? [...prev.lines, line] : prev.lines,
      lengthLabels: lengthLabel ? [...prev.lengthLabels, lengthLabel] : prev.lengthLabels, // Add this line
      previewMarker: null,
      previewLine: null,
      previewBuilding: null,
      previewLengthLabel: null, // Add this line
      snapToStart: false
    }));
  }, [drawingState.isDrawing, drawingState.points, drawingState.snapToStart, camera, groundPlane, snapToGridEnabled, finishBuilding, clearAllPreviews, validateServices]);

  // Cleanup on unmount - ensure no orphaned objects
  useEffect(() => {
    return () => {
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
    updatePreview: updatePreview, // Use standard version always
    undoLastPoint,
    clearAllDrawingElements
  };
};