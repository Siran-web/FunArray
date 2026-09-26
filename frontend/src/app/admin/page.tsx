'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Security Guarded</span>
          <h1 className="text-2xl font-bold mt-1">Admin Portal</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/products"
          className="p-6 bg-stone-900 border border-stone-800 rounded-2xl hover:border-amber-500/50 transition group"
        >
          <h3 className="font-semibold text-white group-hover:text-amber-400">Products Catalog</h3>
          <p className="text-xs text-stone-400 mt-2">Manage products, 3D AR assets, pricing, and variants.</p>
        </Link>

        <Link
          href="/admin/inventory"
          className="p-6 bg-stone-900 border border-stone-800 rounded-2xl hover:border-amber-500/50 transition group"
        >
          <h3 className="font-semibold text-white group-hover:text-amber-400">Inventory Stock</h3>
          <p className="text-xs text-stone-400 mt-2">Track multi-warehouse inventory levels and store allocation.</p>
        </Link>

        <Link
          href="/admin/orders"
          className="p-6 bg-stone-900 border border-stone-800 rounded-2xl hover:border-amber-500/50 transition group"
        >
          <h3 className="font-semibold text-white group-hover:text-amber-400">Order Management</h3>
          <p className="text-xs text-stone-400 mt-2">Fulfill customer orders and verify payment webhooks.</p>
        </Link>
      </div>
    </div>
  );
}
