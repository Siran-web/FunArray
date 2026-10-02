'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useVisualizationStore } from '../../store/visualizationStore';
import { PlacedFurniture } from '../../types/visualization';
import { setupLightingAndEnvironment, LightingRig } from './LightingEnvironment';
import { loadFurnitureModel } from './ModelLoader';
import { Camera, Eye, Layers, Compass, RotateCcw } from 'lucide-react';

export const RoomViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightingRigRef = useRef<LightingRig | null>(null);
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionBoxRef = useRef<THREE.BoxHelper | null>(null);
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [viewPreset, setViewPreset] = useState<'eye-level' | 'perspective' | 'top-down'>('perspective');

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

  // Initialize Realistic Three.js Scene, Camera, and OrbitControls
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Realistic Perspective Camera (Interior Human Perspective: 40° FOV, ~1.35m height)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
    camera.position.set(0, 1.35, 3.6);
    camera.lookAt(0, 0.45, 0);
    cameraRef.current = camera;

    // 3. Physically Correct WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Setup Lighting, Environment Reflections & Contact Shadow Plane
    const lightingRig = setupLightingAndEnvironment(scene, renderer);
    lightingRigRef.current = lightingRig;
    lightingRig.updatePreset(lightingMode);

    // 5. Smooth Orbit Controls with Strict Polar/Floor Clamping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.45, 0);
    controls.minDistance = 0.8;
    controls.maxDistance = 7.5;
    // Prevent unnatural camera clipping beneath floor plane (Math.PI / 2 is exact horizon)
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controlsRef.current = controls;

    // 6. Selection Highlight Helper
    const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0xf59e0b);
    selectionBox.visible = false;
    scene.add(selectionBox);
    selectionBoxRef.current = selectionBox;

    // 7. Dynamic Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      lightingRig.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Synchronize Lighting Mode and Display Toggles
  useEffect(() => {
    if (!lightingRigRef.current) return;
    const rig = lightingRigRef.current;
    rig.updatePreset(lightingMode);
    rig.gridHelper.visible = showGrid;
    rig.contactShadow.visible = showShadows;
  }, [lightingMode, showGrid, showShadows]);

  // Synchronize Placed Furniture Items with Realistic GLB / PBR Geometry
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let isMounted = true;
    const currentMap = furnitureMeshesRef.current;
    const activeIds = new Set(placedFurniture.map((f) => f.id));

    // Remove deleted items
    for (const [id, group] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        scene.remove(group);
        currentMap.delete(id);
      }
    }

    // Load and update active items
    const syncFurniture = async () => {
      for (const item of placedFurniture) {
        let group = currentMap.get(item.id);

        if (!group) {
          setIsLoadingModels(true);
          try {
            group = await loadFurnitureModel(item);
            if (!isMounted) return;
            scene.add(group);
            currentMap.set(item.id, group);
          } catch (err) {
            console.error('Error loading furniture model:', err);
          } finally {
            if (isMounted) setIsLoadingModels(false);
          }
        }

        if (group) {
          // Update transform
          group.position.set(item.position[0], item.position[1], item.position[2]);
          group.rotation.set(
            THREE.MathUtils.degToRad(item.rotation[0]),
            THREE.MathUtils.degToRad(item.rotation[1]),
            THREE.MathUtils.degToRad(item.rotation[2])
          );
          group.scale.set(item.scale[0], item.scale[1], item.scale[2]);
        }
      }

      // Update selection bounding box
      if (selectionBoxRef.current) {
        if (selectedFurnitureId && currentMap.has(selectedFurnitureId)) {
          const targetGroup = currentMap.get(selectedFurnitureId)!;
          selectionBoxRef.current.setFromObject(targetGroup);
          selectionBoxRef.current.visible = true;
        } else {
          selectionBoxRef.current.visible = false;
        }
      }
    };

    syncFurniture();

    return () => {
      isMounted = false;
    };
  }, [placedFurniture, selectedFurnitureId]);

  // Viewpoint Preset Handlers
  const setCameraView = (preset: 'eye-level' | 'perspective' | 'top-down') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setViewPreset(preset);

    if (preset === 'eye-level') {
      // Natural eye-level view from 1.35m height (sitting/standing in room)
      camera.position.set(0, 1.35, 3.4);
      controls.target.set(0, 0.45, 0);
    } else if (preset === 'perspective') {
      // 45° elevated isometric studio perspective
      camera.position.set(2.4, 2.0, 3.0);
      controls.target.set(0, 0.4, 0);
    } else if (preset === 'top-down') {
      // 2D Floorplan layout top-down viewpoint
      camera.position.set(0, 4.8, 0.01);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  // Pointer Interaction: Raycast Furniture Selection & Floor Plane Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

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
        // Disable orbit controls while moving furniture
        if (controlsRef.current) controlsRef.current.enabled = false;
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
      // Clamp bounds to room interior area with 5cm smooth step
      const clampedX = Math.max(-4.5, Math.min(4.5, Math.round(intersectionPoint.x * 20) / 20));
      const clampedZ = Math.max(-4.5, Math.min(4.5, Math.round(intersectionPoint.z * 20) / 20));

      updateFurnitureTransform(selectedFurnitureId, [clampedX, 0, clampedZ]);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  return (
    <div className="relative w-full h-[620px] bg-stone-950 rounded-2xl overflow-hidden border border-stone-800/80 shadow-2xl select-none group">
      {/* 1. ROOM PHOTO COMPOSITE BACKDROP (Preserves original image aspect ratio without stretching) */}
      {roomImage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-950 overflow-hidden pointer-events-none">
          <img
            src={roomImage}
            alt="Room Background"
            className="w-full h-full object-contain filter brightness-95 contrast-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-[0.2px]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-radial from-stone-900 via-stone-950 to-stone-950 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <p className="text-stone-300 font-medium text-sm">Interactive 3D Room & Spatial Studio</p>
          <p className="text-stone-500 text-xs mt-1 max-w-sm">
            Realistic physical materials, grounded soft contact shadows, and human-eye perspective camera.
          </p>
        </div>
      )}

      {/* 2. THREE.JS INTERACTIVE WEBGL CANVAS */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />

      {/* 3. FLOATING STATUS BADGES */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <span className="px-3 py-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-800 text-xs text-stone-300 rounded-xl shadow-lg font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{placedFurniture.length} {placedFurniture.length === 1 ? 'Piece Placed' : 'Pieces Placed'}</span>
        </span>

        {selectedFurnitureId && (
          <span className="px-3 py-1.5 bg-amber-950/85 backdrop-blur-md border border-amber-800/80 text-xs text-amber-400 rounded-xl shadow-lg font-semibold flex items-center gap-1.5">
            ✦ Selected: Drag on floor or orbit space
          </span>
        )}

        {isLoadingModels && (
          <span className="px-3 py-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-800 text-xs text-amber-400 rounded-xl shadow-lg flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading 3D asset...</span>
          </span>
        )}
      </div>

      {/* 4. CAMERA VIEWPOINT PRESET SELECTOR (Planner 5D Style) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-stone-900/85 backdrop-blur-md p-1 rounded-xl border border-stone-800 shadow-xl">
        <button
          onClick={() => setCameraView('eye-level')}
          title="Human Eye Level (1.35m)"
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
            viewPreset === 'eye-level'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eye Level</span>
        </button>

        <button
          onClick={() => setCameraView('perspective')}
          title="Studio 3D Perspective"
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
            viewPreset === 'perspective'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D Studio</span>
        </button>

        <button
          onClick={() => setCameraView('top-down')}
          title="Top-down Floorplan Layout"
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
            viewPreset === 'top-down'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Floorplan</span>
        </button>
      </div>

      {/* 5. BOTTOM NAVIGATION GUIDANCE & RESET */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-900/80 backdrop-blur border border-stone-800 text-stone-400 shadow">
          {roomImage ? '📸 Room Photo Calibrated' : '🖱️ Left click drag to orbit • Right click to pan'}
        </span>

        <button
          onClick={() => setCameraView('perspective')}
          title="Reset Camera View"
          className="p-1.5 bg-stone-900/80 hover:bg-stone-800 backdrop-blur border border-stone-800 text-stone-300 rounded-lg transition shadow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default RoomViewer;

