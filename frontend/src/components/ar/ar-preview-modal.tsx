'use client';

import * as React from 'react';
import { Product } from '@/types/product';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { useVisualizationStore } from '@/store/visualizationStore';
import { RoomViewer } from '../visualization/RoomViewer';
import { FurnitureControls } from '../visualization/FurnitureControls';
import { CameraARViewer } from './camera-ar-viewer';
import {
  Camera,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

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
  const {
    viewMode,
    setViewMode,
    setProductForVisualization,
    placedFurniture,
    selectedFurnitureId,
    setRoomImage,
    roomImage,
  } = useVisualizationStore();

  const [activeStep, setActiveStep] = React.useState<'select-mode' | 'room-photo' | 'camera-ar'>('select-mode');

  // Synchronize product into visualization store when modal opens
  React.useEffect(() => {
    if (isOpen && product) {
      setProductForVisualization(product);
      setActiveStep('select-mode');
    }
  }, [isOpen, product, setProductForVisualization]);

  if (!product) return null;

  const handleSelectMode = (mode: 'room-photo' | 'camera-ar') => {
    setViewMode(mode);
    setActiveStep(mode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View in Your Room"
      description="Interactive 3D Furniture Simulator & True-Scale Camera AR"
      className="max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      <div className="space-y-5 pt-1">
        {/* Product Reference Header */}
        <div className="p-3.5 bg-stone-900/90 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-stone-800 bg-stone-950 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                <Badge variant="ar" className="text-[10px]">
                  1:1 Scale
                </Badge>
              </div>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                {product.dimensions.widthCm} × {product.dimensions.heightCm} × {product.dimensions.depthCm} cm • {product.material}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-sm font-bold text-white font-mono">{formatPrice(product.basePrice)}</span>

            {activeStep !== 'select-mode' && (
              <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => handleSelectMode('room-photo')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                    activeStep === 'room-photo'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Room Photo</span>
                </button>
                <button
                  onClick={() => handleSelectMode('camera-ar')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                    activeStep === 'camera-ar'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera AR</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 1: Mode Chooser */}
        {activeStep === 'select-mode' && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-serif font-medium text-white">Choose Your Preview Experience</h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Both modes use the exact same 1:1 true-to-scale 3D models, PBR materials, and real-time furniture manipulation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Mode 1: Room Photo Visualization */}
              <button
                onClick={() => handleSelectMode('room-photo')}
                className="p-5 rounded-2xl border-2 border-amber-500/60 bg-stone-900/90 hover:bg-stone-850 hover:border-amber-400 text-left transition-all cursor-pointer space-y-3 group shadow-xl"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-white flex items-center justify-between">
                    <span>Mode 1: Room Photo Visualization</span>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Upload a photograph of your room. Our floor-alignment engine matches camera perspective, contact shadows, and dimensions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium pt-1">
                  <span>✓ Photo Upload & Presets</span>
                  <span>•</span>
                  <span>✓ Perspective Calibration</span>
                </div>
              </button>

              {/* Mode 2: Camera AR */}
              <button
                onClick={() => handleSelectMode('camera-ar')}
                className="p-5 rounded-2xl border border-stone-800 bg-stone-900/60 hover:bg-stone-850 hover:border-amber-500/60 text-left transition-all cursor-pointer space-y-3 group shadow-xl"
              >
                <div className="w-11 h-11 rounded-xl bg-stone-800 text-amber-400 border border-stone-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-white flex items-center justify-between">
                    <span>Mode 2: Live Camera AR</span>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Scan your floor in real-time with WebXR surface detection. Place, rotate, and walk around the furniture in live AR.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium pt-1">
                  <span>✓ WebXR Surface Tracking</span>
                  <span>•</span>
                  <span>✓ Contact Shadows</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* MODE 1: Room Photo Visualization */}
        {activeStep === 'room-photo' && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-950">
              <RoomViewer />
            </div>
            <FurnitureControls
              onSwitchMode={(m) => {
                if (m === 'camera-ar') setActiveStep('camera-ar');
              }}
            />
          </div>
        )}

        {/* MODE 2: Camera AR */}
        {activeStep === 'camera-ar' && (
          <div className="space-y-4">
            <CameraARViewer
              product={product}
              onFallbackToPhotoUpload={() => handleSelectMode('room-photo')}
              onAddToCart={onAddToCart}
              onClose={onClose}
            />
            <FurnitureControls
              onSwitchMode={(m) => {
                if (m === 'room-photo') setActiveStep('room-photo');
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ARPreviewModal;
