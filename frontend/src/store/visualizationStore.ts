import { create } from 'zustand';
import { PlacedFurniture } from '../types/visualization';

interface VisualizationState {
  roomImage: string | null;
  roomImageId: string | null;
  roomName: string;
  placedFurniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  lightingMode: 'warm' | 'studio' | 'daylight';
  showGrid: boolean;
  showShadows: boolean;

  setRoomImage: (url: string | null, id?: string | null, name?: string) => void;
  addFurniture: (item: PlacedFurniture) => void;
  updateFurnitureTransform: (
    id: string,
    position?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number]
  ) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  duplicateFurniture: (id: string) => void;
  setLightingMode: (mode: 'warm' | 'studio' | 'daylight') => void;
  toggleGrid: () => void;
  toggleShadows: () => void;
  clearScene: () => void;
  loadScene: (furniture: PlacedFurniture[], roomImage?: string | null, roomImageId?: string | null) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  roomImage: null,
  roomImageId: null,
  roomName: 'My Custom Room',
  placedFurniture: [],
  selectedFurnitureId: null,
  lightingMode: 'warm',
  showGrid: true,
  showShadows: true,

  setRoomImage: (url, id = null, name = 'My Custom Room') =>
    set({ roomImage: url, roomImageId: id, roomName: name }),

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
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id
          ? {
              ...f,
              position: position ?? f.position,
              rotation: rotation ?? f.rotation,
              scale: scale ?? f.scale,
            }
          : f
      ),
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
      };

      return {
        placedFurniture: [...state.placedFurniture, duplicate],
        selectedFurnitureId: duplicate.id,
      };
    }),

  setLightingMode: (lightingMode) => set({ lightingMode }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleShadows: () => set((state) => ({ showShadows: !state.showShadows })),
  clearScene: () => set({ placedFurniture: [], selectedFurnitureId: null }),
  loadScene: (furniture, roomImage = null, roomImageId = null) =>
    set({
      placedFurniture: furniture,
      roomImage: roomImage,
      roomImageId: roomImageId,
      selectedFurnitureId: furniture.length > 0 ? furniture[0].id : null,
    }),
}));
