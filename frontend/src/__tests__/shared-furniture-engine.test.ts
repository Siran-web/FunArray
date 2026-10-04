import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useVisualizationStore, DEFAULT_FLOOR_ALIGNMENT } from '../store/visualizationStore';
import { PlacedFurniture } from '../types/visualization';
import { Product } from '../types/product';
import {
  calculateGroundedPlacement,
  hitTestFloorPlane,
  createPlacedFurnitureFromProduct,
  DEFAULT_ROOM_BOUNDS,
} from '../components/visualization/FurniturePlacement';
import {
  calculateNudge,
  calculateRotation,
  calculateClampedScale,
  computeScaledDimensions,
  MIN_FURNITURE_SCALE,
  MAX_FURNITURE_SCALE,
} from '../components/visualization/FurnitureTransform';
import { createSelectionIndicatorRig } from '../components/visualization/FurnitureSelection';
import {
  loadFurnitureModel,
  createPhotorealisticProceduralFurniture,
  groundModelToBase,
} from '../components/visualization/ModelLoader';

describe('Shared Furniture Engine: Mode 1 (Room Photo) & Mode 2 (Camera AR) Integration', () => {
  const MOCK_PRODUCT: Product = {
    id: 'prod-modern-sofa',
    name: 'Metropolitan 3-Seater Sofa',
    slug: 'metropolitan-3-seater-sofa',
    description: 'Minimalist Italian silhouette in Belgian linen.',
    sku: 'SOFA-METRO-001',
    basePrice: 1299.99,
    categoryId: 'cat-living-room',
    categoryName: 'Living Room',
    brand: 'FunArray Studio',
    material: 'Belgian Linen & Walnut',
    status: 'ACTIVE',
    rating: 4.9,
    reviewCount: 42,
    arSupported: true,
    availableOnline: true,
    dimensions: {
      widthCm: 210,
      heightCm: 85,
      depthCm: 90,
    },
    images: [
      {
        id: 'img-1',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        altText: 'Metropolitan 3-Seater Sofa',
        isPrimary: true,
        sortOrder: 1,
      },
    ],
    model3D: {
      id: 'model-1',
      modelUrl: '/models/metropolitan-sofa.glb',
      format: 'glb',
      widthCm: 210,
      heightCm: 85,
      depthCm: 90,
      version: 1,
    },
    variants: [
      {
        id: 'var-1',
        sku: 'SOFA-METRO-001-BLU',
        color: 'blue',
        material: 'Royal Velvet',
        price: 1299.99,
        stockQuantity: 5,
        status: 'ACTIVE',
      },
    ],
  };

  beforeEach(() => {
    useVisualizationStore.setState({
      roomImage: null,
      roomImageId: null,
      viewMode: 'studio',
      placedFurniture: [],
      selectedFurnitureId: null,
      floorAlignment: DEFAULT_FLOOR_ALIGNMENT,
    });
  });

  it('1. Should construct standardized PlacedFurniture from Product data with exact real-world dimensions', () => {
    const item = createPlacedFurnitureFromProduct(MOCK_PRODUCT, [0, 0, 0]);
    expect(item.productId).toBe(MOCK_PRODUCT.id);
    expect(item.name).toBe(MOCK_PRODUCT.name);
    expect(item.price).toBe(MOCK_PRODUCT.basePrice);
    expect(item.dimensions.widthCm).toBe(210);
    expect(item.dimensions.heightCm).toBe(85);
    expect(item.dimensions.depthCm).toBe(90);

    // Verify 1:1 metric scaling when procedural model is generated
    const model = createPhotorealisticProceduralFurniture(item);
    const box = new THREE.Box3().setFromObject(model.children[0]);
    const size = new THREE.Vector3();
    box.getSize(size);

    expect(size.x).toBeCloseTo(2.10, 1);
    expect(size.y).toBeCloseTo(0.85, 1);
    expect(size.z).toBeCloseTo(0.90, 1);
    expect(box.min.y).toBeCloseTo(0.0, 2); // Perfectly grounded
  });

  it('2. Should enforce shared transform calculations, scale clamping [0.75, 1.25], and lock protection', () => {
    const initialPos: [number, number, number] = [1.0, 0, -1.0];
    const initialRot: [number, number, number] = [0, 90, 0];

    // Nudge
    const nudged = calculateNudge(initialPos, 0.5, -0.2, false);
    expect(nudged).toEqual([1.5, 0, -1.2]);

    // Locked Nudge is rejected
    const lockedNudged = calculateNudge(initialPos, 0.5, -0.2, true);
    expect(lockedNudged).toEqual(initialPos);

    // Rotation
    const rotated = calculateRotation(initialRot, 45, false);
    expect(rotated).toEqual([0, 135, 0]);

    // Scale Clamping
    const clampedUnder = calculateClampedScale(0.5, false);
    expect(clampedUnder[0]).toBe(MIN_FURNITURE_SCALE);

    const clampedOver = calculateClampedScale(1.8, false);
    expect(clampedOver[0]).toBe(MAX_FURNITURE_SCALE);

    // Scaled dimensions readout
    const dims = computeScaledDimensions(MOCK_PRODUCT.dimensions, 1.10);
    expect(dims.widthCm).toBe(Math.round(210 * 1.10));
    expect(dims.heightCm).toBe(Math.round(85 * 1.10));
    expect(dims.depthCm).toBe(Math.round(90 * 1.10));
  });

  it('3. Shared FurniturePlacement should calculate floor elevation grounding and bounds clamping', () => {
    const grounded = calculateGroundedPlacement(10.0, -10.0, 0.15, DEFAULT_ROOM_BOUNDS);
    expect(grounded[0]).toBe(4.5); // Clamped to maxX
    expect(grounded[1]).toBe(0.15); // Exactly at floor elevation
    expect(grounded[2]).toBe(-4.5); // Clamped to minZ

    // Hit test against floor plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.20); // Floor at Y = 0.20m
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(0, 2.0, 2.0),
      new THREE.Vector3(0, -1.0, -1.0).normalize()
    );

    const hit = hitTestFloorPlane(raycaster, plane, DEFAULT_ROOM_BOUNDS);
    expect(hit).not.toBeNull();
    if (hit) {
      expect(hit[1]).toBeCloseTo(0.20, 2);
    }
  });

  it('4. Shared FurnitureSelection rig should create 3D footprint indicator and update bounds', () => {
    const rig = createSelectionIndicatorRig(0xf59e0b);
    expect(rig.group).toBeDefined();
    expect(rig.group.name).toBe('furnitureSelectionIndicator');

    const dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.0));
    dummyMesh.position.set(1.5, 0, -2.0);

    rig.update(dummyMesh, 0.10, 1.0);
    expect(rig.group.visible).toBe(true);
    expect(rig.group.position.x).toBe(1.5);
    expect(rig.group.position.y).toBe(0.10);
    expect(rig.group.position.z).toBe(-2.0);

    rig.dispose();
  });

  it('5. Should support seamless switching between Mode 1 (Room Photo) and Mode 2 (Camera AR) without state loss', () => {
    const store = useVisualizationStore.getState();

    // 1. User opens Product in Room Photo Visualization (Mode 1)
    store.setProductForVisualization(MOCK_PRODUCT);
    store.setViewMode('room-photo');
    store.setRoomImage('https://example.com/room.jpg', 'img-1');
    store.setFloorAlignment({ elevation: 0.12, cameraFov: 50, isCalibrated: true });

    let state = useVisualizationStore.getState();
    expect(state.viewMode).toBe('room-photo');
    expect(state.placedFurniture.length).toBe(1);
    expect(state.placedFurniture[0].productId).toBe(MOCK_PRODUCT.id);

    const itemId = state.placedFurniture[0].id;

    // 2. User moves and rotates furniture in Room Photo Mode
    store.updateFurnitureTransform(itemId, [0.8, 0.12, -1.2], [0, 60, 0], [1.05, 1.05, 1.05]);
    store.toggleLockFurniture(itemId);

    state = useVisualizationStore.getState();
    expect(state.placedFurniture[0].position).toEqual([0.8, 0.12, -1.2]);
    expect(state.placedFurniture[0].rotation).toEqual([0, 60, 0]);
    expect(state.placedFurniture[0].scale).toEqual([1.05, 1.05, 1.05]);
    expect(state.placedFurniture[0].isLocked).toBe(true);

    // 3. User switches to Camera AR (Mode 2)
    store.setViewMode('camera-ar');

    state = useVisualizationStore.getState();
    expect(state.viewMode).toBe('camera-ar');
    // Furniture item, transforms, locks, and dimensions must be completely preserved!
    expect(state.placedFurniture.length).toBe(1);
    expect(state.placedFurniture[0].id).toBe(itemId);
    expect(state.placedFurniture[0].position).toEqual([0.8, 0.12, -1.2]);
    expect(state.placedFurniture[0].rotation).toEqual([0, 60, 0]);
    expect(state.placedFurniture[0].scale).toEqual([1.05, 1.05, 1.05]);
    expect(state.placedFurniture[0].isLocked).toBe(true);

    // 4. User switches back to Room Photo Mode (Mode 1)
    store.setViewMode('room-photo');
    state = useVisualizationStore.getState();
    expect(state.viewMode).toBe('room-photo');
    expect(state.roomImage).toBe('https://example.com/room.jpg');
    expect(state.floorAlignment.elevation).toBe(0.12);
  });
});
