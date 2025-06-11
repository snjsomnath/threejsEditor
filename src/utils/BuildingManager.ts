import * as THREE from 'three';
import { Building, Point2D } from '../types/Building';

export class BuildingManager {
  private scene: THREE.Scene;
  private buildings: Map<string, Building>;
  private selectedBuildingId: string | null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean;
  private dragTarget: 'point' | 'height' | null;
  private dragIndex: number;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildings = new Map();
    this.selectedBuildingId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.dragTarget = null;
    this.dragIndex = -1;
    console.log('🏗️ BuildingManager: Initialized');
  }

  createBuilding(points: Point2D[], height: number = 3): Building {
    console.log('🏢 BuildingManager: Creating building with points:', points);
    
    const id = `building_${Date.now()}`;
    const building: Building = {
      id,
      name: `Building ${this.buildings.size + 1}`,
      points: [...points],
      height,
      position: { x: 0, y: 0, z: 0 },
      color: '#3B82F6',
      selected: false
    };

    this.buildings.set(id, building);
    console.log('🏢 BuildingManager: Building data created:', building);
    
    this.createBuildingMesh(building);
    console.log('🏢 BuildingManager: Building mesh created');
    console.log('📊 BuildingManager: Scene now has', this.scene.children.length, 'children');
    
    return building;
  }

  private createBuildingMesh(building: Building): void {
    console.log('🔨 BuildingManager: Creating mesh for building:', building.id);
    console.log('📍 BuildingManager: Building points:', building.points);
    console.log('📏 BuildingManager: Building height:', building.height);

    // Validate points
    if (building.points.length < 3) {
      console.error('❌ BuildingManager: Not enough points to create building');
      return;
    }

    try {
      // Create shape from points
      const shape = new THREE.Shape();
      console.log('📐 BuildingManager: Creating shape from points');
      
      // Move to first point
      shape.moveTo(building.points[0].x, building.points[0].z);
      console.log('📐 BuildingManager: Starting at point:', building.points[0]);
      
      // Add lines to other points
      for (let i = 1; i < building.points.length; i++) {
        shape.lineTo(building.points[i].x, building.points[i].z);
        console.log('📐 BuildingManager: Line to point:', building.points[i]);
      }
      
      // Close the shape
      shape.lineTo(building.points[0].x, building.points[0].z);
      console.log('📐 BuildingManager: Shape closed');

      // Extrude the shape to create 3D building
      const extrudeSettings = {
        depth: building.height,
        bevelEnabled: false,
        steps: 1,
        bevelSize: 0,
        bevelThickness: 0
      };

      console.log('🏗️ BuildingManager: Extruding shape with settings:', extrudeSettings);
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Create material - USE EXACT SAME MATERIAL AS TEST OBJECTS
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xff0000 // Same red as test cube
      });

      // Remove existing mesh if it exists
      if (building.mesh) {
        console.log('🗑️ BuildingManager: Removing existing mesh');
        this.scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        if (Array.isArray(building.mesh.material)) {
          building.mesh.material.forEach(mat => mat.dispose());
        } else {
          building.mesh.material.dispose();
        }
      }

      // Create new mesh
      building.mesh = new THREE.Mesh(geometry, material);
      building.mesh.userData.buildingId = building.id;
      building.mesh.userData.type = 'building';
      
      // Position the building properly
      building.mesh.position.set(0, 0, 0);
      building.mesh.castShadow = true;
      building.mesh.receiveShadow = true;
      
      console.log('🏢 BuildingManager: Adding mesh to scene');
      this.scene.add(building.mesh);
      
      // Force scene update
      this.scene.updateMatrixWorld(true);
      
      console.log('✅ BuildingManager: Building mesh created and added to scene');
      console.log('📊 BuildingManager: Scene children count:', this.scene.children.length);

      // Create edges for better visibility
      this.createBuildingEdges(building);
      
      // Add a bright marker at the building center for debugging
      this.addBuildingMarker(building);
      
    } catch (error) {
      console.error('❌ BuildingManager: Error creating building mesh:', error);
    }
  }

  private addBuildingMarker(building: Building): void {
    // Calculate centroid of the building
    const centroid = this.calculateCentroid(building.points);
    
    // Add a bright marker at the center - USE SAME MATERIAL AS TEST OBJECTS
    const markerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const markerMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00 // Same green as test sphere
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(centroid.x, building.height + 1, centroid.z);
    marker.userData.buildingId = building.id;
    marker.userData.type = 'marker';
    
    this.scene.add(marker);
    console.log('🔴 BuildingManager: Added green marker at building center:', centroid);
  }

  private createBuildingEdges(building: Building): void {
    if (!building.mesh) {
      console.log('❌ BuildingManager: No mesh to create edges for');
      return;
    }

    console.log('📏 BuildingManager: Creating edges for building');

    // Remove existing edges
    if (building.edges) {
      this.scene.remove(building.edges);
      building.edges.geometry.dispose();
      if (Array.isArray(building.edges.material)) {
        building.edges.material.forEach(mat => mat.dispose());
      } else {
        building.edges.material.dispose();
      }
    }

    try {
      const edgesGeometry = new THREE.EdgesGeometry(building.mesh.geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFFFFF, // White edges for high contrast
        linewidth: 2
      });
      building.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      building.edges.userData.buildingId = building.id;
      building.edges.userData.type = 'edges';
      
      this.scene.add(building.edges);
      console.log('✅ BuildingManager: Building edges created');
    } catch (error) {
      console.error('❌ BuildingManager: Error creating building edges:', error);
    }
  }

  selectBuilding(id: string): void {
    console.log('🎯 BuildingManager: Selecting building:', id);
    
    // Deselect previous building
    if (this.selectedBuildingId) {
      const prevBuilding = this.buildings.get(this.selectedBuildingId);
      if (prevBuilding) {
        prevBuilding.selected = false;
        this.hideControlPoints(prevBuilding);
        // Reset material color to red (same as test objects)
        if (prevBuilding.mesh && prevBuilding.mesh.material) {
          (prevBuilding.mesh.material as THREE.MeshLambertMaterial).color.setHex(0xff0000);
        }
      }
    }

    // Select new building
    const building = this.buildings.get(id);
    if (building) {
      building.selected = true;
      this.selectedBuildingId = id;
      this.showControlPoints(building);
      
      // Highlight selected building with blue color
      if (building.mesh && building.mesh.material) {
        (building.mesh.material as THREE.MeshLambertMaterial).color.setHex(0x0000ff); // Blue highlight
      }
      
      console.log('✅ BuildingManager: Building selected:', id);
    }
  }

  private showControlPoints(building: Building): void {
    console.log('🎮 BuildingManager: Showing control points for building:', building.id);
    this.hideControlPoints(building);
    building.controlPoints = [];

    // Create control points for each corner - USE SAME MATERIAL AS TEST OBJECTS
    building.points.forEach((point, index) => {
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x00ff00 // Same green as test sphere
      });
      const controlPoint = new THREE.Mesh(geometry, material);
      
      controlPoint.position.set(point.x, building.height + 0.5, point.z);
      controlPoint.userData.buildingId = building.id;
      controlPoint.userData.pointIndex = index;
      controlPoint.userData.type = 'controlPoint';
      
      this.scene.add(controlPoint);
      building.controlPoints!.push(controlPoint);
      console.log('🟠 BuildingManager: Added control point at:', point);
    });

    // Create height handle - USE SAME MATERIAL AS TEST OBJECTS
    const centroid = this.calculateCentroid(building.points);
    const handleGeometry = new THREE.ConeGeometry(0.3, 1.0, 8);
    const handleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ff00 // Same green as test sphere
    });
    building.heightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    building.heightHandle.position.set(centroid.x, building.height + 1, centroid.z);
    building.heightHandle.userData.buildingId = building.id;
    building.heightHandle.userData.type = 'heightHandle';
    
    this.scene.add(building.heightHandle);
    console.log('🔺 BuildingManager: Added height handle at:', centroid);
  }

  private hideControlPoints(building: Building): void {
    building.controlPoints?.forEach(point => {
      this.scene.remove(point);
      point.geometry.dispose();
      if (Array.isArray(point.material)) {
        point.material.forEach(mat => mat.dispose());
      } else {
        point.material.dispose();
      }
    });
    building.controlPoints = [];

    if (building.heightHandle) {
      this.scene.remove(building.heightHandle);
      building.heightHandle.geometry.dispose();
      if (Array.isArray(building.heightHandle.material)) {
        building.heightHandle.material.forEach(mat => mat.dispose());
      } else {
        building.heightHandle.material.dispose();
      }
      building.heightHandle = undefined;
    }
  }

  private calculateCentroid(points: Point2D[]): Point2D {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      z: acc.z + point.z
    }), { x: 0, z: 0 });

    return {
      x: sum.x / points.length,
      z: sum.z / points.length
    };
  }

  handleMouseDown(event: MouseEvent, camera: THREE.Camera, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Check for building intersections first
    const buildingMeshes: THREE.Object3D[] = [];
    this.buildings.forEach(building => {
      if (building.mesh) {
        buildingMeshes.push(building.mesh);
      }
    });

    const buildingIntersects = this.raycaster.intersectObjects(buildingMeshes);
    if (buildingIntersects.length > 0) {
      const object = buildingIntersects[0].object;
      const buildingId = object.userData.buildingId;
      if (buildingId) {
        console.log('🏢 BuildingManager: Building clicked:', buildingId);
        this.selectBuilding(buildingId);
        return;
      }
    }
    
    // Check for control point intersections
    const controlPoints: THREE.Object3D[] = [];
    this.buildings.forEach(building => {
      if (building.controlPoints) {
        controlPoints.push(...building.controlPoints);
      }
      if (building.heightHandle) {
        controlPoints.push(building.heightHandle);
      }
    });

    const intersects = this.raycaster.intersectObjects(controlPoints);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      const userData = object.userData;
      
      this.isDragging = true;
      
      if (userData.type === 'controlPoint') {
        this.dragTarget = 'point';
        this.dragIndex = userData.pointIndex;
        this.selectBuilding(userData.buildingId);
      } else if (userData.type === 'heightHandle') {
        this.dragTarget = 'height';
        this.selectBuilding(userData.buildingId);
      }
    }
  }

  handleMouseMove(
    event: MouseEvent, 
    camera: THREE.Camera, 
    container: HTMLElement,
    groundPlane: THREE.Mesh
  ): void {
    if (!this.isDragging || !this.selectedBuildingId) return;

    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    
    const building = this.buildings.get(this.selectedBuildingId);
    if (!building) return;

    if (this.dragTarget === 'point') {
      const intersects = this.raycaster.intersectObject(groundPlane);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        building.points[this.dragIndex] = { x: point.x, z: point.z };
        this.updateBuilding(building);
      }
    } else if (this.dragTarget === 'height') {
      // Calculate height based on mouse Y movement
      const intersects = this.raycaster.intersectObjects([groundPlane]);
      if (intersects.length > 0) {
        const newHeight = Math.max(0.5, event.movementY * -0.1 + building.height);
        building.height = newHeight;
        this.updateBuilding(building);
      }
    }
  }

  handleMouseUp(): void {
    this.isDragging = false;
    this.dragTarget = null;
    this.dragIndex = -1;
  }

  private updateBuilding(building: Building): void {
    console.log('🔄 BuildingManager: Updating building:', building.id);
    this.createBuildingMesh(building);
    if (building.selected) {
      this.showControlPoints(building);
    }
  }

  updateBuildingHeight(id: string, height: number): void {
    console.log('📏 BuildingManager: Updating building height:', { id, height });
    const building = this.buildings.get(id);
    if (building) {
      building.height = Math.max(0.5, height);
      this.updateBuilding(building);
    }
  }

  deleteBuilding(id: string): void {
    console.log('🗑️ BuildingManager: Deleting building:', id);
    const building = this.buildings.get(id);
    if (building) {
      if (building.mesh) {
        this.scene.remove(building.mesh);
        building.mesh.geometry.dispose();
        if (Array.isArray(building.mesh.material)) {
          building.mesh.material.forEach(mat => mat.dispose());
        } else {
          building.mesh.material.dispose();
        }
      }
      if (building.edges) {
        this.scene.remove(building.edges);
        building.edges.geometry.dispose();
        if (Array.isArray(building.edges.material)) {
          building.edges.material.forEach(mat => mat.dispose());
        } else {
          building.edges.material.dispose();
        }
      }
      this.hideControlPoints(building);
      this.buildings.delete(id);
      
      if (this.selectedBuildingId === id) {
        this.selectedBuildingId = null;
      }
      
      console.log('✅ BuildingManager: Building deleted');
    }
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getSelectedBuilding(): Building | null {
    return this.selectedBuildingId ? this.buildings.get(this.selectedBuildingId) || null : null;
  }

  exportToJSON(): string {
    const data = {
      buildings: this.getAllBuildings().map(building => ({
        id: building.id,
        name: building.name,
        points: building.points,
        height: building.height,
        position: building.position,
        color: building.color
      }))
    };
    return JSON.stringify(data, null, 2);
  }

  dispose(): void {
    console.log('🧹 BuildingManager: Disposing all buildings');
    this.buildings.forEach(building => {
      this.deleteBuilding(building.id);
    });
    this.buildings.clear();
  }
}