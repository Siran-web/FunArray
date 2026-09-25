"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { ARPreviewModal } from "@/components/ar/ar-preview-modal";
import { CartDrawer, CartItemEntry } from "@/components/commerce/cart-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product, ProductVariant } from "@/types/product";
import { getProductById } from "@/services/productApi";
import { FEATURED_PRODUCTS, SHOWROOMS } from "@/data/mock-products";
import { formatPrice } from "@/lib/utils";
import {
  Heart,
  Star,
  Box,
  Truck,
  ShieldCheck,
  Clock,
  Check,
  ChevronRight,
  Share2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  MapPin,
  CheckCircle2,
  Ruler,
  Layers,
  ArrowLeft
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"specs" | "craft" | "reviews" | "delivery">("specs");

  // Modals & Drawer State
  const [isARModalOpen, setIsARModalOpen] = React.useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<CartItemEntry[]>([]);

  React.useEffect(() => {
    if (productId) {
      getProductById(productId).then((found) => {
        if (found) {
          setProduct(found);
          setSelectedVariant(found.variants[0] || null);
        } else {
          // Fallback to first product
          setProduct(FEATURED_PRODUCTS[0]);
          setSelectedVariant(FEATURED_PRODUCTS[0].variants[0]);
        }
      });
    }
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#8B5E3C] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-[#6F6A64]">Loading product specifications...</p>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const currentImages = product.images.length > 0 ? product.images : [
    { id: "img-def", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80", altText: product.name, sortOrder: 0, isPrimary: true }
  ];

  const handleAddToCart = (targetProduct?: Product) => {
    const p = targetProduct || product;
    const qty = targetProduct ? 1 : quantity;
    const color = targetProduct
      ? (targetProduct.variants[0]?.color || "Standard Finish")
      : (selectedVariant?.color || "Standard Finish");

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === p.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === p.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          product: p,
          quantity: qty,
          selectedColor: color,
        },
      ];
    });
    setIsCartDrawerOpen(true);
  };

  const relatedProducts = FEATURED_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      {/* 1. Global Navigation */}
      <Navbar
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onOpenARPreview={() => setIsARModalOpen(true)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={isWishlisted ? 3 : 2}
      />

      {/* 2. Breadcrumbs Bar */}
      <div className="bg-white border-b border-[#E5E0DA] py-3.5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between text-xs text-[#6F6A64]">
          <nav className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#8B5E3C]">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <Link href="/products" className="hover:text-[#8B5E3C]">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <span className="text-[#8B5E3C] font-semibold">{product.categoryName || "Living Room"}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <span className="text-[#24211E] font-medium line-clamp-1">{product.name}</span>
          </nav>

          <Link href="/products" className="hidden sm:flex items-center gap-1.5 text-xs text-[#8B5E3C] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Link>
        </div>
      </div>

      {/* 3. Main Product Detail Section */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT COLUMN: Gallery & 3D Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4 sticky top-28">
            {/* Primary High-Resolution Display */}
            <div className="relative aspect-[4/3] bg-white rounded-[20px] overflow-hidden border border-[#E5E0DA] shadow-card group">
              <img
                src={currentImages[activeImageIndex]?.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* AR Ready Pill Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="ar" size="md" className="shadow-xs backdrop-blur-xs">
                  <Box className="w-3.5 h-3.5 text-[#8B5E3C]" />
                  <span>3D / AR Supported</span>
                </Badge>
              </div>

              {/* Wishlist Heart Toggle */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Save to Wishlist"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#6F6A64] hover:text-[#C84B4B] shadow-sm hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#C84B4B] text-[#C84B4B]" : ""}`} />
              </button>

              {/* Prominent Overlay AR CTA Button (Section 12 requirement) */}
              <div className="absolute bottom-5 left-5 right-5 flex justify-center">
                <Button
                  variant="ar"
                  size="md"
                  onClick={() => setIsARModalOpen(true)}
                  className="shadow-xl px-6 py-2.5 bg-[#24211E]/95 hover:bg-[#8B5E3C] backdrop-blur-md border border-white/20"
                >
                  <Box className="w-4 h-4 text-[#D49A6A]" />
                  <span>View in Your Room (AR Preview)</span>
                </Button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {currentImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx
                      ? "border-[#8B5E3C] shadow-sm scale-105"
                      : "border-[#E5E0DA] hover:border-[#9B958E] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.imageUrl} alt={img.altText} className="w-full h-full object-cover" />
                </button>
              ))}

              {/* 3D Model Quick Trigger Thumbnail */}
              <button
                onClick={() => setIsARModalOpen(true)}
                className="w-20 h-20 rounded-[10px] border-2 border-dashed border-[#8B5E3C] bg-[#F3E8DE] flex flex-col items-center justify-center text-[#8B5E3C] hover:bg-[#ebd9cb] transition-colors shrink-0 cursor-pointer"
              >
                <Box className="w-6 h-6 text-[#8B5E3C]" />
                <span className="text-[10px] font-bold mt-1">3D Orbit</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Information & Commerce Action (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6F6A64]">
                <span className="text-[#8B5E3C] font-semibold tracking-wider uppercase">
                  {product.brand || "FunArray Studio"}
                </span>
                <span className="font-mono text-[#9B958E]">SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium leading-tight">
                {product.name}
              </h1>

              {/* Star Rating */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1 text-[#C78A24]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C78A24] text-[#C78A24]" />
                  ))}
                </div>
                <span className="font-bold text-[#24211E]">{product.rating}</span>
                <span className="text-[#9B958E]">({product.reviewCount} verified reviews)</span>
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 rounded-[12px] bg-white border border-[#E5E0DA] shadow-card flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-serif font-bold text-[#24211E]">
                  {formatPrice(currentPrice)}
                </p>
                <p className="text-xs text-[#6F6A64] mt-0.5">
                  Inclusive of all taxes • or 3 interest-free installments of {formatPrice(Math.round(currentPrice / 3))}
                </p>
              </div>
              <Badge variant="available">In Stock</Badge>
            </div>

            {/* Description Excerpt */}
            <p className="text-sm text-[#6F6A64] leading-relaxed">
              {product.description}
            </p>

            {/* Finish & Color Swatches */}
            {product.variants.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#24211E] uppercase tracking-wide">
                    Finish / Fabric: <strong className="text-[#8B5E3C]">{selectedVariant?.color}</strong>
                  </span>
                  <span className="text-[#9B958E]">Material: {selectedVariant?.material}</span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-[8px] border text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                        selectedVariant?.id === v.id
                          ? "border-[#8B5E3C] bg-[#F3E8DE] text-[#8B5E3C] shadow-2xs"
                          : "border-[#E5E0DA] bg-white text-[#6F6A64] hover:border-[#9B958E]"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#8B5E3C]/80 inline-block border border-white" />
                      <span>{v.color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manufactured Dimensions Snapshot */}
            <div className="p-4 rounded-[12px] bg-[#FAF9F7] border border-[#E5E0DA] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#24211E] flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#8B5E3C]" />
                  Actual Manufactured Dimensions
                </span>
                <span className="text-[11px] text-[#2F7D50] font-semibold">1:1 AR Precision Verified</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
                <div className="p-2 bg-white rounded-[8px] border border-[#E5E0DA]">
                  <span className="text-[#9B958E] block text-[10px]">Width</span>
                  <span className="font-bold text-[#24211E]">{product.dimensions.widthCm} cm</span>
                </div>
                <div className="p-2 bg-white rounded-[8px] border border-[#E5E0DA]">
                  <span className="text-[#9B958E] block text-[10px]">Height</span>
                  <span className="font-bold text-[#24211E]">{product.dimensions.heightCm} cm</span>
                </div>
                <div className="p-2 bg-white rounded-[8px] border border-[#E5E0DA]">
                  <span className="text-[#9B958E] block text-[10px]">Depth</span>
                  <span className="font-bold text-[#24211E]">{product.dimensions.depthCm} cm</span>
                </div>
              </div>
            </div>

            {/* Omnichannel Showroom Availability (Section 44 requirement) */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#24211E] flex items-center justify-between">
                <span>Showroom Availability Near You</span>
                <Link href="/products#showrooms" className="text-[#8B5E3C] hover:underline normal-case">
                  Find Nearest
                </Link>
              </label>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-[10px] border border-[#E5E0DA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8B5E3C]" />
                    <div>
                      <span className="font-semibold text-[#24211E]">Delhi Flagship Showroom</span>
                      <p className="text-[11px] text-[#6F6A64]">Sultanpur, MG Road</p>
                    </div>
                  </div>
                  <span className="text-[#2F7D50] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In stock (8 available)
                  </span>
                </div>

                <div className="p-3 bg-white rounded-[10px] border border-[#E5E0DA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8B5E3C]" />
                    <div>
                      <span className="font-semibold text-[#24211E]">Jalandhar Design Showroom</span>
                      <p className="text-[11px] text-[#6F6A64]">Model Town Market</p>
                    </div>
                  </div>
                  <span className="text-[#2F7D50] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> In stock (3 available)
                  </span>
                </div>

                <div className="p-3 bg-white rounded-[10px] border border-[#E5E0DA] flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#9B958E]" />
                    <div>
                      <span className="font-semibold text-[#24211E]">Chandigarh Showroom</span>
                      <p className="text-[11px] text-[#6F6A64]">Sector 8-C</p>
                    </div>
                  </div>
                  <span className="text-[#C84B4B] font-semibold">○ Out of stock</span>
                </div>
              </div>
            </div>

            {/* Core Commerce Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-[#E5E0DA] rounded-[10px] bg-white h-11 px-2 shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-[#6F6A64] hover:text-[#24211E]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-[#24211E]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-[#6F6A64] hover:text-[#24211E]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleAddToCart()}
                  className="flex-1 h-11 bg-[#8B5E3C] hover:bg-[#634027] text-white gap-2 font-semibold"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add {quantity} to Bag • {formatPrice(currentPrice * quantity)}</span>
                </Button>
              </div>

              {/* Full Width AR Button (Section 12) */}
              <Button
                variant="ar"
                size="lg"
                onClick={() => setIsARModalOpen(true)}
                className="w-full h-12 shadow-sm font-semibold text-sm"
              >
                <Box className="w-5 h-5 text-[#D49A6A]" />
                <span>View in Your Room (Instant 3D / AR Preview)</span>
              </Button>
            </div>

            {/* Reassurance Checklist */}
            <div className="pt-4 border-t border-[#E5E0DA] space-y-2 text-xs text-[#6F6A64]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#8B5E3C]" />
                <span>Free White-Glove In-Home Assembly on this piece</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B5E3C]" />
                <span>100-Night Sizing Guarantee — return free if it does not fit</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B5E3C]" />
                <span>10-Year Solid Hardwood Structural Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tabbed Deep Product Details & Reviews */}
        <section className="bg-white rounded-[20px] border border-[#E5E0DA] shadow-card p-6 sm:p-10 space-y-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#E5E0DA] gap-6 text-sm font-medium overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-3 border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === "specs"
                  ? "border-[#8B5E3C] text-[#8B5E3C] font-semibold"
                  : "border-transparent text-[#6F6A64] hover:text-[#24211E]"
              }`}
            >
              Dimensions & Specifications
            </button>
            <button
              onClick={() => setActiveTab("craft")}
              className={`pb-3 border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === "craft"
                  ? "border-[#8B5E3C] text-[#8B5E3C] font-semibold"
                  : "border-transparent text-[#6F6A64] hover:text-[#24211E]"
              }`}
            >
              Sustainable Craftsmanship
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === "reviews"
                  ? "border-[#8B5E3C] text-[#8B5E3C] font-semibold"
                  : "border-transparent text-[#6F6A64] hover:text-[#24211E]"
              }`}
            >
              Customer Reviews ({product.reviewCount})
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`pb-3 border-b-2 transition-all cursor-pointer shrink-0 ${
                activeTab === "delivery"
                  ? "border-[#8B5E3C] text-[#8B5E3C] font-semibold"
                  : "border-transparent text-[#6F6A64] hover:text-[#24211E]"
              }`}
            >
              White-Glove Delivery
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === "specs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-[#6F6A64]">
              <div className="space-y-3">
                <h4 className="font-serif text-lg font-semibold text-[#24211E]">Dimensions & Weight</h4>
                <div className="space-y-2 border-t border-[#E5E0DA] pt-2">
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Overall Width</span>
                    <strong className="text-[#24211E]">{product.dimensions.widthCm} cm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Overall Height</span>
                    <strong className="text-[#24211E]">{product.dimensions.heightCm} cm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Overall Depth</span>
                    <strong className="text-[#24211E]">{product.dimensions.depthCm} cm</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Net Weight</span>
                    <strong className="text-[#24211E]">{product.weight || 68} kg</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-serif text-lg font-semibold text-[#24211E]">Materials & Build</h4>
                <div className="space-y-2 border-t border-[#E5E0DA] pt-2">
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Primary Timber</span>
                    <strong className="text-[#24211E]">{product.material}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Cushion Composition</span>
                    <strong className="text-[#24211E]">Multi-Density Foam & Duck Feather wrap</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Assembly Required</span>
                    <strong className="text-[#24211E]">None (Completed by delivery team)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E0DA]/50">
                    <span>Removable Covers</span>
                    <strong className="text-[#24211E]">Yes, dry-cleanable linen covers</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "craft" && (
            <div className="space-y-4 text-xs sm:text-sm text-[#6F6A64] max-w-3xl">
              <h4 className="font-serif text-xl font-semibold text-[#24211E]">Kiln-Dried Hardwood & Traditional Mortise-and-Tenon Joinery</h4>
              <p className="leading-relaxed">
                Every piece is constructed using traditional mortise-and-tenon wood joinery rather than artificial fasteners. Our European oak and American walnut are kiln-dried to an optimal moisture equilibrium between 6% and 8% to ensure they will never warp, bow, or crack under fluctuating monsoon or summer humidity.
              </p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="font-serif text-4xl font-bold text-[#24211E]">4.9</span>
                <div>
                  <div className="flex items-center gap-1 text-[#C78A24]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C78A24] text-[#C78A24]" />
                    ))}
                  </div>
                  <p className="text-xs text-[#6F6A64]">Based on 128 verified homeowner evaluations</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-[#E5E0DA] pt-4">
                <div className="p-4 rounded-[12px] bg-[#FAF9F7] border border-[#E5E0DA] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#24211E]">Rohan Deshmukh • Mumbai</span>
                    <Badge variant="ar" size="sm">AR Sizing Confirmed</Badge>
                  </div>
                  <p className="text-xs text-[#6F6A64]">
                    "Used the AR feature on my iPhone before placing the order. It fit our apartment nook precisely as rendered. The linen fabric feels exceptionally luxurious."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="space-y-3 text-xs sm:text-sm text-[#6F6A64] max-w-2xl">
              <h4 className="font-serif text-lg font-semibold text-[#24211E]">Complimentary White-Glove In-Home Service</h4>
              <p className="leading-relaxed">
                Our logistics specialists schedule a 2-hour delivery window. Two uniformed technicians will carry the furniture into your room of choice, assemble any legs or modular attachments, and remove all packaging materials for eco-friendly recycling.
              </p>
            </div>
          )}
        </section>

        {/* 5. Related Products Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
            <h3 className="font-serif text-2xl font-semibold text-[#24211E]">
              Complementary Living Pieces
            </h3>
            <Link href="/products" className="text-xs text-[#8B5E3C] hover:underline font-medium">
              View All Curations →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onViewInRoom={(p) => {
                  setProduct(p);
                  setSelectedVariant(p.variants[0]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onAddToCart={(p) => handleAddToCart(p)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* 6. Global Footer */}
      <Footer />

      {/* Interactive AR Preview Modal */}
      <ARPreviewModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
        product={product}
        onAddToCart={handleAddToCart}
      />

      {/* Interactive Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id, delta) => {
          setCartItems((prev) =>
            prev
              .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + delta } : i))
              .filter((i) => i.quantity > 0)
          );
        }}
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((i) => i.product.id !== id))}
        onOpenARPreview={(p) => {
          setProduct(p);
          setSelectedVariant(p.variants[0] || null);
          setIsARModalOpen(true);
        }}
      />
    </div>
  );
}
