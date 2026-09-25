"use client";

import * as React from "react";
import Link from "next/link";
import { CategoryItem } from "@/data/mock-products";
import { ArrowUpRight } from "lucide-react";

export interface CategoryGridProps {
  categories: CategoryItem[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className="w-full py-12 sm:py-16 bg-[#FAF9F7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E0DA] pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5E3C]">
              Architectural Collections
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
              Explore by Living Space
            </h2>
          </div>
          <p className="text-sm text-[#6F6A64] max-w-md">
            Harmonious furniture suites designed for flow, natural light, and everyday comfort.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative h-80 rounded-[16px] overflow-hidden border border-[#E5E0DA] shadow-card hover:shadow-card-hover transition-all duration-300 block"
            >
              {/* Background Image */}
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24211E]/85 via-[#24211E]/20 to-transparent" />

              {/* Top Item Count Pill */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-[#24211E] text-xs font-medium px-3 py-1 rounded-full shadow-xs">
                {category.itemCount} Designs
              </div>

              {/* Bottom Information */}
              <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between">
                <div className="space-y-1 pr-4">
                  <h3 className="font-serif text-2xl font-medium tracking-tight text-white group-hover:text-[#F3E8DE] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 font-normal">
                    {category.description}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#8B5E3C] group-hover:rotate-45 transition-all shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
