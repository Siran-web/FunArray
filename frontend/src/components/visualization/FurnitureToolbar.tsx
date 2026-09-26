'use client';

import React from 'react';
import { useVisualization } from '../../hooks/useVisualization';

export const FurnitureToolbar: React.FC = () => {
  const { clearScene, roomImage, setRoomImage } = useVisualization();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRoomImage(url);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-stone-900 border border-stone-800 rounded-xl">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition">
          {roomImage ? 'Change Room Photo' : 'Upload Room Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
        {roomImage && (
          <button
            onClick={() => setRoomImage(null)}
            className="text-xs text-stone-400 hover:text-stone-200"
          >
            Clear Room
          </button>
        )}
      </div>

      <button
        onClick={clearScene}
        className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium"
      >
        Reset Studio
      </button>
    </div>
  );
};

export default FurnitureToolbar;
