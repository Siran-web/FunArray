import { create } from 'zustand';
import { Product } from '../types/product';

export interface WishlistItem {
  id: string;
  name: string;
  slug?: string;
  price: number;
  imageUrl: string;
  categoryName?: string;
  dimensions?: {
    widthCm: number;
    heightCm: number;
    depthCm: number;
  };
  arSupported?: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (product: WishlistItem | Product) => void;
  removeItem: (id: string) => void;
  toggleItem: (product: WishlistItem | Product) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  getTotalCount: () => number;
}

const getStoredWishlist = (): WishlistItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('funarray_wishlist');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (items: WishlistItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('funarray_wishlist', JSON.stringify(items));
  } catch {}
};

const mapToWishlistItem = (item: WishlistItem | Product): WishlistItem => {
  const p = item as Product;
  if ('images' in p && Array.isArray(p.images)) {
    const primaryImg = p.images.find((img) => img.isPrimary)?.imageUrl ||
      p.images[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: typeof p.basePrice === 'number' ? p.basePrice : Number(p.basePrice) || 0,
      imageUrl: primaryImg,
      categoryName: p.categoryName || 'Furniture',
      dimensions: p.dimensions,
      arSupported: p.arSupported,
    };
  }
  return item as WishlistItem;
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: getStoredWishlist(),
  addItem: (item) =>
    set((state) => {
      const mapped = mapToWishlistItem(item);
      if (state.items.some((i) => i.id === mapped.id)) {
        return state;
      }
      const updated = [...state.items, mapped];
      saveWishlist(updated);
      return { items: updated };
    }),
  removeItem: (id) =>
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      saveWishlist(updated);
      return { items: updated };
    }),
  toggleItem: (item) => {
    const id = item.id;
    const exists = get().items.some((i) => i.id === id);
    if (exists) {
      get().removeItem(id);
    } else {
      get().addItem(item);
    }
  },
  isInWishlist: (id) => get().items.some((i) => i.id === id),
  clearWishlist: () => {
    saveWishlist([]);
    set({ items: [] });
  },
  getTotalCount: () => get().items.length,
}));
