'use client';

import React from 'react';

interface FurnitureModelProps {
  modelUrl: string;
  name?: string;
}

export const FurnitureModel: React.FC<FurnitureModelProps> = ({ modelUrl, name }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40 animate-pulse">
        <span className="text-amber-400 font-semibold text-xs">3D</span>
      </div>
      <p className="mt-2 text-xs text-stone-300 font-medium">{name || 'Furniture Model'}</p>
      <span className="text-[10px] text-stone-500 truncate max-w-xs">{modelUrl}</span>
    </div>
  );
};

export default FurnitureModel;
