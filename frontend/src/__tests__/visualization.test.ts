import { describe, it, expect, beforeEach } from 'vitest';
import { useVisualizationStore } from '../store/visualizationStore';
import { PlacedFurniture } from '../types/visualization';

describe('Visualization Controls & 3D/AR State Behavior', () => {
  const sampleFurniture: PlacedFurniture = {
    id: 'placed-item-1',
    productId: 'prod-chair-01',
    name: 'Architectural Lounge Chair',
    price: 28500,
    modelUrl: '/models/lounge-chair.glb',
    position: [0, 0, 0],
    rotation: [0, Math.PI / 4, 0],
    scale: [1, 1, 1],
    color: 'Sand Linen',
    dimensions: {
      widthCm: 85,
      heightCm: 76,
      depthCm: 88,
    },
  };

  beforeEach(() => {
    useVisualizationStore.getState().clearScene();
  });

  it('should initialize with default visualization environment settings', () => {
    const state = useVisualizationStore.getState();
    expect(state.placedFurniture).toHaveLength(0);
    expect(state.selectedFurnitureId).toBeNull();
    expect(state.lightingMode).toBe('warm');
    expect(state.showGrid).toBe(true);
    expect(state.showShadows).toBe(true);
  });

  it('should add furniture to scene and automatically select it', () => {
    useVisualizationStore.getState().addFurniture(sampleFurniture);

    const state = useVisualizationStore.getState();
    expect(state.placedFurniture).toHaveLength(1);
    expect(state.selectedFurnitureId).toBe(sampleFurniture.id);
  });

  it('should update 3D transform position, rotation, and scale constraints', () => {
    useVisualizationStore.getState().addFurniture(sampleFurniture);

    const newPos: [number, number, number] = [1.5, 0.0, -2.0];
    const newRot: [number, number, number] = [0, Math.PI, 0];
    const newScale: [number, number, number] = [1.2, 1.2, 1.2];

    useVisualizationStore.getState().updateFurnitureTransform(
      sampleFurniture.id,
      newPos,
      newRot,
      newScale
    );

    const item = useVisualizationStore.getState().placedFurniture[0];
    expect(item.position).toEqual(newPos);
    expect(item.rotation).toEqual(newRot);
    expect(item.scale).toEqual(newScale);
  });

  it('should duplicate placed furniture with positional offset', () => {
    useVisualizationStore.getState().addFurniture(sampleFurniture);
    useVisualizationStore.getState().duplicateFurniture(sampleFurniture.id);

    const state = useVisualizationStore.getState();
    expect(state.placedFurniture).toHaveLength(2);
    expect(state.selectedFurnitureId).not.toBe(sampleFurniture.id);
    expect(state.placedFurniture[1].name).toBe(sampleFurniture.name);
  });

  it('should toggle lighting modes (warm, studio, daylight)', () => {
    useVisualizationStore.getState().setLightingMode('studio');
    expect(useVisualizationStore.getState().lightingMode).toBe('studio');

    useVisualizationStore.getState().setLightingMode('daylight');
    expect(useVisualizationStore.getState().lightingMode).toBe('daylight');
  });

  it('should toggle floor grid and shadows helpers', () => {
    expect(useVisualizationStore.getState().showGrid).toBe(true);
    useVisualizationStore.getState().toggleGrid();
    expect(useVisualizationStore.getState().showGrid).toBe(false);

    expect(useVisualizationStore.getState().showShadows).toBe(true);
    useVisualizationStore.getState().toggleShadows();
    expect(useVisualizationStore.getState().showShadows).toBe(false);
  });

  it('should remove selected furniture and clear selection', () => {
    useVisualizationStore.getState().addFurniture(sampleFurniture);
    expect(useVisualizationStore.getState().placedFurniture).toHaveLength(1);

    useVisualizationStore.getState().removeFurniture(sampleFurniture.id);
    expect(useVisualizationStore.getState().placedFurniture).toHaveLength(0);
    expect(useVisualizationStore.getState().selectedFurnitureId).toBeNull();
  });
});
