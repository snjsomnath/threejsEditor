import { useState, useRef, useCallback } from 'react';
import { Point3D, DrawingState } from '../types/building';
import { DrawingService } from '../services/DrawingService';
import { BuildingService } from '../services/BuildingService';
import { getGroundIntersection, calculateDistance } from '../utils/geometry';
import { useBuildingManager } from './useBuildingManager';
import * as THREE from 'three';

const SNAP_DISTANCE = 2.0; // Distance threshold for snapping to start point

export const useDrawing = (
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  groundPlane: THREE.Mesh | null
) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    markers: [],
    lines: [],
    previewMarker: null,
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

  const startDrawing = useCallback(() => {
    setDrawingState({
      isDrawing: true,
      points: [],
      markers: [],
      lines: [],
      previewMarker: null,
      snapToStart: false
    });
  }, []);

  const stopDrawing = useCallback(() => {
    if (!drawingServiceRef.current) return;

    // Clear existing markers, lines, and preview
    drawingServiceRef.current.clearMarkers(drawingState.markers);
    drawingServiceRef.current.clearLines(drawingState.lines);
    if (drawingState.previewMarker) {
      drawingServiceRef.current.clearPreviewMarker(drawingState.previewMarker);
    }

    setDrawingState({
      isDrawing: false,
      points: [],
      markers: [],
      lines: [],
      previewMarker: null,
      snapToStart: false
    });
  }, [drawingState.markers, drawingState.lines, drawingState.previewMarker]);

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

    setDrawingState(prev => ({
      ...prev,
      points: newPoints,
      markers: newMarkers,
      lines: newLines
    }));
  }, [drawingState.points, drawingState.markers, drawingState.lines]);

  const updatePreview = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current) {
      return;
    }

    // Calculate mouse coordinates
    const rect = containerElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Get intersection with ground
    const intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
    if (!intersection) return;

    // Check for snapping to start point (need at least 3 points)
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

    // Remove existing preview marker
    if (drawingState.previewMarker) {
      drawingServiceRef.current.clearPreviewMarker(drawingState.previewMarker);
    }

    // Create new preview marker with appropriate style
    const previewMarker = shouldSnapToStart 
      ? drawingServiceRef.current.createSnapPreviewMarker(finalPosition)
      : drawingServiceRef.current.createPreviewMarker(finalPosition);

    setDrawingState(prev => ({
      ...prev,
      previewMarker,
      snapToStart: shouldSnapToStart
    }));
  }, [drawingState.isDrawing, drawingState.previewMarker, drawingState.points, camera, groundPlane]);

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
    const intersection = getGroundIntersection(mouseRef.current, camera, groundPlane);
    if (!intersection) return;

    // Create point marker
    const marker = drawingServiceRef.current.createPointMarker(intersection);

    // Create line to previous point if exists
    let line: THREE.Line | null = null;
    if (drawingState.points.length > 0) {
      const previousPoint = drawingState.points[drawingState.points.length - 1];
      line = drawingServiceRef.current.createLine(previousPoint, intersection);
    }

    // Update state
    setDrawingState(prev => ({
      ...prev,
      points: [...prev.points, intersection],
      markers: [...prev.markers, marker],
      lines: line ? [...prev.lines, line] : prev.lines
    }));
  }, [drawingState.isDrawing, drawingState.points, drawingState.snapToStart, camera, groundPlane]);

  const finishBuilding = useCallback(() => {
    if (!buildingServiceRef.current || !drawingServiceRef.current || drawingState.points.length < 3) {
      return;
    }

    try {
      // Create the building with random color variation
      const colors = [0x6366f1, 0x8b5cf6, 0x06b6d4, 0x10b981, 0xf59e0b, 0xef4444];
      const buildingConfig = {
        height: 6 + Math.random() * 8, // Random height between 6-14
        color: colors[Math.floor(Math.random() * colors.length)],
        enableShadows: true
      };

      const buildingMesh = buildingServiceRef.current.createBuilding(drawingState.points, buildingConfig);
      
      // Add to building manager
      addBuilding(buildingMesh, drawingState.points);

      // Clear drawing state
      drawingServiceRef.current.clearMarkers(drawingState.markers);
      drawingServiceRef.current.clearLines(drawingState.lines);
      if (drawingState.previewMarker) {
        drawingServiceRef.current.clearPreviewMarker(drawingState.previewMarker);
      }

      setDrawingState({
        isDrawing: false,
        points: [],
        markers: [],
        lines: [],
        previewMarker: null,
        snapToStart: false
      });
    } catch (error) {
      console.error('Error creating building:', error);
    }
  }, [drawingState, addBuilding]);

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