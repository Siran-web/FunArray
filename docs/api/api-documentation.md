# 07. REST API Documentation

This document provides complete, verified technical specifications for all REST endpoints in the FunArray Spring Boot backend (`com.furniture.store.*`).

---

## 1. Authentication APIs (`AuthController.java`)

### 1.1 Register Customer
* **Method:** `POST`
* **Endpoint:** `/api/v1/auth/register` (Also `/api/auth/register`)
* **Purpose:** Registers a new customer user account and issues initial JWT tokens.
* **Authentication:** Public (`permitAll`)
* **Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Password@123",
  "firstName": "Priya",
  "lastName": "Sharma",
  "phone": "+919876543210"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600000,
    "user": {
      "id": "usr-123",
      "email": "customer@example.com",
      "firstName": "Priya",
      "lastName": "Sharma",
      "phone": "+919876543210",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    }
  }
}
```
* **Errors:** `400 Bad Request` (Validation failure or duplicate email).
* **Implementation:** `AuthController` → `AuthService` → `UserRepository` → `users` table.
* **Frontend Caller:** `authApi.register()` in `frontend/src/services/authApi.ts`.

---

### 1.2 Authenticate / Login
* **Method:** `POST`
* **Endpoint:** `/api/v1/auth/login` (Also `/api/auth/login`)
* **Purpose:** Authenticates user credentials and issues JWT access and refresh tokens.
* **Authentication:** Public (`permitAll`)
* **Request Body:**
```json
{
  "email": "funarray47@gmail.com",
  "password": "Admin@123"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600000,
    "user": {
      "id": "usr-admin-1",
      "email": "funarray47@gmail.com",
      "firstName": "Atelier",
      "lastName": "Admin",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```
* **Errors:** `401 Unauthorized` (Invalid email or password).
* **Implementation:** `AuthController` → `AuthService` → `UserRepository`.
* **Frontend Caller:** `authApi.login()`.

---

### 1.3 Refresh Access Token
* **Method:** `POST`
* **Endpoint:** `/api/v1/auth/refresh`
* **Purpose:** Issues a new JWT access token using a valid refresh token.
* **Authentication:** Public (`permitAll`)
* **Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```
* **Success Response (200 OK):** Returns fresh `AuthResponse`.
* **Implementation:** `AuthController` → `AuthService` → `JwtTokenProvider`.
* **Frontend Caller:** Interceptor in `frontend/src/services/api.ts` & `authApi.refresh()`.

---

### 1.4 Invalidate Session / Logout
* **Method:** `POST`
* **Endpoint:** `/api/v1/auth/logout`
* **Purpose:** Revokes active access and refresh tokens by registering them with `TokenBlacklistService`.
* **Authentication:** Optional / Bearer Token.
* **Request Body (Optional):** `{ "refreshToken": "..." }`
* **Success Response (200 OK):** `{ "success": true, "data": { "message": "Logged out successfully" } }`
* **Implementation:** `AuthController` → `AuthService` → `TokenBlacklistService`.
* **Frontend Caller:** `authApi.logout()`.

---

## 2. Product & Category APIs (`ProductController.java` & `CategoryController.java`)

### 2.1 Browse Products Catalog
* **Method:** `GET`
* **Endpoint:** `/api/v1/products`
* **Purpose:** Paginated product search with category, price range, and sorting filters.
* **Query Parameters:**
  * `page` (int, default: 0)
  * `size` (int, default: 20)
  * `category` (string, optional)
  * `minPrice` (decimal, optional)
  * `maxPrice` (decimal, optional)
  * `q` (string, optional search keyword)
  * `sortBy` (string: `featured`, `price_asc`, `price_desc`, `rating`, `newest`)
  * `status` (string, optional)
* **Authentication:** Public (`permitAll`)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "1",
        "name": "Kanso Minimalist 3-Seater Sofa",
        "slug": "kanso-minimalist-3-seater-sofa",
        "basePrice": 78999.00,
        "categoryName": "Living Room",
        "images": [{ "imageUrl": "https://...", "isPrimary": true }],
        "dimensions": { "widthCm": 220, "heightCm": 82, "depthCm": 95 }
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 85,
    "totalPages": 5
  }
}
```
* **Implementation:** `ProductController` → `ProductService` → `ProductRepository` → `products` table.
* **Frontend Caller:** `productApi.getProducts()` in `frontend/src/services/productApi.ts`.

---

### 2.2 Get Product Details
* **Method:** `GET`
* **Endpoint:** `/api/v1/products/{id}`
* **Purpose:** Fetches complete product details including variants, images, dimensions, and 3D model metadata.
* **Authentication:** Public (`permitAll`)
* **Success Response (200 OK):** Returns `ApiResponse<ProductDetailDto>`.
* **Errors:** `404 Not Found` (`PRODUCT_NOT_FOUND`).
* **Implementation:** `ProductController` → `ProductService` → `ProductRepository`.
* **Frontend Caller:** `productApi.getProductById(id)`.

---

### 2.3 Get 3D AR Model Metadata
* **Method:** `GET`
* **Endpoint:** `/api/v1/products/{id}/ar`
* **Purpose:** Returns lightweight 3D AR asset metadata for AR room preview.
* **Authentication:** Public (`permitAll`)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "productId": "1",
    "modelUrl": "https://.../SheenChair.glb",
    "format": "glb",
    "widthCm": 220.00,
    "heightCm": 82.00,
    "depthCm": 95.00,
    "version": 1
  }
}
```
* **Implementation:** `ProductController` → `ProductService` → `FurnitureModelRepository` → `furniture_models` table.
* **Frontend Caller:** `productApi.getProductARAsset(id)`.

