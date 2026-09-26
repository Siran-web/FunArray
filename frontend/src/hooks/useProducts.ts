import { useState, useEffect } from 'react';
import { getProducts, getCategories, ProductQueryParams } from '../services/productApi';
import { Product } from '../types/product';
import { CategoryItem } from '@/data/mock-products';

export function useProducts(params?: ProductQueryParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts(params),
          getCategories(),
        ]);
        if (isMounted) {
          setProducts(prodRes.content);
          setCategories(catRes);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [params?.category, params?.q, params?.sortBy]);

  return { products, categories, loading, error };
}
