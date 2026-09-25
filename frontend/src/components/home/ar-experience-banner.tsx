"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Camera, Image as ImageIcon, Sliders, CheckCircle, ArrowRight, Eye } from "lucide-react";

export interface ARExperienceBannerProps {
  onOpenARModal: () => void;
}

export function ARExperienceBanner({ onOpenARModal }: ARExperienceBannerProps) {
  return (
    <section id="ar-experience" className="w-full py-16 sm:py-24 bg-[#24211E] text-white relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5E3C]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D49A6A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Technology & Value */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5E3C]/30 border border-[#8B5E3C] text-[#F3E8DE] text-xs font-semibold uppercase tracking-wider">
              <Box className="w-3.5 h-3.5 text-[#D49A6A]" />
              <span>Spatial Intelligence Engine</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-medium tracking-tight leading-tight">
              Never doubt the scale or fit of furniture again.
            </h2>

            <p className="text-base text-[#FAF9F7]/80 font-normal leading-relaxed">
              Furniture returns happen because pieces look different in a photo than in your living room. Our millimeter-calibrated 3D visualizer lets you test layouts, textures, and doorways before buying.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2F7D50]/30 text-[#7BAE8A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Constrained Real-World Dimensions</h4>
                  <p className="text-xs text-[#FAF9F7]/70">Scale is locked to true manufactured measurements (W × H × D) to prevent misleading impressions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2F7D50]/30 text-[#7BAE8A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Dual Preview Modes</h4>
                  <p className="text-xs text-[#FAF9F7]/70">Upload any smartphone photo of your room or open your phone camera for live WebXR surface detection.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#2F7D50]/30 text-[#7BAE8A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Full 360° Yaw Rotation</h4>
                  <p className="text-xs text-[#FAF9F7]/70">Position and angle furniture freely across the room floor with accurate contact shadows.</p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4">
              <Button
                variant="ar"
                size="lg"
                onClick={onOpenARModal}
                className="bg-[#8B5E3C] hover:bg-[#634027] text-white border-transparent shadow-lg text-sm px-8"
              >
                <Box className="w-5 h-5 text-[#F3E8DE]" />
                <span>Launch Interactive Room Visualizer</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Visualizer Interactive Teaser Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#FAF9F7] text-[#24211E] rounded-[20px] p-6 sm:p-8 border border-[#E5E0DA] shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[8px] bg-[#8B5E3C] text-white flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-[#F3E8DE]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#24211E]">Room Visualizer</h3>
                    <p className="text-xs text-[#6F6A64]">Mode Selection (Section 13)</p>
                  </div>
                </div>
                <Badge variant="ar">Interactive</Badge>
              </div>

              {/* Mode Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={onOpenARModal}
                  className="p-5 rounded-[14px] border-2 border-[#8B5E3C] bg-[#F3E8DE]/40 hover:bg-[#F3E8DE] text-left transition-all duration-200 cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-[#8B5E3C] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-[#24211E]">Mode 1: Room Photo</h4>
                  <p className="text-xs text-[#6F6A64]">
                    Upload living-room.jpg. Place, rotate, and verify dimensions on your actual backdrop.
                  </p>
                  <span className="text-[11px] font-bold text-[#8B5E3C] inline-flex items-center gap-1">
                    Try Room Photo <ArrowRight className="w-3 h-3" />
                  </span>
                </button>

                <button
                  onClick={onOpenARModal}
                  className="p-5 rounded-[14px] border border-[#E5E0DA] bg-white hover:border-[#8B5E3C] hover:bg-[#F4F2EF] text-left transition-all duration-200 cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-[10px] bg-[#24211E] text-[#D49A6A] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-[#24211E]">Mode 2: Mobile Camera</h4>
                  <p className="text-xs text-[#6F6A64]">
                    Instant AR via WebXR surface detection. Project the 3D model directly onto your floor.
                  </p>
                  <span className="text-[11px] font-bold text-[#8B5E3C] inline-flex items-center gap-1">
                    Open Camera AR <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              </div>

              {/* Live Preview Teaser */}
              <div className="p-4 rounded-[12px] bg-[#F4F2EF] border border-[#E5E0DA] flex items-center justify-between text-xs text-[#6F6A64]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#8B5E3C]" />
                  <span>Supported Formats: <strong>.GLB</strong> with realistic PBR materials</span>
                </div>
                <span className="font-semibold text-[#2F7D50]">✓ 6 Products AR-Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
