import type { Metadata } from "next";
import { getProductById } from "@/services/productApi";
import { ProductDetailView } from "./product-detail-view";
import { FEATURED_PRODUCTS } from "@/data/mock-products";

interface ProductPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const product = await getProductById(productId) || FEATURED_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || FEATURED_PRODUCTS[0];

  if (!product) {
    return {
      title: "Product Detail | FunArray Furniture",
      description: "Explore curated architectural furniture with interactive 3D and AR room preview.",
    };
  }

  const primaryImage = product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80";

  return {
    title: `${product.name} | FunArray Architectural Furniture`,
    description: `${product.description.slice(0, 160)}... Handcrafted in solid ${product.material}. Available for 1:1 true-scale AR room preview.`,
    keywords: [
      product.name,
      product.categoryName || "Furniture",
      product.material,
      product.brand,
      "AR room fitting",
      "3D furniture preview",
      "Luxury solid wood furniture"
    ],
    openGraph: {
      title: `${product.name} | FunArray Furniture`,
      description: product.description,
      url: `https://funarray.store/products/${product.slug || product.id}`,
      siteName: "FunArray Virtual Furniture Store",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 800,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | FunArray Furniture`,
      description: product.description,
      images: [primaryImage],
    },
    alternates: {
      canonical: `https://funarray.store/products/${product.slug || product.id}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const product = await getProductById(productId) || FEATURED_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null;

  // JSON-LD Structured Data for Search Engine Crawlers
  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map((i) => i.imageUrl) || [],
    "description": product.description,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "FunArray"
    },
    "material": product.material,
    "offers": {
      "@type": "Offer",
      "url": `https://funarray.store/products/${product.slug || product.id}`,
      "priceCurrency": "INR",
      "price": product.basePrice,
      "availability": product.availableOnline ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 4.9,
      "reviewCount": product.reviewCount || 128
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailView initialProduct={product} productId={productId} />
    </>
  );
}
