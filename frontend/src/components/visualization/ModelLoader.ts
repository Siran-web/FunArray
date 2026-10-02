import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PlacedFurniture } from '../../types/visualization';

// In-memory cache for loaded GLTF models
const modelCache = new Map<string, THREE.Group>();
const loadingPromises = new Map<string, Promise<THREE.Group>>();

const gltfLoader = new GLTFLoader();

/**
 * Optimizes texture sampler settings for high-quality, efficient rendering.
 */
function optimizeTexture(texture: THREE.Texture) {
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}

/**
 * Inspects, validates, and enhances materials for physically based rendering.
 * Preserves authored GLTF PBR materials, corrects texture color spaces,
 * supports normal/AO/metalness/roughness maps, and upgrades legacy materials.
 */
export function processAndSanitizePBRMaterial(material: THREE.Material): THREE.Material {
  // 1. Upgrade legacy materials (MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial)
  if (
    material instanceof THREE.MeshBasicMaterial ||
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshPhongMaterial
  ) {
    const upgraded = new THREE.MeshStandardMaterial({
      color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
      map: material.map || null,
      transparent: material.transparent,
      opacity: material.opacity,
      alphaMap: material.alphaMap || null,
      side: material.side || THREE.FrontSide,
      roughness: 0.55,
      metalness: 0.02,
      envMapIntensity: 1.0,
    });
    material.dispose();
    material = upgraded;
  }

  // 2. Configure PBR properties & color spaces on Standard / Physical materials
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
    material.side = THREE.FrontSide;
    material.envMapIntensity = material.envMapIntensity ?? 1.0;

    // Color Maps (sRGB Color Space)
    if (material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace;
      optimizeTexture(material.map);
    }
    if (material.emissiveMap) {
      material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      optimizeTexture(material.emissiveMap);
    }
    if ('sheenColorMap' in material && (material as any).sheenColorMap) {
      (material as any).sheenColorMap.colorSpace = THREE.SRGBColorSpace;
      optimizeTexture((material as any).sheenColorMap);
    }

    // Linear Data Maps (NoColorSpace)
    if (material.normalMap) {
      material.normalMap.colorSpace = THREE.NoColorSpace;
      optimizeTexture(material.normalMap);
    }
    if (material.roughnessMap) {
      material.roughnessMap.colorSpace = THREE.NoColorSpace;
      optimizeTexture(material.roughnessMap);
    }
    if (material.metalnessMap) {
      material.metalnessMap.colorSpace = THREE.NoColorSpace;
      optimizeTexture(material.metalnessMap);
    }
    if (material.aoMap) {
      material.aoMap.colorSpace = THREE.NoColorSpace;
      material.aoMapIntensity = material.aoMapIntensity ?? 1.0;
      optimizeTexture(material.aoMap);
    }
    if (material.bumpMap) {
      material.bumpMap.colorSpace = THREE.NoColorSpace;
      optimizeTexture(material.bumpMap);
    }

    // 3. Glass / Translucent Material Detection
    const matName = (material.name || '').toLowerCase();
    if (
      matName.includes('glass') ||
      matName.includes('crystal') ||
      matName.includes('window') ||
      (material.transparent && material.opacity < 0.6 && !material.alphaMap)
    ) {
      if (!(material instanceof THREE.MeshPhysicalMaterial)) {
        const physicalGlass = new THREE.MeshPhysicalMaterial({
          color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
          roughness: 0.04,
          metalness: 0.0,
          transmission: 0.92,
          ior: 1.52,
          transparent: true,
          opacity: 1.0,
          envMapIntensity: 1.25,
          side: THREE.DoubleSide,
        });
        material.dispose();
        return physicalGlass;
      }
    }

    // 4. Sanitize accidental metallic / glossiness on non-metal surfaces
    const isExplicitMetal =
      matName.includes('metal') ||
      matName.includes('brass') ||
      matName.includes('steel') ||
      matName.includes('chrome') ||
      matName.includes('gold') ||
      matName.includes('iron') ||
      matName.includes('bronze');

    if (!material.metalnessMap && !isExplicitMetal) {
      // Keep realistic dielectric metalness for fabrics, woods, leathers, plastics
      if (material.metalness > 0.4) {
        material.metalness = 0.02;
      }
    }

    // Keep fabrics realistically matte
    const isFabric =
      matName.includes('fabric') ||
      matName.includes('cloth') ||
      matName.includes('velvet') ||
      matName.includes('linen') ||
      matName.includes('cotton') ||
      matName.includes('cushion') ||
      matName.includes('sofa');

    if (!material.roughnessMap && isFabric) {
      material.roughness = Math.max(0.78, material.roughness);
    }

    material.needsUpdate = true;
  }

  return material;
}

