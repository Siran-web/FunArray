'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import RoomViewer from '../../../components/visualization/RoomViewer';
import TransformControls from '../../../components/visualization/TransformControls';
import FurnitureToolbar from '../../../components/visualization/FurnitureToolbar';
import { useVisualizationStore } from '../../../store/visualizationStore';

export default function VisualizeProductPage() {
  const params = useParams();
  const productId = params?.productId as string;
  const { addFurniture, placedFurniture } = useVisualizationStore();

  useEffect(() => {
    if (productId && placedFurniture.every((f) => f.productId !== productId)) {
      addFurniture({
        id: `placed-${productId}-${Date.now()}`,
        productId: productId,
        name: `Furniture Piece (${productId})`,
        price: 349.99,
        modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 90, heightCm: 85, depthCm: 85 },
        color: 'grey',
        material: 'Premium Fabric',
      });
    }
  }, [productId]);

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <Link href="/products" className="text-xs text-amber-500 hover:underline inline-flex items-center gap-1 mb-2">
            ← Back to Catalog
          </Link>
          <h1 className="text-3xl font-light tracking-tight text-white">Visualizing Furniture in 3D Space</h1>
          <p className="text-xs text-stone-400 mt-1">Product Reference: <span className="font-mono text-amber-400">{productId}</span></p>
        </div>
      </div>

      <FurnitureToolbar />

      <div className="space-y-4">
        <RoomViewer />
        <TransformControls />
      </div>
    </div>
  );
}
