
'use client';

import React from 'react';

interface ARViewerProps {
  modelUrl: string;
  iosSrc?: string;
  productName: string;
}

export const ARViewer: React.FC<ARViewerProps> = ({ modelUrl, iosSrc, productName }) => {
  return (
    <div className="relative w-full aspect-square bg-stone-900 rounded-2xl flex flex-col items-center justify-center border border-stone-800 p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
        <span className="text-2xl text-amber-500">📱</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{productName} AR Experience</h3>
      <p className="text-xs text-stone-400 mt-2 max-w-sm">
        Place this real-scale furniture item right into your room using camera augmented reality.
      </p>
      <a
        href={modelUrl}
        rel="ar"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium text-sm shadow-lg hover:from-amber-500 hover:to-amber-600 transition"
      >
        <span>Launch WebXR AR Preview</span>
      </a>
    </div>
  );
};

export default ARViewer;
