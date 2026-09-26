import { fetchWithAuth } from './api';
import { Order } from '../types/order';

export const orderApi = {
  getOrders: () => fetchWithAuth<Order[]>('/orders'),
  getOrderById: (id: string) => fetchWithAuth<Order>(`/orders/${id}`),
  createOrder: (payload: { shippingAddressId: string; paymentMethod: string }) =>
    fetchWithAuth<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
