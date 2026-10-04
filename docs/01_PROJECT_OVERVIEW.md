# 01. Project Overview

## 1. What is FunArray?

**FunArray (Virtual Furniture Store)** is a full-stack, enterprise-grade e-commerce and spatial computing platform designed for modern luxury and architectural furniture retail. It connects customer discovery, photorealistic 3D room visualization, mobile augmented reality (AR) placement, and physical showroom operations with unified real-time inventory management.

---

## 2. What Problem Does It Solve?

Traditional furniture e-commerce suffers from high return rates (~30–40%) and low purchase confidence because customers cannot easily determine:
1. **Physical Scale & Proportions:** Will this 3-seater sofa fit between my living room walls?
2. **Material & Color Harmonies:** How will cognac leather look against my current hardwood floor and lighting?
3. **Multi-Item Arrangements:** How does the coffee table pair with the armchair in a cohesive layout?
4. **Omnichannel Disconnect:** Is the item in stock right now at my local city showroom for immediate pickup?

FunArray solves these issues by providing **interactive 3D studio staging**, **camera AR with 1:1 true physical scale (100 cm = 1 m)**, and **real-time stock reservation** across central warehouses and physical showrooms.

---

## 3. Target Audiences & Personas

| Persona | Role | Key Interactions |
| :--- | :--- | :--- |
| **Retail Customer** | End Buyer / Interior Enthusiast | Browses catalog, customizes finishes, visualizes furniture in room photos, places models in live camera AR, manages cart, executes multi-step checkout, and tracks orders. |
| **Interior Designer** | Professional Specifier | Arranges multi-furniture layouts on room images, adjusts perspective and floor pitch calibration, saves named design concepts, and exports bill of materials. |
| **Showroom Staff** | In-Store Sales Specialist | Checks omnichannel inventory availability across warehouses, assists walk-in customers, and monitors assigned tasks. |
| **Platform Administrator** | Store Owner / Catalog Manager | Manages product taxonomy, creates variants, uploads 3D GLB models and high-res imagery, adjusts inventory ledgers, and controls order state fulfillment. |

---

## 4. Key Customer Features

* **Rich Catalog Browsing:** Real-time search, hierarchical category taxonomy, price filtering, sort algorithms, and live stock badges.
* **Interactive 3D Room Studio (`/visualize`):** Upload room photos, customize floor calibration (elevation, pitch angle, camera FOV), place multiple 3D furniture models, rotate, duplicate, and lock items.
* **Live WebRTC Camera AR (`CameraARViewer`):** Real-time floor plane detection, smooth 3D reticle tracking, WebXR surface detection, real-world depth occlusion hooks, micro-nudge positioning, and 45° incremental rotations.
* **Saved Room Designs (`/designs`):** Persistent cloud storage for custom 3D room arrangements with one-click reload and direct-to-cart additions.
* **Full Commerce Journey:** Persistent shopping cart, server-authoritative checkout calculations (subtotal, shipping, 18% GST tax, coupon discounts), and multi-state order tracking.
* **Customer Reviews & Ratings (`TICKET-031`):** Verified customer product feedback, 5-star ratings, and review moderation.

---

## 5. Key Admin & Operations Features

