# FunArray Developer Technical Documentation

> **Master Architecture, Engineering Specs & Developer Onboarding Documentation** for FunArray: Virtual Furniture Store with AR Room Preview.

---

## 🗺️ Documentation Organization

The documentation suite is categorized into specialized sections:

```
docs/
├── README.md                          # Master Entry Point & Navigation Map
├── 01_PROJECT_OVERVIEW.md             # Project Overview & Reading Guide
├── 02_DEVELOPER_ONBOARDING.md         # Quickstart Developer Onboarding
├── 18_GLOSSARY.md                     # Domain & Technical Glossary
│
├── architecture/                      # 🏛️ System & Component Architecture
│   ├── README.md                      # Section Overview
│   ├── system-architecture.md         # End-to-end multi-tier architecture
│   ├── frontend-architecture.md       # Next.js 16 App Router & Zustand state
│   ├── backend-architecture.md        # Spring Boot 3.3.4 layered patterns
│   ├── component-map.md               # UI component hierarchy & trace table
│   ├── project-structure.md           # Monorepo directory breakdown
│   └── authentication-security.md     # Stateless JWT, RBAC & security headers
│
├── api/                               # 🔌 REST API Specifications & Contracts
│   ├── README.md                      # Section Overview
│   ├── api-documentation.md           # Complete REST API endpoint reference
│   └── frontend-api-mapping.md        # UI component to backend API trace matrix
│
├── database/                          # 🗄️ Database Schemas & Persistence
│   ├── README.md                      # Section Overview
│   └── database-documentation.md      # All 16 Flyway tables (V1-V16) reference
│
├── features/                          # 📦 Functional Walkthroughs & Modules
│   ├── README.md                      # Section Overview
│   ├── feature-documentation.md       # 14 implemented feature flows
│   ├── ar-3d-documentation.md         # Three.js WebGL & WebRTC Camera AR engine
│   └── admin-documentation.md         # Admin portal & fulfillment pipeline
│
├── workflow/                          # 🛠️ Development, Setup & Troubleshooting
│   ├── README.md                      # Section Overview
│   ├── environment-setup.md           # Environment variables reference
│   ├── development-workflow.md        # Git branching, tests & PR standards
│   └── troubleshooting.md             # Common errors & step-by-step fixes
│
└── diagrams/                          # 🎨 Visual Architecture & Flow Diagrams
    ├── README.md                      # Diagrams Index
    ├── system-architecture.md         # System tier diagram
    ├── frontend-architecture.md       # Next.js component tree diagram
    ├── backend-architecture.md        # Spring Boot filter & service diagram
    ├── database-er.md                 # Complete entity-relationship ER diagram
    ├── component-api-flow.md          # UI to DB sequence flow diagram
    ├── authentication-flow.md         # JWT login & refresh sequence diagram
    ├── product-flow.md                # Catalog & search flow diagram
    ├── cart-order-flow.md             # Commerce & checkout sequence diagram
    ├── ar-flow.md                     # 3D Studio & Camera AR flow diagram
    └── admin-flow.md                  # Admin back-office workflow diagram
```

---

## 📚 Categorized Technical Sections

### 1. 🚀 Quickstart & Onboarding
* [**01. Project Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/01_PROJECT_OVERVIEW.md): Business goals, target personas, luxury design philosophy, and recommended reading order.
* [**02. Developer Onboarding**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/02_DEVELOPER_ONBOARDING.md): Local environment prerequisites, Docker containers, startup commands, and default test credentials.
* [**18. Domain Glossary**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/18_GLOSSARY.md): Plain-language definitions for domain, 3D spatial, e-commerce, and database terminology.

