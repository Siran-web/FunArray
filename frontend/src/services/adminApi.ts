import { fetchWithAuth } from './api';
import { Product, ProductVariant, ProductImage, Furniture3DModel } from '@/types/product';

export interface AdminDashboardMetrics {
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
  totalCustomers: number;
  totalCategories: number;
  total3DModels: number;
  lowStockCount: number;
  pendingFulfillments: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }>;
}

export interface AdminCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  orderCount: number;
}

export interface AdminAsset {
  id: string;
  productId: string;
  productName: string;
  modelUrl: string;
  thumbnailUrl?: string;
  format: string;
  fileSize?: number;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  version: number;
  status: string;
  createdAt: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description: string;
  sku: string;
  categoryId: string;
  basePrice: number;
  material: string;
  brand?: string;
  dimensions: {
    widthCm: number;
    heightCm: number;
    depthCm: number;
    weightKg?: number;
  };
  tags?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {}

export interface AddImagePayload {
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  viewType?: string;
  sortOrder?: number;
}

export interface SaveModelPayload {
  modelUrl: string;
  thumbnailUrl?: string;
  format?: string;
  fileSize?: number;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  version?: number;
  status?: string;
}

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardMetrics> => {
    try {
      return await fetchWithAuth<AdminDashboardMetrics>('/admin/dashboard');
    } catch {
      // Fallback metrics when offline or in demo mode
      return {
        totalSales: 245000,
        totalOrders: 42,
        activeProducts: 85,
        totalCustomers: 27,
        totalCategories: 8,
        total3DModels: 6,
        lowStockCount: 8,
        pendingFulfillments: 7,
        recentOrders: [
          {
            id: 'ord-1025',
            orderNumber: 'ORD-1025',
            totalAmount: 78999,
            status: 'CONFIRMED',
            createdAt: new Date().toISOString(),
            itemCount: 1,
          },
          {
            id: 'ord-1024',
            orderNumber: 'ORD-1024',
            totalAmount: 34500,
            status: 'CONFIRMED',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            itemCount: 2,
          },
          {
            id: 'ord-1023',
            orderNumber: 'ORD-1023',
            totalAmount: 22000,
            status: 'PROCESSING',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            itemCount: 1,
          },
        ],
      };
    }
  },

  getCustomers: async (): Promise<AdminCustomer[]> => {
    try {
      return await fetchWithAuth<AdminCustomer[]>('/admin/customers');
    } catch {
      return [
        {
          id: 'usr-1',
          email: 'admin@furniture.com',
          firstName: 'Design',
          lastName: 'Administrator',
          phone: '+91 98765 43210',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          orderCount: 3,
        },
        {
          id: 'usr-2',
          email: 'rohan.deshmukh@example.com',
          firstName: 'Rohan',
          lastName: 'Deshmukh',
          phone: '+91 98200 12345',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
          orderCount: 4,
        },
        {
          id: 'usr-3',
          email: 'ananya.sharma@example.com',
          firstName: 'Ananya',
          lastName: 'Sharma',
          phone: '+91 98111 22334',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          orderCount: 1,
        },
      ];
    }
  },

  getAssets: async (): Promise<AdminAsset[]> => {
    try {
      return await fetchWithAuth<AdminAsset[]>('/admin/assets');
    } catch {
      return [
        {
          id: 'ast-1',
          productId: '1',
          productName: 'Kanso Minimalist 3-Seater Sofa',
          modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          format: 'glb',
          fileSize: 4200000,
          widthCm: 220,
          heightCm: 82,
          depthCm: 95,
          version: 1,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ast-2',
          productId: '2',
          productName: 'Neva Sculptural Lounge Chair',
          modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
          thumbnailUrl: 'https://images.unsplash.com/photo-1580481077195-c9a008c234a5',
          format: 'glb',
          fileSize: 2800000,
          widthCm: 84,
          heightCm: 76,
          depthCm: 88,
          version: 1,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  // Product Operations
  createProduct: (payload: CreateProductPayload) =>
    fetchWithAuth<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: UpdateProductPayload) =>
    fetchWithAuth<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    fetchWithAuth<void>(`/products/${id}`, {
      method: 'DELETE',
    }),

  updateProductStatus: (id: string, status: string) =>
    fetchWithAuth<Product>(`/products/${id}/status?status=${status}`, {
      method: 'PATCH',
    }),

  // Images
  addProductImage: (productId: string, payload: AddImagePayload) =>
    fetchWithAuth<ProductImage>(`/products/${productId}/images`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteProductImage: (productId: string, imageId: string) =>
    fetchWithAuth<void>(`/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    }),

  setPrimaryImage: (productId: string, imageId: string) =>
    fetchWithAuth<ProductImage>(`/products/${productId}/images/${imageId}/primary`, {
      method: 'PUT',
    }),

  // 3D Models
  saveProductModel: (productId: string, payload: SaveModelPayload) =>
    fetchWithAuth<Furniture3DModel>(`/products/${productId}/model`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteProductModel: (productId: string) =>
    fetchWithAuth<void>(`/products/${productId}/model`, {
      method: 'DELETE',
    }),

  // Categories
  createCategory: (payload: CreateCategoryPayload) =>
    fetchWithAuth<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: string, payload: UpdateCategoryPayload) =>
    fetchWithAuth<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: string) =>
    fetchWithAuth<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};
