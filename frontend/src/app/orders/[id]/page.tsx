'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-4xl mx-auto">
      <Link href="/orders" className="text-xs text-stone-400 hover:text-white mb-6 inline-block">
        ← Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-xs text-stone-400 mt-1">ID: {id}</p>
        </div>
        <span className="px-3 py-1 bg-amber-950/80 border border-amber-800 rounded-full text-amber-400 text-xs font-semibold uppercase">
          Processing
        </span>
      </div>

      <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl mb-6">
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Delivery Timeline</h2>
        <div className="flex items-center justify-between text-xs text-stone-300">
          <div className="text-center">
            <span className="text-amber-500 font-bold block">✓ Confirmed</span>
            <span className="text-[10px] text-stone-500">24 Sep 2026</span>
          </div>
          <div className="h-0.5 flex-1 bg-amber-500/40 mx-2" />
          <div className="text-center">
            <span className="text-amber-500 font-bold block">Processing</span>
            <span className="text-[10px] text-stone-500">25 Sep 2026</span>
          </div>
          <div className="h-0.5 flex-1 bg-stone-700 mx-2" />
          <div className="text-center">
            <span className="text-stone-500 block">Shipped</span>
            <span className="text-[10px] text-stone-500">Pending</span>
          </div>
          <div className="h-0.5 flex-1 bg-stone-700 mx-2" />
          <div className="text-center">
            <span className="text-stone-500 block">Delivered</span>
            <span className="text-[10px] text-stone-500">Estimated 28 Sep</span>
          </div>
        </div>
      </div>
    </div>
  );
}
