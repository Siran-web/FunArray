import * as THREE from 'three';

export interface SurfaceHit {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  orientation: THREE.Quaternion;
  isFloor: boolean;
  isWall: boolean;
  tiltDegrees: number;
  confidence: number;
}

export interface ReticleRig {
  mesh: THREE.Group;
  updateTarget: (hit: SurfaceHit | null, deltaTime: number) => void;
  setVisible: (visible: boolean) => void;
  isValid: () => boolean;
  getCurrentHit: () => SurfaceHit | null;
  dispose: () => void;
}

/**
 * Creates a subtle, animated 3D placement reticle with smooth LERP tracking.
 */
export function createARPlacementReticle(): ReticleRig {
  const group = new THREE.Group();
  group.name = 'arPlacementReticle';
  group.visible = false;

  // 1. Outer dashed ring (detected plane visualizer)
  const outerRingGeo = new THREE.RingGeometry(0.22, 0.24, 32);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  group.add(outerRing);

  // 2. Inner solid accent ring
  const innerRingGeo = new THREE.RingGeometry(0.04, 0.055, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  group.add(innerRing);

  // 3. Center Target Dot
  const centerDotGeo = new THREE.CircleGeometry(0.015, 16);
  const centerDotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const centerDot = new THREE.Mesh(centerDotGeo, centerDotMat);
  centerDot.rotation.x = -Math.PI / 2;
  group.add(centerDot);

  // 4. Subtle Orientation Arrow (indicates forward orientation for furniture facing)
  const arrowGeo = new THREE.BufferGeometry();
  const arrowVertices = new Float32Array([
    0, 0.001, -0.32,  // tip forward
    -0.04, 0.001, -0.24,
    0.04, 0.001, -0.24,
  ]);
  arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowVertices, 3));
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  group.add(arrowMesh);

  // Smoothing Targets & State
  const targetPos = new THREE.Vector3();
  const targetQuat = new THREE.Quaternion();
  let currentHit: SurfaceHit | null = null;
  let isHitValid = false;
  let animTime = 0;

  const updateTarget = (hit: SurfaceHit | null, deltaTime: number) => {
    animTime += deltaTime;

    if (hit && (hit.isFloor || hit.confidence > 0.6)) {
      isHitValid = true;
      currentHit = hit;
      group.visible = true;

      targetPos.copy(hit.position);
      targetQuat.copy(hit.orientation);

      // Smooth exponential LERP for position to avoid jittering
      const lerpSpeed = Math.min(1.0, deltaTime * 14);
      group.position.lerp(targetPos, lerpSpeed);
      group.quaternion.slerp(targetQuat, lerpSpeed);

      // Pulse outer ring gently
      const pulse = 1.0 + Math.sin(animTime * 4.0) * 0.06;
      outerRing.scale.set(pulse, pulse, pulse);

      // Update ring color based on surface validity (green = valid floor, amber = scanning)
      if (hit.isFloor) {
        outerRingMat.color.setHex(0x10b981); // Emerald green for valid floor
        innerRingMat.color.setHex(0x34d399);
      } else {
        outerRingMat.color.setHex(0xf59e0b); // Amber for non-floor or tilted
        innerRingMat.color.setHex(0xfbbf24);
      }
    } else {
      isHitValid = false;
      currentHit = null;
      // Gently fade out when tracking is temporarily lost
      outerRingMat.opacity = Math.max(0, outerRingMat.opacity - deltaTime * 3);
      if (outerRingMat.opacity <= 0.05) {
        group.visible = false;
      }
    }
  };

  const setVisible = (visible: boolean) => {
    group.visible = visible;
  };

  const isValid = () => isHitValid;
  const getCurrentHit = () => currentHit;

  const dispose = () => {
    outerRingGeo.dispose();
    outerRingMat.dispose();
    innerRingGeo.dispose();
    innerRingMat.dispose();
    centerDotGeo.dispose();
    centerDotMat.dispose();
    arrowGeo.dispose();
    arrowMat.dispose();
  };

  return {
    mesh: group,
    updateTarget,
    setVisible,
    isValid,
    getCurrentHit,
    dispose,
  };
}

/**
 * Evaluates whether a detected surface is valid for the product category.
 * Rejects tilted surfaces (> 25° for floor furniture) or floating positions.
 */
export function validateSurfacePlacement(
  hit: SurfaceHit,
  productCategory: string = 'floor'
): { isValid: boolean; reason?: string } {
  // If product is standard floor furniture (sofa, chair, table, wardrobe, bed)
  const isFloorPiece = !productCategory.toLowerCase().includes('wall') && !productCategory.toLowerCase().includes('mirror') && !productCategory.toLowerCase().includes('frame');

  if (isFloorPiece) {
    if (hit.isWall) {
      return {
        isValid: false,
        reason: 'Floor furniture cannot be placed against a vertical wall.',
      };
    }

    if (!hit.isFloor || hit.tiltDegrees > 25) {
      return {
        isValid: false,
        reason: 'Please point at a flat, horizontal floor surface.',
      };
    }
  }

  if (hit.confidence < 0.4) {
    return {
      isValid: false,
      reason: 'Low surface tracking confidence. Move phone slowly across floor.',
    };
  }

  return { isValid: true };
}
