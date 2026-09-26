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
  ArrowRight,
  LogOut,
  Package,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export interface NavbarProps {
  onOpenCart?: () => void;
  onOpenARPreview?: () => void;
  cartCount?: number;
  wishlistCount?: number;
}

export function Navbar({
  onOpenCart,
  onOpenARPreview,
  wishlistCount = 1,
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount: dynamicCartCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
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
    { name: "Living Room", href: "/products?category=living-room" },
    { name: "Dining & Kitchen", href: "/products?category=dining-room" },
    { name: "Bedroom", href: "/products?category=bedroom" },
    { name: "Catalog", href: "/products" },
    {
      name: "3D AR Studio",
      href: "/visualize",
      isAr: true,
      onClick: (e: React.MouseEvent) => {
        if (onOpenARPreview) {
          e.preventDefault();
          onOpenARPreview();
        }
      },
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* 1. Top Omnichannel Showroom & Service Bar */}
      <div className="bg-[#24211E] text-[#F3E8DE] px-4 py-1.5 text-xs font-medium">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#D49A6A]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Flagship Showroom • Open Today until 8:00 PM</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px]">
            <span className="text-[#9B958E]">Complimentary White-Glove In-Room Delivery</span>
            <span className="text-[#6F6A64]">|</span>
            <a href="tel:+18004198890" className="hover:text-white flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#8B5E3C]" />
              Support: 1-800-419-8890
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
              <Link
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
              </Link>
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

            {/* Cart Button */}
            <Link
              href="/cart"
              onClick={(e) => {
                if (onOpenCart) {
                  e.preventDefault();
                  onOpenCart();
                }
              }}
              className="p-2.5 rounded-[10px] text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF] transition-colors relative"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {dynamicCartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#8B5E3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {dynamicCartCount}
                </span>
              )}
            </Link>

            {/* Account Dropdown or Sign In */}
            <div className="relative pl-1">
              {isAuthenticated && user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E0DA] bg-white text-[#24211E] text-xs font-semibold hover:border-[#8B5E3C] transition shadow-2xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#8B5E3C] text-white text-[10px] flex items-center justify-center font-bold">
                      {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[80px] truncate">{user.firstName || 'Account'}</span>
                    <ChevronDown className="w-3 h-3 text-[#6F6A64]" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E0DA] rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="px-4 py-2 border-b border-[#F4F2EF]">
                        <p className="font-semibold text-[#24211E] truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-[11px] text-[#9B958E] truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-[#24211E] hover:bg-[#FAF9F7] transition"
                      >
                        <Package className="w-3.5 h-3.5 text-[#8B5E3C]" />
                        <span>My Orders</span>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-[#24211E] hover:bg-[#FAF9F7] transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-medium border-[#E5E0DA] hover:border-[#8B5E3C]"
                  >
                    <User className="w-4 h-4 text-[#8B5E3C]" />
                    <span>Sign In</span>
                  </Button>
                </Link>
              )}
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
                <Link
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
                </Link>
              ))}

              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base py-2 font-medium border-b border-[#E5E0DA]/50 flex items-center justify-between text-[#24211E]"
              >
                <span>My Orders</span>
                <ArrowRight className="w-4 h-4 text-[#9B958E]" />
              </Link>
            </div>

            <div className="pt-2 border-t border-[#E5E0DA] flex items-center justify-between">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-semibold text-xs text-[#24211E]">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-[#6F6A64]">{user.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => logout()} className="text-rose-600">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign In / Register
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
