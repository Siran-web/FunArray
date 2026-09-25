import { Product } from "@/types/product";
import { FEATURED_PRODUCTS, CATEGORIES, CategoryItem } from "@/data/mock-products";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface ProductQueryParams {
  page?: number;
  size?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  q?: string;
  sortBy?: "featured" | "price_asc" | "price_desc" | "rating" | "newest";
}

export interface ProductsResponse {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", params.page.toString());
  if (params.size !== undefined) query.set("size", params.size.toString());
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.minPrice !== undefined) query.set("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined) query.set("maxPrice", params.maxPrice.toString());
  if (params.color) query.set("color", params.color);
  if (params.q) query.set("q", params.q);
  if (params.sortBy) query.set("sortBy", params.sortBy);

  try {
    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
      next: { revalidate: 60 },
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    // Graceful fallback to client curated data if backend is offline
    console.warn("Backend API not reachable, falling back to local dataset:", error);
  }

  // Client-side filtering fallback
  let filtered = [...FEATURED_PRODUCTS];

  if (params.category && params.category !== "all") {
    filtered = filtered.filter(
      (p) =>
        p.categoryId.toLowerCase() === params.category?.toLowerCase() ||
        p.categoryName?.toLowerCase() === params.category?.toLowerCase()
    );
  }

  if (params.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.basePrice >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.basePrice <= params.maxPrice!);
  }

  if (params.q) {
    const term = params.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.material.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
    );
  }

  if (params.sortBy) {
    switch (params.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
  }

  return {
    content: filtered,
    page: 0,
    size: filtered.length,
    totalElements: filtered.length,
    totalPages: 1,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn("Backend API unreachable for product detail, using local data:", error);
  }

  return FEATURED_PRODUCTS.find((p) => p.id === id) || null;
}

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    // fallback
  }
  return CATEGORIES;
}
