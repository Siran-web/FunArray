'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminApi, AdminCustomer } from '@/services/adminApi';
import {
  Users,
  ArrowLeft,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs font-semibold text-[#8B5E3C] hover:text-[#634027] inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Overview</span>
              </Link>
              <span className="text-xs text-[#9B958E]">/</span>
              <span className="text-xs font-semibold text-[#24211E]">Customers</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Client Directory & Accounts
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadCustomers}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-4 shadow-card">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#9B958E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] placeholder:text-[#9B958E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>
        </div>

        {/* Customer Accounts Table */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0DA] bg-[#FAF9F7]/80 text-[#6F6A64] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-6">Email & Contact</th>
                  <th className="py-3.5 px-6">Account Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Orders Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0DA] text-[#24211E]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#6F6A64]">
                      <div className="w-6 h-6 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading verified accounts...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#6F6A64]">
                      No customers matched the search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF9F7]/60 transition-colors">
                      <td className="py-4 px-6 font-semibold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center font-bold text-xs uppercase">
                          {c.firstName ? c.firstName[0] : 'C'}
                        </div>
                        <div>
                          <span>{c.firstName} {c.lastName}</span>
                          <p className="text-[10px] text-[#9B958E] font-mono">{c.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#6F6A64]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#9B958E]" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9B958E] mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
                            c.role === 'ADMIN'
                              ? 'bg-[#8B5E3C]/10 text-[#8B5E3C] border border-[#8B5E3C]/20'
                              : 'bg-[#477DA8]/10 text-[#477DA8] border border-[#477DA8]/20'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{c.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="available" size="sm">
                          {c.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-[#6F6A64]">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 bg-[#FAF9F7] border border-[#E5E0DA] px-2.5 py-1 rounded-[8px]">
                          <ShoppingBag className="w-3 h-3 text-[#8B5E3C]" />
                          <span>{c.orderCount || 0} orders</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
