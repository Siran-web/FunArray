'use client';

import React from 'react';
import { PlacedFurniture } from '../../types/visualization';
import { Product } from '../../types/product';
import {
  loadFurnitureModel,
  createPhotorealisticProceduralFurniture,
  groundModelToBase,
  addContactShadowPlane,
  processAndSanitizePBRMaterial,
} from './ModelLoader';

export interface FurnitureModelProps {
  item?: PlacedFurniture;
  product?: Product;
  modelUrl?: string;
  name?: string;
  className?: string;
}

export const FurnitureModel: React.FC<FurnitureModelProps> = ({
  item,
  product,
  modelUrl,
  name,
  className = '',
}) => {
  const displayName = item?.name || product?.name || name || '3D Furniture Model';
  const displayUrl = item?.modelUrl || product?.model3D?.modelUrl || modelUrl || '';
  const dimensions = item?.dimensions || product?.dimensions;

  return (
    <div className={`relative w-full flex flex-col items-center justify-center p-4 bg-stone-900/60 rounded-xl border border-stone-800 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shadow-inner">
        3D
      </div>
      <p className="mt-2 text-xs text-white font-medium text-center truncate max-w-xs">{displayName}</p>
      {dimensions && (
        <span className="text-[11px] text-stone-400 font-mono mt-0.5">
          {dimensions.widthCm} × {dimensions.heightCm} × {dimensions.depthCm} cm
        </span>
      )}
      {displayUrl && (
        <span className="text-[10px] text-stone-500 truncate max-w-xs mt-1">
          {displayUrl.split('/').pop()}
        </span>
      )}
    </div>
  );
};

// Re-export core 3D model engine utilities
export {
  loadFurnitureModel,
  createPhotorealisticProceduralFurniture,
  groundModelToBase,
  addContactShadowPlane,
  processAndSanitizePBRMaterial,
};

export default FurnitureModel;
