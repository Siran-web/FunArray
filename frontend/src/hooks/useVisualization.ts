import { useVisualizationStore } from '../store/visualizationStore';

export function useVisualization() {
  const store = useVisualizationStore();

  return {
    roomImage: store.roomImage,
    placedFurniture: store.placedFurniture,
    selectedFurnitureId: store.selectedFurnitureId,
    setRoomImage: store.setRoomImage,
    addFurniture: store.addFurniture,
    updateFurnitureTransform: store.updateFurnitureTransform,
    removeFurniture: store.removeFurniture,
    selectFurniture: store.selectFurniture,
    clearScene: store.clearScene,
  };
}
