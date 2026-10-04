# 03. Project Structure

This document details the actual directory structure of the FunArray repository, explaining the purpose of each package, key files contained within, and guidelines on when each directory should be modified.

```
funArray/
├── .env.example                     # Environment template for local and containerized deployments
├── docker-compose.yml               # Multi-container orchestration (Postgres, MySQL, Mongo, MinIO)
├── README.md                        # Root developer overview and documentation index
│
├── frontend/                        # Next.js 16 (App Router) + React 19 Frontend
│   ├── package.json                 # Frontend dependencies and npm scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── src/
│   │   ├── app/                     # App Router pages, routes, layouts, and server views
│   │   ├── components/              # Modular UI components (UI primitives, 3D, AR, Commerce)
│   │   ├── services/                # Typed REST API service clients
│   │   ├── store/                   # Zustand global state stores
│   │   ├── hooks/                   # Custom React hooks (AR, Cart, Auth, Viz)
│   │   ├── types/                   # TypeScript interfaces and domain types
│   │   ├── lib/                     # Utilities (classnames, formatters)
│   │   ├── data/                    # Fallback seed & mock datasets
│   │   └── __tests__/               # Vitest unit and integration test suites
│
├── backend/                         # Spring Boot 3.3.4 (Java 21) REST Backend
│   ├── pom.xml                      # Maven dependencies (JPA, Security, JWT, Flyway, OpenAPI)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/furniture/store/
│   │   │   │   ├── FurnitureStoreApplication.java  # Main Spring Boot entrypoint
│   │   │   │   ├── auth/            # JWT authentication, security filters, login/register
│   │   │   │   ├── user/            # User profile and shipping address management
│   │   │   │   ├── product/         # Products, variants, images, and 3D GLB models
│   │   │   │   ├── category/        # Hierarchical category taxonomy
│   │   │   │   ├── inventory/       # Real-time stock tracking with pessimistic locking
│   │   │   │   ├── cart/            # Shopping cart with authoritative price validation
│   │   │   │   ├── order/           # Order state machine, checkout preview, fulfillment
│   │   │   │   ├── payment/         # Payment transactions & Razorpay webhook processor
│   │   │   │   ├── review/          # Product reviews and rating aggregations
│   │   │   │   ├── visualization/   # Room background images and 3D session layouts
│   │   │   │   ├── storage/         # S3 direct presigned upload URL generator
│   │   │   │   ├── admin/           # Admin dashboards, analytics, and staff tasks
│   │   │   │   ├── config/          # Spring Security, CORS, Rate Limiting, OpenApi, DataInitializer
│   │   │   │   ├── common/          # GlobalApiResponse, GlobalExceptionHandler
│   │   │   │   ├── exception/       # Custom domain exceptions (ResourceNotFound, InsufficientInventory)
│   │   │   │   └── health/          # System readiness & database health checks
│   │   │   └── resources/
│   │   │       ├── application*.yml # Multi-environment YAML configs (dev, postgres, prod, test)
│   │   │       └── db/migration/    # Flyway SQL schema migrations (V1 to V16)
│   │   └── test/                    # JUnit 5 & Testcontainers integration test suites
│
└── infrastructure/                  # Infrastructure as Code & Orchestration
    ├── docker/                      # Dockerfile.frontend & Dockerfile.backend
    ├── docker-compose.yml           # Local infrastructure stack
    ├── nginx/nginx.conf             # Reverse proxy configuration
    └── terraform/                   # CloudFront, ECS, RDS, Networking, S3 modules
```

---

## Detailed Directory Breakdown

### 1. Frontend Pages (`frontend/src/app/`)
* **Path:** `frontend/src/app/`
* **Purpose:** Next.js App Router route hierarchy defining all customer and administrative pages.
* **Important Files:**
  * `layout.tsx`: Root HTML wrapper, Google Fonts (`Inter`, `DM Serif Display`), `AuthProvider`, `Navbar`, and `Footer`.
  * `page.tsx`: Storefront landing page (Hero, Categories, Featured Products, Omnichannel showroom, AR Banner).
  * `products/page.tsx`: Catalog browsing grid with filters, search, and sorting.
  * `products/[id]/page.tsx` & `product-detail-view.tsx`: Rich product detail page with variant selection, 3D AR launch modal, specifications, and customer reviews.
  * `visualize/page.tsx` & `visualize/[productId]/page.tsx`: Interactive 3D Room Visualizer studio with floor alignment and multi-furniture arrangement.
  * `designs/page.tsx`: Saved 3D room design gallery for authenticated users.
  * `cart/page.tsx`: Full shopping cart management view.
  * `checkout/page.tsx`: 3-step checkout flow (Address → Payment Method → Order Confirmation).
  * `orders/page.tsx` & `orders/[id]/page.tsx`: User order history and receipt tracking.
  * `login/page.tsx` & `register/page.tsx`: Customer and admin authentication views.
  * `admin/layout.tsx` & `admin/page.tsx`: Admin portal dashboard with metrics.
  * `admin/products/page.tsx`, `admin/inventory/page.tsx`, `admin/orders/page.tsx`, `admin/assets/page.tsx`, `admin/customers/page.tsx`, `admin/categories/page.tsx`: Admin back-office views.
* **When to Modify:** When creating new routes, updating page layouts, or altering page-level state.

---

