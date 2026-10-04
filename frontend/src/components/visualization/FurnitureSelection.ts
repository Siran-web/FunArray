import * as THREE from 'three';

export interface SelectionIndicatorRig {
  group: THREE.Group;
  footprintRing: THREE.Mesh;
  arrowMesh: THREE.Mesh;
  update: (targetObject: THREE.Object3D | null, floorElevation?: number, animClock?: number) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/**
 * Creates a clean, subtle 3D selection indicator (floor footprint ring + forward pointer)
 * adhering strictly to the warm FunArray architectural design system (Object Selection: #8B5E3C, Active Handle: #D49A6A).
 */
export function createSelectionIndicatorRig(color: number = 0x8b5e3c): SelectionIndicatorRig {
  const group = new THREE.Group();
  group.name = 'furnitureSelectionIndicator';
  group.visible = false;

  // Floor footprint subtle glowing ring in #8B5E3C
  const ringGeo = new THREE.RingGeometry(0.35, 0.38, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const footprintRing = new THREE.Mesh(ringGeo, ringMat);
  footprintRing.rotation.x = -Math.PI / 2;
  footprintRing.position.y = 0.003;
  group.add(footprintRing);

  // Forward Direction Pointer Arrow in Active Handle color #D49A6A (0xd49a6a)
  const arrowGeo = new THREE.BufferGeometry();
  const arrowVertices = new Float32Array([
    0, 0.004, -0.48,      // tip forward
    -0.05, 0.004, -0.38,  // left base
    0.05, 0.004, -0.38,   // right base
  ]);
  arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowVertices, 3));
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0xd49a6a,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  group.add(arrowMesh);

  const update = (
    targetObject: THREE.Object3D | null,
    floorElevation: number = 0,
    animClock: number = 0
  ) => {
    if (!targetObject) {
      group.visible = false;
      return;
    }

    group.visible = true;
    group.position.set(targetObject.position.x, floorElevation, targetObject.position.z);
    group.rotation.y = targetObject.rotation.y;

    // Dynamically scale footprint to encompass furniture bounding box
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxFootprint = Math.max(size.x, size.z) * 0.7;

    const pulse = 1.0 + Math.sin(animClock * 3.0) * 0.025;
    const finalScale = (maxFootprint || 1) * pulse;
    footprintRing.scale.set(finalScale, finalScale, finalScale);
    arrowMesh.scale.set(maxFootprint || 1, 1, maxFootprint || 1);
  };

  const setVisible = (visible: boolean) => {
    group.visible = visible;
  };

  const dispose = () => {
    ringGeo.dispose();
    ringMat.dispose();
    arrowGeo.dispose();
    arrowMat.dispose();
  };

  return {
    group,
    footprintRing,
    arrowMesh,
    update,
    setVisible,
    dispose,
  };
}
