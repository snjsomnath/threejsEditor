import { useState, useRef, useCallback } from 'react';
import { Point3D, DrawingState } from '../types/building';
import { DrawingService } from '../services/DrawingService';
import { BuildingService } from '../services/BuildingService';
import { getGroundIntersection } from '../utils/geometry';
import * as THREE from 'three';

export const useDrawing = (
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  groundPlane: THREE.Mesh | null
) => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    markers: [],
    lines: []
  });

  const drawingServiceRef = useRef<DrawingService | null>(null);
  const buildingServiceRef = useRef<BuildingService | null>(null);

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
      lines: []
    });
  }, []);

  const stopDrawing = useCallback(() => {
    if (!drawingServiceRef.current) return;

    // Clear existing markers and lines
    drawingServiceRef.current.clearMarkers(drawingState.markers);
    drawingServiceRef.current.clearLines(drawingState.lines);

    setDrawingState({
      isDrawing: false,
      points: [],
      markers: [],
      lines: []
    });
  }, [drawingState.markers, drawingState.lines]);

  const addPoint = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!drawingState.isDrawing || !camera || !groundPlane || !drawingServiceRef.current) {
      return;
    }

    // Calculate mouse coordinates more carefully
    const rect = containerElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const mouse = new THREE.Vector2(mouseX, mouseY);
    
    console.log('Click event:', {
      clientX: event.clientX,
      clientY: event.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      mouseX,
      mouseY
    });

    // Get intersection with ground
    const intersection = getGroundIntersection(mouse, camera, groundPlane);
    if (!intersection) {
      console.log('No intersection found for click');
      return;
    }

    console.log('Adding point:', intersection);

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
  }, [drawingState.isDrawing, drawingState.points, camera, groundPlane]);

  const finishBuilding = useCallback(() => {
    if (!buildingServiceRef.current || !drawingServiceRef.current || drawingState.points.length < 3) {
      console.log('Cannot finish building:', {
        hasService: !!buildingServiceRef.current,
        hasDrawingService: !!drawingServiceRef.current,
        pointCount: drawingState.points.length
      });
      return;
    }

    try {
      console.log('Creating building with points:', drawingState.points);
      
      // Create the building
      const buildingConfig = {
        height: 8,
        color: 0x6366f1,
        enableShadows: true
      };

      buildingServiceRef.current.createBuilding(drawingState.points, buildingConfig);

      // Clear drawing state
      drawingServiceRef.current.clearMarkers(drawingState.markers);
      drawingServiceRef.current.clearLines(drawingState.lines);

      setDrawingState({
        isDrawing: false,
        points: [],
        markers: [],
        lines: []
      });
    } catch (error) {
      console.error('Error creating building:', error);
    }
  }, [drawingState]);

  return {
    drawingState,
    startDrawing,
    stopDrawing,
    addPoint,
    finishBuilding
  };
};