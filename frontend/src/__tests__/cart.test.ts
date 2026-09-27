import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store/cartStore';
import { CartItem } from '../types/cart';

describe('Cart Flow & Store Calculations', () => {
  const itemA: CartItem = {
    id: 'item-1',
    productId: 'prod-1',
    name: 'Nordic Minimalist Oak Sofa',
    price: 48999,
    quantity: 1,
    imageUrl: 'https://example.com/sofa.jpg',
    selectedColor: 'Natural Oak / Sand Linen',
  };

  const itemB: CartItem = {
    id: 'item-2',
    productId: 'prod-2',
    name: 'Monolithic Travertine Coffee Table',
    price: 24500,
    quantity: 2,
    imageUrl: 'https://example.com/table.jpg',
    selectedColor: 'Honed Travertine',
  };

  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('should initialize with an empty cart and zero counts', () => {
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getTotalCount()).toBe(0);
    expect(state.getTotalAmount()).toBe(0);
  });

  it('should add items and compute correct total count for navbar badge', () => {
    useCartStore.getState().addItem(itemA);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getTotalCount()).toBe(1);
    expect(useCartStore.getState().getTotalAmount()).toBe(48999);

    useCartStore.getState().addItem(itemB);

    // 1 item A (qty 1) + 1 item B (qty 2) = 3 total items
    expect(useCartStore.getState().items).toHaveLength(2);
    expect(useCartStore.getState().getTotalCount()).toBe(3);
    expect(useCartStore.getState().getTotalAmount()).toBe(48999 + 24500 * 2);
  });

  it('should increment quantity when adding an identical item id', () => {
    useCartStore.getState().addItem(itemA);
    useCartStore.getState().addItem({ ...itemA, quantity: 2 });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(useCartStore.getState().getTotalCount()).toBe(3);
    expect(useCartStore.getState().getTotalAmount()).toBe(48999 * 3);
  });

  it('should update item quantity dynamically', () => {
    useCartStore.getState().addItem(itemA);
    useCartStore.getState().updateQuantity('item-1', 4);

    expect(useCartStore.getState().items[0].quantity).toBe(4);
    expect(useCartStore.getState().getTotalCount()).toBe(4);
    expect(useCartStore.getState().getTotalAmount()).toBe(48999 * 4);
  });

  it('should remove an item by id and update navbar badge count', () => {
    useCartStore.getState().addItem(itemA);
    useCartStore.getState().addItem(itemB);
    expect(useCartStore.getState().getTotalCount()).toBe(3);

    useCartStore.getState().removeItem('item-1');

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].id).toBe('item-2');
    expect(useCartStore.getState().getTotalCount()).toBe(2);
    expect(useCartStore.getState().getTotalAmount()).toBe(49000);
  });

  it('should clear the entire cart upon clearCart', () => {
    useCartStore.getState().addItem(itemA);
    useCartStore.getState().addItem(itemB);

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().getTotalCount()).toBe(0);
    expect(useCartStore.getState().getTotalAmount()).toBe(0);
  });
});
