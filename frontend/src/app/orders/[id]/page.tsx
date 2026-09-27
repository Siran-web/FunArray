'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar py-6 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 max-w-4xl">
          
          <Link
            href="/orders"
            className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] mb-6 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders List</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E0DA]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">Order Information</span>
              <h1 className="font-serif text-3xl font-medium text-[#24211E] mt-0.5">Order #{id?.slice(0, 8) || 'CONFIRMED'}</h1>
            </div>
            <Badge variant="available" size="md">
              Order Confirmed & In Workshop
            </Badge>
          </div>

          {/* Delivery Timeline Card */}
          <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card mb-6 space-y-6">
            <h2 className="font-serif text-lg font-medium text-[#24211E] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#8B5E3C]" />
              <span>White-Glove Delivery Timeline</span>
            </h2>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#2F7D50]/10 text-[#2F7D50] flex items-center justify-center mx-auto font-bold">
                  ✓
                </div>
                <p className="font-semibold text-[#24211E]">Confirmed</p>
                <p className="text-[10px] text-[#9B958E]">Order Received</p>
              </div>

              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center mx-auto font-bold">
                  2
                </div>
                <p className="font-semibold text-[#8B5E3C]">Workshop</p>
                <p className="text-[10px] text-[#9B958E]">Quality Inspection</p>
              </div>

              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#F4F2EF] text-[#9B958E] flex items-center justify-center mx-auto">
                  3
                </div>
                <p className="font-medium text-[#9B958E]">Dispatched</p>
                <p className="text-[10px] text-[#9B958E]">Freight Transit</p>
              </div>

              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#F4F2EF] text-[#9B958E] flex items-center justify-center mx-auto">
                  4
                </div>
                <p className="font-medium text-[#9B958E]">Delivered</p>
                <p className="text-[10px] text-[#9B958E]">In-Room Assembly</p>
              </div>
            </div>
          </div>

          {/* Service Guarantee Card */}
          <div className="p-6 bg-white border border-[#E5E0DA] rounded-[16px] shadow-card space-y-3">
            <h3 className="font-serif text-base font-medium text-[#24211E] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2F7D50]" />
              <span>Complimentary White-Glove Assembly</span>
            </h3>
            <p className="text-xs text-[#6F6A64] leading-relaxed">
              Our certified assembly team will place your furniture in your designated room, assemble all timber components, and remove all protective packaging materials.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
