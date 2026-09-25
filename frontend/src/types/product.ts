export interface Dimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Furniture3DModel {
  id: string;
  modelUrl: string;
  thumbnailUrl?: string;
  format: "glb" | "gltf";
  fileSize?: number;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  version: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  material: string;
  price: number;
  stockQuantity: number;
  status: "ACTIVE" | "DISCONTINUED";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  basePrice: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  material: string;
  weight?: number;
  dimensions: Dimensions;
  sku: string;
  categoryId: string;
  categoryName?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  model3D?: Furniture3DModel;
  rating: number;
  reviewCount: number;
  availableOnline: boolean;
  arSupported: boolean;
}
