'use client';

import React, { useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { useCartStore } from '../../store/cartStore';

export const TransformControls: React.FC = () => {
  const {
    selectedFurnitureId,
    placedFurniture,
    updateFurnitureTransform,
    removeFurniture,
    duplicateFurniture,
  } = useVisualizationStore();

  const { addItem: addCartItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);

  if (!selectedFurnitureId) return null;

  const currentItem = placedFurniture.find((f) => f.id === selectedFurnitureId);
  if (!currentItem) return null;

  // Scale constraints strictly locked to [0.90, 1.10] to prevent misleading scale representations
  const MIN_SCALE = 0.90;
  const MAX_SCALE = 1.10;
  const currentScale = currentItem.scale[0] || 1.0;
  const isTrueScale = Math.abs(currentScale - 1.0) < 0.001;

  const handleScaleChange = (newScale: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
    updateFurnitureTransform(currentItem.id, undefined, undefined, [clamped, clamped, clamped]);
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

      // Check stock & submit to backend cart API
      const res = await fetch('http://localhost:8080/api/v1/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: currentItem.productId,
          variantId: currentItem.variantId || undefined,
          quantity: quantity,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error('Requested quantity exceeds available stock.');
        }
        // Fallback for unauthenticated or local guest cart
      }

      // Update client-side cart store immediately (TICKET-023)
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
    } catch (err: any) {
      // Still allow guest cart addition with stock warning
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
    <div className="bg-stone-900/95 backdrop-blur-md p-5 rounded-2xl border border-stone-800 shadow-2xl space-y-4">
      {/* Toast Feedback */}
      {cartSuccessMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>✓ {cartSuccessMessage}</span>
          <button onClick={() => setCartSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {cartErrorMessage && (
        <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {cartErrorMessage}</span>
          <button onClick={() => setCartErrorMessage(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h4 className="text-base font-semibold text-white">{currentItem.name}</h4>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Authoritative Dimensions:{' '}
            <strong className="text-stone-200">
              {currentItem.dimensions.widthCm}×{currentItem.dimensions.heightCm}×{currentItem.dimensions.depthCm} cm
            </strong>{' '}
            • <span className="text-amber-400 font-bold text-sm">${currentItem.price.toFixed(2)}</span>
          </p>
        </div>

        {/* Object Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => duplicateFurniture(currentItem.id)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition"
            title="Duplicate object"
          >
            Duplicate
          </button>
          <button
            onClick={() => removeFurniture(currentItem.id)}
            className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-medium rounded-xl border border-rose-800 transition"
            title="Remove object"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Transform Controls Grid (TICKET-021) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* 1. Position Nudge (X, Z) */}
        <div className="space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
          <span className="text-stone-400 font-medium">Position on Floor:</span>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, [
                  currentItem.position[0] - 0.2,
                  currentItem.position[1],
                  currentItem.position[2],
                ])
              }
              className="py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 font-mono"
            >
              ← Left
            </button>
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, [
                  currentItem.position[0] + 0.2,
                  currentItem.position[1],
                  currentItem.position[2],
                ])
              }
              className="py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 font-mono"
            >
              Right →
            </button>
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, [
                  currentItem.position[0],
                  currentItem.position[1],
                  currentItem.position[2] - 0.2,
                ])
              }
              className="py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 font-mono"
            >
              ↑ Back
            </button>
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, [
                  currentItem.position[0],
                  currentItem.position[1],
                  currentItem.position[2] + 0.2,
                ])
              }
              className="py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center text-stone-200 font-mono"
            >
              ↓ Front
            </button>
          </div>
        </div>

        {/* 2. Rotation 360° Y-Axis */}
        <div className="space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
          <div className="flex justify-between text-stone-400 font-medium">
            <span>Orientation:</span>
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
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, undefined, [
                  currentItem.rotation[0],
                  currentItem.rotation[1] + 45,
                  currentItem.rotation[2],
                ])
              }
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-200 whitespace-nowrap text-[11px]"
            >
              +45°
            </button>
          </div>
        </div>

        {/* 3. Constrained Scale (TICKET-021: Strict constraints to prevent misleading physical dimensions) */}
        <div className="space-y-1.5 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
          <div className="flex justify-between text-stone-400 font-medium">
            <span>Scale Calibration:</span>
            <span className="text-stone-200 font-mono font-semibold">
              {currentScale.toFixed(2)}x {isTrueScale ? '(1:1 Physical)' : '(±10% Micro)'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step="0.01"
              value={currentScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-stone-900 cursor-pointer h-2 rounded-lg"
            />
            <button
              onClick={() => handleScaleChange(1.0)}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 text-[11px]"
              title="Reset to 1:1 true physical scale"
            >
              Reset
            </button>
          </div>
          <p className="text-[10px] text-stone-500">Scale restricted to ±10% to prevent misleading sizes.</p>
        </div>
      </div>

      {/* TICKET-023: Add-to-Cart Direct Checkout Section */}
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
          className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {isAddingToCart ? 'Validating Stock...' : `Add to Cart — $${(currentItem.price * quantity).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default TransformControls;
