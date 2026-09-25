"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  Menu,
  X,
  Box,
  MapPin,
  Sparkles,
  Phone,
  Clock,
  ArrowRight
} from "lucide-react";

export interface NavbarProps {
  onOpenCart?: () => void;
  onOpenARPreview?: () => void;
  cartCount?: number;
  wishlistCount?: number;
}

export function Navbar({
  onOpenCart,
  onOpenARPreview,
  cartCount = 2,
  wishlistCount = 1,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Living Room", href: "#products" },
    { name: "Dining & Kitchen", href: "#categories" },
    { name: "Bedroom", href: "#categories" },
    { name: "New Arrivals", href: "#products" },
    {
      name: "AR Room Preview",
      href: "#ar-experience",
      isAr: true,
      onClick: (e: React.MouseEvent) => {
        if (onOpenARPreview) {
          e.preventDefault();
          onOpenARPreview();
        }
      },
    },
    { name: "Showrooms", href: "#showrooms" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* 1. Top Omnichannel Showroom & Service Bar */}
      <div className="bg-[#24211E] text-[#F3E8DE] px-4 py-1.5 text-xs font-medium">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#D49A6A]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Flagship: Delhi Showroom • Open Today until 8:00 PM</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px]">
            <span className="text-[#9B958E]">Complimentary In-Room White-Glove Delivery Across India</span>
            <span className="text-[#6F6A64]">|</span>
            <a href="tel:+911149876500" className="hover:text-white flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#8B5E3C]" />
              Support: 1800-419-8890
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div
        className={`w-full bg-[#FAF9F7]/95 backdrop-blur-md border-b transition-all duration-200 ${
          isScrolled ? "border-[#E5E0DA] shadow-sm py-3" : "border-transparent py-4"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-6">
          {/* Left: Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-[8px] text-[#24211E] hover:bg-[#F4F2EF] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-baseline gap-1.5 group">
              <span className="font-serif text-2xl sm:text-3xl text-[#24211E] font-bold tracking-tight">
                FunArray
              </span>
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C] inline-block group-hover:scale-125 transition-transform" />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={link.onClick}
                className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  link.isAr
                    ? "text-[#8B5E3C] hover:text-[#634027] font-semibold bg-[#F3E8DE] px-3 py-1 rounded-full border border-[#8B5E3C]/30 shadow-2xs hover:bg-[#ebd8cb]"
                    : "text-[#24211E] hover:text-[#8B5E3C]"
                }`}
              >
                {link.isAr && <Box className="w-3.5 h-3.5 text-[#8B5E3C]" />}
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: Search, Wishlist, Cart & Account */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Toggle */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center bg-white border border-[#8B5E3C] rounded-[10px] px-3 py-1 shadow-sm">
                  <Search className="w-4 h-4 text-[#8B5E3C] mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search sofas, tables, dining..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-48 sm:w-64 text-xs bg-transparent outline-none text-[#24211E] placeholder:text-[#9B958E]"
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="text-[#9B958E] hover:text-[#24211E] ml-1 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 rounded-[10px] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF] transition-colors"
                  aria-label="Search furniture catalog"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <Link
              href="#wishlist"
              className="p-2.5 rounded-[10px] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF] transition-colors relative"
              aria-label="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#8B5E3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="p-2.5 rounded-[10px] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF] transition-colors relative"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#8B5E3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account CTA */}
            <div className="hidden sm:block pl-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-medium border-[#E5E0DA] hover:border-[#8B5E3C]"
              >
                <User className="w-4 h-4 text-[#8B5E3C]" />
                <span>Sign In</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[88px] z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start">
          <div className="bg-[#FAF9F7] border-b border-[#E5E0DA] p-6 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (link.onClick) link.onClick(e);
                  }}
                  className={`text-base py-2 font-medium border-b border-[#E5E0DA]/50 flex items-center justify-between ${
                    link.isAr ? "text-[#8B5E3C] font-semibold" : "text-[#24211E]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {link.isAr && <Box className="w-4 h-4 text-[#8B5E3C]" />}
                    {link.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#9B958E]" />
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5E0DA] flex items-center justify-between">
              <div className="text-xs text-[#6F6A64]">
                <p className="font-semibold text-[#24211E]">Delhi Flagship Showroom</p>
                <p>MG Road, Sultanpur, New Delhi</p>
              </div>
              <Button variant="primary" size="sm">
                Book Visit
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
