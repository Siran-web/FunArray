import * as THREE from 'three';
import { PlacedFurniture, FurnitureDimensions } from '../../types/visualization';
import { Product } from '../../types/product';

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const DEFAULT_ROOM_BOUNDS: RoomBounds = {
  minX: -4.5,
  maxX: 4.5,
  minZ: -4.5,
  maxZ: 4.5,
};

/**
 * Calculates grounded world coordinates for furniture placement.
 * Furniture base sits exactly at floorElevation without sinking or floating.
 */
export function calculateGroundedPlacement(
  x: number,
  z: number,
  floorElevation: number = 0,
  bounds: RoomBounds = DEFAULT_ROOM_BOUNDS
): [number, number, number] {
  const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, Math.round(x * 20) / 20));
  const clampedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, Math.round(z * 20) / 20));
  return [clampedX, floorElevation, clampedZ];
}

/**
 * Tests ray intersection against a calibrated horizontal floor plane.
 */
export function hitTestFloorPlane(
  raycaster: THREE.Raycaster,
  floorPlane: THREE.Plane,
  bounds: RoomBounds = DEFAULT_ROOM_BOUNDS
): [number, number, number] | null {
  const intersection = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(floorPlane, intersection);
  if (!hit) return null;

  return calculateGroundedPlacement(intersection.x, intersection.z, -floorPlane.constant, bounds);
}

/**
 * Factory helper: Converts a catalog Product into a standardized PlacedFurniture item.
 */
export function createPlacedFurnitureFromProduct(
  product: Product,
  initialPosition: [number, number, number] = [0, 0, 0]
): PlacedFurniture {
  return {
    id: `furn-${product.id}-${Date.now()}`,
    productId: product.id,
    name: product.name,
    price: product.basePrice,
    modelUrl: product.model3D?.modelUrl || '',
    previewImageUrl: product.images?.[0]?.imageUrl || '',
    position: initialPosition,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: product.dimensions || { widthCm: 100, heightCm: 80, depthCm: 80 },
    color: product.variants?.[0]?.color || 'grey',
    material: product.material || 'Solid Wood & Fabric',
    isLocked: false,
  };
}
