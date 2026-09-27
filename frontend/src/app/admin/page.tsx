'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Package,
  Boxes,
  Users,
  TrendingUp,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar py-6 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>Store Staff & Omnichannel Operations</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
                Store Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6F6A64]">Unified Multi-Location Stock</span>
              <Badge variant="available">Live Sync</Badge>
            </div>
          </div>

          {/* Section 17 Spec: Store Dashboard Primary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6F6A64]">
                <span className="font-semibold uppercase tracking-wider">Today&apos;s Sales</span>
                <TrendingUp className="w-4 h-4 text-[#2F7D50]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">₹2,45,000</p>
              <p className="text-[11px] text-[#2F7D50] font-medium">+14.2% vs yesterday</p>
            </div>

            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6F6A64]">
                <span className="font-semibold uppercase tracking-wider">Orders</span>
                <Package className="w-4 h-4 text-[#8B5E3C]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">42</p>
              <p className="text-[11px] text-[#6F6A64]">Online: 28 • Showrooms: 14</p>
            </div>

            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6F6A64]">
                <span className="font-semibold uppercase tracking-wider">Low Stock</span>
                <AlertTriangle className="w-4 h-4 text-[#C78A24]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#C78A24]">8</p>
              <p className="text-[11px] text-[#C78A24] font-medium">Restock recommended</p>
            </div>

            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6F6A64]">
                <span className="font-semibold uppercase tracking-wider">Customers</span>
                <Users className="w-4 h-4 text-[#477DA8]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">27</p>
              <p className="text-[11px] text-[#6F6A64]">Registered today</p>
            </div>
          </div>

          {/* Store Operations Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin/products"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Product Catalog & 3D Assets
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Manage architectural furniture catalog, dimensions (cm), 3D GLB models, and variant options.
              </p>
            </Link>

            <Link
              href="/admin/inventory"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Multi-Store Inventory
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Real-time stock balance across Online, Delhi Store, Jalandhar Store, and Central Warehouse.
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Order Management & Store POS
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Fulfill online orders, handle store POS sales, discounts, and payment webhook tracking.
              </p>
            </Link>
          </div>

          {/* Section 17 Spec: Recent Orders & Inventory Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Orders */}
            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
                <h3 className="font-serif text-base font-medium text-[#24211E]">Recent Orders</h3>
                <Link href="/admin/orders" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027]">
                  View All →
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                  <div>
                    <span className="font-mono font-bold text-[#24211E]">Order #1025</span>
                    <p className="text-[11px] text-[#6F6A64]">Kanso 3-Seater Sofa • Delhi Flagship Showroom</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[#24211E]">₹78,999</span>
                    <Badge variant="available" className="mt-0.5 block">CONFIRMED</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                  <div>
                    <span className="font-mono font-bold text-[#24211E]">Order #1024</span>
                    <p className="text-[11px] text-[#6F6A64]">Neva Sculptural Chair • Online Store</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[#24211E]">₹34,500</span>
                    <Badge variant="available" className="mt-0.5 block">CONFIRMED</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                  <div>
                    <span className="font-mono font-bold text-[#24211E]">Order #1023</span>
                    <p className="text-[11px] text-[#6F6A64]">Tusk Minimalist Coffee Table • Jalandhar Gallery</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-[#24211E]">₹22,000</span>
                    <Badge variant="ar" className="mt-0.5 block">PROCESSING</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
                <h3 className="font-serif text-base font-medium text-[#24211E]">Inventory Alerts</h3>
                <Link href="/admin/inventory" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027]">
                  Stock Manager →
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#C78A24]/10 border border-[#C78A24]/20">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#C78A24] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#24211E]">Kanso 3-Seater Sofa (Oatmeal Linen)</span>
                      <p className="text-[11px] text-[#6F6A64]">SKU: SOFA-KANSO-LINEN</p>
                    </div>
                  </div>
                  <Badge variant="low-stock">2 left</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#C78A24]/10 border border-[#C78A24]/20">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#C78A24] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#24211E]">Voxel Modular Dining Table (Walnut)</span>
                      <p className="text-[11px] text-[#6F6A64]">SKU: TBL-VOXEL-WAL</p>
                    </div>
                  </div>
                  <Badge variant="low-stock">1 left</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#24211E]">In-Store Assisted AR QR Codes</span>
                      <p className="text-[11px] text-[#6F6A64]">Print physical tags for showroom display items</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Print QR
                  </Button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
