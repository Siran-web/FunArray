import * as THREE from 'three';

export interface DepthSensingCapabilities {
  isSupported: boolean;
  usagePreference: 'gpu-optimized' | 'cpu-optimized' | null;
  dataFormat: 'float32' | 'luminance-alpha' | null;
  rawValueToMeters: number;
}

export interface DepthOcclusionConfig {
  enabled: boolean;
  depthBiasMeters: number; // Safety tolerance in meters to avoid surface z-fighting (e.g. 0.04m)
  nearCutoffMeters: number; // Ignore depth readings below 0.1m to prevent camera lens noise
  farCutoffMeters: number; // Ignore depth readings beyond 10.0m
  softBlendEdge: boolean;
}

export const DEFAULT_OCCLUSION_CONFIG: DepthOcclusionConfig = {
  enabled: true,
  depthBiasMeters: 0.04, // 4 cm safety bias
  nearCutoffMeters: 0.10, // 10 cm minimum reliable depth
  farCutoffMeters: 10.0,  // 10 m maximum sensor range
  softBlendEdge: true,
};

export interface CPUDepthMap {
  width: number;
  height: number;
  data: Float32Array | Uint16Array;
  rawValueToMeters: number;
  getDepthInMeters: (u: number, v: number) => number;
}

/**
 * Creates a synthetic or extracted CPU depth map helper.
 */
export function createCPUDepthMap(
  width: number,
  height: number,
  depthValues: Float32Array | number[],
  rawValueToMeters: number = 1.0
): CPUDepthMap {
  const data = depthValues instanceof Float32Array ? depthValues : new Float32Array(depthValues);

  return {
    width,
    height,
    data,
    rawValueToMeters,
    getDepthInMeters(u: number, v: number): number {
      const x = Math.max(0, Math.min(width - 1, Math.floor(u * width)));
      const y = Math.max(0, Math.min(height - 1, Math.floor(v * height)));
      const idx = y * width + x;
      return (data[idx] || 0) * rawValueToMeters;
    },
  };
}

/**
 * Detects if WebXR depth sensing API is available in the current browser context.
 */
export async function detectWebXRDepthSensing(): Promise<DepthSensingCapabilities> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('xr' in navigator)) {
    return {
      isSupported: false,
      usagePreference: null,
      dataFormat: null,
      rawValueToMeters: 1.0,
    };
  }

  try {
    const xr = (navigator as any).xr;
    if (!xr || typeof xr.isSessionSupported !== 'function') {
      return {
        isSupported: false,
        usagePreference: null,
        dataFormat: null,
        rawValueToMeters: 1.0,
      };
    }

    const isARSupported = await xr.isSessionSupported('immersive-ar');
    if (!isARSupported) {
      return {
        isSupported: false,
        usagePreference: null,
        dataFormat: null,
        rawValueToMeters: 1.0,
      };
    }

    // Check if Depth Sensing types exist in the WebXR global environment
    const hasDepthAPI =
      typeof (window as any).XRDepthInformation !== 'undefined' ||
      typeof (window as any).XRCPUDepthInformation !== 'undefined' ||
      typeof (window as any).XRGPUTextureDepthInformation !== 'undefined' ||
      'depthUsage' in (xr as any);

    return {
      isSupported: hasDepthAPI,
      usagePreference: hasDepthAPI ? 'gpu-optimized' : null,
      dataFormat: hasDepthAPI ? 'float32' : null,
      rawValueToMeters: 1.0,
    };
  } catch (err) {
    console.warn('WebXR Depth Sensing capability check encountered error:', err);
    return {
      isSupported: false,
      usagePreference: null,
      dataFormat: null,
      rawValueToMeters: 1.0,
    };
  }
}

/**
 * Evaluates whether a virtual 3D point in world space is occluded by a real-world object.
 * Returns occlusion decision, real depth, virtual distance, and visibility factor.
 */
