# 16. Development Workflow & Engineering Practices

This document outlines the standard Git workflow, branch conventions, testing guidelines, code review checklists, and deployment patterns for contributing to FunArray.

---

## 1. Branching Strategy

We follow a structured Git feature branch model:

```
main (Production stable)
  │
  ├── develop (Staging / Integration)
        │
        ├── feature/TICKET-101-add-quicklook-usdz
        ├── bugfix/TICKET-102-cart-tax-rounding
        └── refactor/TICKET-103-threejs-shadow-maps
```

### Branch Naming Conventions:
* `feature/<ticket-id>-<short-description>`: New customer or admin capabilities.
* `bugfix/<ticket-id>-<short-description>`: Bug resolutions.
* `refactor/<ticket-id>-<short-description>`: Internal code refactoring or test additions.

---

## 2. Step-by-Step Feature Development Lifecycle

### Step 1: Create a Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-036-custom-finish-selector
```

### Step 2: Implement Changes
* Adhere strictly to the **Atelier Design System** tokens (`#8B5E3C` Primary, `#FAF9F7` Canvas).
* Place shared components in `components/ui/` or domain folders (`components/visualization/`, `components/product/`).
* If adding new database fields, create a new Flyway migration script (e.g. `V17__add_finish_textures.sql`). **Never modify applied V1–V16 migrations.**

### Step 3: Run Linters and Local Verification
```bash
# Frontend Linting & Typecheck
cd frontend
npm run lint
npm run test

# Backend Compile & Test Suite
cd ../backend
mvn clean test
```

### Step 4: Commit with Conventional Messages
```bash
git add .
git commit -m "feat(catalog): add custom upholstery swatch selector (TICKET-036)"
```

---

## 3. Pull Request & Code Review Checklist

Before requesting review on your Pull Request (PR), verify:

- [ ] **No Secret Leaks:** No database passwords, JWT secrets, or AWS keys are committed.
- [ ] **Visual Polish:** UI aligns with Atelier luxury design tokens and avoids basic default styles.
- [ ] **Database Integrity:** Any schema changes include a versioned Flyway SQL migration script.
- [ ] **Pessimistic Locking / Transactions:** Any stock-mutating operations use `@Transactional` and appropriate inventory locks.
- [ ] **Tests Passing:** Vitest suites (`npm run test`) and Maven tests (`mvn test`) pass with zero regressions.
- [ ] **TypeScript Types:** No unchecked `any` types in frontend service contracts.

---

## 4. Production Build & Deployment

### Local Docker Build:
```bash
# Build backend and frontend container images
docker compose -f infrastructure/docker-compose.yml build
```

### Cloud Deployment (AWS ECS & CloudFront):
Infrastructure definitions are maintained in `infrastructure/terraform/`:
* `infrastructure/terraform/cloudfront/`: CloudFront CDN distribution for static assets and Next.js frontend.
* `infrastructure/terraform/ecs/`: ECS Fargate cluster running the containerized Spring Boot API.
* `infrastructure/terraform/database/`: Amazon RDS PostgreSQL multi-AZ instance.
* `infrastructure/terraform/storage/`: S3 bucket with CORS configuration for direct browser uploads.
