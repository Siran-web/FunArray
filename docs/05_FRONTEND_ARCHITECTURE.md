# 05. Frontend Architecture

This document describes the design, routing model, component structure, state management, and styling systems of the FunArray frontend built on **Next.js 16 (App Router)** and **React 19**.

---

## 1. Core Architecture & Technologies

* **Framework:** Next.js `16.3.6` (React Server Components + Client Components with `'use client'`).
* **UI Library:** React `19.2.8` with TypeScript 5.
* **3D Graphics:** Three.js `0.186.1` (Custom WebGL canvas and shader hooks).
* **Styling:** Tailwind CSS `v4` with custom Atelier luxury tokens.
* **Icons:** Lucide React (`1.48.0`).
* **State Management:** Zustand `5.0.15` (Lightweight stores with selective re-rendering).
* **Testing:** Vitest `5.0.2`.

---

## 2. Global Design System & Visual Tokens

The frontend adheres strictly to the **Atelier Walnut & Natural Stone** design specification defined in `frontend/src/app/globals.css`:

| Category | Token | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Color** | Walnut Primary | `#8B5E3C` | Primary buttons, active highlights, key brand accents |
| **Primary Dark** | Walnut Dark (Hover) | `#634027` | Button hover states, dark contrast elements |
| **Primary Light** | Walnut Light (Tint) | `#F3E8DE` | Light badges, active pill backgrounds, subtle highlights |
| **Canvas** | Background Canvas | `#FAF9F7` | Body background, neutral card canvases |
| **Surfaces** | Surface Primary | `#FFFFFF` | Cards, modals, drawers, input fields |
| **Secondary Surface** | Surface Secondary | `#F4F2EF` | Secondary buttons, subtle section fills |
| **Borders** | Divider Border | `#E5E0DA` | Hairline borders, table dividers |
| **Typography** | Display Headlines | `DM Serif Display` | Hero titles, collection headlines, product names |
| **Typography** | Interface / Specs | `Inter` | Navigation, specs, body text, buttons, pricing |

---

## 3. Client State Management (Zustand)

FunArray separates client state into four focused Zustand stores:

```
frontend/src/store/
├── authStore.ts           # Token storage, UserProfile, role checking, login/logout actions
├── cartStore.ts           # Cart line items, quantities, subtotal, cart drawer open/close
├── visualizationStore.ts  # Room image URL, placed 3D furniture array, floor calibration, selection
└── wishlistStore.ts       # Bookmarked product IDs synced with browser LocalStorage
```

### Store Highlights:
* **`authStore`:** Hydrates from `localStorage` on initial mount, exposes `hasRole(role)`, `login(tokens, user)`, `logout()`.
* **`cartStore`:** Optimistically updates cart items while syncing asynchronously with `cartApi`.
* **`visualizationStore`:** Manages 3D coordinate vectors `[x, y, z]`, rotations `[rx, ry, rz]`, scaling factors, lock states, lighting presets (`warm`, `studio`, `daylight`), and floor calibration parameters (`elevation`, `pitchAngle`, `cameraFov`, `horizonY`).

---

## 4. API Client & Silent Token Refresh

The API communication layer is centralized in `frontend/src/services/api.ts`:
* Injects `Authorization: Bearer <token>` from `localStorage` into all HTTP requests.
* Intercepts `401 Unauthorized` responses and automatically invokes `/auth/refresh` using the stored refresh token.
* Queues concurrent requests during token renewal via a subscriber pattern, retrying original requests once the new access token is received.
* Normalizes backend error responses into an `ApiError` class containing error codes, HTTP status, and field-level validation maps.

---

## 5. Major Page-by-Page Technical Specification

---

### Page 1: Landing / Storefront Home
* **Path:** `frontend/src/app/page.tsx`
* **Route:** `/`
* **Purpose:** Brand introduction, hero showroom, category taxonomy discovery, featured products carousel, omnichannel store locations, and 3D AR entry banner.
* **Key Components:**
  * `HeroSection` (`components/home/hero-section.tsx`)
  * `CategoryGrid` (`components/home/category-grid.tsx`)
  * `FeaturedProducts` (`components/home/featured-products.tsx`)
  * `OmnichannelSection` (`components/home/omnichannel-section.tsx`)
  * `ARExperienceBanner` (`components/home/ar-experience-banner.tsx`)
  * `TestimonialsSection` (`components/home/testimonials-section.tsx`)
