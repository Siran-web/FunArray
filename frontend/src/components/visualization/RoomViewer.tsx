'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useVisualizationStore } from '../../store/visualizationStore';
import { PlacedFurniture } from '../../types/visualization';

export const RoomViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [modelErrors, setModelErrors] = useState<Record<string, string>>({});

  const {
    roomImage,
    placedFurniture,
    selectedFurnitureId,
    selectFurniture,
    updateFurnitureTransform,
    lightingMode,
    showGrid,
    showShadows,
  } = useVisualizationStore();

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 4.5);
    camera.lookAt(0, 0.6, 0);
    cameraRef.current = camera;

    // WebGL Renderer with alpha transparency so room background shines through
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    mainLight.name = 'mainLight';
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.5);
    fillLight.name = 'fillLight';
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    // Floor Shadow Receiver Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(20, 20);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    shadowPlane.name = 'shadowPlane';
    scene.add(shadowPlane);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xf59e0b, 0x44403c);
    gridHelper.position.y = 0.001;
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    // Selection Box Helper
    const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xf59e0b);
    selectionBox.visible = false;
    scene.add(selectionBox);
    selectionBoxRef.current = selectionBox;

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Lighting Mode and Grid
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ambient = scene.getObjectByName('ambientLight') as THREE.AmbientLight;
    const mainLight = scene.getObjectByName('mainLight') as THREE.DirectionalLight;
    const grid = scene.getObjectByName('gridHelper');
    const shadowPlane = scene.getObjectByName('shadowPlane');

    if (grid) grid.visible = showGrid;
    if (shadowPlane) shadowPlane.visible = showShadows;

    if (ambient && mainLight) {
      if (lightingMode === 'warm') {
        ambient.color.setHex(0xfff7ed);
        ambient.intensity = 0.9;
        mainLight.color.setHex(0xfef3c7);
        mainLight.intensity = 1.3;
      } else if (lightingMode === 'studio') {
        ambient.color.setHex(0xffffff);
        ambient.intensity = 1.0;
        mainLight.color.setHex(0xffffff);
        mainLight.intensity = 1.5;
      } else if (lightingMode === 'daylight') {
        ambient.color.setHex(0xf0f9ff);
        ambient.intensity = 0.9;
        mainLight.color.setHex(0xffedd5);
        mainLight.intensity = 1.7;
      }
    }
  }, [lightingMode, showGrid, showShadows]);

  // Sync Placed Furniture 3D Meshes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = furnitureMeshesRef.current;
    const activeIds = new Set(placedFurniture.map((f) => f.id));

    // Remove obsolete meshes
    for (const [id, group] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        scene.remove(group);
        currentMap.delete(id);
      }
    }

    // Add or update furniture meshes
    placedFurniture.forEach((item) => {
      let group = currentMap.get(item.id);

      if (!group) {
        group = createFurnitureMeshGroup(item);
        scene.add(group);
        currentMap.set(item.id, group);
      }

      // Update transform
      group.position.set(item.position[0], item.position[1], item.position[2]);
      group.rotation.set(
        THREE.MathUtils.degToRad(item.rotation[0]),
        THREE.MathUtils.degToRad(item.rotation[1]),
        THREE.MathUtils.degToRad(item.rotation[2])
      );
      group.scale.set(item.scale[0], item.scale[1], item.scale[2]);
    });

    // Update selection box
    if (selectionBoxRef.current) {
      if (selectedFurnitureId && currentMap.has(selectedFurnitureId)) {
        const targetGroup = currentMap.get(selectedFurnitureId)!;
        selectionBoxRef.current.setFromObject(targetGroup);
        selectionBoxRef.current.visible = true;
      } else {
        selectionBoxRef.current.visible = false;
      }
    }
  }, [placedFurniture, selectedFurnitureId]);

  // Procedural Photorealistic 3D Furniture Builder
  const createFurnitureMeshGroup = (item: PlacedFurniture): THREE.Group => {
    const group = new THREE.Group();
    group.name = `furniture-${item.id}`;
    group.userData = { id: item.id };

    const w = (item.dimensions.widthCm || 80) / 100;
    const h = (item.dimensions.heightCm || 85) / 100;
    const d = (item.dimensions.depthCm || 80) / 100;

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.35,
      metalness: 0.1,
    });
    const fabricMat = new THREE.MeshStandardMaterial({
      color: item.color ? getColorHex(item.color) : 0x475569,
      roughness: 0.8,
      metalness: 0.05,
    });
    const cushionMat = new THREE.MeshStandardMaterial({
      color: item.color ? getColorHex(item.color) : 0x334155,
      roughness: 0.75,
      metalness: 0.0,
    });

    // Determine furniture type by name or dimensions
    const isTable = item.name.toLowerCase().includes('table') || item.name.toLowerCase().includes('desk');
    const isSofa = item.name.toLowerCase().includes('sofa') || item.name.toLowerCase().includes('couch');

    if (isTable) {
      // Table Top
      const topGeo = new THREE.BoxGeometry(w, 0.04, d);
      const topMesh = new THREE.Mesh(topGeo, woodMat);
      topMesh.position.y = h - 0.02;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // 4 Legs
      const legRadius = 0.025;
      const legHeight = h - 0.04;
      const legGeo = new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legHeight, 16);
      const legOffsets = [
        [-w / 2 + 0.06, -d / 2 + 0.06],
        [w / 2 - 0.06, -d / 2 + 0.06],
        [-w / 2 + 0.06, d / 2 - 0.06],
        [w / 2 - 0.06, d / 2 - 0.06],
      ];
      legOffsets.forEach(([ox, oz]) => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(ox, legHeight / 2, oz);
        leg.castShadow = true;
        group.add(leg);
      });
    } else if (isSofa) {
      // Sofa Base
      const baseGeo = new THREE.BoxGeometry(w, 0.25, d);
      const baseMesh = new THREE.Mesh(baseGeo, fabricMat);
      baseMesh.position.y = 0.125 + 0.08;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      // Sofa Backrest
      const backGeo = new THREE.BoxGeometry(w, h - 0.2, 0.18);
      const backMesh = new THREE.Mesh(backGeo, cushionMat);
      backMesh.position.set(0, h / 2 + 0.1, -d / 2 + 0.09);
      backMesh.castShadow = true;
      group.add(backMesh);

      // 2 Armrests
      const armGeo = new THREE.BoxGeometry(0.14, h * 0.6, d);
      const leftArm = new THREE.Mesh(armGeo, fabricMat);
      leftArm.position.set(-w / 2 + 0.07, (h * 0.6) / 2 + 0.08, 0);
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, fabricMat);
      rightArm.position.set(w / 2 - 0.07, (h * 0.6) / 2 + 0.08, 0);
      rightArm.castShadow = true;
      group.add(rightArm);
    } else {
      // Armchair / Chair Structure
      const seatHeight = h * 0.45;
      const seatGeo = new THREE.BoxGeometry(w * 0.9, 0.08, d * 0.85);
      const seatMesh = new THREE.Mesh(seatGeo, cushionMat);
      seatMesh.position.y = seatHeight;
      seatMesh.castShadow = true;
      group.add(seatMesh);

      // Backrest
      const backGeo = new THREE.BoxGeometry(w * 0.85, h - seatHeight, 0.08);
      const backMesh = new THREE.Mesh(backGeo, cushionMat);
      backMesh.position.set(0, seatHeight + (h - seatHeight) / 2, -d * 0.38);
      backMesh.castShadow = true;
      group.add(backMesh);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.02, 0.015, seatHeight, 16);
      const legOffsets = [
        [-w * 0.38, -d * 0.34],
        [w * 0.38, -d * 0.34],
        [-w * 0.38, d * 0.34],
        [w * 0.38, d * 0.34],
      ];
      legOffsets.forEach(([ox, oz]) => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(ox, seatHeight / 2, oz);
        leg.castShadow = true;
        group.add(leg);
      });
    }

    return group;
  };

  const getColorHex = (colorName: string): number => {
    const map: Record<string, number> = {
      grey: 0x64748b,
      gray: 0x64748b,
      charcoal: 0x334155,
      blue: 0x1e3a8a,
      navy: 0x0f172a,
      amber: 0xd97706,
      gold: 0xb45309,
      emerald: 0x047857,
      green: 0x15803d,
      terracotta: 0x9a3412,
      sand: 0xd6d3d1,
      white: 0xf8fafc,
      black: 0x18181b,
    };
    const key = colorName.toLowerCase().trim();
    return map[key] || 0x475569;
  };

  // Pointer Click & Drag for Furniture Placement
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // Test intersection against all furniture groups
    const furnitureGroups = Array.from(furnitureMeshesRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(furnitureGroups, true);

    if (intersects.length > 0) {
      let hitObject: THREE.Object3D | null = intersects[0].object;
      while (hitObject && !hitObject.userData.id && hitObject.parent) {
        hitObject = hitObject.parent;
      }

      if (hitObject && hitObject.userData.id) {
        selectFurniture(hitObject.userData.id);
        isDraggingRef.current = true;
      }
    } else {
      selectFurniture(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !selectedFurnitureId) return;
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersectionPoint = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionPoint);

    if (intersectionPoint) {
      // Clamp bounds to room area
      const clampedX = Math.max(-4, Math.min(4, Math.round(intersectionPoint.x * 20) / 20));
      const clampedZ = Math.max(-4, Math.min(4, Math.round(intersectionPoint.z * 20) / 20));

      updateFurnitureTransform(selectedFurnitureId, [clampedX, 0, clampedZ]);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-[580px] bg-stone-950 rounded-2xl overflow-hidden border border-stone-800/80 shadow-2xl select-none group">
      {/* Background Room Photo Composite */}
      {roomImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${roomImage})` }}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-stone-300 font-medium text-sm">Interactive 3D Furniture Studio</p>
          <p className="text-stone-500 text-xs mt-1 max-w-sm">
            Upload your room photo above or click any product to arrange models in your space.
          </p>
        </div>
      )}

      {/* Three.js Interactive WebGL Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />

      {/* Floating Canvas Badges / Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 bg-stone-900/80 backdrop-blur-md border border-stone-800 text-xs text-stone-300 rounded-lg shadow font-medium">
          {placedFurniture.length} {placedFurniture.length === 1 ? 'Model Placed' : 'Models Placed'}
        </span>
        {selectedFurnitureId && (
          <span className="px-2.5 py-1 bg-amber-950/80 backdrop-blur-md border border-amber-800/80 text-xs text-amber-400 rounded-lg shadow font-semibold">
            ✦ Selected: Drag to Move
          </span>
        )}
      </div>

      {/* Room Image Attribution / Clear */}
      {roomImage && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-stone-950/80 backdrop-blur border border-stone-800 text-stone-400">
            Room Background Active
          </span>
        </div>
      )}
    </div>
  );
};

export default RoomViewer;
