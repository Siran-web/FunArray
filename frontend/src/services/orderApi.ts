import { fetchWithAuth } from './api';
import { Order, CheckoutPreview } from '../types/order';

export interface CheckoutPayload {
  shippingAddressId: string;
  paymentMethod?: string;
  notes?: string;
  couponCode?: string;
}

export const orderApi = {
  previewCheckout: (shippingAddressId?: string, couponCode?: string) => {
    const params = new URLSearchParams();
    if (shippingAddressId) params.append('shippingAddressId', shippingAddressId);
    if (couponCode) params.append('couponCode', couponCode);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth<CheckoutPreview>(`/checkout/preview${query}`);
  },

  checkout: (payload: CheckoutPayload) =>
    fetchWithAuth<Order>('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrders: () => fetchWithAuth<Order[]>('/orders'),

  getOrderById: (id: string) => fetchWithAuth<Order>(`/orders/${id}`),

  cancelOrder: (id: string) =>
    fetchWithAuth<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
    }),
};
