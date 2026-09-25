"use client";

import * as React from "react";
import { TESTIMONIALS } from "@/data/mock-products";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Box, Quote } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="w-full py-16 sm:py-20 bg-[#FAF9F7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
            Real Homes, Verified Fits
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
            Trusted in Living Rooms Nationwide
          </h2>
          <p className="text-sm text-[#6F6A64]">
            See why over 10,000 homeowners rely on our true-scale AR preview and solid hardwood craftsmanship.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#E5E0DA] shadow-card flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                {/* Rating & AR Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#C78A24]">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C78A24] text-[#C78A24]" />
                    ))}
                  </div>
                  {t.arUsed && (
                    <Badge variant="ar" size="sm">
                      <Box className="w-3 h-3 text-[#8B5E3C]" />
                      AR Verified Fit
                    </Badge>
                  )}
                </div>

                {/* Review Headline & Text */}
                <h3 className="font-serif text-lg font-semibold text-[#24211E] leading-snug">
                  "{t.reviewTitle}"
                </h3>
                <p className="text-xs sm:text-sm text-[#6F6A64] leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              {/* Author & Product Info */}
              <div className="pt-4 border-t border-[#E5E0DA] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#24211E] flex items-center gap-1">
                    {t.author}
                    <CheckCircle className="w-3.5 h-3.5 text-[#2F7D50]" />
                  </p>
                  <p className="text-[#9B958E]">{t.city} • {t.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#8B5E3C] font-medium block">Purchased:</span>
                  <span className="text-xs text-[#24211E] font-medium line-clamp-1">{t.productName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="border border-[#E5E0DA] rounded-[16px] bg-[#F4F2EF] p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-serif font-bold text-[#8B5E3C]">10,000+</p>
            <p className="text-xs text-[#6F6A64] mt-1">Homes Styled Across India</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-[#24211E]">99.2%</p>
            <p className="text-xs text-[#6F6A64] mt-1">First-Time Fit Success</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-[#8B5E3C]">4.9 / 5</p>
            <p className="text-xs text-[#6F6A64] mt-1">Average Customer Rating</p>
          </div>
          <div>
            <p className="text-3xl font-serif font-bold text-[#24211E]">Zero</p>
            <p className="text-xs text-[#6F6A64] mt-1">Dimensional Return Fees</p>
          </div>
        </div>
      </div>
    </section>
  );
}
