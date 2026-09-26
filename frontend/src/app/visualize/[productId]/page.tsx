'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import RoomViewer from '../../../components/visualization/RoomViewer';
import TransformControls from '../../../components/visualization/TransformControls';
import FurnitureToolbar from '../../../components/visualization/FurnitureToolbar';
import ARViewer from '../../../components/visualization/ARViewer';

export default function VisualizeProductPage() {
  const params = useParams();
  const productId = params?.productId as string;

  return (
    <div className="min-h-screen bg-stone-950 text-white px-4 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-800">
        <div>
          <Link href="/products" className="text-xs text-stone-400 hover:text-white mb-2 inline-block">
            ← Back to Products
          </Link>
          <h1 className="text-2xl font-bold">Interactive AR / 3D Room Visualizer</h1>
          <p className="text-xs text-stone-400 mt-1">Item ID: {productId}</p>
        </div>
      </div>

      <FurnitureToolbar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <RoomViewer />
          <TransformControls />
        </div>

        <div>
          <ARViewer
            productName="Handcrafted Teakwood Lounge Chair"
            modelUrl="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
          />
        </div>
      </div>
    </div>
  );
}
