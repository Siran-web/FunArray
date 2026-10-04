# System Architecture Diagram

This diagram represents the end-to-end architecture of **FunArray: Virtual Furniture Store with AR Room Preview**.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Next.js 16 / React 19 / TypeScript / Three.js)"]
        BrowserStorefront["Storefront UI\n(App Router: /products, /cart, /checkout, /designs)"]
        BrowserStudio["3D & AR Studio\n(/visualize, /products/[id])"]
        BrowserAdmin["Admin Portal\n(/admin/products, /admin/inventory, /admin/orders)"]
        StateStores["Client State\n(Zustand Stores & React Query)"]
        BrowserStorefront --> StateStores
        BrowserStudio --> StateStores
        BrowserAdmin --> StateStores
    end

    subgraph APIGateway ["HTTP / REST Gateway"]
        AuthFilter["JwtAuthenticationFilter & SecurityFilterChain\n(Stateless JWT Auth, CORS, Rate Limiting)"]
    end

    subgraph BackendServices ["Backend Layer (Spring Boot 3.3.4 / Java 21)"]
        AuthController["AuthController\n(AuthService)"]
        UserController["UserController / AddressController\n(UserService, AddressService)"]
        ProductController["ProductController / CategoryController\n(ProductService, CategoryService)"]
        InventoryController["InventoryController\n(InventoryService with Pessimistic Locking)"]
        CartController["CartController\n(CartService)"]
        CheckoutOrderController["CheckoutController / OrderController\n(OrderService)"]
        PaymentController["PaymentController\n(PaymentService)"]
        ReviewController["ReviewController\n(ReviewService)"]
        VisualizationController["VisualizationController / VisualizationSessionController\n(VisualizationService)"]
        StorageController["StorageController\n(StorageService)"]
        AdminController["AdminController / AdminOrderController / StaffOperationsController\n(ProductRepo, OrderRepo, UserRepo, InventoryRepo)"]
    end

    subgraph DataStorage ["Data & Persistence Layer"]
        PostgresDB[("Relational Database\nPostgreSQL 16 / MySQL 8.0\n16 Flyway Migrations (V1-V16)")]
        MongoDB[("MongoDB 7.0\n(Optional Spatial Document Store)")]
        S3Storage[("Object Storage\nAWS S3 / MinIO S3\n(GLB Models, Images, Room Scans)")]
    end

    StateStores -->|REST API Requests /api/v1/*| AuthFilter
    AuthFilter --> AuthController
    AuthFilter --> UserController
    AuthFilter --> ProductController
    AuthFilter --> InventoryController
    AuthFilter --> CartController
    AuthFilter --> CheckoutOrderController
    AuthFilter --> PaymentController
    AuthFilter --> ReviewController
    AuthFilter --> VisualizationController
    AuthFilter --> StorageController
    AuthFilter --> AdminController

    AuthController --> PostgresDB
    UserController --> PostgresDB
    ProductController --> PostgresDB
    InventoryController --> PostgresDB
    CartController --> PostgresDB
    CheckoutOrderController --> PostgresDB
    PaymentController --> PostgresDB
    ReviewController --> PostgresDB
    VisualizationController --> PostgresDB
    VisualizationController -.-> MongoDB
    StorageController --> S3Storage
    AdminController --> PostgresDB

    BrowserStudio -->|Direct PUT Uploads via Presigned URL| S3Storage
    BrowserStudio -->|Direct Model Fetch (.glb / .usdz)| S3Storage
```
