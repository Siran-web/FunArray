package com.furniture.store.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, String id);
    List<Category> findByParentId(String parentId);
    List<Category> findByParentIdIsNull();
    List<Category> findAllByOrderBySortOrderAscNameAsc();
}
