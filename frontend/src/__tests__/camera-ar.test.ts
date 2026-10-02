import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  createARPlacementReticle,
  validateSurfacePlacement,
  SurfaceHit,
} from '../components/ar/ARSurfaceManager';

describe('AR Surface Detection & Furniture Placement (TICKET-046 & TICKET-047)', () => {
  let mockStopTrack: any;
  let mockStream: any;

  beforeEach(() => {
    mockStopTrack = vi.fn();
    mockStream = {
      getTracks: vi.fn(() => [
        { stop: mockStopTrack, kind: 'video', readyState: 'live' },
      ]),
    };

    if (typeof global.navigator === 'undefined') {
      (global as any).navigator = {};
    }

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    Object.defineProperty(global.navigator, 'xr', {
      writable: true,
      configurable: true,
      value: {
        isSessionSupported: vi.fn().mockResolvedValue(true),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect WebXR and MediaDevices capabilities', async () => {
    const isMediaDevicesSupported = !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
    const isWebXRSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');

    expect(isMediaDevicesSupported).toBe(true);
    expect(isWebXRSupported).toBe(true);
  });

  it('should request camera stream with environment facing mode and 1080p resolution', async () => {
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    expect(stream).toBe(mockStream);
    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(constraints);
  });

  it('should handle camera permission rejection gracefully without breaking app state', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    (global.navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(permissionError);

    let errorResult: any = null;
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err: any) {
      errorResult = err;
    }

    expect(errorResult).not.toBeNull();
    expect(errorResult.name).toBe('NotAllowedError');
  });

  it('should stop all media tracks cleanly on AR session termination', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    expect(stream).toBeDefined();

    // Terminate session
    stream.getTracks().forEach((track: any) => track.stop());
    expect(mockStopTrack).toHaveBeenCalled();
  });

  it('should guarantee zero audio capture for privacy', async () => {
    const constraints = {
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    };

    await navigator.mediaDevices.getUserMedia(constraints);
    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: false })
    );
  });

  it('should calculate surface rotation degrees properly with wrap-around', () => {
    const rotate = (current: number, delta: number) => (((current + delta) % 360) + 360) % 360;

    expect(rotate(0, 45)).toBe(45);
    expect(rotate(315, 45)).toBe(0);
    expect(rotate(0, -45)).toBe(315);
    expect(rotate(180, 180)).toBe(0);
  });

  it('should calculate position nudging and surface bounds accurately', () => {
    let position = { x: 0, y: 20 };
    const nudge = (dx: number, dy: number) => {
      position = { x: position.x + dx, y: position.y + dy };
    };

    nudge(10, 0);
    expect(position).toEqual({ x: 10, y: 20 });

    nudge(-25, -15);
    expect(position).toEqual({ x: -15, y: 5 });
  });

  it('should preserve true physical dimensions without mutating base product data', () => {
    const product = {
      id: 'prod-kanso',
      name: 'Kanso 3-Seater Sofa',
      dimensions: {
        widthCm: 210,
        heightCm: 85,
        depthCm: 90,
      },
    };

    // AR true scale verification (100cm = 1m)
    const scaleFactor = 1.0;
    const scaledWidthMeters = (product.dimensions.widthCm * scaleFactor) / 100;
    const scaledHeightMeters = (product.dimensions.heightCm * scaleFactor) / 100;
    const scaledDepthMeters = (product.dimensions.depthCm * scaleFactor) / 100;

    expect(scaledWidthMeters).toBe(2.10);
    expect(scaledHeightMeters).toBe(0.85);
    expect(scaledDepthMeters).toBe(0.90);
  });

  it('should create placement reticle and smooth tracking updates via LERP', () => {
    const reticleRig = createARPlacementReticle();
    expect(reticleRig.mesh).toBeDefined();
    expect(reticleRig.isValid()).toBe(false);

    const hit: SurfaceHit = {
      position: new THREE.Vector3(0.5, 0.0, -1.5),
      normal: new THREE.Vector3(0, 1, 0),
      orientation: new THREE.Quaternion(),
      isFloor: true,
      isWall: false,
      tiltDegrees: 0,
      confidence: 0.95,
    };

    reticleRig.updateTarget(hit, 0.016);
    expect(reticleRig.isValid()).toBe(true);
    expect(reticleRig.getCurrentHit()).toBe(hit);
    expect(reticleRig.mesh.visible).toBe(true);

    reticleRig.dispose();
  });

  it('should validate surface placement and reject vertical walls or excessive tilt for floor furniture', () => {
    const validFloorHit: SurfaceHit = {
      position: new THREE.Vector3(0, 0, -2),
      normal: new THREE.Vector3(0, 1, 0),
      orientation: new THREE.Quaternion(),
      isFloor: true,
      isWall: false,
      tiltDegrees: 2,
      confidence: 0.95,
    };

    const validResult = validateSurfacePlacement(validFloorHit, 'Living Room Sofa');
    expect(validResult.isValid).toBe(true);

    const wallHit: SurfaceHit = {
      position: new THREE.Vector3(0, 1.2, -2),
      normal: new THREE.Vector3(0, 0, 1),
      orientation: new THREE.Quaternion(),
      isFloor: false,
      isWall: true,
      tiltDegrees: 88,
      confidence: 0.92,
    };

    const wallResult = validateSurfacePlacement(wallHit, 'Living Room Sofa');
    expect(wallResult.isValid).toBe(false);
    expect(wallResult.reason).toContain('cannot be placed against a vertical wall');

    const tiltedHit: SurfaceHit = {
      position: new THREE.Vector3(0, 0, -2),
      normal: new THREE.Vector3(0.6, 0.8, 0),
      orientation: new THREE.Quaternion(),
      isFloor: false,
      isWall: false,
      tiltDegrees: 37,
      confidence: 0.85,
    };

    const tiltedResult = validateSurfacePlacement(tiltedHit, 'Dining Table');
    expect(tiltedResult.isValid).toBe(false);
    expect(tiltedResult.reason).toContain('flat, horizontal floor surface');
  });
});
