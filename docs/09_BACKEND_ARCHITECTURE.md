# 09. Backend Architecture

This document details the Spring Boot 3.3.4 (Java 21) backend architecture, detailing layered patterns, data validation, exception handling, security filters, and transaction management.

---

## 1. Layered Pattern Overview

FunArray follows the canonical Spring enterprise architecture:

```
[ HTTP REST Request ]
        │
        ▼
1. Security & Diagnostic Filters (CorrelationIdFilter, RateLimitingFilter, JwtAuthenticationFilter)
        │
        ▼
2. Controller Layer (@RestController) ── Validates incoming DTOs via Jakarta @Valid
        │
        ▼
3. Service Layer (@Service @Transactional) ── Executes domain business rules & security checks
        │
        ▼
4. Repository Layer (@Repository) ── Spring Data JPA Hibernate interfaces
        │
        ▼
5. Entity Layer (@Entity @Table) ── Maps relational tables to Java objects
        │
        ▼
[ Database: PostgreSQL 16 / MySQL 8.0 ]
```

---

## 2. Core Packages and Class Responsibilities

### 2.1 Security & Authentication (`com.furniture.store.auth`)
* `JwtTokenProvider`: Generates HMAC-SHA256 signed access tokens (1 hr) and refresh tokens (7 days), extracts claims, and parses user IDs.
* `JwtAuthenticationFilter`: Extracts `Authorization: Bearer <token>` from HTTP headers, checks token revocation via `TokenBlacklistService`, loads `UserPrincipal`, and populates Spring's `SecurityContextHolder`.
* `CustomUserDetailsService`: Implements Spring Security's `UserDetailsService`, querying users by email.
* `TokenBlacklistService`: In-memory thread-safe blacklist for revoked tokens upon user logout.
* `AuthService`: Orchestrates user registration with `BCryptPasswordEncoder`, credential authentication, and refresh token rotation.

### 2.2 Product Catalog & Taxonomy (`com.furniture.store.product` & `category`)
* `ProductService`: Manages product lifecycle, multi-variant associations, image galleries, and 3D AR model metadata.
* `CategoryService`: Builds nested hierarchical taxonomy trees from flat database records.
* `ProductMapper`: Converts between JPA entities (`Product`, `ProductVariant`, `ProductImage`, `FurnitureModel`) and client DTOs (`ProductDetailDto`, `ProductSummaryDto`).

### 2.3 Inventory Ledger & Locking (`com.furniture.store.inventory`)
* `InventoryService`: Maintains stock integrity with the rule:
  $$\text{available} = \text{quantity} - \text{reserved}$$
* Uses `@Transactional` and **pessimistic locking (`LockModeType.PESSIMISTIC_WRITE`)** on `InventoryRepository` during checkout reservations to eliminate race conditions.
* Exposes reservation lifecycle methods: `reserveInventory()`, `releaseReservation()`, `commitReservation()`.

### 2.4 Commerce & Order State Machine (`com.furniture.store.order` & `cart`)
* `CartService`: Validates cart line items against authoritative database prices and real-time inventory availability.
* `OrderService`:
  * Computes server-authoritative checkout totals (Subtotal + 18% GST Tax + Shipping Fee - Coupon Discount).
  * Enforces state machine transitions on order fulfillment:
    ```
    PENDING ──► CONFIRMED ──► PROCESSING ──► SHIPPED ──► DELIVERED
       │           │
       └───────────┴──────────► CANCELLED (Releases reserved stock)
    ```

### 2.5 Object Storage & S3 Presigning (`com.furniture.store.storage`)
* `StorageService`: Utilizes AWS S3 SDK to generate short-lived Presigned PUT URLs, restricting asset types (`PRODUCT_IMAGE`, `3D_MODEL`, `ROOM_SCAN`) and enforcing file size caps (50 MB for models, 10 MB for images).

---

## 3. Global Exception Handling & Error Envelopes

All REST responses are wrapped in a unified generic envelope defined in `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

When an exception occurs, `GlobalExceptionHandler` (`@RestControllerAdvice`) intercepts it and produces RFC 7807 problem details or an error envelope:

```json
{
  "success": false,
  "message": "Resource not found",
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID '999' does not exist.",
    "fieldErrors": null,
    "timestamp": "2026-10-04T06:15:30Z"
  }
}
```

### Handled Custom Domain Exceptions:
| Exception Class | HTTP Status Code | Error Code | Common Trigger |
| :--- | :--- | :--- | :--- |
| `ResourceNotFoundException` | `404 Not Found` | `RESOURCE_NOT_FOUND` | Missing product, order, or user ID |
| `InsufficientInventoryException`| `400 Bad Request` | `INSUFFICIENT_STOCK` | Requested quantity exceeds available stock |
| `DuplicateResourceException` | `409 Conflict` | `DUPLICATE_RESOURCE` | Email or SKU already exists |
| `BadRequestException` | `400 Bad Request` | `BAD_REQUEST` | Illegal order status transition or invalid payload |
| `UnauthorizedException` | `401 Unauthorized` | `UNAUTHORIZED` | Missing or expired JWT token |
| `ForbiddenException` | `403 Forbidden` | `FORBIDDEN` | Non-admin attempting admin catalog mutation |
| `RateLimitExceededException` | `429 Too Many Requests`| `RATE_LIMIT_EXCEEDED`| Excessive API request frequency |

---

## 4. Security Configuration (`SecurityConfig.java`)

```
HTTP Request
     │
     ▼
[ AbstractHttpConfigurer::disable CSRF ] ── Stateless JWT API
     │
     ▼
[ CorsConfigurationSource ] ── Allows http://localhost:3000, http://localhost:3001, *.vercel.app
     │
     ▼
[ Security Headers ] ── FrameOptions: DENY, HSTS: 31536000s, ReferrerPolicy: STRICT_ORIGIN
     │
     ▼
[ AuthorizeHttpRequests Rules ]
     ├── Public: /api/v1/auth/**, /api/v1/health, /swagger-ui/**, GET /api/v1/products/**, GET /api/v1/categories/**
     ├── Customer Authenticated: /api/v1/cart/**, /api/v1/checkout/**, /api/v1/orders/**, /api/v1/designs/**, /api/v1/rooms/**
     ├── Staff / Showroom: /api/v1/staff/**, /api/v1/store/**
     └── Administrator Restricted: /api/v1/admin/**, POST/PUT/DELETE /api/v1/products/**, POST/PUT/DELETE /api/v1/categories/**
```

---

## 5. Transaction Management & Concurrency

* `@Transactional` is applied at the Service layer for all multi-step database operations (e.g., `processCheckout`, `reserveInventory`, `saveSession`).
* Isolation level defaults to `READ_COMMITTED` with explicit pessimistic write locks on high-contention rows in `inventory`.
