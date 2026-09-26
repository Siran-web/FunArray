'use client';

import React from 'react';
import { useVisualization } from '../../hooks/useVisualization';

export const TransformControls: React.FC = () => {
  const { selectedFurnitureId, placedFurniture, updateFurnitureTransform, removeFurniture } = useVisualization();

  if (!selectedFurnitureId) return null;

  const currentItem = placedFurniture.find((f) => f.id === selectedFurnitureId);
  if (!currentItem) return null;

  return (
    <div className="flex items-center gap-3 bg-stone-900/90 backdrop-blur p-3 rounded-xl border border-stone-800 text-xs text-stone-200">
      <span className="font-semibold text-amber-400">Transform:</span>
      <button
        onClick={() =>
          updateFurnitureTransform(selectedFurnitureId, [
            currentItem.position[0] - 0.5,
            currentItem.position[1],
            currentItem.position[2],
          ])
        }
        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700"
      >
        ← Left
      </button>
      <button
        onClick={() =>
          updateFurnitureTransform(selectedFurnitureId, [
            currentItem.position[0] + 0.5,
            currentItem.position[1],
            currentItem.position[2],
          ])
        }
        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700"
      >
        Right →
      </button>
      <button
        onClick={() =>
          updateFurnitureTransform(
            selectedFurnitureId,
            undefined,
            [currentItem.rotation[0], currentItem.rotation[1] + 15, currentItem.rotation[2]]
          )
        }
        className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700"
      >
        ⟳ Rotate
      </button>
      <button
        onClick={() => removeFurniture(selectedFurnitureId)}
        className="px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded border border-rose-700 ml-auto"
      >
        Remove
      </button>
    </div>
  );
};

export default TransformControls;
