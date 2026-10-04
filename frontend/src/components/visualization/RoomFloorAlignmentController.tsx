'use client';

import React from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import {
  Check,
  RotateCcw,
  Sliders,
  Maximize2,
  Eye,
  Camera,
  Layers,
} from 'lucide-react';

export const RoomFloorAlignmentController: React.FC = () => {
  const {
    roomImage,
    floorAlignment,
    setFloorAlignment,
    confirmFloorAdjustment,
    resetFloorAlignment,
  } = useVisualizationStore();

  if (!floorAlignment.isAdjusting || !roomImage) return null;

  const presets = [
    {
      name: 'Eye-Level (Standard)',
      icon: Eye,
      config: { cameraHeight: 1.35, pitchAngle: -6, cameraFov: 45, elevation: 0, depthScale: 1.0 },
    },
    {
      name: 'Standing Phone View',
      icon: Camera,
      config: { cameraHeight: 1.55, pitchAngle: -12, cameraFov: 55, elevation: 0, depthScale: 1.05 },
    },
    {
      name: 'Sitting / Low Table',
      icon: Layers,
      config: { cameraHeight: 0.95, pitchAngle: -3, cameraFov: 42, elevation: 0, depthScale: 0.95 },
    },
    {
      name: 'Wide Angle Room',
      icon: Maximize2,
      config: { cameraHeight: 1.40, pitchAngle: -10, cameraFov: 65, elevation: 0, depthScale: 1.15 },
    },
  ];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* 1. TOP GUIDANCE BANNER */}
      <div className="flex justify-center pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0DA] px-4 py-2.5 rounded-[16px] shadow-lg flex items-center gap-3 text-xs text-[#24211E] max-w-xl">
          <div className="w-8 h-8 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] border border-[#8B5E3C]/30 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-medium text-[#24211E] block text-sm">Align Room Floor Guide</span>
            <span className="text-[#6F6A64] text-[11px]">
              Adjust the grid below until the perspective lines align with where your room walls and floor meet.
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUBTLE 2D/3D PERSPECTIVE GUIDE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Horizon Reference Line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-[#8B5E3C]/60 flex items-center justify-end pr-4 pointer-events-none transition-all duration-150"
          style={{
            top: `${Math.max(20, Math.min(80, 50 + floorAlignment.pitchAngle * 1.5))}%`,
          }}
        >
          <span className="px-2.5 py-1 bg-white/90 text-[10px] text-[#8B5E3C] font-mono font-medium rounded-[6px] backdrop-blur-sm border border-[#E5E0DA] shadow-2xs">
            Horizon Reference ({floorAlignment.pitchAngle > 0 ? `+${floorAlignment.pitchAngle}` : floorAlignment.pitchAngle}°)
          </span>
        </div>
      </div>

      {/* 3. BOTTOM VISUAL CALIBRATION CONTROLS */}
      <div className="pointer-events-auto max-w-2xl mx-auto w-full bg-white/95 backdrop-blur-md p-4 rounded-[16px] border border-[#E5E0DA] shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-3">
        {/* Preset Quick-Tunes */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0DA] pb-2.5">
          <span className="text-[11px] text-[#6F6A64] font-medium">Photo Viewpoint Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.name}
                  onClick={() => setFloorAlignment(p.config)}
                  className="px-2.5 py-1 bg-[#F4F2EF] hover:bg-[#F3E8DE] text-[#24211E] text-xs rounded-[8px] border border-[#E5E0DA] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-[#8B5E3C]" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid: Horizon Tilt | Camera Height | Lens FOV | Floor Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {/* Horizon Tilt / Pitch */}
          <div className="space-y-1 bg-[#FAF9F7] p-2.5 rounded-[10px] border border-[#E5E0DA]">
            <div className="flex justify-between text-[#6F6A64] text-[11px]">
              <span>Camera Tilt:</span>
              <span className="text-[#8B5E3C] font-mono font-semibold">{floorAlignment.pitchAngle}°</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={floorAlignment.pitchAngle}
              onChange={(e) => setFloorAlignment({ pitchAngle: parseFloat(e.target.value) })}
              className="w-full accent-[#8B5E3C] cursor-pointer h-1.5 rounded-lg"
            />
          </div>

          {/* Camera Height */}
          <div className="space-y-1 bg-[#FAF9F7] p-2.5 rounded-[10px] border border-[#E5E0DA]">
            <div className="flex justify-between text-[#6F6A64] text-[11px]">
              <span>Camera Height:</span>
              <span className="text-[#8B5E3C] font-mono font-semibold">{floorAlignment.cameraHeight.toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.05"
              value={floorAlignment.cameraHeight}
              onChange={(e) => setFloorAlignment({ cameraHeight: parseFloat(e.target.value) })}
              className="w-full accent-[#8B5E3C] cursor-pointer h-1.5 rounded-lg"
            />
          </div>

          {/* Lens Field of View */}
          <div className="space-y-1 bg-[#FAF9F7] p-2.5 rounded-[10px] border border-[#E5E0DA]">
            <div className="flex justify-between text-[#6F6A64] text-[11px]">
              <span>Lens Perspective:</span>
              <span className="text-[#8B5E3C] font-mono font-semibold">{floorAlignment.cameraFov}°</span>
            </div>
            <input
              type="range"
              min="30"
              max="75"
              step="1"
              value={floorAlignment.cameraFov}
              onChange={(e) => setFloorAlignment({ cameraFov: parseFloat(e.target.value) })}
              className="w-full accent-[#8B5E3C] cursor-pointer h-1.5 rounded-lg"
            />
          </div>

          {/* Floor Elevation */}
          <div className="space-y-1 bg-[#FAF9F7] p-2.5 rounded-[10px] border border-[#E5E0DA]">
            <div className="flex justify-between text-[#6F6A64] text-[11px]">
              <span>Floor Offset:</span>
              <span className="text-[#8B5E3C] font-mono font-semibold">
                {floorAlignment.elevation > 0 ? `+${floorAlignment.elevation.toFixed(2)}` : floorAlignment.elevation.toFixed(2)}m
              </span>
            </div>
            <input
              type="range"
              min="-0.6"
              max="0.6"
              step="0.02"
              value={floorAlignment.elevation}
              onChange={(e) => setFloorAlignment({ elevation: parseFloat(e.target.value) })}
              className="w-full accent-[#8B5E3C] cursor-pointer h-1.5 rounded-lg"
            />
          </div>
        </div>

        {/* Action Confirmation & Reset */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={resetFloorAlignment}
            className="px-3 py-1.5 bg-[#F4F2EF] hover:bg-[#FAF9F7] text-[#6F6A64] text-xs font-medium rounded-[10px] border border-[#E5E0DA] transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={confirmFloorAdjustment}
            className="px-5 py-2 bg-[#8B5E3C] hover:bg-[#634027] text-white font-medium text-xs rounded-[10px] shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Floor Alignment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomFloorAlignmentController;
