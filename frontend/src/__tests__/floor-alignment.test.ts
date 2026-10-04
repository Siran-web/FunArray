import { describe, it, expect, beforeEach } from 'vitest';
import { useVisualizationStore, DEFAULT_FLOOR_ALIGNMENT } from '../store/visualizationStore';
import { PlacedFurniture } from '../types/visualization';

describe('RoomFloorAlignmentController & Perspective Calibration Suite', () => {
  const SOFA: PlacedFurniture = {
    id: 'furn-sofa-test',
    productId: 'prod-sofa',
    name: 'Velvet 3-Seater Sofa',
    price: 899.99,
    modelUrl: '/models/sofa.glb',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 200, heightCm: 85, depthCm: 90 },
    color: 'blue',
    material: 'Royal Velvet',
    isLocked: false,
  };

  beforeEach(() => {
    useVisualizationStore.setState({
      roomImage: null,
      roomImageId: null,
      placedFurniture: [SOFA],
      selectedFurnitureId: 'furn-sofa-test',
      floorAlignment: DEFAULT_FLOOR_ALIGNMENT,
    });
  });

  it('1. Setting a room photo should automatically trigger initial floor adjustment mode if not calibrated', () => {
    const store = useVisualizationStore.getState();
    expect(store.floorAlignment.isAdjusting).toBe(false);

    store.setRoomImage('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200', 'room-img-1');
    
    const state = useVisualizationStore.getState();
    expect(state.roomImage).toBe('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200');
    expect(state.floorAlignment.isAdjusting).toBe(true);
    expect(state.floorAlignment.isCalibrated).toBe(false);
  });

  it('2. Should allow adjusting camera height, pitch angle, lens FOV, and floor elevation', () => {
    const store = useVisualizationStore.getState();
    store.setFloorAlignment({
      cameraHeight: 1.55,
      pitchAngle: -12,
      cameraFov: 55,
      elevation: 0.15,
      depthScale: 1.1,
    });

    const align = useVisualizationStore.getState().floorAlignment;
    expect(align.cameraHeight).toBe(1.55);
    expect(align.pitchAngle).toBe(-12);
    expect(align.cameraFov).toBe(55);
    expect(align.elevation).toBe(0.15);
    expect(align.depthScale).toBe(1.1);
  });

  it('3. User confirming floor adjustment should mark isCalibrated true and close adjustment mode', () => {
    const store = useVisualizationStore.getState();
    store.setRoomImage('https://example.com/room.jpg');
    expect(useVisualizationStore.getState().floorAlignment.isAdjusting).toBe(true);

    store.confirmFloorAdjustment();

    const state = useVisualizationStore.getState();
    expect(state.floorAlignment.isAdjusting).toBe(false);
    expect(state.floorAlignment.isCalibrated).toBe(true);
  });

  it('4. Furniture placement and floor dragging must respect calibrated floor elevation', () => {
    const store = useVisualizationStore.getState();
    // Calibrate floor with elevation offset +0.10m
    store.setFloorAlignment({ elevation: 0.10, isCalibrated: true, isAdjusting: false });

    // Move furniture across calibrated floor
    store.updateFurnitureTransform('furn-sofa-test', [1.2, 0.10, -0.5]);
    let item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.position[0]).toBeCloseTo(1.2, 2);
    expect(item.position[1]).toBeCloseTo(0.10, 2); // Perfectly on calibrated elevation
    expect(item.position[2]).toBeCloseTo(-0.5, 2);

    // Rotate furniture
    store.updateFurnitureTransform('furn-sofa-test', undefined, [0, 45, 0]);
    item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.rotation[1]).toBe(45);
    expect(item.position[1]).toBeCloseTo(0.10, 2); // Floor contact maintained
  });

  it('5. Reset floor alignment should restore default values cleanly', () => {
    const store = useVisualizationStore.getState();
    store.setFloorAlignment({ cameraHeight: 2.1, pitchAngle: 18, elevation: 0.4 });
    
    store.resetFloorAlignment();
    const align = useVisualizationStore.getState().floorAlignment;
    expect(align.cameraHeight).toBe(DEFAULT_FLOOR_ALIGNMENT.cameraHeight);
    expect(align.pitchAngle).toBe(DEFAULT_FLOOR_ALIGNMENT.pitchAngle);
    expect(align.elevation).toBe(DEFAULT_FLOOR_ALIGNMENT.elevation);
  });

  it('6. Scene reload should restore calibrated floorAlignment settings', () => {
    const store = useVisualizationStore.getState();
    const customAlignment = {
      elevation: 0.20,
      pitchAngle: -8,
      cameraFov: 60,
      cameraHeight: 1.6,
      depthScale: 1.1,
      horizonY: 52,
      isCalibrated: true,
      isAdjusting: false,
    };

    store.loadScene([SOFA], 'https://example.com/room.jpg', 'img-123', customAlignment);

    const state = useVisualizationStore.getState();
    expect(state.roomImage).toBe('https://example.com/room.jpg');
    expect(state.floorAlignment.elevation).toBe(0.20);
    expect(state.floorAlignment.cameraFov).toBe(60);
    expect(state.floorAlignment.isCalibrated).toBe(true);
  });

  it('7. Sofa, Chair, and Table should maintain 1:1 real-world metric scale and ground base to floor exactly', async () => {
    const CHAIR: PlacedFurniture = {
      id: 'furn-chair-test',
      productId: 'prod-chair',
      name: 'Nordic Fabric Armchair',
      price: 299.99,
      modelUrl: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
      color: 'grey',
    };

    const TABLE: PlacedFurniture = {
      id: 'furn-table-test',
      productId: 'prod-table',
      name: 'Teakwood Coffee Table',
      price: 199.99,
      modelUrl: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { widthCm: 110, heightCm: 45, depthCm: 60 },
      color: 'gold',
    };

    const { createPhotorealisticProceduralFurniture } = await import('../components/visualization/ModelLoader');
    const { Box3, Vector3 } = await import('three');

    const testFurniture = [SOFA, CHAIR, TABLE];

    for (const item of testFurniture) {
      const group = createPhotorealisticProceduralFurniture(item);
      const meshAssembly = group.children[0];
      const box = new Box3().setFromObject(meshAssembly);
      const size = new Vector3();
      box.getSize(size);

      // Verify real scale conversion (cm to meters)
      expect(size.x).toBeCloseTo(item.dimensions.widthCm / 100, 1);
      expect(size.y).toBeCloseTo(item.dimensions.heightCm / 100, 1);
      expect(size.z).toBeCloseTo(item.dimensions.depthCm / 100, 1);

      // Verify grounding: lowest geometry vertex is at y = 0.000 (no floating, no sinking)
      expect(box.min.y).toBeCloseTo(0.0, 2);

      // Verify contact shadow plane exists directly beneath the base
      const shadow = group.getObjectByName('ambientContactShadow');
      expect(shadow).toBeDefined();
      expect(shadow?.position.y).toBeCloseTo(0.0012, 3);
    }
  });

  it('8. Moving Sofa, Chair, and Table deeper into the room must change perspective naturally via PerspectiveCamera', async () => {
    const { createPhotorealisticProceduralFurniture } = await import('../components/visualization/ModelLoader');
    const { PerspectiveCamera, Vector3, Box3 } = await import('three');

    const CHAIR: PlacedFurniture = {
      id: 'furn-chair-test',
      productId: 'prod-chair',
      name: 'Nordic Fabric Armchair',
      price: 299.99,
      modelUrl: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
      color: 'grey',
    };

    const TABLE: PlacedFurniture = {
      id: 'furn-table-test',
      productId: 'prod-table',
      name: 'Teakwood Coffee Table',
      price: 199.99,
      modelUrl: '',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: { widthCm: 110, heightCm: 45, depthCm: 60 },
      color: 'gold',
    };

    // Realistic perspective camera setup matching RoomViewer
    const camera = new PerspectiveCamera(40, 16 / 9, 0.05, 50);
    camera.position.set(0, 1.35, 3.6);
    camera.lookAt(0, 0.45, 0);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    const items = [SOFA, CHAIR, TABLE];

    for (const item of items) {
      const group = createPhotorealisticProceduralFurniture(item);

      // Helper to compute true projected screen-space 2D width & height in NDC [-1, 1]
      const getProjectedScreenSize = (zPos: number) => {
        group.position.set(0, 0, zPos);
        group.updateMatrixWorld(true);

        const box = new Box3().setFromObject(group);
        const corners = [
          new Vector3(box.min.x, box.min.y, box.min.z),
          new Vector3(box.min.x, box.min.y, box.max.z),
          new Vector3(box.min.x, box.max.y, box.min.z),
          new Vector3(box.min.x, box.max.y, box.max.z),
          new Vector3(box.max.x, box.min.y, box.min.z),
          new Vector3(box.max.x, box.min.y, box.max.z),
          new Vector3(box.max.x, box.max.y, box.min.z),
          new Vector3(box.max.x, box.max.y, box.max.z),
        ];

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const corner of corners) {
          corner.project(camera);
          minX = Math.min(minX, corner.x);
          maxX = Math.max(maxX, corner.x);
          minY = Math.min(minY, corner.y);
          maxY = Math.max(maxY, corner.y);
        }

        return {
          screenWidth: maxX - minX,
          screenHeight: maxY - minY,
        };
      };

      // Near position: Z = 0.5m
      const nearProjection = getProjectedScreenSize(0.5);
      // Mid position: Z = -1.0m (deeper into room)
      const midProjection = getProjectedScreenSize(-1.0);
      // Deep position: Z = -2.5m (far back in room)
      const deepProjection = getProjectedScreenSize(-2.5);

      // Natural perspective foreshortening: deeper objects appear smaller on screen
      expect(nearProjection.screenWidth).toBeGreaterThan(midProjection.screenWidth);
      expect(midProjection.screenWidth).toBeGreaterThan(deepProjection.screenWidth);
      expect(nearProjection.screenHeight).toBeGreaterThan(midProjection.screenHeight);
      expect(midProjection.screenHeight).toBeGreaterThan(deepProjection.screenHeight);
    }
  });
});