### 2. 🏛️ Architecture (`docs/architecture/`)
* [**Architecture Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/README.md)
* [**System Architecture**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/system-architecture.md): Request lifecycles, service boundaries, and security filters.
* [**Frontend Architecture**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/frontend-architecture.md): App Router routing, Zustand state management, and page specs.
* [**Backend Architecture**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/backend-architecture.md): Spring Boot services, JPA repositories, exceptions, and pessimistic locks.
* [**Component Map**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/component-map.md): Comprehensive mapping of every UI component to its file path and children.
* [**Project Structure**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/project-structure.md): Repository file tree with purpose and modification rules.
* [**Authentication & Security**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/authentication-security.md): Stateless JWT, refresh tokens, BCrypt hashing, and RBAC roles.

### 3. 🔌 APIs (`docs/api/`)
* [**API Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/api/README.md)
* [**REST API Documentation**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/api/api-documentation.md): Detailed endpoint specifications for all controllers with JSON payloads.
* [**Frontend to API Mapping**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/api/frontend-api-mapping.md): Trace matrix answering "Which component calls which API and updates which database table?".

### 4. 🗄️ Database (`docs/database/`)
* [**Database Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/database/README.md)
* [**Database Documentation**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/database/database-documentation.md): Complete schema reference for all 16 Flyway tables (V1–V16).

### 5. 📦 Features & Spatial Modules (`docs/features/`)
* [**Features Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/features/README.md)
* [**Feature Documentation**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/features/feature-documentation.md): End-to-end walkthroughs for all 14 implemented features.
* [**AR & 3D Spatial Computing Documentation**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/features/ar-3d-documentation.md): Three.js WebGL canvas, 1:1 true scale (100cm=1m), WebRTC camera AR, floor plane tracking, and depth occlusion.
* [**Admin Operations & Back-Office**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/features/admin-documentation.md): Administrator portal, KPI metrics, catalog CRUD, 3D asset manager, stock ledger, and fulfillment pipeline.

### 6. 🛠️ Workflow & Setup (`docs/workflow/`)
* [**Workflow Overview**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/workflow/README.md)
* [**Environment Setup**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/workflow/environment-setup.md): Complete reference of all backend and frontend environment variables.
* [**Development Workflow**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/workflow/development-workflow.md): Git branching conventions, testing commands, and code review checklists.
* [**Troubleshooting & FAQ Guide**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/workflow/troubleshooting.md): Diagnosis and resolution steps for common errors.

### 7. 🎨 Diagrams (`docs/diagrams/`)
* [**Diagrams Index**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/README.md)
* [System Architecture Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/system-architecture.md)
* [Frontend Architecture Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/frontend-architecture.md)
* [Backend Architecture Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/backend-architecture.md)
* [Database Entity-Relationship (ER) Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/database-er.md)
* [Component → API Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/component-api-flow.md)
* [Authentication Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/authentication-flow.md)
* [Product Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/product-flow.md)
* [Cart & Order Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/cart-order-flow.md)
* [AR & 3D Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/ar-flow.md)
* [Admin Flow Diagram](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/admin-flow.md)

---

## 🔍 Where Should I Look? (Quick Q&A)

* **Where is a frontend component located?** → [**`docs/architecture/component-map.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/component-map.md)
* **Which API does a component call?** → [**`docs/api/frontend-api-mapping.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/api/frontend-api-mapping.md)
* **Where is a REST API endpoint implemented?** → [**`docs/api/api-documentation.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/api/api-documentation.md) & [**`docs/architecture/backend-architecture.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/architecture/backend-architecture.md)
* **Where is data stored and what are the table schemas?** → [**`docs/database/database-documentation.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/database/database-documentation.md) & [**`docs/diagrams/database-er.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/database-er.md)
* **How does 3D Studio and Live Camera AR work?** → [**`docs/features/ar-3d-documentation.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/features/ar-3d-documentation.md) & [**`docs/diagrams/ar-flow.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/diagrams/ar-flow.md)
* **How do I run the full project locally?** → [**`docs/02_DEVELOPER_ONBOARDING.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/02_DEVELOPER_ONBOARDING.md)
* **Something is broken. Where do I look?** → [**`docs/workflow/troubleshooting.md`**](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/workflow/troubleshooting.md)
