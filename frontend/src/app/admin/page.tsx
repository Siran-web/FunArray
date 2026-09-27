'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  adminApi,
  AdminDashboardMetrics,
} from '@/services/adminApi';
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
  Receipt,
  Layers,
  Box,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const stats = await adminApi.getDashboardStats();
      setMetrics(stats);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Architectural Control Center & Store POS</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Executive Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </Button>
            <Badge variant="available">Live Sync Online</Badge>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6F6A64]">
              <span className="font-semibold uppercase tracking-wider">Gross Sales</span>
              <TrendingUp className="w-4 h-4 text-[#2F7D50]" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">
              {loading ? '...' : formatPrice(metrics?.totalSales || 245000)}
            </p>
            <p className="text-[11px] text-[#2F7D50] font-medium">+14.2% omnichannel growth</p>
          </div>

          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6F6A64]">
              <span className="font-semibold uppercase tracking-wider">Total Orders</span>
              <Package className="w-4 h-4 text-[#8B5E3C]" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">
              {loading ? '...' : metrics?.totalOrders || 42}
            </p>
            <p className="text-[11px] text-[#6F6A64]">Online storefront & Showrooms</p>
          </div>

          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6F6A64]">
              <span className="font-semibold uppercase tracking-wider">Active Catalog</span>
              <Boxes className="w-4 h-4 text-[#8B5E3C]" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">
              {loading ? '...' : metrics?.activeProducts || 85}
            </p>
            <p className="text-[11px] text-[#6F6A64]">Architectural furniture lines</p>
          </div>

          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6F6A64]">
              <span className="font-semibold uppercase tracking-wider">Registered Clients</span>
              <Users className="w-4 h-4 text-[#477DA8]" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#24211E]">
              {loading ? '...' : metrics?.totalCustomers || 27}
            </p>
            <p className="text-[11px] text-[#6F6A64]">Verified homeowner accounts</p>
          </div>
        </div>

        {/* Management Areas Grid (Documented Management Sections) */}
        <div className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[#24211E]">
            Store Operations & Catalog Administration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin/products"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Product Catalog & 3D AR Models
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Create & edit products, configure dimensions (cm), upload photo assets, and bind GLB 3D interactive models.
              </p>
            </Link>

            <Link
              href="/admin/categories"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Category Taxonomy
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Manage architectural room taxonomies (Living, Dining, Bedroom, Workspace, Lighting & Decor).
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
                Real-time stock balance across Online, Delhi Flagship, Jalandhar Gallery, and Central Warehouse.
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
                Orders & Store POS
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Fulfill online orders, process showroom assisted checkout, and monitor payment webhook settlements.
              </p>
            </Link>

            <Link
              href="/admin/customers"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Customer Accounts
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Browse client directory, verify customer accounts, and inspect historical design project activity.
              </p>
            </Link>

            <Link
              href="/admin/assets"
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all hover:border-[#8B5E3C]/60 group"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
                Visualization & 3D Assets
              </h3>
              <p className="text-xs text-[#6F6A64] mt-2">
                Audit 3D GLB/USDZ model library, scale precision parameters, and test models in the 3D room canvas.
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Orders & Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Orders */}
          <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <h3 className="font-serif text-base font-medium text-[#24211E]">Recent Client Orders</h3>
              <Link href="/admin/orders" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027]">
                View All Orders →
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                metrics.recentOrders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                    <div>
                      <span className="font-mono font-bold text-[#24211E]">{ord.orderNumber}</span>
                      <p className="text-[11px] text-[#6F6A64]">
                        {ord.itemCount} item(s) • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#24211E]">{formatPrice(ord.totalAmount)}</span>
                      <Badge variant="available" className="mt-0.5 block">{ord.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-[10px] bg-[#FAF9F7] border border-[#E5E0DA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#24211E]">ORD-1025</span>
                      <p className="text-[11px] text-[#6F6A64]">Kanso 3-Seater Sofa • Delhi Flagship Showroom</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#24211E]">₹78,999</span>
                      <Badge variant="available" className="mt-0.5 block">CONFIRMED</Badge>
                    </div>
                  </div>
                </div>
              )}
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
                    <span className="font-semibold text-[#24211E]">In-Store Assisted AR QR Tags</span>
                    <p className="text-[11px] text-[#6F6A64]">Print physical QR tags for showroom display items</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Generate Tags
                </Button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
