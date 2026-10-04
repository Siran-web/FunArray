# 14. Admin Operations & Portal Documentation

This document explains the administrative architecture, role guards, operational workflows, and back-office management interfaces implemented in FunArray.

---

## 1. Admin Authentication & Route Protection

All administrative routes (`/admin/*`) are protected at two independent layers:
1. **Frontend Route Guard (`AdminGuard.tsx`):** Verifies that `authStore.user.role === 'ADMIN'`. Non-admin or unauthenticated users are immediately redirected to `/login?redirect=admin`.
2. **Backend API Security (`SecurityConfig.java`):** Restricts all `/api/v1/admin/**` endpoints and catalog mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE` on `/api/v1/products/**` and `/api/v1/categories/**`) with `@PreAuthorize("hasRole('ADMIN')")`.

---

## 2. Admin Modules Breakdown

---

### Module 1: Executive Dashboard Overview
* **Route:** `/admin`
* **UI Component:** `AdminDashboardPage` (`frontend/src/app/admin/page.tsx`)
* **Purpose:** Displays live business metrics, revenue summaries, active order counts, low-stock warnings, and recent order transactions.
* **API Flow:**
  $$\text{AdminDashboardPage} \longrightarrow \text{adminApi.getDashboardStats()} \longrightarrow \text{GET /api/v1/admin/dashboard} \longrightarrow \text{AdminController.getDashboardStats()}$$
* **Backend Aggregation:** Queries `ProductRepository`, `OrderRepository`, `UserRepository`, `FurnitureModelRepository`, and `CategoryRepository`.

---

### Module 2: Furniture Catalog Management
* **Route:** `/admin/products` & `/admin/categories`
* **UI Components:** `AdminProductsPage`, `AdminCategoriesPage` (`frontend/src/app/admin/products/page.tsx`, `categories/page.tsx`)
* **Purpose:** Full CRUD operations on furniture products, SKU configuration, physical dimension specification, color/fabric variant management, and category taxonomy hierarchy.
* **API Flows:**
  * **Create Product:** `POST /api/v1/products` → `ProductController.createProduct` → `ProductService` → `products` table.
  * **Add Variant:** `POST /api/v1/products/{id}/variants` → `ProductController.addVariant` → `product_variants` table.
  * **Add Gallery Image:** `POST /api/v1/products/{id}/images` → `ProductController.addImage` → `product_images` table.
  * **Associate 3D Model:** `POST /api/v1/products/{id}/model` → `ProductController.saveProductModel` → `furniture_models` table.

---

### Module 3: Real-Time Inventory & Stock Reconciliation
* **Route:** `/admin/inventory`
* **UI Component:** `AdminInventoryPage` (`frontend/src/app/admin/inventory/page.tsx`)
* **Purpose:** Real-time visibility into warehouse stock ledgers, low-stock alert monitoring, absolute stock count updates, and relative reconciliation (+/- adjustments).
* **API Flows:**
  * **List Inventory:** `GET /api/v1/inventory?lowStockOnly=false` → `InventoryController.getInventory` → `InventoryService` → `inventory` table.
  * **Set Absolute Stock:** `PUT /api/v1/inventory/variant/{id}` → `InventoryController.updateStock` → `InventoryService` (updates `quantity`, re-computes `available = quantity - reserved`).
  * **Adjust Stock Relatively:** `POST /api/v1/inventory/variant/{id}/adjust` → `InventoryController.adjustStock`.

---

### Module 4: Order Fulfillment & State Machine Pipeline
* **Route:** `/admin/orders`
* **UI Component:** `AdminOrdersPage` (`frontend/src/app/admin/orders/page.tsx`)
* **Purpose:** Customer order queue monitoring, shipping details review, item fulfillment, and state machine transitions.
* **Legal State Transitions Enforced by Backend:**
  ```
  PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED ──► DELIVERED
     │           │
     └───────────┴──────────► CANCELLED
  ```
* **API Flow:**
  $$\text{AdminOrdersPage} \longrightarrow \text{adminApi.updateOrderStatus(orderId, status)} \longrightarrow \text{PUT /api/v1/admin/orders/{id}/status} \longrightarrow \text{AdminOrderController} \longrightarrow \text{OrderService.updateOrderStatus()}$$
* **Database Updates:** Updates `status` in `orders` table; on `CANCELLED`, automatically releases reserved stock in `inventory`.

---

### Module 5: 3D Digital Asset Repository
* **Route:** `/admin/assets`
* **UI Component:** `AdminAssetsPage` (`frontend/src/app/admin/assets/page.tsx`)
* **Purpose:** Overview of all 3D GLB models loaded in the platform, verifying model URLs, file sizes, versioning, and physical bounding boxes.
* **API Flow:**
  $$\text{AdminAssetsPage} \longrightarrow \text{adminApi.getAssets()} \longrightarrow \text{GET /api/v1/admin/assets} \longrightarrow \text{AdminController.getAssets()} \longrightarrow \text{furniture_models table}$$

---

### Module 6: Registered Customer Directory
* **Route:** `/admin/customers`
* **UI Component:** `AdminCustomersPage` (`frontend/src/app/admin/customers/page.tsx`)
* **Purpose:** Centralized view of registered users, account status, contact information, and lifetime order counts.
* **API Flow:**
  $$\text{AdminCustomersPage} \longrightarrow \text{adminApi.getCustomers()} \longrightarrow \text{GET /api/v1/admin/customers} \longrightarrow \text{AdminController.getCustomers()} \longrightarrow \text{users, orders tables}$$
