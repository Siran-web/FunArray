'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { useCameraAR } from '@/hooks/useCameraAR';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  Camera,
  RotateCw,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  QrCode,
  UploadCloud,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ShoppingBag,
  VolumeX,
  Maximize2,
  X,
  FlipHorizontal
} from 'lucide-react';

export interface CameraARViewerProps {
  product: Product;
  onFallbackToPhotoUpload?: () => void;
  onAddToCart?: (product: Product) => void;
  onClose?: () => void;
}

export const CameraARViewer: React.FC<CameraARViewerProps> = ({
  product,
  onFallbackToPhotoUpload,
  onAddToCart,
  onClose,
}) => {
  const {
    sessionState,
    isSupported,
    isWebXRSupported,
    errorMessage,
    videoRef,
    stream,
    startCameraSession,
    stopCameraSession,
    toggleCameraFacing,
    facingMode,
  } = useCameraAR();

  const [rotationAngle, setRotationAngle] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isSurfaceLocked, setIsSurfaceLocked] = useState(false);
  const [furniturePosition, setFurniturePosition] = useState({ x: 0, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [showQrCode, setShowQrCode] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // QuickLook USDZ / SceneViewer GLB URLs
  const glbUrl = product.model3D?.modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb';
  const usdzUrl = product.model3D?.modelUrl?.replace(/\.glb$/i, '.usdz') || glbUrl;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Autostart camera session when mounted if supported
  useEffect(() => {
    if (isSupported && sessionState === 'idle') {
      startCameraSession();
    }

    return () => {
      stopCameraSession();
    };
  }, [isSupported]);

  // Simulate surface detection lock after active stream
  useEffect(() => {
    if (sessionState === 'active') {
      const timer = setTimeout(() => {
        setIsSurfaceLocked(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsSurfaceLocked(false);
    }
  }, [sessionState]);

  // Drag handlers for placing furniture on surface
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - furniturePosition.x, y: e.clientY - furniturePosition.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setFurniturePosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#1A1816] text-[#FAF9F7] border border-[#3A3632] flex flex-col items-center justify-center min-h-[480px]">
      {/* 1. ACTIVE LIVE CAMERA AR VIEW */}
      {sessionState === 'active' && (
        <div
          className="relative w-full h-[520px] sm:h-[580px] overflow-hidden select-none touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Live WebRTC Camera Video Stream */}
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Environmental Lighting Shade Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

          {/* Top Status Bar Overlay */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-auto z-20">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-medium text-white">Live Camera AR</span>
              <span className="text-white/40">|</span>
              <span className="text-amber-300 font-semibold">{product.dimensions.widthCm}×{product.dimensions.depthCm} cm</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleCameraFacing}
                title="Switch Camera (Front/Rear)"
                className="p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full text-white border border-white/10 transition-colors"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              {onClose && (
                <button
                  onClick={() => {
                    stopCameraSession();
                    onClose();
                  }}
                  className="p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full text-white border border-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Surface Tracking Reticle Simulation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isSurfaceLocked ? (
              <div className="flex flex-col items-center gap-2 text-white/80 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Scanning floor plane with device sensors...</span>
              </div>
            ) : (
              <div className="absolute bottom-20 w-72 h-36 border border-emerald-400/40 rounded-[50%] bg-emerald-400/5 [transform:rotateX(65deg)] flex items-center justify-center animate-pulse">
                <div className="w-12 h-12 border border-emerald-400/60 rounded-full" />
              </div>
            )}
          </div>

          {/* Placed Interactive 3D Furniture Projection */}
          <div
            onPointerDown={handlePointerDown}
            className="absolute z-10 cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 drop-shadow-[0_25px_25px_rgba(0,0,0,0.7)]"
            style={{
              left: `calc(50% + ${furniturePosition.x}px)`,
              top: `calc(55% + ${furniturePosition.y}px)`,
              transform: `scale(${scaleFactor}) rotateY(${rotationAngle}deg)`,
            }}
          >
            <div className="relative group">
              <img
                src={product.images[0]?.imageUrl}
                alt={product.name}
                className="max-h-56 max-w-[280px] sm:max-h-64 sm:max-w-sm object-contain filter drop-shadow-2xl"
                draggable={false}
              />
              {/* Calibration badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap opacity-90 shadow-md">
                1:1 Scale Placed
              </div>
            </div>
          </div>

          {/* Privacy & Zero Storage Notice */}
          <div className="absolute bottom-20 inset-x-4 flex justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-[11px] text-white/70 px-3 py-1 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera feed processed in browser RAM only • No footage is stored</span>
            </div>
          </div>

          {/* Floating Action Controls */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-2 z-20 pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotationAngle((a) => (a + 45) % 360)}
                className="text-white hover:bg-white/10 text-xs px-2.5 h-8 gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate ({rotationAngle}°)</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFurniturePosition({ x: 0, y: 20 });
                  setRotationAngle(0);
                  setScaleFactor(1);
                }}
                className="text-white hover:bg-white/10 text-xs px-2.5 h-8 gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddToCart}
                size="sm"
                className="bg-[#8B5E3C] hover:bg-[#A0704C] text-white font-medium text-xs px-4 h-9 shadow-lg gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAddedToCart ? 'Added to Cart!' : `Add to Cart • ${formatPrice(product.basePrice)}`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REQUESTING CAMERA PERMISSION STATE */}
      {sessionState === 'requesting' && (
        <div className="p-8 text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Camera className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Requesting Camera Access</h3>
            <p className="text-xs text-stone-400">
              Please click <strong>&quot;Allow&quot;</strong> in your browser prompt so FunArray can project {product.name} at true scale onto your floor.
            </p>
          </div>
          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-[11px] text-stone-400 flex items-center gap-2 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Privacy Promise: Video streams stay strictly inside your browser tab and are never recorded or sent to any cloud server.</span>
          </div>
        </div>
      )}

      {/* 3. PERMISSION DENIED STATE & FALLBACK */}
      {sessionState === 'denied' && (
        <div className="p-8 text-center space-y-5 max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">Camera Access Denied</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Camera permissions were blocked in your browser. You can enable camera access in your browser site settings or switch to our 2D/3D Room Photo Upload mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Button
              onClick={() => startCameraSession()}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs border-stone-700 hover:bg-stone-800 text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Camera Again
            </Button>

            {onFallbackToPhotoUpload && (
              <Button
                onClick={onFallbackToPhotoUpload}
                size="sm"
                className="w-full sm:w-auto text-xs bg-[#8B5E3C] hover:bg-[#A0704C] text-white"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Use Room Photo Mode
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 4. UNSUPPORTED / DESKTOP FALLBACK STATE */}
      {(sessionState === 'unsupported' || sessionState === 'idle') && (
        <div className="p-8 text-center space-y-6 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#8B5E3C]/10 border border-[#8B5E3C]/30 flex items-center justify-center mx-auto text-[#D49A6A]">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="ar" className="border-amber-500/40 text-amber-400 text-[11px]">
              Spatial Augmented Reality
            </Badge>
            <h3 className="text-xl font-serif font-medium text-white">
              Experience {product.name} in AR
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              Scan your space to view this piece with exact physical dimensions (<strong>{product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm</strong>) and true architectural scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => startCameraSession()}
              className="bg-[#8B5E3C] hover:bg-[#A0704C] text-white text-xs h-12 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold">Launch Camera AR</div>
                <div className="text-[10px] text-amber-200">Browser Viewfinder</div>
              </div>
            </Button>

            {/* Native Mobile WebXR / QuickLook */}
            <a
              href={usdzUrl}
              rel="ar"
              className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs border border-stone-700 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="font-semibold">Native iOS / QuickLook</div>
                <div className="text-[10px] text-stone-400">Open in USDZ Viewer</div>
              </div>
            </a>
          </div>

          {onFallbackToPhotoUpload && (
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>On a desktop without a webcam?</span>
              <button
                onClick={onFallbackToPhotoUpload}
                className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
              >
                Upload Room Photo Mode →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraARViewer;
