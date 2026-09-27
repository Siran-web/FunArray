'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ARSupportState = 'checking' | 'supported' | 'unsupported';
export type ARSessionState = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';
export type ARSurfaceState = 'searching' | 'detected' | 'locked' | 'lost';

export interface ARPlacementState {
  isPlaced: boolean;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  elevationCm: number;
}

export interface CameraAROptions {
  preferredFacingMode?: 'environment' | 'user';
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCameraARReturn {
  sessionState: ARSessionState;
  surfaceState: ARSurfaceState;
  surfaceConfidence: number;
  placement: ARPlacementState;
  isSupported: boolean;
  isWebXRSupported: boolean;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  startCameraSession: () => Promise<boolean>;
  stopCameraSession: () => void;
  toggleCameraFacing: () => Promise<void>;
  facingMode: 'environment' | 'user';
  hasPermission: boolean;
  placeFurniture: (x?: number, y?: number) => void;
  resetPlacement: () => void;
  setRotation: (deg: number) => void;
  rotateBy: (deltaDeg: number) => void;
  nudgePosition: (dx: number, dy: number) => void;
  relockSurface: () => void;
}

export function useCameraAR(options: CameraAROptions = {}): UseCameraARReturn {
  const {
    preferredFacingMode = 'environment',
    onSessionStart,
    onSessionEnd,
    onError,
  } = options;

  const [sessionState, setSessionState] = useState<ARSessionState>('idle');
  const [surfaceState, setSurfaceState] = useState<ARSurfaceState>('searching');
  const [surfaceConfidence, setSurfaceConfidence] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isWebXRSupported, setIsWebXRSupported] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(preferredFacingMode);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const [placement, setPlacement] = useState<ARPlacementState>({
    isPlaced: false,
    x: 0,
    y: 20,
    rotation: 0,
    scale: 1,
    elevationCm: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Check initial capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
      setIsSupported(hasMediaDevices);

      if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.isSessionSupported) {
        try {
          const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
          setIsWebXRSupported(!!supported);
        } catch {
          setIsWebXRSupported(false);
        }
      }
    };

    checkCapabilities();
  }, []);

  // Surface detection simulation & plane tracking cycle
  useEffect(() => {
    let confidenceTimer: NodeJS.Timeout;
    if (sessionState === 'active') {
      setSurfaceState('searching');
      setSurfaceConfidence(35);

      confidenceTimer = setTimeout(() => {
        setSurfaceConfidence(98);
        setSurfaceState('detected');
      }, 1000);
    } else {
      setSurfaceState('searching');
      setSurfaceConfidence(0);
    }

    return () => clearTimeout(confidenceTimer);
  }, [sessionState]);

  // Stop camera feed and release media hardware cleanly
  const stopCameraSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn('Error detaching srcObject:', e);
      }
    }

    setStream(null);
    setSessionState('idle');
    setSurfaceState('searching');
    setPlacement({
      isPlaced: false,
      x: 0,
      y: 20,
      rotation: 0,
      scale: 1,
      elevationCm: 0,
    });
    if (onSessionEnd) onSessionEnd();
  }, [onSessionEnd]);

  // Start camera session with permission handling and fallbacks
  const startCameraSession = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSessionState('unsupported');
      setIsSupported(false);
      setErrorMessage('Camera access is not supported by your current browser or device.');
      return false;
    }

    setSessionState('requesting');
    setErrorMessage(null);

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setSessionState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play triggered exception:', playErr);
        }
      }

      if (onSessionStart) onSessionStart();
      return true;
    } catch (err: any) {
      console.error('Camera AR access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSessionState('denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings to use live AR placement.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setSessionState('unsupported');
        setErrorMessage('No camera device found on your hardware. You can use Room Photo Upload mode instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setSessionState('error');
        setErrorMessage('Camera is currently in use by another application.');
      } else {
        setSessionState('error');
        setErrorMessage(err.message || 'Unable to access camera feed.');
      }

      if (onError) onError(err);
      return false;
    }
  }, [facingMode, onSessionStart, onError]);

  // Surface placement & manipulation helpers
  const placeFurniture = useCallback((x?: number, y?: number) => {
    setPlacement((prev) => ({
      ...prev,
      isPlaced: true,
      x: typeof x === 'number' ? x : prev.x,
      y: typeof y === 'number' ? y : prev.y,
    }));
    setSurfaceState('locked');
  }, []);

  const resetPlacement = useCallback(() => {
    setPlacement({
      isPlaced: false,
      x: 0,
      y: 20,
      rotation: 0,
      scale: 1,
      elevationCm: 0,
    });
    setSurfaceState('detected');
  }, []);

  const setRotation = useCallback((deg: number) => {
    setPlacement((prev) => ({
      ...prev,
      rotation: ((deg % 360) + 360) % 360,
    }));
  }, []);

  const rotateBy = useCallback((deltaDeg: number) => {
    setPlacement((prev) => ({
      ...prev,
      rotation: (((prev.rotation + deltaDeg) % 360) + 360) % 360,
    }));
  }, []);

  const nudgePosition = useCallback((dx: number, dy: number) => {
    setPlacement((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const relockSurface = useCallback(() => {
    setSurfaceState('searching');
    setSurfaceConfidence(40);
    setTimeout(() => {
      setSurfaceConfidence(99);
      setSurfaceState('detected');
    }, 800);
  }, []);

  const toggleCameraFacing = useCallback(async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (sessionState === 'active') {
      stopCameraSession();
      setTimeout(() => {
        startCameraSession();
      }, 100);
    }
  }, [facingMode, sessionState, stopCameraSession, startCameraSession]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore on unmount
          }
        });
      }
    };
  }, []);

  return {
    sessionState,
    surfaceState,
    surfaceConfidence,
    placement,
    isSupported,
    isWebXRSupported,
    errorMessage,
    videoRef,
    stream,
    startCameraSession,
    stopCameraSession,
    toggleCameraFacing,
    facingMode,
    hasPermission,
    placeFurniture,
    resetPlacement,
    setRotation,
    rotateBy,
    nudgePosition,
    relockSurface,
  };
}
