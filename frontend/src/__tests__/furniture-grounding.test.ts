import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createPhotorealisticProceduralFurniture,
  groundModelToBase,
  processAndSanitizePBRMaterial,
} from '../components/visualization/ModelLoader';
import { PlacedFurniture } from '../types/visualization';

describe('3D Furniture Grounding & Soft Shadow Blending', () => {
  const testItems: { type: string; item: PlacedFurniture }[] = [
    {
      type: 'sofa',
      item: {
        id: 'test-sofa',
        productId: 'prod-sofa',
        name: 'Velvet 3-Seater Sofa',
        price: 899.99,
        modelUrl: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 200, heightCm: 85, depthCm: 90 },
        color: 'blue',
      },
    },
    {
      type: 'chair',
      item: {
        id: 'test-chair',
        productId: 'prod-chair',
        name: 'Nordic Fabric Armchair',
        price: 299.99,
        modelUrl: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 85, heightCm: 90, depthCm: 80 },
        color: 'grey',
      },
    },
    {
      type: 'table',
      item: {
        id: 'test-table',
        productId: 'prod-table',
        name: 'Teakwood Coffee Table',
        price: 199.99,
        modelUrl: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 110, heightCm: 45, depthCm: 60 },
        color: 'gold',
      },
    },
    {
      type: 'wardrobe',
      item: {
        id: 'test-wardrobe',
        productId: 'prod-wardrobe',
        name: 'Scandinavian 2-Door Wardrobe',
        price: 799.99,
        modelUrl: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        dimensions: { widthCm: 110, heightCm: 195, depthCm: 60 },
        color: 'sand',
      },
    },
  ];

  testItems.forEach(({ type, item }) => {
    it(`should build grounded 3D model for ${type} with base touching y=0 precisely`, () => {
      const group = createPhotorealisticProceduralFurniture(item);
      expect(group).toBeDefined();

      // Find the ambient contact shadow plane
      const shadow = group.getObjectByName('ambientContactShadow');
      expect(shadow).toBeDefined();
      expect(shadow?.position.y).toBeCloseTo(0.0012, 3);

      // Verify that the lowest geometry vertex is at y = 0.000
      const box = new THREE.Box3().setFromObject(group);
      expect(box.min.y).toBeCloseTo(0.0, 2);
      expect(box.max.y).toBeGreaterThan(0.3); // Has realistic physical height
    });
  });

  it('groundModelToBase should automatically eliminate any arbitrary floating or sinking offset', () => {
    // Construct an arbitrarily floating group
    const floatingGroup = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    mesh.position.set(0.5, 2.75, -0.3); // Floating at y = 2.75
    floatingGroup.add(mesh);

    const groundedBox = groundModelToBase(floatingGroup);
    expect(groundedBox.min.y).toBeCloseTo(0.0, 3);
    expect(groundedBox.max.y).toBeCloseTo(1.0, 3);
  });
});

describe('Physically Based Rendering (PBR) Material Pipeline', () => {
  it('should upgrade MeshBasicMaterial to MeshStandardMaterial preserving color and maps', () => {
    const basicMat = new THREE.MeshBasicMaterial({ color: 0x8b5e3c });
    const processed = processAndSanitizePBRMaterial(basicMat);

    expect(processed instanceof THREE.MeshStandardMaterial).toBe(true);
    expect((processed as THREE.MeshStandardMaterial).color.getHex()).toBe(0x8b5e3c);
    expect((processed as THREE.MeshStandardMaterial).roughness).toBeGreaterThan(0.3);
  });

  it('should configure correct color spaces for albedo vs normal and data maps', () => {
    const dummyTex1 = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    const dummyTex2 = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
    const dummyTex3 = new THREE.DataTexture(new Uint8Array([200, 200, 200, 255]), 1, 1);

    const standardMat = new THREE.MeshStandardMaterial({
      map: dummyTex1,
      normalMap: dummyTex2,
      roughnessMap: dummyTex3,
    });

    const processed = processAndSanitizePBRMaterial(standardMat) as THREE.MeshStandardMaterial;

    // Albedo map must be in sRGB color space
    expect(processed.map?.colorSpace).toBe(THREE.SRGBColorSpace);
    // Normal map and roughness data maps must be Linear / NoColorSpace
    expect(processed.normalMap?.colorSpace).toBe(THREE.NoColorSpace);
    expect(processed.roughnessMap?.colorSpace).toBe(THREE.NoColorSpace);
  });

  it('should recognize glass materials and apply MeshPhysicalMaterial with transmission', () => {
    const glassMat = new THREE.MeshStandardMaterial({
      name: 'Frosted_Glass_Top',
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });

    const processed = processAndSanitizePBRMaterial(glassMat);
    expect(processed instanceof THREE.MeshPhysicalMaterial).toBe(true);
    expect((processed as THREE.MeshPhysicalMaterial).transmission).toBeGreaterThan(0.85);
    expect((processed as THREE.MeshPhysicalMaterial).ior).toBeCloseTo(1.52, 2);
  });

  it('should calibrate non-metal materials so they do not exhibit unnatural metallic sheen', () => {
    const fabricMat = new THREE.MeshStandardMaterial({
      name: 'Linen_Fabric_Cushion',
      color: 0x334155,
      metalness: 0.9, // Over-metallic error in original asset
      roughness: 0.1, // Over-glossy error in original asset
    });

    const processed = processAndSanitizePBRMaterial(fabricMat) as THREE.MeshStandardMaterial;
    expect(processed.metalness).toBeLessThanOrEqual(0.05); // Fabric is dielectric (non-metal)
    expect(processed.roughness).toBeGreaterThanOrEqual(0.75); // Fabric is matte
  });
});
