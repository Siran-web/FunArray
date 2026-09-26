package com.furniture.store.product.controller;

import com.furniture.store.common.ApiResponse;
import com.furniture.store.product.dto.*;
import com.furniture.store.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/products", "/api/products"})
@Tag(name = "Products", description = "Product catalog CRUD, filtering, variants, images, and 3D AR models")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ==================== Products Catalog ====================

    @GetMapping
    @Operation(summary = "Browse products with pagination, category filter, price range, and search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String status
    ) {
        Map<String, Object> result = productService.getProducts(page, size, category, minPrice, maxPrice, q, sortBy, status);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product details by ID or slug")
    public ResponseEntity<ApiResponse<ProductDetailDto>> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.ok(product)))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("PRODUCT_NOT_FOUND", "The requested product could not be found.")));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductDetailDto created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update an existing product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto>> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        ProductDetailDto updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a product (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update product status e.g. ACTIVE, DRAFT, ARCHIVED (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto>> updateProductStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {
        ProductDetailDto updated = productService.updateProductStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    // ==================== Product Variants (TICKET-010) ====================

    @GetMapping("/{id}/variants")
    @Operation(summary = "Get product variants")
    public ResponseEntity<ApiResponse<List<ProductDetailDto.ProductVariantDto>>> getProductVariants(@PathVariable String id) {
        List<ProductDetailDto.ProductVariantDto> variants = productService.getVariants(id);
        return ResponseEntity.ok(ApiResponse.ok(variants));
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add a new variant to a product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto.ProductVariantDto>> addVariant(
            @PathVariable String id,
            @Valid @RequestBody CreateProductVariantRequest request
    ) {
        ProductDetailDto.ProductVariantDto variant = productService.addVariant(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(variant));
    }

    @PutMapping("/{productId}/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a product variant (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto.ProductVariantDto>> updateVariant(
            @PathVariable String productId,
            @PathVariable String variantId,
            @Valid @RequestBody UpdateProductVariantRequest request
    ) {
        ProductDetailDto.ProductVariantDto updated = productService.updateVariant(productId, variantId, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a product variant (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(
            @PathVariable String productId,
            @PathVariable String variantId
    ) {
        productService.deleteVariant(productId, variantId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ==================== Product Images (TICKET-011) ====================

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Add an image metadata to product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto.ProductImageDto>> addImage(
            @PathVariable String id,
            @Valid @RequestBody AddProductImageRequest request
    ) {
        ProductDetailDto.ProductImageDto image = productService.addImage(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(image));
    }

    @PutMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update product image metadata (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto.ProductImageDto>> updateImage(
            @PathVariable String productId,
            @PathVariable String imageId,
            @Valid @RequestBody UpdateProductImageRequest request
    ) {
        ProductDetailDto.ProductImageDto updated = productService.updateImage(productId, imageId, request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @PutMapping("/{productId}/images/{imageId}/primary")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Set image as primary for product (ADMIN only)")
    public ResponseEntity<ApiResponse<ProductDetailDto.ProductImageDto>> setPrimaryImage(
            @PathVariable String productId,
            @PathVariable String imageId
    ) {
        ProductDetailDto.ProductImageDto updated = productService.setPrimaryImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a product image (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable String productId,
            @PathVariable String imageId
    ) {
        productService.deleteImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ==================== 3D AR Model Management (TICKET-012) ====================

    @GetMapping("/{id}/ar")
    @Operation(summary = "Get 3D/AR model asset metadata for AR room preview")
    public ResponseEntity<ApiResponse<ARAssetDto>> getProductARAsset(@PathVariable String id) {
        return productService.getARAssetByProductId(id)
                .map(ar -> ResponseEntity.ok(ApiResponse.ok(ar)))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("AR_ASSET_NOT_FOUND", "AR model asset not found for this product.")));
    }

    @GetMapping("/{id}/model")
    @Operation(summary = "Get full 3D furniture model metadata")
    public ResponseEntity<ApiResponse<FurnitureModelDto>> getProductModel(@PathVariable String id) {
        return productService.getModel(id)
                .map(model -> ResponseEntity.ok(ApiResponse.ok(model)))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("MODEL_NOT_FOUND", "No 3D model found for product: " + id)));
    }

    @PostMapping("/{id}/model")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Save or update product 3D model metadata (ADMIN only)")
    public ResponseEntity<ApiResponse<FurnitureModelDto>> saveProductModel(
            @PathVariable String id,
            @Valid @RequestBody SaveFurnitureModelRequest request
    ) {
        FurnitureModelDto saved = productService.saveModel(id, request);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @DeleteMapping("/{id}/model")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete product 3D model (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteProductModel(@PathVariable String id) {
        productService.deleteModel(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
