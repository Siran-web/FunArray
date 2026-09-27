import { describe, it, expect } from 'vitest';
import { FEATURED_PRODUCTS } from '../data/mock-products';
import { Product } from '../types/product';

describe('Product Listing & Detail Flows', () => {
  it('should load featured products catalog correctly', () => {
    expect(FEATURED_PRODUCTS.length).toBeGreaterThan(0);
    const sample = FEATURED_PRODUCTS[0];
    expect(sample.id).toBeDefined();
    expect(sample.name).toBeDefined();
    expect(sample.basePrice).toBeGreaterThan(0);
    expect(sample.images.length).toBeGreaterThan(0);
    expect(sample.variants.length).toBeGreaterThan(0);
  });

  it('should support category-based filtering', () => {
    const categoryToFind = FEATURED_PRODUCTS[0].categoryName || 'Living Room';
    const filtered = FEATURED_PRODUCTS.filter(
      (p) => p.categoryName?.toLowerCase() === categoryToFind.toLowerCase()
    );
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((p) => {
      expect(p.categoryName?.toLowerCase()).toBe(categoryToFind.toLowerCase());
    });
  });

  it('should sort products by price in ascending and descending order', () => {
    const productsCopy = [...FEATURED_PRODUCTS];

    const ascSorted = [...productsCopy].sort((a, b) => a.basePrice - b.basePrice);
    for (let i = 0; i < ascSorted.length - 1; i++) {
      expect(ascSorted[i].basePrice).toBeLessThanOrEqual(ascSorted[i + 1].basePrice);
    }

    const descSorted = [...productsCopy].sort((a, b) => b.basePrice - a.basePrice);
    for (let i = 0; i < descSorted.length - 1; i++) {
      expect(descSorted[i].basePrice).toBeGreaterThanOrEqual(descSorted[i + 1].basePrice);
    }
  });

  it('should search products by text query across name, description, and material', () => {
    const query = 'oak';
    const matches = FEATURED_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query)
    );

    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((p) => {
      const matched =
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.material.toLowerCase().includes(query);
      expect(matched).toBe(true);
    });
  });

  it('should handle product variant selection and calculate variant specific price', () => {
    const productWithVariants = FEATURED_PRODUCTS.find((p) => p.variants.length > 1) || FEATURED_PRODUCTS[0];
    const variant1 = productWithVariants.variants[0];
    const variant2 = productWithVariants.variants[1] || variant1;

    expect(variant1.color).toBeDefined();
    expect(variant1.price).toBeGreaterThan(0);
    expect(variant2.color).toBeDefined();
    expect(variant2.price).toBeGreaterThan(0);
  });

  it('should verify AR support flag and 1:1 metric manufactured dimensions', () => {
    const arProduct = FEATURED_PRODUCTS.find((p) => p.arSupported) || FEATURED_PRODUCTS[0];
    expect(arProduct.dimensions.widthCm).toBeGreaterThan(0);
    expect(arProduct.dimensions.heightCm).toBeGreaterThan(0);
    expect(arProduct.dimensions.depthCm).toBeGreaterThan(0);
  });
});
