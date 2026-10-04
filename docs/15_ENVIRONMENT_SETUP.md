# 15. Environment Configuration & Setup

This document lists all environment variables used across the FunArray backend and frontend services, their purpose, default values, and expected formats.

---

## 1. Backend Environment Variables (`backend/`)

| Variable Name | Purpose | Required | Used By | Default / Expected Format |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | Yes | Spring Boot | `dev`, `postgres`, `prod`, `test` |
| `SERVER_PORT` | HTTP port for the Spring Boot REST API | No | Spring Web | `8080` (Integer) |
| `FRONTEND_URL` | Allowed client origin for CORS policies | Yes | `SecurityConfig.java` | `http://localhost:3000` (URL) |
| `DB_URL` | JDBC connection URL for PostgreSQL / MySQL | Yes | Spring Data JPA / Flyway | `jdbc:postgresql://localhost:5432/furniture_store` |
| `DB_USERNAME` | Relational database username | Yes | Spring Data JPA | `postgres` or `root` |
| `DB_PASSWORD` | Relational database password | Yes | Spring Data JPA | Secret string |
| `MONGO_URI` | MongoDB connection URI for spatial document store | No | `MongoConfig.java` | `mongodb://localhost:27017/furniture_store` |
| `JWT_SECRET` | Secret HMAC-SHA256 key for signing and validating JWTs | Yes | `JwtTokenProvider.java` | Base64-encoded string $\ge 256$ bits |
| `JWT_EXPIRATION` | Access token lifespan in milliseconds | No | `JwtTokenProvider.java` | `3600000` (1 hour) |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan in milliseconds | No | `JwtTokenProvider.java` | `604800000` (7 days) |
| `AWS_REGION` | AWS Region for S3 bucket | Yes (if S3 active) | `S3Config.java` | e.g. `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Access Key for AWS S3 or MinIO | Yes (if S3 active) | `S3Config.java` | e.g. `minioadmin` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key for AWS S3 or MinIO | Yes (if S3 active) | `S3Config.java` | Secret string |
| `AWS_S3_BUCKET` | Name of S3 bucket storing 3D models and images | Yes (if S3 active) | `StorageService.java` | e.g. `furniture-store-assets` |
| `S3_ENDPOINT` | Custom endpoint for local MinIO S3 emulation | No (Local dev) | `S3Config.java` | `http://localhost:9000` |
| `PAYMENT_PROVIDER_KEY` | Public API Key for payment gateway (Razorpay) | No | `PaymentService.java` | e.g. `rzp_test_key_sample` |
| `PAYMENT_PROVIDER_SECRET` | Secret Key for verifying payment webhook signatures | No | `PaymentService.java` | Secret string |

---

## 2. Frontend Environment Variables (`frontend/`)

All client-accessible Next.js environment variables are prefixed with `NEXT_PUBLIC_`:

| Variable Name | Purpose | Required | Used By | Default / Expected Format |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL for backend Spring Boot REST API | Yes | `api.ts`, all API clients | `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application display name | No | Metadata, Layout | `Virtual Furniture Store` |
| `NEXT_PUBLIC_ENABLE_AR` | Feature flag to enable/disable WebXR & Camera AR | No | `product-detail-view.tsx` | `true` or `false` |
| `NEXT_PUBLIC_S3_BASE_URL` | Public CDN / MinIO URL for direct asset downloads | No | 3D loaders | `http://localhost:9000/furniture-store-assets` |

---

## 3. Configuration Profiles Reference

### Dev Profile (`application-dev.yml`):
* Uses in-memory H2 or local MySQL database with automatic Flyway migrations.
* Logging set to `DEBUG` for `com.furniture.store`.

### PostgreSQL Profile (`application-postgres.yml`):
* Targets containerized or managed PostgreSQL 16 database.
* Dialect: `org.hibernate.dialect.PostgreSQLDialect`.

### Prod Profile (`application-prod.yml`):
* Enforces TLS, strict CORS origins, AWS S3 storage, and external PostgreSQL RDS cluster.
