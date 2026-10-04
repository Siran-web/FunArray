# Product Browsing & Detail Flow Diagram

This diagram displays the product discovery, filtering, search, and detailed view lifecycle in FunArray.

```mermaid
flowchart TD
    Start([User visits /products or /]) --> FetchCategories[Fetch Categories: GET /api/v1/categories/tree]
    FetchCategories --> RenderFilter[Render Category Tabs & Price Sliders]
    RenderFilter --> UserAction{User Action}

    UserAction -->|Search Keyword| SearchQuery["GET /api/v1/products?q={query}&page=0&size=20"]
    UserAction -->|Filter Category| CategoryQuery["GET /api/v1/products?category={slug}"]
    UserAction -->|Sort Option| SortQuery["GET /api/v1/products?sortBy=price_asc|price_desc|rating"]

    SearchQuery --> ProductService[ProductService.getProducts]
    CategoryQuery --> ProductService
    SortQuery --> ProductService

    ProductService --> ProductRepo[ProductRepository.findAll with Criteria / Specifications]
    ProductRepo --> Database[(Database: products, product_images, product_variants)]

    Database --> PageResult[Paginated ProductSummaryDto List]
    PageResult --> RenderGrid[Render ProductCard Grid]

    RenderGrid --> ClickProduct[User clicks ProductCard]
    ClickProduct --> NavigateDetail[Navigate to /products/[id]]

    NavigateDetail --> FetchDetail["GET /api/v1/products/{id}"]
    FetchDetail --> ProductDetailService[ProductService.getProductById]
    ProductDetailService --> DetailRepo[Fetch Product + Variants + Images + 3D Model + Reviews]
    DetailRepo --> RenderDetailView[Render ProductDetailView]

    RenderDetailView --> Interaction{User Options}
    Interaction --> SelectVariant[Select Variant Color/Material: Updates active price & SKU]
    Interaction --> OpenARModal[Click 'View in AR': Opens CameraARViewer modal]
    Interaction --> OpenVisualizer[Click 'Customize in 3D Studio': Navigates to /visualize/[productId]]
    Interaction --> AddToCart[Click 'Add to Cart': Triggers Cart API]
    Interaction --> ToggleWishlist[Click Wishlist Heart: Updates wishlistStore]
```
