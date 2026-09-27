package com.furniture.store.product;

import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.DuplicateResourceException;
import com.furniture.store.product.dto.CreateProductRequest;
import com.furniture.store.product.dto.ProductDetailDto;
import com.furniture.store.product.dto.UpdateProductRequest;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.mapper.ProductMapper;
import com.furniture.store.product.repository.FurnitureModelRepository;
import com.furniture.store.product.repository.ProductImageRepository;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceUnitTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private FurnitureModelRepository furnitureModelRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private ProductService productService;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        ProductMapper productMapper = new ProductMapper(categoryRepository);
        productService = new ProductService(
                productRepository,
                productVariantRepository,
                productImageRepository,
                furnitureModelRepository,
                categoryRepository,
                productMapper
        );

        sampleProduct = new Product();
        sampleProduct.setId("prod-123");
        sampleProduct.setName("Ergonomic Oak Chair");
        sampleProduct.setSlug("ergonomic-oak-chair");
        sampleProduct.setSku("CHR-OAK-001");
        sampleProduct.setBasePrice(new BigDecimal("299.99"));
        sampleProduct.setCategoryId("cat-chairs");
        sampleProduct.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Unit: createProduct succeeds for valid request and unique SKU")
    void createProduct_Success() {
        CreateProductRequest req = new CreateProductRequest(
                "cat-chairs",
                "Ergonomic Oak Chair",
                "ergonomic-oak-chair",
                "A comfortable chair",
                "FunArray Studio",
                new BigDecimal("299.99"),
                "ACTIVE",
                "Solid Oak",
                new BigDecimal("12.5"),
                new BigDecimal("60.0"),
                new BigDecimal("90.0"),
                new BigDecimal("60.0"),
                "CHR-OAK-001"
        );

        when(categoryRepository.existsById("cat-chairs")).thenReturn(true);
        when(categoryRepository.findById("cat-chairs")).thenReturn(Optional.of(new Category("cat-chairs", "Chairs", "chairs", "Chairs desc", null, null)));
        when(productRepository.existsBySlug("ergonomic-oak-chair")).thenReturn(false);
        when(productRepository.existsBySku("CHR-OAK-001")).thenReturn(false);
        when(productVariantRepository.existsBySku("CHR-OAK-001")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductDetailDto result = productService.createProduct(req);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo("prod-123");
        assertThat(result.name()).isEqualTo("Ergonomic Oak Chair");
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Unit: createProduct throws BadRequestException when category doesn't exist")
    void createProduct_NonExistentCategory() {
        CreateProductRequest req = new CreateProductRequest(
                "invalid-cat", "Chair", "chair", "desc", "brand",
                new BigDecimal("100.00"), "ACTIVE", "Wood", null,
                new BigDecimal("50.0"), new BigDecimal("80.0"), new BigDecimal("50.0"),
                "SKU-1"
        );

        when(categoryRepository.existsById("invalid-cat")).thenReturn(false);

        assertThatThrownBy(() -> productService.createProduct(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Category does not exist");
    }

    @Test
    @DisplayName("Unit: createProduct throws DuplicateResourceException for duplicate SKU")
    void createProduct_DuplicateSku() {
        CreateProductRequest req = new CreateProductRequest(
                "cat-chairs", "Chair", "chair", "desc", "brand",
                new BigDecimal("100.00"), "ACTIVE", "Wood", null,
                new BigDecimal("50.0"), new BigDecimal("80.0"), new BigDecimal("50.0"),
                "EXISTING-SKU"
        );

        when(categoryRepository.existsById("cat-chairs")).thenReturn(true);
        when(productRepository.existsBySlug("chair")).thenReturn(false);
        when(productRepository.existsBySku("EXISTING-SKU")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(req))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Unit: updateProduct updates product fields and persists")
    void updateProduct_Success() {
        UpdateProductRequest req = new UpdateProductRequest(
                null, "Updated Oak Chair", null, "Updated description",
                null, new BigDecimal("349.99"), null, null, null, null, null, null, null
        );

        when(productRepository.findById("prod-123")).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductDetailDto result = productService.updateProduct("prod-123", req);

        assertThat(result.name()).isEqualTo("Updated Oak Chair");
        verify(productRepository).save(sampleProduct);
    }

    @Test
    @DisplayName("Unit: deleteProduct deletes product when found")
    void deleteProduct_Success() {
        when(productRepository.findById("prod-123")).thenReturn(Optional.of(sampleProduct));

        productService.deleteProduct("prod-123");

        verify(productRepository).delete(sampleProduct);
    }
}
