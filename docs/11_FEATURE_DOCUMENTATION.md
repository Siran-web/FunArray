# 11. Feature Documentation

This document describes each end-to-end feature implemented in FunArray, tracing user flows from UI triggers through REST APIs, business services, and database persistence.

---

## 1. Feature Index

1. [Customer Authentication & Session Management](#1-customer-authentication--session-management)
2. [Product Catalog, Search & Filtering](#2-product-catalog-search--filtering)
3. [Product Detail View & Finish Selection](#3-product-detail-view--finish-selection)
4. [3D Room Studio & Floor Perspective Calibration](#4-3d-room-studio--floor-perspective-calibration)
5. [Live Camera AR with Plane Detection](#5-live-camera-ar-with-plane-detection)
6. [Saved Room Designs Management](#6-saved-room-designs-management)
7. [Persistent Shopping Cart](#7-persistent-shopping-cart)
8. [Multi-Step Checkout & Tax Computation](#8-multi-step-checkout--tax-computation)
9. [Order Tracking & State Machine Lifecycle](#9-order-tracking--state-machine-lifecycle)
10. [Customer Product Reviews & Ratings](#10-customer-product-reviews--ratings)
11. [Admin Executive Dashboard](#11-admin-executive-dashboard)
12. [Admin Product Catalog & 3D Asset Management](#12-admin-product-catalog--3d-asset-management)
13. [Admin Real-Time Stock Ledger & Reconciliation](#13-admin-real-time-stock-ledger--reconciliation)
14. [Admin Order Fulfillment Pipeline](#14-admin-order-fulfillment-pipeline)

---

## 2. Detailed Feature Walkthroughs

---

### 1. Customer Authentication & Session Management
* **User Flow:** User visits `/login` or `/register`, inputs credentials, receives JWT token pair, and is redirected to their prior browsing context.
* **Frontend:** `LoginPage` (`app/login/page.tsx`), `RegisterPage` (`app/register/page.tsx`), `authStore` (`store/authStore.ts`), `AuthProvider` (`components/auth/AuthProvider.tsx`).
* **API:** `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
* **Backend:** `AuthController` → `AuthService` (validates with `BCryptPasswordEncoder`, generates tokens via `JwtTokenProvider`).
* **Database:** `users` table.

---

### 2. Product Catalog, Search & Filtering
* **User Flow:** User browses `/products`, types keywords into the search box, filters by category tabs (Living Room, Dining, Bedroom, Workspace), adjusts price range, and selects sorting criteria (`price_asc`, `price_desc`, `rating`).
* **Frontend:** `ProductsPage` (`app/products/page.tsx`), `ProductCard` (`components/product/product-card.tsx`).
* **API:** `GET /api/v1/products?q=...&category=...&minPrice=...&maxPrice=...&sortBy=...`, `GET /api/v1/categories/tree`.
* **Backend:** `ProductController.getProducts()` → `ProductService.getProducts()` → `ProductRepository.findAll()`.
* **Database:** `products`, `categories`, `product_variants`, `product_images` tables.

---

### 3. Product Detail View & Finish Selection
* **User Flow:** User selects a product, examines the high-resolution photo gallery, selects different color/fabric swatches (updating price and SKU), inspects real physical dimensions (width, height, depth in cm), and checks stock availability.
* **Frontend:** `ProductDetailPage` (`app/products/[id]/page.tsx`), `ProductDetailView` (`product-detail-view.tsx`).
* **API:** `GET /api/v1/products/{id}`, `GET /api/v1/inventory/check/{variantId}`.
* **Backend:** `ProductController.getProductById()` → `ProductService` → `ProductRepository`.
* **Database:** `products`, `product_variants`, `product_images`, `furniture_models` tables.

---

### 4. 3D Room Studio & Floor Perspective Calibration
* **User Flow:** User navigates to `/visualize`, uploads a photo of their room (or selects a studio backdrop), uses the interactive horizon/pitch overlay to align floor perspective, drags furniture items onto the canvas, rotates/moves/scales them, and saves the design concept.
* **Frontend:** `VisualizePage` (`app/visualize/page.tsx`), `RoomViewer` (`components/visualization/RoomViewer.tsx`), `RoomFloorAlignmentController` (`components/visualization/RoomFloorAlignmentController.tsx`), `FurnitureControls` (`components/visualization/FurnitureControls.tsx`).
* **API:** `POST /api/v1/storage/presigned-upload-url`, `POST /api/v1/rooms`, `POST /api/v1/designs`.
* **Backend:** `StorageController` → `StorageService` (generates S3 Presigned URL), `VisualizationSessionController` → `VisualizationService`.
* **Database:** `room_images`, `visualization_sessions` tables, AWS S3 bucket.

---

### 5. Live Camera AR with Plane Detection
* **User Flow:** User clicks "View in AR" on any product detail page, grants camera permission, points phone at the floor, sees a smooth animated green 3D reticle tracking the floor plane, taps to place the furniture at 1:1 true scale, and rotates/nudges it in real time.
* **Frontend:** `CameraARViewer` (`components/ar/camera-ar-viewer.tsx`), `ARSurfaceManager.ts`, `ARDepthOcclusion.ts`, `useCameraAR.ts`.
* **API:** `GET /api/v1/products/{id}/ar`.
* **Backend:** `ProductController.getProductARAsset()`.
* **Database:** `furniture_models` table.

---

### 6. Saved Room Designs Management
* **User Flow:** Authenticated user navigates to `/designs`, views their gallery of saved 3D concepts, renames a concept, opens it back up in the 3D Studio, or adds all items in the design directly to their shopping cart.
* **Frontend:** `DesignsPage` (`app/designs/page.tsx`).
* **API:** `GET /api/v1/designs`, `PATCH /api/v1/designs/{id}/rename`, `DELETE /api/v1/designs/{id}`, `POST /api/v1/cart/items`.
* **Backend:** `VisualizationSessionController` → `VisualizationService`.
* **Database:** `visualization_sessions` table.

---

### 7. Persistent Shopping Cart
* **User Flow:** User adds items to bag from product pages, 3D visualizer, or saved designs; modifies line item quantities in the slide-over `CartDrawer` or `/cart` page; and views estimated totals.
* **Frontend:** `CartPage` (`app/cart/page.tsx`), `CartDrawer` (`components/commerce/cart-drawer.tsx`), `cartStore.ts`.
* **API:** `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PUT /api/v1/cart/items/{id}`, `DELETE /api/v1/cart/items/{id}`.
* **Backend:** `CartController` → `CartService` → `CartRepository`, `CartItemRepository`.
* **Database:** `carts`, `cart_items` tables.

---

### 8. Multi-Step Checkout & Tax Computation
* **User Flow:** Customer initiates checkout at `/checkout`, selects or adds a delivery address, selects payment provider, reviews server-computed breakdown (subtotal, 18% GST, shipping, discount), and executes order placement.
* **Frontend:** `CheckoutPage` (`app/checkout/page.tsx`).
* **API:** `GET /api/v1/addresses`, `POST /api/v1/addresses`, `GET /api/v1/checkout/preview`, `POST /api/v1/checkout`, `POST /api/v1/payments/create`.
* **Backend:** `CheckoutController` → `OrderService` (reserves stock atomically via `InventoryService.reserveInventory()`).
* **Database:** `orders`, `order_items`, `inventory`, `addresses`, `payments` tables.

---

### 9. Order Tracking & State Machine Lifecycle
* **User Flow:** Customer checks order history at `/orders`, opens a specific receipt at `/orders/[id]`, inspects status stepper (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`), and cancels if still eligible.
* **Frontend:** `OrdersPage` (`app/orders/page.tsx`), `OrderDetailPage` (`app/orders/[id]/page.tsx`).
* **API:** `GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/cancel`.
* **Backend:** `OrderController` → `OrderService`.
* **Database:** `orders`, `order_items` tables.

---

### 10. Customer Product Reviews & Ratings
* **User Flow:** Verified customers submit a 1–5 star rating with title and review comment; other buyers see the aggregated average score and rating breakdown.
* **Frontend:** `ProductDetailView` (`app/products/[id]/product-detail-view.tsx`).
* **API:** `GET /api/v1/products/{id}/reviews`, `POST /api/v1/products/{id}/reviews`.
* **Backend:** `ReviewController` → `ReviewService` → `ReviewRepository`.
* **Database:** `reviews` table.

---

### 11. Admin Executive Dashboard
* **User Flow:** Administrator logs in, navigates to `/admin`, and views live summary cards (total revenue, active orders, customer counts, low-stock alerts) and recent order queue.
* **Frontend:** `AdminDashboardPage` (`app/admin/page.tsx`), `AdminNav` (`components/admin/AdminNav.tsx`).
* **API:** `GET /api/v1/admin/dashboard`.
* **Backend:** `AdminController.getDashboardStats()`.
* **Database:** Aggregates `orders`, `products`, `users`, `furniture_models` tables.

---

### 12. Admin Product Catalog & 3D Asset Management
* **User Flow:** Admin creates new products, updates descriptions/pricing, creates variants with dedicated SKUs, uploads gallery images, and associates 3D GLB models with physical bounding box dimensions.
* **Frontend:** `AdminProductsPage` (`app/admin/products/page.tsx`), `AdminAssetsPage` (`app/admin/assets/page.tsx`).
* **API:** `POST/PUT/DELETE /api/v1/products`, `POST /api/v1/products/{id}/variants`, `POST /api/v1/products/{id}/images`, `POST /api/v1/products/{id}/model`.
* **Backend:** `ProductController` → `ProductService`.
* **Database:** `products`, `product_variants`, `product_images`, `furniture_models` tables.

---

### 13. Admin Real-Time Stock Ledger & Reconciliation
* **User Flow:** Admin/Staff inspects warehouse inventory at `/admin/inventory`, filters for low-stock items below threshold, sets absolute stock counts, or submits relative stock adjustments with audit reasons.
* **Frontend:** `AdminInventoryPage` (`app/admin/inventory/page.tsx`).
* **API:** `GET /api/v1/inventory`, `PUT /api/v1/inventory/variant/{id}`, `POST /api/v1/inventory/variant/{id}/adjust`.
* **Backend:** `InventoryController` → `InventoryService`.
* **Database:** `inventory` table.

---

### 14. Admin Order Fulfillment Pipeline
* **User Flow:** Admin/Staff views customer order queue at `/admin/orders`, opens customer delivery specs, and updates fulfillment state (e.g. from `CONFIRMED` to `PROCESSING` to `SHIPPED`).
* **Frontend:** `AdminOrdersPage` (`app/admin/orders/page.tsx`).
* **API:** `GET /api/v1/admin/orders`, `PUT /api/v1/admin/orders/{id}/status`.
* **Backend:** `AdminOrderController` → `OrderService.updateOrderStatus()`.
* **Database:** `orders` table.
