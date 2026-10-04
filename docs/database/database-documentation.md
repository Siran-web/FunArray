# 10. Database Documentation

This document provides a detailed specification of every database table, entity, column, data type, foreign key relationship, and index in FunArray, verified from Flyway migrations `V1` to `V16`.

---

## 1. Relational Database Overview

* **Primary Engine:** PostgreSQL 16 / MySQL 8.0 (Relational System of Record).
* **Migration Manager:** Flyway (`backend/src/main/resources/db/migration/`).
* **ID Strategy:** 36-character UUID strings (`VARCHAR(36)`) generated application-side or by database default.
* **Timestamps:** UTC `TIMESTAMP` with default `CURRENT_TIMESTAMP`.

---

## 2. Comprehensive Table Specifications

---

### Table 1: `users` (`V1__create_users.sql`)
* **Purpose:** Stores customer and staff identity records, hashed credentials, contact details, and role-based permissions.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `email` (`VARCHAR(255)`, Unique, Not Null)
  * `password_hash` (`VARCHAR(255)`, Not Null — BCrypt hashed)
  * `first_name` (`VARCHAR(100)`, Not Null)
  * `last_name` (`VARCHAR(100)`, Not Null)
  * `phone` (`VARCHAR(20)`, Nullable)
  * `role` (`VARCHAR(50)`, Default: `'CUSTOMER'`, Values: `CUSTOMER`, `STAFF`, `STORE_STAFF`, `STORE_MANAGER`, `ADMIN`)
  * `status` (`VARCHAR(50)`, Default: `'ACTIVE'`, Values: `ACTIVE`, `SUSPENDED`, `DELETED`)
  * `created_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
  * `updated_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/admin/customers`.

---

### Table 2: `addresses` (`V2__create_addresses.sql`)
* **Purpose:** Customer shipping and billing address registry.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `user_id` (`VARCHAR(36)`, Foreign Key → `users(id)` ON DELETE CASCADE)
  * `address_line1` (`VARCHAR(255)`, Not Null)
  * `address_line2` (`VARCHAR(255)`, Nullable)
  * `city` (`VARCHAR(100)`, Not Null)
  * `state` (`VARCHAR(100)`, Not Null)
  * `postal_code` (`VARCHAR(20)`, Not Null)
  * `country` (`VARCHAR(100)`, Default: `'India'`)
  * `is_default` (`BOOLEAN`, Default: `FALSE`)
  * `created_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/addresses/*`, `/api/v1/checkout`.

---

### Table 3: `categories` (`V3__create_categories.sql`)
* **Purpose:** Hierarchical category taxonomy with self-referencing parent IDs.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `name` (`VARCHAR(100)`, Not Null)
  * `slug` (`VARCHAR(120)`, Unique, Not Null)
  * `description` (`TEXT`, Nullable)
  * `image_url` (`VARCHAR(500)`, Nullable)
  * `parent_id` (`VARCHAR(36)`, Foreign Key → `categories(id)` ON DELETE SET NULL)
  * `created_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
  * `updated_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/categories/*`.

---

### Table 4: `products` (`V4__create_products.sql`)
* **Purpose:** Core furniture catalog specifications, dimensions, brand, and base pricing.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `category_id` (`VARCHAR(36)`, Foreign Key → `categories(id)`)
  * `name` (`VARCHAR(255)`, Not Null)
  * `slug` (`VARCHAR(280)`, Unique, Not Null)
  * `description` (`TEXT`, Nullable)
  * `brand` (`VARCHAR(100)`, Nullable)
  * `base_price` (`DECIMAL(12, 2)`, Not Null)
  * `status` (`VARCHAR(50)`, Default: `'ACTIVE'`, Values: `ACTIVE`, `DRAFT`, `ARCHIVED`)
  * `material` (`VARCHAR(100)`, Nullable)
  * `weight` (`DECIMAL(10, 2)`, Nullable)
  * `width_cm` (`DECIMAL(10, 2)`, Not Null)
  * `height_cm` (`DECIMAL(10, 2)`, Not Null)
  * `depth_cm` (`DECIMAL(10, 2)`, Not Null)
  * `sku` (`VARCHAR(100)`, Unique, Not Null)
  * `created_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
  * `updated_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/products/*`.

---

### Table 5: `product_variants` (`V5__create_product_variants.sql`)
* **Purpose:** Specific color, fabric, and material finishes for a product.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `product_id` (`VARCHAR(36)`, Foreign Key → `products(id)` ON DELETE CASCADE)
  * `sku` (`VARCHAR(100)`, Unique, Not Null)
  * `color` (`VARCHAR(100)`, Nullable)
  * `material` (`VARCHAR(100)`, Nullable)
  * `price` (`DECIMAL(12, 2)`, Not Null)
  * `stock_quantity` (`INT`, Default: 0)
  * `status` (`VARCHAR(50)`, Default: `'ACTIVE'`)
  * `created_at`, `updated_at` (`TIMESTAMP`)
* **Used by APIs:** `/api/v1/products/{id}/variants`, `/api/v1/inventory/*`.

---

### Table 6: `product_images` (`V6__create_product_images.sql`)
* **Purpose:** Media gallery photos for products.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `product_id` (`VARCHAR(36)`, Foreign Key → `products(id)` ON DELETE CASCADE)
  * `image_url` (`TEXT`, Not Null)
  * `alt_text` (`VARCHAR(255)`, Nullable)
  * `sort_order` (`INT`, Default: 0)
  * `is_primary` (`BOOLEAN`, Default: `FALSE`)
  * `created_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/products/{id}/images`.

---

### Table 7: `furniture_models` (`V7__create_furniture_models.sql`)
* **Purpose:** Digital 3D GLB/USDZ asset records, versions, and physical bounding boxes.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `product_id` (`VARCHAR(36)`, Foreign Key → `products(id)` ON DELETE CASCADE)
  * `model_url` (`TEXT`, Not Null)
  * `thumbnail_url` (`TEXT`, Nullable)
  * `format` (`VARCHAR(20)`, Default: `'glb'`)
  * `file_size` (`BIGINT`, Nullable)
  * `width_cm`, `height_cm`, `depth_cm` (`DECIMAL(10, 2)`, Not Null)
  * `version` (`INT`, Default: 1)
  * `status` (`VARCHAR(50)`, Default: `'ACTIVE'`)
  * `created_at`, `updated_at` (`TIMESTAMP`)
* **Used by APIs:** `/api/v1/products/{id}/ar`, `/api/v1/products/{id}/model`, `/api/v1/admin/assets`.

---

### Table 8: `inventory` (`V8__create_inventory.sql`)
* **Purpose:** Real-time stock ledger managing warehouse quantities, reservations, and available units.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key, Not Null)
  * `product_id` (`VARCHAR(36)`, Foreign Key → `products(id)` ON DELETE CASCADE)
  * `variant_id` (`VARCHAR(36)`, Foreign Key → `product_variants(id)` ON DELETE CASCADE)
  * `quantity` (`INT`, Default: 0)
  * `reserved` (`INT`, Default: 0)
  * `available` (`INT`, Default: 0)
  * `updated_at` (`TIMESTAMP`, Default: `CURRENT_TIMESTAMP`)
* **Used by APIs:** `/api/v1/inventory/*`, `/api/v1/checkout`.

---

### Table 9 & 10: `carts` & `cart_items` (`V9` & `V10`)
* **Purpose:** Persistent customer shopping carts and line items.
* **`carts` Columns:** `id` (PK), `user_id` (FK → `users`), `status`, `created_at`, `updated_at`.
* **`cart_items` Columns:** `id` (PK), `cart_id` (FK → `carts`), `product_id` (FK → `products`), `variant_id` (FK → `product_variants`), `quantity` (`INT`), `unit_price` (`DECIMAL(12, 2)`), `created_at`.
* **Used by APIs:** `/api/v1/cart/*`.

---

### Table 11 & 12: `orders` & `order_items` (`V11` & `V12`)
* **Purpose:** Financial order records, tax breakdowns, shipping destinations, and immutable historical item snapshots.
* **`orders` Columns:**
  * `id` (`VARCHAR(36)`, Primary Key)
  * `user_id` (`VARCHAR(36)`, Foreign Key → `users(id)`)
  * `order_number` (`VARCHAR(100)`, Unique, Not Null)
  * `status` (`VARCHAR(50)`, Default: `'PENDING'`)
  * `subtotal`, `shipping_fee`, `tax`, `discount`, `total_amount` (`DECIMAL(12, 2)`)
  * `shipping_address_id` (`VARCHAR(36)`, Foreign Key → `addresses(id)`)
  * `created_at`, `updated_at` (`TIMESTAMP`)
* **`order_items` Columns:** `id` (PK), `order_id` (FK → `orders`), `product_id` (FK → `products`), `variant_id` (FK → `product_variants`), `product_name` (`VARCHAR(255)`), `quantity` (`INT`), `unit_price` (`DECIMAL(12, 2)`), `total_price` (`DECIMAL(12, 2)`).
* **Used by APIs:** `/api/v1/checkout`, `/api/v1/orders/*`, `/api/v1/admin/orders/*`.

---

### Table 13: `payments` (`V13__create_payments.sql`)
* **Purpose:** Transaction ledger for payment gateway interactions.
* **Columns:**
  * `id` (`VARCHAR(36)`, Primary Key)
  * `order_id` (`VARCHAR(36)`, Foreign Key → `orders(id)` ON DELETE CASCADE)
  * `provider` (`VARCHAR(50)`, e.g., `'RAZORPAY'`, `'CREDIT_CARD'`)
  * `transaction_id` (`VARCHAR(255)`, Not Null)
  * `amount` (`DECIMAL(12, 2)`, Not Null)
  * `currency` (`VARCHAR(10)`, Default: `'INR'`)
  * `status` (`VARCHAR(50)`, Default: `'PENDING'`, Values: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`)
  * `payment_method` (`VARCHAR(50)`)
  * `paid_at` (`TIMESTAMP`, Nullable)
  * `created_at` (`TIMESTAMP`)
* **Used by APIs:** `/api/v1/payments/*`.

---

### Table 14: `reviews` (`V14__create_reviews.sql`)
* **Purpose:** Customer product ratings and editorial reviews (`TICKET-031`).
* **Columns:** `id` (PK), `product_id` (FK → `products`), `user_id` (FK → `users`), `rating` (`INT`, CHECK 1-5), `title` (`VARCHAR(255)`), `comment` (`TEXT`), `status` (`VARCHAR(50)`), `created_at`, `updated_at`.
* **Used by APIs:** `/api/v1/products/{id}/reviews`, `/api/v1/reviews/*`.

---

### Table 15 & 16: `physical_stores` & `store_inventory` (`V15`)
* **Purpose:** Physical showroom locations (Delhi, Jalandhar) and localized showroom stock tracking.
* **Columns:**
  * `physical_stores`: `id`, `name`, `code` (Unique), `address`, `city`, `state`, `postal_code`, `phone`, `latitude`, `longitude`, `is_active`, `created_at`.
  * `store_inventory`: `id`, `store_id` (FK), `product_id` (FK), `variant_id` (FK), `quantity`, `reserved`, `available`, `updated_at`.

---

### Table 17 & 18: `room_images` & `visualization_sessions` (`V16`)
* **Purpose:** User room photo uploads and 3D spatial scene configurations.
* **Columns:**
  * `room_images`: `id` (PK), `user_id` (FK → `users`), `name`, `image_url`, `file_key`, `file_size`, `mime_type`, `width`, `height`, `created_at`, `updated_at`.
  * `visualization_sessions`: `id` (PK), `user_id` (FK → `users`), `room_image_id` (FK → `room_images`), `room_image_url`, `name`, `scene_data` (`TEXT` — JSON containing placed furniture vectors, rotations, and scales), `created_at`, `updated_at`.
* **Used by APIs:** `/api/v1/rooms/*`, `/api/v1/designs/*`.
