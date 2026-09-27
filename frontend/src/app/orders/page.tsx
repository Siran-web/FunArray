'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { orderApi } from '../../services/orderApi';
import { Order } from '../../types/order';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.getOrders();
        if (res && Array.isArray(res)) {
          setOrders(res);
        }
      } catch (err: any) {
        console.warn('Error fetching orders:', err);
        setError(err?.message || 'Failed to fetch order history.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const updated = await orderApi.cancelOrder(orderId);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'CONFIRMED':
        return <Badge variant="available">{status}</Badge>;
      case 'PROCESSING':
      case 'SHIPPED':
        return <Badge variant="ar">{status}</Badge>;
      case 'CANCELLED':
        return <Badge variant="out-of-stock">{status}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 w-full max-w-full overflow-hidden flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-[#6F6A64]">Loading your order history...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 pb-4 border-b border-[#E5E0DA]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
                Customer Account
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E] mt-0.5">
                My Orders & Purchases
              </h1>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] transition flex items-center gap-1"
            >
              <span>Explore Furniture Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-[12px] bg-[#C84B4B]/10 border border-[#C84B4B]/30 text-[#C84B4B] text-xs font-medium">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="py-20 text-center bg-white border border-[#E5E0DA] rounded-[20px] p-8 shadow-card max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/30 flex items-center justify-center text-[#8B5E3C] mb-4 text-2xl mx-auto shadow-sm">
                <Package className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-medium text-[#24211E]">No Orders Placed Yet</h2>
              <p className="text-xs text-[#6F6A64] mt-2 mb-6 max-w-sm mx-auto">
                Discover our collection of artisan luxury furniture with 1:1 true-scale AR room previews.
              </p>
              <Link href="/products">
                <Button variant="primary" size="md">
                  <span>Start Shopping</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#24211E]">#{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-[11px] text-[#9B958E] mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-[#6F6A64] block">Total Amount</span>
                        <span className="font-semibold text-[#8B5E3C] text-lg">{formatPrice(order.totalAmount)}</span>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Order Items snapshot list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA] flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-[8px] bg-[#F4F2EF] shrink-0 flex items-center justify-center text-xs text-[#9B958E]">
                          <Package className="w-5 h-5 text-[#8B5E3C]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#24211E] truncate">{item.productName}</p>
                          <p className="text-[11px] text-[#6F6A64]">
                            Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-xs"
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
