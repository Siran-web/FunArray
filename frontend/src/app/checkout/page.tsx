'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';

export default function CheckoutPage() {
  const { items, totalAmount } = useCart();
  const [selectedAddress, setSelectedAddress] = useState('addr-1');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isOrdered, setIsOrdered] = useState(false);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrdered(true);
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 text-2xl mb-4">
          ✓
        </div>
        <h1 className="text-xl font-bold text-white">Order Confirmed!</h1>
        <p className="text-xs text-stone-400 mt-2 mb-6">Your order is being processed. You can review its status in your order history.</p>
        <Link
          href="/orders"
          className="px-6 py-2.5 rounded-full bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 pb-4 border-b border-stone-800">Secure Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address Selection */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
              1. Shipping Address
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-stone-800/60 border border-stone-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="address"
                  value="addr-1"
                  checked={selectedAddress === 'addr-1'}
                  onChange={() => setSelectedAddress('addr-1')}
                  className="mt-1"
                />
                <div>
                  <span className="text-xs font-bold text-white">Primary Residence (Default)</span>
                  <p className="text-xs text-stone-400 mt-0.5">Plot 42, Green Avenue, Model Town, Jalandhar, Punjab - 144003</p>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
              2. Payment Method
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-stone-800/60 border border-stone-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                />
                <span className="text-xs text-stone-200">Credit / Debit Card (Secure Gateway)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-stone-800/60 border border-stone-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                />
                <span className="text-xs text-stone-200">Instant UPI (GPay / PhonePe / Paytm)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl h-fit">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Order Summary
          </h2>
          <div className="space-y-2 text-xs text-stone-400 pb-4 border-b border-stone-800">
            <div className="flex justify-between">
              <span>Items Total ({items.length})</span>
              <span className="text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>White Glove Delivery</span>
              <span className="text-emerald-400">Free</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-bold text-white py-4">
            <span>Total</span>
            <span className="text-amber-400">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold hover:from-amber-500 hover:to-amber-600 transition shadow-lg mt-2"
          >
            Confirm & Pay
          </button>
        </div>
      </form>
    </div>
  );
}
