import { create } from 'zustand';
import { PlacedFurniture } from '../types/visualization';

interface VisualizationState {
  roomImage: string | null;
  placedFurniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  setRoomImage: (url: string | null) => void;
  addFurniture: (item: PlacedFurniture) => void;
  updateFurnitureTransform: (id: string, position?: [number, number, number], rotation?: [number, number, number]) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  clearScene: () => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  roomImage: null,
  placedFurniture: [],
  selectedFurnitureId: null,
  setRoomImage: (roomImage) => set({ roomImage }),
  addFurniture: (item) =>
    set((state) => ({ placedFurniture: [...state.placedFurniture, item], selectedFurnitureId: item.id })),
  updateFurnitureTransform: (id, position, rotation) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id
          ? {
              ...f,
              position: position || f.position,
              rotation: rotation || f.rotation,
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
  clearScene: () => set({ placedFurniture: [], selectedFurnitureId: null, roomImage: null }),
}));
