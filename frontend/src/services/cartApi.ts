import { fetchWithAuth } from './api';
import { Cart, CartItem } from '../types/cart';

export const cartApi = {
  getCart: () => fetchWithAuth<Cart>('/cart'),
  addItem: (item: { productId: string; variantId?: string; quantity: number }) =>
    fetchWithAuth<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  updateItemQuantity: (itemId: string, quantity: number) =>
    fetchWithAuth<Cart>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId: string) =>
    fetchWithAuth<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    fetchWithAuth<{ message: string }>('/cart', {
      method: 'DELETE',
    }),
};
