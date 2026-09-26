import { useCartStore } from '../store/cartStore';

export function useCart() {
  const store = useCartStore();

  return {
    items: store.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    totalCount: store.getTotalCount(),
    totalAmount: store.getTotalAmount(),
  };
}
