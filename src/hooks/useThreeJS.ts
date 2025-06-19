/**
 * useThreeJS Hook
 * 
 * This custom React hook encapsulates the initialization and management of a Three.js 3D scene.
 * It handles the creation of essential Three.js components including:
 * - Scene: The container for all 3D objects
 * - Camera: Perspective camera that determines the viewpoint
 * - Renderer: WebGL renderer that draws the scene
 * - Lighting: Multiple light sources for realistic rendering
 * - Controls: Orbit controls for user interaction
 * - Ground plane and grid: For spatial reference
 * - Post-processing: Effects like ambient occlusion for visual enhancement
 * 
 * Usage:
 * const { scene, camera, renderer, isInitialized, toggleGrid } = useThreeJS(containerRef, showGrid);
 * 
 * @param containerRef - React ref to the DOM element that will contain the Three.js canvas
 * @param showGrid - Boolean to control grid visibility (default: true)
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeJSCore } from '../core/ThreeJSCore';

export const useThreeJS = (containerRef: React.RefObject<HTMLDivElement>, showGrid: boolean = true) => {
  const coreRef = useRef<ThreeJSCore | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [showFPS, setShowFPS] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);

  // Initialize Three.js core
  useEffect(() => {
    if (!containerRef.current || coreRef.current) return;
    
    let isMounted = true;
    
    const initializeCore = async () => {
      if (!containerRef.current) return;
      
      setIsInitializing(true);
      setInitializationError(null);
      
      try {
        const core = new ThreeJSCore({
          container: containerRef.current,
          performanceMode,
          enablePostProcessing: !performanceMode,
          showGrid
        });
        
        await core.initialize();
        
        if (isMounted) {
          coreRef.current = core;
          setIsInitialized(true);
        }
      } catch (error) {
        if (isMounted) {
          setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    
    initializeCore();
    
    return () => {
      isMounted = false;
      if (coreRef.current) {
        coreRef.current.dispose();
        coreRef.current = null;
      }
    };
  }, [containerRef, performanceMode, showGrid]);

  // Update grid visibility
  useEffect(() => {
    if (coreRef.current) {
      coreRef.current.toggleGrid();
    }
  }, [showGrid]);

  const toggleGrid = useCallback(() => {
    if (coreRef.current) {
      coreRef.current.toggleGrid();
    }
  }, []);

  const toggleFPSCounter = useCallback(() => {
    setShowFPS(prev => {
      const newValue = !prev;
      if (coreRef.current) {
        coreRef.current.toggleFPSCounter();
      }
      return newValue;
    });
  }, []);

  const togglePerformanceMode = useCallback(() => {
    setPerformanceMode(prev => !prev);
    // Note: This would require reinitializing the core for full effect
  }, []);

  const retryInitialization = useCallback(() => {
    if (coreRef.current) {
      coreRef.current.dispose();
      coreRef.current = null;
    }
    setIsInitialized(false);
    setInitializationError(null);
    // The useEffect will reinitialize automatically
  }, []);

  return {
    scene: coreRef.current?.getScene() || null,
    camera: coreRef.current?.getCamera() || null,
    renderer: coreRef.current?.getRenderer() || null,
    groundPlane: coreRef.current?.getGroundPlane() || null,
    isInitialized,
    isInitializing,
    initializationError,
    showFPS,
    performanceMode,
    toggleGrid,
    toggleFPSCounter,
    togglePerformanceMode,
    retryInitialization,
    debugHelpers: {
      toggleShadowHelper: () => {},
      toggleShadowQuality: () => {},
      enablePerformanceMonitoring: () => {}
    }
  };
};