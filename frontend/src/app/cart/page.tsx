'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mb-4">
          🛒
        </div>
        <h1 className="text-xl font-bold text-white">Your Cart is Empty</h1>
        <p className="text-xs text-stone-400 mt-2 mb-6">Discover handcrafted furniture items and add them to your cart</p>
        <Link
          href="/products"
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold hover:from-amber-500 hover:to-amber-600 transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <button onClick={clearCart} className="text-xs text-rose-400 hover:text-rose-300">
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-stone-900 border border-stone-800 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-stone-800 rounded-xl overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-stone-500">No Image</span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm text-stone-200">{item.name}</h3>
                <p className="text-xs text-amber-500 mt-1">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-stone-800 rounded-lg px-2 py-1">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="text-stone-400 hover:text-white px-1"
                >
                  -
                </button>
                <span className="text-xs font-medium px-2">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="text-stone-400 hover:text-white px-1"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-stone-500 hover:text-rose-400 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-stone-400">Total Calculated Amount</span>
          <p className="text-2xl font-bold text-amber-400 mt-0.5">₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <Link
          href="/checkout"
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:from-amber-500 hover:to-amber-600 transition shadow-lg"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
