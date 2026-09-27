'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RoomViewer from '../../components/visualization/RoomViewer';
import TransformControls from '../../components/visualization/TransformControls';
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
        modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
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
    <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-stone-950 text-white flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 overflow-y-auto overflow-x-hidden no-scrollbar space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <Link href="/products" className="text-amber-500 hover:underline inline-flex items-center gap-1">
                ← Browse Catalog
              </Link>
              <span className="text-stone-600">•</span>
              <Link href="/designs" className="text-stone-400 hover:text-amber-400 hover:underline">
                My Saved Designs
              </Link>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
              <span>3D Room Studio & AR Visualization</span>
              {currentDesignId && (
                <span className="text-xs px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-mono">
                  Editing: {designName}
                </span>
              )}
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              Upload a photo of your living room, bedroom, or office to preview true-to-scale furniture models in 3D.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/designs"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold rounded-xl border border-stone-800 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🛋️ View My Designs</span>
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
            <span>{loadError}</span>
            <button onClick={() => setLoadError(null)} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {isLoadingDesign && (
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl text-xs text-amber-400 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Restoring saved furniture scene & transforms...</span>
          </div>
        )}

        {/* Toolbar Controls */}
        <FurnitureToolbar />

        {/* Main Studio Canvas & Inspector */}
        <div className="space-y-4">
          <RoomViewer />
          <TransformControls />
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-stone-800/80 text-xs text-stone-400">
          <div className="p-4 bg-stone-900/40 rounded-xl border border-stone-800/60">
            <div className="font-semibold text-white mb-1">📸 Photo Background Matching</div>
            Upload any room image to test furniture placement in your actual living space.
          </div>
          <div className="p-4 bg-stone-900/40 rounded-xl border border-stone-800/60">
            <div className="font-semibold text-white mb-1">📏 True-to-Scale Dimensions</div>
            Every piece is built to exact centimeter specifications to verify fit before purchasing.
          </div>
          <div className="p-4 bg-stone-900/40 rounded-xl border border-stone-800/60">
            <div className="font-semibold text-white mb-1">🛋️ Multi-Item Arrangements</div>
            Combine sofas, armchairs, and tables to plan your entire dream room layout.
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
        <div className="h-full h-[100dvh] w-full max-w-full overflow-hidden bg-stone-950 flex items-center justify-center text-white">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
