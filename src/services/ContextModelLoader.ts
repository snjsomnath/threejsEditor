import * as THREE from 'three';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader.js';
import { SceneManager } from '../core/SceneManager';

export class ContextModelLoader {
  private sceneManager: SceneManager;
  private modelPath: string;
  private contextMesh: THREE.Object3D | null = null;

  constructor(sceneManager: SceneManager, modelPath: string = '../model/context.3dm') {
    this.sceneManager = sceneManager;
    this.modelPath = modelPath;
  }

  async loadContextModel(): Promise<THREE.Object3D | null> {
    try {
      const loader = new Rhino3dmLoader();
      // Use CDN path for rhino3dm wasm file
      loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@8.17.0/');

      return new Promise((resolve, reject) => {
        loader.load(
          this.modelPath,
          (object) => {            // Set properties for all meshes in the loaded model
            object.traverse((child) => {
              // Set all objects to receive shadows but not cast them
              child.receiveShadow = true;
              child.castShadow = false;
              
              if (child instanceof THREE.Mesh) {
                // Apply a light grey matte material
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffffff, 
                  roughness: 0.8,
                  metalness: 0.1,
                });
                
                // Make the mesh not clickable or interactive
                child.userData.isContextMesh = true;
                child.userData.nonInteractive = true;
                
                // Ensure it receives shadows but doesn't cast them (already set above, but being explicit)
                child.receiveShadow = true;
                child.castShadow = false;
                
                // Swap Y and Z coordinates to convert from Rhino's Z-up to Three.js Y-up
                child.traverse((subChild) => {
                  if (subChild instanceof THREE.Mesh && subChild.geometry) {
                    const position = subChild.geometry.attributes.position;
                    const array = position.array;
                    
                    // Swap Y and Z for each vertex
                    for (let i = 0; i < array.length; i += 3) {
                      const y = array[i + 1];
                      array[i + 1] = array[i + 2];
                      array[i + 2] = -y; // Negate to preserve handedness
                    }
                    
                    position.needsUpdate = true;
                  }
                });
              }
            });

            // Add the loaded object to the scene
            this.contextMesh = object;
            this.sceneManager.addObject(object);

            // Return the loaded object
            resolve(object);
          },
          (xhr) => {
            // Progress callback
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
          },
          (error) => {
            // Error callback
            console.error('Error loading context model:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Failed to load context model:', error);
      return null;
    }
  }

  getContextMesh(): THREE.Object3D | null {
    return this.contextMesh;
  }

  dispose(): void {
    if (this.contextMesh) {
      this.sceneManager.removeObject(this.contextMesh);
      this.contextMesh = null;
    }
  }
}
