"use client";

import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Box,
  ArrowRight,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const addItemToCart = useCartStore((state) => state.addItem);

  const [notification, setNotification] = React.useState<string | null>(null);

  const handleMoveToCart = (item: typeof items[0]) => {
    addItemToCart({
      id: `${item.id}-default`,
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      selectedColor: "Standard Finish",
      dimensions: item.dimensions ? {
        widthCm: item.dimensions.widthCm,
        heightCm: item.dimensions.heightCm,
        depthCm: item.dimensions.depthCm,
      } : undefined,
    });
    removeItem(item.id);
    setNotification(`Moved "${item.name}" to your shopping bag!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    setNotification(`Removed "${name}" from wishlist.`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-[#E5E0DA] py-3.5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between text-xs text-[#6F6A64]">
          <nav className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#8B5E3C]">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <Link href="/products" className="hover:text-[#8B5E3C]">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9B958E]" />
            <span className="text-[#24211E] font-medium">My Wishlist</span>
          </nav>
          <span className="text-[#8B5E3C] font-semibold">{items.length} {items.length === 1 ? 'Curated Item' : 'Curated Items'}</span>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 flex-1 w-full space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E0DA] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8B5E3C] font-semibold mb-1">
              <Heart className="w-4 h-4 fill-[#8B5E3C]" />
              <span>Saved Architectural Curations</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              My Wishlist
            </h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWishlist}
                className="text-xs text-[#6F6A64] hover:text-[#C84B4B] hover:bg-rose-50"
              >
                Clear All
              </Button>
              <Link href="/products">
                <Button variant="outline" size="sm" className="text-xs border-[#E5E0DA]">
                  Continue Exploring
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="p-4 bg-[#2F7D50]/10 border border-[#2F7D50]/30 rounded-[12px] text-[#2F7D50] text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
            <Link href="/cart" className="underline hover:opacity-80">
              View Bag →
            </Link>
          </div>
        )}

        {/* Content Section */}
        {items.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[20px] border border-[#E5E0DA] shadow-card p-8 space-y-5 max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mx-auto shadow-inner">
              <Heart className="w-10 h-10 text-[#8B5E3C]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#24211E]">Your Wishlist is Empty</h2>
              <p className="text-xs sm:text-sm text-[#6F6A64] leading-relaxed">
                Save pieces you love while browsing our luxury architectural catalog, compare specifications, and preview them directly in your room via AR.
              </p>
            </div>
            <Link href="/products">
              <Button variant="primary" size="lg" className="mt-2 text-xs font-semibold gap-2 bg-[#8B5E3C] hover:bg-[#634027]">
                <span>Discover Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-[16px] border border-[#E5E0DA] shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
              >
                {/* Image & Quick Badges */}
                <div className="relative aspect-[4/3] bg-[#F4F2EF] overflow-hidden">
                  <Link href={`/products/${item.slug || item.id}`} className="block w-full h-full">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </Link>

                  {/* AR Badge */}
                  {item.arSupported !== false && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <Badge variant="ar" size="sm" className="shadow-xs backdrop-blur-xs">
                        <Box className="w-3 h-3 text-[#8B5E3C]" />
                        AR Ready
                      </Badge>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    title="Remove from wishlist"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#6F6A64] hover:text-[#C84B4B] shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Information */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B5E3C]">
                      {item.categoryName || "Architectural Curation"}
                    </span>
                    <Link href={`/products/${item.slug || item.id}`}>
                      <h3 className="font-serif text-base font-medium text-[#24211E] line-clamp-1 hover:text-[#8B5E3C] transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-lg font-semibold text-[#24211E] pt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Actions: Move to Bag */}
                  <div className="space-y-2 pt-2 border-t border-[#E5E0DA]/70">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMoveToCart(item)}
                      className="w-full text-xs font-semibold gap-1.5 bg-[#8B5E3C] hover:bg-[#634027]"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
