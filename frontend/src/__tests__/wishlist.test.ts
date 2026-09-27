import { describe, it, expect, beforeEach } from 'vitest';
import { useWishlistStore, WishlistItem } from '../store/wishlistStore';
import { Product } from '../types/product';

describe('Wishlist Flow & Live Badge Synchronization', () => {
  const mockProduct: Product = {
    id: 'prod-chair-01',
    name: 'Curved Bouclé Accent Lounge Chair',
    slug: 'curved-boucle-chair',
    description: 'Sculptural lounge chair upholstered in organic heavy bouclé.',
    basePrice: 28500,
    material: 'European Oak & Bouclé',
    brand: 'FunArray Studio',
    sku: 'FNA-BOU-001',
    status: 'ACTIVE',
    categoryId: 'cat-chairs',
    availableOnline: true,
    arSupported: true,
    rating: 4.9,
    reviewCount: 42,
    dimensions: {
      widthCm: 85,
      heightCm: 76,
      depthCm: 88,
    },
    images: [
      {
        id: 'img-1',
        imageUrl: 'https://example.com/boucle-chair.jpg',
        altText: 'Lounge Chair',
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    variants: [
      {
        id: 'var-1',
        color: 'Cream Bouclé',
        material: 'Bouclé Fabric',
        sku: 'FNA-BOU-CRM',
        price: 28500,
        stockQuantity: 12,
        status: 'ACTIVE',
      },
    ],
  };

  const simpleItem: WishlistItem = {
    id: 'item-lamp-01',
    name: 'Architectural Marble Table Lamp',
    price: 9800,
    imageUrl: 'https://example.com/lamp.jpg',
    categoryName: 'Lighting',
  };

  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('should initialize with an empty wishlist', () => {
    expect(useWishlistStore.getState().items).toHaveLength(0);
    expect(useWishlistStore.getState().getTotalCount()).toBe(0);
  });

  it('should add a product and accurately format it to WishlistItem', () => {
    useWishlistStore.getState().addItem(mockProduct);

    const items = useWishlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('prod-chair-01');
    expect(items[0].name).toBe('Curved Bouclé Accent Lounge Chair');
    expect(items[0].price).toBe(28500);
    expect(items[0].imageUrl).toBe('https://example.com/boucle-chair.jpg');
    expect(items[0].arSupported).toBe(true);
    expect(useWishlistStore.getState().getTotalCount()).toBe(1);
  });

  it('should not add duplicate items with the same id', () => {
    useWishlistStore.getState().addItem(mockProduct);
    useWishlistStore.getState().addItem(mockProduct);

    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useWishlistStore.getState().getTotalCount()).toBe(1);
  });

  it('should toggle item in and out of wishlist', () => {
    expect(useWishlistStore.getState().isInWishlist(mockProduct.id)).toBe(false);

    // First toggle: adds item
    useWishlistStore.getState().toggleItem(mockProduct);
    expect(useWishlistStore.getState().isInWishlist(mockProduct.id)).toBe(true);
    expect(useWishlistStore.getState().getTotalCount()).toBe(1);

    // Second toggle: removes item
    useWishlistStore.getState().toggleItem(mockProduct);
    expect(useWishlistStore.getState().isInWishlist(mockProduct.id)).toBe(false);
    expect(useWishlistStore.getState().getTotalCount()).toBe(0);
  });

  it('should support multiple unique items and removal by id', () => {
    useWishlistStore.getState().addItem(mockProduct);
    useWishlistStore.getState().addItem(simpleItem);

    expect(useWishlistStore.getState().getTotalCount()).toBe(2);

    useWishlistStore.getState().removeItem(mockProduct.id);

    expect(useWishlistStore.getState().getTotalCount()).toBe(1);
    expect(useWishlistStore.getState().items[0].id).toBe('item-lamp-01');
  });

  it('should clear all wishlist items', () => {
    useWishlistStore.getState().addItem(mockProduct);
    useWishlistStore.getState().addItem(simpleItem);

    useWishlistStore.getState().clearWishlist();

    expect(useWishlistStore.getState().items).toHaveLength(0);
    expect(useWishlistStore.getState().getTotalCount()).toBe(0);
  });
});