* **Executive Analytics Dashboard (`/admin`):** Live KPI cards for gross sales, order volume, catalog counts, registered customers, 3D digital asset counts, and low-stock alerts.
* **Catalog & Digital Asset Studio (`/admin/products`, `/admin/assets`):** Complete product CRUD, variant creation with dedicated SKUs, gallery uploads, and 3D GLB model specifications.
* **Real-Time Stock Ledger (`/admin/inventory`):** Dynamic stock tracking with formula `available = quantity - reserved`, low-stock threshold triggers, and relative reconciliation.
* **Order Fulfillment Pipeline (`/admin/orders`):** State-machine enforced order lifecycle (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` / `CANCELLED`).
* **Customer Directory (`/admin/customers`):** Central customer registry with historical order frequency and contact details.

---

## 6. Technology Stack Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                               │
│ Next.js 16.3.6 (App Router) | React 19.2.8 | TypeScript 5              │
│ Three.js 0.186.1 (WebGL 3D Engine) | Zustand 5.0.15 (State Stores)    │
│ Tailwind CSS v4 | Lucide React Icons | Vitest 5.0.2                   │
├────────────────────────────────────────────────────────────────────────┤
│ BACKEND                                                                │
│ Java 21 / 22 | Spring Boot 3.3.4 (Maven)                              │
│ Spring Security 6 (Stateless JWT Token Provider & Filters)            │
│ Spring Data JPA (Hibernate ORM) | Flyway Migrations (V1 to V16)        │
│ Spring Validation (Jakarta @Valid) | Springdoc OpenAPI 3 (Swagger UI)  │
├────────────────────────────────────────────────────────────────────────┤
│ DATABASE & STORAGE                                                     │
│ PostgreSQL 16 / MySQL 8.0 (Primary System of Record)                   │
│ MongoDB 7.0 (Spatial Document Engine)                                  │
│ AWS S3 / MinIO S3 (Presigned Direct Object Storage)                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. High-Level Architecture Summary

FunArray adopts a **decoupled monorepo architecture**:
1. **Frontend (`/frontend`):** Server-rendered and client-hydrated Next.js App Router application communicating with the backend via stateless REST APIs.
2. **Backend (`/backend`):** Production-grade Spring Boot API providing domain services, strict transactional boundaries, pessimistic database locks for inventory reservations, and JWT security filters.
3. **Object Storage (`/infrastructure` / AWS S3 / MinIO):** High-speed direct uploads for large 3D assets (`.glb`), room scans, and product photographs using short-lived S3 Presigned URLs.

---

## 8. Important External Services & Integrations

* **AWS S3 / MinIO S3:** Direct client binary uploads and asset CDN hosting.
* **Razorpay / Payment Gateway:** Order payment creation and webhook signature validation (`X-Razorpay-Signature`).
* **WebXR Device API & Apple QuickLook USDZ:** Mobile AR platform capabilities for native iOS/Android AR viewing.

---

## 9. Important Directories

| Path | Purpose |
| :--- | :--- |
| `frontend/src/app/` | Next.js App Router pages and layouts. |
| `frontend/src/components/visualization/` | Three.js 3D Room Viewer, floor alignment, lighting, and model loaders. |
| `frontend/src/components/ar/` | Live Camera AR engine, surface manager, and depth occlusion hooks. |
| `frontend/src/services/` | Typed API clients with automatic JWT injection and 401 token refresh. |
| `frontend/src/store/` | Zustand state stores for auth, cart, wishlist, and 3D visualization. |
| `backend/src/main/java/com/furniture/store/` | Spring Boot controllers, services, entities, DTOs, and repositories. |
| `backend/src/main/resources/db/migration/` | Flyway SQL migrations (V1 to V16). |
| `infrastructure/` | Local Docker Compose setup and Terraform modules. |

---

## 📖 New Developer — Start Here

Welcome to the FunArray team! Follow this recommended reading path to onboard smoothly:

1. **[02_DEVELOPER_ONBOARDING.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/02_DEVELOPER_ONBOARDING.md)**: Set up your local environment, database, backend, and frontend.
2. **[03_PROJECT_STRUCTURE.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/03_PROJECT_STRUCTURE.md)**: Explore the repository structure and understand file locations.
3. **[04_SYSTEM_ARCHITECTURE.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/04_SYSTEM_ARCHITECTURE.md)**: Understand the end-to-end request lifecycle and component boundaries.
4. **[05_FRONTEND_ARCHITECTURE.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/05_FRONTEND_ARCHITECTURE.md)** & **[06_COMPONENT_MAP.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/06_COMPONENT_MAP.md)**: Learn how the Next.js UI is assembled.
5. **[07_API_DOCUMENTATION.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/07_API_DOCUMENTATION.md)** & **[08_FRONTEND_API_MAPPING.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/08_FRONTEND_API_MAPPING.md)**: Explore all available REST endpoints and their frontend callers.
6. **[09_BACKEND_ARCHITECTURE.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/09_BACKEND_ARCHITECTURE.md)** & **[10_DATABASE_DOCUMENTATION.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/10_DATABASE_DOCUMENTATION.md)**: Learn backend business logic, JPA entities, and migrations.
7. **[13_AR_3D_DOCUMENTATION.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/13_AR_3D_DOCUMENTATION.md)**: Deep dive into Three.js, camera AR, plane detection, and physical scale calculations.
8. **[16_DEVELOPMENT_WORKFLOW.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/16_DEVELOPMENT_WORKFLOW.md)**: How to build features, write tests, and submit PRs.
