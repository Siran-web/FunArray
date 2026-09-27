'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full h-[100dvh] w-full bg-[#FAF9F7] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-[#6F6A64]">
          <div className="w-8 h-8 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider font-medium">Verifying Administrative Privileges...</p>
        </div>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user && (user.role === 'ADMIN' || (user.role as string) === 'STORE_MANAGER');

  if (!isAdmin) {
    return (
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white border border-[#E5E0DA] rounded-[24px] p-8 shadow-card text-center space-y-6">
            <div className="w-16 h-16 rounded-[20px] bg-[#C84B4B]/10 border border-[#C84B4B]/20 text-[#C84B4B] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C84B4B] bg-[#C84B4B]/10 px-3 py-1 rounded-full">
                403 Forbidden • Admin Restricted
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#24211E]">
                Administrative Authorization Required
              </h2>
              <p className="text-xs text-[#6F6A64] leading-relaxed">
                The control center and management dashboard (<code className="text-[#8B5E3C] bg-[#F3E8DE] px-1.5 py-0.5 rounded font-mono text-[11px]">/admin</code>) are protected and strictly reserved for system administrators. Customer accounts do not have access.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-2">
              <Link href="/login" className="block w-full">
                <Button variant="primary" size="md" className="w-full text-xs font-semibold gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as Administrator</span>
                </Button>
              </Link>

              {/* Development Convenience: Switch to Admin Session */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-[#8B5E3C]/30 text-[#8B5E3C] hover:bg-[#F3E8DE]"
                onClick={() => {
                  setAuth(
                    {
                      id: 'admin-preview-id',
                      email: 'funarray47@gmail.com',
                      firstName: 'Atelier',
                      lastName: 'Admin',
                      role: 'ADMIN',
                      status: 'ACTIVE',
                    },
                    'mock-admin-token'
                  );
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Admin Session (Dev Mode)</span>
              </Button>

              <Link href="/" className="block w-full">
                <Button variant="ghost" size="sm" className="w-full text-xs text-[#6F6A64] gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Public Storefront</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
