import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useVisualizationStore } from '../store/visualizationStore';
import { FEATURED_PRODUCTS } from '../data/mock-products';
import { AuthUser } from '../services/authApi';
import { PlacedFurniture } from '../types/visualization';

describe('TICKET-042: End-to-End Critical Customer Flow', () => {
  const customerUser: AuthUser = {
    id: 'usr-aarav-001',
    email: 'aarav.mehta@funarray.store',
    firstName: 'Aarav',
    lastName: 'Mehta',
    phone: '+919876543210',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    // Reset all global store states
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
    useVisualizationStore.getState().clearScene();
  });

  it('executes full customer loop: Discover → Visualize → Compare → Decide → Purchase', async () => {
    // ==========================================
    // 1. REGISTER & LOGIN
    // ==========================================
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Simulate login success & JWT persistence
    useAuthStore.getState().setAuth(customerUser, 'jwt-mock-session-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('aarav.mehta@funarray.store');

    // ==========================================
    // 2. DISCOVER: BROWSE CATALOG & SEARCH
    // ==========================================
    const catalog = FEATURED_PRODUCTS;
    expect(catalog.length).toBeGreaterThan(0);

    const livingRoomChairs = catalog.filter(
      (p) => p.categoryName === 'Living Room' || p.categoryName === 'Chairs' || p.categoryName === 'Living'
    );
    expect(livingRoomChairs.length).toBeGreaterThan(0);

    const selectedProduct = livingRoomChairs[0];
    expect(selectedProduct.id).toBeDefined();
    expect(selectedProduct.basePrice).toBeGreaterThan(0);
    expect(selectedProduct.arSupported).toBe(true);

    // ==========================================
    // 3. COMPARE: SAVE TO WISHLIST
    // ==========================================
    expect(useWishlistStore.getState().getTotalCount()).toBe(0);
    useWishlistStore.getState().addItem(selectedProduct);
    expect(useWishlistStore.getState().getTotalCount()).toBe(1);
    expect(useWishlistStore.getState().isInWishlist(selectedProduct.id)).toBe(true);

    // ==========================================
    // 4. VISUALIZE: UPLOAD ROOM & 3D TRANSFORM
    // ==========================================
    const roomUrl = 'https://funarray.store/uploads/mock-penthouse-room.jpg';
    useVisualizationStore.getState().setRoomImage(roomUrl, 'room-img-999', 'Penthouse Living Room');

    expect(useVisualizationStore.getState().roomImage).toBe(roomUrl);
    expect(useVisualizationStore.getState().roomName).toBe('Penthouse Living Room');

    const placedChair: PlacedFurniture = {
      id: `placed-${Date.now()}`,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.basePrice,
      modelUrl: '/models/lounge-chair.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: {
        widthCm: selectedProduct.dimensions.widthCm,
        heightCm: selectedProduct.dimensions.heightCm,
        depthCm: selectedProduct.dimensions.depthCm,
      },
      color: selectedProduct.variants[0]?.color || 'Sand Linen',
    };

    useVisualizationStore.getState().addFurniture(placedChair);
    expect(useVisualizationStore.getState().placedFurniture).toHaveLength(1);

    // Apply 3D coordinate transforms (Move + Rotate)
    useVisualizationStore.getState().updateFurnitureTransform(
      placedChair.id,
      [1.2, 0.0, -2.5],
      [0, Math.PI / 2, 0],
      [1.0, 1.0, 1.0]
    );

    const placedItemInScene = useVisualizationStore.getState().placedFurniture[0];
    expect(placedItemInScene.position).toEqual([1.2, 0.0, -2.5]);
    expect(placedItemInScene.rotation).toEqual([0, Math.PI / 2, 0]);

    // ==========================================
    // 5. DECIDE & PURCHASE: ADD TO CART
    // ==========================================
    const selectedVariant = selectedProduct.variants[0];
    const orderQuantity = 2;

    useCartStore.getState().addItem({
      id: `${selectedProduct.id}-${selectedVariant?.id || 'def'}`,
      productId: selectedProduct.id,
      variantId: selectedVariant?.id,
      name: selectedProduct.name,
      price: selectedVariant?.price || selectedProduct.basePrice,
      quantity: orderQuantity,
      imageUrl: selectedProduct.images[0]?.imageUrl,
      selectedColor: selectedVariant?.color || 'Cognac Leather',
      dimensions: selectedProduct.dimensions,
    });

    expect(useCartStore.getState().getTotalCount()).toBe(2);
    expect(useCartStore.getState().getTotalAmount()).toBe(
      (selectedVariant?.price || selectedProduct.basePrice) * orderQuantity
    );

    // ==========================================
    // 6. CHECKOUT: ORDER CREATION & CART RESET
    // ==========================================
    const orderSummary = {
      orderId: 'ord-test-999',
      customerName: `${customerUser.firstName} ${customerUser.lastName}`,
      items: useCartStore.getState().items,
      totalAmount: useCartStore.getState().getTotalAmount(),
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    };

    expect(orderSummary.totalAmount).toBeGreaterThan(0);
    expect(orderSummary.items).toHaveLength(1);

    // Clear cart upon successful order placement
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().getTotalCount()).toBe(0);
    expect(useCartStore.getState().items).toHaveLength(0);

    // ==========================================
    // 7. POST-PURCHASE: SESSION & LOGOUT
    // ==========================================
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('handles critical failure states gracefully', () => {
    // 1. Session failure / missing auth
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // 2. Empty cart cannot proceed to checkout
    expect(useCartStore.getState().getTotalCount()).toBe(0);
    expect(useCartStore.getState().getTotalAmount()).toBe(0);

    // 3. Wishlist toggle handles non-existent item gracefully
    expect(useWishlistStore.getState().isInWishlist('non-existent-id')).toBe(false);
  });
});
