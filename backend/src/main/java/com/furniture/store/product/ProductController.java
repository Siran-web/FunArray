package com.furniture.store.product;

import com.furniture.store.common.ApiResponse;
import com.furniture.store.product.dto.ARAssetDto;
import com.furniture.store.product.dto.ProductDetailDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sortBy
    ) {
        Map<String, Object> result = productService.getProducts(page, size, category, minPrice, maxPrice, q, sortBy);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDetailDto>> getProductById(@PathVariable String id) {
        return productService.getProductById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.ok(product)))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("PRODUCT_NOT_FOUND", "The requested product could not be found.")));
    }

    @GetMapping("/products/{id}/variants")
    public ResponseEntity<ApiResponse<List<ProductDetailDto.ProductVariantDto>>> getProductVariants(@PathVariable String id) {
        return productService.getProductById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.ok(product.variants())))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("PRODUCT_NOT_FOUND", "The requested product could not be found.")));
    }

    @GetMapping("/products/{id}/ar")
    public ResponseEntity<ApiResponse<ARAssetDto>> getProductARAsset(@PathVariable String id) {
        return productService.getARAssetByProductId(id)
                .map(ar -> ResponseEntity.ok(ApiResponse.ok(ar)))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("AR_ASSET_NOT_FOUND", "AR model asset not found for this product.")));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllCategories()));
    }
}
