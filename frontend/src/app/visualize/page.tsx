'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RoomViewer from '../../components/visualization/RoomViewer';
import FurnitureControls from '../../components/visualization/FurnitureControls';
import FurnitureToolbar from '../../components/visualization/FurnitureToolbar';
import { useVisualizationStore } from '../../store/visualizationStore';
import { designApi } from '../../services/designApi';

function StudioContent() {
  const searchParams = useSearchParams();
  const designId = searchParams.get('designId') || searchParams.get('session');

  const {
    placedFurniture,
    addFurniture,
    loadScene,
    setDesignName,
    setCurrentDesignId,
    designName,
    currentDesignId,
  } = useVisualizationStore();

  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing design if designId query parameter is present
  useEffect(() => {
    if (designId) {
      setIsLoadingDesign(true);
      setLoadError(null);
      designApi
        .getDesignById(designId)
        .then((design) => {
          if (design) {
            let items = [];
            try {
              items = JSON.parse(design.sceneData || '[]');
            } catch (err) {
              console.warn('Could not parse saved scene data:', err);
            }
            loadScene(items, design.roomImageUrl, design.roomImageId);
            setDesignName(design.name);
            setCurrentDesignId(design.id);
          }
        })
        .catch((err) => {
          console.warn('Failed to load saved design:', err);
          setLoadError('Could not restore design. It may have been deleted or belong to another account.');
        })
        .finally(() => {
          setIsLoadingDesign(false);
        });
    } else if (placedFurniture.length === 0) {
      // Pre-populate with a starter armchair if opening fresh canvas
      addFurniture({
        id: 'starter-armchair',
        productId: 'prod-nordic-armchair',
        name: 'Nordic Fabric Armchair',
        price: 299.99,
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
        previewImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
        position: [0, 0, 0],
        rotation: [0, -15, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
        color: 'grey',
        material: 'Oak & Fabric',
      });
    }
  }, [designId]);

  return (
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] text-[#24211E] flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 overflow-y-auto overflow-x-hidden no-scrollbar space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0DA]">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <Link href="/products" className="text-[#8B5E3C] hover:underline inline-flex items-center gap-1 font-medium">
                ← Browse Catalog
              </Link>
              <span className="text-[#9B958E]">•</span>
              <Link href="/designs" className="text-[#6F6A64] hover:text-[#8B5E3C] hover:underline">
                My Saved Designs
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-[#24211E] flex items-center gap-3">
              <span>3D Room Studio & AR Visualization</span>
              {currentDesignId && (
                <span className="text-xs px-2.5 py-1 bg-[#F3E8DE] text-[#8B5E3C] border border-[#8B5E3C]/30 rounded-full font-medium">
                  Editing: {designName}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[#6F6A64] mt-1">
              Upload a photograph of your living space or room to preview true-to-scale architectural furniture in 3D.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/designs"
              className="px-4 py-2 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>🛋️ View My Designs</span>
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="p-3 bg-[#C84B4B]/10 border border-[#C84B4B]/30 rounded-[12px] text-xs text-[#C84B4B] flex items-center justify-between font-medium">
            <span>{loadError}</span>
            <button onClick={() => setLoadError(null)} className="text-[#C84B4B] hover:opacity-75">✕</button>
          </div>
        )}

        {isLoadingDesign && (
          <div className="p-3 bg-[#FAF9F7] border border-[#E5E0DA] rounded-[12px] text-xs text-[#8B5E3C] flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
            <span>Restoring saved furniture scene & transforms...</span>
          </div>
        )}

        {/* Toolbar Controls */}
        <FurnitureToolbar />

        {/* Main Studio Canvas & Inspector */}
        <div className="space-y-4">
          <div className="rounded-[16px] overflow-hidden border border-[#E5E0DA] bg-white shadow-sm">
            <RoomViewer />
          </div>
          <FurnitureControls />
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#E5E0DA] text-xs text-[#6F6A64]">
          <div className="p-4 bg-white rounded-[16px] border border-[#E5E0DA] shadow-2xs space-y-1">
            <div className="font-semibold text-[#24211E] flex items-center gap-1.5">
              <span>📸 Photo Background Matching</span>
            </div>
            <p className="text-[#6F6A64] leading-relaxed">
              Upload any room image to test furniture placement directly inside your living space with calibrated perspective.
            </p>
          </div>
          <div className="p-4 bg-white rounded-[16px] border border-[#E5E0DA] shadow-2xs space-y-1">
            <div className="font-semibold text-[#24211E] flex items-center gap-1.5">
              <span>📏 True-to-Scale Dimensions</span>
            </div>
            <p className="text-[#6F6A64] leading-relaxed">
              Every architectural piece is constructed to exact centimeter specifications to verify real-world spatial fit.
            </p>
          </div>
          <div className="p-4 bg-white rounded-[16px] border border-[#E5E0DA] shadow-2xs space-y-1">
            <div className="font-semibold text-[#24211E] flex items-center gap-1.5">
              <span>🛋️ Multi-Item Arrangements</span>
            </div>
            <p className="text-[#6F6A64] leading-relaxed">
              Combine sofas, armchairs, coffee tables, and wardrobes to plan your complete dream room aesthetic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisualizeStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAF9F7] flex items-center justify-center text-[#24211E]">
          <div className="w-10 h-10 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mb-4" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
