# 08. Frontend to API Mapping

This document provides a trace for every frontend component in FunArray, showing the exact API function it invokes, the HTTP method/endpoint, the handling Spring Boot controller, the transactional service, and the underlying database table.

---

## 1. Master Frontend → Backend Trace Matrix

| Page | UI Component | Frontend Function / Action | HTTP Method & Endpoint | Backend Controller | Backend Service | Primary Database Table |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `LoginPage` | `authApi.login(payload)` | `POST /api/v1/auth/login` | `AuthController` | `AuthService` | `users` |
| **Register** | `RegisterPage` | `authApi.register(payload)` | `POST /api/v1/auth/register` | `AuthController` | `AuthService` | `users` |
| **Navbar** | `Navbar` / `AuthProvider` | `authApi.getCurrentUser()` | `GET /api/v1/users/me` | `UserController` | `UserService` | `users` |
| **Navbar** | `Navbar` | `authApi.logout(refreshToken)` | `POST /api/v1/auth/logout` | `AuthController` | `AuthService` | In-memory blacklist |
| **Home** | `CategoryGrid` | `productApi.getCategories()` | `GET /api/v1/categories` | `CategoryController` | `CategoryService` | `categories` |
| **Home** | `FeaturedProducts` | `productApi.getProducts(...)` | `GET /api/v1/products` | `ProductController` | `ProductService` | `products`, `product_images` |
| **Catalog** | `ProductsPage` | `productApi.getProducts(params)` | `GET /api/v1/products` | `ProductController` | `ProductService` | `products`, `product_variants` |
| **Catalog** | `ProductsPage` | `productApi.getCategoryTree()` | `GET /api/v1/categories/tree` | `CategoryController` | `CategoryService` | `categories` |
| **Product Detail** | `ProductDetailView` | `productApi.getProductById(id)` | `GET /api/v1/products/{id}` | `ProductController` | `ProductService` | `products`, `furniture_models` |
| **Product Detail** | `ProductDetailView` | `reviewApi.getProductReviews(id)` | `GET /api/v1/products/{id}/reviews` | `ReviewController` | `ReviewService` | `reviews`, `users` |
| **Product Detail** | `ProductDetailView` | `reviewApi.createReview(id, payload)` | `POST /api/v1/products/{id}/reviews` | `ReviewController` | `ReviewService` | `reviews` |
| **Product Detail** | `ProductDetailView` | `cartApi.addItem({productId, ...})` | `POST /api/v1/cart/items` | `CartController` | `CartService` | `carts`, `cart_items` |
| **Product Detail** | `ARPreviewModal` | `productApi.getProductARAsset(id)` | `GET /api/v1/products/{id}/ar` | `ProductController` | `ProductService` | `furniture_models` |
| **3D Studio** | `VisualizePage` | `productApi.requestPresignedUpload(...)` | `POST /api/v1/storage/presigned-upload-url` | `StorageController` | `StorageService` | S3 / MinIO Bucket |
| **3D Studio** | `VisualizePage` | `visualizationApi.uploadRoomImage(file)` | `POST /api/v1/rooms` | `VisualizationController` | `VisualizationService` | `room_images` |
| **3D Studio** | `FurnitureToolbar` | `designApi.saveDesign(payload)` | `POST /api/v1/designs` | `VisualizationSessionController` | `VisualizationService` | `visualization_sessions` |
| **Saved Designs** | `DesignsPage` | `designApi.getDesigns()` | `GET /api/v1/designs` | `VisualizationSessionController` | `VisualizationService` | `visualization_sessions` |
| **Saved Designs** | `DesignsPage` | `designApi.renameDesign(id, name)` | `PATCH /api/v1/designs/{id}/rename` | `VisualizationSessionController` | `VisualizationService` | `visualization_sessions` |
| **Saved Designs** | `DesignsPage` | `designApi.deleteDesign(id)` | `DELETE /api/v1/designs/{id}` | `VisualizationSessionController` | `VisualizationService` | `visualization_sessions` |
| **Cart** | `CartPage` / `CartDrawer` | `cartApi.getCart()` | `GET /api/v1/cart` | `CartController` | `CartService` | `carts`, `cart_items` |
| **Cart** | `CartPage` / `CartDrawer` | `cartApi.updateItemQuantity(itemId, qty)` | `PUT /api/v1/cart/items/{itemId}` | `CartController` | `CartService` | `cart_items` |
| **Cart** | `CartPage` / `CartDrawer` | `cartApi.removeItem(itemId)` | `DELETE /api/v1/cart/items/{itemId}` | `CartController` | `CartService` | `cart_items` |
| **Cart** | `CartPage` | `cartApi.clearCart()` | `DELETE /api/v1/cart` | `CartController` | `CartService` | `cart_items` |
| **Checkout** | `CheckoutPage` | `addressApi.getAddresses()` | `GET /api/v1/addresses` | `AddressController` | `AddressService` | `addresses` |
| **Checkout** | `CheckoutPage` | `addressApi.createAddress(payload)` | `POST /api/v1/addresses` | `AddressController` | `AddressService` | `addresses` |
| **Checkout** | `CheckoutPage` | `orderApi.previewCheckout(addrId, promo)` | `GET /api/v1/checkout/preview` | `CheckoutController` | `OrderService` | `products`, `cart_items` |
| **Checkout** | `CheckoutPage` | `orderApi.checkout(payload)` | `POST /api/v1/checkout` | `CheckoutController` | `OrderService` | `orders`, `order_items`, `inventory` |
| **Checkout** | `CheckoutPage` | `paymentApi.createPayment(payload)` | `POST /api/v1/payments/create` | `PaymentController` | `PaymentService` | `payments` |
| **Orders** | `OrdersPage` | `orderApi.getOrders()` | `GET /api/v1/orders` | `OrderController` | `OrderService` | `orders`, `order_items` |
| **Order Detail** | `OrderDetailPage` | `orderApi.getOrderById(id)` | `GET /api/v1/orders/{id}` | `OrderController` | `OrderService` | `orders`, `order_items`, `addresses` |
| **Order Detail** | `OrderDetailPage` | `orderApi.cancelOrder(id)` | `POST /api/v1/orders/{id}/cancel` | `OrderController` | `OrderService` | `orders`, `inventory` |
| **Admin Dashboard**| `AdminDashboardPage` | `adminApi.getDashboardStats()` | `GET /api/v1/admin/dashboard` | `AdminController` | `ProductRepository`, `OrderRepository` | `orders`, `products`, `users` |
| **Admin Products** | `AdminProductsPage` | `adminApi.createProduct(payload)` | `POST /api/v1/products` | `ProductController` | `ProductService` | `products` |
| **Admin Products** | `AdminProductsPage` | `adminApi.saveProductModel(id, payload)` | `POST /api/v1/products/{id}/model` | `ProductController` | `ProductService` | `furniture_models` |
| **Admin Inventory**| `AdminInventoryPage`| `adminApi.getInventory(params)` | `GET /api/v1/inventory` | `InventoryController` | `InventoryService` | `inventory`, `product_variants` |
| **Admin Inventory**| `AdminInventoryPage`| `adminApi.updateVariantStock(id, qty)` | `PUT /api/v1/inventory/variant/{id}` | `InventoryController` | `InventoryService` | `inventory` |
| **Admin Orders** | `AdminOrdersPage` | `adminApi.getOrders(params)` | `GET /api/v1/admin/orders` | `AdminOrderController` | `OrderService` | `orders`, `order_items` |
| **Admin Orders** | `AdminOrdersPage` | `adminApi.updateOrderStatus(id, status)` | `PUT /api/v1/admin/orders/{id}/status` | `AdminOrderController` | `OrderService` | `orders` |
| **Admin Assets** | `AdminAssetsPage` | `adminApi.getAssets()` | `GET /api/v1/admin/assets` | `AdminController` | `FurnitureModelRepository` | `furniture_models` |
| **Admin Customers**| `AdminCustomersPage`| `adminApi.getCustomers()` | `GET /api/v1/admin/customers` | `AdminController` | `UserRepository`, `OrderRepository` | `users`, `orders` |
