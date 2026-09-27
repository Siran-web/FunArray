
'use client';

import React, { useState } from 'react';
import { Camera, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARViewerProps {
  modelUrl: string;
  iosSrc?: string;
  productName: string;
  onLaunchCamera?: () => void;
}

export const ARViewer: React.FC<ARViewerProps> = ({ modelUrl, iosSrc, productName, onLaunchCamera }) => {
  const [copied, setCopied] = useState(false);
  const usdz = iosSrc || modelUrl?.replace(/\.glb$/i, '.usdz');

  return (
    <div className="relative w-full aspect-square max-h-[440px] bg-[#1A1816] rounded-2xl flex flex-col items-center justify-center border border-[#3A3632] p-6 text-center text-[#FAF9F7]">
      <div className="w-16 h-16 rounded-2xl bg-[#8B5E3C]/20 border border-[#8B5E3C]/40 flex items-center justify-center mb-4 text-[#D49A6A]">
        <Camera className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-serif font-medium text-white">{productName} Spatial AR</h3>
      <p className="text-xs text-stone-400 mt-2 max-w-sm leading-relaxed">
        Place this real-scale furniture item right into your room using camera augmented reality and WebXR surface detection.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        {onLaunchCamera ? (
          <Button
            onClick={onLaunchCamera}
            className="w-full bg-[#8B5E3C] hover:bg-[#A0704C] text-white text-xs h-10 gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera AR</span>
          </Button>
        ) : (
          <a
            href={modelUrl}
            rel="ar"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#A0704C] text-white font-medium text-xs shadow-lg transition"
          >
            <Camera className="w-4 h-4" />
            <span>Launch WebXR AR</span>
          </a>
        )}

        {usdz && (
          <a
            href={usdz}
            rel="ar"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>iOS QuickLook</span>
          </a>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1 text-[11px] text-stone-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Hardware video stream processed locally in browser RAM</span>
      </div>
    </div>
  );
};

export default ARViewer;