---

### 2.4 Get Category Tree
* **Method:** `GET`
* **Endpoint:** `/api/v1/categories/tree`
* **Purpose:** Retrieves hierarchical category tree with nested children.
* **Authentication:** Public (`permitAll`)
* **Implementation:** `CategoryController` → `CategoryService` → `CategoryRepository` → `categories` table.
* **Frontend Caller:** `productApi.getCategoryTree()`.

---

## 3. Inventory APIs (`InventoryController.java`)

### 3.1 Real-Time Inventory Check
* **Method:** `GET`
* **Endpoint:** `/api/v1/inventory/check/{variantId}?quantity=1`
* **Purpose:** Checks real-time stock availability for a specific variant.
* **Authentication:** Public (`permitAll`)
* **Success Response (200 OK):**
```json
{
  "variantId": "var-1",
  "available": true,
  "requestedQuantity": 1,
  "availableQuantity": 9
}
```
* **Implementation:** `InventoryController` → `InventoryService` → `InventoryRepository` → `inventory` table.

---

### 3.2 Reserve Inventory for Checkout
* **Method:** `POST`
* **Endpoint:** `/api/v1/inventory/reserve`
* **Purpose:** Atomically moves stock from `available` to `reserved` using pessimistic locking.
* **Authentication:** Public / Internal (`permitAll`)
* **Request Body:**
```json
{
  "items": [
    { "variantId": "var-1", "quantity": 1 }
  ]
}
```
* **Implementation:** `InventoryController` → `InventoryService` (`@Transactional`).

---

## 4. Shopping Cart APIs (`CartController.java`)

### 4.1 Get Cart
* **Method:** `GET`
* **Endpoint:** `/api/v1/cart`
* **Purpose:** Retrieves authenticated user's active shopping cart and line items.
* **Authentication:** `isAuthenticated()`
* **Implementation:** `CartController` → `CartService` → `CartRepository` → `carts`, `cart_items` tables.
* **Frontend Caller:** `cartApi.getCart()`.

---

### 4.2 Add Item to Cart
* **Method:** `POST`
* **Endpoint:** `/api/v1/cart/items`
* **Purpose:** Adds an item with authoritative price verification from the database.
* **Authentication:** `isAuthenticated()`
* **Request Body:**
```json
{
  "productId": "1",
  "variantId": "var-1",
  "quantity": 1
}
```
* **Implementation:** `CartController` → `CartService` → `CartRepository`, `CartItemRepository`.
* **Frontend Caller:** `cartApi.addItem()`.

---

### 4.3 Update Cart Item Quantity
* **Method:** `PUT`
* **Endpoint:** `/api/v1/cart/items/{itemId}`
* **Request Body:** `{ "quantity": 2 }`
* **Implementation:** `CartController` → `CartService`.
* **Frontend Caller:** `cartApi.updateItemQuantity()`.

