'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { orderApi } from '../../services/orderApi';
import { addressApi } from '../../services/addressApi';
import { Address } from '../../types/address';
import { Order, CheckoutPreview } from '../../types/order';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('CARD');
  const [notes, setNotes] = useState('');

  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load addresses
  useEffect(() => {
    async function loadData() {
      try {
        const addrRes = await addressApi.getAddresses();
        if (addrRes && Array.isArray(addrRes)) {
          setAddresses(addrRes);
          const defaultAddr = addrRes.find((a) => a.isDefault) || addrRes[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch addresses:', err);
      }
    }
    loadData();
  }, []);

  // Fetch server-authoritative checkout preview whenever address or coupon changes
  useEffect(() => {
    async function fetchPreview() {
      setIsLoadingPreview(true);
      setErrorMessage(null);
      try {
        const prev = await orderApi.previewCheckout(selectedAddressId, appliedCoupon);
        setPreview(prev);
      } catch (err: any) {
        console.warn('Checkout preview error:', err);
        setErrorMessage(err?.message || 'Failed to calculate checkout totals.');
      } finally {
        setIsLoadingPreview(false);
      }
    }

    if (items.length > 0) {
      fetchPreview();
    } else {
      setIsLoadingPreview(false);
    }
  }, [items.length, selectedAddressId, appliedCoupon]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setAppliedCoupon(couponCode.trim().toUpperCase());
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await addressApi.createAddress({
        ...newAddress,
        isDefault: addresses.length === 0,
      });
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowNewAddressModal(false);
      setNewAddress({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a valid shipping address before placing your order.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await orderApi.checkout({
        shippingAddressId: selectedAddressId,
        paymentMethod,
        notes,
        couponCode: appliedCoupon || undefined,
      });

      clearCart();
      setCompletedOrder(order);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setErrorMessage(err?.message || 'Checkout failed. Please check your inventory or address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Order Confirmed Screen
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="w-20 h-20 rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 text-3xl mx-auto mb-6 shadow-inner">
            ✓
          </div>
          
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Payment & Order Verified</span>
          <h1 className="text-3xl font-serif font-bold text-white mt-2 mb-2">Thank You for Your Order!</h1>
          <p className="text-xs text-stone-400 mb-6">
            Order <span className="text-amber-400 font-mono font-medium">#{completedOrder.orderNumber}</span> has been confirmed and scheduled for white-glove artisan dispatch.
          </p>

          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4 mb-6 text-left text-xs space-y-2">
            <div className="flex justify-between text-stone-400">
              <span>Order Number:</span>
              <span className="text-stone-200 font-mono">{completedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-semibold">{completedOrder.status}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Total Paid:</span>
              <span className="text-amber-400 font-bold text-sm">${completedOrder.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-md"
            >
              Track Order in History
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition border border-stone-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mb-4 text-2xl">
          🛒
        </div>
        <h1 className="text-2xl font-serif font-bold text-white">Your Cart is Empty</h1>
        <p className="text-xs text-stone-400 mt-2 mb-6">Add artisan furniture to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-500 font-medium">Step 2 of 2</span>
            <h1 className="text-3xl font-serif font-bold text-white mt-1">Secure Checkout</h1>
          </div>
          <Link href="/cart" className="text-xs text-stone-400 hover:text-amber-400 transition flex items-center gap-1">
            ← Return to Cart
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Shipping Address */}
            <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
                  Shipping Address
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  + Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="p-6 border border-dashed border-stone-700 rounded-2xl text-center space-y-3">
                  <p className="text-xs text-stone-400">No saved shipping addresses found.</p>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                  >
                    Enter Shipping Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                        selectedAddressId === addr.id
                          ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                          : 'bg-stone-800/40 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-amber-500"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {addr.addressLine1}
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">Default</span>
                          )}
                        </div>
                        {addr.addressLine2 && <p className="text-stone-400 mt-0.5">{addr.addressLine2}</p>}
                        <p className="text-stone-400 mt-0.5">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-stone-500 text-[11px] mt-0.5">{addr.country}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Payment Method */}
            <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'CARD' ? 'bg-amber-950/20 border-amber-500/60' : 'bg-stone-800/40 border-stone-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Credit / Debit Card (Stripe 256-bit SSL)</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">Visa, Mastercard, Amex, Discover accepted</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'UPI' ? 'bg-amber-950/20 border-amber-500/60' : 'bg-stone-800/40 border-stone-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">Instant UPI / QR Code</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Delivery Instructions & Notes */}
            <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
                Special Instructions (Optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Call before delivery, gated community code #1234, deliver to 2nd floor..."
                rows={3}
                className="w-full bg-stone-950/80 border border-stone-800 rounded-2xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Right Column: Server-Authoritative Totals Breakdown */}
          <div className="space-y-6">
            <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl shadow-xl space-y-5">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                Order Summary
              </h2>

              {/* Items List Preview */}
              <div className="max-h-48 overflow-y-auto space-y-3 pr-1 divide-y divide-stone-800/60">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-800 overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-500">🛋️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-stone-200 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-stone-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium text-stone-200">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="pt-3 border-t border-stone-800">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code (e.g. WELCOME10)"
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition border border-stone-700"
                  >
                    Apply
                  </button>
                </form>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between text-xs text-emerald-400">
                    <span>Coupon applied: <strong>{appliedCoupon}</strong></span>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(''); setCouponCode(''); }}
                      className="text-stone-500 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2.5 text-xs text-stone-400 pt-3 border-t border-stone-800">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">${preview ? preview.subtotal?.toFixed(2) : '0.00'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Shipping & Handling</span>
                  {preview?.shippingFee === 0 ? (
                    <span className="text-emerald-400 font-semibold">FREE (Order &ge; $500)</span>
                  ) : (
                    <span className="text-white">${preview?.shippingFee?.toFixed(2) || '29.99'}</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="text-white">${preview ? preview.tax?.toFixed(2) : '0.00'}</span>
                </div>

                {preview && preview.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-${preview.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-4 border-t border-stone-800">
                <span className="text-sm font-semibold text-stone-300">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold font-serif text-amber-400">
                    ${preview ? preview.totalAmount?.toFixed(2) : '0.00'}
                  </span>
                  <p className="text-[10px] text-stone-500">Calculated Authoritatively Server-Side</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoadingPreview}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    Reserving Inventory & Placing Order...
                  </>
                ) : (
                  'Confirm & Place Order'
                )}
              </button>

              <p className="text-[10px] text-center text-stone-500">
                🔒 256-bit Encrypted Transaction &middot; 30-Day In-Home Guarantee
              </p>
            </div>
          </div>
        </form>

        {/* Modal: New Address */}
        {showNewAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-stone-800">
                <h3 className="font-semibold text-white text-sm">Add New Shipping Address</h3>
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    placeholder="123 Artisan Boulevard"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Apt, Suite, Unit (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    placeholder="Apt 4B"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Seattle"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="WA"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="98101"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(false)}
                    className="flex-1 py-2.5 bg-stone-800 text-stone-300 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
