"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Sparkles, ShieldCheck, Truck, Clock, ArrowRight, Play } from "lucide-react";

export interface HeroSectionProps {
  onOpenAR: () => void;
  onExploreCollection: () => void;
}

export function HeroSection({ onOpenAR, onExploreCollection }: HeroSectionProps) {
  return (
    <section className="relative w-full pt-4 pb-12 sm:pb-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D49A6A]" />
              <span>Autumn / Winter 2026 Architectural Collection</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#24211E] font-medium tracking-tight leading-[1.12]">
              Timeless Living, <br />
              <span className="italic text-[#8B5E3C] font-normal">visualized</span> in your sanctuary.
            </h1>

            <p className="text-base sm:text-lg text-[#6F6A64] font-normal leading-relaxed max-w-xl">
              Immerse yourself in artisanal furniture crafted from sustainably harvested solid oak and Belgian linen. Preview every piece inside your actual space with millimeter-accurate 3D & Augmented Reality before you buy.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Button
                variant="ar"
                size="lg"
                onClick={onOpenAR}
                className="shadow-md hover:shadow-lg transition-all group"
              >
                <Box className="w-5 h-5 text-[#D49A6A] group-hover:rotate-12 transition-transform" />
                <span>View in Your Room (AR)</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onExploreCollection}
                className="border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#F3E8DE]"
              >
                <span>Browse Furniture</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            {/* Trust Mini Metrics */}
            <div className="pt-6 border-t border-[#E5E0DA] grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-serif font-bold text-[#24211E]">100%</p>
                <p className="text-xs text-[#6F6A64]">Solid Hardwood Timber</p>
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-[#8B5E3C]">1:1</p>
                <p className="text-xs text-[#6F6A64]">True-Scale AR Precision</p>
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-[#24211E]">10-Yr</p>
                <p className="text-xs text-[#6F6A64]">Structural Warranty</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with AR Spotlight Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-[20px] overflow-hidden border border-[#E5E0DA] shadow-card">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85"
                alt="Contemporary architectural living room with solid walnut furniture"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

              {/* Floating AR Demonstration Badge */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-[16px] p-4 border border-[#E5E0DA] shadow-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[10px] bg-[#8B5E3C] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Box className="w-6 h-6 text-[#F3E8DE]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#8B5E3C] uppercase tracking-wider">
                        Virtual Room Match
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D50]" />
                    </div>
                    <p className="text-sm font-medium text-[#24211E]">
                      Kanso 3-Seater Sofa placed in Living Room
                    </p>
                    <p className="text-xs text-[#6F6A64]">
                      Scale locked to 225 × 82 × 95 cm
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAR}
                  className="hidden sm:inline-flex shrink-0 text-xs py-2 px-3"
                >
                  Try Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Ribbon */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-[16px] bg-white border border-[#E5E0DA] shadow-card">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#24211E]">White-Glove Delivery</p>
              <p className="text-xs text-[#6F6A64]">Room-of-choice setup & debris removal</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#24211E]">AR Spatial Fitting</p>
              <p className="text-xs text-[#6F6A64]">Guaranteed zero sizing errors</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#24211E]">100-Night Home Trial</p>
              <p className="text-xs text-[#6F6A64]">Live with it, love it, or return it</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#24211E]">10-Year Timber Warranty</p>
              <p className="text-xs text-[#6F6A64]">Traditional mortise & tenon joinery</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
