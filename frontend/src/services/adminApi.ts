import { fetchWithAuth } from './api';
import { Product, ProductVariant, ProductImage, Furniture3DModel } from '@/types/product';
import { AddressDto } from '@/types/address';

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

export interface AdminInventoryItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  variantColor?: string;
  variantMaterial?: string;
  quantity: number;
  reserved: number;
  available: number;
  updatedAt: string;
  location?: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantSku?: string;
  variantColor?: string;
  variantMaterial?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: AddressDto;
  items: AdminOrderItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  channel?: 'ONLINE' | 'DELHI_SHOWROOM' | 'JALANDHAR_SHOWROOM';
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardMetrics> => {
    try {
      return await fetchWithAuth<AdminDashboardMetrics>('/admin/dashboard');
    } catch {
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
          id: 'usr-admin-1',
          email: 'funarray47@gmail.com',
          firstName: 'Atelier',
          lastName: 'Admin',
          phone: '+91 98765 43210',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          orderCount: 5,
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

  // ==================== Inventory (TICKET-034) ====================
  getInventory: async (params?: {
    page?: number;
    size?: number;
    query?: string;
    lowStockOnly?: boolean;
    threshold?: number;
  }): Promise<{ content: AdminInventoryItem[]; totalElements: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());
    if (params?.query) query.set('query', params.query);
    if (params?.lowStockOnly) query.set('lowStockOnly', 'true');
    if (params?.threshold) query.set('threshold', params.threshold.toString());

    try {
      const data = await fetchWithAuth<any>(`/inventory?${query.toString()}`);
      if (data && data.content) return data;
      return { content: data || [], totalElements: data?.length || 0, totalPages: 1 };
    } catch {
      // Fallback local inventory dataset
      return {
        content: [
          {
            id: 'inv-1',
            productId: '1',
            productName: 'Kanso Minimalist 3-Seater Sofa',
            variantId: 'var-1',
            variantSku: 'SOFA-KANSO-LINEN',
            variantColor: 'Oatmeal Linen',
            variantMaterial: 'Belgian Linen & Oak',
            quantity: 6,
            reserved: 4,
            available: 2,
            location: 'Central Warehouse & Delhi Flagship',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'inv-2',
            productId: '1',
            productName: 'Kanso Minimalist 3-Seater Sofa',
            variantId: 'var-2',
            variantSku: 'SOFA-KANSO-CHARCOAL',
            variantColor: 'Charcoal Weave',
            variantMaterial: 'Woven Wool & Walnut',
            quantity: 12,
            reserved: 3,
            available: 9,
            location: 'Central Warehouse',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'inv-3',
            productId: '2',
            productName: 'Neva Sculptural Lounge Chair',
            variantId: 'var-3',
            variantSku: 'CHR-NEVA-COGNAC',
            variantColor: 'Cognac Leather',
            variantMaterial: 'Full-Grain Leather & Walnut',
            quantity: 15,
            reserved: 2,
            available: 13,
            location: 'Jalandhar Gallery Showroom',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'inv-4',
            productId: '3',
            productName: 'Tusk Architectural Coffee Table',
            variantId: 'var-4',
            variantSku: 'TBL-TUSK-TRAV',
            variantColor: 'Roman Travertine',
            variantMaterial: 'Honed Travertine Marble',
            quantity: 8,
            reserved: 1,
            available: 7,
            location: 'Delhi Flagship Showroom',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'inv-5',
            productId: '4',
            productName: 'Voxel Modular Dining Table',
            variantId: 'var-5',
            variantSku: 'TBL-VOXEL-WAL',
            variantColor: 'American Walnut',
            variantMaterial: 'Solid Black Walnut',
            quantity: 3,
            reserved: 2,
            available: 1,
            location: 'Central Warehouse',
            updatedAt: new Date().toISOString(),
          },
        ],
        totalElements: 5,
        totalPages: 1,
      };
    }
  },

  updateVariantStock: (variantId: string, quantity: number) =>
    fetchWithAuth<AdminInventoryItem>(`/inventory/variant/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  adjustVariantStock: (variantId: string, adjustment: number, reason?: string) =>
    fetchWithAuth<AdminInventoryItem>(`/inventory/variant/${variantId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ adjustment, reason: reason || 'Stock reconciliation' }),
    }),

  // ==================== Orders (TICKET-035) ====================
  getOrders: async (params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<{ content: AdminOrder[]; totalElements: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);

    try {
      const data = await fetchWithAuth<any>(`/admin/orders?${query.toString()}`);
      if (data && data.content) return data;
      return { content: data || [], totalElements: data?.length || 0, totalPages: 1 };
    } catch {
      return {
        content: [
          {
            id: 'ord-1025',
            orderNumber: 'ORD-1025',
            status: 'CONFIRMED',
            subtotal: 78999,
            shippingFee: 0,
            tax: 6319.92,
            discount: 0,
            totalAmount: 85318.92,
            customerName: 'Aarav Sharma',
            customerEmail: 'aarav.sharma@example.com',
            customerPhone: '+91 98201 55667',
            paymentStatus: 'PAID',
            paymentMethod: 'RAZORPAY',
            channel: 'DELHI_SHOWROOM',
            shippingAddress: {
              id: 'addr-1',
              fullName: 'Aarav Sharma',
              phone: '+91 98201 55667',
              addressLine1: 'B-4/12 Vasant Vihar',
              addressLine2: 'Near Club Road',
              city: 'New Delhi',
              state: 'Delhi',
              postalCode: '110057',
              country: 'India',
              isDefault: true,
            },
            items: [
              {
                id: 'item-101',
                productId: '1',
                productName: 'Kanso Minimalist 3-Seater Sofa',
                variantSku: 'SOFA-KANSO-LINEN',
                variantColor: 'Oatmeal Linen',
                variantMaterial: 'Belgian Linen',
                imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
                quantity: 1,
                unitPrice: 78999,
                totalPrice: 78999,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ord-1024',
            orderNumber: 'ORD-1024',
            status: 'PROCESSING',
            subtotal: 34500,
            shippingFee: 0,
            tax: 2760,
            discount: 3450,
            totalAmount: 33810,
            customerName: 'Priya Patel',
            customerEmail: 'priya.patel@example.com',
            customerPhone: '+91 98112 33445',
            paymentStatus: 'PAID',
            paymentMethod: 'CREDIT_CARD',
            channel: 'ONLINE',
            shippingAddress: {
              id: 'addr-2',
              fullName: 'Priya Patel',
              phone: '+91 98112 33445',
              addressLine1: 'Flat 902, Tower 4, Prestige Palms',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560066',
              country: 'India',
              isDefault: true,
            },
            items: [
              {
                id: 'item-102',
                productId: '2',
                productName: 'Neva Sculptural Lounge Chair',
                variantSku: 'CHR-NEVA-COGNAC',
                variantColor: 'Cognac Leather',
                variantMaterial: 'Full-Grain Leather',
                imageUrl: 'https://images.unsplash.com/photo-1580481077195-c9a008c234a5?auto=format&fit=crop&w=600&q=80',
                quantity: 1,
                unitPrice: 34500,
                totalPrice: 34500,
              },
            ],
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'ord-1023',
            orderNumber: 'ORD-1023',
            status: 'SHIPPED',
            subtotal: 22000,
            shippingFee: 500,
            tax: 1760,
            discount: 0,
            totalAmount: 24260,
            customerName: 'Vikram Malhotra',
            customerEmail: 'vikram.m@example.com',
            customerPhone: '+91 98711 00998',
            paymentStatus: 'PAID',
            paymentMethod: 'RAZORPAY',
            channel: 'JALANDHAR_SHOWROOM',
            shippingAddress: {
              id: 'addr-3',
              fullName: 'Vikram Malhotra',
              phone: '+91 98711 00998',
              addressLine1: 'House 42, Model Town',
              city: 'Jalandhar',
              state: 'Punjab',
              postalCode: '144003',
              country: 'India',
              isDefault: true,
            },
            items: [
              {
                id: 'item-103',
                productId: '3',
                productName: 'Tusk Architectural Coffee Table',
                variantSku: 'TBL-TUSK-TRAV',
                variantColor: 'Travertine Marble',
                variantMaterial: 'Honed Marble',
                imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
                quantity: 1,
                unitPrice: 22000,
                totalPrice: 22000,
              },
            ],
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        totalElements: 3,
        totalPages: 1,
      };
    }
  },

  getOrderById: (orderId: string) =>
    fetchWithAuth<AdminOrder>(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: string, status: string, notes?: string) =>
    fetchWithAuth<AdminOrder>(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // ==================== Products CRUD ====================
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
