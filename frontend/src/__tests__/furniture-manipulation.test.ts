import { describe, it, expect, beforeEach } from 'vitest';
import { useVisualizationStore } from '../store/visualizationStore';
import { PlacedFurniture } from '../types/visualization';

describe('Professional Furniture AR/3D Manipulation Suite', () => {
  const sampleFurniture: PlacedFurniture = {
    id: 'furn-test-1',
    productId: 'prod-sofa-1',
    name: 'Nordic Oak Sofa',
    price: 899.0,
    modelUrl: '/models/sofa.glb',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: {
      widthCm: 200,
      heightCm: 85,
      depthCm: 90,
    },
    isLocked: false,
  };

  beforeEach(() => {
    useVisualizationStore.setState({
      placedFurniture: [sampleFurniture],
      selectedFurnitureId: 'furn-test-1',
    });
  });

  it('should drag and move furniture smoothly across the floor surface maintaining Y = 0', () => {
    const store = useVisualizationStore.getState();
    store.updateFurnitureTransform('furn-test-1', [1.2, 0, -0.8]);

    const updated = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(updated).toBeDefined();
    expect(updated?.position[0]).toBeCloseTo(1.2, 2);
    expect(updated?.position[1]).toBe(0); // Strictly grounded on floor
    expect(updated?.position[2]).toBeCloseTo(-0.8, 2);
  });

  it('should rotate furniture around its logical center and preserve floor contact', () => {
    const store = useVisualizationStore.getState();
    store.updateFurnitureTransform('furn-test-1', undefined, [0, 90, 0]);

    const updated = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(updated?.rotation[1]).toBe(90);
    expect(updated?.position[1]).toBe(0); // Base grounded
  });

  it('should enforce bounded scale and preserve aspect ratio', () => {
    const store = useVisualizationStore.getState();
    
    // Scale 1.15x (within [0.75, 1.25])
    store.updateFurnitureTransform('furn-test-1', undefined, undefined, [1.15, 1.15, 1.15]);
    let updated = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(updated?.scale[0]).toBe(1.15);
    expect(updated?.scale[1]).toBe(1.15);
    expect(updated?.scale[2]).toBe(1.15);

    // Calculated scaled real dimensions in cm
    const scaledW = Math.round(updated!.dimensions.widthCm * updated!.scale[0]);
    const scaledH = Math.round(updated!.dimensions.heightCm * updated!.scale[1]);
    expect(scaledW).toBe(230); // 200 * 1.15
    expect(scaledH).toBe(98);  // 85 * 1.15
  });

  it('should lock furniture and prevent accidental move or rotation when locked', () => {
    const store = useVisualizationStore.getState();
    store.toggleLockFurniture('furn-test-1');

    let item = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(item?.isLocked).toBe(true);

    // Attempt to move while locked
    store.updateFurnitureTransform('furn-test-1', [3.0, 0, 3.0], [0, 180, 0]);

    item = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    // Position and rotation must NOT change when locked
    expect(item?.position[0]).toBe(0);
    expect(item?.rotation[1]).toBe(0);

    // Unlock
    store.toggleLockFurniture('furn-test-1');
    item = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(item?.isLocked).toBe(false);
  });

  it('should duplicate selected furniture with offset', () => {
    const store = useVisualizationStore.getState();
    store.duplicateFurniture('furn-test-1');

    const list = useVisualizationStore.getState().placedFurniture;
    expect(list.length).toBe(2);
    expect(list[1].name).toBe('Nordic Oak Sofa');
    expect(list[1].position[0]).toBeCloseTo(0.4, 2);
    expect(list[1].position[2]).toBeCloseTo(0.4, 2);
  });

  it('should reset furniture transform to default 1:1 scale and origin', () => {
    const store = useVisualizationStore.getState();
    store.updateFurnitureTransform('furn-test-1', [2.0, 0, -1.5], [0, 135, 0], [1.1, 1.1, 1.1]);
    
    store.resetFurnitureTransform('furn-test-1');
    const item = useVisualizationStore.getState().placedFurniture.find((f) => f.id === 'furn-test-1');
    expect(item?.position).toEqual([0, 0, 0]);
    expect(item?.rotation).toEqual([0, 0, 0]);
    expect(item?.scale).toEqual([1, 1, 1]);
    expect(item?.isLocked).toBe(false);
  });

  it('should deselect furniture and close controls when clicking empty space', () => {
    const store = useVisualizationStore.getState();
    expect(store.selectedFurnitureId).toBe('furn-test-1');

    store.selectFurniture(null);
    expect(useVisualizationStore.getState().selectedFurnitureId).toBeNull();
  });

  it('should delete selected furniture piece cleanly', () => {
    const store = useVisualizationStore.getState();
    store.removeFurniture('furn-test-1');

    expect(useVisualizationStore.getState().placedFurniture.length).toBe(0);
    expect(useVisualizationStore.getState().selectedFurnitureId).toBeNull();
  });
});
