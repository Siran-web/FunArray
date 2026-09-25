"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatPrice } from "@/lib/utils";
import {
  Sparkles,
  Heart,
  Eye,
  Store,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle2,
  Box,
  Sliders,
  ChevronRight
} from "lucide-react";

export default function DesignSystemFoundationPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [inputError, setInputError] = React.useState("");
  const [isButtonLoading, setIsButtonLoading] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#24211E]">
      {/* Top Announcement Bar */}
      <div className="bg-[#24211E] text-[#F3E8DE] px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#D49A6A]" />
        <span>Virtual Furniture Store • AR Room Preview & Omnichannel Showroom Platform</span>
        <span className="bg-[#8B5E3C] text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Phase 1 Complete</span>
      </div>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-16">
        {/* Editorial Hero Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E8DE] text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Architecture & Design System Foundation
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#24211E] font-medium tracking-tight">
            Tactile Comfort, Designed for Modern Living
          </h1>
          <p className="text-base sm:text-lg text-[#6F6A64] font-normal leading-relaxed">
            The design token system, typography scale, responsive primitives, and modular backend foundations for our omnichannel furniture store with 3D/AR spatial preview.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="ar"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              <Box className="w-5 h-5 text-[#D49A6A]" />
              Interactive Component Test Modal
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setIsButtonLoading(true);
                setTimeout(() => setIsButtonLoading(false), 1200);
              }}
              isLoading={isButtonLoading}
            >
              Simulate Action
            </Button>
          </div>
        </section>

        {/* Section 1: Architectural Status Matrix */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E0DA] pb-2 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#24211E] font-semibold">1. System Architecture Matrix</h2>
            <Badge variant="available">Core Active</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect>
              <CardHeader>
                <div className="flex items-center gap-2 text-[#8B5E3C]">
                  <Database className="w-5 h-5" />
                  <CardTitle>System of Record (PostgreSQL / MySQL)</CardTitle>
                </div>
                <CardDescription>Transactional Integrity & Business Schemas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[#6F6A64]">
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Flyway Relational Migrations:</span>
                  <span className="font-semibold text-[#24211E]">V1 to V15 Ready</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Core Entities:</span>
                  <span className="font-semibold text-[#24211E]">Products, Variants, Orders, Inventory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Local Service:</span>
                  <span className="font-semibold text-[#2F7D50]">MySQL80 Active (Port 3306)</span>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="flex items-center gap-2 text-[#8B5E3C]">
                  <Box className="w-5 h-5" />
                  <CardTitle>3D & Spatial Persist (MongoDB)</CardTitle>
                </div>
                <CardDescription>Dynamic Scene Graphs & Room Layouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[#6F6A64]">
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Collections:</span>
                  <span className="font-semibold text-[#24211E]">saved_rooms, ar_sessions</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Transform Coordinates:</span>
                  <span className="font-semibold text-[#24211E]">x, y, z + constrained scale</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rendering Engine:</span>
                  <span className="font-semibold text-[#24211E]">Three.js / React Three Fiber</span>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="flex items-center gap-2 text-[#8B5E3C]">
                  <Store className="w-5 h-5" />
                  <CardTitle>Omnichannel Unification</CardTitle>
                </div>
                <CardDescription>Physical Showrooms + Web + AR</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[#6F6A64]">
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Showroom Locations:</span>
                  <span className="font-semibold text-[#24211E]">Delhi, Jalandhar, Central WH</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E5E0DA]/50 pb-1">
                  <span>Stock Sync Rule:</span>
                  <span className="font-semibold text-[#2F7D50]">Immediate Online/POS sync</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Store-Assisted AR:</span>
                  <span className="font-semibold text-[#24211E]">Product Floor QR Codes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Color Palette Tokens */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E0DA] pb-2 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#24211E] font-semibold">2. Color Palette Tokens</h2>
            <span className="text-xs text-[#6F6A64]">Section 3 Color System</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#8B5E3C] shadow-inner" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Primary</p>
                <p className="text-[11px] text-[#6F6A64]">#8B5E3C</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#634027] shadow-inner" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Primary Dark</p>
                <p className="text-[11px] text-[#6F6A64]">#634027</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#F3E8DE] border border-[#E5E0DA]" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Primary Light</p>
                <p className="text-[11px] text-[#6F6A64]">#F3E8DE</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#FAF9F7] border border-[#E5E0DA]" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Canvas Bg</p>
                <p className="text-[11px] text-[#6F6A64]">#FAF9F7</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#24211E]" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Text Primary</p>
                <p className="text-[11px] text-[#6F6A64]">#24211E</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#2F7D50]" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Success</p>
                <p className="text-[11px] text-[#6F6A64]">#2F7D50</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-[12px] border border-[#E5E0DA] shadow-card space-y-2">
              <div className="h-14 rounded-[8px] bg-[#C78A24]" />
              <div>
                <p className="text-xs font-semibold text-[#24211E]">Warning</p>
                <p className="text-[11px] text-[#6F6A64]">#C78A24</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Reusable UI Components */}
        <section className="space-y-6">
          <div className="border-b border-[#E5E0DA] pb-2 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#24211E] font-semibold">3. Standardized UI Primitives</h2>
            <span className="text-xs text-[#6F6A64]">Section 9, 10 & 11 Components</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buttons & Badges */}
            <div className="p-6 bg-white rounded-[16px] border border-[#E5E0DA] shadow-card space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase text-[#24211E] tracking-wider mb-3">
                  Button Component Variants
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Button</Button>
                  <Button variant="ar">
                    <Box className="w-4 h-4 text-[#D49A6A]" />
                    View in Your Room
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase text-[#24211E] tracking-wider mb-3">
                  Badge Component Variants
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="available">✓ Available (12)</Badge>
                  <Badge variant="low-stock">Only 2 left</Badge>
                  <Badge variant="out-of-stock">Out of stock</Badge>
                  <Badge variant="ar">AR Enabled</Badge>
                  <Badge variant="neutral">Living Room</Badge>
                  <Badge variant="primary">Featured</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase text-[#24211E] tracking-wider mb-3">
                  Interactive Form Inputs
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Customer Search / Email"
                    placeholder="e.g. arjun.mehta@example.com"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (e.target.value && !e.target.value.includes("@")) {
                        setInputError("Please enter a valid email address");
                      } else {
                        setInputError("");
                      }
                    }}
                    error={inputError}
                    helperText="Input features 10px radius with #8B5E3C focus ring and #F3E8DE glow"
                  />
                </div>
              </div>
            </div>

            {/* Product Card Wireframe Anatomy */}
            <div className="p-6 bg-white rounded-[16px] border border-[#E5E0DA] shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-[#24211E] tracking-wider">
                  Product Card Anatomy (Section 11)
                </h3>
                <span className="text-xs text-[#6F6A64]">Storefront Preview</span>
              </div>

              <div className="max-w-sm mx-auto bg-white rounded-[12px] border border-[#E5E0DA] shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                {/* Visual Image Container */}
                <div className="relative aspect-[4/3] bg-[#F4F2EF] flex items-center justify-center p-6 overflow-hidden">
                  <div className="text-center space-y-1 text-[#6F6A64] group-hover:scale-105 transition-transform duration-300">
                    <Box className="w-16 h-16 mx-auto text-[#8B5E3C]/60" />
                    <span className="text-xs font-medium block">Solid Walnut Minimalist Sofa</span>
                  </div>
                  <button
                    aria-label="Save to Wishlist"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#6F6A64] hover:text-[#C84B4B] shadow-sm hover:scale-110 transition-all"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="ar">3D / AR Ready</Badge>
                  </div>
                </div>

                {/* Information Hierarchy */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6F6A64] mb-1">
                      <span>Living Room • Sofas</span>
                      <span className="flex items-center gap-1 text-[#C78A24] font-semibold">★ 4.8 (84)</span>
                    </div>
                    <h4 className="font-serif text-lg font-medium text-[#24211E]">
                      Modern 3-Seater Walnut Sofa
                    </h4>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[#24211E]">
                        {formatPrice(45999)}
                      </p>
                      <p className="text-[11px] text-[#2F7D50] font-medium">✓ In stock (Delhi & Online)</p>
                    </div>
                    <span className="text-xs text-[#6F6A64]">210 × 90 × 85 cm</span>
                  </div>

                  <Button
                    variant="ar"
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Box className="w-4 h-4 text-[#D49A6A]" />
                    View in Your Room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Modal Demonstration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="View in Your Room (AR Preview)"
        description="Choose your preferred visualization mode as specified in Section 13."
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => alert("Mode 1 (Room Image Visualization) will be implemented in Phase 3")}
              className="p-5 rounded-[16px] border border-[#E5E0DA] bg-[#FAF9F7] hover:border-[#8B5E3C] hover:bg-[#F3E8DE]/40 text-left transition-all duration-200 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#8B5E3C] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-[#24211E]">Upload Room Photo</h4>
              <p className="text-xs text-[#6F6A64] mt-1">
                Upload a photo of your living room. Place and scale the 3D model with realistic shadows.
              </p>
              <span className="text-[11px] font-bold text-[#8B5E3C] mt-3 inline-flex items-center gap-1">
                Phase 3 MVP Milestone <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            <button
              onClick={() => alert("Mode 2 (Mobile Camera AR) will be implemented in Phase 7")}
              className="p-5 rounded-[16px] border border-[#E5E0DA] bg-[#FAF9F7] hover:border-[#8B5E3C] hover:bg-[#F3E8DE]/40 text-left transition-all duration-200 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#24211E] text-[#D49A6A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-[#24211E]">Open Live Camera AR</h4>
              <p className="text-xs text-[#6F6A64] mt-1">
                Use WebXR surface detection to project the true-scale furniture in real time on mobile.
              </p>
              <span className="text-[11px] font-bold text-[#8B5E3C] mt-3 inline-flex items-center gap-1">
                Phase 7 WebXR <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-[#E5E0DA] flex justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E5E0DA] bg-white py-8 px-4 text-center text-xs text-[#6F6A64]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#8B5E3C] text-base">ANTIGRAVITY FURNITURE</span>
            <span className="text-[#9B958E]">|</span>
            <span>Virtual Furniture Store + AR Preview</span>
          </div>
          <p>© 2026 Virtual Furniture Store Inc. Built strictly to design and technical specifications.</p>
        </div>
      </footer>
    </div>
  );
}