/**
 * Creates a photorealistic, soft ambient contact shadow texture with smooth cubic falloff.
 * Avoids harsh dark blobs and provides realistic ambient occlusion under the furniture footprint.
 */
function createContactShadowTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    // SSR / Node test environment fallback texture
    const data = new Uint8Array([0, 0, 0, 0]);
    const dataTex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    dataTex.needsUpdate = true;
    return dataTex;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const data = new Uint8Array([0, 0, 0, 0]);
    return new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  }

  const centerX = 256;
  const centerY = 256;
  const radius = 240;

  const gradient = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, radius);
  // Multi-stop physically based contact occlusion falloff
  gradient.addColorStop(0.0, 'rgba(12, 10, 8, 0.42)'); // Subtle dark contact core
  gradient.addColorStop(0.2, 'rgba(16, 14, 12, 0.32)');
  gradient.addColorStop(0.45, 'rgba(24, 20, 18, 0.18)');
  gradient.addColorStop(0.7, 'rgba(32, 28, 24, 0.07)');
  gradient.addColorStop(0.9, 'rgba(40, 36, 32, 0.02)');
  gradient.addColorStop(1.0, 'rgba(40, 36, 32, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

let contactTextureCache: THREE.Texture | null = null;
function getContactTexture(): THREE.Texture {
  if (!contactTextureCache) {
    contactTextureCache = createContactShadowTexture();
  }
  return contactTextureCache;
}

/**
 * Attaches a soft ambient contact shadow plane directly beneath the furniture footprint.
 * Sized dynamically to the model's bounding box base dimensions.
 */
export function addContactShadowPlane(
  parentGroup: THREE.Group,
  widthMeters: number,
  depthMeters: number
): THREE.Mesh {
  // Plane size slightly larger than footprint to accommodate soft ambient light penumbra
  const shadowGeo = new THREE.PlaneGeometry(widthMeters * 1.32, depthMeters * 1.32);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getContactTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });

  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  // Positioned directly at the floor contact plane (0.001m to prevent z-fighting with floor receiver)
  shadowMesh.position.y = 0.0012;
  shadowMesh.name = 'ambientContactShadow';
  parentGroup.add(shadowMesh);
  return shadowMesh;
}

/**
 * Automatically calculates the lowest point (box.min.y) of any model and offsets it
 * so its base/feet touch y = 0.000 precisely. Never relies on hardcoded Y values.
 */
export function groundModelToBase(group: THREE.Object3D): THREE.Box3 {
  // 1. Force world matrix update for accurate geometry bounding calculation
  group.updateMatrixWorld(true);

  // 2. Compute exact bounding box encompassing all sub-meshes
  const box = new THREE.Box3().setFromObject(group);

  // 3. Offset geometry vertically so lowest contact point is at y = 0.000
  const lowestY = box.min.y;
  group.position.y -= lowestY;

  // 4. Center horizontally in X and Z
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.x -= center.x;
  group.position.z -= center.z;

  // 5. Re-evaluate final grounded bounding box
  group.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(group);
}

/**
 * Loads a 3D GLTF/GLB model, normalizes its bounding box to the specified dimensions,
 * inspects and enhances its PBR materials, grounds its feet to y=0, and enables soft shadows.
 */
