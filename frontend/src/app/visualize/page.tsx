'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import RoomViewer from '../../components/visualization/RoomViewer';
import TransformControls from '../../components/visualization/TransformControls';
import FurnitureToolbar from '../../components/visualization/FurnitureToolbar';
import { useVisualizationStore } from '../../store/visualizationStore';

export default function VisualizeStudioPage() {
  const { placedFurniture, addFurniture } = useVisualizationStore();

  // Pre-populate with a starter armchair if empty
  useEffect(() => {
    if (placedFurniture.length === 0) {
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
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <Link href="/products" className="text-xs text-amber-500 hover:underline inline-flex items-center gap-1 mb-2">
            ← Browse Catalog
          </Link>
          <h1 className="text-3xl font-light tracking-tight text-white">3D Room Studio & AR Visualization</h1>
          <p className="text-sm text-stone-400 mt-1">
            Upload a photo of your living room, bedroom, or office to preview true-to-scale furniture models in 3D.
          </p>
        </div>
      </div>

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
  );
}
