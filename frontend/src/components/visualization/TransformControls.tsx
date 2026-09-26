'use client';

import React from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';

export const TransformControls: React.FC = () => {
  const {
    selectedFurnitureId,
    placedFurniture,
    updateFurnitureTransform,
    removeFurniture,
    duplicateFurniture,
  } = useVisualizationStore();

  if (!selectedFurnitureId) return null;

  const currentItem = placedFurniture.find((f) => f.id === selectedFurnitureId);
  if (!currentItem) return null;

  return (
    <div className="bg-stone-900/90 backdrop-blur-md p-4 rounded-2xl border border-stone-800 shadow-2xl space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <h4 className="text-sm font-semibold text-white">{currentItem.name}</h4>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {currentItem.dimensions.widthCm}×{currentItem.dimensions.heightCm}×{currentItem.dimensions.depthCm} cm •{' '}
            <span className="text-amber-400 font-bold">${currentItem.price.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => duplicateFurniture(currentItem.id)}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-lg border border-stone-700 transition"
            title="Duplicate object"
          >
            Duplicate
          </button>
          <button
            onClick={() => removeFurniture(currentItem.id)}
            className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-medium rounded-lg border border-rose-800 transition"
            title="Remove object"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Transform Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Position Nudge */}
        <div className="space-y-1.5">
          <span className="text-stone-400 font-medium">Position (X, Z):</span>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, [
                  currentItem.position[0] - 0.2,
                  currentItem.position[1],
                  currentItem.position[2],
                ])
              }
              className="py-1 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
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
              className="py-1 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
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
              className="py-1 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
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
              className="py-1 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
            >
              ↓ Front
            </button>
          </div>
        </div>

        {/* Rotation Y-Axis */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-stone-400 font-medium">
            <span>Rotation:</span>
            <span className="text-amber-400 font-mono">{Math.round(currentItem.rotation[1]) % 360}°</span>
          </div>
          <div className="flex items-center gap-2">
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
              className="w-full accent-amber-500 bg-stone-950 cursor-pointer"
            />
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, undefined, [
                  currentItem.rotation[0],
                  currentItem.rotation[1] + 45,
                  currentItem.rotation[2],
                ])
              }
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-200 whitespace-nowrap"
            >
              +45°
            </button>
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-stone-400 font-medium">
            <span>Scale:</span>
            <span className="text-stone-200 font-mono">{currentItem.scale[0].toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={currentItem.scale[0]}
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                updateFurnitureTransform(currentItem.id, undefined, undefined, [s, s, s]);
              }}
              className="w-full accent-amber-500 bg-stone-950 cursor-pointer"
            />
            <button
              onClick={() =>
                updateFurnitureTransform(currentItem.id, undefined, undefined, [1, 1, 1])
              }
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-400 hover:text-white"
              title="Reset scale"
            >
              1.0x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformControls;
