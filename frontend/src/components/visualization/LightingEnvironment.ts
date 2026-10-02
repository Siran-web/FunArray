import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type LightingPreset = 'warm' | 'studio' | 'daylight';

export interface LightingRig {
  ambient: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  contactShadow: THREE.Mesh;
  gridHelper: THREE.GridHelper;
  updatePreset: (mode: LightingPreset) => void;
  dispose: () => void;
}

/**
 * Sets up physically based indoor lighting, soft contact shadows, and PMREM environment reflections.
 */
export function setupLightingAndEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): LightingRig {
  // 1. Physically Correct Color Management & Tone Mapping
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 2. Generate IBL Room Environment for realistic PBR material reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTexture;

  // 3. Hemisphere Light for subtle floor-to-ceiling ambient bounce (prevents flat illumination)
  const hemiLight = new THREE.HemisphereLight(0xf8f9fa, 0x3a3028, 0.38);
  hemiLight.position.set(0, 8, 0);
  hemiLight.name = 'hemiLight';
  scene.add(hemiLight);

  // 4. Subtle Ambient Light (low intensity for soft shadow fill without overexposure)
  const ambient = new THREE.AmbientLight(0xfaf4eb, 0.18);
  ambient.name = 'ambientLight';
  scene.add(ambient);

  // 5. Key Directional Light (simulating large window / primary interior lighting)
  const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.15);
  keyLight.name = 'keyLight';
  keyLight.position.set(3.2, 4.8, 2.8);
  keyLight.castShadow = true;
  // High quality shadow map with tight scene frustum for mobile efficiency
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 12;
  keyLight.shadow.camera.left = -3.8;
  keyLight.shadow.camera.right = 3.8;
  keyLight.shadow.camera.top = 3.8;
  keyLight.shadow.camera.bottom = -3.8;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.035; // Eliminates shadow acne and self-shadow artifacts
  keyLight.shadow.radius = 2.8; // Smooth soft shadow penumbra
  scene.add(keyLight);

  // 6. Soft Fill Directional Light (simulating interior wall bounce from opposite side)
  const fillLight = new THREE.DirectionalLight(0xe0ebf8, 0.28);
  fillLight.name = 'fillLight';
  fillLight.position.set(-3.2, 3.0, -2.2);
  scene.add(fillLight);

  // 7. Ground Contact Shadow Receiver (blends seamlessly with room photo / floor)
  const shadowGeo = new THREE.PlaneGeometry(30, 30);
  const shadowMat = new THREE.ShadowMaterial({
    opacity: 0.32,
    transparent: true,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.0005; // Slightly above zero to avoid z-fighting
  contactShadow.receiveShadow = true;
  contactShadow.name = 'contactShadowPlane';
  scene.add(contactShadow);

  // 8. Subtle Architect's Floor Grid (with millimeter feel)
  const gridHelper = new THREE.GridHelper(10, 20, 0xd97706, 0x57534e);
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.35;
  gridHelper.position.y = 0.001;
  gridHelper.name = 'gridHelper';
  scene.add(gridHelper);

  const updatePreset = (mode: LightingPreset) => {
    if (mode === 'warm') {
      // Cozy indoor residential lighting (warm evening sun / 3000K lamps)
      hemiLight.color.setHex(0xffecd2);
      hemiLight.groundColor.setHex(0x3d2817);
      hemiLight.intensity = 0.42;
      ambient.color.setHex(0xfde047);
      ambient.intensity = 0.16;
      keyLight.color.setHex(0xffe8c8);
      keyLight.intensity = 1.1;
      fillLight.color.setHex(0xffedd5);
      fillLight.intensity = 0.25;
      shadowMat.opacity = 0.36;
      renderer.toneMappingExposure = 1.0;
    } else if (mode === 'studio') {
      // Clean balanced interior design studio showroom (5000K neutral)
      hemiLight.color.setHex(0xf8fafc);
      hemiLight.groundColor.setHex(0x334155);
      hemiLight.intensity = 0.38;
      ambient.color.setHex(0xffffff);
      ambient.intensity = 0.2;
      keyLight.color.setHex(0xffffff);
      keyLight.intensity = 1.2;
      fillLight.color.setHex(0xe2e8f0);
      fillLight.intensity = 0.3;
      shadowMat.opacity = 0.32;
      renderer.toneMappingExposure = 1.0;
    } else if (mode === 'daylight') {
      // Crisp morning sun streaming through large floor-to-ceiling windows (6500K)
      hemiLight.color.setHex(0xe0f2fe);
      hemiLight.groundColor.setHex(0x292524);
      hemiLight.intensity = 0.45;
      ambient.color.setHex(0xf0f9ff);
      ambient.intensity = 0.18;
      keyLight.color.setHex(0xfffaed);
      keyLight.intensity = 1.25;
      fillLight.color.setHex(0xbae6fd);
      fillLight.intensity = 0.35;
      shadowMat.opacity = 0.38;
      renderer.toneMappingExposure = 1.05;
    }
  };

  const dispose = () => {
    pmremGenerator.dispose();
    roomEnv.dispose();
    envTexture.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
  };

  return {
    ambient,
    hemiLight,
    keyLight,
    fillLight,
    contactShadow,
    gridHelper,
    updatePreset,
    dispose,
  };
}
