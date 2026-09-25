# FunArray: Virtual Furniture Store with AR Room Preview

> A hybrid omnichannel furniture-commerce platform connecting online shopping, interactive 3D/AR room visualization, and physical showroom operations with unified real-time inventory.

---

## 🏛️ System Architecture

```
Virtual Furniture Store (Monorepo)
├── frontend/               # Next.js (App Router, TypeScript, Tailwind CSS, Three.js)
│   ├── src/app/            # App Router pages (Storefront, Visualizer, Staff Portal)
│   ├── src/components/ui/  # Standardized design system primitives (Button, Input, Card, Badge, Modal)
│   ├── src/lib/            # Utility helpers (cn, formatPrice)
│   └── src/types/          # Typed domain contracts (Product, Auth, AR, Store)
│
├── backend/                # Spring Boot 3.x (Java 21/22, Maven)
│   ├── config/             # Spring Security 6, JWT, CORS, OpenAPI Swagger
│   ├── auth/               # Stateless JWT Token Provider & Auth Filters
│   ├── common/             # RFC 7807 problem details & standard ApiResponse envelopes
│   ├── health/             # Readiness & health check endpoints
│   └── resources/
│       ├── application*.yml# Multi-profile configurations (dev, test, prod)
│       └── db/migration/   # Flyway V1 to V15 migrations (PostgreSQL / MySQL compatible)
│
└── infrastructure/         # Local environment orchestration
    ├── docker-compose.yml  # MySQL 8.0, MongoDB 7.0, MinIO S3 Object Storage
    └── .env.example        # Environment variable specification
```

---

## 🎨 Design System & Visual Tokens

Strictly implemented according to the design specification:

* **Primary Palette:**
  * Primary Walnut: `#8B5E3C`
  * Primary Dark (Hover): `#634027`
  * Primary Light (Tint): `#F3E8DE`
* **Surfaces & Canvas:**
  * Background: `#FAF9F7`
  * Surface (Cards/Modals): `#FFFFFF`
  * Surface Secondary: `#F4F2EF`
  * Border Dividers: `#E5E0DA`
* **Typography:**
  * Primary UI Font: **Inter** (Navigation, body, buttons, specs)
  * Display Headline Font: **DM Serif Display** (Hero headlines, editorial collection spotlights)
* **Geometry & Elevation:**
  * 8px base spacing grid (`xs: 4px` to `5xl: 96px`)
  * Component Radii: Inputs (`10px`), Buttons (`10px`), Cards (`12px`), Large Cards (`16px`), Modals (`20px`), Pills (`9999px`)
  * Soft Natural Shadows: Card (`0 2px 8px rgba(0,0,0,0.06)`), Hover (`0 8px 24px rgba(0,0,0,0.10)`), Modal (`0 20px 60px rgba(0,0,0,0.18)`)

---

## 🗄️ Database Architecture & Migrations

The platform employs a clean persistence model:
1. **Relational Database (MySQL 8.0 / PostgreSQL):** System of record for users, addresses, categories, products, variants, images, 3D models, inventory, carts, cart items, orders, order items, payments, reviews, physical stores, and store-specific inventory.
2. **Flyway Migrations:** 15 modular SQL migrations in `backend/src/main/resources/db/migration/`:
   * `V1__create_users.sql`
   * `V2__create_addresses.sql`
   * `V3__create_categories.sql`
   * `V4__create_products.sql`
   * `V5__create_product_variants.sql`
   * `V6__create_product_images.sql`
   * `V7__create_furniture_models.sql`
   * `V8__create_inventory.sql`
   * `V9__create_carts.sql`
   * `V10__create_cart_items.sql`
   * `V11__create_orders.sql`
   * `V12__create_order_items.sql`
   * `V13__create_payments.sql`
   * `V14__create_reviews.sql`
   * `V15__create_stores_and_store_stock.sql`
3. **MongoDB:** Stores dynamic spatial documents (`saved_rooms`, `ar_sessions`, placement vectors `{x, y, z}`, constrained scale factors).

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18+) & **npm**
* **Java** (JDK 21 or 22)
* **Maven** (3.9+)
* Optional: **Docker Desktop** or native **MySQL 8.0**

### 2. Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive Phase 1 Architecture & Design System Showcase.

To build the production bundle:
```bash
npm run build
```

### 3. Backend Development
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
Swagger UI API documentation will be available at:
[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 🗺️ Phased Roadmap

* [x] **Phase 1: Foundation & Infrastructure** (Monorepo setup, Flyway migrations, JWT security, design tokens, base UI primitives).
* [ ] **Phase 2: Product Catalog & Omnichannel Inventory** (JPA entities, faceted search, homepage hero, PLP, PDP with swatches).
* [ ] **Phase 3: 3D Room Visualization MVP** (Room photo upload, React Three Fiber canvas, dimension-locked transforms).
* [ ] **Phase 4: Commerce Core** (Cart drawer, checkout stepper, payment integration, order tracking).
* [ ] **Phase 5: Saved Designs & Spatial Persistence** (MongoDB persistence for user room designs).
* [ ] **Phase 6: Store Staff Dashboard & Showroom POS** (POS checkout, warehouse stock lookup, QR generator).
* [ ] **Phase 7: Mobile Camera AR** (WebXR / Model-Viewer mobile surface detection).
* [ ] **Phase 8: Accessibility & Final Polish** (WCAG 2.2 AA audit, performance optimizations).