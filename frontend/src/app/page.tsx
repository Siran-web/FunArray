"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedProducts } from "@/components/home/featured-products";
import { ARExperienceBanner } from "@/components/home/ar-experience-banner";
import { OmnichannelSection } from "@/components/home/omnichannel-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { Footer } from "@/components/layout/footer";
import { ARPreviewModal } from "@/components/ar/ar-preview-modal";
import { CartDrawer, CartItemEntry } from "@/components/commerce/cart-drawer";
import { CATEGORIES, FEATURED_PRODUCTS } from "@/data/mock-products";
import { Product } from "@/types/product";

export default function HomePage() {
  // Modal & Drawer State
  const [selectedProductForAR, setSelectedProductForAR] = React.useState<Product | null>(null);
  const [isARModalOpen, setIsARModalOpen] = React.useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);

  // Cart State (Pre-populated with 2 items to demonstrate immediate rich UI)
  const [cartItems, setCartItems] = React.useState<CartItemEntry[]>([
    {
      product: FEATURED_PRODUCTS[0], // Kanso 3-Seater Sofa
      quantity: 1,
      selectedColor: "Oatmeal Linen",
    },
    {
      product: FEATURED_PRODUCTS[1], // Neva Sculptural Lounge Chair
      quantity: 1,
      selectedColor: "Cognac Brown",
    },
  ]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Open AR Modal for a specific product
  const handleOpenARForProduct = (product: Product) => {
    setSelectedProductForAR(product);
    setIsARModalOpen(true);
  };

  // Open default AR Modal (from hero/navbar)
  const handleOpenDefaultAR = () => {
    setSelectedProductForAR(FEATURED_PRODUCTS[0]);
    setIsARModalOpen(true);
  };

  // Add product to cart
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

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItemEntry => item !== null)
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleScrollToProducts = () => {
    const section = document.getElementById("products");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans selection:bg-[#F3E8DE] selection:text-[#8B5E3C]">
      {/* 1. Navbar */}
      <Navbar
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onOpenARPreview={handleOpenDefaultAR}
        cartCount={totalCartCount}
        wishlistCount={2}
      />

      {/* 2. Hero Section */}
      <HeroSection
        onOpenAR={handleOpenDefaultAR}
        onExploreCollection={handleScrollToProducts}
      />

      {/* 3. Furniture Categories Grid */}
      <CategoryGrid categories={CATEGORIES} />

      {/* 4. Featured Products (Section 11 Product Cards) */}
      <FeaturedProducts
        products={FEATURED_PRODUCTS}
        onViewInRoom={handleOpenARForProduct}
        onAddToCart={handleAddToCart}
      />

      {/* 5. AR Room Visualization Spotlight Banner */}
      <ARExperienceBanner onOpenARModal={handleOpenDefaultAR} />

      {/* 6. Omnichannel Physical Showroom Network */}
      <OmnichannelSection />

      {/* 7. Testimonials & Verified AR Fit Metrics */}
      <TestimonialsSection />

      {/* 8. Comprehensive Footer */}
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
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOpenARPreview={handleOpenARForProduct}
      />
    </div>
  );
}
