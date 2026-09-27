'use client';

import React from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col font-sans">
        <AdminNav />
        <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden no-scrollbar">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
