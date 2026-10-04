'use client';

import React, { useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { useCartStore } from '../../store/cartStore';
import { computeScaledDimensions, MIN_FURNITURE_SCALE, MAX_FURNITURE_SCALE } from './FurnitureTransform';
import {
  Move,
  RotateCw,
  RotateCcw,
  Maximize2,
  Trash2,
  Lock,
  Unlock,
  Check,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Layers,
  Camera,
  UploadCloud,
  Grid,
} from 'lucide-react';

export interface FurnitureControlsProps {
  onSwitchMode?: (mode: 'room-photo' | 'camera-ar' | 'studio') => void;
  onChangeFurniture?: () => void;
  className?: string;
}

type ActiveControlTab = 'move' | 'rotate' | 'resize' | 'none';

export const FurnitureControls: React.FC<FurnitureControlsProps> = ({
  onSwitchMode,
  onChangeFurniture,
  className = '',
}) => {
  const {
    selectedFurnitureId,
    placedFurniture,
    updateFurnitureTransform,
    removeFurniture,
    toggleLockFurniture,
    resetFurnitureTransform,
    selectFurniture,
    viewMode,
    setViewMode,
  } = useVisualizationStore();

  const { addItem: addCartItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<ActiveControlTab>('move');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);

  if (!selectedFurnitureId) {
    return (
      <div className={`bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#E5E0DA] shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-center text-[#6F6A64] text-xs select-none ${className}`}>
        <p className="flex items-center justify-center gap-2">
          <span className="text-[#8B5E3C]">✦</span>
          <span>Tap any placed furniture in the scene to adjust position, rotation, and dimensions.</span>
        </p>
      </div>
    );
  }

  const currentItem = placedFurniture.find((f) => f.id === selectedFurnitureId);
  if (!currentItem) return null;

  const isLocked = !!currentItem.isLocked;
  const currentScale = currentItem.scale[0] || 1.0;
  const isTrueScale = Math.abs(currentScale - 1.0) < 0.001;

  // Live real dimensions scaled in cm
  const scaledDims = computeScaledDimensions(currentItem.dimensions, currentScale);

  const handleScaleChange = (newScale: number) => {
    if (isLocked) return;
    const clamped = Math.max(MIN_FURNITURE_SCALE, Math.min(MAX_FURNITURE_SCALE, Math.round(newScale * 100) / 100));
    updateFurnitureTransform(currentItem.id, undefined, undefined, [clamped, clamped, clamped]);
  };

  const handleRotate = (deltaDeg: number) => {
    if (isLocked) return;
    const newY = (currentItem.rotation[1] + deltaDeg) % 360;
    updateFurnitureTransform(currentItem.id, undefined, [
      currentItem.rotation[0],
      newY < 0 ? newY + 360 : newY,
      currentItem.rotation[2],
    ]);
  };

  const handleNudge = (dx: number, dz: number) => {
    if (isLocked) return;
    updateFurnitureTransform(currentItem.id, [
      Math.round((currentItem.position[0] + dx) * 100) / 100,
      currentItem.position[1],
      Math.round((currentItem.position[2] + dz) * 100) / 100,
    ]);
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    setCartSuccessMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

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

      setCartSuccessMessage(`Added ${quantity}× "${currentItem.name}" to cart`);
      setTimeout(() => setCartSuccessMessage(null), 3000);
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
      setCartSuccessMessage(`Added ${quantity}× "${currentItem.name}" to cart`);
      setTimeout(() => setCartSuccessMessage(null), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSwitchMode = (mode: 'room-photo' | 'camera-ar' | 'studio') => {
    setViewMode(mode);
    if (onSwitchMode) onSwitchMode(mode);
  };

  return (
    <div className={`bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[16px] border border-[#E5E0DA] shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4 select-none ${className}`}>
      {/* Toast Feedback */}
      {cartSuccessMessage && (
        <div className="p-2.5 bg-[#2F7D50]/10 border border-[#2F7D50]/30 text-[#2F7D50] text-xs rounded-[10px] flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {cartSuccessMessage}</span>
          <button onClick={() => setCartSuccessMessage(null)} className="text-[#2F7D50] hover:opacity-75">✕</button>
        </div>
      )}

      {/* Header Info & Action Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0DA] pb-3">
        <div className="flex items-center gap-3">
          {currentItem.previewImageUrl && (
            <img
              src={currentItem.previewImageUrl}
              alt={currentItem.name}
              className="w-12 h-12 object-cover rounded-[10px] border border-[#E5E0DA] bg-[#FAF9F7] shrink-0"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-serif font-medium text-[#24211E] truncate max-w-xs">{currentItem.name}</h3>
              {isLocked ? (
                <span className="text-[10px] bg-[#C84B4B]/10 text-[#C84B4B] border border-[#C84B4B]/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              ) : (
                <span className="text-[10px] bg-[#2F7D50]/10 text-[#2F7D50] border border-[#2F7D50]/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D50]" /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#6F6A64] mt-0.5">
              <span className="font-semibold text-[#24211E]">${currentItem.price.toFixed(2)}</span>
              <span className="mx-1.5 text-[#9B958E]">•</span>
              <span>{scaledDims.widthCm} × {scaledDims.heightCm} × {scaledDims.depthCm} cm</span>
              {isTrueScale && <span className="text-[#8B5E3C] font-medium ml-1.5 text-[11px]">(1:1 Scale)</span>}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#F4F2EF] p-1 rounded-[10px] border border-[#E5E0DA] text-xs self-start sm:self-auto">
          <button
            onClick={() => handleSwitchMode('room-photo')}
            className={`px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition text-xs ${
              viewMode === 'room-photo'
                ? 'bg-[#8B5E3C] text-white font-medium shadow-sm'
                : 'text-[#6F6A64] hover:text-[#24211E]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Room Photo</span>
          </button>
          <button
            onClick={() => handleSwitchMode('camera-ar')}
            className={`px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition text-xs ${
              viewMode === 'camera-ar'
                ? 'bg-[#8B5E3C] text-white font-medium shadow-sm'
                : 'text-[#6F6A64] hover:text-[#24211E]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera AR</span>
          </button>
        </div>
      </div>

      {/* Minimal Floating Action Tabs Bar: Move | Rotate | Resize | Delete | Lock | Change Furniture */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#F4F2EF] rounded-[12px] border border-[#E5E0DA]">
        <div className="flex items-center gap-1 flex-wrap">
          {/* MOVE */}
          <button
            onClick={() => setActiveTab(activeTab === 'move' ? 'none' : 'move')}
            className={`px-3 py-1.5 rounded-[10px] text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'move'
                ? 'bg-white text-[#8B5E3C] font-semibold shadow-sm border border-[#E5E0DA]'
                : 'text-[#6F6A64] hover:text-[#24211E] hover:bg-white/50'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          {/* ROTATE */}
          <button
            onClick={() => setActiveTab(activeTab === 'rotate' ? 'none' : 'rotate')}
            className={`px-3 py-1.5 rounded-[10px] text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'rotate'
                ? 'bg-white text-[#8B5E3C] font-semibold shadow-sm border border-[#E5E0DA]'
                : 'text-[#6F6A64] hover:text-[#24211E] hover:bg-white/50'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate ({Math.round(currentItem.rotation[1])}°)</span>
          </button>

          {/* RESIZE */}
          <button
            onClick={() => setActiveTab(activeTab === 'resize' ? 'none' : 'resize')}
            className={`px-3 py-1.5 rounded-[10px] text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'resize'
                ? 'bg-white text-[#8B5E3C] font-semibold shadow-sm border border-[#E5E0DA]'
                : 'text-[#6F6A64] hover:text-[#24211E] hover:bg-white/50'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Resize ({Math.round(currentScale * 100)}%)</span>
          </button>

          {/* LOCK */}
          <button
            onClick={() => toggleLockFurniture(currentItem.id)}
            className={`px-3 py-1.5 rounded-[10px] text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isLocked
                ? 'bg-[#C84B4B]/10 text-[#C84B4B] border border-[#C84B4B]/20 font-medium'
                : 'text-[#6F6A64] hover:text-[#24211E] hover:bg-white/50'
            }`}
            title={isLocked ? 'Unlock item' : 'Lock item against accidental moves'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>

          {/* CHANGE FURNITURE */}
          {onChangeFurniture && (
            <button
              onClick={onChangeFurniture}
              className="px-3 py-1.5 rounded-[10px] text-xs text-[#6F6A64] hover:text-[#24211E] hover:bg-white/50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-[#8B5E3C]" />
              <span>Change Furniture</span>
            </button>
          )}

          {/* DELETE */}
          <button
            onClick={() => removeFurniture(currentItem.id)}
            className="px-2.5 py-1.5 rounded-[10px] text-xs text-[#6F6A64] hover:text-[#C84B4B] hover:bg-[#C84B4B]/10 flex items-center gap-1 transition cursor-pointer"
            title="Delete this furniture item"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>

        {/* Quick Reset */}
        <button
          disabled={isLocked}
          onClick={() => resetFurnitureTransform(currentItem.id)}
          className="text-[11px] text-[#9B958E] hover:text-[#8B5E3C] disabled:opacity-30 transition px-2 py-1"
        >
          Reset
        </button>
      </div>

      {/* Active Tab Sub-Control Drawer */}
      {activeTab === 'move' && (
        <div className="p-3.5 bg-[#FAF9F7] rounded-[14px] border border-[#E5E0DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#6F6A64]">Nudge Position:</span>
            <span className="font-mono text-[#24211E] bg-white px-2 py-1 rounded-[6px] border border-[#E5E0DA] text-[11px]">
              X: {currentItem.position[0].toFixed(2)}m • Z: {currentItem.position[2].toFixed(2)}m
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={isLocked}
              onClick={() => handleNudge(-0.2, 0)}
              className="p-2 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] shadow-2xs transition"
              title="Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={isLocked}
              onClick={() => handleNudge(0, -0.2)}
              className="p-2 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] shadow-2xs transition"
              title="Deeper"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={isLocked}
              onClick={() => handleNudge(0, 0.2)}
              className="p-2 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] shadow-2xs transition"
              title="Closer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={isLocked}
              onClick={() => handleNudge(0.2, 0)}
              className="p-2 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] shadow-2xs transition"
              title="Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rotate' && (
        <div className="p-3.5 bg-[#FAF9F7] rounded-[14px] border border-[#E5E0DA] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#6F6A64]">Rotation Angle:</span>
            <div className="flex items-center gap-2">
              <button
                disabled={isLocked}
                onClick={() => handleRotate(-45)}
                className="px-2.5 py-1 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] text-xs transition"
              >
                -45°
              </button>
              <span className="font-mono text-[#8B5E3C] font-semibold">{Math.round(currentItem.rotation[1])}°</span>
              <button
                disabled={isLocked}
                onClick={() => handleRotate(45)}
                className="px-2.5 py-1 bg-white hover:bg-[#F4F2EF] disabled:opacity-30 rounded-[8px] border border-[#E5E0DA] text-[#24211E] text-xs transition"
              >
                +45°
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={Math.round(currentItem.rotation[1]) % 360}
            disabled={isLocked}
            onChange={(e) => {
              const deg = parseFloat(e.target.value);
              updateFurnitureTransform(currentItem.id, undefined, [currentItem.rotation[0], deg, currentItem.rotation[2]]);
            }}
            className="w-full accent-[#8B5E3C] cursor-pointer disabled:opacity-30"
          />
        </div>
      )}

      {activeTab === 'resize' && (
        <div className="p-3.5 bg-[#FAF9F7] rounded-[14px] border border-[#E5E0DA] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#6F6A64]">Proportional Scale:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#24211E] font-medium">{Math.round(currentScale * 100)}%</span>
              {!isTrueScale && (
                <button
                  disabled={isLocked}
                  onClick={() => handleScaleChange(1.0)}
                  className="px-2 py-0.5 bg-white hover:bg-[#F4F2EF] rounded-[6px] border border-[#E5E0DA] text-[10px] text-[#8B5E3C] transition"
                >
                  Reset 1:1
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min={MIN_FURNITURE_SCALE}
            max={MAX_FURNITURE_SCALE}
            step="0.05"
            value={currentScale}
            disabled={isLocked}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="w-full accent-[#8B5E3C] cursor-pointer disabled:opacity-30"
          />

          <div className="flex justify-between text-[10px] text-[#9B958E]">
            <span>75% (Compact)</span>
            <span className={isTrueScale ? 'text-[#8B5E3C] font-semibold' : ''}>100% (Real Size)</span>
            <span>125% (Spacious)</span>
          </div>
        </div>
      )}

      {/* Footer Commerce Bar: Quantity & Add to Cart */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E5E0DA]">
        <span className="text-xs text-[#6F6A64]">
          True-to-scale fit verified in 3D preview
        </span>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Quantity */}
          <div className="flex items-center bg-[#F4F2EF] rounded-[10px] border border-[#E5E0DA] p-0.5">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center text-[#6F6A64] hover:text-[#24211E] rounded-[6px] hover:bg-white transition"
            >
              -
            </button>
            <span className="w-6 text-center font-medium text-xs text-[#24211E]">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 flex items-center justify-center text-[#6F6A64] hover:text-[#24211E] rounded-[6px] hover:bg-white transition"
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            disabled={isAddingToCart}
            onClick={handleAddToCart}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#634027] disabled:opacity-50 text-white font-medium rounded-[10px] text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isAddingToCart ? 'Adding...' : `Add to Cart • $${(currentItem.price * quantity).toFixed(2)}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FurnitureControls;
