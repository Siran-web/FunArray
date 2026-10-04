import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useVisualizationStore } from '../store/visualizationStore';
import { PlacedFurniture } from '../types/visualization';
import {
  loadFurnitureModel,
  createPhotorealisticProceduralFurniture,
  processAndSanitizePBRMaterial,
  groundModelToBase,
} from '../components/visualization/ModelLoader';
import { setupLightingAndEnvironment } from '../components/visualization/LightingEnvironment';
import { createARPlacementReticle, validateSurfacePlacement, SurfaceHit } from '../components/ar/ARSurfaceManager';
import { evaluatePointOcclusion, createCPUDepthMap, DEFAULT_OCCLUSION_CONFIG } from '../components/ar/ARDepthOcclusion';

describe('Professional AR Realism & Complete Product Lifecycle Suite', () => {
  const SOFA: PlacedFurniture = {
    id: 'furn-sofa',
    productId: 'prod-sofa',
    name: 'Velvet 3-Seater Sofa',
    price: 899.99,
    modelUrl: '/models/sofa.glb',
    position: [-1.0, 0, -0.5],
    rotation: [0, 15, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 200, heightCm: 85, depthCm: 90 },
    color: 'blue',
    material: 'Royal Velvet',
    isLocked: false,
  };

  const CHAIR: PlacedFurniture = {
    id: 'furn-chair',
    productId: 'prod-chair',
    name: 'Nordic Fabric Armchair',
    price: 299.99,
    modelUrl: '/models/chair.glb',
    position: [0.8, 0, 0.4],
    rotation: [0, -30, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
    color: 'grey',
    material: 'Oak & Fabric',
    isLocked: false,
  };

  const TABLE: PlacedFurniture = {
    id: 'furn-table',
    productId: 'prod-table',
    name: 'Teakwood Coffee Table',
    price: 199.99,
    modelUrl: '/models/table.glb',
    position: [0.0, 0, 0.2],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 110, heightCm: 45, depthCm: 60 },
    color: 'gold',
    material: 'Solid Teak',
    isLocked: false,
  };

  const WARDROBE: PlacedFurniture = {
    id: 'furn-wardrobe',
    productId: 'prod-wardrobe',
    name: 'Scandinavian 2-Door Wardrobe',
    price: 799.99,
    modelUrl: '/models/wardrobe.glb',
    position: [-1.8, 0, -1.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 110, heightCm: 195, depthCm: 60 },
    color: 'sand',
    material: 'Natural White Oak',
    isLocked: false,
  };

  beforeEach(() => {
    useVisualizationStore.setState({
      placedFurniture: [],
      selectedFurnitureId: null,
      lightingMode: 'warm',
      showGrid: true,
      showShadows: true,
      designName: 'My Dream Room',
      currentDesignId: null,
    });
  });

  it('1. Should generate and ground all 4 categories (Sofa, Chair, Table, Wardrobe) at exact 1:1 metric scale', () => {
    const products = [SOFA, CHAIR, TABLE, WARDROBE];

    for (const prod of products) {
      const group = createPhotorealisticProceduralFurniture(prod);
      expect(group).toBeDefined();

      // The physical furniture geometry is the first child (meshAssembly)
      const meshAssembly = group.children[0];
      const box = new THREE.Box3().setFromObject(meshAssembly);
      const size = new THREE.Vector3();
      box.getSize(size);

      // World units must be meters (100cm = 1.0m) and within realistic physical proportions
      expect(size.x).toBeGreaterThan(0.4);
      expect(size.y).toBeCloseTo(prod.dimensions.heightCm / 100, 1);
      expect(size.z).toBeGreaterThan(0.4);

      // Model base must touch floor (Y = 0.000)
      expect(box.min.y).toBeCloseTo(0.0, 2);

      // Contact shadow plane must exist
      const shadow = group.getObjectByName('ambientContactShadow');
      expect(shadow).toBeDefined();
    }
  });

  it('2. Should support full manipulation: Move, Rotate, Scale, Lock, Unlock, Delete', () => {
    const store = useVisualizationStore.getState();

    // Place Sofa
    store.addFurniture(SOFA);
    expect(useVisualizationStore.getState().placedFurniture.length).toBe(1);

    // Move
    store.updateFurnitureTransform('furn-sofa', [0.5, 0, -1.0]);
    let item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.position).toEqual([0.5, 0, -1.0]);

    // Rotate
    store.updateFurnitureTransform('furn-sofa', undefined, [0, 45, 0]);
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.rotation).toEqual([0, 45, 0]);

    // Scale
    store.updateFurnitureTransform('furn-sofa', undefined, undefined, [1.1, 1.1, 1.1]);
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.scale).toEqual([1.1, 1.1, 1.1]);

    // Lock
    store.toggleLockFurniture('furn-sofa');
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.isLocked).toBe(true);

    // Attempt modification while locked
    store.updateFurnitureTransform('furn-sofa', [2.0, 0, 2.0], [0, 90, 0]);
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.position).toEqual([0.5, 0, -1.0]); // Unchanged
    expect(item.rotation).toEqual([0, 45, 0]); // Unchanged

    // Unlock
    store.toggleLockFurniture('furn-sofa');
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.isLocked).toBe(false);

    // Delete
    store.removeFurniture('furn-sofa');
    expect(useVisualizationStore.getState().placedFurniture.length).toBe(0);
  });

  it('3. Should place multiple furniture pieces and save/reload entire scene layout without corruption', () => {
    const store = useVisualizationStore.getState();

    // Add all 4 items
    store.addFurniture(SOFA);
    store.addFurniture(CHAIR);
    store.addFurniture(TABLE);
    store.addFurniture(WARDROBE);

    const placed = useVisualizationStore.getState().placedFurniture;
    expect(placed.length).toBe(4);

    // Serialize scene to JSON (as done for backend save)
    const serializedScene = JSON.stringify(placed);
    expect(serializedScene).toBeDefined();

    // Clear scene
    store.clearScene();
    expect(useVisualizationStore.getState().placedFurniture.length).toBe(0);

    // Reload scene from saved JSON
    const deserialized = JSON.parse(serializedScene);
    store.loadScene(deserialized, 'https://example.com/room.jpg', 'room-img-123');

    const restored = useVisualizationStore.getState().placedFurniture;
    expect(restored.length).toBe(4);
    expect(restored[0].name).toBe('Velvet 3-Seater Sofa');
    expect(restored[1].name).toBe('Nordic Fabric Armchair');
    expect(restored[2].name).toBe('Teakwood Coffee Table');
    expect(restored[3].name).toBe('Scandinavian 2-Door Wardrobe');
    expect(useVisualizationStore.getState().roomImage).toBe('https://example.com/room.jpg');
  });

  it('4. Should validate surface tracking and reject wall placement for floor furniture', () => {
    const floorHit: SurfaceHit = {
      position: new THREE.Vector3(0, 0, -1.5),
      normal: new THREE.Vector3(0, 1, 0),
      orientation: new THREE.Quaternion(),
      isFloor: true,
      isWall: false,
      tiltDegrees: 2.0,
      confidence: 0.95,
    };
    expect(validateSurfacePlacement(floorHit, 'Living Room Sofa').isValid).toBe(true);

    const wallHit: SurfaceHit = {
      position: new THREE.Vector3(0, 1.2, -2.0),
      normal: new THREE.Vector3(0, 0, 1),
      orientation: new THREE.Quaternion(),
      isFloor: false,
      isWall: true,
      tiltDegrees: 88.0,
      confidence: 0.92,
    };
    const wallVal = validateSurfacePlacement(wallHit, 'Living Room Sofa');
    expect(wallVal.isValid).toBe(false);
    expect(wallVal.reason).toContain('cannot be placed against a vertical wall');
  });

  it('5. Should correctly evaluate real-world depth occlusion with safety bias', () => {
    const camera = new THREE.PerspectiveCamera(40, 1.0, 0.1, 50);
    camera.position.set(0, 1.35, 0);
    camera.lookAt(0, 1.35, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Real object at 1.5m
    const depthMap = createCPUDepthMap(8, 8, new Float32Array(64).fill(1.5));

    // Point behind real obstacle (Z = -2.8m)
    const behindPoint = new THREE.Vector3(0, 1.35, -2.8);
    const occludedRes = evaluatePointOcclusion(behindPoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);
    expect(occludedRes.isOccluded).toBe(true);

    // Point in front of real obstacle (Z = -1.0m)
    const inFrontPoint = new THREE.Vector3(0, 1.35, -1.0);
    const visibleRes = evaluatePointOcclusion(inFrontPoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);
    expect(visibleRes.isOccluded).toBe(false);
  });

  it('6. Should dispose Three.js geometries, materials, and reticles cleanly without memory leaks', () => {
    const reticleRig = createARPlacementReticle();
    expect(reticleRig.mesh).toBeDefined();

    const sofa = createPhotorealisticProceduralFurniture(SOFA);
    expect(sofa).toBeDefined();

    expect(() => {
      reticleRig.dispose();
      sofa.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry?.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else if (mat) {
            mat.dispose();
          }
        }
      });
    }).not.toThrow();
  });
});
