import { FurnitureDimensions } from '../../types/visualization';

export const MIN_FURNITURE_SCALE = 0.75;
export const MAX_FURNITURE_SCALE = 1.25;

export interface ScaledDimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  widthMeters: number;
  heightMeters: number;
  depthMeters: number;
}

/**
 * Calculates new position after nudging along X and Z axes.
 */
export function calculateNudge(
  currentPos: [number, number, number],
  dx: number,
  dz: number,
  isLocked: boolean = false
): [number, number, number] {
  if (isLocked) return currentPos;
  return [
    Math.round((currentPos[0] + dx) * 100) / 100,
    currentPos[1],
    Math.round((currentPos[2] + dz) * 100) / 100,
  ];
}

/**
 * Calculates updated rotation in degrees after adding delta.
 */
export function calculateRotation(
  currentRot: [number, number, number],
  deltaDeg: number,
  isLocked: boolean = false
): [number, number, number] {
  if (isLocked) return currentRot;
  const newY = (currentRot[1] + deltaDeg) % 360;
  return [currentRot[0], newY < 0 ? newY + 360 : newY, currentRot[2]];
}

/**
 * Clamps scale between 75% and 125% to preserve authentic product proportions.
 */
export function calculateClampedScale(
  newScale: number,
  isLocked: boolean = false,
  minScale: number = MIN_FURNITURE_SCALE,
  maxScale: number = MAX_FURNITURE_SCALE
): [number, number, number] {
  if (isLocked) return [1, 1, 1];
  const clamped = Math.max(minScale, Math.min(maxScale, Math.round(newScale * 100) / 100));
  return [clamped, clamped, clamped];
}

/**
 * Computes live scaled dimensions in both centimeters and meters.
 */
export function computeScaledDimensions(
  dimensions: FurnitureDimensions,
  scaleFactor: number = 1.0
): ScaledDimensions {
  const s = Math.max(MIN_FURNITURE_SCALE, Math.min(MAX_FURNITURE_SCALE, scaleFactor));
  const widthCm = Math.round(dimensions.widthCm * s);
  const heightCm = Math.round(dimensions.heightCm * s);
  const depthCm = Math.round(dimensions.depthCm * s);

  return {
    widthCm,
    heightCm,
    depthCm,
    widthMeters: widthCm / 100,
    heightMeters: heightCm / 100,
    depthMeters: depthCm / 100,
  };
}
