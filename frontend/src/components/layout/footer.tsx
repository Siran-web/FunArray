"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SHOWROOMS } from "@/data/mock-products";
import {
  MapPin,
  Phone,
  Mail,
  Box,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Heart
} from "lucide-react";

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#24211E] text-[#FAF9F7] pt-16 pb-12 border-t border-[#8B5E3C]/20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        {/* Top Newsletter & Brand Promise */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[#FAF9F7]/10 items-center">
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D49A6A]">
              Architectural Living Journal
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium">
              Curated interiors and spatial preview releases.
            </h3>
            <p className="text-xs sm:text-sm text-[#FAF9F7]/70">
              Receive private invitations to seasonal collections, 3D model drops, and showroom events.
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="p-4 rounded-[12px] bg-[#2F7D50]/20 border border-[#2F7D50] text-[#7BAE8A] flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium">
                  Welcome to the FunArray Journal. Check your inbox for your design welcome guide.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 px-4 text-sm bg-white/10 text-white placeholder:text-[#9B958E] rounded-[10px] border border-[#FAF9F7]/20 focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C] outline-none flex-1 transition-all"
                />
                <Button
                  variant="primary"
                  type="submit"
                  size="md"
                  className="bg-[#8B5E3C] hover:bg-[#634027] text-white shrink-0 text-xs px-6"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs text-[#FAF9F7]/80">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl text-white font-bold tracking-tight">
                FunArray
              </span>
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C] inline-block" />
            </Link>
            <p className="text-xs text-[#FAF9F7]/70 leading-relaxed max-w-sm">
              A hybrid furniture-commerce platform uniting artisanal solid timber craftsmanship with precision 3D & Augmented Reality room visualization.
            </p>
            <div className="flex items-center gap-4 text-[#D49A6A] pt-2">
              <span className="flex items-center gap-1.5">
                <Box className="w-4 h-4" /> 3D Spatial Fitting
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 10-Yr Guarantee
              </span>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Collections
            </h4>
            <ul className="space-y-2">
              <li><a href="#products" className="hover:text-white transition-colors">Living Room Seating</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Dining & Entertaining</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Bedroom Suites</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Home Workspaces</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Architectural Lighting</a></li>
            </ul>
          </div>

          {/* Column 3: Omnichannel Experience */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Showrooms
            </h4>
            <ul className="space-y-2">
              {SHOWROOMS.map((s) => (
                <li key={s.id} className="space-y-0.5">
                  <span className="text-white font-medium block">{s.name}</span>
                  <span className="text-[11px] text-[#FAF9F7]/60 block">{s.address}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Customer Care & Services */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Client Care
            </h4>
            <ul className="space-y-2">
              <li><a href="#ar-experience" className="hover:text-white transition-colors">How AR Preview Works</a></li>
              <li><a href="#showrooms" className="hover:text-white transition-colors">Book Showroom Visit</a></li>
              <li><a href="tel:+911149876500" className="hover:text-white transition-colors">Direct Phone: 1800-419-8890</a></li>
              <li><span className="text-[#2F7D50] font-medium">✓ White-Glove In-Home Assembly</span></li>
              <li><span>100-Night Sizing Guarantee</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Accessibility */}
        <div className="pt-8 border-t border-[#FAF9F7]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#FAF9F7]/50 text-center sm:text-left">
          <p>© 2026 FunArray Furniture Inc. All rights reserved. Designed to WCAG 2.2 AA accessibility standards.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Accessibility Statement</span>
            <span className="hover:text-white cursor-pointer">Store POS Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
