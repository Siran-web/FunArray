'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminInventoryPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-12 max-w-5xl mx-auto">
      <Link href="/admin" className="text-xs text-stone-400 hover:text-white mb-6 inline-block">
        ← Back to Admin
      </Link>
      <h1 className="text-2xl font-bold mb-6 pb-4 border-b border-stone-800">Admin Inventory Management</h1>
      <p className="text-xs text-stone-400">View real-time showroom and central distribution inventory levels.</p>
    </div>
  );
}
