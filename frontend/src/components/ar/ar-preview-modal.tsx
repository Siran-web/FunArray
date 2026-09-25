"use client";

import * as React from "react";
import { Product } from "@/types/product";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Box,
  Camera,
  UploadCloud,
  CheckCircle2,
  RotateCw,
  Move,
  Lock,
  ShoppingBag,
  Sparkles,
  Layers,
  Info
} from "lucide-react";

export interface ARPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart?: (product: Product) => void;
}

export function ARPreviewModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ARPreviewModalProps) {
  const [activeStep, setActiveStep] = React.useState<"select-mode" | "uploading" | "preview">("select-mode");
  const [rotationAngle, setRotationAngle] = React.useState(0);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveStep("select-mode");
      setRotationAngle(0);
      setIsSaved(false);
      setIsAdded(false);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleSimulateUpload = () => {
    setActiveStep("uploading");
    setTimeout(() => {
      setActiveStep("preview");
    }, 1400);
  };

  const handleAddToCart = () => {
    setIsAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View in Your Room (AR Preview)"
      description="Calibrated true-scale spatial visualization engine"
      className="max-w-2xl"
    >
      <div className="space-y-6 pt-2">
        {/* Product Reference Bar */}
        <div className="p-3.5 bg-[#FAF9F7] rounded-[12px] border border-[#E5E0DA] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={product.images[0]?.imageUrl}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-[8px] border border-[#E5E0DA]"
            />
            <div>
              <h4 className="text-sm font-semibold text-[#24211E]">{product.name}</h4>
              <p className="text-xs text-[#6F6A64]">
                Dimensions: {product.dimensions.widthCm} × {product.dimensions.heightCm} × {product.dimensions.depthCm} cm
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[#24211E] block">{formatPrice(product.basePrice)}</span>
            <Badge variant="ar" size="sm">Scale 1:1 Locked</Badge>
          </div>
        </div>

        {/* STEP 1: Select Visualization Mode */}
        {activeStep === "select-mode" && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6F6A64]">
              Select Visualization Mode (Section 13)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleSimulateUpload}
                className="p-5 rounded-[16px] border-2 border-[#8B5E3C] bg-[#F3E8DE]/40 hover:bg-[#F3E8DE] text-left transition-all cursor-pointer space-y-2 group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#8B5E3C] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#24211E]">Mode 1: Upload Room Photo</h4>
                <p className="text-xs text-[#6F6A64]">
                  Upload a photo of your living room or bedroom. The 3D model will be fitted onto the floor with perspective matching.
                </p>
                <span className="text-[11px] font-bold text-[#8B5E3C] block pt-1">
                  Recommended for Desktop & Laptop →
                </span>
              </button>

              <button
                onClick={handleSimulateUpload}
                className="p-5 rounded-[16px] border border-[#E5E0DA] bg-white hover:border-[#8B5E3C] hover:bg-[#F4F2EF] text-left transition-all cursor-pointer space-y-2 group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#24211E] text-[#D49A6A] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#24211E]">Mode 2: Mobile Camera AR</h4>
                <p className="text-xs text-[#6F6A64]">
                  Scan your room surface in real-time via WebXR surface detection. True millimeter scale in your space.
                </p>
                <span className="text-[11px] font-bold text-[#8B5E3C] block pt-1">
                  Supported on iOS & Android →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Processing & Surface Detection Simulation */}
        {activeStep === "uploading" && (
          <div className="p-8 text-center space-y-4 bg-[#FAF9F7] rounded-[16px] border border-[#E5E0DA]">
            <div className="w-12 h-12 rounded-full border-3 border-[#8B5E3C] border-t-transparent animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-serif text-lg font-medium text-[#24211E]">Analyzing Room Geometry</h4>
              <p className="text-xs text-[#6F6A64]">Detecting floor planes and estimating lighting vectors...</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-[#2F7D50] pt-2">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Floor detected</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Perspective locked</span>
            </div>
          </div>
        )}

        {/* STEP 3: Interactive 3D Spatial Canvas */}
        {activeStep === "preview" && (
          <div className="space-y-4">
            {/* 3D Scene Viewport */}
            <div className="relative aspect-[16/10] bg-[#24211E] rounded-[16px] overflow-hidden border border-[#E5E0DA] flex items-center justify-center">
              {/* Simulated Room Backdrop */}
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                alt="Room backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-65"
              />

              {/* Surface Detection Grid Overlay */}
              <div className="absolute inset-x-8 bottom-4 h-24 border-2 border-dashed border-[#7BAE8A]/70 rounded-[12px] bg-[#7BAE8A]/10 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#7BAE8A] uppercase tracking-wider font-semibold">
                  Detected Floor Plane (True Scale)
                </span>
              </div>

              {/* Placed 3D Furniture with Dynamic Rotation */}
              <div
                className="relative z-10 p-4 transition-transform duration-300 drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]"
                style={{ transform: `rotateY(${rotationAngle}deg)` }}
              >
                <img
                  src={product.images[0]?.imageUrl}
                  alt={product.name}
                  className="max-h-48 max-w-xs object-contain"
                />
              </div>

              {/* Top Controls Overlay */}
              <div className="absolute top-3 left-3 bg-[#24211E]/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white flex items-center gap-2">
                <Lock className="w-3 h-3 text-[#D49A6A]" />
                <span>Scale Constrained: {product.dimensions.widthCm} cm</span>
              </div>

              <div className="absolute top-3 right-3 bg-[#2F7D50]/90 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                ✓ Fits Space Comfortably
              </div>
            </div>

            {/* Transform Controls Toolbar */}
            <div className="p-3.5 bg-[#FAF9F7] rounded-[12px] border border-[#E5E0DA] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
                  className="text-xs gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate ({rotationAngle}°)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`text-xs gap-1.5 ${isSaved ? "bg-[#2F7D50]/10 border-[#2F7D50] text-[#2F7D50]" : ""}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSaved ? "✓ Design Saved" : "Save Room Layout"}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddToCart}
                  className="text-xs gap-1.5 bg-[#8B5E3C] hover:bg-[#634027]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isAdded ? "Added to Cart!" : "Add Placed Item to Cart"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
