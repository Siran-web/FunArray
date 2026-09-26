'use client';

import React from 'react';
import Link from 'next/link';

export default function OrdersPage() {
  const sampleOrders = [
    {
      id: 'ord-101',
      orderNumber: 'VF-2026-9812',
      date: '2026-09-24',
      totalAmount: 48999,
      status: 'CONFIRMED',
      itemsCount: 2,
    },
    {
      id: 'ord-100',
      orderNumber: 'VF-2026-7731',
      date: '2026-09-12',
      totalAmount: 18500,
      status: 'DELIVERED',
      itemsCount: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 pb-4 border-b border-stone-800">My Orders</h1>

      <div className="space-y-4">
        {sampleOrders.map((order) => (
          <div
            key={order.id}
            className="p-6 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-white">{order.orderNumber}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Placed on {order.date} • {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-base font-bold text-amber-400">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              <Link
                href={`/orders/${order.id}`}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-medium rounded-xl border border-stone-700 transition"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
