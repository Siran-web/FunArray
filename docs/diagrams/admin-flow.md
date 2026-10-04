# Admin Operations Flow Diagram

This diagram displays the administrator and staff capabilities, authentication guards, and administrative management workflows for products, 3D digital assets, real-time inventory, orders, and customer accounts.

```mermaid
flowchart TD
    subgraph AdminAuth ["Admin Access & Protection"]
        AdminLogin["Admin logs in at /login with role=ADMIN"] --> SetToken["Store JWT with ROLE_ADMIN in localStorage"]
        SetToken --> AdminRoute["Navigate to /admin/* routes"]
        AdminRoute --> AdminGuard["AdminGuard.tsx checks authStore.user.role == 'ADMIN'"]
        AdminGuard -->|Unauthorized| RedirectHome["Redirect to /login with error"]
        AdminGuard -->|Authorized| RenderAdminNav["Render Admin Layout & AdminNav Sidebar"]
    end

    subgraph AdminDashboardPage ["1. Dashboard Overview (/admin)"]
        FetchMetrics["GET /api/v1/admin/dashboard"] --> RenderCards["KPI Metrics: Total Sales, Orders, Customers, 3D Models, Low Stock Alert"]
        RenderCards --> RecentOrdersList["Display Recent Orders Table with Status Badges"]
    end

    subgraph AdminProductsPage ["2. Catalog Management (/admin/products & /admin/categories)"]
        CreateProduct["POST /api/v1/products"] --> SaveProductDB[(Insert into products)]
        UploadModel["POST /api/v1/products/{id}/model"] --> SaveModelDB[(Insert into furniture_models)]
        AddImages["POST /api/v1/products/{id}/images"] --> SaveImageDB[(Insert into product_images)]
        ManageVariants["POST /api/v1/products/{id}/variants"] --> SaveVariantDB[(Insert into product_variants)]
        ManageCategories["POST/PUT /api/v1/categories"] --> SaveCategoryDB[(Insert into categories)]
    end

    subgraph AdminInventoryPage ["3. Real-Time Stock Ledger (/admin/inventory)"]
        FetchInventory["GET /api/v1/inventory?lowStockOnly=false"] --> RenderStockTable["Stock Table: SKU, Warehouse, Total, Reserved, Available"]
        UpdateStock["PUT /api/v1/inventory/variant/{variantId}"] --> DBInventoryUpdate[(Update inventory quantity)]
        AdjustStock["POST /api/v1/inventory/variant/{variantId}/adjust"] --> DBInventoryAdjust[(Relative +/- stock reconciliation)]
    end

    subgraph AdminOrdersPage ["4. Order Fulfillment & State Machine (/admin/orders)"]
        FetchOrders["GET /api/v1/admin/orders"] --> RenderOrderQueue["Order Queue: ORD-1025, ORD-1024, etc."]
        TransitionStatus["PUT/PATCH /api/v1/admin/orders/{id}/status"] --> CheckTransition{"State Machine Validation\n(e.g., PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED)"}
        CheckTransition -->|Legal Transition| CommitOrder[(Update order status)]
        CheckTransition -->|Illegal Transition| RejectTransition["Return 400 Bad Request (ILLEGAL_STATUS_TRANSITION)"]
    end

    subgraph AdminAssetsAndCustomers ["5. 3D Assets & Customers (/admin/assets & /admin/customers)"]
        FetchAssets["GET /api/v1/admin/assets"] --> AssetGrid["List GLB 3D Models, file sizes, dimensions, status"]
        FetchCustomers["GET /api/v1/admin/customers"] --> CustomerTable["List Registered Users, roles, contact info, total orders placed"]
    end

    RenderAdminNav --> AdminDashboardPage
    RenderAdminNav --> AdminProductsPage
    RenderAdminNav --> AdminInventoryPage
    RenderAdminNav --> AdminOrdersPage
    RenderAdminNav --> AdminAssetsAndCustomers
```
