import { Address } from './address';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  sku?: string;
  color?: string;
  material?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPreview {
  items: Array<{
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
  }>;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  shippingAddress?: Address;
  eligibleForFreeShipping: boolean;
  freeShippingThreshold: number;
}
