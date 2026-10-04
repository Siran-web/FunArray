# Component to API Flow Diagram

This diagram displays how user actions on Frontend React components trigger API service functions, pass through Spring Boot Controllers, execute transactional Services, and query JPA Repositories to interact with the Database.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Browser
    participant UI as Frontend Component (e.g. ProductDetailView)
    participant Store as State Store (e.g. cartStore / authStore)
    participant API as Frontend API Client (cartApi / fetchWithAuth)
    participant Gateway as Security Filter (JwtAuthenticationFilter)
    participant Controller as REST Controller (CartController)
    participant Service as Business Service (CartService)
    participant Repo as JPA Repository (CartRepository, InventoryRepository)
    participant DB as Relational Database (PostgreSQL/MySQL)

    Customer->>UI: Clicks "Add to Cart" (variant, qty)
    UI->>Store: dispatch addItem(productId, variantId, qty)
    Store->>API: cartApi.addItem({productId, variantId, quantity})
    API->>Gateway: HTTP POST /api/v1/cart/items (Bearer JWT)
    Gateway->>Gateway: Validate JWT signature & extract UserPrincipal
    Gateway->>Controller: Invokes addToCart(request, principal)
    Controller->>Service: cartService.addToCart(userId, request)
    
    critical Verify Authoritative Price & Reserve Stock
        Service->>Repo: ProductVariantRepository.findById(variantId)
        Repo->>DB: SELECT * FROM product_variants WHERE id = ?
        DB-->>Repo: ProductVariant record
        Service->>Repo: InventoryRepository.findByVariantId(variantId)
        Repo->>DB: SELECT * FROM inventory WHERE variant_id = ? FOR UPDATE
        DB-->>Repo: Inventory (available = quantity - reserved)
    end

    alt Stock Available
        Service->>Repo: CartRepository.findByUserId(userId)
        Repo->>DB: SELECT * FROM carts WHERE user_id = ?
        Service->>Repo: Save or update CartItem
        Repo->>DB: INSERT / UPDATE cart_items
        Service-->>Controller: Return updated CartDto
        Controller-->>API: 200 OK (ApiResponse<CartDto>)
        API-->>Store: Update zustand state (items, subtotal)
        Store-->>UI: Re-render Cart Drawer with updated state
        UI-->>Customer: Visual feedback: "Added to Bag" toast / Badge counter
    else Insufficient Stock
        Service-->>Controller: throw InsufficientInventoryException
        Controller-->>API: 400 Bad Request (INSUFFICIENT_STOCK)
        API-->>UI: ApiError caught
        UI-->>Customer: Display alert: "Only X items available in stock"
    end
```
