package com.furniture.store.product.service;

import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.DuplicateResourceException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.product.dto.*;
import com.furniture.store.product.entity.FurnitureModel;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductImage;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.mapper.ProductMapper;
import com.furniture.store.product.repository.FurnitureModelRepository;
import com.furniture.store.product.repository.ProductImageRepository;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final FurnitureModelRepository furnitureModelRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    private static final Pattern IMAGE_URL_PATTERN = Pattern.compile("^https?://.*\\.(jpg|jpeg|png|webp|svg|gif|avif)(\\?.*)?$", Pattern.CASE_INSENSITIVE);

    public ProductService(
            ProductRepository productRepository,
            ProductVariantRepository productVariantRepository,
            ProductImageRepository productImageRepository,
            FurnitureModelRepository furnitureModelRepository,
            CategoryRepository categoryRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.productImageRepository = productImageRepository;
        this.furnitureModelRepository = furnitureModelRepository;
        this.categoryRepository = categoryRepository;
        this.productMapper = productMapper;
    }

    // ==================== Customer / General Query APIs ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getProducts(
            int page,
            int size,
            String categoryParam,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String query,
            String sortBy,
            String statusParam
    ) {
        Sort sort = switch (sortBy != null ? sortBy.toLowerCase() : "featured") {
            case "price_asc" -> Sort.by("basePrice").ascending();
            case "price_desc" -> Sort.by("basePrice").descending();
            case "newest" -> Sort.by("createdAt").descending();
            default -> Sort.by("name").ascending();
        };

        Set<String> categoryIds = null;
        if (categoryParam != null && !categoryParam.isBlank() && !categoryParam.equalsIgnoreCase("all")) {
            categoryIds = new HashSet<>();
            Optional<Category> catOpt = categoryRepository.findById(categoryParam)
                    .or(() -> categoryRepository.findBySlug(categoryParam));
            if (catOpt.isPresent()) {
                Category cat = catOpt.get();
                categoryIds.add(cat.getId());
                // Collect child categories for hierarchical category browsing
                List<Category> children = categoryRepository.findByParentId(cat.getId());
                for (Category child : children) {
                    categoryIds.add(child.getId());
                }
            } else {
                categoryIds.add(categoryParam);
            }
        }

        String filterStatus = statusParam != null ? statusParam : "ACTIVE";
        if ("ALL".equalsIgnoreCase(filterStatus)) {
            filterStatus = null;
        }

        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);
        Page<Product> productPage = productRepository.findFiltered(categoryIds, minPrice, maxPrice, query, filterStatus, pageRequest);

        List<ProductSummaryDto> content = productPage.getContent().stream()
                .map(productMapper::toSummaryDto)
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("page", productPage.getNumber());
        response.put("size", productPage.getSize());
        response.put("totalElements", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());

        return response;
    }

    @Transactional(readOnly = true)
    public Optional<ProductDetailDto> getProductById(String idOrSlug) {
        return productRepository.findById(idOrSlug)
                .or(() -> productRepository.findBySlug(idOrSlug))
                .map(productMapper::toDetailDto);
    }

    @Transactional(readOnly = true)
    public Optional<ARAssetDto> getARAssetByProductId(String productId) {
        return productRepository.findById(productId)
                .or(() -> productRepository.findBySlug(productId))
                .map(p -> {
                    FurnitureModel model = p.getModel3D();
                    if (model != null) {
                        return new ARAssetDto(
                                true,
                                model.getModelUrl(),
                                model.getThumbnailUrl(),
                                new ARAssetDto.Dimensions(model.getWidthCm(), model.getHeightCm(), model.getDepthCm(), "cm")
                        );
                    }
                    return new ARAssetDto(
                            true,
                            "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
                            p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl(),
                            new ARAssetDto.Dimensions(p.getWidthCm(), p.getHeightCm(), p.getDepthCm(), "cm")
                    );
                });
    }

    // ==================== Product CRUD APIs (Admin) ====================

    public ProductDetailDto createProduct(CreateProductRequest req) {
        if (!categoryRepository.existsById(req.categoryId())) {
            throw new BadRequestException("Category does not exist with ID: " + req.categoryId());
        }

        String slug = req.slug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(req.name());
        } else {
            slug = slug.trim().toLowerCase();
        }

        if (productRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Product with slug '" + slug + "' already exists");
        }

        String sku = req.sku().trim().toUpperCase();
        if (productRepository.existsBySku(sku) || productVariantRepository.existsBySku(sku)) {
            throw new DuplicateResourceException("Product with SKU '" + sku + "' already exists");
        }

        Product product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setCategoryId(req.categoryId());
        product.setName(req.name().trim());
        product.setSlug(slug);
        product.setDescription(req.description());
        product.setBrand(req.brand() != null ? req.brand().trim() : "FunArray Studio");
        product.setBasePrice(req.basePrice());
        product.setStatus(req.status() != null ? req.status().toUpperCase() : "ACTIVE");
        product.setMaterial(req.material());
        product.setWeight(req.weight());
        product.setWidthCm(req.widthCm());
        product.setHeightCm(req.heightCm());
        product.setDepthCm(req.depthCm());
        product.setSku(sku);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());

        Product saved = productRepository.save(product);
        return productMapper.toDetailDto(saved);
    }

    public ProductDetailDto updateProduct(String id, UpdateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (req.categoryId() != null && !req.categoryId().isBlank()) {
            if (!categoryRepository.existsById(req.categoryId())) {
                throw new BadRequestException("Category does not exist with ID: " + req.categoryId());
            }
            product.setCategoryId(req.categoryId());
        }

        if (req.name() != null && !req.name().isBlank()) {
            product.setName(req.name().trim());
        }

        if (req.slug() != null && !req.slug().isBlank()) {
            String slug = req.slug().trim().toLowerCase();
            if (productRepository.existsBySlugAndIdNot(slug, id)) {
                throw new DuplicateResourceException("Product with slug '" + slug + "' already exists");
            }
            product.setSlug(slug);
        }

        if (req.sku() != null && !req.sku().isBlank()) {
            String sku = req.sku().trim().toUpperCase();
            if (productRepository.existsBySkuAndIdNot(sku, id) || productVariantRepository.existsBySku(sku)) {
                throw new DuplicateResourceException("Product SKU '" + sku + "' is already in use");
            }
            product.setSku(sku);
        }

        if (req.description() != null) {
            product.setDescription(req.description());
        }

        if (req.brand() != null) {
            product.setBrand(req.brand().trim());
        }

        if (req.basePrice() != null) {
            product.setBasePrice(req.basePrice());
        }

        if (req.status() != null && !req.status().isBlank()) {
            product.setStatus(req.status().trim().toUpperCase());
        }

        if (req.material() != null) {
            product.setMaterial(req.material());
        }

        if (req.weight() != null) {
            product.setWeight(req.weight());
        }

        if (req.widthCm() != null) {
            product.setWidthCm(req.widthCm());
        }

        if (req.heightCm() != null) {
            product.setHeightCm(req.heightCm());
        }

        if (req.depthCm() != null) {
            product.setDepthCm(req.depthCm());
        }

        product.setUpdatedAt(Instant.now());
        Product saved = productRepository.save(product);
        return productMapper.toDetailDto(saved);
    }

    public void deleteProduct(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        productRepository.delete(product);
    }

    public ProductDetailDto updateProductStatus(String id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        product.setStatus(status.toUpperCase());
        product.setUpdatedAt(Instant.now());
        Product saved = productRepository.save(product);
        return productMapper.toDetailDto(saved);
    }

    // ==================== Product Variant Management (TICKET-010) ====================

    @Transactional(readOnly = true)
    public List<ProductDetailDto.ProductVariantDto> getVariants(String productId) {
        Product product = productRepository.findById(productId)
                .or(() -> productRepository.findBySlug(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        return productVariantRepository.findByProductId(product.getId()).stream()
                .map(v -> new ProductDetailDto.ProductVariantDto(
                        v.getId(),
                        v.getSku(),
                        v.getColor(),
                        v.getMaterial(),
                        v.getPrice(),
                        v.getStockQuantity(),
                        v.getStatus()
                ))
                .toList();
    }

    public ProductDetailDto.ProductVariantDto addVariant(String productId, CreateProductVariantRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        String sku = req.sku().trim().toUpperCase();
        if (productVariantRepository.existsBySku(sku) || productRepository.existsBySku(sku)) {
            throw new DuplicateResourceException("Variant SKU '" + sku + "' already exists");
        }

        ProductVariant variant = new ProductVariant(
                UUID.randomUUID().toString(),
                product,
                sku,
                req.color().trim(),
                req.material(),
                req.price(),
                req.stockQuantity() != null ? req.stockQuantity() : 0,
                req.status() != null ? req.status().toUpperCase() : "ACTIVE"
        );

        ProductVariant saved = productVariantRepository.save(variant);
        return new ProductDetailDto.ProductVariantDto(
                saved.getId(),
                saved.getSku(),
                saved.getColor(),
                saved.getMaterial(),
                saved.getPrice(),
                saved.getStockQuantity(),
                saved.getStatus()
        );
    }

    public ProductDetailDto.ProductVariantDto updateVariant(String productId, String variantId, UpdateProductVariantRequest req) {
        ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with ID: " + variantId + " for product: " + productId));

        if (req.sku() != null && !req.sku().isBlank()) {
            String sku = req.sku().trim().toUpperCase();
            if (productVariantRepository.existsBySkuAndIdNot(sku, variantId) || productRepository.existsBySku(sku)) {
                throw new DuplicateResourceException("Variant SKU '" + sku + "' already in use");
            }
            variant.setSku(sku);
        }

        if (req.color() != null && !req.color().isBlank()) {
            variant.setColor(req.color().trim());
        }

        if (req.material() != null) {
            variant.setMaterial(req.material());
        }

        if (req.price() != null) {
            variant.setPrice(req.price());
        }

        if (req.stockQuantity() != null) {
            variant.setStockQuantity(req.stockQuantity());
        }

        if (req.status() != null && !req.status().isBlank()) {
            variant.setStatus(req.status().toUpperCase());
        }

        variant.setUpdatedAt(Instant.now());
        ProductVariant saved = productVariantRepository.save(variant);
        return new ProductDetailDto.ProductVariantDto(
                saved.getId(),
                saved.getSku(),
                saved.getColor(),
                saved.getMaterial(),
                saved.getPrice(),
                saved.getStockQuantity(),
                saved.getStatus()
        );
    }

    public void deleteVariant(String productId, String variantId) {
        ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with ID: " + variantId + " for product: " + productId));
        productVariantRepository.delete(variant);
    }

    // ==================== Product Image Management (TICKET-011) ====================

    public ProductDetailDto.ProductImageDto addImage(String productId, AddProductImageRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        validateImageUrl(req.imageUrl());

        List<ProductImage> existingImages = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);

        boolean isPrimary = Boolean.TRUE.equals(req.isPrimary()) || existingImages.isEmpty();
        if (isPrimary) {
            for (ProductImage img : existingImages) {
                if (Boolean.TRUE.equals(img.getIsPrimary())) {
                    img.setIsPrimary(false);
                    productImageRepository.save(img);
                }
            }
        }

        int sortOrder = req.sortOrder() != null ? req.sortOrder() : existingImages.size();

        ProductImage image = new ProductImage(
                UUID.randomUUID().toString(),
                product,
                req.imageUrl().trim(),
                req.altText() != null ? req.altText().trim() : product.getName(),
                sortOrder,
                isPrimary
        );

        ProductImage saved = productImageRepository.save(image);
        return new ProductDetailDto.ProductImageDto(
                saved.getId(),
                saved.getImageUrl(),
                saved.getAltText(),
                saved.getSortOrder(),
                saved.getIsPrimary()
        );
    }

    public ProductDetailDto.ProductImageDto updateImage(String productId, String imageId, UpdateProductImageRequest req) {
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId + " for product: " + productId));

        if (Boolean.TRUE.equals(req.isPrimary())) {
            List<ProductImage> existingImages = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
            for (ProductImage img : existingImages) {
                if (!img.getId().equals(imageId) && Boolean.TRUE.equals(img.getIsPrimary())) {
                    img.setIsPrimary(false);
                    productImageRepository.save(img);
                }
            }
            image.setIsPrimary(true);
        } else if (req.isPrimary() != null) {
            image.setIsPrimary(req.isPrimary());
        }

        if (req.altText() != null) {
            image.setAltText(req.altText().trim());
        }

        if (req.sortOrder() != null) {
            image.setSortOrder(req.sortOrder());
        }

        ProductImage saved = productImageRepository.save(image);
        return new ProductDetailDto.ProductImageDto(
                saved.getId(),
                saved.getImageUrl(),
                saved.getAltText(),
                saved.getSortOrder(),
                saved.getIsPrimary()
        );
    }

    public ProductDetailDto.ProductImageDto setPrimaryImage(String productId, String imageId) {
        return updateImage(productId, imageId, new UpdateProductImageRequest(null, null, true));
    }

    public void deleteImage(String productId, String imageId) {
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId + " for product: " + productId));

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        productImageRepository.delete(image);

        if (wasPrimary) {
            List<ProductImage> remaining = productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
            if (!remaining.isEmpty()) {
                ProductImage first = remaining.get(0);
                first.setIsPrimary(true);
                productImageRepository.save(first);
            }
        }
    }

    // ==================== Furniture 3D Model Management (TICKET-012) ====================

    @Transactional(readOnly = true)
    public Optional<FurnitureModelDto> getModel(String productId) {
        Product product = productRepository.findById(productId)
                .or(() -> productRepository.findBySlug(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        return furnitureModelRepository.findByProductId(product.getId())
                .map(this::toModelDto);
    }

    public FurnitureModelDto saveModel(String productId, SaveFurnitureModelRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        String format = req.format() != null ? req.format().toLowerCase().trim() : "glb";
        if (!format.matches("^(glb|gltf|usdz)$")) {
            throw new BadRequestException("Unsupported 3D model format '" + format + "'. Supported formats: glb, gltf, usdz.");
        }

        String modelUrl = req.modelUrl().trim();
        if (modelUrl.isBlank() || !modelUrl.startsWith("http")) {
            throw new BadRequestException("Model URL must be a valid external S3/storage URL.");
        }

        FurnitureModel model = furnitureModelRepository.findByProductId(productId)
                .orElseGet(() -> new FurnitureModel(
                        UUID.randomUUID().toString(),
                        product,
                        modelUrl,
                        req.thumbnailUrl(),
                        format,
                        req.fileSize(),
                        req.widthCm(),
                        req.heightCm(),
                        req.depthCm(),
                        req.version() != null ? req.version() : 1,
                        req.status() != null ? req.status() : "ACTIVE"
                ));

        if (model.getId() != null) {
            model.setModelUrl(modelUrl);
            model.setThumbnailUrl(req.thumbnailUrl());
            model.setFormat(format);
            if (req.fileSize() != null) model.setFileSize(req.fileSize());
            model.setWidthCm(req.widthCm());
            model.setHeightCm(req.heightCm());
            model.setDepthCm(req.depthCm());
            model.setVersion(req.version() != null ? req.version() : model.getVersion() + 1);
            if (req.status() != null) model.setStatus(req.status().toUpperCase());
            model.setUpdatedAt(Instant.now());
        }

        FurnitureModel saved = furnitureModelRepository.save(model);
        return toModelDto(saved);
    }

    public void deleteModel(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        furnitureModelRepository.findByProductId(product.getId())
                .ifPresent(furnitureModelRepository::delete);
    }

    // ==================== Helper Methods ====================

    private void validateImageUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("Image URL cannot be empty");
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("Image URL must start with http:// or https://");
        }
        // Validate image file format extension
        String cleanUrl = url.split("\\?")[0].toLowerCase();
        if (!cleanUrl.endsWith(".jpg") && !cleanUrl.endsWith(".jpeg") && !cleanUrl.endsWith(".png")
                && !cleanUrl.endsWith(".webp") && !cleanUrl.endsWith(".svg") && !cleanUrl.endsWith(".avif")
                && !cleanUrl.endsWith(".gif")) {
            throw new BadRequestException("Invalid image file format. Supported extensions: .jpg, .jpeg, .png, .webp, .svg, .avif");
        }
    }

    private String generateSlug(String name) {
        return name.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private FurnitureModelDto toModelDto(FurnitureModel m) {
        return new FurnitureModelDto(
                m.getId(),
                m.getProduct() != null ? m.getProduct().getId() : null,
                m.getModelUrl(),
                m.getThumbnailUrl(),
                m.getFormat(),
                m.getFileSize(),
                m.getWidthCm(),
                m.getHeightCm(),
                m.getDepthCm(),
                m.getVersion(),
                m.getStatus(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
