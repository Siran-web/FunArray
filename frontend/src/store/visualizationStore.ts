import { create } from 'zustand';
import { PlacedFurniture } from '../types/visualization';

export interface FloorAlignmentConfig {
  elevation: number;        // Floor Y offset in meters (-1.0 to 1.0 m)
  pitchAngle: number;       // Camera pitch angle in degrees (-30 to +30 deg)
  cameraFov: number;        // Camera FOV matching photo lens (30 to 75 deg)
  cameraHeight: number;     // Camera height in meters (0.8 to 2.5 m)
  depthScale: number;       // Depth scale factor (0.5 to 2.0)
  horizonY: number;         // 2D horizon line position (0 to 100%)
  isCalibrated: boolean;    // User confirmed calibration
  isAdjusting: boolean;     // Active in "Adjust Floor" mode
}

export const DEFAULT_FLOOR_ALIGNMENT: FloorAlignmentConfig = {
  elevation: 0,
  pitchAngle: 0,
  cameraFov: 40,
  cameraHeight: 1.35,
  depthScale: 1.0,
  horizonY: 55,
  isCalibrated: false,
  isAdjusting: false,
};

export type VisualizationViewMode = 'room-photo' | 'camera-ar' | 'studio';

interface VisualizationState {
  roomImage: string | null;
  roomImageId: string | null;
  roomName: string;
  viewMode: VisualizationViewMode;
  placedFurniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  lightingMode: 'warm' | 'studio' | 'daylight';
  showGrid: boolean;
  showShadows: boolean;
  designName: string;
  currentDesignId: string | null;
  floorAlignment: FloorAlignmentConfig;

