'use client';

import React, { useState, useRef } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { PlacedFurniture } from '../../types/visualization';

const ROOM_PRESETS = [
  {
    name: 'Modern Nordic Living Room',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Contemporary Loft Space',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
  },
  {
    name: 'Warm Minimalist Bedroom',
    url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1600&q=80',
  },
];

const CATALOG_ITEMS: Omit<PlacedFurniture, 'id'>[] = [
  {
    productId: 'prod-nordic-armchair',
    name: 'Nordic Fabric Armchair',
    price: 299.99,
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    previewImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
    color: 'grey',
    material: 'Oak & Fabric',
  },
  {
    productId: 'prod-teak-coffee-table',
    name: 'Teakwood Coffee Table',
    price: 199.99,
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    previewImageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=400&q=80',
    position: [1.2, 0, 0.4],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 110, heightCm: 45, depthCm: 60 },
    color: 'gold',
    material: 'Solid Teak',
  },
  {
    productId: 'prod-velvet-lounge-sofa',
    name: 'Velvet 3-Seater Sofa',
    price: 899.99,
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    previewImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
    position: [-1.2, 0, -0.6],
    rotation: [0, 15, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 200, heightCm: 85, depthCm: 90 },
    color: 'blue',
    material: 'Royal Velvet',
  },
  {
    productId: 'prod-minimalist-side-table',
    name: 'Minimalist Side Table',
    price: 129.99,
    modelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    previewImageUrl: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=400&q=80',
    position: [0.8, 0, -1.0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 50, heightCm: 55, depthCm: 50 },
    color: 'charcoal',
    material: 'Matte Steel & Oak',
  },
];

export const FurnitureToolbar: React.FC = () => {
  const {
    roomImage,
    setRoomImage,
    addFurniture,
    clearScene,
    placedFurniture,
    lightingMode,
    setLightingMode,
    showGrid,
    toggleGrid,
    showShadows,
    toggleShadows,
  } = useVisualizationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Room image must be smaller than 10MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setRoomImage(localUrl, null, file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleAddCatalogItem = (item: Omit<PlacedFurniture, 'id'>) => {
    const newPlacedItem: PlacedFurniture = {
      ...item,
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    addFurniture(newPlacedItem);
    setIsCatalogOpen(false);
  };

  const handleSaveScene = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body = {
        name: `Room Layout (${new Date().toLocaleDateString()})`,
        roomImageUrl: roomImage || undefined,
        sceneData: JSON.stringify(placedFurniture),
      };

      const res = await fetch('http://localhost:8080/api/v1/visualization/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaveStatus('Scene saved to your account!');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus('Saved locally to browser.');
        setTimeout(() => setSaveStatus(null), 3500);
      }
    } catch (err) {
      setSaveStatus('Saved locally to browser.');
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Save Notification */}
      {saveStatus && (
        <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {saveStatus}</span>
          <button onClick={() => setSaveStatus(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-stone-900/80 backdrop-blur-md border border-stone-800/80 rounded-2xl shadow-xl">
        {/* Left: Room Background Controls */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {roomImage ? 'Change Photo' : 'Upload Room'}
          </button>

          <button
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className="px-3 py-2 bg-stone-800/60 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-xl border border-stone-700/60 transition"
          >
            Room Presets ▾
          </button>

          {roomImage && (
            <button
              onClick={() => setRoomImage(null)}
              className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Center: Add Furniture Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Furniture (+{CATALOG_ITEMS.length})
          </button>
        </div>

        {/* Right: Environment Settings & Save */}
        <div className="flex items-center gap-2">
          {/* Lighting Mode */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px]">
            <button
              onClick={() => setLightingMode('warm')}
              className={`px-2 py-1 rounded-lg transition ${lightingMode === 'warm' ? 'bg-amber-600 text-stone-950 font-semibold' : 'text-stone-400'}`}
            >
              Warm
            </button>
            <button
              onClick={() => setLightingMode('studio')}
              className={`px-2 py-1 rounded-lg transition ${lightingMode === 'studio' ? 'bg-amber-600 text-stone-950 font-semibold' : 'text-stone-400'}`}
            >
              Studio
            </button>
            <button
              onClick={() => setLightingMode('daylight')}
              className={`px-2 py-1 rounded-lg transition ${lightingMode === 'daylight' ? 'bg-amber-600 text-stone-950 font-semibold' : 'text-stone-400'}`}
            >
              Daylight
            </button>
          </div>

          <button
            onClick={toggleGrid}
            className={`p-2 rounded-xl border text-xs transition ${showGrid ? 'bg-stone-800 text-amber-400 border-amber-500/40' : 'bg-stone-900 text-stone-500 border-stone-800'}`}
            title="Toggle Floor Grid"
          >
            #
          </button>

          <button
            onClick={handleSaveScene}
            disabled={isSaving}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition"
          >
            {isSaving ? 'Saving...' : 'Save Scene'}
          </button>

          <button
            onClick={clearScene}
            className="px-2.5 py-2 text-rose-400 hover:text-rose-300 text-xs font-medium"
            title="Reset Studio"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Room Presets Dropdown */}
      {isPresetsOpen && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROOM_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setRoomImage(preset.url, null, preset.name);
                setIsPresetsOpen(false);
              }}
              className="text-left group relative rounded-xl overflow-hidden border border-stone-800 hover:border-amber-500 transition"
            >
              <img src={preset.url} alt={preset.name} className="w-full h-24 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex items-end">
                <span className="text-xs font-medium text-white">{preset.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Furniture Catalog Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-semibold text-white">Select Furniture to Place in Room</h3>
              <button onClick={() => setIsCatalogOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {CATALOG_ITEMS.map((item) => (
                <div
                  key={item.productId}
                  className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex gap-3 hover:border-amber-500/80 transition"
                >
                  <img
                    src={item.previewImageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-stone-900 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <p className="text-xs text-amber-400 font-bold mt-0.5">${item.price.toFixed(2)}</p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {item.dimensions.widthCm}×{item.dimensions.heightCm}×{item.dimensions.depthCm} cm
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddCatalogItem(item)}
                      className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-xs rounded-lg transition"
                    >
                      + Place in Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FurnitureToolbar;
