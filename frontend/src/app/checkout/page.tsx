'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { orderApi } from '../../services/orderApi';
import { addressApi } from '../../services/addressApi';
import { Address } from '../../types/address';
import { Order, CheckoutPreview } from '../../types/order';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import {
  MapPin,
  CreditCard,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Tag,
  Truck,
  AlertCircle
} from 'lucide-react';

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
    country: 'India',
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
        country: 'India',
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create shipping address.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a shipping address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server (authoritative pricing and inventory check)
      const order = await orderApi.checkout({
        shippingAddressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        notes: notes || undefined,
      });

      // 2. Clear customer cart on successful creation
      clearCart();
      setCompletedOrder(order);

      // 3. Navigate to order confirmation
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      console.error('Order creation failed:', err);
      setErrorMessage(err?.message || 'Could not complete checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white border border-[#E5E0DA] rounded-[20px] p-8 shadow-modal text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#2F7D50]/10 text-[#2F7D50] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-[#24211E]">Order Confirmed</h1>
            <p className="text-xs text-[#6F6A64]">
              Thank you for choosing FunArray. Your order <strong className="text-[#24211E]">#{completedOrder.orderNumber}</strong> has been received and sent to our white-glove fulfillment workshop.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link href={`/orders/${completedOrder.id}`}>
                <Button variant="primary" size="md" className="w-full">
                  View Order Status
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="md" className="w-full">
                  Return to Storefront
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar cartCount={0} />
        <div className="flex-1 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 flex items-center justify-center text-[#8B5E3C] mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#24211E]">Checkout is Empty</h1>
          <p className="text-xs text-[#6F6A64] mt-2 mb-6">You have no items ready for checkout.</p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Explore Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar py-6 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#E5E0DA] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
                Step 2 of 2 • Order Finalization
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E] mt-0.5">
                Secure Checkout
              </h1>
            </div>
            <Link href="/cart" className="text-xs font-medium text-[#8B5E3C] hover:text-[#634027] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Cart</span>
            </Link>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-[12px] bg-[#C84B4B]/10 border border-[#C84B4B]/30 text-[#C84B4B] text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-[#C84B4B] hover:opacity-75 cursor-pointer">✕</button>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Delivery Address & Payment Method */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 1. Shipping Address */}
              <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
                  <h2 className="font-serif text-lg font-medium text-[#24211E] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-xs font-sans font-bold">1</span>
                    Shipping & Delivery Address
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(true)}
                    className="text-xs text-[#8B5E3C] hover:text-[#634027] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E5E0DA] rounded-[12px] text-center space-y-3 bg-[#FAF9F7]">
                    <MapPin className="w-8 h-8 text-[#9B958E] mx-auto" />
                    <p className="text-xs text-[#6F6A64]">No saved shipping addresses found.</p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowNewAddressModal(true)}
                    >
                      Enter Shipping Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm'
                            : 'bg-white border-[#E5E0DA] hover:border-[#9B958E]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#8B5E3C]"
                        />
                        <div className="text-xs space-y-0.5 min-w-0">
                          <div className="font-semibold text-[#24211E] flex items-center gap-2">
                            <span>{addr.addressLine1}</span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F3E8DE] text-[#8B5E3C] font-bold">Default</span>
                            )}
                          </div>
                          {addr.addressLine2 && <p className="text-[#6F6A64]">{addr.addressLine2}</p>}
                          <p className="text-[#6F6A64]">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-[#9B958E] text-[11px]">{addr.country}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Payment Method */}
              <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-4">
                <div className="border-b border-[#E5E0DA] pb-3">
                  <h2 className="font-serif text-lg font-medium text-[#24211E] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-xs font-sans font-bold">2</span>
                    Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm'
                        : 'bg-white border-[#E5E0DA] hover:border-[#9B958E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      className="accent-[#8B5E3C]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#24211E]">Credit / Debit Card</p>
                      <p className="text-[10px] text-[#9B958E]">Visa, Mastercard, RuPay</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm'
                        : 'bg-white border-[#E5E0DA] hover:border-[#9B958E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="accent-[#8B5E3C]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#24211E]">Instant UPI / QR</p>
                      <p className="text-[10px] text-[#9B958E]">GPay, PhonePe, Paytm</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'NET_BANKING'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm'
                        : 'bg-white border-[#E5E0DA] hover:border-[#9B958E]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="NET_BANKING"
                      checked={paymentMethod === 'NET_BANKING'}
                      onChange={() => setPaymentMethod('NET_BANKING')}
                      className="accent-[#8B5E3C]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#24211E]">Net Banking</p>
                      <p className="text-[10px] text-[#9B958E]">All major Indian banks</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Delivery Instructions & Coupon */}
              <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    Delivery & Assembly Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Elevators available on 3rd floor, call before arrival"
                    className="w-full p-3 bg-white border border-[#E5E0DA] rounded-[10px] text-[#24211E] placeholder:text-[#9B958E] text-xs focus:outline-none focus:border-[#8B5E3C] focus:ring-3 focus:ring-[#F3E8DE] transition resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Authoritative Server Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
                <h2 className="font-serif text-xl font-medium text-[#24211E] pb-3 border-b border-[#E5E0DA]">
                  Review & Totals
                </h2>

                {/* Coupon Input */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    Promotional Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="TRYROOM2026"
                      className="flex-1 h-10 px-3 uppercase bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyCoupon}
                      className="h-10 text-xs px-3"
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-[#2F7D50] font-medium mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Coupon &apos;{appliedCoupon}&apos; active
                    </p>
                  )}
                </div>

                {/* Pricing Breakdown */}
                {isLoadingPreview ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#6F6A64]">Verifying inventory & calculating taxes...</p>
                  </div>
                ) : preview ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-[#6F6A64]">
                      <span>Subtotal ({preview.totalItems} items)</span>
                      <span className="font-medium text-[#24211E]">{formatPrice(preview.subtotal)}</span>
                    </div>

                    {preview.discount > 0 && (
                      <div className="flex items-center justify-between text-[#2F7D50]">
                        <span>Discount Applied</span>
                        <span className="font-medium">-{formatPrice(preview.discount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[#6F6A64]">
                      <span>In-Room White Glove Delivery</span>
                      <span className="font-medium text-[#2F7D50]">
                        {preview.shippingFee === 0 ? 'FREE' : formatPrice(preview.shippingFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6F6A64]">
                      <span>Taxes & GST (18%)</span>
                      <span className="font-medium text-[#24211E]">{formatPrice(preview.tax)}</span>
                    </div>

                    <div className="pt-4 border-t border-[#E5E0DA] flex items-baseline justify-between">
                      <div>
                        <p className="text-base font-semibold text-[#24211E]">Total Payable</p>
                        <p className="text-[11px] text-[#9B958E]">Inclusive of all charges</p>
                      </div>
                      <p className="text-2xl font-serif font-bold text-[#8B5E3C]">
                        {formatPrice(preview.totalAmount)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  disabled={!selectedAddressId || isLoadingPreview}
                  className="w-full text-sm font-semibold tracking-wide shadow-md"
                >
                  <span>Confirm & Pay Order</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#9B958E]">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D50]" />
                  <span>Razorpay Certified 256-Bit SSL Checkout</span>
                </div>
              </div>
            </div>

          </form>

        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 max-w-lg w-full shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <h3 className="font-serif text-xl font-medium text-[#24211E]">Add New Shipping Address</h3>
              <button
                type="button"
                onClick={() => setShowNewAddressModal(false)}
                className="text-[#9B958E] hover:text-[#24211E] p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  placeholder="Apartment 4B, 128 Green Avenue"
                  className="w-full h-11 px-4 bg-white border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                  Apartment / Suite (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  placeholder="Tower 2, Floor 4"
                  className="w-full h-11 px-4 bg-white border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="New Delhi"
                    className="w-full h-11 px-4 bg-white border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="Delhi"
                    className="w-full h-11 px-4 bg-white border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    Postal PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    placeholder="110001"
                    className="w-full h-11 px-4 bg-white border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full h-11 px-4 bg-[#F4F2EF] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0DA]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewAddressModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
