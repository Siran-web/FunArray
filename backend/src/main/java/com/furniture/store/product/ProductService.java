package com.furniture.store.product;

import com.furniture.store.product.dto.ARAssetDto;
import com.furniture.store.product.dto.ProductDetailDto;
import com.furniture.store.product.dto.ProductSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public Map<String, Object> getProducts(
            int page,
            int size,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String query,
            String sortBy
    ) {
        Sort sort = switch (sortBy != null ? sortBy.toLowerCase() : "featured") {
            case "price_asc" -> Sort.by("basePrice").ascending();
            case "price_desc" -> Sort.by("basePrice").descending();
            case "newest" -> Sort.by("createdAt").descending();
            default -> Sort.by("name").ascending();
        };

        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Product> productPage = productRepository.findFiltered(category, minPrice, maxPrice, query, pageRequest);

        List<ProductSummaryDto> content = productPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("page", productPage.getNumber());
        response.put("size", productPage.getSize());
        response.put("totalElements", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());

        return response;
    }

    public Optional<ProductDetailDto> getProductById(String id) {
        return productRepository.findById(id).map(this::toDetailDto);
    }

    public Optional<ARAssetDto> getARAssetByProductId(String productId) {
        return productRepository.findById(productId).map(p -> {
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

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    private ProductSummaryDto toSummaryDto(Product p) {
        String primaryImg = p.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(p.getImages().isEmpty() ? "" : p.getImages().get(0).getImageUrl());

        return new ProductSummaryDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getBasePrice(),
                p.getCategoryId(),
                primaryImg,
                4.8,
                true,
                true
        );
    }

    private ProductDetailDto toDetailDto(Product p) {
        List<ProductDetailDto.ProductImageDto> imageDtos = p.getImages().stream()
                .map(img -> new ProductDetailDto.ProductImageDto(
                        img.getId(),
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getSortOrder(),
                        img.getIsPrimary()
                ))
                .toList();

        List<ProductDetailDto.ProductVariantDto> variantDtos = p.getVariants().stream()
                .map(v -> new ProductDetailDto.ProductVariantDto(
                        v.getId(),
                        v.getSku(),
                        v.getColor(),
                        v.getMaterial(),
                        v.getPrice(),
                        v.getStockQuantity()
                ))
                .toList();

        ARAssetDto arAsset = p.getModel3D() != null ? new ARAssetDto(
                true,
                p.getModel3D().getModelUrl(),
                p.getModel3D().getThumbnailUrl(),
                new ARAssetDto.Dimensions(p.getModel3D().getWidthCm(), p.getModel3D().getHeightCm(), p.getModel3D().getDepthCm(), "cm")
        ) : new ARAssetDto(
                true,
                "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
                imageDtos.isEmpty() ? null : imageDtos.get(0).imageUrl(),
                new ARAssetDto.Dimensions(p.getWidthCm(), p.getHeightCm(), p.getDepthCm(), "cm")
        );

        Map<String, String> storeAvailability = Map.of(
                "Delhi Flagship Showroom", "In Stock (8 available)",
                "Jalandhar Design Showroom", "In Stock (3 available)",
                "Chandigarh Showroom", "Out of Stock"
        );

        return new ProductDetailDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getBrand(),
                p.getBasePrice(),
                p.getMaterial(),
                new ProductDetailDto.DimensionsDto(p.getWidthCm(), p.getHeightCm(), p.getDepthCm(), "cm"),
                p.getSku(),
                p.getCategoryId(),
                "Living Room",
                4.9,
                128,
                true,
                true,
                imageDtos,
                variantDtos,
                arAsset,
                storeAvailability
        );
    }
}
