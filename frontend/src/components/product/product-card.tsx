"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Heart, Star, Box, Check, ShoppingBag } from "lucide-react";

export interface ProductCardProps {
  product: Product;
  onViewInRoom?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  priorityImage?: boolean;
}

export function ProductCard({
  product,
  onViewInRoom,
  onAddToCart,
  priorityImage = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);

  const primaryImage =
    product.images.find((img) => img.isPrimary)?.imageUrl ||
    product.images[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";

  const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleViewInRoom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewInRoom) onViewInRoom(product);
  };

  return (
    <div className="group bg-white rounded-[12px] border border-[#E5E0DA] shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Product Image & Badges Container */}
      <div className="relative aspect-[4/3] bg-[#F4F2EF] overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading={priorityImage ? "eager" : "lazy"}
          />
        </Link>

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.arSupported && (
            <Badge variant="ar" size="sm" className="shadow-xs backdrop-blur-xs">
              <Box className="w-3 h-3 text-[#8B5E3C]" />
              AR Ready
            </Badge>
          )}
          {totalStock <= 3 && totalStock > 0 && (
            <Badge variant="low-stock" size="sm" className="bg-white/90">
              Only {totalStock} left
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#6F6A64] hover:text-[#C84B4B] shadow-sm hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-[#C84B4B] text-[#C84B4B]" : ""
            }`}
          />
        </button>

        {/* Dimension pill on hover */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="px-2 py-1 bg-[#24211E]/80 backdrop-blur-xs text-white text-[11px] rounded-md font-mono">
            {product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm
          </span>
        </div>
      </div>

      {/* Content & Information Hierarchy */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-[#6F6A64]">
            <span className="font-medium tracking-wide uppercase text-[11px] text-[#8B5E3C]">
              {product.categoryName || "Living"}
            </span>
            <div className="flex items-center gap-1 font-medium text-[#24211E]">
              <Star className="w-3.5 h-3.5 fill-[#C78A24] text-[#C78A24]" />
              <span>{product.rating}</span>
              <span className="text-[#9B958E]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`} className="block group-hover:text-[#8B5E3C] transition-colors">
            <h3 className="font-serif text-lg font-medium text-[#24211E] leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Pricing & Availability */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-xl font-semibold text-[#24211E]">
                {formatPrice(product.basePrice)}
              </p>
              <p className="text-[11px] font-medium text-[#2F7D50] flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3 text-[#2F7D50]" /> In stock (Delhi Showroom & Online)
              </p>
            </div>

            {/* Quick Add to Cart icon */}
            <button
              onClick={handleAddToCart}
              title="Add to cart"
              className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
                isAdded
                  ? "bg-[#2F7D50] text-white"
                  : "bg-[#F4F2EF] text-[#24211E] hover:bg-[#8B5E3C] hover:text-white"
              }`}
            >
              {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Prominent AR CTA Button (Section 11 requirement) */}
        <div className="pt-2 border-t border-[#E5E0DA]/60">
          <Button
            variant="ar"
            size="md"
            className="w-full text-xs font-semibold py-2.5 h-10 tracking-wide"
            onClick={handleViewInRoom}
          >
            <Box className="w-4 h-4 text-[#D49A6A]" />
            View in Your Room
          </Button>
        </div>
      </div>
    </div>
  );
}
