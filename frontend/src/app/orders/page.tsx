'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { orderApi } from '../../services/orderApi';
import { Order } from '../../types/order';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-stone-400">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-800">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-500 font-medium">Account</span>
            <h1 className="text-3xl font-serif font-bold text-white mt-1">My Orders</h1>
          </div>
          <Link
            href="/products"
            className="text-xs text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            Explore Catalog →
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="py-20 text-center bg-stone-900/40 border border-stone-800/60 rounded-3xl p-8">
            <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mb-4 text-2xl mx-auto">
              📦
            </div>
            <h2 className="text-xl font-bold text-white">No Orders Placed Yet</h2>
            <p className="text-xs text-stone-400 mt-2 mb-6 max-w-sm mx-auto">
              You have not placed any orders yet. Discover our collection of artisan luxury furniture.
            </p>
            <Link
              href="/products"
              className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-md transition hover:border-stone-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-white">#{order.orderNumber}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                            : 'bg-amber-950/80 text-amber-400 border-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Ordered on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-stone-400">Total Amount</span>
                      <p className="text-lg font-bold font-serif text-amber-400">${order.totalAmount?.toFixed(2)}</p>
                    </div>

                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-xl border border-rose-900/80 transition"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-4 divide-y divide-stone-800/50">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-stone-500 text-xs">🛋️</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-stone-200">{item.productName}</p>
                          <p className="text-[11px] text-stone-400">
                            Qty: {item.quantity} &times; ${item.unitPrice?.toFixed(2)}
                            {item.color ? ` • ${item.color}` : ''}
                            {item.material ? ` • ${item.material}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-stone-200 font-mono">${item.totalPrice?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping Address Footer */}
                {order.shippingAddress && (
                  <div className="mt-4 pt-3 border-t border-stone-800/60 text-xs text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      🚚 Delivering to: <strong className="text-stone-300">{order.shippingAddress.addressLine1}, {order.shippingAddress.city} {order.shippingAddress.state}</strong>
                    </span>
                    <span className="text-stone-500">
                      Subtotal: ${order.subtotal?.toFixed(2)} | Shipping: ${order.shippingFee?.toFixed(2)} | Tax: ${order.tax?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