export function evaluatePointOcclusion(
  pointWorld: THREE.Vector3,
  camera: THREE.Camera,
  depthMap: CPUDepthMap | null,
  config: DepthOcclusionConfig = DEFAULT_OCCLUSION_CONFIG
): {
  isOccluded: boolean;
  realDepthMeters: number | null;
  virtualDepthMeters: number;
  visibility: number; // 1.0 = fully visible, 0.0 = fully occluded behind real object
  reason: string;
} {
  // 1. If depth map is unavailable or occlusion is turned off, object is 100% visible
  if (!config.enabled || !depthMap) {
    return {
      isOccluded: false,
      realDepthMeters: null,
      virtualDepthMeters: pointWorld.distanceTo(camera.position),
      visibility: 1.0,
      reason: 'Depth occlusion disabled or depth map unavailable',
    };
  }

  // 2. Project 3D point to camera normalized device coordinates (NDC [-1, 1])
  const projected = pointWorld.clone().project(camera);

  // If point is outside camera frustum
  if (projected.z < -1 || projected.z > 1 || projected.x < -1 || projected.x > 1 || projected.y < -1 || projected.y > 1) {
    return {
      isOccluded: false,
      realDepthMeters: null,
      virtualDepthMeters: pointWorld.distanceTo(camera.position),
      visibility: 1.0,
      reason: 'Point outside active camera viewport',
    };
  }

  // 3. Convert NDC to UV coordinates [0, 1]
  const u = (projected.x + 1) * 0.5;
  const v = (1 - projected.y) * 0.5; // Flip Y for screen coordinates

  // 4. Sample real-world depth from depth map at (u, v)
  const realDepth = depthMap.getDepthInMeters(u, v);

  // Compute linear distance along camera view direction
  const cameraDir = new THREE.Vector3();
  camera.getWorldDirection(cameraDir);
  const toPoint = pointWorld.clone().sub(camera.position);
  const virtualDepth = toPoint.dot(cameraDir);

  // Ignore invalid or out-of-range sensor depth readings to prevent false disappearance
  if (realDepth < config.nearCutoffMeters || realDepth > config.farCutoffMeters || isNaN(realDepth) || realDepth <= 0) {
    return {
      isOccluded: false,
      realDepthMeters: realDepth,
      virtualDepthMeters: virtualDepth,
      visibility: 1.0,
      reason: 'Sensor depth reading out of valid range (near/far cutoff)',
    };
  }

  // 5. Compare Real Depth vs Virtual Depth with Safety Bias
  // If real object is significantly closer than virtual furniture (realDepth < virtualDepth - bias)
  const depthDiff = virtualDepth - realDepth;

  if (depthDiff > config.depthBiasMeters) {
    // Real object is in front of virtual furniture -> OCCLUDED
    return {
      isOccluded: true,
      realDepthMeters: realDepth,
      virtualDepthMeters: virtualDepth,
      visibility: 0.0,
      reason: `Occluded: Real obstacle at ${realDepth.toFixed(2)}m is in front of virtual object at ${virtualDepth.toFixed(2)}m`,
    };
  }

  return {
    isOccluded: false,
    realDepthMeters: realDepth,
    virtualDepthMeters: virtualDepth,
    visibility: 1.0,
    reason: `Visible: Virtual object at ${virtualDepth.toFixed(2)}m is in front of real background at ${realDepth.toFixed(2)}m`,
  };
}

/**
 * Attaches real-time GPU depth-testing and occlusion shader hooks to a Three.js material.
 */
export function applyARDepthOcclusionToMaterial(
  material: THREE.Material,
  depthTextureUniform: { value: THREE.Texture | null },
  config: DepthOcclusionConfig = DEFAULT_OCCLUSION_CONFIG
): void {
  material.defines = {
    ...material.defines,
    USE_AR_OCCLUSION: '',
  };

  const originalOnBeforeCompile = material.onBeforeCompile;

  material.onBeforeCompile = (shader, renderer) => {
    if (originalOnBeforeCompile) {
      originalOnBeforeCompile(shader, renderer);
    }

    // Add depth occlusion uniforms
    shader.uniforms.uARDepthTexture = depthTextureUniform;
    shader.uniforms.uARDepthOcclusionEnabled = { value: config.enabled };
    shader.uniforms.uARDepthBias = { value: config.depthBiasMeters };
    shader.uniforms.uARNearCutoff = { value: config.nearCutoffMeters };
    shader.uniforms.uARFarCutoff = { value: config.farCutoffMeters };
    shader.uniforms.uARScreenResolution = { value: new THREE.Vector2(
      typeof window !== 'undefined' ? window.innerWidth : 800,
      typeof window !== 'undefined' ? window.innerHeight : 600
    ) };

    // Inject depth comparison code into vertex and fragment shaders
    shader.fragmentShader = `
      uniform sampler2D uARDepthTexture;
      uniform bool uARDepthOcclusionEnabled;
      uniform float uARDepthBias;
      uniform float uARNearCutoff;
      uniform float uARFarCutoff;
      uniform vec2 uARScreenResolution;
    ` + shader.fragmentShader;

    // Inject occlusion discard at the end of color/output stage
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      #ifdef USE_AR_OCCLUSION
      if (uARDepthOcclusionEnabled) {
        vec2 depthUv = gl_FragCoord.xy / max(uARScreenResolution, vec2(1.0));
        float realDepth = texture2D(uARDepthTexture, depthUv).r;
        float virtualDepth = -vViewPosition.z; // Linear depth in camera view space
        
        if (realDepth > uARNearCutoff && realDepth < uARFarCutoff && realDepth < (virtualDepth - uARDepthBias)) {
          discard; // Real-world obstacle is in front, occlude this virtual pixel
        }
      }
      #endif
      `
    );

    material.defines = {
      ...material.defines,
      USE_AR_OCCLUSION: '',
    };
  };

  material.needsUpdate = true;
}
