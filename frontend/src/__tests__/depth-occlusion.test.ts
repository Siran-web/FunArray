import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createCPUDepthMap,
  evaluatePointOcclusion,
  detectWebXRDepthSensing,
  applyARDepthOcclusionToMaterial,
  DEFAULT_OCCLUSION_CONFIG,
} from '../components/ar/ARDepthOcclusion';

describe('WebXR Real-World AR Depth Sensing & Occlusion', () => {
  it('should detect depth sensing support or fallback cleanly in unsupported environments', async () => {
    const capabilities = await detectWebXRDepthSensing();
    expect(capabilities).toBeDefined();
    expect(typeof capabilities.isSupported).toBe('boolean');
    expect(capabilities.rawValueToMeters).toBe(1.0);
  });

  it('should occlude virtual furniture when placed BEHIND a real-world object', () => {
    // Synthetic depth buffer: real table is located at center (u=0.5, v=0.5) at distance 1.2 meters
    const depthMap = createCPUDepthMap(10, 10, new Float32Array(100).fill(1.2));

    const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 100);
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 1.4, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Virtual furniture placed behind the real table (Z = -2.5m, distance ~2.5m)
    const virtualFurniturePoint = new THREE.Vector3(0, 1.4, -2.5);

    const result = evaluatePointOcclusion(virtualFurniturePoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);

    expect(result.isOccluded).toBe(true);
    expect(result.visibility).toBe(0.0);
    expect(result.realDepthMeters).toBeCloseTo(1.2, 2);
    expect(result.virtualDepthMeters).toBeGreaterThan(2.0);
    expect(result.reason).toContain('Occluded');
  });

  it('should NOT occlude virtual furniture when placed IN FRONT OF a real-world background', () => {
    // Real wall is at distance 4.0 meters
    const depthMap = createCPUDepthMap(10, 10, new Float32Array(100).fill(4.0));

    const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 100);
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 1.4, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Virtual furniture placed in front of real wall (Z = -1.5m, distance ~1.5m)
    const virtualFurniturePoint = new THREE.Vector3(0, 1.4, -1.5);

    const result = evaluatePointOcclusion(virtualFurniturePoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);

    expect(result.isOccluded).toBe(false);
    expect(result.visibility).toBe(1.0);
    expect(result.realDepthMeters).toBeCloseTo(4.0, 2);
    expect(result.virtualDepthMeters).toBeLessThan(result.realDepthMeters!);
    expect(result.reason).toContain('Visible');
  });

  it('should accurately handle furniture BESIDE a real-world object', () => {
    // 10x10 depth grid: Left half has real obstacle at 1.0m, Right half is open room at 5.0m
    const depthData = new Float32Array(100);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        depthData[y * 10 + x] = x < 5 ? 1.0 : 5.0;
      }
    }
    const depthMap = createCPUDepthMap(10, 10, depthData);

    const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 100);
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 1.4, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Point on the RIGHT (beside real obstacle) at Z = -2.0m
    const rightPoint = new THREE.Vector3(1.0, 1.4, -2.0);
    const rightResult = evaluatePointOcclusion(rightPoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);

    expect(rightResult.isOccluded).toBe(false);
    expect(rightResult.visibility).toBe(1.0);

    // Point on the LEFT (behind real obstacle) at Z = -2.0m
    const leftPoint = new THREE.Vector3(-1.0, 1.4, -2.0);
    const leftResult = evaluatePointOcclusion(leftPoint, camera, depthMap, DEFAULT_OCCLUSION_CONFIG);

    expect(leftResult.isOccluded).toBe(true);
    expect(leftResult.visibility).toBe(0.0);
  });

  it('should degrade gracefully and keep furniture visible when depth sensing is unavailable or disabled', () => {
    const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 100);
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 1.4, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const virtualPoint = new THREE.Vector3(0, 1.4, -2.0);

    // 1. Null depth map
    const nullDepthResult = evaluatePointOcclusion(virtualPoint, camera, null, DEFAULT_OCCLUSION_CONFIG);
    expect(nullDepthResult.isOccluded).toBe(false);
    expect(nullDepthResult.visibility).toBe(1.0);

    // 2. Disabled config
    const depthMap = createCPUDepthMap(5, 5, new Float32Array(25).fill(1.0));
    const disabledResult = evaluatePointOcclusion(virtualPoint, camera, depthMap, {
      ...DEFAULT_OCCLUSION_CONFIG,
      enabled: false,
    });
    expect(disabledResult.isOccluded).toBe(false);
    expect(disabledResult.visibility).toBe(1.0);
  });

  it('should ignore near-sensor noise (<0.10m) to prevent furniture from disappearing falsely', () => {
    // Sensor noise: 0.02m (e.g. dust or sensor glitch on camera lens)
    const noisyDepthMap = createCPUDepthMap(5, 5, new Float32Array(25).fill(0.02));

    const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 100);
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 1.4, -5);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const virtualPoint = new THREE.Vector3(0, 1.4, -2.0);

    const result = evaluatePointOcclusion(virtualPoint, camera, noisyDepthMap, DEFAULT_OCCLUSION_CONFIG);
    expect(result.isOccluded).toBe(false);
    expect(result.visibility).toBe(1.0);
  });

  it('should attach AR depth occlusion shader hooks to Three.js materials without error', () => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.5 });
    const dummyDepthTexture = { value: null };

    expect(() => {
      applyARDepthOcclusionToMaterial(mat, dummyDepthTexture, DEFAULT_OCCLUSION_CONFIG);
    }).not.toThrow();

    expect(mat.defines).toBeDefined();
    expect(mat.defines?.USE_AR_OCCLUSION).toBeDefined();

    // Trigger onBeforeCompile to simulate WebGL compile phase
    const dummyShader: { uniforms: Record<string, any>; vertexShader: string; fragmentShader: string } = {
      uniforms: {},
      vertexShader: 'void main() {}',
      fragmentShader: '#include <dithering_fragment>',
    };

    if (mat.onBeforeCompile) {
      mat.onBeforeCompile(dummyShader as any, {} as any);
      expect(dummyShader.uniforms.uARDepthTexture).toBeDefined();
      expect(dummyShader.uniforms.uARDepthOcclusionEnabled).toBeDefined();
      expect(dummyShader.fragmentShader).toContain('USE_AR_OCCLUSION');
    }
  });
});
