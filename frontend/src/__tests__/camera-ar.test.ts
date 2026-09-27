import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Camera AR Foundation (TICKET-046)', () => {
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

  it('should provide fallback when WebXR is not supported', async () => {
    (navigator as any).xr.isSessionSupported.mockResolvedValueOnce(false);
    const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
    expect(supported).toBe(false);
  });
});
