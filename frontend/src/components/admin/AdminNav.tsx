'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  Building2,
  Receipt,
  Users,
  Box,
  Store,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Products & 3D', href: '/admin/products', icon: Boxes },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Inventory', href: '/admin/inventory', icon: Building2 },
    { label: 'Orders & POS', href: '/admin/orders', icon: Receipt },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: '3D AR Assets', href: '/admin/assets', icon: Box },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-[#E5E0DA] shrink-0">
      {/* Top Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        {/* Brand & Badge */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#24211E] group-hover:text-[#8B5E3C] transition-colors">
              ATELIER
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-[#24211E] text-[#FAF9F7] px-2 py-0.5 rounded-[6px]">
              ADMIN
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#E5E0DA]">
            <Badge variant="available" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D50] animate-pulse" />
              <span>Multi-Location Live Sync</span>
            </Badge>
          </div>
        </div>

        {/* User Info & Storefront Link */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E5E0DA]">
            <div className="w-6 h-6 rounded-full bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center font-bold text-[10px] uppercase">
              {user?.firstName ? user.firstName[0] : 'A'}
            </div>
            <span className="text-xs font-semibold text-[#24211E]">
              {user?.firstName || 'Administrator'}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#8B5E3C] bg-[#F3E8DE] px-1.5 py-0.5 rounded">
              {user?.role || 'ADMIN'}
            </span>
          </div>

          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#E5E0DA] text-[#6F6A64] hover:text-[#24211E]">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-[#9B958E] hover:text-[#C84B4B] p-2"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Subnav Navigation Tabs (Documented Management Areas) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#E5E0DA]/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                active
                  ? 'border-[#8B5E3C] text-[#8B5E3C] bg-[#F3E8DE]/40'
                  : 'border-transparent text-[#6F6A64] hover:text-[#24211E] hover:border-[#E5E0DA]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#8B5E3C]' : 'text-[#9B958E]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
