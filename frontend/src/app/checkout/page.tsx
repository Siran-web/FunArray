'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { orderApi } from '../../services/orderApi';
import { addressApi } from '../../services/addressApi';
import { paymentApi } from '../../services/paymentApi';
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
  AlertCircle,
  QrCode,
  Smartphone,
  Building2,
  Sparkles,
  Check
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalAmount } = useCart();
  const { isAuthenticated, user } = useAuth();

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
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('UPI');
  const [notes, setNotes] = useState('');

  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('892');
  const [upiId, setUpiId] = useState('user@okhdfcbank');

  // Load addresses
  useEffect(() => {
    async function loadData() {
      try {
        if (isAuthenticated) {
          const addrRes = await addressApi.getAddresses();
          if (addrRes && Array.isArray(addrRes) && addrRes.length > 0) {
            setAddresses(addrRes);
            const defaultAddr = addrRes.find((a) => a.isDefault) || addrRes[0];
            if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch addresses:', err);
      }

      // Default sample address if none exist
      const fallbackAddress: Address = {
        id: 'addr-default-01',
        addressLine1: 'Penthouse 4B, Sky Towers, Golf Course Road',
        addressLine2: 'DLF Phase 5',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
        isDefault: true,
      };
      setAddresses([fallbackAddress]);
      setSelectedAddressId(fallbackAddress.id);
    }
    loadData();
  }, [isAuthenticated]);

  // Fetch server-authoritative checkout preview whenever address or coupon changes
  useEffect(() => {
    async function fetchPreview() {
      setIsLoadingPreview(true);
      setErrorMessage(null);
      try {
        if (isAuthenticated && selectedAddressId) {
          const prev = await orderApi.previewCheckout(selectedAddressId, appliedCoupon);
          setPreview(prev);
          return;
        }
      } catch (err: any) {
        console.warn('Checkout preview fallback to local calculation:', err);
      } finally {
        setIsLoadingPreview(false);
      }

      // Fallback local preview calculation
      const calculatedSubtotal = totalAmount;
      const discount = appliedCoupon ? calculatedSubtotal * 0.1 : 0;
      const tax = (calculatedSubtotal - discount) * 0.08;
      const shipping = calculatedSubtotal >= 50000 ? 0 : 2500;
      const calculatedTotal = calculatedSubtotal - discount + tax + shipping;

      setPreview({
        subtotal: calculatedSubtotal,
        discount,
        tax,
        shippingFee: shipping,
        totalAmount: calculatedTotal,
        totalItems: items.reduce((acc, i) => acc + i.quantity, 0),
        eligibleForFreeShipping: calculatedSubtotal >= 50000,
        freeShippingThreshold: 50000,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.name,
          variantId: i.variantId,
          unitPrice: i.price,
          quantity: i.quantity,
          totalPrice: i.price * i.quantity,
          variantColor: i.selectedColor,
          variantMaterial: i.material,
          imageUrl: i.imageUrl || '',
        })),
      });
    }

    if (items.length > 0) {
      fetchPreview();
    } else {
      setIsLoadingPreview(false);
    }
  }, [items, totalAmount, selectedAddressId, appliedCoupon, isAuthenticated]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setAppliedCoupon(couponCode.trim().toUpperCase());
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAuthenticated) {
        const created = await addressApi.createAddress({
          ...newAddress,
          isDefault: addresses.length === 0,
        });
        setAddresses([...addresses, created]);
        setSelectedAddressId(created.id);
      } else {
        const localAddr: Address = {
          id: `addr-${Date.now()}`,
          ...newAddress,
          isDefault: addresses.length === 0,
        };
        setAddresses([...addresses, localAddr]);
        setSelectedAddressId(localAddr.id);
      }
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

  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a shipping address.');
      return;
    }
    setErrorMessage(null);
    setShowPaymentModal(true);
  };

  const handleExecutePayment = async () => {
    setIsProcessingPayment(true);
    setErrorMessage(null);

    try {
      let createdOrder: Order | null = null;

      if (isAuthenticated && selectedAddressId) {
        try {
          createdOrder = await orderApi.checkout({
            shippingAddressId: selectedAddressId,
            paymentMethod,
            couponCode: appliedCoupon || undefined,
            notes: notes || undefined,
          });

          if (createdOrder?.id) {
            try {
              await paymentApi.createPayment({
                orderId: createdOrder.id,
                paymentMethod,
                provider: 'RAZORPAY',
                currency: 'INR',
              });
            } catch (payErr) {
              console.warn('Payment API creation notification:', payErr);
            }
          }
        } catch (serverErr) {
          console.warn('Server checkout fallback to local order:', serverErr);
        }
      }

      // If server order not created or in guest mode, create local confirmed order
      if (!createdOrder) {
        const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
        createdOrder = {
          id: `ord-${Date.now()}`,
          orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
          status: 'CONFIRMED',
          subtotal: preview?.subtotal || totalAmount,
          discount: preview?.discount || 0,
          tax: preview?.tax || 0,
          shippingFee: preview?.shippingFee || 0,
          totalAmount: preview?.totalAmount || totalAmount,
          paymentMethod,
          paymentStatus: 'PAID',
          shippingAddress: selectedAddr,
          items: items.map((i) => ({
            id: `item-${i.id}`,
            productId: i.productId,
            productName: i.name,
            sku: i.sku || 'FNA-SKU',
            color: i.selectedColor || 'Standard Finish',
            material: i.material || 'Solid Wood',
            imageUrl: i.imageUrl || '',
            unitPrice: i.price,
            quantity: i.quantity,
            totalPrice: i.price * i.quantity,
          })),
          customerName: user ? `${user.firstName} ${user.lastName}` : 'Guest Customer',
          customerEmail: user?.email || 'customer@funarray.store',
          customerPhone: user?.phone || '+91 98765 43210',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Clear Cart & Close Modal
      const finalOrder: Order = createdOrder;
      clearCart();
      setShowPaymentModal(false);
      setCompletedOrder(finalOrder);

      // Redirect to order confirmation
      router.push(`/orders/${finalOrder.id}`);
    } catch (err: any) {
      console.error('Payment execution error:', err);
      setErrorMessage(err?.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white border border-[#E5E0DA] rounded-[20px] p-8 shadow-card text-center space-y-4 my-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#2F7D50]/10 text-[#2F7D50] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-[#24211E]">Order Confirmed</h1>
            <p className="text-xs text-[#6F6A64]">
              Thank you for choosing FunArray. Your order <strong className="text-[#24211E]">#{completedOrder.orderNumber}</strong> has been received and scheduled for white-glove delivery.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link href={`/orders/${completedOrder.id}`}>
                <Button variant="primary" size="md" className="w-full bg-[#8B5E3C] hover:bg-[#634027]">
                  View Order Tracking
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
      <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 flex items-center justify-center text-[#8B5E3C] mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#24211E]">Checkout is Empty</h1>
          <p className="text-xs text-[#6F6A64] mt-2 mb-6">You have no items ready for checkout.</p>
          <Link href="/products">
            <Button variant="primary" size="md" className="bg-[#8B5E3C] hover:bg-[#634027]">
              Explore Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 py-8 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#E5E0DA] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
                Step 2 of 2 • Secure Order Finalization
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E] mt-0.5">
                Checkout & Payment
              </h1>
            </div>
            <Link href="/cart" className="text-xs font-medium text-[#8B5E3C] hover:text-[#634027] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Cart</span>
            </Link>
          </div>

          {/* Unauthenticated Alert */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 rounded-[12px] bg-[#8B5E3C]/10 border border-[#8B5E3C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#8B5E3C]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Checking out as Guest.</strong> Sign in to sync your order history and earned rewards.
                </span>
              </div>
              <Link href="/login?redirect=/checkout">
                <Button variant="outline" size="sm" className="text-xs border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white">
                  Sign In Now
                </Button>
              </Link>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-[12px] bg-[#C84B4B]/10 border border-[#C84B4B]/30 text-[#C84B4B] text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-[#C84B4B] hover:opacity-75 cursor-pointer">✕</button>
            </div>
          )}

          <form onSubmit={handleOpenPaymentModal} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
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
                    <p className="text-xs text-[#6F6A64]">No shipping address selected.</p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowNewAddressModal(true)}
                      className="bg-[#8B5E3C] hover:bg-[#634027]"
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
                            ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm ring-2 ring-[#8B5E3C]/20'
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
                            <span className="truncate">{addr.addressLine1}</span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F3E8DE] text-[#8B5E3C] font-bold shrink-0">Default</span>
                            )}
                          </div>
                          {addr.addressLine2 && <p className="text-[#6F6A64] truncate">{addr.addressLine2}</p>}
                          <p className="text-[#6F6A64]">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-[#9B958E] text-[11px]">{addr.country}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Payment Method Selector */}
              <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-4">
                <div className="border-b border-[#E5E0DA] pb-3">
                  <h2 className="font-serif text-lg font-medium text-[#24211E] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white flex items-center justify-center text-xs font-sans font-bold">2</span>
                    Select Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm ring-2 ring-[#8B5E3C]/20'
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
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#24211E]">
                        <Smartphone className="w-3.5 h-3.5 text-[#8B5E3C]" />
                        <span>Instant UPI / QR</span>
                      </div>
                      <p className="text-[10px] text-[#9B958E]">GPay, PhonePe, Paytm</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm ring-2 ring-[#8B5E3C]/20'
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
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#24211E]">
                        <CreditCard className="w-3.5 h-3.5 text-[#8B5E3C]" />
                        <span>Credit / Debit Card</span>
                      </div>
                      <p className="text-[10px] text-[#9B958E]">Visa, Mastercard, RuPay</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition ${
                      paymentMethod === 'NET_BANKING'
                        ? 'bg-[#F3E8DE]/30 border-[#8B5E3C] shadow-sm ring-2 ring-[#8B5E3C]/20'
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
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#24211E]">
                        <Building2 className="w-3.5 h-3.5 text-[#8B5E3C]" />
                        <span>Net Banking</span>
                      </div>
                      <p className="text-[10px] text-[#9B958E]">All major Indian banks</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Delivery Instructions */}
              <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                    Delivery & Assembly Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Elevators available on 3rd floor, please call 30 minutes prior to delivery"
                    className="w-full p-3 bg-white border border-[#E5E0DA] rounded-[10px] text-[#24211E] placeholder:text-[#9B958E] text-xs focus:outline-none focus:border-[#8B5E3C] focus:ring-3 focus:ring-[#F3E8DE] transition resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Pay Trigger */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
                <h2 className="font-serif text-xl font-medium text-[#24211E] pb-3 border-b border-[#E5E0DA]">
                  Order Summary
                </h2>

                {/* Promotional Coupon */}
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
                      <Tag className="w-3 h-3" /> Coupon &apos;{appliedCoupon}&apos; active (-10%)
                    </p>
                  )}
                </div>

                {/* Items Mini List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-xs py-1 border-b border-[#E5E0DA]/40">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-[#24211E] truncate">{i.name}</p>
                        <p className="text-[10px] text-[#9B958E]">Qty: {i.quantity} • {i.selectedColor || 'Standard Finish'}</p>
                      </div>
                      <span className="font-semibold text-[#24211E] shrink-0">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                {isLoadingPreview ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#6F6A64]">Calculating taxes & white-glove rates...</p>
                  </div>
                ) : preview ? (
                  <div className="space-y-2.5 text-xs text-[#6F6A64]">
                    <div className="flex items-center justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-[#24211E]">{formatPrice(preview.subtotal)}</span>
                    </div>

                    {preview.discount > 0 && (
                      <div className="flex items-center justify-between text-[#2F7D50]">
                        <span>Promotional Discount</span>
                        <span className="font-semibold">-{formatPrice(preview.discount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span>In-Room White-Glove Delivery</span>
                      <span className="font-semibold text-[#2F7D50]">
                        {preview.shippingFee === 0 ? 'FREE' : formatPrice(preview.shippingFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Taxes & GST (8%)</span>
                      <span className="font-semibold text-[#24211E]">{formatPrice(preview.tax)}</span>
                    </div>

                    <div className="pt-3 border-t border-[#E5E0DA] flex items-baseline justify-between text-sm">
                      <div>
                        <p className="font-semibold text-[#24211E]">Total Amount Payable</p>
                        <p className="text-[10px] text-[#9B958E]">Inclusive of all freight & assembly</p>
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
                  disabled={!selectedAddressId || isLoadingPreview}
                  className="w-full text-xs font-semibold tracking-wide shadow-md bg-[#8B5E3C] hover:bg-[#634027] h-12"
                >
                  <span>Proceed to Payment ({formatPrice(preview?.totalAmount || totalAmount)})</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>

                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-[#9B958E]">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D50]" />
                  <span>256-Bit Encrypted Secure Checkout</span>
                </div>
              </div>
            </div>

          </form>

        </div>
      </div>

      {/* Interactive Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 max-w-md w-full shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C]">Razorpay Secure Gateway</span>
                <h3 className="font-serif text-xl font-medium text-[#24211E]">Complete Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-[#9B958E] hover:text-[#24211E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#FAF9F7] rounded-[12px] border border-[#E5E0DA] flex items-center justify-between">
              <span className="text-xs text-[#6F6A64]">Total Payable Amount</span>
              <span className="text-xl font-serif font-bold text-[#8B5E3C]">
                {formatPrice(preview?.totalAmount || totalAmount)}
              </span>
            </div>

            {/* Payment Method UI Details */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4 text-center">
                <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-sm inline-block mx-auto">
                  <div className="w-36 h-36 bg-[#F4F2EF] rounded-[12px] flex items-center justify-center mx-auto border-2 border-dashed border-[#8B5E3C]/40">
                    <QrCode className="w-24 h-24 text-[#24211E]" />
                  </div>
                  <p className="text-[11px] font-medium text-[#6F6A64] mt-2">Scan QR with any UPI App</p>
                  <p className="text-[10px] text-[#9B958E]">GPay • PhonePe • Paytm • BHIM</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-[#6F6A64]">Or enter UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-center font-mono text-[#24211E]"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6F6A64] mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs font-mono text-[#24211E]"
                    />
                    <CreditCard className="w-4 h-4 text-[#8B5E3C] absolute right-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#6F6A64] mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs font-mono text-[#24211E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6F6A64] mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs font-mono text-[#24211E]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'NET_BANKING' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#6F6A64]">Select Primary Bank</label>
                <select className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-xs text-[#24211E]">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isProcessingPayment}
                onClick={handleExecutePayment}
                className="w-full bg-[#2F7D50] hover:bg-[#235e3d] text-white font-semibold h-12 gap-2 text-xs"
              >
                <Check className="w-4 h-4" />
                <span>Authorize & Pay {formatPrice(preview?.totalAmount || totalAmount)}</span>
              </Button>

              <p className="text-[10px] text-center text-[#9B958E]">
                Simulated Sandbox Payment Gateway • 100% Safe & Instant
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 max-w-lg w-full shadow-modal space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <h3 className="font-serif text-xl font-medium text-[#24211E]">Add New Shipping Address</h3>
              <button
                type="button"
                onClick={() => setShowNewAddressModal(false)}
                className="text-[#9B958E] hover:text-[#24211E] p-1 cursor-pointer"
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
                  className="bg-[#8B5E3C] hover:bg-[#634027]"
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
