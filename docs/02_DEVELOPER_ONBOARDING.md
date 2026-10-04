# 02. Developer Onboarding Guide

This step-by-step guide walks you through setting up, configuring, and running the FunArray platform on your local development machine.

---

## 1. Required Software & Tooling

Before getting started, verify that you have the following software installed:

| Tool | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` or `v22.x` (LTS) | `node --version` |
| **npm** | `v10.x+` | `npm --version` |
| **Java JDK** | `OpenJDK 21` or `22` | `java -version` |
| **Apache Maven** | `v3.9.x+` | `mvn -version` |
| **Docker & Docker Compose** | Docker Desktop `v4.25+` | `docker compose version` |
| **Git** | `v2.40+` | `git --version` |

---

## 2. Repository Setup

Clone the repository and inspect the root structure:

```bash
git clone <repository-url> funArray
cd funArray
```

---

## 3. Environment Variables Configuration

Copy the example environment file to initialize local configuration:

### Root & Infrastructure Environment
In the repository root directory (`funArray/`):
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### Key Configuration Variables Explained:
* `SPRING_PROFILES_ACTIVE=dev` (Loads `application-dev.yml` using H2 in-memory or MySQL/PostgreSQL based on profile)
* `SERVER_PORT=8080` (Backend API port)
* `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` (Frontend API endpoint)
* `JWT_SECRET=d2FybS13YWxudXQtZnVybml0dXJlLXNlY3JldC1rZXktYXV0aC1zZXJ2aWNlLTIwMjY=`
* `JWT_EXPIRATION=3600000` (1 Hour)
* `JWT_REFRESH_EXPIRATION=604800000` (7 Days)
* `NEXT_PUBLIC_S3_BASE_URL=http://localhost:9000/furniture-store-assets`

*(For complete environment variable reference, see [15_ENVIRONMENT_SETUP.md](file:///c:/Users/coder/OneDrive/Desktop/funArray/docs/15_ENVIRONMENT_SETUP.md)).*

---

## 4. Starting Infrastructure (Databases & MinIO S3)

FunArray includes a complete containerized infrastructure setup with PostgreSQL 16, MySQL 8.0, MongoDB 7.0, and MinIO S3 Object Storage.

Run the following command from the **repository root directory (`funArray/`)**:

```bash
# Start all support services in background
docker compose up -d
```

### Verifying Service Containers:
```bash
docker compose ps
```

| Service | Port Mapping | Default Credentials | UI / Console URL |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `5432:5432` | user: `postgres`, pass: `password`, db: `furniture_store` | `localhost:5432` |
| **MySQL 8.0** | `3306:3306` | user: `root`, pass: `root`, db: `furniture_store` | `localhost:3306` |
| **MongoDB** | `27017:27017` | No auth (Local dev) | `localhost:27017` |
| **MinIO S3** | `9000:9000` (API), `9001:9001` (Console) | user: `minioadmin`, pass: `minioadmin` | [http://localhost:9001](http://localhost:9001) |

---

## 5. Starting the Backend Service

Navigate to the `backend` directory:

```bash
cd backend
```

### Step 5.1: Compile and Run Flyway Migrations
```bash
mvn clean compile
```
Flyway will automatically execute migrations `V1` to `V16` against the configured database.

### Step 5.2: Start Spring Boot
```bash
# Run with default dev profile (H2 in-memory or PostgreSQL fallback)
mvn spring-boot:run

# Or explicitly activate the PostgreSQL profile:
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

### Verifying Backend Health:
* Health Endpoint: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
* Swagger OpenAPI Docs: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* OpenAPI Spec JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 6. Starting the Frontend Service

In a separate terminal, navigate to the `frontend` directory:

```bash
cd frontend
```

### Step 6.1: Install Dependencies
```bash
npm install
```

### Step 6.2: Start Next.js Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Pre-Configured Test Credentials

The database is pre-seeded with a default administrator account on startup via `DataInitializer.java`:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `funarray47@gmail.com` | `Admin@123` | Full access to `/admin/*`, catalog CRUD, inventory adjustments, and order state transitions. |
| **Customer** | *(Self-register at `/register`)* | *(Chosen during signup)* | Access to `/cart`, `/checkout`, `/orders`, `/designs`, and `/visualize`. |

---

## 8. Running Automated Tests

### Run Frontend Unit & Integration Tests:
Execute from `frontend/`:
```bash
cd frontend
npm run test
```
*(Runs 14 Vitest test suites including AR realism, depth occlusion, floor alignment, cart, auth, and e2e customer journey).*

### Run Backend Unit & Integration Tests:
Execute from `backend/`:
```bash
cd backend
mvn test
```
*(Runs JUnit 5 and Spring Security test suites with Testcontainers).*

---

## 9. Common Startup Issues & Quick Fixes

### 1. Port 8080 Already in Use
* **Cause:** Another Java or web process is holding port 8080.
* **Fix:** Stop the existing process or override port in `backend/src/main/resources/application.yml` or set `SERVER_PORT=8081`.

### 2. S3 / MinIO Connection Refused (Port 9000)
* **Cause:** Docker container `furniture-minio` is not running.
* **Fix:** Run `docker compose up -d minio` from repository root.

### 3. Flyway Migration Checksum Mismatch
* **Cause:** An existing SQL migration file was edited after being applied to the local DB.
* **Fix:** In local development, run `docker compose down -v` to reset local database volumes and re-run `mvn spring-boot:run`.

### 4. Next.js Hydration Warning / Font Warning
* **Cause:** Browser extensions modifying DOM or delayed Google Font loading.
* **Fix:** Verify `next.config.ts` and ensure clean browser cache.