export async function loadFurnitureModel(item: PlacedFurniture): Promise<THREE.Group> {
  const targetW = (item.dimensions.widthCm || 85) / 100;
  const targetH = (item.dimensions.heightCm || 85) / 100;
  const targetD = (item.dimensions.depthCm || 80) / 100;

  const wrapperGroup = new THREE.Group();
  wrapperGroup.name = `furniture-${item.id}`;
  wrapperGroup.userData = { id: item.id, productId: item.productId };

  const modelUrl = item.modelUrl;

  // If valid GLB URL is supplied
  if (
    modelUrl &&
    (modelUrl.endsWith('.glb') ||
      modelUrl.endsWith('.gltf') ||
      modelUrl.includes('.glb?') ||
      modelUrl.includes('.gltf?'))
  ) {
    try {
      let baseGroup: THREE.Group;

      if (modelCache.has(modelUrl)) {
        baseGroup = modelCache.get(modelUrl)!.clone(true);
      } else {
        if (!loadingPromises.has(modelUrl)) {
          const promise = new Promise<THREE.Group>((resolve, reject) => {
            gltfLoader.load(
              modelUrl,
              (gltf) => {
                const model = gltf.scene;
                // Enable shadows and process PBR materials on all sub-meshes
                model.traverse((child) => {
                  if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    m.castShadow = true;
                    m.receiveShadow = true;
                    if (m.material) {
                      if (Array.isArray(m.material)) {
                        m.material = m.material.map((mat) => processAndSanitizePBRMaterial(mat));
                      } else {
                        m.material = processAndSanitizePBRMaterial(m.material);
                      }
                    }
                  }
                });
                modelCache.set(modelUrl, model);
                resolve(model);
              },
              undefined,
              (err) => reject(err)
            );
          });
          loadingPromises.set(modelUrl, promise);
        }
        const loadedModel = await loadingPromises.get(modelUrl)!;
        baseGroup = loadedModel.clone(true);
      }

      // Calculate initial raw bounding box
      const initialBox = new THREE.Box3().setFromObject(baseGroup);
      const rawSize = new THREE.Vector3();
      initialBox.getSize(rawSize);

      // Scale model dimensionally to exact target meters
      const scaleX = rawSize.x > 0.001 ? targetW / rawSize.x : 1;
      const scaleY = rawSize.y > 0.001 ? targetH / rawSize.y : 1;
      const scaleZ = rawSize.z > 0.001 ? targetD / rawSize.z : 1;
      const avgScale = (scaleX + scaleY + scaleZ) / 3;
      baseGroup.scale.set(avgScale, avgScale, avgScale);

      // Dynamically calculate and ground the base so the lowest point touches y=0 exactly
      const groundedBox = groundModelToBase(baseGroup);

      const pivotGroup = new THREE.Group();
      pivotGroup.add(baseGroup);
      wrapperGroup.add(pivotGroup);

      // Add dynamic contact shadow scaled to the computed grounded bounding box
      const finalSize = new THREE.Vector3();
      groundedBox.getSize(finalSize);
      addContactShadowPlane(wrapperGroup, finalSize.x || targetW, finalSize.z || targetD);

      return wrapperGroup;
    } catch (err) {
      console.warn(`Failed loading GLB from ${modelUrl}, falling back to high-fidelity procedural model:`, err);
    }
  }

  // Fallback to high-fidelity photorealistic procedural models (Sofa, Table, Chair, Wardrobe)
  return createPhotorealisticProceduralFurniture(item);
}

/**
 * Creates a photorealistic, grounded procedural model with authentic PBR materials
 * for Sofa (plush velvet/fabric), Table (beveled timber & brass), Chair (wood/cushion),
 * and Wardrobe (panel doors, brass handles, plinth base).
 */
