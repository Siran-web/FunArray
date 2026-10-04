# 12. Authentication & Security Documentation

This document explains the security architecture, token generation, stateless session lifecycle, role-based access control (RBAC), and cryptographic safeguards implemented in FunArray.

---

## 1. Authentication Architecture Overview

FunArray uses **stateless JSON Web Token (JWT)** authentication backed by Spring Security 6 on the backend and Zustand state storage on the frontend.

```
[ User Credentials (Email / Password) ]
                 │
                 ▼
[ POST /api/v1/auth/login ]
                 │
                 ▼
[ AuthService & BCryptPasswordEncoder (Strength 10) ]
                 │
                 ▼
[ JwtTokenProvider: Issues Access Token (1h) & Refresh Token (7d) ]
                 │
                 ▼
[ Frontend: Stores in localStorage (access_token, refresh_token) ]
                 │
                 ▼
[ Subsequent Requests: Header "Authorization: Bearer <access_token>" ]
                 │
                 ▼
[ JwtAuthenticationFilter: Signature check -> Sets UserPrincipal in SecurityContext ]
```

---

## 2. JWT Configuration & Token Anatomy

* **Signing Algorithm:** HMAC-SHA256 (`HS256`).
* **Secret Key:** `JWT_SECRET` configured in `application.yml` (Base64 encoded string $\ge 256$ bits).
* **Access Token Expiration:** 3,600,000 ms (1 hour).
* **Refresh Token Expiration:** 604,800,000 ms (7 days).
* **Token Claims Payload:**
  * `sub`: User ID (`UUID` string).
  * `email`: User email address.
  * `role`: User role name (`ROLE_CUSTOMER`, `ROLE_ADMIN`, etc.).
  * `iat`: Issued At timestamp.
  * `exp`: Expiration timestamp.

---

## 3. Role-Based Access Control (RBAC)

FunArray implements strict hierarchical and role-based permissions defined in `Role.java`:

| Role | Permitted Areas | Key Capabilities |
| :--- | :--- | :--- |
| **`ROLE_CUSTOMER`** | Storefront, 3D Studio, Cart, Checkout, Orders, Saved Designs, Reviews | Browse catalog, visualize furniture, place orders, cancel pending orders, save room scenes, post reviews. |
| **`ROLE_STAFF`** / **`ROLE_STORE_STAFF`** | Inventory management, Order queue viewing, Staff operations | Check warehouse stock, view pending showroom inquiries, inspect orders. |
| **`ROLE_STORE_MANAGER`** | Showroom stock management, Order fulfillment status updates | Update order fulfillment status, reconcile store stock. |
| **`ROLE_ADMIN`** | Full platform access (`/admin/*`) | Product CRUD, 3D GLB model associations, category hierarchy editing, inventory overrides, order state transitions, customer directory inspection. |

---

## 4. Protected Frontend Routes & Route Guards

Client-side route protection is enforced through `AdminGuard` (`frontend/src/components/admin/AdminGuard.tsx`):
* Inspects `useAuthStore.getState().user`.
* If user is unauthenticated or `user.role !== 'ADMIN'`, the component blocks rendering, displays an access warning, and triggers `router.push('/login?redirect=admin')`.

---

## 5. Protected Backend Endpoints (`SecurityConfig.java`)

Backend authorization is enforced at both the filter chain level (`SecurityFilterChain`) and the method level (`@EnableMethodSecurity` / `@PreAuthorize`):

```java
// Examples from SecurityConfig & Controllers:
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/api/v1/products") // Create Product

@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'STORE_MANAGER')")
@PutMapping("/api/v1/admin/orders/{id}/status") // Update Fulfillment Status

@PreAuthorize("isAuthenticated()")
@PostMapping("/api/v1/cart/items") // Add to Cart
```

---

## 6. Password Security & Hashing

* Passwords are never stored in plaintext.
* Hashed using Spring Security's `BCryptPasswordEncoder` with standard logarithmic cost factor ($2^{10} = 1024$ iterations).
* Validated during authentication using `passwordEncoder.matches(rawPassword, user.getPasswordHash())`.

---

## 7. Token Revocation & Logout Blacklisting

FunArray implements server-side token invalidation via `TokenBlacklistService`:
* When a user clicks "Logout" (`POST /api/v1/auth/logout`), the backend extracts the active access token and refresh token and stores them in a thread-safe memory registry (`ConcurrentHashMap`).
* `JwtAuthenticationFilter` checks every incoming request against this blacklist before authenticating the security context. If present, the request is rejected with `401 Unauthorized`.

---

## 8. Network & Transport Security

1. **CORS Policy:** Restricts browser origins to trusted storefront URLs (`http://localhost:3000`, `http://localhost:3001`, `https://*.vercel.app`) with allowed methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
2. **Security Headers:**
   * `X-Frame-Options: DENY` (prevents clickjacking attacks).
   * `Strict-Transport-Security (HSTS)`: `max-age=31536000; includeSubDomains`.
   * `Referrer-Policy: strict-origin-when-cross-origin`.
3. **Rate Limiting:** `RateLimitingFilter` prevents brute-force login attempts and DDoS attacks by throttling requests exceeding configurable IP thresholds.
4. **Correlation Tracing:** `CorrelationIdFilter` attaches a unique `X-Correlation-ID` header to every response for secure operational tracing across micro-components.
