package com.furniture.store.category;

import com.furniture.store.category.dto.CategoryDto;
import com.furniture.store.category.dto.CreateCategoryRequest;
import com.furniture.store.category.dto.UpdateCategoryRequest;
import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.DuplicateResourceException;
import com.furniture.store.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getCategoryTree() {
        List<Category> all = categoryRepository.findAllByOrderBySortOrderAscNameAsc();
        Map<String, List<CategoryDto>> childrenMap = new HashMap<>();

        for (Category cat : all) {
            if (cat.getParentId() != null) {
                childrenMap.computeIfAbsent(cat.getParentId(), k -> new ArrayList<>())
                        .add(toDto(cat));
            }
        }

        List<CategoryDto> rootCategories = new ArrayList<>();
        for (Category cat : all) {
            if (cat.getParentId() == null) {
                List<CategoryDto> children = childrenMap.getOrDefault(cat.getId(), Collections.emptyList());
                rootCategories.add(new CategoryDto(
                        cat.getId(),
                        cat.getName(),
                        cat.getSlug(),
                        cat.getDescription(),
                        cat.getImageUrl(),
                        cat.getParentId(),
                        cat.getSortOrder(),
                        cat.getCreatedAt(),
                        cat.getUpdatedAt(),
                        children
                ));
            }
        }

        return rootCategories;
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(String idOrSlug) {
        Category category = categoryRepository.findById(idOrSlug)
                .or(() -> categoryRepository.findBySlug(idOrSlug))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id or slug: " + idOrSlug));
        
        List<CategoryDto> children = categoryRepository.findByParentId(category.getId()).stream()
                .map(this::toDto)
                .toList();

        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getImageUrl(),
                category.getParentId(),
                category.getSortOrder(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                children
        );
    }

    public CategoryDto createCategory(CreateCategoryRequest req) {
        String slug = req.slug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(req.name());
        } else {
            slug = slug.trim().toLowerCase();
        }

        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Category with slug '" + slug + "' already exists");
        }

        String parentId = req.parentId();
        if (parentId != null && !parentId.isBlank()) {
            if (!categoryRepository.existsById(parentId)) {
                throw new BadRequestException("Parent category does not exist with ID: " + parentId);
            }
        } else {
            parentId = null;
        }

        String id = UUID.randomUUID().toString();
        Category category = new Category(
                id,
                req.name().trim(),
                slug,
                req.description(),
                req.imageUrl(),
                parentId,
                req.sortOrder() != null ? req.sortOrder() : 0
        );

        Category saved = categoryRepository.save(category);
        return toDto(saved);
    }

    public CategoryDto updateCategory(String id, UpdateCategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        if (req.name() != null && !req.name().isBlank()) {
            category.setName(req.name().trim());
        }

        if (req.slug() != null && !req.slug().isBlank()) {
            String slug = req.slug().trim().toLowerCase();
            if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
                throw new DuplicateResourceException("Category with slug '" + slug + "' already exists");
            }
            category.setSlug(slug);
        }

        if (req.description() != null) {
            category.setDescription(req.description());
        }

        if (req.imageUrl() != null) {
            category.setImageUrl(req.imageUrl());
        }

        if (req.sortOrder() != null) {
            category.setSortOrder(req.sortOrder());
        }

        if (req.parentId() != null) {
            String newParentId = req.parentId().trim();
            if (newParentId.isEmpty() || newParentId.equalsIgnoreCase("null")) {
                category.setParentId(null);
            } else {
                if (newParentId.equals(id)) {
                    throw new BadRequestException("A category cannot be its own parent");
                }
                if (!categoryRepository.existsById(newParentId)) {
                    throw new BadRequestException("Parent category does not exist with ID: " + newParentId);
                }
                // Check circular hierarchy
                if (isCircularReference(id, newParentId)) {
                    throw new BadRequestException("Circular parent category reference detected");
                }
                category.setParentId(newParentId);
            }
        }

        category.setUpdatedAt(Instant.now());
        Category saved = categoryRepository.save(category);
        return toDto(saved);
    }

    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        // Unlink child categories
        List<Category> children = categoryRepository.findByParentId(id);
        for (Category child : children) {
            child.setParentId(null);
            child.setUpdatedAt(Instant.now());
            categoryRepository.save(child);
        }

        categoryRepository.delete(category);
    }

    private boolean isCircularReference(String categoryId, String prospectiveParentId) {
        String current = prospectiveParentId;
        Set<String> visited = new HashSet<>();
        while (current != null) {
            if (current.equals(categoryId)) {
                return true;
            }
            if (!visited.add(current)) {
                return true;
            }
            Optional<Category> parent = categoryRepository.findById(current);
            current = parent.map(Category::getParentId).orElse(null);
        }
        return false;
    }

    private String generateSlug(String name) {
        return name.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private CategoryDto toDto(Category c) {
        return new CategoryDto(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getDescription(),
                c.getImageUrl(),
                c.getParentId(),
                c.getSortOrder(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
