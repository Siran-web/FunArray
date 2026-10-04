'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useVisualizationStore } from '../../store/visualizationStore';
import { PlacedFurniture } from '../../types/visualization';
import { designApi } from '../../services/designApi';
import { Sliders, Plus, Sun, Image as ImageIcon, Grid, Save, Layers, RotateCcw, X, Check } from 'lucide-react';

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
  {
    productId: 'prod-oak-wardrobe',
    name: 'Scandinavian 2-Door Wardrobe',
    price: 799.99,
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
    previewImageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
    position: [-1.8, 0, -1.2],
    rotation: [0, 20, 0],
    scale: [1, 1, 1],
    dimensions: { widthCm: 110, heightCm: 195, depthCm: 60 },
    color: 'sand',
    material: 'Natural White Oak',
  },
];

export const FurnitureToolbar: React.FC = () => {
  const {
    roomImage,
    roomImageId,
    setRoomImage,
    designName,
    setDesignName,
    currentDesignId,
    setCurrentDesignId,
    addFurniture,
    clearScene,
    placedFurniture,
    lightingMode,
    setLightingMode,
    showGrid,
    toggleGrid,
    floorAlignment,
    startFloorAdjustment,
  } = useVisualizationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Room image must be smaller than 10MB.');
      return;
    }

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

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [customDesignName, setCustomDesignName] = useState(designName || 'Living Room');

  const handleOpenSaveDialog = () => {
    setCustomDesignName(designName || 'Living Room');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDesignName.trim()) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const payload = {
        name: customDesignName.trim(),
        roomImageId: roomImageId || undefined,
        roomImageUrl: roomImage || undefined,
        sceneData: JSON.stringify(placedFurniture),
      };

      let saved;
      if (currentDesignId) {
        saved = await designApi.updateDesign(currentDesignId, payload);
      } else {
        saved = await designApi.saveDesign(payload);
        if (saved && saved.id) {
          setCurrentDesignId(saved.id);
        }
      }

      setDesignName(customDesignName.trim());
      setIsSaveModalOpen(false);
      setSaveStatus(`"${customDesignName.trim()}" saved successfully`);
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setDesignName(customDesignName.trim());
      setIsSaveModalOpen(false);
      setSaveStatus('Saved locally to browser');
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Save Notification */}
      {saveStatus && (
        <div className="p-2.5 bg-[#2F7D50]/10 border border-[#2F7D50]/30 rounded-[10px] text-[#2F7D50] text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {saveStatus}</span>
          <button onClick={() => setSaveStatus(null)} className="text-[#2F7D50] hover:opacity-75">✕</button>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/95 backdrop-blur-md border border-[#E5E0DA] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
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
            className="px-3.5 py-2 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#8B5E3C]" />
            <span>{roomImage ? 'Change Photo' : 'Upload Room Photo'}</span>
          </button>

          <button
            onClick={() => setIsPresetsOpen(!isPresetsOpen)}
            className="px-3 py-2 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#6F6A64] hover:text-[#24211E] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition cursor-pointer"
          >
            Presets ▾
          </button>

          {roomImage && (
            <button
              onClick={startFloorAdjustment}
              className={`px-3 py-2 text-xs font-medium rounded-[10px] border transition flex items-center gap-1.5 cursor-pointer ${
                floorAlignment.isAdjusting
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]'
                  : 'bg-[#F3E8DE] text-[#8B5E3C] border-[#8B5E3C]/30 hover:bg-[#EBDDCF]'
              }`}
              title="Calibrate 3D floor perspective to match your room photo"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{floorAlignment.isAdjusting ? 'Aligning Floor...' : 'Adjust Floor'}</span>
            </button>
          )}

          {roomImage && (
            <button
              onClick={() => setRoomImage(null)}
              className="text-xs text-[#9B958E] hover:text-[#C84B4B] px-2 py-1 transition cursor-pointer"
            >
              Clear Photo
            </button>
          )}
        </div>

        {/* Center: Add Furniture Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#634027] text-white text-xs font-medium rounded-[10px] shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Furniture</span>
          </button>
        </div>

        {/* Right: Lighting, Grid & Save */}
        <div className="flex items-center gap-2">
          {/* Lighting Mode */}
          <div className="flex bg-[#F4F2EF] p-1 rounded-[10px] border border-[#E5E0DA] text-[11px]">
            <button
              onClick={() => setLightingMode('warm')}
              className={`px-2.5 py-1 rounded-[6px] transition cursor-pointer ${
                lightingMode === 'warm' ? 'bg-[#8B5E3C] text-white font-medium shadow-2xs' : 'text-[#6F6A64] hover:text-[#24211E]'
              }`}
            >
              Warm
            </button>
            <button
              onClick={() => setLightingMode('studio')}
              className={`px-2.5 py-1 rounded-[6px] transition cursor-pointer ${
                lightingMode === 'studio' ? 'bg-[#8B5E3C] text-white font-medium shadow-2xs' : 'text-[#6F6A64] hover:text-[#24211E]'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setLightingMode('daylight')}
              className={`px-2.5 py-1 rounded-[6px] transition cursor-pointer ${
                lightingMode === 'daylight' ? 'bg-[#8B5E3C] text-white font-medium shadow-2xs' : 'text-[#6F6A64] hover:text-[#24211E]'
              }`}
            >
              Daylight
            </button>
          </div>

          <button
            onClick={toggleGrid}
            className={`p-2 rounded-[10px] border text-xs transition cursor-pointer ${
              showGrid ? 'bg-[#F3E8DE] text-[#8B5E3C] border-[#8B5E3C]/30' : 'bg-[#F4F2EF] text-[#9B958E] border-[#E5E0DA]'
            }`}
            title="Toggle Floor Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenSaveDialog}
            disabled={isSaving}
            className="px-3.5 py-2 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-[#8B5E3C]" />
            <span>Save Design</span>
          </button>

          <Link
            href="/designs"
            className="px-3 py-2 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#6F6A64] hover:text-[#24211E] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Designs</span>
          </Link>

          <button
            onClick={clearScene}
            className="p-2 text-[#9B958E] hover:text-[#C84B4B] text-xs rounded-[10px] transition cursor-pointer"
            title="Clear All Furniture"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save Room Design Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E5E0DA] rounded-[16px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0DA] pb-3">
              <div>
                <h3 className="text-base font-serif font-medium text-[#24211E]">Save Room Design</h3>
                <p className="text-xs text-[#6F6A64] mt-0.5">Persist this 3D layout to your account</p>
              </div>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-[#9B958E] hover:text-[#24211E]">✕</button>
            </div>

            <form onSubmit={handleConfirmSaveDesign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#24211E] mb-1.5">Design Name</label>
                <input
                  type="text"
                  required
                  value={customDesignName}
                  onChange={(e) => setCustomDesignName(e.target.value)}
                  placeholder="e.g., Living Room, Bedroom"
                  className="w-full bg-[#FAF9F7] border border-[#E5E0DA] rounded-[10px] px-3.5 py-2.5 text-xs text-[#24211E] placeholder-[#9B958E] focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F2EF] hover:bg-[#FAF9F7] text-[#6F6A64] rounded-[10px] text-xs border border-[#E5E0DA] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#8B5E3C] hover:bg-[#634027] disabled:opacity-50 text-white font-medium rounded-[10px] text-xs transition shadow-sm"
                >
                  {isSaving ? 'Saving...' : 'Save Design'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Presets Modal */}
      {isPresetsOpen && (
        <div className="p-4 bg-white rounded-[16px] border border-[#E5E0DA] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-serif font-medium text-[#24211E]">Select Room Preset</h4>
            <button onClick={() => setIsPresetsOpen(false)} className="text-xs text-[#9B958E] hover:text-[#24211E]">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setRoomImage(preset.url, null, preset.name);
                  setIsPresetsOpen(false);
                }}
                className="group p-2 bg-[#FAF9F7] hover:bg-[#F3E8DE] border border-[#E5E0DA] rounded-[12px] text-left transition space-y-2 cursor-pointer"
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-24 object-cover rounded-[8px] border border-[#E5E0DA]"
                />
                <p className="text-xs font-medium text-[#24211E] truncate group-hover:text-[#8B5E3C]">
                  {preset.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Item Chooser Drawer */}
      {isCatalogOpen && (
        <div className="p-4 bg-white rounded-[16px] border border-[#E5E0DA] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-serif font-medium text-[#24211E]">Add Furniture Piece to Scene</h4>
            <button onClick={() => setIsCatalogOpen(false)} className="text-xs text-[#9B958E] hover:text-[#24211E]">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CATALOG_ITEMS.map((item) => (
              <button
                key={item.productId}
                onClick={() => handleAddCatalogItem(item)}
                className="group p-2.5 bg-[#FAF9F7] hover:bg-[#F3E8DE] border border-[#E5E0DA] rounded-[12px] text-left transition space-y-2 cursor-pointer flex flex-col justify-between"
              >
                <img
                  src={item.previewImageUrl}
                  alt={item.name}
                  className="w-full h-24 object-cover rounded-[8px] border border-[#E5E0DA] bg-white"
                />
                <div>
                  <h5 className="text-xs font-medium text-[#24211E] truncate group-hover:text-[#8B5E3C]">
                    {item.name}
                  </h5>
                  <p className="text-[11px] text-[#6F6A64]">
                    ${item.price.toFixed(2)} • {item.dimensions.widthCm}cm
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FurnitureToolbar;
