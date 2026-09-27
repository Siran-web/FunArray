'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FEATURED_PRODUCTS } from '@/data/mock-products';
import { formatPrice } from '@/lib/utils';
import {
  Boxes,
  ArrowLeft,
  Box,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState(FEATURED_PRODUCTS);

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
                Product Catalog & 3D AR Assets
              </h1>
            </div>

            <Button
              variant="primary"
              size="md"
              className="gap-2 text-xs font-semibold shadow-md"
              onClick={() => alert('Product addition wizard')}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Architectural Product</span>
            </Button>
          </div>

          {/* Section 16 Spec: Furniture 3D Viewer Asset Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#E5E0DA] rounded-[16px] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] rounded-[12px] bg-[#F4F2EF] overflow-hidden border border-[#E5E0DA]">
                    <img
                      src={p.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <Badge variant="ar" size="sm">
                        <Box className="w-3 h-3" />
                        3D GLB Ready
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#8B5E3C] uppercase tracking-wider">
                      {p.categoryName || 'Living'} • SKU: {p.sku}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-[#24211E] mt-0.5">
                      {p.name}
                    </h3>
                  </div>

                  {/* Section 16 3D Asset Metadata */}
                  <div className="p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA] text-[11px] text-[#6F6A64] space-y-1">
                    <p className="flex justify-between">
                      <span>Dimensions (W×H×D):</span>
                      <strong className="text-[#24211E]">{p.dimensions.widthCm} × {p.dimensions.heightCm} × {p.dimensions.depthCm} cm</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Base Material:</span>
                      <strong className="text-[#24211E]">{p.material}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Base Price:</span>
                      <strong className="text-[#8B5E3C] font-semibold">{formatPrice(p.basePrice)}</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E0DA] flex items-center justify-between gap-2">
                  <Link href={`/visualize/${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                      <Box className="w-3.5 h-3.5 text-[#8B5E3C]" />
                      <span>Test in 3D Studio</span>
                    </Button>
                  </Link>

                  <Link href={`/products/${p.id}`}>
                    <Button variant="ghost" size="sm" className="p-2" title="View Storefront Page">
                      <ExternalLink className="w-4 h-4 text-[#6F6A64]" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
