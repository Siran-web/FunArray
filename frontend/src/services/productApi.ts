import { Product, ProductVariant, ProductImage, Furniture3DModel } from "@/types/product";
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
  status?: string;
}

export interface ProductsResponse {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CategoryTreeItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  children?: CategoryTreeItem[];
}

export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  resourceType: "PRODUCT_IMAGE" | "3D_MODEL" | "ROOM_SCAN";
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
  contentType: string;
  requiredHeaders?: Record<string, string>;
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
  if (params.status) query.set("status", params.status);

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
        p.brand.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
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

export async function getProductById(idOrSlug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}`, {
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

  return FEATURED_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((c: any) => ({
          id: c.slug || c.id,
          name: c.name,
          slug: c.slug,
          itemCount: 4,
          imageUrl: c.imageUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
          parentId: c.parentId
        }));
      }
    }
  } catch (error) {
    // fallback
  }
  return CATEGORIES;
}

export async function getCategoryTree(): Promise<CategoryTreeItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/tree`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    // fallback
  }
  return [];
}

export async function requestPresignedUpload(
  data: PresignedUploadRequest,
  token?: string
): Promise<PresignedUploadResponse | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/storage/presigned-upload-url`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    console.error("Failed to request presigned upload URL:", error);
  }
  return null;
}

export async function uploadDirectToS3(
  uploadUrl: string,
  file: File | Blob,
  contentType: string
): Promise<boolean> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });
    return res.ok;
  } catch (error) {
    console.error("Direct S3 upload failed:", error);
    return false;
  }
}
