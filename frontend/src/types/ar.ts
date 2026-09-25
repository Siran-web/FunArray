export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlacedFurnitureObject {
  productId: string;
  variantId?: string;
  modelUrl: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: number; // Constrained scale preserving actual dimensions
}

export interface RoomVisualizationSession {
  id: string;
  userId?: string;
  name: string;
  roomImageUrl: string;
  roomWidthCm?: number;
  roomLengthCm?: number;
  objects: PlacedFurnitureObject[];
  createdAt: string;
  updatedAt: string;
}