* **API Calls:**
  * `productApi.getCategories()`
  * `productApi.getProducts({ sortBy: 'featured', size: 8 })`
* **User Actions:** Click category card, click product card, click "Launch 3D Studio" CTA, toggle wishlist heart.
* **Navigation:** Routes to `/products?category=...`, `/products/[id]`, or `/visualize`.

---

### Page 2: Product Catalog & Filtering
* **Path:** `frontend/src/app/products/page.tsx`
* **Route:** `/products`
* **Purpose:** Full catalog exploration with live search query, category filtering, price range sliders, sorting, and pagination.
* **Key Components:**
  * `ProductCard` (`components/product/product-card.tsx`)
  * `Badge`, `Button`, `Input` (`components/ui/*`)
* **API Calls:**
  * `productApi.getProducts(queryParams)`
  * `productApi.getCategoryTree()`
* **State:** `searchQuery`, `selectedCategory`, `priceRange`, `sortBy`, `page`.
* **User Actions:** Search by keyword, filter by category tab, adjust price range, sort by price/rating, click product card.
* **Navigation:** Routes to `/products/[id]`.

---

### Page 3: Product Detail View & AR Launch
* **Path:** `frontend/src/app/products/[id]/page.tsx` & `product-detail-view.tsx`
* **Route:** `/products/[id]`
* **Purpose:** Comprehensive product showcase: multi-image gallery, finish/variant selection, dimension specs, live stock status, 3D Studio launcher, WebXR / Camera AR modal, and verified customer reviews.
* **Key Components:**
  * `ProductDetailView` (`app/products/[id]/product-detail-view.tsx`)
  * `ARPreviewModal` (`components/ar/ar-preview-modal.tsx`)
  * `CameraARViewer` (`components/ar/camera-ar-viewer.tsx`)
* **API Calls:**
  * `productApi.getProductById(id)`
  * `reviewApi.getProductReviews(id)`
  * `cartApi.addItem(...)`
  * `reviewApi.createReview(id, ...)`
* **State:** `selectedVariant`, `activeImageIndex`, `isARModalOpen`, `isReviewModalOpen`.
* **User Actions:** Switch color/fabric finish, click "View in Live AR", click "Open in 3D Studio", click "Add to Cart", submit product review.
* **Navigation:** Routes to `/visualize/[productId]` or `/checkout`.

---

### Page 4: 3D Interactive Room Visualizer
* **Path:** `frontend/src/app/visualize/page.tsx` & `[productId]/page.tsx`
* **Route:** `/visualize` or `/visualize/[productId]`
* **Purpose:** Spatial design studio allowing customers and interior designers to upload room photos, adjust floor horizon alignment, arrange multiple 3D furniture pieces, and save custom room scenes.
* **Key Components:**
  * `RoomViewer` (`components/visualization/RoomViewer.tsx`)
  * `FurnitureControls` (`components/visualization/FurnitureControls.tsx`)
  * `FurnitureToolbar` (`components/visualization/FurnitureToolbar.tsx`)
  * `RoomFloorAlignmentController` (`components/visualization/RoomFloorAlignmentController.tsx`)
* **API Calls:**
  * `productApi.requestPresignedUpload(...)` (Direct S3 room image upload)
  * `visualizationApi.uploadRoomImage(...)`
  * `designApi.saveDesign(...)`
  * `designApi.updateDesign(...)`
* **State:** `useVisualizationStore` (room photo, placed furniture list, selected item ID, floor pitch/elevation, lighting mode).
* **User Actions:** Upload room photo, calibrate horizon line, add catalog items, move/rotate/scale models, lock positions, duplicate items, save named design.
* **Navigation:** Routes to `/designs` or `/cart`.

---

