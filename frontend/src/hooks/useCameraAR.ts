'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ARSupportState = 'checking' | 'supported' | 'unsupported';
export type ARSessionState = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';

export interface CameraAROptions {
  preferredFacingMode?: 'environment' | 'user';
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCameraARReturn {
  sessionState: ARSessionState;
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
}

export function useCameraAR(options: CameraAROptions = {}): UseCameraARReturn {
  const {
    preferredFacingMode = 'environment',
    onSessionStart,
    onSessionEnd,
    onError,
  } = options;

  const [sessionState, setSessionState] = useState<ARSessionState>('idle');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isWebXRSupported, setIsWebXRSupported] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(preferredFacingMode);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

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

    // First try preferred facing mode (environment rear camera for AR)
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false, // Ensure microphone is never requested
    };

    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (modeErr) {
        // Fallback to generic video constraints if specific facing mode fails
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

  // Toggle between environment and user facing cameras
  const toggleCameraFacing = useCallback(async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (sessionState === 'active') {
      stopCameraSession();
      // Allow slight tick for hardware release
      setTimeout(() => {
        startCameraSession();
      }, 100);
    }
  }, [facingMode, sessionState, stopCameraSession, startCameraSession]);

  // Cleanup on unmount — ensures no camera tracks remain running
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
  };
}
