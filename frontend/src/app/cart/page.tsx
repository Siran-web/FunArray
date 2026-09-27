'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowRight, Trash2, Box, ShieldCheck, Truck, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCart();

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar cartCount={0} />
        
        <div className="flex-1 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/30 flex items-center justify-center text-[#8B5E3C] mb-6 shadow-sm">
            <ShoppingBag className="w-9 h-9" />
          </div>
          <h1 className="font-serif text-3xl font-medium text-[#24211E]">Your Cart is Empty</h1>
          <p className="text-sm text-[#6F6A64] mt-2 mb-8 max-w-sm">
            Discover architectural solid wood collections and preview them in your space before adding to cart.
          </p>
          <Link href="/products">
            <Button variant="primary" size="lg" className="shadow-md">
              <span>Explore Furniture Catalog</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar cartCount={totalItemsCount} />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar py-6 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 pb-4 border-b border-[#E5E0DA]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
                Your Selection ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E] mt-0.5">
                Shopping Cart
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/products" className="text-xs font-medium text-[#8B5E3C] hover:text-[#634027] flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Browsing</span>
              </Link>
              <span className="text-[#E5E0DA]">|</span>
              <button
                onClick={clearCart}
                className="text-xs font-medium text-[#C84B4B] hover:text-[#a83c3c] cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Cart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E5E0DA] rounded-[16px] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-[12px] bg-[#F4F2EF] overflow-hidden shrink-0 border border-[#E5E0DA]/50">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#9B958E]">
                          Furniture
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="font-serif text-lg font-medium text-[#24211E] truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#6F6A64]">
                        Unit Price: <span className="font-semibold text-[#24211E]">{formatPrice(item.price)}</span>
                      </p>
                      <Link
                        href={`/visualize/${item.productId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B5E3C] hover:text-[#634027] pt-1"
                      >
                        <Box className="w-3.5 h-3.5 text-[#D49A6A]" />
                        <span>Preview in 3D / AR Room</span>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E0DA]">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-[#E5E0DA] rounded-[10px] bg-[#FAF9F7] px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 text-[#6F6A64] hover:text-[#24211E] transition cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-[#24211E]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-[#6F6A64] hover:text-[#24211E] transition cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal for line */}
                    <div className="text-right min-w-[90px]">
                      <p className="text-base font-semibold text-[#24211E]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-[#9B958E] hover:text-[#C84B4B] transition rounded-[8px] hover:bg-[#F4F2EF] cursor-pointer"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* White-Glove Guarantee Badge */}
              <div className="p-4 rounded-[12px] bg-[#F3E8DE]/60 border border-[#8B5E3C]/20 flex items-center gap-3 text-xs text-[#6F6A64]">
                <Truck className="w-5 h-5 text-[#8B5E3C] shrink-0" />
                <span>
                  <strong className="text-[#24211E]">Complimentary In-Room Delivery & Setup</strong> included on all solid hardwood orders.
                </span>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
                <h2 className="font-serif text-xl font-medium text-[#24211E] pb-3 border-b border-[#E5E0DA]">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-[#6F6A64]">
                    <span>Items Subtotal</span>
                    <span className="font-medium text-[#24211E]">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6F6A64]">
                    <span>White-Glove Shipping</span>
                    <span className="font-medium text-[#2F7D50]">FREE</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6F6A64]">
                    <span>Estimated Tax</span>
                    <span className="text-xs text-[#9B958E]">Calculated at checkout</span>
                  </div>

                  <div className="pt-4 border-t border-[#E5E0DA] flex items-baseline justify-between">
                    <div>
                      <p className="text-base font-semibold text-[#24211E]">Estimated Total</p>
                      <p className="text-[11px] text-[#9B958E]">Inclusive of all luxury freight</p>
                    </div>
                    <p className="text-2xl font-serif font-bold text-[#8B5E3C]">
                      {formatPrice(totalAmount)}
                    </p>
                  </div>
                </div>

                <Link href="/checkout" className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full text-sm font-semibold tracking-wide shadow-md"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#9B958E]">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D50]" />
                  <span>Secure SSL Checkout & Authoritative Pricing</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
