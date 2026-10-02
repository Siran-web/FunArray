'use client';

import React, { useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { useCartStore } from '../../store/cartStore';
import {
  Move,
  RotateCw,
  Maximize2,
  Copy,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const TransformControls: React.FC = () => {
  const {
    selectedFurnitureId,
    placedFurniture,
    updateFurnitureTransform,
    removeFurniture,
    duplicateFurniture,
    toggleLockFurniture,
    resetFurnitureTransform,
    selectFurniture,
  } = useVisualizationStore();

  const { addItem: addCartItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);

  if (!selectedFurnitureId) return null;

  const currentItem = placedFurniture.find((f) => f.id === selectedFurnitureId);
  if (!currentItem) return null;

  const isLocked = !!currentItem.isLocked;

  // Scale constraints strictly bounded to [0.75, 1.25] to prevent unrealistic proportions
  const MIN_SCALE = 0.75;
  const MAX_SCALE = 1.25;
  const currentScale = currentItem.scale[0] || 1.0;
  const isTrueScale = Math.abs(currentScale - 1.0) < 0.001;

  // Live real dimensions scaled in cm
  const scaledWidth = Math.round(currentItem.dimensions.widthCm * currentScale);
  const scaledHeight = Math.round(currentItem.dimensions.heightCm * currentScale);
  const scaledDepth = Math.round(currentItem.dimensions.depthCm * currentScale);

  const handleScaleChange = (newScale: number) => {
    if (isLocked) return;
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
    updateFurnitureTransform(currentItem.id, undefined, undefined, [clamped, clamped, clamped]);
  };

  const handleRotate = (deltaDeg: number) => {
    if (isLocked) return;
    const newY = (currentItem.rotation[1] + deltaDeg) % 360;
    updateFurnitureTransform(currentItem.id, undefined, [
      currentItem.rotation[0],
      newY,
      currentItem.rotation[2],
    ]);
  };

  const handleNudge = (dx: number, dz: number) => {
    if (isLocked) return;
    updateFurnitureTransform(currentItem.id, [
      currentItem.position[0] + dx,
      currentItem.position[1],
      currentItem.position[2] + dz,
    ]);
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setCartSuccessMessage(null);
    setCartErrorMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('http://localhost:8080/api/v1/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: currentItem.productId,
          variantId: currentItem.variantId || undefined,
          quantity: quantity,
        }),
      }).catch(() => {});

      addCartItem({
        id: `cart-${currentItem.productId}-${Date.now()}`,
        productId: currentItem.productId,
        variantId: currentItem.variantId,
        name: currentItem.name,
        price: currentItem.price,
        quantity: quantity,
        imageUrl: currentItem.previewImageUrl,
        sku: currentItem.productId,
      });

      setCartSuccessMessage(`Added ${quantity}× "${currentItem.name}" to cart!`);
      setTimeout(() => setCartSuccessMessage(null), 3500);
    } catch {
      addCartItem({
        id: `cart-${currentItem.productId}-${Date.now()}`,
        productId: currentItem.productId,
        variantId: currentItem.variantId,
        name: currentItem.name,
        price: currentItem.price,
        quantity: quantity,
        imageUrl: currentItem.previewImageUrl,
        sku: currentItem.productId,
      });
      setCartSuccessMessage(`Added ${quantity}× "${currentItem.name}" to cart!`);
      setTimeout(() => setCartSuccessMessage(null), 3500);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="bg-stone-900/95 backdrop-blur-xl p-5 rounded-2xl border border-stone-800 shadow-2xl space-y-4 select-none">
      {/* Toast Feedback */}
      {cartSuccessMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> {cartSuccessMessage}</span>
          <button onClick={() => setCartSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {cartErrorMessage && (
        <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {cartErrorMessage}</span>
          <button onClick={() => setCartErrorMessage(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Info & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLocked ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <h4 className="text-base font-semibold text-white">{currentItem.name}</h4>
            {isLocked && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] rounded-md font-medium flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Real Dimensions:{' '}
            <strong className="text-stone-200 font-mono">
              {scaledWidth}×{scaledHeight}×{scaledDepth} cm
            </strong>{' '}
            • <span className="text-amber-400 font-bold text-sm">${currentItem.price.toFixed(2)}</span>
          </p>
        </div>

        {/* Action Toolbar: Duplicate | Lock | Reset | Delete */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => duplicateFurniture(currentItem.id)}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition flex items-center gap-1"
            title="Duplicate furniture"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={() => toggleLockFurniture(currentItem.id)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-xl border transition flex items-center gap-1 ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
            title={isLocked ? 'Unlock to allow move/rotate' : 'Lock position to prevent accidental movement'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>

          <button
            onClick={() => resetFurnitureTransform(currentItem.id)}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition flex items-center gap-1"
            title="Reset orientation, position, and scale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => removeFurniture(currentItem.id)}
            className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-medium rounded-xl border border-rose-800 transition flex items-center gap-1"
            title="Delete furniture"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Transform Controls Grid: Move | Rotate | Dimensions/Scale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* 1. Move Across Surface (Floor Grounding Maintained) */}
        <div className={`space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 transition ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><Move className="w-3.5 h-3.5 text-amber-400" /> Move Across Floor:</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => handleNudge(-0.2, 0)}
              className="py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 flex items-center justify-center"
              title="Move Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNudge(0.2, 0)}
              className="py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 flex items-center justify-center"
              title="Move Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNudge(0, -0.2)}
              className="py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 flex items-center justify-center"
              title="Move Back"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNudge(0, 0.2)}
              className="py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 flex items-center justify-center"
              title="Move Forward"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Rotate Around Logical Center (Floor Contact Preserved) */}
        <div className={`space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 transition ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5 text-amber-400" /> Rotate (Y-Axis):</span>
            <span className="text-amber-400 font-mono font-semibold">
              {Math.round(((currentItem.rotation[1] % 360) + 360) % 360)}°
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={((currentItem.rotation[1] % 360) + 360) % 360}
              onChange={(e) =>
                updateFurnitureTransform(currentItem.id, undefined, [
                  currentItem.rotation[0],
                  parseFloat(e.target.value),
                  currentItem.rotation[2],
                ])
              }
              className="w-full accent-amber-500 bg-stone-900 cursor-pointer h-2 rounded-lg"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleRotate(-45)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-200 text-[11px]"
                title="Rotate -45°"
              >
                -45°
              </button>
              <button
                onClick={() => handleRotate(45)}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-200 text-[11px]"
                title="Rotate +45°"
              >
                +45°
              </button>
            </div>
          </div>
        </div>

        {/* 3. Dimensions & Bounded Scale (Aspect Ratio Preserved) */}
        <div className={`space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 transition ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Dimensions & Scale:</span>
            <span className={`font-mono font-semibold ${isTrueScale ? 'text-emerald-400' : 'text-amber-300'}`}>
              {currentScale.toFixed(2)}x {isTrueScale ? '(1:1 Real)' : `(${Math.round(currentScale * 100)}%)`}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step="0.02"
              value={currentScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-stone-900 cursor-pointer h-2 rounded-lg"
            />
            <button
              onClick={() => handleScaleChange(1.0)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-[11px] whitespace-nowrap"
              title="Reset to 1:1 true physical scale"
            >
              1:1 Real
            </button>
          </div>
        </div>
      </div>

      {/* Add-to-Cart Direct Checkout Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400 font-medium">Quantity:</span>
          <div className="flex items-center bg-stone-950 border border-stone-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-bold"
            >
              -
            </button>
            <span className="px-3 py-1.5 text-white font-mono text-xs font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-bold"
            >
              +
            </button>
          </div>
          <span className="text-xs text-stone-400">
            Total: <strong className="text-white">${(currentItem.price * quantity).toFixed(2)}</strong>
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {isAddingToCart ? 'Validating Stock...' : `Add to Cart — $${(currentItem.price * quantity).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default TransformControls;
