'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminApi, AdminAsset } from '@/services/adminApi';
import {
  Box,
  ArrowLeft,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const filtered = assets.filter(
    (a) =>
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.modelUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.format.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="text-xs font-semibold text-[#24211E]">3D AR Assets</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#24211E]">
              Visualization & 3D GLB Assets Library
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAssets}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Audit Asset Registry</span>
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#E5E0DA] rounded-[16px] p-4 shadow-card">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#9B958E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 3D model by furniture name, format, or asset URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-xs text-[#24211E] placeholder:text-[#9B958E] focus:outline-none focus:border-[#8B5E3C]"
            />
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="bg-white border border-[#E5E0DA] rounded-[16px] p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-[12px] bg-[#FAF9F7] border border-[#E5E0DA] overflow-hidden flex items-center justify-center">
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Box className="w-12 h-12 text-[#8B5E3C]/40" />
                  )}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge variant="ar" size="sm">
                      <Box className="w-3 h-3" />
                      <span>{asset.format.toUpperCase()} v{asset.version}</span>
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-base font-semibold text-[#24211E]">
                    {asset.productName}
                  </h3>
                  <p className="text-[10px] font-mono text-[#6F6A64] truncate mt-1">
                    {asset.modelUrl}
                  </p>
                </div>

                <div className="p-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] text-[11px] text-[#6F6A64] space-y-1">
                  <div className="flex justify-between">
                    <span>Bounding Box:</span>
                    <strong className="text-[#24211E]">{asset.widthCm} × {asset.heightCm} × {asset.depthCm} cm</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated File Size:</span>
                    <strong className="text-[#24211E]">{((asset.fileSize || 3800000) / (1024 * 1024)).toFixed(2)} MB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Render Pipeline:</span>
                    <strong className="text-[#2F7D50]">WebGL & WebXR</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E0DA] flex items-center justify-between">
                <Link href={`/visualize/${asset.productId || '1'}`} target="_blank" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-[#8B5E3C]/30 text-[#8B5E3C] hover:bg-[#F3E8DE]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch in 3D AR Studio</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