---

### 4.4 Remove Cart Item & Clear Cart
* **Method:** `DELETE` on `/api/v1/cart/items/{itemId}` and `/api/v1/cart`
* **Implementation:** `CartController` → `CartService`.
* **Frontend Caller:** `cartApi.removeItem()`, `cartApi.clearCart()`.

---

## 5. Checkout & Orders APIs (`CheckoutController.java` & `OrderController.java`)

### 5.1 Preview Checkout Totals
* **Method:** `GET` / `POST`
* **Endpoint:** `/api/v1/checkout/preview`
* **Purpose:** Returns server-authoritative subtotal, tax (18% GST), shipping fee, and coupon discounts.
* **Authentication:** `isAuthenticated()`
* **Query / Body Parameters:** `shippingAddressId`, `couponCode`
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subtotal": 78999.00,
    "shippingFee": 0.00,
    "tax": 14219.82,
    "discount": 0.00,
    "totalAmount": 93218.82,
    "items": [...]
  }
}
```
* **Implementation:** `CheckoutController` → `OrderService`.
* **Frontend Caller:** `orderApi.previewCheckout()`.

---

### 5.2 Process Checkout / Place Order
* **Method:** `POST`
* **Endpoint:** `/api/v1/checkout`
* **Purpose:** Atomically reserves stock, creates order and order items, and empties the shopping cart.
* **Authentication:** `isAuthenticated()`
* **Request Body:**
```json
{
  "shippingAddressId": "addr-1",
  "paymentMethod": "RAZORPAY",
  "couponCode": "WELCOME10"
}
```
* **Success Response (201 Created):** Returns `ApiResponse<OrderDto>` with generated `orderNumber`.
* **Implementation:** `CheckoutController` → `OrderService` → `OrderRepository`, `OrderItemRepository`, `orders` table.
* **Frontend Caller:** `orderApi.checkout()`.

---

### 5.3 Order History & Order Details
* **Method:** `GET` on `/api/v1/orders` and `/api/v1/orders/{orderId}`
* **Authentication:** `isAuthenticated()`
* **Implementation:** `OrderController` → `OrderService` → `OrderRepository`.
* **Frontend Caller:** `orderApi.getOrders()`, `orderApi.getOrderById()`.

---

### 5.4 Cancel Order
* **Method:** `POST`
* **Endpoint:** `/api/v1/orders/{orderId}/cancel`
* **Purpose:** Cancels an order if in `PENDING` or `CONFIRMED` status and releases reserved stock.
* **Authentication:** `isAuthenticated()`
* **Implementation:** `OrderController` → `OrderService`.
* **Frontend Caller:** `orderApi.cancelOrder()`.

---

## 6. Payment APIs (`PaymentController.java`)

### 6.1 Create Payment
* **Method:** `POST`
* **Endpoint:** `/api/v1/payments/create`
* **Request Body:** `{ "orderId": "ord-1025", "provider": "RAZORPAY", "currency": "INR" }`
* **Implementation:** `PaymentController` → `PaymentService` → `PaymentRepository` → `payments` table.
* **Frontend Caller:** `paymentApi.createPayment()`.

---

### 6.2 Payment Webhook Receiver
* **Method:** `POST`
* **Endpoint:** `/api/v1/payments/webhook`
* **Headers:** `X-Razorpay-Signature` or `X-Webhook-Signature`
* **Purpose:** Handles external payment provider callbacks, validates HMAC signature, transitions payment to `PAID`, and commits inventory reservations.
* **Authentication:** Public / Webhook Signature.
* **Implementation:** `PaymentController` → `PaymentService`.

---

## 7. 3D Room Visualization APIs (`VisualizationController.java` & `VisualizationSessionController.java`)

### 7.1 Register Room Background Image
* **Method:** `POST`
* **Endpoint:** `/api/v1/rooms`
* **Authentication:** `isAuthenticated()`
* **Request Body:** `{ "name": "Living Room", "imageUrl": "https://..." }`
* **Implementation:** `VisualizationController` → `VisualizationService` → `RoomImageRepository` → `room_images` table.

---

### 7.2 Save / Persist 3D Room Design (`TICKET-029`)
* **Method:** `POST`
* **Endpoint:** `/api/v1/designs` (Also `/api/v1/visualizations`, `/api/v1/visualization/sessions`)
* **Authentication:** Public or Authenticated (`principal` optional for guest draft saves).
* **Request Body:**
```json
{
  "name": "Minimalist Master Suite",
  "roomImageUrl": "https://...",
  "sceneData": "[{\"productId\":\"1\",\"position\":[0,0,0],\"rotation\":[0,0,0],\"scale\":[1,1,1]}]"
}
```
* **Success Response (201 Created):** Returns `ApiResponse<VisualizationSessionDto>`.
* **Implementation:** `VisualizationSessionController` → `VisualizationService` → `VisualizationSessionRepository` → `visualization_sessions` table.
* **Frontend Caller:** `designApi.saveDesign()`.

---

### 7.3 List / Rename / Delete Saved Designs (`TICKET-030`)
* **Endpoints:**
  * `GET /api/v1/designs`: List user's saved designs (`designApi.getDesigns()`).
  * `PATCH /api/v1/designs/{id}/rename`: Rename design (`designApi.renameDesign()`).
  * `DELETE /api/v1/designs/{id}`: Delete design (`designApi.deleteDesign()`).
* **Authentication:** `isAuthenticated()`
* **Implementation:** `VisualizationSessionController` → `VisualizationService`.

---

## 8. S3 Direct Presigned Upload APIs (`StorageController.java`)

### 8.1 Generate Direct S3 Presigned Upload URL
* **Method:** `POST`
* **Endpoint:** `/api/v1/storage/presigned-upload-url`
* **Purpose:** Generates a signed, short-lived AWS S3 / MinIO upload URL allowing browser to PUT binaries directly.
* **Authentication:** `isAuthenticated()`. *(Note: `PRODUCT_IMAGE` and `3D_MODEL` types strictly require `ROLE_ADMIN`).*
* **Request Body:**
```json
{
  "filename": "sofa-model.glb",
  "contentType": "model/gltf-binary",
  "fileSize": 4500000,
  "resourceType": "3D_MODEL"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "http://localhost:9000/furniture-store-assets/models/sofa-model.glb?...",
    "fileUrl": "http://localhost:9000/furniture-store-assets/models/sofa-model.glb",
    "key": "models/sofa-model.glb",
    "expiresInSeconds": 900,
    "maxSizeBytes": 52428800,
    "contentType": "model/gltf-binary"
  }
}
```
* **Implementation:** `StorageController` → `StorageService` (`S3Presigner`).
* **Frontend Caller:** `productApi.requestPresignedUpload()`.

---

## 9. Admin Operations APIs (`AdminController.java` & `AdminOrderController.java`)

| Method | Endpoint | Required Role | Purpose | Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | `ADMIN` | Returns executive KPI metrics (sales, order counts, customer counts, low-stock alerts) | `AdminController.getDashboardStats` |
| `GET` | `/api/v1/admin/customers` | `ADMIN` | Lists registered customer directory with order frequency | `AdminController.getCustomers` |
| `GET` | `/api/v1/admin/assets` | `ADMIN` | Lists digital 3D GLB assets and metadata | `AdminController.getAssets` |
| `GET` | `/api/v1/admin/orders` | `ADMIN`, `STAFF` | Paginated queue of all orders | `AdminOrderController.getAllOrders` |
| `PUT` | `/api/v1/admin/orders/{id}/status` | `ADMIN`, `STAFF` | Updates order state with transition enforcement | `AdminOrderController.updateOrderStatus` |
| `POST` | `/api/v1/products` | `ADMIN` | Creates new catalog product | `ProductController.createProduct` |
| `POST` | `/api/v1/products/{id}/model` | `ADMIN` | Associates 3D GLB model with product | `ProductController.saveProductModel` |
| `PUT` | `/api/v1/inventory/variant/{id}` | `ADMIN`, `STAFF` | Updates absolute stock level | `InventoryController.updateStock` |
| `POST` | `/api/v1/inventory/variant/{id}/adjust` | `ADMIN`, `STAFF` | Relative stock adjustment (+/- reconciliation) | `InventoryController.adjustStock` |