### 2. Frontend 3D & AR Visualization (`frontend/src/components/visualization/` & `frontend/src/components/ar/`)
* **Path:** `frontend/src/components/visualization/` & `frontend/src/components/ar/`
* **Purpose:** Three.js WebGL canvas rendering, camera AR streaming, floor plane alignment, reticle tracking, and 3D model loaders.
* **Important Files:**
  * `RoomViewer.tsx`: Main Three.js canvas managing 3D furniture models, lighting, shadows, raycasting, and room backgrounds.
  * `FurnitureControls.tsx`: UI controls for selecting, rotating, locking, and deleting furniture in the 3D scene.
  * `FurnitureToolbar.tsx`: Top visualizer toolbar for saving designs, clearing scenes, adjusting floor calibration, and toggling lighting modes.
  * `RoomFloorAlignmentController.tsx`: Interactive horizon and floor pitch calibration overlay for perspective matching.
  * `ModelLoader.ts`: Asynchronous GLTF/GLB loader with automatic caching and physical bounding-box computation.
  * `LightingEnvironment.ts`: Configurable Three.js lighting rigs (warm, studio, daylight) and soft shadow generators.
  * `camera-ar-viewer.tsx`: Live WebRTC camera AR viewer with real-time floor plane tracking, smooth LERP reticles, and zero-persistence privacy.
  * `ARSurfaceManager.ts`: Raycaster and normal-based floor surface validator.
  * `ARDepthOcclusion.ts`: WebXR depth-sensing and GPU shader injection for realistic occlusion behind foreground objects.
* **When to Modify:** When improving 3D rendering quality, adding AR gestures, updating shaders, or tweaking lighting presets.

---

### 3. Frontend API Services (`frontend/src/services/`)
* **Path:** `frontend/src/services/`
* **Purpose:** Typed API communication layer connecting React components to Spring Boot endpoints.
* **Important Files:**
  * `api.ts`: Central `fetchWithAuth` wrapper with bearer token injection, HTTP 401 interceptor, and silent refresh token rotation.
  * `authApi.ts`: Login, registration, refresh token, and user profile endpoints.
  * `productApi.ts`: Catalog querying, product details, category tree, and S3 presigned upload requests.
  * `cartApi.ts`: Shopping cart CRUD.
  * `orderApi.ts`: Checkout preview, order placement, order status updates, and tracking.
  * `paymentApi.ts`: Razorpay order creation and payment details.
  * `designApi.ts`: Saved 3D room design management (`/designs`).
  * `adminApi.ts`: Administrative endpoints for products, inventory, orders, customers, and digital assets.
* **When to Modify:** When adding new backend endpoints or altering request/response DTO structures.

---

### 4. Frontend State Stores (`frontend/src/store/`)
* **Path:** `frontend/src/store/`
* **Purpose:** Lightweight client state management using Zustand.
* **Important Files:**
  * `authStore.ts`: Authentication state, user profile, tokens, and role checking.
  * `cartStore.ts`: Client cart items, quantity modifiers, and drawer visibility.
  * `visualizationStore.ts`: 3D room scene state, placed furniture list, selected item, floor alignment configuration, and view mode (`studio`, `room-photo`, `camera-ar`).
  * `wishlistStore.ts`: Bookmarked product IDs with localStorage persistence.
* **When to Modify:** When adding global client state or altering scene manipulation actions.

---

### 5. Backend Controllers (`backend/src/main/java/com/furniture/store/*/controller/`)
* **Path:** `backend/src/main/java/com/furniture/store/`
* **Purpose:** Spring MVC REST controllers exposing JSON APIs.
* **Important Files:**
  * `AuthController.java`: `/api/v1/auth/*` (register, login, refresh, logout).
  * `ProductController.java`: `/api/v1/products/*` (catalog browsing, variants, images, 3D GLB model associations).
  * `CategoryController.java`: `/api/v1/categories/*` (hierarchical category taxonomy).
  * `InventoryController.java`: `/api/v1/inventory/*` (stock queries, reservations, releases, commits).
  * `CartController.java`: `/api/v1/cart/*` (authenticated user cart operations).
  * `CheckoutController.java` & `OrderController.java`: `/api/v1/checkout/*`, `/api/v1/orders/*`.
  * `PaymentController.java`: `/api/v1/payments/*` (payment creation & webhook receiver).
  * `VisualizationController.java` & `VisualizationSessionController.java`: `/api/v1/rooms/*`, `/api/v1/designs/*`.
  * `StorageController.java`: `/api/v1/storage/presigned-upload-url`.
  * `AdminController.java` & `AdminOrderController.java`: `/api/v1/admin/*`.
* **When to Modify:** When exposing new HTTP endpoints or changing endpoint routing/parameters.

---

### 6. Backend Services & Repositories (`backend/src/main/java/com/furniture/store/*/service/` & `repository/`)
* **Path:** `backend/src/main/java/com/furniture/store/`
* **Purpose:** Core transactional business logic and JPA database access.
* **Important Files:**
  * `InventoryService.java`: Atomic inventory reservations with pessimistic row locking (`PESSIMISTIC_WRITE`).
  * `OrderService.java`: Order state machine transitions and server-authoritative tax/shipping computations.
  * `ProductService.java`: Catalog indexing and variant management.
  * `AuthService.java`: Password hashing with BCrypt and JWT issuance.
  * `StorageService.java`: AWS S3 SDK presigned URL generation.
* **When to Modify:** When adding business rules, validation constraints, or complex database queries.

---

### 7. Database Migrations (`backend/src/main/resources/db/migration/`)
* **Path:** `backend/src/main/resources/db/migration/`
* **Purpose:** Versioned, immutable Flyway SQL migrations.
* **Important Files:**
  * `V1__create_users.sql` to `V16__create_room_images_and_sessions.sql`.
* **When to Modify:** **NEVER edit existing V1–V16 migration files**. Always create a new sequential file (e.g., `V17__add_new_feature_table.sql`) when modifying schema.
