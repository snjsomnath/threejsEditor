import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Point3D, BuildingData, BuildingConfig, BuildingTooltipData } from '../types/building';
import { createShapeFromPoints, calculateCentroid } from '../utils/geometry';
import { getThemeColorAsHex } from '../utils/themeColors';

interface BuildingStats {
  count: number;
  totalArea: number;
  totalFloors: number;
}

export const useBuildingManager = (scene: THREE.Scene | null, camera: THREE.PerspectiveCamera | null) => {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingData | null>(null);
  const [buildingTooltip, setBuildingTooltip] = useState<BuildingTooltipData | null>(null);
  const buildingIdCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const buildingsRef = useRef<BuildingData[]>([]);
  // Keep buildingsRef in sync with buildings state
  useEffect(() => {
    buildingsRef.current = buildings;
    console.log('Buildings updated:', buildings.map(b => b.id));
  }, [buildings]);

  // Handle window resize for Line2 materials
  useEffect(() => {
    const handleResize = () => {
      if (!scene) return;
      
      // Update resolution for all Line2 materials in floor lines
      scene.traverse((child) => {
        if (child instanceof Line2 && child.userData.isFloorLine) {
          const material = child.material as LineMaterial;
          material.resolution.set(window.innerWidth, window.innerHeight);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scene]);

  const createFootprintOutline = (points: Point3D[], scene: THREE.Scene): THREE.Mesh => {
    // Create a thin plane geometry that follows the building footprint
    const shape = new THREE.Shape();
    
    if (points.length > 0) {
      // Use points in original order with corrected coordinate mapping
      // Since we rotate the mesh by -PI/2 around X, we need to map coordinates correctly
      shape.moveTo(points[0].x, -points[0].z); // Negate Z to correct for rotation
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, -points[i].z); // Negate Z to correct for rotation
      }
      shape.lineTo(points[0].x, -points[0].z); // Close the shape
    }

    const geometry = new THREE.ShapeGeometry(shape);    const material = new THREE.MeshBasicMaterial({ 
      color: getThemeColorAsHex('--color-building-footprint', 0x00ffaa),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const footprint = new THREE.Mesh(geometry, material);
    footprint.rotation.x = -Math.PI / 2; // Lay flat on ground
    footprint.position.y = 0.05; // Slightly above ground
    footprint.visible = true;
    footprint.frustumCulled = false;
    
    scene.add(footprint);
    return footprint;
  };

  const createFloorLines = (points: Point3D[], floors: number, floorHeight: number, scene: THREE.Scene, buildingId: string): THREE.Group => {
    const floorGroup = new THREE.Group();
    floorGroup.userData = { buildingId, isFloorLines: true };    // Create lines for each floor level (starting from floor 1, not ground level)
    for (let floor = 1; floor < floors; floor++) {
      const yPosition = floor * floorHeight; // Floor lines at exact floor height
        // Create line geometry from building footprint points with slight inset to avoid z-fighting with facades
      const linePoints: THREE.Vector3[] = [];
      const insetDistance = -0.05; // Small inset to move lines away from building walls
      
      // Calculate centroid to determine inset direction
      const centroid = { x: 0, z: 0 };
      points.forEach(point => {
        centroid.x += point.x;
        centroid.z += point.z;
      });
      centroid.x /= points.length;
      centroid.z /= points.length;
      
      points.forEach(point => {
        // Calculate direction from point to centroid (inward direction)
        const dirX = centroid.x - point.x;
        const dirZ = centroid.z - point.z;
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // Normalize and apply inset
        const normalizedX = length > 0 ? dirX / length : 0;
        const normalizedZ = length > 0 ? dirZ / length : 0;
        
        const insetX = point.x + normalizedX * insetDistance;
        const insetZ = point.z + normalizedZ * insetDistance;
        
        linePoints.push(new THREE.Vector3(insetX, yPosition, insetZ));
      });
      // Close the line by adding the first point again (with same inset calculation)
      const firstPoint = points[0];
      const dirX = centroid.x - firstPoint.x;
      const dirZ = centroid.z - firstPoint.z;
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
      const normalizedX = length > 0 ? dirX / length : 0;
      const normalizedZ = length > 0 ? dirZ / length : 0;
      const insetX = firstPoint.x + normalizedX * insetDistance;
      const insetZ = firstPoint.z + normalizedZ * insetDistance;      linePoints.push(new THREE.Vector3(insetX, yPosition, insetZ));

      // Create thick line using Line2 for guaranteed width support
      const lineGeometry = new LineGeometry();
      const positions: number[] = [];
      
      // Convert Vector3 points to flat array of numbers
      linePoints.forEach(point => {
        positions.push(point.x, point.y, point.z);
      });
      
      lineGeometry.setPositions(positions);
      
      const lineMaterial = new LineMaterial({
        color: getThemeColorAsHex('--color-floor-lines', 0x888888),
        linewidth: 4, // This works reliably with Line2
        transparent: true,
        opacity: 0.9,
        depthWrite: true,
        depthTest: true
      });
      
      // Set resolution for the material (required for Line2)
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      const floorLine = new Line2(lineGeometry, lineMaterial);
      floorLine.userData = { buildingId, isFloorLine: true, floor };
      floorGroup.add(floorLine);
    }

    scene.add(floorGroup);
    return floorGroup;
  };

  const addBuilding = useCallback((mesh: THREE.Mesh, points: Point3D[], floors: number, floorHeight: number) => {
    if (!scene) return;

    const area = calculatePolygonArea(points);
    const buildingId = `building_${++buildingIdCounter.current}`;
    
    // CRITICAL: Ensure proper userData configuration for raycasting
    mesh.userData = { 
      buildingId, 
      interactive: true, 
      clickable: true, 
      type: 'building',
      isBuilding: true // Add this flag
    };
    
    // Ensure mesh is properly configured for raycasting
    mesh.visible = true;
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = true;
    mesh.updateMatrix();
    mesh.updateMatrixWorld(true);
    
    // Ensure material is properly set up for interaction
    if (mesh.material) {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.depthTest = true;
      material.transparent = false;
      material.side = THREE.FrontSide;
      material.needsUpdate = true;
    }

    const building: BuildingData = {
      id: buildingId,
      mesh,
      points,
      area,
      floors,
      floorHeight,
      createdAt: new Date(),
      name: `Building ${buildingIdCounter.current}`, // Give unique default names
      description: '',
      color: (mesh.material as THREE.MeshLambertMaterial).color.getHex(),
      footprintOutline: null,
      floorLines: null
    };

    // Create footprint outline for selection with proper userData
    building.footprintOutline = createFootprintOutline(points, scene);
    building.footprintOutline.userData = { 
      buildingId, 
      isFootprint: true, 
      interactive: true,
      parentBuildingId: buildingId // Add parent reference
    };
    building.footprintOutline.visible = true;
    building.footprintOutline.frustumCulled = false;
    building.footprintOutline.matrixAutoUpdate = true;
    building.footprintOutline.updateMatrix();
    building.footprintOutline.updateMatrixWorld(true);

    // Create floor lines if building has more than 1 floor
    if (floors > 1) {
      building.floorLines = createFloorLines(points, floors, floorHeight, scene, buildingId);
    }

    // Ensure mesh is added to the scene and properly positioned
    if (!scene.children.includes(mesh)) {
      scene.add(mesh);
    }
    
    // Force scene update to ensure all matrices are current
    scene.updateMatrixWorld(true);

    // Debug: confirm mesh is in scene with proper configuration
    console.log('Adding building to scene:', {
      id: building.id,
      meshUuid: mesh.uuid,
      meshVisible: mesh.visible,
      meshPosition: mesh.position,
      meshUserData: mesh.userData,
      footprintUuid: building.footprintOutline.uuid,
      footprintVisible: building.footprintOutline.visible,
      footprintUserData: building.footprintOutline.userData,
      floorLines: building.floorLines?.uuid,
      sceneChildren: scene.children.length,
      meshInScene: scene.children.includes(mesh),
      footprintInScene: scene.children.includes(building.footprintOutline)
    });

    // Update both state and ref synchronously
    const newBuildings = [...buildingsRef.current, building];
    buildingsRef.current = newBuildings;
    setBuildings(newBuildings);

    // Verify building was added
    console.log('Building added successfully:', {
      id: building.id,
      totalBuildings: newBuildings.length,
      buildingIds: newBuildings.map(b => b.id)
    });

    return building;
  }, [scene]);

  const updateBuilding = useCallback((id: string, updates: Partial<BuildingData> & { config?: BuildingConfig }) => {
    if (!scene) return;

    setBuildings(prev => prev.map(building => {
      if (building.id !== id) return building;

      const updatedBuilding = { ...building, ...updates };
      
      // If config is provided, update the 3D mesh
      if (updates.config) {
        const config = updates.config;
        
        // Always update material color immediately for responsive feedback
        const material = building.mesh.material as THREE.MeshLambertMaterial;
        material.color.setHex(config.color);
        
        // Update geometry if height changed
        const newHeight = config.floors * config.floorHeight;
        const currentHeight = building.floors * building.floorHeight;
        
        if (newHeight !== currentHeight || config.floors !== building.floors || config.floorHeight !== building.floorHeight) {
          // Remove old mesh
          scene.remove(building.mesh);
          building.mesh.geometry.dispose();
          
          // Remove old floor lines
          if (building.floorLines) {
            scene.remove(building.floorLines);
            building.floorLines.children.forEach(child => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) (child.material as THREE.Material).dispose();
            });
          }
          
          // Create new geometry with updated height
          const centroid = calculateCentroid(building.points);
          const shape = createShapeFromPoints(building.points, centroid);
          
          const extrudeSettings = {
            depth: newHeight,
            bevelEnabled: false,
            steps: 1
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          geometry.rotateX(-Math.PI / 2);
          
          // Update mesh
          building.mesh.geometry = geometry;
          building.mesh.position.set(centroid.x, 0, centroid.z);
          
          // Re-add to scene
          scene.add(building.mesh);
          
          // Reapply color after geometry change
          const newMaterial = building.mesh.material as THREE.MeshLambertMaterial;
          newMaterial.color.setHex(config.color);

          // Create new floor lines if building has more than 1 floor
          if (config.floors > 1) {
            updatedBuilding.floorLines = createFloorLines(building.points, config.floors, config.floorHeight, scene, building.id);
          } else {
            updatedBuilding.floorLines = null;
          }
        }
        
        // Update building data
        updatedBuilding.floors = config.floors;
        updatedBuilding.floorHeight = config.floorHeight;
        updatedBuilding.color = config.color;
        updatedBuilding.name = config.name || updatedBuilding.name;
        updatedBuilding.description = config.description || updatedBuilding.description;
      }

      return updatedBuilding;
    }));

    // Update buildingsRef to keep it in sync
    buildingsRef.current = buildingsRef.current.map(building => {
      if (building.id !== id) return building;
      return { ...building, ...updates };
    });

    // Update selected building if it's the one being updated
    if (selectedBuilding?.id === id) {
      setSelectedBuilding(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [scene, selectedBuilding]);

  const selectBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous selection
    if (selectedBuilding) {
      const material = selectedBuilding.mesh.material as THREE.MeshLambertMaterial;      // Restore original color and remove selection effects
      material.emissive.setHex(getThemeColorAsHex('--color-building-emissive', 0x000000));
      if (typeof selectedBuilding.color === 'number') {
        material.color.setHex(selectedBuilding.color);
      }
      material.transparent = false;
      material.opacity = 1.0;
    }

    // Apply selection to new building (but only if it's not a preview)
    if (building && !building.mesh.userData.isPreview && !building.mesh.userData.isDrawingElement) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;      // Set selection color (orange with transparency)
      material.color.setHex(getThemeColorAsHex('--color-building-highlight', 0xffa500)); // Use CSS variable
      material.transparent = true;
      material.opacity = 0.6; // More visible than before
      material.emissive.setHex(getThemeColorAsHex('--color-building-highlight-emissive', 0x332200)); // Use CSS variable
    }

    setSelectedBuilding(building);
  }, [selectedBuilding]);

  const hoverBuilding = useCallback((building: BuildingData | null) => {
    // Reset previous hover (only if not selected)
    if (hoveredBuilding && hoveredBuilding !== selectedBuilding) {
      const material = hoveredBuilding.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(getThemeColorAsHex('--color-building-emissive', 0x000000));
      // Restore original color properly
      if (typeof hoveredBuilding.color === 'number') {
        material.color.setHex(hoveredBuilding.color);
      }
      material.transparent = false;
      material.opacity = 1.0;
    }

    // Apply hover to new building (only if not selected)
    if (building && building !== selectedBuilding && !building.mesh.userData.isPreview) {
      const material = building.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(getThemeColorAsHex('--color-building-hover-emissive', 0x444444)); // Use CSS variable
      console.log('Hovering building:', building.id, building.name);
    }

    setHoveredBuilding(building);
  }, [hoveredBuilding, selectedBuilding]);

  const showBuildingTooltip = useCallback((building: BuildingData, screenPosition: { x: number; y: number }) => {
    setBuildingTooltip({
      building,
      position: screenPosition,
      visible: true
    });
  }, []);

  const hideBuildingTooltip = useCallback(() => {
    setBuildingTooltip(null);
  }, []);

  // Convert 3D world position to screen coordinates
  const worldToScreen = useCallback((worldPosition: THREE.Vector3, camera: THREE.PerspectiveCamera): { x: number; y: number } => {
    const vector = worldPosition.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    
    return { x, y };
  }, []);

  const deleteBuilding = useCallback((id: string) => {
    if (!scene) return;

    // Hide tooltip if it's showing the building being deleted
    if (buildingTooltip?.building.id === id) {
      setBuildingTooltip(null);
    }

    setBuildings(prev => {
      const building = prev.find(b => b.id === id);
      if (building) {
        // Remove main building mesh
        scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        (building.mesh.material as THREE.Material).dispose();
        
        // Remove footprint outline
        if (building.footprintOutline) {
          scene.remove(building.footprintOutline);
          building.footprintOutline.geometry.dispose();
          (building.footprintOutline.material as THREE.Material).dispose();
        }

        // Remove floor lines
        if (building.floorLines) {
          scene.remove(building.floorLines);
          building.floorLines.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) (child.material as THREE.Material).dispose();
          });
        }

        // AGGRESSIVE CLEANUP: Remove ALL drawing elements that could be related
        const objectsToRemove = scene.children.filter(child => {
          const userData = child.userData || {};
          
          // Check for specific building ID associations
          const hasSpecificBuildingId = userData.buildingId === id || 
                                      userData.associatedBuildingId === id ||
                                      userData.targetBuildingId === id ||
                                      userData.parentBuildingId === id ||
                                      userData.drawingBuildingId === id ||
                                      userData.belongsToBuilding === id;

          // Check for drawing element types
          const isDrawingElement = userData.isDrawingElement || 
                                 userData.isFootprintLine || 
                                 userData.isFootprintPoint || 
                                 userData.isFootprintPreview || 
                                 userData.isPreviewLine || 
                                 userData.isPreviewPoint || 
                                 userData.isFloorLines || 
                                 userData.isFloorLine;

          // Check for generic drawing objects (Points, Lines that might be footprint elements)
          const isGenericDrawingObject = (child instanceof THREE.Points && 
                                        (userData.type === 'footprint' || 
                                         userData.isPoint || 
                                         child.material && (child.material as any).color && 
                                         (child.material as any).color.getHex() === getThemeColorAsHex('--color-drawing-footprint-point', 0xffff00))) || // Yellow points
                                       (child instanceof THREE.Line && 
                                        (userData.type === 'footprint' || 
                                         userData.isLine ||
                                         child.material && (child.material as any).color &&
                                         (child.material as any).color.getHex() === getThemeColorAsHex('--color-drawing-footprint-line', 0x00ff00))); // Green lines

          // Check for any mesh that might be a preview
          const isPreviewMesh = child instanceof THREE.Mesh && 
                               (userData.type === 'footprint' || 
                                userData.isPreview ||
                                userData.isFootprint);

          return hasSpecificBuildingId || 
                 (isDrawingElement && userData.buildingId === id) ||
                 isGenericDrawingObject ||
                 isPreviewMesh;
        });

        console.log(`Removing ${objectsToRemove.length} associated objects for building ${id}:`, 
                   objectsToRemove.map(obj => ({ 
                     type: obj.constructor.name, 
                     userData: obj.userData,
                     uuid: obj.uuid 
                   })));

        objectsToRemove.forEach(obj => {
          scene.remove(obj);
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });

        // NUCLEAR OPTION: If objects still remain, remove all Points and Lines without building associations
        const remainingDrawingObjects = scene.children.filter(child => 
          (child instanceof THREE.Points || child instanceof THREE.Line) &&
          !child.userData?.buildingId &&
          !child.userData?.isBuilding &&
          !child.userData?.isPermanent &&
          !child.userData?.isGrid &&
          !child.userData?.isHelper &&
          !child.userData?.isAxis &&
          child.userData?.type !== 'grid' &&
          child.userData?.type !== 'helper' &&
          child.userData?.type !== 'axis' &&
          !(child instanceof THREE.GridHelper) &&
          !(child instanceof THREE.AxesHelper)
        );

        if (remainingDrawingObjects.length > 0) {
          console.log(`Removing ${remainingDrawingObjects.length} orphaned drawing objects`);
          remainingDrawingObjects.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }

        // FINAL CLEANUP: Remove ALL Points (spheres) that might be footprint markers, but preserve grid/helpers
        const allPoints = scene.children.filter(child => 
          child instanceof THREE.Points &&
          !child.userData?.isPermanent &&
          !child.userData?.isGrid &&
          !child.userData?.isHelper &&
          child.userData?.type !== 'grid' &&
          child.userData?.type !== 'helper'
        );
        console.log(`Found ${allPoints.length} Points objects to remove (preserving grid/helpers)`);
        allPoints.forEach(pointsObj => {
          scene.remove(pointsObj);
          if (pointsObj.geometry) pointsObj.geometry.dispose();
          if (pointsObj.material) {
            if (Array.isArray(pointsObj.material)) {
              pointsObj.material.forEach(mat => mat.dispose());
            } else {
              pointsObj.material.dispose();
            }
          }
        });
      }
      return prev.filter(b => b.id !== id);
    });

    // Update refs
    buildingsRef.current = buildingsRef.current.filter(b => b.id !== id);

    if (selectedBuilding?.id === id) {
      setSelectedBuilding(null);
    }
    if (hoveredBuilding?.id === id) {
      setHoveredBuilding(null);
    }
  }, [scene, selectedBuilding, hoveredBuilding, buildingTooltip]);
  const clearAllBuildings = useCallback(() => {
    if (!scene) return;

    buildingsRef.current.forEach(building => {
      scene.remove(building.mesh);
      building.mesh.geometry.dispose();
      (building.mesh.material as THREE.Material).dispose();
      
      // Remove footprint outline
      if (building.footprintOutline) {
        scene.remove(building.footprintOutline);
        building.footprintOutline.geometry.dispose();
        (building.footprintOutline.material as THREE.Material).dispose();
      }

      // Remove floor lines
      if (building.floorLines) {
        scene.remove(building.floorLines);
        building.floorLines.children.forEach(child => {
          // Use type assertions for THREE.js objects
          const obj = child as unknown as THREE.Mesh;
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              (obj.material as THREE.Material).dispose();
            }
          }
        });
      }
    });

    // Only remove objects that are directly related to buildings
    // Avoid removing grid elements, axes, or other UI elements
    const objectsToRemove = scene.children.filter(child => {
      // Only remove objects explicitly marked as building-related
      return child.userData?.isBuilding || 
             child.userData?.buildingId ||
             child.userData?.isFootprintLine || 
             child.userData?.isFootprintPoint || 
             child.userData?.isPolygonFootprint ||
             child.userData?.isFloorLines ||
             child.userData?.isFloorLine;
      // Explicitly NOT removing all Lines and Points as they may be grid or other elements
    });

    objectsToRemove.forEach(obj => {
      scene.remove(obj);
      // Use type assertions for THREE.js objects
      const mesh = obj as unknown as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          (mesh.material as THREE.Material).dispose();
        }
      }
    });

    // Clear both ref and state
    buildingsRef.current = [];
    setBuildings([]);
    setSelectedBuilding(null);
    setHoveredBuilding(null);
  }, [scene]);

  const exportBuildings = useCallback(() => {
    const exportData = {
      version: '2.1',
      createdAt: new Date().toISOString(),
      buildings: buildings.map(building => ({
        id: building.id,
        name: building.name,
        description: building.description,
        points: building.points,
        area: building.area,
        floors: building.floors,
        floorHeight: building.floorHeight,
        color: building.color,
        totalHeight: building.floors * building.floorHeight,
        createdAt: building.createdAt.toISOString(),
        
        // Form properties
        window_to_wall_ratio: building.window_to_wall_ratio || 0.4,
        window_overhang: building.window_overhang || false,
        window_overhang_depth: building.window_overhang_depth || 0.0,
        
        // Construction properties
        wall_construction: building.wall_construction || 'Default Wall',
        floor_construction: building.floor_construction || 'Default Floor',
        roof_construction: building.roof_construction || 'Default Roof',
        window_construction: building.window_construction || 'Default Window',
        
        // Program properties
        building_program: building.building_program || 'Office',
        
        // HVAC properties
        hvac_system: building.hvac_system || 'Default HVAC',
        natural_ventilation: building.natural_ventilation || false
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [buildings]);

  // Handle building and footprint interaction via mouse events
  const handleBuildingInteraction = useCallback((event: MouseEvent, containerElement: HTMLElement) => {
    if (!scene || !camera) {
      console.warn('Scene or camera not available for building interaction');
      return null;
    }

    console.log('Building interaction called', { 
      eventType: event.type, 
      buildingsCount: buildingsRef.current.length,
      sceneChildren: scene.children.length 
    });

    // Calculate mouse position
    const rect = containerElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('Mouse position:', { x: mouse.current.x, y: mouse.current.y });

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Get ALL meshes in the scene that could be interactive
    const interactiveMeshes: THREE.Mesh[] = [];
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Include building meshes and footprints
        if (child.userData.buildingId || 
            child.userData.isFootprint || 
            child.userData.isBuilding ||
            child.userData.interactive) {
          interactiveMeshes.push(child);
        }
      }
    });
    
    console.log('Interactive meshes found:', interactiveMeshes.length, 
      interactiveMeshes.map(m => ({ 
        uuid: m.uuid, 
        userData: m.userData,
        visible: m.visible,
        position: m.position
      })));

    // Get intersections with ALL interactive meshes
    const intersects = raycaster.current.intersectObjects(interactiveMeshes, false);
    console.log('Intersections found:', intersects.length);

    if (intersects.length > 0) {
      // Sort by distance to get the closest intersection
      intersects.sort((a, b) => a.distance - b.distance);
      
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const intersectionPoint = intersects[0].point;

      console.log('Closest intersected mesh:', {
        uuid: intersectedMesh.uuid,
        userData: intersectedMesh.userData,
        position: intersectionPoint,
        distance: intersects[0].distance
      });

      // Get building ID from userData - handle both direct building meshes and footprints
      const buildingId = intersectedMesh.userData.buildingId || intersectedMesh.userData.parentBuildingId;
      
      if (buildingId) {
        // Find building in current state
        const building = buildingsRef.current.find(b => b.id === buildingId);
        console.log('Found building for ID:', buildingId, !!building);

        if (building) {
          if (event.type === 'click' || event.type === 'mouseup') {
            // Handle click - show tooltip
            console.log('Showing tooltip for building click:', building.id);
            const screenPos = worldToScreen(intersectionPoint, camera);
            showBuildingTooltip(building, screenPos);
            
            return {
              type: intersectedMesh.userData.isFootprint ? 'footprint' : 'building',
              building,
              action: 'tooltip'
            };
          } else if (event.type === 'mousemove') {
            // Handle hover - only if not already hovered
            if (building !== hoveredBuilding) {
              console.log('Hovering building:', building.id);
              hoverBuilding(building);
            }
            return {
              type: intersectedMesh.userData.isFootprint ? 'footprint' : 'building',
              building,
              action: 'hover'
            };
          }
        } else {
          console.warn('Building not found for ID:', buildingId);
        }
      } else {
        console.log('Intersected mesh has no buildingId or parentBuildingId');
      }
    } else {
      console.log('No intersections found');
      // No intersections - handle accordingly
      if (event.type === 'mousemove') {
        // Clear hover when not over any building
        if (hoveredBuilding) {
          console.log('Clearing hover');
          hoverBuilding(null);
        }
      } else if (event.type === 'click' || event.type === 'mouseup') {
        // Click on empty space - clear tooltip only
        setBuildingTooltip(null);
      }
    }

    return null;
  }, [scene, camera, hoveredBuilding, hoverBuilding, showBuildingTooltip, worldToScreen]);

  const buildingStats: BuildingStats = {
    count: buildings.length,
    totalArea: buildings.reduce((sum, building) => sum + building.area, 0),
    totalFloors: buildings.reduce((sum, building) => sum + building.floors, 0)
  };

  return {
    buildings,
    selectedBuilding,
    hoveredBuilding,
    buildingTooltip,
    addBuilding,
    updateBuilding,
    selectBuilding,
    hoverBuilding,
    deleteBuilding,
    clearAllBuildings,
    exportBuildings,
    buildingStats,
    handleBuildingInteraction,
    showBuildingTooltip,
    hideBuildingTooltip
  };
};

// Helper function to calculate polygon area using shoelace formula
const calculatePolygonArea = (points: Point3D[]): number => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].z;
    area -= points[j].x * points[i].z;
  }
  
  return Math.abs(area) / 2;
};