export function createPhotorealisticProceduralFurniture(item: PlacedFurniture): THREE.Group {
  const wrapperGroup = new THREE.Group();
  wrapperGroup.name = `furniture-${item.id}`;
  wrapperGroup.userData = { id: item.id, productId: item.productId };

  const meshAssembly = new THREE.Group();

  const w = (item.dimensions.widthCm || 85) / 100;
  const h = (item.dimensions.heightCm || 85) / 100;
  const d = (item.dimensions.depthCm || 80) / 100;

  const colorHex = getColorHex(item.color || 'grey');

  // 1. Physically Authentic Fabric & Cushion Materials (Matte with subtle physical sheen)
  const fabricMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.88,
    metalness: 0.0,
    sheen: 0.35,
    sheenRoughness: 0.75,
    envMapIntensity: 0.55,
  });

  const cushionMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.82,
    metalness: 0.0,
    sheen: 0.45,
    sheenRoughness: 0.65,
    envMapIntensity: 0.6,
  });

  // 2. Physically Authentic Timber / Wood Materials (Warm satin specular reflection)
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x422a18,
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 1.05,
  });

  const naturalOakMat = new THREE.MeshStandardMaterial({
    color: 0xa8855e,
    roughness: 0.45,
    metalness: 0.01,
    envMapIntensity: 0.95,
  });

  // 3. Physically Authentic Metallic Materials (High metalness, calibrated roughness)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.92,
    envMapIntensity: 1.65,
  });

  const matteBlackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1f2124,
    roughness: 0.38,
    metalness: 0.85,
    envMapIntensity: 1.1,
  });

  const nameLower = item.name.toLowerCase();
  const isTable = nameLower.includes('table') || nameLower.includes('desk') || nameLower.includes('stand');
  const isSofa = nameLower.includes('sofa') || nameLower.includes('couch') || nameLower.includes('sectional');
  const isWardrobe =
    nameLower.includes('wardrobe') ||
    nameLower.includes('armoire') ||
    nameLower.includes('closet') ||
    nameLower.includes('cabinet') ||
    nameLower.includes('cupboard');

  if (isWardrobe) {
    // WARDROBE: Main Carcass + Double Doors + Brass Bar Handles + Plinth Base with Shadow Gap
    const plinthH = 0.08;
    const bodyH = h - plinthH;

    // Plinth Base (grounded)
    const plinthGeo = new THREE.BoxGeometry(w * 0.94, plinthH, d * 0.94);
    const plinthMesh = new THREE.Mesh(plinthGeo, darkWoodMat);
    plinthMesh.position.y = plinthH / 2;
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    meshAssembly.add(plinthMesh);

    // Main Carcass Body
    const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
    const bodyMesh = new THREE.Mesh(bodyGeo, naturalOakMat);
    bodyMesh.position.y = plinthH + bodyH / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    meshAssembly.add(bodyMesh);

    // Vertical Door Seam Divider (center line)
    const seamGeo = new THREE.BoxGeometry(0.004, bodyH * 0.96, 0.005);
    const seamMesh = new THREE.Mesh(seamGeo, darkWoodMat);
    seamMesh.position.set(0, plinthH + bodyH / 2, d / 2 + 0.002);
    meshAssembly.add(seamMesh);

    // Left & Right Sleek Brass Handles
    const handleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 16);
    const leftHandle = new THREE.Mesh(handleGeo, brassMat);
    leftHandle.position.set(-0.04, plinthH + bodyH * 0.52, d / 2 + 0.02);
    leftHandle.castShadow = true;
    meshAssembly.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, brassMat);
    rightHandle.position.set(0.04, plinthH + bodyH * 0.52, d / 2 + 0.02);
    rightHandle.castShadow = true;
    meshAssembly.add(rightHandle);

    // Chamfered Crown Molding Top Cap
    const topCapGeo = new THREE.BoxGeometry(w * 1.03, 0.03, d * 1.03);
    const topCap = new THREE.Mesh(topCapGeo, darkWoodMat);
    topCap.position.y = h + 0.015;
    topCap.castShadow = true;
    meshAssembly.add(topCap);
  } else if (isTable) {
    // TABLE: Beveled Top + Apron + 4 Tapered Legs + Brass Floor Ferrules
    const topThickness = 0.04;
    const topGeo = new THREE.BoxGeometry(w, topThickness, d);
    const topMesh = new THREE.Mesh(topGeo, darkWoodMat);
    topMesh.position.y = h - topThickness / 2;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    meshAssembly.add(topMesh);

    // Apron support frame
    const apronGeo = new THREE.BoxGeometry(w * 0.88, 0.05, d * 0.88);
    const apronMesh = new THREE.Mesh(apronGeo, darkWoodMat);
    apronMesh.position.y = h - topThickness - 0.025;
    apronMesh.castShadow = true;
    meshAssembly.add(apronMesh);

    // 4 Tapered legs with brass caps
    const legHeight = h - topThickness;
    const legGeo = new THREE.CylinderGeometry(0.022, 0.014, legHeight, 20);
    const capGeo = new THREE.CylinderGeometry(0.015, 0.014, 0.04, 20);

    const legOffsets = [
      [-w / 2 + 0.08, -d / 2 + 0.08],
      [w / 2 - 0.08, -d / 2 + 0.08],
      [-w / 2 + 0.08, d / 2 - 0.08],
      [w / 2 - 0.08, d / 2 - 0.08],
    ];

    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, darkWoodMat);
      leg.position.set(ox, legHeight / 2, oz);
      leg.castShadow = true;
      meshAssembly.add(leg);

      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(ox, 0.02, oz);
      cap.castShadow = true;
      meshAssembly.add(cap);
    });
  } else if (isSofa) {
    // SOFA: Base Frame + Plush Cushions + Ergonomic Backrest + Armrests + Metal Feet
    const legH = 0.12;

    // Sofa Base Chassis
    const baseGeo = new THREE.BoxGeometry(w, 0.16, d);
    const baseMesh = new THREE.Mesh(baseGeo, fabricMat);
    baseMesh.position.y = legH + 0.08;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    meshAssembly.add(baseMesh);

    // Segmented Cushions
    const numCushions = w > 1.6 ? 3 : 2;
    const cushionW = (w * 0.86) / numCushions;
    const cushionGeo = new THREE.BoxGeometry(cushionW - 0.02, 0.14, d * 0.78);
    for (let i = 0; i < numCushions; i++) {
      const seat = new THREE.Mesh(cushionGeo, cushionMat);
      const startX = -((numCushions - 1) * cushionW) / 2;
      seat.position.set(startX + i * cushionW, legH + 0.16 + 0.07, 0.04);
      seat.castShadow = true;
      seat.receiveShadow = true;
      meshAssembly.add(seat);
    }

    // Backrest
    const backH = h - legH - 0.16;
    const backGeo = new THREE.BoxGeometry(w, backH, 0.22);
    const backMesh = new THREE.Mesh(backGeo, cushionMat);
    backMesh.position.set(0, legH + 0.16 + backH / 2, -d / 2 + 0.11);
    backMesh.rotation.x = 0.05;
    backMesh.castShadow = true;
    meshAssembly.add(backMesh);

    // Left & Right Armrests
    const armW = 0.15;
    const armH = h * 0.58;
    const armGeo = new THREE.BoxGeometry(armW, armH, d);
    const leftArm = new THREE.Mesh(armGeo, fabricMat);
    leftArm.position.set(-w / 2 + armW / 2, legH + armH / 2, 0);
    leftArm.castShadow = true;
    meshAssembly.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, fabricMat);
    rightArm.position.set(w / 2 - armW / 2, legH + armH / 2, 0);
    rightArm.castShadow = true;
    meshAssembly.add(rightArm);

    // 4 Brass Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.016, legH, 16);
    const legOffsets = [
      [-w / 2 + 0.1, -d / 2 + 0.1],
      [w / 2 - 0.1, -d / 2 + 0.1],
      [-w / 2 + 0.1, d / 2 - 0.1],
      [w / 2 - 0.1, d / 2 - 0.1],
    ];
    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(ox, legH / 2, oz);
      leg.castShadow = true;
      meshAssembly.add(leg);
    });
  } else {
    // CHAIR / ARMCHAIR: Padded Seat + Curved Back + Slanted Legs
    const seatH = h * 0.44;
    const cushionGeo = new THREE.BoxGeometry(w * 0.88, 0.09, d * 0.82);
    const seat = new THREE.Mesh(cushionGeo, cushionMat);
    seat.position.y = seatH;
    seat.castShadow = true;
    seat.receiveShadow = true;
    meshAssembly.add(seat);

    // Curved Ergonomic Backrest
    const backH = h - seatH;
    const backGeo = new THREE.BoxGeometry(w * 0.84, backH, 0.08);
    const backMesh = new THREE.Mesh(backGeo, cushionMat);
    backMesh.position.set(0, seatH + backH / 2, -d * 0.36);
    backMesh.rotation.x = 0.08;
    backMesh.castShadow = true;
    meshAssembly.add(backMesh);

    // Tapered Wooden Legs with subtle outward splay
    const legGeo = new THREE.CylinderGeometry(0.02, 0.012, seatH, 16);
    const legOffsets = [
      [-w * 0.36, -d * 0.32, -0.05, -0.05],
      [w * 0.36, -d * 0.32, 0.05, -0.05],
      [-w * 0.36, d * 0.32, -0.05, 0.05],
      [w * 0.36, d * 0.32, 0.05, 0.05],
    ];
    legOffsets.forEach(([ox, oz, tiltZ, tiltX]) => {
      const leg = new THREE.Mesh(legGeo, darkWoodMat);
      leg.position.set(ox, seatH / 2, oz);
      leg.rotation.z = tiltZ;
      leg.rotation.x = tiltX;
      leg.castShadow = true;
      meshAssembly.add(leg);
    });
  }

  // Automatically ground the assembled model to y = 0.000
  const groundedBox = groundModelToBase(meshAssembly);
  wrapperGroup.add(meshAssembly);

  // Add soft ambient contact shadow sized to the grounded base footprint
  const size = new THREE.Vector3();
  groundedBox.getSize(size);
  addContactShadowPlane(wrapperGroup, size.x || w, size.z || d);

  return wrapperGroup;
}

function getColorHex(colorName: string): number {
  const map: Record<string, number> = {
    grey: 0x52525b,
    gray: 0x52525b,
    charcoal: 0x27272a,
    blue: 0x1e3a5f,
    navy: 0x0f172a,
    amber: 0xd97706,
    gold: 0xb45309,
    emerald: 0x065f46,
    green: 0x166534,
    terracotta: 0x9a3412,
    sand: 0xd6d3d1,
    cream: 0xfef3c7,
    white: 0xf4f4f5,
    black: 0x18181b,
  };
  return map[colorName.toLowerCase().trim()] || 0x52525b;
}
