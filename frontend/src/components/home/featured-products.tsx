"use client";

import * as React from "react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export interface FeaturedProductsProps {
  products: Product[];
  onViewInRoom: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function FeaturedProducts({
  products,
  onViewInRoom,
  onAddToCart,
}: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const tabs = [
    { id: "all", label: "All Curations" },
    { id: "cat-1", label: "Living Room" },
    { id: "cat-2", label: "Dining" },
    { id: "cat-3", label: "Bedroom" },
  ];

  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((p) => p.categoryId === activeTab);

  return (
    <section id="products" className="w-full py-12 sm:py-16 bg-[#FAF9F7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Section Header & Interactive Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E0DA] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
              <Sparkles className="w-3.5 h-3.5 text-[#D49A6A]" />
              <span>Handcrafted Essentials</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
              Featured Furnishings
            </h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#24211E] text-white shadow-xs"
                    : "bg-white text-[#6F6A64] border border-[#E5E0DA] hover:border-[#8B5E3C] hover:text-[#24211E]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewInRoom={onViewInRoom}
              onAddToCart={onAddToCart}
              priorityImage={idx < 3}
            />
          ))}
        </div>

        {/* Bottom Catalog CTA */}
        <div className="pt-6 text-center">
          <Button
            variant="outline"
            size="lg"
            className="border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#F3E8DE] px-8"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span>Explore All 210+ Catalog Pieces</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
