'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Box, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      router.push('/');
    } catch {
      // Handled in useAuth
    }
  };

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white border border-[#E5E0DA] rounded-[20px] p-8 sm:p-10 shadow-modal my-auto animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8DE] border border-[#8B5E3C]/20 text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D49A6A]" />
              <span>Customer & Staff Portal</span>
            </div>
            <h1 className="font-serif text-3xl font-medium text-[#24211E] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#6F6A64]">
              Sign in to manage your saved 3D designs, orders, and cart
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-[#C84B4B]/10 border border-[#C84B4B]/30 rounded-[10px] text-[#C84B4B] text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B958E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5E0DA] rounded-[10px] text-[#24211E] placeholder:text-[#9B958E] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-3 focus:ring-[#F3E8DE] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#24211E]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9B958E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5E0DA] rounded-[10px] text-[#24211E] placeholder:text-[#9B958E] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-3 focus:ring-[#F3E8DE] transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full text-sm font-semibold tracking-wide"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E5E0DA] text-center space-y-3">
            <p className="text-xs text-[#6F6A64]">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="text-[#8B5E3C] hover:text-[#634027] font-semibold underline underline-offset-2">
                Create an account
              </Link>
            </p>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#9B958E]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D50]" />
              <span>256-Bit Encrypted JWT Authentication</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
