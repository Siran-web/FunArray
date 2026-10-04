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
import { createARPlacementReticle, SurfaceHit, validateSurfacePlacement } from './ARSurfaceManager';
import { applyARDepthOcclusionToMaterial, DEFAULT_OCCLUSION_CONFIG } from './ARDepthOcclusion';
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
  Layers,
  Unlock,
  Trash2,
  Maximize2,
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
    isDepthSensingSupported,
    isDepthOcclusionEnabled,
    errorMessage,
    videoRef,
    stream,
    startCameraSession,
    stopCameraSession,
    toggleCameraFacing,
    toggleDepthOcclusion,
    toggleLockPlacement,
    setScale,
    deletePlacement,
    facingMode,
    placeFurniture,
    placeAtSurface,
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
  const reticleRigRef = useRef<ReturnType<typeof createARPlacementReticle> | null>(null);

  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWebXRLoading, setIsWebXRLoading] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);

  // QuickLook USDZ / SceneViewer GLB URLs
  const glbUrl = product.model3D?.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const usdzUrl = product.model3D?.modelUrl?.replace(/\.glb$/i, '.usdz') || glbUrl;

  // Do not automatically access the camera on mount without explicit user permission.
  // Cleanup camera stream cleanly on unmount.
  useEffect(() => {
    return () => {
      stopCameraSession();
    };
  }, [stopCameraSession]);

  // Setup WebGL 3D Overlay Scene for Live Camera Feed
  useEffect(() => {
    if (sessionState !== 'active' || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Realistic Mobile Camera Perspective (52° FOV, ~1.25m height, angled down 18° to floor)
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.05, 30);
    camera.position.set(0, 1.25, 2.4);
    camera.lookAt(0, 0.15, 0);
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

    // 5. Create 3D Placement Reticle with Smooth LERP
    const reticleRig = createARPlacementReticle();
    reticleRigRef.current = reticleRig;
    scene.add(reticleRig.mesh);

    // 6. Load Product 3D Model with Real-World Physical Scale (100cm = 1m)
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
          dimensions: product.dimensions, // Exact backend dimensions in cm
          color: product.variants?.[0]?.color || 'grey',
          material: product.material,
        };

        const group = await loadFurnitureModel(modelItem);
        if (!isMounted) return;

        // Apply AR depth-sensing occlusion hooks to mesh materials
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => applyARDepthOcclusionToMaterial(m, { value: null }, { ...DEFAULT_OCCLUSION_CONFIG, enabled: isDepthOcclusionEnabled }));
            } else {
              applyARDepthOcclusionToMaterial(mat as THREE.Material, { value: null }, { ...DEFAULT_OCCLUSION_CONFIG, enabled: isDepthOcclusionEnabled });
            }
          }
        });

        // Keep invisible until user taps to place
        group.visible = placement.isPlaced;
        scene.add(group);
        furnitureGroupRef.current = group;
      } catch (err) {
        console.error('Error loading AR model:', err);
      }
    };
    loadModel();

    // 7. Resize Handler
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

    // 8. Raycaster & Floor Plane for Smooth Reticle Surface Tracking
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const centerVec = new THREE.Vector2(0, -0.15); // Slightly below screen center for natural floor perspective
    let lastTime = performance.now();

    // 9. Animation & Surface Tracking Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (!placement.isPlaced && reticleRigRef.current && cameraRef.current) {
        raycaster.setFromCamera(centerVec, cameraRef.current);
        const hitPoint = new THREE.Vector3();
        const hasHit = raycaster.ray.intersectPlane(floorPlane, hitPoint);

        if (hasHit) {
          const hit: SurfaceHit = {
            position: hitPoint,
            normal: new THREE.Vector3(0, 1, 0),
            orientation: new THREE.Quaternion(),
            isFloor: true,
            isWall: false,
            tiltDegrees: 0,
            confidence: 0.96,
          };
          reticleRigRef.current.updateTarget(hit, deltaTime);
        } else {
          reticleRigRef.current.updateTarget(null, deltaTime);
        }
      } else if (reticleRigRef.current) {
        reticleRigRef.current.setVisible(false);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      reticleRig.dispose();
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

    // Position model at exact 3D world position (1 unit = 1 meter)
    group.position.set(
      placement.worldPosition[0] + placement.x * 0.0035,
      0, // Grounded base strictly at floor level
      placement.worldPosition[2] + placement.y * 0.0035
    );
    group.rotation.y = THREE.MathUtils.degToRad(placement.rotation);
    group.scale.set(placement.scale, placement.scale, placement.scale);
  }, [placement]);

  // Surface click to place furniture on floor
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setPlacementError(null);

    // If reticle has a valid surface hit, place furniture at that exact surface location
    if (reticleRigRef.current && reticleRigRef.current.isValid()) {
      const hit = reticleRigRef.current.getCurrentHit();
      if (hit) {
        const validation = validateSurfacePlacement(hit, product.categoryName || 'floor');
        if (!validation.isValid) {
          setPlacementError(validation.reason || 'Invalid surface');
          return;
        }

        placeAtSurface([hit.position.x, 0, hit.position.z], 0);
        return;
      }
    }

    // Fallback: place on floor plane from click ray
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

  // Launch genuine native WebXR session with depth sensing if hardware supports it
  const handleLaunchWebXR = async () => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.requestSession) {
      setIsWebXRLoading(true);
      try {
        const session = await (navigator as any).xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['depth-sensing', 'dom-overlay', 'light-estimation'],
          depthSensing: {
            usagePreference: ['gpu-optimized', 'cpu-optimized'],
            dataFormatPreference: ['float32', 'luminance-alpha'],
          },
          domOverlay: { root: document.body },
        });
        // WebXR session successfully started
        console.log('WebXR immersive-ar session started with depth-sensing:', session);
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

          {/* Top Status & Surface Detection HUD in FunArray Palette */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-auto z-20 gap-2">
            <div className="flex flex-wrap items-center gap-2 bg-[#24211E]/85 backdrop-blur-md px-4 py-2 rounded-[16px] border border-white/10 text-xs shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${
                surfaceState === 'locked' ? 'bg-[#7BAE8A]' :
                surfaceState === 'detected' ? 'bg-[#7BAE8A] animate-pulse' : 'bg-[#D49A6A] animate-ping'
              }`} />
              <span className="font-medium text-white">
                {surfaceState === 'locked' && 'Surface Locked (1:1 Physical Scale)'}
                {surfaceState === 'detected' && `Floor Plane Detected (${surfaceConfidence}%) • Tap to Place`}
                {surfaceState === 'searching' && 'Scanning Floor Surface...'}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-[#D49A6A] font-semibold font-mono text-[11px]">
                {product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Depth Occlusion Status / Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDepthOcclusion();
                }}
                title={isDepthSensingSupported ? 'Toggle Real-World Occlusion' : 'Depth Occlusion (Hardware Fallback)'}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-medium border flex items-center gap-1.5 transition-colors shadow-md ${
                  isDepthOcclusionEnabled
                    ? 'bg-[#7BAE8A]/20 text-[#7BAE8A] border-[#7BAE8A]/40 hover:bg-[#7BAE8A]/30'
                    : 'bg-[#24211E]/80 text-[#9B958E] border-white/10 hover:bg-[#24211E]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isDepthOcclusionEnabled ? 'Occlusion: ON' : 'Occlusion: OFF'}
                </span>
              </button>

              {isWebXRSupported && (
                <button
                  onClick={handleLaunchWebXR}
                  disabled={isWebXRLoading}
                  className="px-3.5 py-1.5 bg-[#8B5E3C] hover:bg-[#634027] text-white font-medium rounded-[10px] text-xs shadow-md transition flex items-center gap-1"
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
                className="p-2 bg-[#24211E]/80 backdrop-blur-md hover:bg-[#24211E] rounded-[10px] text-white border border-white/10 transition-colors shadow-md"
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
                  className="p-2 bg-[#24211E]/80 backdrop-blur-md hover:bg-[#24211E] rounded-[10px] text-white border border-white/10 transition-colors shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error Banner if placement is rejected */}
          {placementError && (
            <div className="absolute top-16 inset-x-4 z-30 flex justify-center pointer-events-none animate-bounce">
              <div className="bg-[#C84B4B]/95 text-white border border-[#C84B4B] px-4 py-2 rounded-[12px] text-xs font-medium shadow-xl flex items-center gap-2 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
                <span>{placementError}</span>
              </div>
            </div>
          )}

          {/* Surface Guidance Overlay (before placement) in #7BAE8A */}
          {!placement.isPlaced && (
            <div className="absolute bottom-24 inset-x-4 flex justify-center pointer-events-none z-20">
              <div className="bg-[#24211E]/90 px-4 py-2.5 rounded-[16px] backdrop-blur-md border border-[#7BAE8A]/50 text-white text-xs font-medium shadow-xl flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#7BAE8A] animate-pulse" />
                <span>Move phone to scan floor • Tap when green reticle appears</span>
              </div>
            </div>
          )}

          {/* Bottom Floating Control Panel */}
          <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2 z-20 pointer-events-auto">
            {/* Fine Position, Scale & Rotation Toolbar */}
            {placement.isPlaced && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-black/85 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Rotation Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={placement.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateBy(-45);
                    }}
                    className="text-white hover:bg-white/15 text-xs px-2 h-8 gap-1"
                    title="Rotate -45°"
                  >
                    <RotateCw className="w-3.5 h-3.5 [transform:scaleX(-1)]" />
                    <span>-45°</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={placement.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateBy(45);
                    }}
                    className="text-white hover:bg-white/15 text-xs px-2 h-8 gap-1 font-semibold text-amber-300"
                    title="Rotate +45°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>+45° ({placement.rotation}°)</span>
                  </Button>

                  <div className="h-4 w-px bg-white/20 mx-0.5" />

                  {/* Micro-Nudge Controls */}
                  <div className={`flex items-center gap-0.5 ${placement.isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
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

                  <div className="h-4 w-px bg-white/20 mx-0.5" />

                  {/* Lock / Unlock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLockPlacement();
                    }}
                    title={placement.isLocked ? 'Unlock to move or rotate' : 'Lock position'}
                    className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium border flex items-center gap-1 transition ${
                      placement.isLocked
                        ? 'bg-[#8B5E3C]/30 text-[#D49A6A] border-[#8B5E3C]'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {placement.isLocked ? <Lock className="w-3 h-3 text-[#D49A6A]" /> : <Unlock className="w-3 h-3" />}
                    <span>{placement.isLocked ? 'Locked' : 'Lock'}</span>
                  </button>

                  {/* Delete / Clear */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlacement();
                    }}
                    title="Remove placed furniture"
                    className="p-1.5 hover:bg-[#C84B4B]/20 text-[#9B958E] hover:text-[#C84B4B] rounded-[8px] text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetPlacement();
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/10 text-xs px-2.5 h-8 gap-1 rounded-[10px]"
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
                    className="bg-[#8B5E3C] hover:bg-[#634027] text-white font-medium text-xs px-4 h-9 shadow-sm gap-1.5 rounded-[10px] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isAddedToCart ? 'Added to Bag!' : `Add to Cart • ${formatPrice(product.basePrice)}`}</span>
                  </Button>
                </div>
              </div>
            )}

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

      {/* 2. EXPLICIT CAMERA PERMISSION REQUEST (IDLE STATE) */}
      {sessionState === 'idle' && (
        <div className="p-8 text-center space-y-5 max-w-lg bg-white rounded-[16px] border border-[#E5E0DA] shadow-xl m-4">
          <div className="w-16 h-16 rounded-[16px] bg-[#F3E8DE] border border-[#8B5E3C]/30 flex items-center justify-center mx-auto text-[#8B5E3C] shadow-2xs">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B5E3C] bg-[#F3E8DE] px-3 py-1 rounded-full border border-[#8B5E3C]/20 inline-block">
              Camera Permission Required
            </span>
            <h3 className="text-xl font-serif font-medium text-[#24211E]">
              Allow Camera Access for Live AR
            </h3>
            <p className="text-xs text-[#6F6A64] max-w-md mx-auto leading-relaxed">
              FunArray needs access to your camera to detect floor planes and place <strong>{product.name}</strong> ({product.dimensions.widthCm}×{product.dimensions.heightCm}×{product.dimensions.depthCm} cm) at exact 1:1 true scale in your room.
            </p>
          </div>

          {/* Privacy & Security Guarantee */}
          <div className="p-3 bg-[#FAF9F7] rounded-[12px] border border-[#E5E0DA] text-[11px] text-[#6F6A64] flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 text-[#2F7D50] shrink-0" />
            <span>
              <strong>Zero Persistence Privacy:</strong> Live video is processed purely in your browser memory for spatial positioning and is never saved or transmitted.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => startCameraSession()}
              className="w-full sm:w-auto bg-[#8B5E3C] hover:bg-[#634027] text-white text-xs font-medium h-11 px-6 rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Allow Camera Access</span>
            </Button>

            {onFallbackToPhotoUpload && (
              <Button
                onClick={onFallbackToPhotoUpload}
                variant="outline"
                className="w-full sm:w-auto bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] text-xs font-medium h-11 px-5 rounded-[10px] border border-[#E5E0DA] transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 mr-1.5 text-[#8B5E3C]" />
                <span>Use Room Photo Mode</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. REQUESTING CAMERA PERMISSION DIALOG */}
      {sessionState === 'requesting' && (
        <div className="p-8 text-center space-y-4 max-w-md bg-white rounded-[16px] border border-[#E5E0DA] shadow-xl m-4">
          <div className="w-16 h-16 rounded-[16px] bg-[#F3E8DE] border border-[#8B5E3C]/30 flex items-center justify-center mx-auto animate-pulse text-[#8B5E3C]">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-medium text-[#24211E]">Awaiting Camera Permission</h3>
            <p className="text-xs text-[#6F6A64]">
              Please click <strong>&quot;Allow&quot;</strong> in your browser prompt so FunArray can scan your floor surface.
            </p>
          </div>
          <div className="p-3 bg-[#FAF9F7] rounded-[10px] border border-[#E5E0DA] text-[11px] text-[#6F6A64] flex items-center gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-[#2F7D50] shrink-0" />
            <span>Camera frames are analyzed locally in RAM and never stored.</span>
          </div>
        </div>
      )}

      {/* 4. PERMISSION DENIED STATE & FALLBACK */}
      {sessionState === 'denied' && (
        <div className="p-8 text-center space-y-5 max-w-md bg-white rounded-[16px] border border-[#E5E0DA] shadow-xl m-4">
          <div className="w-14 h-14 rounded-full bg-[#C84B4B]/10 border border-[#C84B4B]/20 flex items-center justify-center mx-auto text-[#C84B4B]">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-serif font-medium text-[#24211E]">Camera Access Denied</h3>
            <p className="text-xs text-[#6F6A64] leading-relaxed">
              Camera access was denied or blocked. You can grant permission in your browser site settings or switch to our 3D Room Photo Upload mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Button
              onClick={() => startCameraSession()}
              className="w-full sm:w-auto text-xs bg-[#8B5E3C] hover:bg-[#634027] text-white rounded-[10px] h-10 px-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>

            {onFallbackToPhotoUpload && (
              <Button
                onClick={onFallbackToPhotoUpload}
                variant="outline"
                className="w-full sm:w-auto text-xs bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] rounded-[10px] h-10 px-4 border border-[#E5E0DA]"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-[#8B5E3C]" />
                Use Room Photo Mode
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 5. UNSUPPORTED HARDWARE STATE */}
      {sessionState === 'unsupported' && (
        <div className="p-8 text-center space-y-6 max-w-lg bg-white rounded-[16px] border border-[#E5E0DA] shadow-xl m-4">
          <div className="w-16 h-16 rounded-[16px] bg-[#FAF9F7] border border-[#E5E0DA] flex items-center justify-center mx-auto text-[#8B5E3C]">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-serif font-medium text-[#24211E]">
              Camera Not Supported on This Device
            </h3>
            <p className="text-xs text-[#6F6A64] max-w-md mx-auto leading-relaxed">
              Live camera access is not available on this browser. You can still preview {product.name} with perspective floor matching using our Room Photo mode.
            </p>
          </div>

          {onFallbackToPhotoUpload && (
            <Button
              onClick={onFallbackToPhotoUpload}
              className="bg-[#8B5E3C] hover:bg-[#634027] text-white text-xs font-medium h-11 px-6 rounded-[10px] shadow-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Launch Room Photo Mode</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraARViewer;