### Page 5: Saved Room Designs Gallery
* **Path:** `frontend/src/app/designs/page.tsx`
* **Route:** `/designs`
* **Purpose:** User dashboard displaying saved 3D room design concepts with thumbnail previews, item breakdowns, and direct-to-cart purchasing.
* **Key Components:**
  * Saved design cards, rename modal, delete confirmation modal.
* **API Calls:**
  * `designApi.getDesigns()`
  * `designApi.renameDesign(id, name)`
  * `designApi.deleteDesign(id)`
* **User Actions:** Load design into 3D Studio, rename design, delete design, add all design items to shopping cart.
* **Navigation:** Routes to `/visualize?designId=...`.

---

### Page 6: Shopping Cart & Drawer
* **Path:** `frontend/src/app/cart/page.tsx` & `components/commerce/cart-drawer.tsx`
* **Route:** `/cart`
* **Purpose:** Review cart line items, modify quantities, remove items, view estimated tax & shipping, and proceed to checkout.
* **Key Components:**
  * `CartDrawer` (`components/commerce/cart-drawer.tsx`)
  * Cart line items list, pricing breakdown summary card.
* **API Calls:**
  * `cartApi.getCart()`
  * `cartApi.updateItemQuantity(itemId, quantity)`
  * `cartApi.removeItem(itemId)`
  * `cartApi.clearCart()`
* **State:** `useCartStore`.
* **User Actions:** Increment/decrement quantity, delete line item, click "Proceed to Checkout".
* **Navigation:** Routes to `/checkout`.

---

### Page 7: Multi-Step Checkout
* **Path:** `frontend/src/app/checkout/page.tsx`
* **Route:** `/checkout`
* **Purpose:** Stepper checkout flow: (1) Select/Create Shipping Address → (2) Select Payment Method (Razorpay / Credit Card / UPI) → (3) Order Review & Placement with real-time tax calculation.
* **Key Components:**
  * Address selector / Add address form, coupon code input, payment option selector, order summary card.
* **API Calls:**
  * `addressApi.getAddresses()`
  * `addressApi.createAddress(...)`
  * `orderApi.previewCheckout(...)`
  * `orderApi.checkout(...)`
  * `paymentApi.createPayment(...)`
* **State:** `stepIndex`, `selectedAddressId`, `paymentMethod`, `couponCode`, `checkoutPreview`.
* **User Actions:** Select default shipping address, add new address, apply promo code, place order.
* **Navigation:** Routes to `/orders/[id]` upon successful placement.

---

### Page 8: Order History & Receipt Tracking
* **Path:** `frontend/src/app/orders/page.tsx` & `frontend/src/app/orders/[id]/page.tsx`
* **Route:** `/orders` and `/orders/[id]`
* **Purpose:** Displays order history with visual status timeline (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), invoice details, line items, and cancel order capability.
* **Key Components:**
  * Order status stepper, shipping address card, receipt table.
* **API Calls:**
  * `orderApi.getOrders()`
  * `orderApi.getOrderById(id)`
  * `orderApi.cancelOrder(id)`
* **User Actions:** View tracking status, cancel pending order, reorder items.

---

### Page 9: Admin Operations Portal
* **Path:** `frontend/src/app/admin/*`
* **Route:** `/admin`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/assets`, `/admin/customers`, `/admin/categories`
* **Purpose:** Protected administrative console for managing the furniture catalog, 3D GLB assets, stock ledgers, and order fulfillment.
* **Key Components:**
  * `AdminGuard` (`components/admin/AdminGuard.tsx`)
  * `AdminNav` (`components/admin/AdminNav.tsx`)
* **API Calls:**
  * `adminApi.getDashboardStats()`
  * `adminApi.getInventory(...)`
  * `adminApi.updateVariantStock(...)`
  * `adminApi.getOrders(...)`
  * `adminApi.updateOrderStatus(...)`
  * `adminApi.getAssets()`
  * `adminApi.getCustomers()`
* **Security:** Enforced client-side via `AdminGuard` (verifies `authStore.user.role === 'ADMIN'`) and server-side via `@PreAuthorize("hasRole('ADMIN')")`.
