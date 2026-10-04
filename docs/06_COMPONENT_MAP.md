# 06. Component Map

This document maps every React component in FunArray to its source file location, child components, purpose, and associated API services.

---

## 1. Master Component Mapping Table

| Page / Context | Component Name | File Path | Purpose | Child Components | Associated API / Store |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Root Layout** | `RootLayout` | `frontend/src/app/layout.tsx` | Global HTML shell, font loader, authentication context provider, navigation header, and footer | `AuthProvider`, `Navbar`, `Footer`, `CartDrawer` | `authStore`, `cartStore` |
| **Global Layout** | `Navbar` | `frontend/src/components/layout/navbar.tsx` | Main top navigation bar, category links, search trigger, wishlist indicator, cart count badge, and auth profile menu | `Button`, `Badge`, `CartDrawer` | `useAuth`, `useCart`, `useWishlist` |
| **Global Layout** | `Footer` | `frontend/src/components/layout/footer.tsx` | Global footer with showroom addresses (Delhi Flagship, Jalandhar Gallery), newsletter signup, and copyright | — | — |
| **Global Auth** | `AuthProvider` | `frontend/src/components/auth/AuthProvider.tsx` | Client-side auth hydration wrapper checking JWT token validity on initial app mount | — | `authStore.hydrate()`, `authApi.getCurrentUser()` |
| **Home Page** | `HomePage` | `frontend/src/app/page.tsx` | Storefront landing page view aggregating marketing and merchandising sections | `HeroSection`, `CategoryGrid`, `FeaturedProducts`, `OmnichannelSection`, `ARExperienceBanner`, `TestimonialsSection` | `productApi.getCategories`, `productApi.getProducts` |
| **Home Section** | `HeroSection` | `frontend/src/components/home/hero-section.tsx` | Editorial hero spotlight featuring the Kanso 3-Seater Sofa with direct CTAs to 3D Visualizer | `Button` | — |
| **Home Section** | `CategoryGrid` | `frontend/src/components/home/category-grid.tsx` | Category taxonomy grid with image cards and product counts | `Card`, `Badge` | `productApi.getCategories()` |
| **Home Section** | `FeaturedProducts` | `frontend/src/components/home/featured-products.tsx` | Curated product carousel / grid with price tags and quick AR action buttons | `ProductCard` | `productApi.getProducts()` |
| **Home Section** | `OmnichannelSection`| `frontend/src/components/home/omnichannel-section.tsx` | Showroom discovery map displaying Delhi and Jalandhar physical gallery locations | `Card`, `Badge` | — |
| **Home Section** | `ARExperienceBanner` | `frontend/src/components/home/ar-experience-banner.tsx` | Visual banner demonstrating WebXR floor detection and spatial furniture placement | `Button` | — |
| **Home Section** | `TestimonialsSection`| `frontend/src/components/home/testimonials-section.tsx` | Verified customer reviews and interior designer testimonials | `Card` | — |
| **Catalog Page** | `ProductsPage` | `frontend/src/app/products/page.tsx` | Catalog view with category filters, keyword search input, price range sliders, and product card grid | `ProductCard`, `Button`, `Input`, `Badge` | `productApi.getProducts()`, `productApi.getCategoryTree()` |
| **Catalog UI** | `ProductCard` | `frontend/src/components/product/product-card.tsx` | Reusable product card with image hover zoom, price formatting, stock badge, wishlist heart, and quick AR launcher | `Badge`, `Button` | `useWishlist`, `useCart` |
| **Product Detail**| `ProductDetailPage` | `frontend/src/app/products/[id]/page.tsx` | Next.js dynamic route loader fetching product metadata | `ProductDetailView` | `productApi.getProductById(id)` |
| **Product Detail**| `ProductDetailView` | `frontend/src/app/products/[id]/product-detail-view.tsx` | Interactive product view with image gallery, color/fabric variant picker, dimension specs, stock badge, customer reviews, and AR launch modal | `ARPreviewModal`, `CameraARViewer`, `Button`, `Badge`, `Card`, `Modal` | `cartApi.addItem()`, `reviewApi.getProductReviews()`, `reviewApi.createReview()` |
| **AR Modal** | `ARPreviewModal` | `frontend/src/components/ar/ar-preview-modal.tsx` | Dialog modal wrapping both Live Camera AR and WebXR USDZ/GLB launch triggers | `CameraARViewer`, `ARViewer`, `Modal` | `useCameraAR` |
| **Live Camera AR** | `CameraARViewer` | `frontend/src/components/ar/camera-ar-viewer.tsx` | Live WebRTC video stream overlay with Three.js WebGL canvas, smooth LERP reticle tracking, depth occlusion, rotation buttons, micro-nudge arrows, and lock toggle | `Button`, `Badge` | `useCameraAR`, `cartApi.addItem()` |
| **WebXR Viewer** | `ARViewer` | `frontend/src/components/visualization/ARViewer.tsx` | Fallback WebXR / iOS QuickLook USDZ launcher with QR code / direct link | `Button` | — |
| **3D Studio Page** | `VisualizePage` | `frontend/src/app/visualize/page.tsx` | 3D room visualization studio page allowing room photo upload, floor calibration, and multi-furniture arrangement | `RoomViewer`, `FurnitureToolbar`, `FurnitureControls`, `RoomFloorAlignmentController` | `visualizationStore`, `designApi.saveDesign()`, `productApi.requestPresignedUpload()` |
| **3D Canvas** | `RoomViewer` | `frontend/src/components/visualization/RoomViewer.tsx` | Three.js WebGL rendering canvas managing room background texture, 3D furniture meshes, lighting rigs, raycasting selection, and shadows | `FurnitureModel`, `RoomFloorAlignmentController` | `ModelLoader.ts`, `LightingEnvironment.ts`, `visualizationStore` |
| **3D Mesh** | `FurnitureModel` | `frontend/src/components/visualization/FurnitureModel.tsx` | Three.js Group representation of loaded GLB model with bounding box wireframes and selection outlines | — | `ModelLoader.ts` |
| **3D Controls** | `FurnitureControls`| `frontend/src/components/visualization/FurnitureControls.tsx` | Floating UI panel for active furniture item: rotate ±45°, position sliders, duplicate, lock, and delete | `Button`, `Badge` | `visualizationStore` |
| **3D Toolbar** | `FurnitureToolbar` | `frontend/src/components/visualization/FurnitureToolbar.tsx` | Top studio control bar: Save Design button, clear canvas, lighting presets (warm, studio, daylight), floor alignment trigger, and catalog drawer | `Button`, `Badge`, `Modal` | `visualizationStore`, `designApi.saveDesign()` |
| **Floor Calibration**| `RoomFloorAlignmentController` | `frontend/src/components/visualization/RoomFloorAlignmentController.tsx` | Interactive 2D horizon line and camera pitch alignment overlay for matching 3D models to room photo perspective | `Button`, `Badge` | `visualizationStore` |
| **Saved Designs** | `DesignsPage` | `frontend/src/app/designs/page.tsx` | Saved 3D room design gallery with reload in studio, rename, and add-all-to-cart actions | `Button`, `Card`, `Modal`, `Badge` | `designApi.getDesigns()`, `designApi.renameDesign()`, `designApi.deleteDesign()`, `cartApi.addItem()` |
| **Cart Page** | `CartPage` | `frontend/src/app/cart/page.tsx` | Full shopping cart management view with line items list, quantity steppers, item removal, and pricing summary | `Button`, `Card`, `Badge` | `cartApi.getCart()`, `cartApi.updateItemQuantity()`, `cartApi.removeItem()` |
| **Cart Drawer** | `CartDrawer` | `frontend/src/components/commerce/cart-drawer.tsx` | Slide-over drawer accessible from global Navbar displaying live cart contents and checkout CTA | `Button`, `Badge` | `useCart`, `cartApi` |
| **Checkout Page** | `CheckoutPage` | `frontend/src/app/checkout/page.tsx` | 3-step checkout wizard: Address selection → Payment method → Order preview & execution | `Button`, `Input`, `Card`, `Badge` | `addressApi.getAddresses()`, `addressApi.createAddress()`, `orderApi.previewCheckout()`, `orderApi.checkout()` |
| **Orders Page** | `OrdersPage` | `frontend/src/app/orders/page.tsx` | Customer order history list with status badges and order summaries | `Card`, `Badge`, `Button` | `orderApi.getOrders()` |
| **Order Detail** | `OrderDetailPage` | `frontend/src/app/orders/[id]/page.tsx` | Order receipt view with visual status stepper, line items breakdown, shipping address, and order cancellation button | `Card`, `Badge`, `Button` | `orderApi.getOrderById(id)`, `orderApi.cancelOrder(id)` |
| **Wishlist Page** | `WishlistPage` | `frontend/src/app/wishlist/page.tsx` | Bookmarked products grid with quick add-to-bag and remove actions | `ProductCard`, `Button` | `useWishlist`, `cartApi.addItem()` |
| **Auth Login** | `LoginPage` | `frontend/src/app/login/page.tsx` | Customer and Admin login form with credentials validation | `Input`, `Button`, `Card` | `authApi.login()`, `authStore` |
| **Auth Register** | `RegisterPage` | `frontend/src/app/register/page.tsx` | New customer account registration form | `Input`, `Button`, `Card` | `authApi.register()`, `authStore` |
| **Admin Shell** | `AdminLayout` | `frontend/src/app/admin/layout.tsx` | Protected admin layout wrapper with sidebar navigation and role checking | `AdminGuard`, `AdminNav` | `authStore` |
| **Admin Guard** | `AdminGuard` | `frontend/src/components/admin/AdminGuard.tsx` | Client-side route protection verifying `role === 'ADMIN'` | — | `authStore` |
| **Admin Nav** | `AdminNav` | `frontend/src/components/admin/AdminNav.tsx` | Admin sidebar navigation menu (Dashboard, Products, Inventory, Orders, Assets, Customers, Categories) | `Button`, `Badge` | `useAuth` |
| **Admin Dashboard**| `AdminDashboardPage`| `frontend/src/app/admin/page.tsx` | Executive dashboard overview with KPI metric cards and recent orders table | `Card`, `Badge` | `adminApi.getDashboardStats()` |
| **Admin Products** | `AdminProductsPage` | `frontend/src/app/admin/products/page.tsx` | Product catalog CRUD management table with create/edit product modals and variant editor | `Card`, `Button`, `Input`, `Modal`, `Badge` | `adminApi.createProduct()`, `adminApi.updateProduct()`, `adminApi.deleteProduct()`, `productApi.getProducts()` |
| **Admin Inventory**| `AdminInventoryPage`| `frontend/src/app/admin/inventory/page.tsx` | Real-time stock ledger management with absolute stock updates and relative stock adjustments | `Card`, `Button`, `Input`, `Badge` | `adminApi.getInventory()`, `adminApi.updateVariantStock()`, `adminApi.adjustVariantStock()` |
| **Admin Orders** | `AdminOrdersPage` | `frontend/src/app/admin/orders/page.tsx` | Order fulfillment pipeline with state transition dropdowns and customer delivery information | `Card`, `Button`, `Badge`, `Modal` | `adminApi.getOrders()`, `adminApi.updateOrderStatus()` |
| **Admin Assets** | `AdminAssetsPage` | `frontend/src/app/admin/assets/page.tsx` | 3D GLB model asset repository with file size, bounding box dimensions, and format status | `Card`, `Badge`, `Button` | `adminApi.getAssets()` |
| **Admin Customers**| `AdminCustomersPage`| `frontend/src/app/admin/customers/page.tsx` | Registered user directory with order counts and status | `Card`, `Badge` | `adminApi.getCustomers()` |
| **Admin Categories**|`AdminCategoriesPage`| `frontend/src/app/admin/categories/page.tsx` | Category taxonomy management with hierarchical parent-child relationships | `Card`, `Button`, `Input` | `productApi.getCategoryTree()`, `adminApi.createCategory()` |

