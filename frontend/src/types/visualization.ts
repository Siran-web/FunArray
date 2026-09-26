export interface PlacedFurniture {
  id: string;
  productId: string;
  modelUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: {
    widthCm: number;
    heightCm: number;
    depthCm: number;
  };
}

export interface VisualizationSession {
  id: string;
  userId: string;
  roomImageUrl?: string;
  furniture: PlacedFurniture[];
  createdAt: string;
}
