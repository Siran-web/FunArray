export interface FurnitureDimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

export interface PlacedFurniture {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  modelUrl: string;
  previewImageUrl?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  dimensions: FurnitureDimensions;
  color?: string;
  material?: string;
  isLocked?: boolean;
}

export interface RoomImageRecord {
  id: string;
  userId?: string;
  name: string;
  imageUrl: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt?: string;
}

export interface VisualizationSession {
  id: string;
  userId?: string;
  roomImageId?: string;
  roomImageUrl?: string;
  name: string;
  sceneData: string;
  createdAt?: string;
  updatedAt?: string;
}
