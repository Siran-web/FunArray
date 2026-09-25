"use client";

import * as React from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Box
} from "lucide-react";

export interface CartItemEntry {
  product: Product;
  quantity: number;
  selectedColor: string;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemEntry[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onOpenARPreview: (product: Product) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onOpenARPreview,
}: CartDrawerProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.basePrice * item.quantity,
    0
  );
  const whiteGloveDelivery = subtotal >= 50000 ? 0 : 2500;
  const total = subtotal + whiteGloveDelivery;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E5E0DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#E5E0DA] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#8B5E3C]" />
              <h3 className="font-serif text-xl font-semibold text-[#24211E]">
                Shopping Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-[8px] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body: Cart Items List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F4F2EF] text-[#9B958E] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-medium text-[#24211E]">Your bag is empty</h4>
                <p className="text-xs text-[#6F6A64]">
                  Explore our curated collections and add pieces to your space.
                </p>
                <Button variant="primary" size="sm" onClick={onClose} className="mt-2">
                  Browse Catalog
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 rounded-[12px] border border-[#E5E0DA] bg-[#FAF9F7] flex gap-3.5"
                >
                  <img
                    src={item.product.images[0]?.imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-[8px] border border-[#E5E0DA] shrink-0"
                  />
                  <div className="flex flex-col justify-between flex-1">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-sm font-semibold text-[#24211E] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[#9B958E] hover:text-[#C84B4B] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#6F6A64]">Finish: {item.selectedColor}</p>
                      <p className="text-xs font-semibold text-[#24211E]">
                        {formatPrice(item.product.basePrice)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-[#E5E0DA] rounded-[8px] bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="px-2 py-1 text-[#6F6A64] hover:text-[#24211E] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#24211E]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="px-2 py-1 text-[#6F6A64] hover:text-[#24211E] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* AR Check button */}
                      <button
                        onClick={() => {
                          onClose();
                          onOpenARPreview(item.product);
                        }}
                        className="text-[11px] font-semibold text-[#8B5E3C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5 text-[#D49A6A]" /> Test AR
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Stepper */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#E5E0DA] bg-white space-y-4">
              <div className="space-y-1.5 text-xs text-[#6F6A64]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#24211E]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#8B5E3C]" /> White-Glove In-Home Delivery
                  </span>
                  <span>{whiteGloveDelivery === 0 ? <strong className="text-[#2F7D50]">FREE</strong> : formatPrice(whiteGloveDelivery)}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E0DA] flex justify-between text-sm font-bold text-[#24211E]">
                  <span>Total (Incl. all taxes)</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-[#8B5E3C] hover:bg-[#634027] text-white"
                onClick={() => alert("Multi-step Checkout Funnel will be fully connected in Phase 4.")}
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-[#9B958E]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D50]" /> 100-Night Sizing Guarantee
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