  setViewMode: (mode: VisualizationViewMode) => void;
  setRoomImage: (url: string | null, id?: string | null, name?: string) => void;
  setDesignName: (name: string) => void;
  setCurrentDesignId: (id: string | null) => void;
  setFloorAlignment: (config: Partial<FloorAlignmentConfig>) => void;
  startFloorAdjustment: () => void;
  confirmFloorAdjustment: () => void;
  resetFloorAlignment: () => void;
  addFurniture: (item: PlacedFurniture) => void;
  setProductForVisualization: (product: any) => void;
  updateFurnitureTransform: (
    id: string,
    position?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number]
  ) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  duplicateFurniture: (id: string) => void;
  toggleLockFurniture: (id: string) => void;
  resetFurnitureTransform: (id: string) => void;
  setLightingMode: (mode: 'warm' | 'studio' | 'daylight') => void;
  toggleGrid: () => void;
  toggleShadows: () => void;
  clearScene: () => void;
  loadScene: (furniture: PlacedFurniture[], roomImage?: string | null, roomImageId?: string | null, floorAlignment?: FloorAlignmentConfig) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  roomImage: null,
  roomImageId: null,
  roomName: 'My Custom Room',
  designName: 'Living Room',
  currentDesignId: null,
  viewMode: 'studio',
  placedFurniture: [],
  selectedFurnitureId: null,
  lightingMode: 'warm',
  showGrid: true,
  showShadows: true,
  floorAlignment: DEFAULT_FLOOR_ALIGNMENT,

  setViewMode: (mode) => set({ viewMode: mode }),

  setRoomImage: (url, id = null, name = 'My Custom Room') =>
    set((state) => ({
      roomImage: url,
      roomImageId: id,
      roomName: name,
      viewMode: url ? 'room-photo' : state.viewMode,
      // When a new room image is set, prompt floor alignment if not already calibrated
      floorAlignment: url
        ? { ...state.floorAlignment, isAdjusting: !state.floorAlignment.isCalibrated }
        : DEFAULT_FLOOR_ALIGNMENT,
    })),
  setDesignName: (name) => set({ designName: name }),
  setCurrentDesignId: (id) => set({ currentDesignId: id }),

  setFloorAlignment: (config) =>
    set((state) => ({
      floorAlignment: { ...state.floorAlignment, ...config },
    })),

  startFloorAdjustment: () =>
    set((state) => ({
      floorAlignment: { ...state.floorAlignment, isAdjusting: true },
    })),

  confirmFloorAdjustment: () =>
    set((state) => ({
      floorAlignment: { ...state.floorAlignment, isAdjusting: false, isCalibrated: true },
    })),

  resetFloorAlignment: () =>
    set({
      floorAlignment: DEFAULT_FLOOR_ALIGNMENT,
    }),

  setProductForVisualization: (product) =>
    set((state) => {
      if (!product) return state;
      const itemId = `furn-${product.id}`;
      const existing = state.placedFurniture.find((f) => f.productId === product.id || f.id === itemId);

      if (existing) {
        return {
          selectedFurnitureId: existing.id,
        };
      }

      const newItem: PlacedFurniture = {
        id: itemId,
        productId: product.id,
        name: product.name,
        price: product.basePrice || product.price || 0,
        modelUrl: product.model3D?.modelUrl || product.modelUrl || '',
        previewImageUrl: product.images?.[0]?.imageUrl || product.previewImageUrl || '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: product.dimensions || { widthCm: 100, heightCm: 80, depthCm: 80 },
        color: product.variants?.[0]?.color || product.color || 'grey',
        material: product.material || 'Standard PBR',
        isLocked: false,
      };

      return {
        placedFurniture: [...state.placedFurniture, newItem],
        selectedFurnitureId: newItem.id,
      };
    }),

  addFurniture: (item) =>
    set((state) => {
      // Calculate offset so new items don't overlap exactly
      const offsetIndex = state.placedFurniture.length;
      const initialPos: [number, number, number] = [
        item.position[0] + (offsetIndex % 3) * 0.6 - 0.6,
        item.position[1],
        item.position[2] + Math.floor(offsetIndex / 3) * 0.6,
      ];
      const newItem = { ...item, position: initialPos };
      return {
        placedFurniture: [...state.placedFurniture, newItem],
        selectedFurnitureId: newItem.id,
      };
    }),

  updateFurnitureTransform: (id, position, rotation, scale) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) => {
        if (f.id !== id) return f;
        if (f.isLocked) return f; // Locked furniture cannot accidentally move or rotate
        return {
          ...f,
          position: position ?? f.position,
          rotation: rotation ?? f.rotation,
          scale: scale ?? f.scale,
        };
      }),
    })),

  removeFurniture: (id) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.filter((f) => f.id !== id),
      selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
    })),

  selectFurniture: (id) => set({ selectedFurnitureId: id }),

  duplicateFurniture: (id) =>
    set((state) => {
      const source = state.placedFurniture.find((f) => f.id === id);
      if (!source) return state;

      const duplicate: PlacedFurniture = {
        ...source,
        id: `furniture-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        position: [source.position[0] + 0.4, source.position[1], source.position[2] + 0.4],
        isLocked: false,
      };

      return {
        placedFurniture: [...state.placedFurniture, duplicate],
        selectedFurnitureId: duplicate.id,
      };
    }),

  toggleLockFurniture: (id) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id ? { ...f, isLocked: !f.isLocked } : f
      ),
    })),

  resetFurnitureTransform: (id) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id
          ? {
              ...f,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              isLocked: false,
            }
          : f
      ),
    })),

  setLightingMode: (lightingMode) => set({ lightingMode }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleShadows: () => set((state) => ({ showShadows: !state.showShadows })),
  clearScene: () => set({ placedFurniture: [], selectedFurnitureId: null }),
  loadScene: (furniture, roomImage = null, roomImageId = null, floorAlignment) =>
    set({
      placedFurniture: furniture,
      roomImage: roomImage,
      roomImageId: roomImageId,
      selectedFurnitureId: furniture.length > 0 ? furniture[0].id : null,
      floorAlignment: floorAlignment || DEFAULT_FLOOR_ALIGNMENT,
    }),
}));
