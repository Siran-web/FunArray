import { useWishlistStore, WishlistItem } from '../store/wishlistStore';
import { Product } from '../types/product';

export function useWishlist() {
  const items = useWishlistStore((state) => state.items);
  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const totalCount = useWishlistStore((state) => state.getTotalCount());

  return {
    items,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    totalCount,
  };
}

export default useWishlist;
