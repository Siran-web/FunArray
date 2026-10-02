'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Product } from '@/types/product';
import { useCameraAR } from '@/hooks/useCameraAR';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { setupLightingAndEnvironment, LightingRig } from '../visualization/LightingEnvironment';
import { loadFurnitureModel } from '../visualization/ModelLoader';
import {
  Camera,
  RotateCw,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ShoppingBag,
  X,
  FlipHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
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
    surfaceState,
    surfaceConfidence,
    placement,
    isSupported,
    isWebXRSupported,
    errorMessage,
    videoRef,
    stream,
    startCameraSession,
    stopCameraSession,
    toggleCameraFacing,
    facingMode,
    placeFurniture,
    resetPlacement,
    setRotation,
    rotateBy,
    nudgePosition,
  } = useCameraAR();

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightingRigRef = useRef<LightingRig | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);

  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWebXRLoading, setIsWebXRLoading] = useState(false);

  // QuickLook USDZ / SceneViewer GLB URLs
  const glbUrl = product.model3D?.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const usdzUrl = product.model3D?.modelUrl?.replace(/\.glb$/i, '.usdz') || glbUrl;

  // Autostart camera session when mounted if supported
  useEffect(() => {
    if (isSupported && sessionState === 'idle') {
      startCameraSession();
    }

    return () => {
      stopCameraSession();
    };
  }, [isSupported]);

  // Setup WebGL 3D Overlay Scene for Live Camera Feed
  useEffect(() => {
    if (sessionState !== 'active' || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Realistic Mobile Camera Perspective (52° FOV, ~1.2m height, tilted down 18° to floor)
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.05, 30);
    camera.position.set(0, 1.25, 2.5);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // 3. WebGL Transparent Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting & Environment Rig
    const lightingRig = setupLightingAndEnvironment(scene, renderer);
    lightingRigRef.current = lightingRig;
    lightingRig.updatePreset('daylight');
    lightingRig.gridHelper.visible = false; // Hide grid in AR camera mode

    // 5. Load Product 3D Model
    let isMounted = true;
    const loadModel = async () => {
      try {
        const modelItem = {
          id: `ar-${product.id}`,
          productId: product.id,
          name: product.name,
          price: product.basePrice,
          modelUrl: glbUrl,
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          dimensions: product.dimensions,
          color: product.variants?.[0]?.color || 'grey',
          material: product.material,
        };

        const group = await loadFurnitureModel(modelItem);
        if (!isMounted) return;

        // Keep invisible until user taps to place or initial reticle detects floor
        group.visible = placement.isPlaced;
        scene.add(group);
        furnitureGroupRef.current = group;
      } catch (err) {
        console.error('Error loading AR model:', err);
      }
    };
    loadModel();

    // 6. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      lightingRig.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [sessionState, product]);

  // Synchronize Placement, Position, and Rotation
  useEffect(() => {
    if (!furnitureGroupRef.current) return;
    const group = furnitureGroupRef.current;

    group.visible = placement.isPlaced;

    // Convert screen nudge units to 3D world meters
    const worldX = placement.x * 0.0035;
    const worldZ = placement.y * 0.0035;
    group.position.set(worldX, 0, worldZ);
    group.rotation.y = THREE.MathUtils.degToRad(placement.rotation);
  }, [placement]);

  // Surface click to place furniture on floor
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;
    placeFurniture(clickX, clickY);
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  // Launch genuine native WebXR session if hardware supports it
  const handleLaunchWebXR = async () => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.requestSession) {
      setIsWebXRLoading(true);
      try {
        const session = await (navigator as any).xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay', 'light-estimation'],
          domOverlay: { root: document.body },
        });
        // WebXR session successfully started
        console.log('WebXR immersive-ar session started:', session);
      } catch (err) {
        console.warn('Native WebXR launch failed, continuing with browser camera AR:', err);
      } finally {
        setIsWebXRLoading(false);
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#1A1816] text-[#FAF9F7] border border-[#3A3632] flex flex-col items-center justify-center min-h-[520px]">
      {/* 1. ACTIVE LIVE CAMERA AR VIEW */}
      {sessionState === 'active' && (
        <div
          className="relative w-full h-[560px] sm:h-[620px] overflow-hidden select-none touch-none cursor-crosshair"
          onClick={handleViewportClick}
        >
          {/* Live WebRTC Camera Video Stream */}
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Environmental Gradient Filter */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

          {/* Three.js 3D WebGL AR Overlay Layer */}
          <div
            ref={canvasContainerRef}
            className="absolute inset-0 z-10 pointer-events-none"
          />

          {/* Top Status & Surface Detection HUD */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-auto z-20 gap-2">
            <div className="flex flex-wrap items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${
                surfaceState === 'locked' ? 'bg-emerald-400' :
                surfaceState === 'detected' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400 animate-ping'
              }`} />
              <span className="font-medium text-white">
                {surfaceState === 'locked' && 'Surface Locked (1:1 Physical Scale)'}
                {surfaceState === 'detected' && `Floor Plane Detected (${surfaceConfidence}%) • Tap to Place`}
                {surfaceState === 'searching' && 'Scanning Floor Surface...'}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-amber-300 font-semibold font-mono text-[11px]">
                {product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isWebXRSupported && (
                <button
                  onClick={handleLaunchWebXR}
                  disabled={isWebXRLoading}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-full text-xs shadow-md transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isWebXRLoading ? 'Opening...' : 'Immersive WebXR'}</span>
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCameraFacing();
                }}
                title="Switch Camera (Front/Rear)"
                className="p-2 bg-black/70 backdrop-blur-md hover:bg-black/90 rounded-full text-white border border-white/10 transition-colors shadow-md"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stopCameraSession();
                    onClose();
                  }}
                  className="p-2 bg-black/70 backdrop-blur-md hover:bg-black/90 rounded-full text-white border border-white/10 transition-colors shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Surface Grid Projection & Reticle Overlay (before placement) */}
          {!placement.isPlaced && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-72 h-40 border-2 border-dashed border-amber-400/60 rounded-[40%] bg-amber-400/10 [transform:rotateX(65deg)] flex items-center justify-center animate-pulse">
                  <div className="w-20 h-20 border border-amber-400/80 rounded-full flex items-center justify-center">
                    <Crosshair className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>
                <div className="bg-black/80 px-4 py-2 rounded-full backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-semibold shadow-xl flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Tap anywhere on the floor to position {product.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Control Panel */}
          <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2 z-20 pointer-events-auto">
            {/* Fine Position & Rotation Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateBy(-45);
                  }}
                  className="text-white hover:bg-white/15 text-xs px-2.5 h-8 gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5 [transform:scaleX(-1)]" />
                  <span>-45°</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateBy(45);
                  }}
                  className="text-white hover:bg-white/15 text-xs px-2.5 h-8 gap-1 font-semibold text-amber-300"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+45° ({placement.rotation}°)</span>
                </Button>

                <div className="h-4 w-px bg-white/20 mx-1" />

                {/* Micro-Nudge Controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgePosition(-10, 0);
                    }}
                    title="Nudge Left"
                    className="p-1.5 hover:bg-white/15 rounded text-white text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgePosition(0, -10);
                    }}
                    title="Nudge Forward"
                    className="p-1.5 hover:bg-white/15 rounded text-white text-xs"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgePosition(0, 10);
                    }}
                    title="Nudge Backward"
                    className="p-1.5 hover:bg-white/15 rounded text-white text-xs"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nudgePosition(10, 0);
                    }}
                    title="Nudge Right"
                    className="p-1.5 hover:bg-white/15 rounded text-white text-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetPlacement();
                  }}
                  className="text-stone-300 hover:text-white hover:bg-white/10 text-xs px-2.5 h-8 gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reposition</span>
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  size="sm"
                  className="bg-[#8B5E3C] hover:bg-[#A0704C] text-white font-semibold text-xs px-4 h-9 shadow-lg gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isAddedToCart ? 'Added to Bag!' : `Add to Cart • ${formatPrice(product.basePrice)}`}</span>
                </Button>
              </div>
            </div>

            {/* Privacy Guarantee Footer Tag */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 px-2">
              <div className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero persistence • Live frames processed in RAM only</span>
              </div>
              <span>Tap anywhere to place 3D model on detected floor</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. REQUESTING CAMERA PERMISSION */}
      {sessionState === 'requesting' && (
        <div className="p-8 text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Camera className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Initializing Surface Detection</h3>
            <p className="text-xs text-stone-400">
              Please click <strong>&quot;Allow&quot;</strong> in your browser prompt so FunArray can scan your floor plane and place {product.name} at true scale.
            </p>
          </div>
          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-[11px] text-stone-400 flex items-center gap-2 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Zero Persistence Guarantee: Camera frames are never recorded or stored on any server.</span>
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
              Camera permissions were blocked. You can allow camera access in your browser site settings or switch to our 2D/3D Room Photo Upload mode.
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
              Spatial Surface Detection AR
            </Badge>
            <h3 className="text-xl font-serif font-medium text-white">
              Place {product.name} on Your Floor
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              Scan your space to detect horizontal planes and view this piece with exact physical dimensions (<strong>{product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm</strong>).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => startCameraSession()}
              className="bg-[#8B5E3C] hover:bg-[#A0704C] text-white text-xs h-12 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold">Launch Surface AR</div>
                <div className="text-[10px] text-amber-200">Live Camera Reticle</div>
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

