'use client';

import React from 'react';
import { useVisualization } from '../../hooks/useVisualization';

export const RoomViewer: React.FC = () => {
  const { roomImage, placedFurniture, selectedFurnitureId, selectFurniture } = useVisualization();

  return (
    <div className="relative w-full h-[600px] bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-800 shadow-2xl">
      {roomImage ? (
        <img
          src={roomImage}
          alt="User Room Background"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      ) : (
        <div className="text-center text-stone-400 p-8">
          <p className="text-lg font-medium">Virtual 3D Room Studio</p>
          <p className="text-sm mt-1">Upload a room image or preview 3D furniture models directly below</p>
        </div>
      )}

      {/* Render 3D/AR Placed Models overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {placedFurniture.map((item) => (
          <div
            key={item.id}
            onClick={() => selectFurniture(item.id)}
            className={`pointer-events-auto absolute cursor-move p-2 rounded border transition-all ${
              selectedFurnitureId === item.id ? 'border-amber-500 shadow-lg bg-amber-500/10' : 'border-transparent'
            }`}
            style={{
              left: `${50 + item.position[0] * 20}%`,
              top: `${50 + item.position[1] * 20}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="text-xs bg-stone-900/80 text-white px-2 py-1 rounded backdrop-blur border border-stone-700">
              {item.dimensions.widthCm}×{item.dimensions.heightCm}×{item.dimensions.depthCm} cm
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomViewer;