---

## 2. Component Hierarchies (Component Trees)

### 2.1 Product Detail Component Tree
```
ProductDetailPage (products/[id]/page.tsx)
└── ProductDetailView (product-detail-view.tsx)
    ├── ProductGallery (Main image zoom + thumbnails)
    ├── ProductInfo
    │   ├── PriceDisplay (Formatted in INR ₹)
    │   ├── VariantSelector (Color/Material swatch pills)
    │   ├── DimensionsTable (Width × Height × Depth in cm)
    │   ├── StockStatusBadge (In Stock / Low Stock)
    │   ├── AddToCartButton (Triggers cartApi & opens CartDrawer)
    │   └── Launch3DStudioCTA (Navigates to /visualize/[productId])
    ├── ARLaunchSection
    │   └── LaunchARButton (Opens ARPreviewModal)
    │       └── ARPreviewModal
    │           ├── CameraARViewer (WebRTC video + Three.js overlay + Reticle + Occlusion)
    │           └── ARViewer (Fallback WebXR / USDZ link)
    └── ProductReviewsSection
        ├── RatingSummary (Average score + distribution bars)
        ├── ReviewList (Verified review cards)
        └── WriteReviewModal (Rating selector + Comment form)
```

### 2.2 3D Room Visualizer Component Tree
```
VisualizePage (visualize/page.tsx)
├── FurnitureToolbar
│   ├── DesignNameInput
│   ├── SaveDesignButton
│   ├── ClearSceneButton
│   ├── LightingModeDropdown (Warm / Studio / Daylight)
│   ├── FloorAlignmentToggleButton
│   └── AddFurnitureDrawer (Catalog item list)
├── RoomViewer (Three.js WebGL Canvas)
│   ├── RoomBackgroundLayer (Uploaded photo / Preset backdrop)
│   ├── LightingRig (AmbientLight, DirectionalLight, SoftShadows)
│   ├── FloorGridHelper (Toggleable reference grid)
│   ├── FurnitureModelGroup
│   │   └── FurnitureModel (GLTF loaded mesh + bounding box)
│   └── RoomFloorAlignmentController (2D Horizon line & Pitch overlay)
└── FurnitureControls (Floating toolbar for active selection)
    ├── RotationStepButtons (-45° / +45°)
    ├── LockToggle (Prevents accidental movement)
    ├── DuplicateButton (Creates clone with offset)
    └── DeleteButton (Removes model from scene)
```
