'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  Receipt,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  User,
  ShoppingBag,
  CreditCard,
  Building2
} from 'lucide-react';

interface MockAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  channel: 'ONLINE' | 'DELHI_SHOWROOM' | 'JALANDHAR_SHOWROOM';
  itemsSummary: string;
  total: number;
  status: 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  date: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<MockAdminOrder[]>([
    {
      id: 'ord-1025',
      orderNumber: 'ORD-1025',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com',
      channel: 'DELHI_SHOWROOM',
      itemsSummary: 'Kanso 3-Seater Sofa (Oatmeal Linen) × 1',
      total: 78999,
      status: 'CONFIRMED',
      date: '27 Sep 2026',
    },
    {
      id: 'ord-1024',
      orderNumber: 'ORD-1024',
      customerName: 'Priya Patel',
      customerEmail: 'priya.patel@example.com',
      channel: 'ONLINE',
      itemsSummary: 'Neva Sculptural Lounge Chair (Cognac) × 1',
      total: 34500,
      status: 'CONFIRMED',
      date: '27 Sep 2026',
    },
    {
      id: 'ord-1023',
      orderNumber: 'ORD-1023',
      customerName: 'Rohit Verma',
      customerEmail: 'rohit.v@example.com',
      channel: 'JALANDHAR_SHOWROOM',
      itemsSummary: 'Tusk Minimalist Coffee Table (Natural Oak) × 1',
      total: 22000,
      status: 'PROCESSING',
      date: '26 Sep 2026',
    },
  ]);

  const [showPOSModal, setShowPOSModal] = useState(false);
  const [posCustomer, setPosCustomer] = useState('');
  const [posProduct, setPosProduct] = useState('Kanso 3-Seater Sofa');
  const [posDiscount, setPosDiscount] = useState('0');

  const handleCreatePOSOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrd: MockAdminOrder = {
      id: `ord-${1026 + orders.length}`,
      orderNumber: `ORD-${1026 + orders.length}`,
      customerName: posCustomer || 'Walk-In Customer',
      customerEmail: 'store-pos@funarray.store',
      channel: 'DELHI_SHOWROOM',
      itemsSummary: `${posProduct} × 1`,
      total: 78999 - (parseFloat(posDiscount) || 0),
      status: 'CONFIRMED',
      date: 'Today',
    };
    setOrders([newOrd, ...orders]);
    setShowPOSModal(false);
    setPosCustomer('');
  };

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar py-6 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
            <div>
              <Link href="/admin" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] inline-flex items-center gap-1 mb-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Store Dashboard</span>
              </Link>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
                Order Management & Store POS
              </h1>
            </div>

            {/* Section 20 Spec: Store POS Action */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowPOSModal(true)}
              className="gap-2 text-xs font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Store POS Order</span>
            </Button>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-[#E5E0DA] rounded-[16px] overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F2EF] text-[#6F6A64] font-semibold uppercase tracking-wider border-b border-[#E5E0DA]">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-4 py-4">Customer</th>
                    <th className="px-4 py-4">Sales Channel</th>
                    <th className="px-4 py-4">Purchased Furniture</th>
                    <th className="px-4 py-4 text-right">Total Amount</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0DA]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF9F7] transition">
                      <td className="px-6 py-4 font-mono font-bold text-sm text-[#24211E]">
                        {ord.orderNumber}
                        <span className="block font-sans text-[10px] text-[#9B958E] font-normal">{ord.date}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#24211E]">{ord.customerName}</p>
                        <p className="text-[11px] text-[#9B958E]">{ord.customerEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 text-[#8B5E3C] text-[10px] font-semibold">
                          {ord.channel.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#6F6A64]">
                        {ord.itemsSummary}
                      </td>
                      <td className="px-4 py-4 text-right font-serif text-base font-bold text-[#8B5E3C]">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={ord.status === 'CONFIRMED' ? 'available' : 'ar'}>
                          {ord.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Section 20 Spec: Store POS Modal */}
      {showPOSModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0DA] rounded-[20px] p-6 sm:p-8 max-w-md w-full shadow-modal space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#8B5E3C]" />
                <h3 className="font-serif text-lg font-medium text-[#24211E]">Store POS Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPOSModal(false)}
                className="text-[#9B958E] hover:text-[#24211E]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePOSOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                  Customer Name or Phone
                </label>
                <input
                  type="text"
                  required
                  value={posCustomer}
                  onChange={(e) => setPosCustomer(e.target.value)}
                  placeholder="Walk-In Customer / +91 98765 43210"
                  className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                  Select Furniture Product
                </label>
                <select
                  value={posProduct}
                  onChange={(e) => setPosProduct(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                >
                  <option>Kanso 3-Seater Sofa (₹78,999)</option>
                  <option>Neva Sculptural Lounge Chair (₹34,500)</option>
                  <option>Voxel Modular Dining Table (₹52,000)</option>
                  <option>Tusk Minimalist Coffee Table (₹22,000)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                  Store Discount Amount (₹)
                </label>
                <input
                  type="number"
                  value={posDiscount}
                  onChange={(e) => setPosDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3 bg-white border border-[#E5E0DA] rounded-[8px] text-[#24211E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0DA]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPOSModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Confirm POS Sale & Print Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
