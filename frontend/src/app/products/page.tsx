"use client";

import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { ARPreviewModal } from "@/components/ar/ar-preview-modal";
import { CartDrawer, CartItemEntry } from "@/components/commerce/cart-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { getProducts, getCategories } from "@/services/productApi";
import { FEATURED_PRODUCTS, CATEGORIES, CategoryItem } from "@/data/mock-products";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Box,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export default function ProductListingPage() {
  const [products, setProducts] = React.useState<Product[]>(FEATURED_PRODUCTS);
  const [categoriesList, setCategoriesList] = React.useState<CategoryItem[]>(CATEGORIES);
  const [isLoading, setIsLoading] = React.useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(FEATURED_PRODUCTS.length);

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [priceRange, setPriceRange] = React.useState<string>("all");
  const [arOnly, setArOnly] = React.useState(false);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"featured" | "price_asc" | "price_desc" | "rating" | "newest">("featured");

  // Mobile Filter Drawer
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Modals & Cart Drawer State
  const [selectedProductForAR, setSelectedProductForAR] = React.useState<Product | null>(null);
  const [isARModalOpen, setIsARModalOpen] = React.useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<CartItemEntry[]>([
    {
      product: FEATURED_PRODUCTS[0],
      quantity: 1,
      selectedColor: "Oatmeal Linen",
    },
  ]);

  // Fetch dynamic categories on mount
  React.useEffect(() => {
    getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    });
  }, []);

  // Execute filtering & search
  React.useEffect(() => {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (priceRange === "under-30k") maxPrice = 30000;
    else if (priceRange === "30k-50k") { minPrice = 30000; maxPrice = 50000; }
    else if (priceRange === "50k-70k") { minPrice = 50000; maxPrice = 70000; }
    else if (priceRange === "above-70k") minPrice = 70000;

    setIsLoading(true);
    getProducts({
      page: currentPage,
      size: 12,
      category: selectedCategory,
      minPrice,
      maxPrice,
      q: searchQuery,
      sortBy,
    }).then((res) => {
      let items = res.content;
      if (arOnly) items = items.filter((p) => p.arSupported);
      if (inStockOnly) items = items.filter((p) => p.availableOnline);
      setProducts(items);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || items.length);
      setIsLoading(false);
    });
  }, [selectedCategory, priceRange, searchQuery, sortBy, arOnly, inStockOnly, currentPage]);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setPriceRange("all");
    setSearchQuery("");
    setArOnly(false);
    setInStockOnly(false);
    setSortBy("featured");
    setCurrentPage(0);
  };

  const handleOpenAR = (product: Product) => {
    setSelectedProductForAR(product);
    setIsARModalOpen(true);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedColor: product.variants[0]?.color || "Standard Finish",
        },
      ];
    });
    setIsCartDrawerOpen(true);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      {/* 1. Global Navigation */}
      <Navbar
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onOpenARPreview={() => handleOpenAR(FEATURED_PRODUCTS[0])}
        cartCount={totalCartCount}
        wishlistCount={2}
      />

      {/* 2. Breadcrumb & Header */}
      <section className="bg-white border-b border-[#E5E0DA] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-4">
          <nav className="flex items-center gap-2 text-xs text-[#6F6A64]">
            <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <span className="text-[#24211E] font-medium">Furniture Catalog</span>
            {selectedCategory !== "all" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
                <span className="text-[#8B5E3C] font-semibold capitalize">
                  {selectedCategory.replace("-", " ")}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
                Architectural Furniture Catalog
              </h1>
              <p className="text-xs sm:text-sm text-[#6F6A64]">
                Showing {products.length} of {totalElements} {totalElements === 1 ? "piece" : "pieces"} • True-scale 3D models available for in-room preview.
              </p>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFilterOpen(true)}
                className="gap-2 text-xs"
              >
                <Filter className="w-4 h-4 text-[#8B5E3C]" />
                <span>Filters & Search</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Catalog Section (Faceted Sidebar + Grid) */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-28 bg-white p-6 rounded-[16px] border border-[#E5E0DA] shadow-card">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#24211E]">Filter & Refine</h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#8B5E3C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6F6A64]">
                Search Catalog
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sofa, walnut table, teak, SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full h-10 px-3 pr-8 text-xs bg-[#FAF9F7] text-[#24211E] rounded-[8px] border border-[#E5E0DA] focus:border-[#8B5E3C] outline-none"
                />
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(0);
                    }}
                    className="absolute right-2.5 top-2.5 text-[#9B958E] hover:text-[#24211E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-[#9B958E] absolute right-2.5 top-3 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Living Space Categories */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6F6A64]">
                Living Space / Category
              </label>
              <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setCurrentPage(0);
                  }}
                  className={`w-full text-left py-1.5 px-2.5 rounded-[8px] transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === "all"
                      ? "bg-[#F3E8DE] text-[#8B5E3C] font-semibold"
                      : "text-[#6F6A64] hover:bg-[#F4F2EF] hover:text-[#24211E]"
                  }`}
                >
                  <span>All Collections</span>
                  <span className="text-[11px] text-[#9B958E]">{totalElements}</span>
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => {
                      setSelectedCategory(cat.slug || cat.id);
                      setCurrentPage(0);
                    }}
                    className={`w-full text-left py-1.5 px-2.5 rounded-[8px] transition-colors cursor-pointer flex items-center justify-between ${
                      selectedCategory === (cat.slug || cat.id)
                        ? "bg-[#F3E8DE] text-[#8B5E3C] font-semibold"
                        : "text-[#6F6A64] hover:bg-[#F4F2EF] hover:text-[#24211E]"
                    }`}
                  >
                    <span className="line-clamp-1">{cat.name}</span>
                    <span className="text-[11px] text-[#9B958E]">{cat.itemCount || 4}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6F6A64]">
                Price Tier
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: "all", label: "All Prices" },
                  { id: "under-30k", label: "Under ₹30,000" },
                  { id: "30k-50k", label: "₹30,000 – ₹50,000" },
                  { id: "50k-70k", label: "₹50,000 – ₹70,000" },
                  { id: "above-70k", label: "Above ₹70,000" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setPriceRange(tier.id);
                      setCurrentPage(0);
                    }}
                    className={`w-full text-left py-1.5 px-2.5 rounded-[8px] transition-colors cursor-pointer flex items-center justify-between ${
                      priceRange === tier.id
                        ? "bg-[#F3E8DE] text-[#8B5E3C] font-semibold"
                        : "text-[#6F6A64] hover:bg-[#F4F2EF] hover:text-[#24211E]"
                    }`}
                  >
                    <span>{tier.label}</span>
                    {priceRange === tier.id && <Check className="w-3.5 h-3.5 text-[#8B5E3C]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Capabilities Toggles */}
            <div className="space-y-3 pt-2 border-t border-[#E5E0DA]">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6F6A64]">
                Preferences
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[#24211E] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={arOnly}
                    onChange={(e) => {
                      setArOnly(e.target.checked);
                      setCurrentPage(0);
                    }}
                    className="rounded border-[#E5E0DA] text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span className="flex items-center gap-1 font-medium">
                    <Box className="w-3.5 h-3.5 text-[#8B5E3C]" />
                    3D / AR Room Fitting Only
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#24211E] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setCurrentPage(0);
                    }}
                    className="rounded border-[#E5E0DA] text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span>In-Stock for Immediate Dispatch</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Area (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Top Toolbar (Sort + Active Filter Chips) */}
            <div className="p-4 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Active Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#9B958E]">Active:</span>
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8DE] text-[#8B5E3C] font-medium">
                    Category: {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                  </span>
                )}
                {priceRange !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8DE] text-[#8B5E3C] font-medium">
                    Price: {priceRange}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange("all")} />
                  </span>
                )}
                {arOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8DE] text-[#8B5E3C] font-medium">
                    AR Supported
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setArOnly(false)} />
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8DE] text-[#8B5E3C] font-medium">
                    Search: "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </span>
                )}
                {selectedCategory === "all" && priceRange === "all" && !arOnly && !searchQuery && (
                  <span className="text-[#6F6A64]">All Furnishings</span>
                )}
              </div>

              {/* Sorting Control */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#6F6A64]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(0);
                  }}
                  className="h-9 px-3 text-xs bg-[#FAF9F7] text-[#24211E] rounded-[8px] border border-[#E5E0DA] focus:border-[#8B5E3C] outline-none font-medium cursor-pointer"
                >
                  <option value="featured">Featured Curations</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="rating">Highest Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-3 border-[#8B5E3C] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-[#6F6A64]">Loading architectural furnishings...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[16px] border border-[#E5E0DA] p-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#F4F2EF] text-[#9B958E] flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#24211E]">No matching furniture found</h3>
                <p className="text-xs text-[#6F6A64] max-w-md mx-auto">
                  We couldn't find any pieces matching your current filters. Try relaxing your price or category selections.
                </p>
                <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewInRoom={handleOpenAR}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#E5E0DA]">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      className="gap-1 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <span className="text-xs text-[#6F6A64] px-3">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="gap-1 text-xs"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. Global Footer */}
      <Footer />

      {/* Interactive AR Preview Modal */}
      <ARPreviewModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
        product={selectedProductForAR}
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
        onOpenARPreview={handleOpenAR}
      />
    </div>
  );
}
