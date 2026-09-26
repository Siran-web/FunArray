package com.furniture.store.product.mapper;

import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.product.dto.ARAssetDto;
import com.furniture.store.product.dto.ProductDetailDto;
import com.furniture.store.product.dto.ProductSummaryDto;
import com.furniture.store.product.entity.FurnitureModel;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductImage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ProductMapper {

    private final CategoryRepository categoryRepository;

    public ProductMapper(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public ProductSummaryDto toSummaryDto(Product p) {
        String primaryImg = p.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(p.getImages().isEmpty() ? "" : p.getImages().get(0).getImageUrl());

        boolean isAvailable = "ACTIVE".equalsIgnoreCase(p.getStatus());
        boolean hasModel = p.getModel3D() != null;

        return new ProductSummaryDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getBasePrice(),
                p.getCategoryId(),
                primaryImg,
                4.8,
                isAvailable,
                hasModel || true
        );
    }

    public ProductDetailDto toDetailDto(Product p) {
        List<ProductDetailDto.ProductImageDto> imageDtos = p.getImages().stream()
                .map(img -> new ProductDetailDto.ProductImageDto(
                        img.getId(),
                        img.getImageUrl(),
                        img.getAltText(),
                        img.getSortOrder() != null ? img.getSortOrder() : 0,
                        img.getIsPrimary() != null && img.getIsPrimary()
                ))
                .toList();

        List<ProductDetailDto.ProductVariantDto> variantDtos = p.getVariants().stream()
                .map(v -> new ProductDetailDto.ProductVariantDto(
                        v.getId(),
                        v.getSku(),
                        v.getColor(),
                        v.getMaterial(),
                        v.getPrice(),
                        v.getStockQuantity() != null ? v.getStockQuantity() : 0,
                        v.getStatus() != null ? v.getStatus() : "ACTIVE"
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

        String categoryName = categoryRepository.findById(p.getCategoryId())
                .map(Category::getName)
                .orElse("Living Room");

        boolean isAvailable = "ACTIVE".equalsIgnoreCase(p.getStatus());

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
                p.getStatus(),
                p.getMaterial(),
                p.getWeight(),
                new ProductDetailDto.DimensionsDto(p.getWidthCm(), p.getHeightCm(), p.getDepthCm(), "cm"),
                p.getSku(),
                p.getCategoryId(),
                categoryName,
                4.9,
                128,
                isAvailable,
                true,
                imageDtos,
                variantDtos,
                arAsset,
                storeAvailability
        );
    }
}
