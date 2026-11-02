import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TerrainData } from '../../engine/TerrainEngine';
import type { BrushParams } from '../../engine/TerrainEngine';
import { RefreshDuotone } from '../icons/DuotoneIcons';

export type ViewportMode = 'textured' | 'height_heatmap' | 'slope_overlay' | 'splatmap_rgb' | 'wireframe';

interface TerrainViewportProps {
  terrainData: TerrainData;
  activeBrush: BrushParams | null;
  viewportMode: ViewportMode;
  waterLevel: number;
  showWater: boolean;
  sunElevation: number; // 10 to 80 degrees
  sunAzimuth: number; // 0 to 360 degrees
  onBrushStroke: (x: number, y: number) => void;
  onHoverCoord?: (x: number, y: number, height: number, slopeDeg: number) => void;
}

export const TerrainViewport: React.FC<TerrainViewportProps> = ({
  terrainData,
  activeBrush,
  viewportMode,
  waterLevel,
  showWater,
  sunElevation,
  sunAzimuth,
  onBrushStroke,
  onHoverCoord,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainGeoRef = useRef<THREE.PlaneGeometry | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const brushRingRef = useRef<THREE.Line | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const isMouseDownRef = useRef<boolean>(false);
  const isRightMouseDownRef = useRef<boolean>(false);
  const mousePrevRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera spherical orbit params
  const cameraOrbitRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI * 0.25,
    phi: Math.PI * 0.35,
    radius: 180,
    target: new THREE.Vector3(0, 10, 0),
  });

  const [fps, setFps] = useState<number>(60);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; alt: number; slope: number } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b10);
    scene.fog = new THREE.FogExp2(0x090b10, 0.0025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x3a4b60, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 500;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Water Plane
    const waterGeo = new THREE.PlaneGeometry(300, 300);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.65,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // Brush cursor ring
    const ringGeo = new THREE.BufferGeometry();
    const ringPoints: THREE.Vector3[] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    ringGeo.setFromPoints(ringPoints);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      linewidth: 2,
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    const brushRing = new THREE.Line(ringGeo, ringMat);
    brushRing.visible = false;
    brushRing.renderOrder = 999;
    scene.add(brushRing);
    brushRingRef.current = brushRing;

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = lastTime;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      frameCount++;
      const now = performance.now();

      if (now - fpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTime)));
        frameCount = 0;
        fpsTime = now;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Camera Orbit
  const updateCameraPosition = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { theta, phi, radius, target } = cameraOrbitRef.current;
    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = target.y + radius * Math.cos(phi);
    camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(target);
  }, []);

  // Update Sun Direction
  useEffect(() => {
    const sunLight = sunLightRef.current;
    if (!sunLight) return;
    const phi = (90 - sunElevation) * (Math.PI / 180);
    const theta = sunAzimuth * (Math.PI / 180);
    const dist = 180;
    sunLight.position.set(
      dist * Math.sin(phi) * Math.sin(theta),
      dist * Math.cos(phi),
      dist * Math.sin(phi) * Math.cos(theta)
    );
  }, [sunElevation, sunAzimuth]);

  // Update Water Plane
  useEffect(() => {
    if (!waterMeshRef.current) return;
    waterMeshRef.current.visible = showWater;
    waterMeshRef.current.position.y = waterLevel * 40; // match terrain vertical scale
  }, [showWater, waterLevel]);

  // Build / Update Terrain Mesh and Vertex Colors based on Mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const R = terrainData.resolution;
    const meshSize = 120; // 120 world units
    const heightScale = 40.0;

    // Check if we need to recreate geometry or just update attributes
    let geo = terrainGeoRef.current;
    let mesh = terrainMeshRef.current;

    const needRebuild = !geo || !mesh || geo.parameters.widthSegments !== R - 1;

    if (needRebuild) {
      if (mesh) {
        scene.remove(mesh);
        geo?.dispose();
        (mesh.material as THREE.Material).dispose();
      }

      geo = new THREE.PlaneGeometry(meshSize, meshSize, R - 1, R - 1);
      geo.rotateX(-Math.PI / 2);
      terrainGeoRef.current = geo;

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.75,
        metalness: 0.1,
        flatShading: false,
      });

      mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      terrainMeshRef.current = mesh;
    }

    if (!geo || !mesh) return;

    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    // Color attribute for vertex coloring
    let colorAttr = geo.attributes.color as THREE.BufferAttribute;
    if (!colorAttr || colorAttr.count !== posAttr.count) {
      colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3);
      geo.setAttribute('color', colorAttr);
    }
    const colorArr = colorAttr.array as Float32Array;

    // Multi-color palette definitions
    const cRock = new THREE.Color(0x5a626f);
    const cGrass = new THREE.Color(0x3a6f3a);
    const cDirt = new THREE.Color(0x6b4c35);
    const cSnow = new THREE.Color(0xe6f0fa);
    const cTemp = new THREE.Color();

    for (let y = 0; y < R; y++) {
      for (let x = 0; x < R; x++) {
        const gridIdx = y * R + x;
        const vertIdx = y * R + x;

        // PlaneGeometry vertex Y displacement
        const h = terrainData.height[gridIdx];
        posArr[vertIdx * 3 + 1] = h * heightScale;

        // Color based on viewportMode
        const colorOffset = vertIdx * 3;

        if (viewportMode === 'textured') {
          const slope = terrainData.slopeMask[gridIdx];
          const alt = terrainData.altitudeMask[gridIdx];
          const curv = terrainData.curvatureMask[gridIdx];
          const sed = Math.min(1.0, terrainData.depositedSediment[gridIdx] * 12.0);

          // Blend textures
          if (alt > 0.7 && slope < 0.6) {
            // High altitude snow
            cTemp.copy(cSnow);
          } else if (slope > 0.45) {
            // Steep rock cliff
            cTemp.copy(cRock);
            if (curv < 0.4) cTemp.offsetHSL(0, 0, 0.08); // ridge highlight
          } else if (sed > 0.15 || curv > 0.6) {
            // Valleys, riverbeds, silt
            cTemp.copy(cDirt);
          } else {
            // Lowland grass
            cTemp.copy(cGrass);
          }

          colorArr[colorOffset] = cTemp.r;
          colorArr[colorOffset + 1] = cTemp.g;
          colorArr[colorOffset + 2] = cTemp.b;
        } else if (viewportMode === 'height_heatmap') {
          // Heatmap: Blue (0) -> Green (0.3) -> Yellow (0.6) -> Red (0.8) -> White (1.0)
          if (h < 0.25) {
            cTemp.setRGB(0.0, h * 4, 1.0);
          } else if (h < 0.5) {
            cTemp.setRGB(0.0, 1.0, 1.0 - (h - 0.25) * 4);
          } else if (h < 0.75) {
            cTemp.setRGB((h - 0.5) * 4, 1.0, 0.0);
          } else {
            cTemp.setRGB(1.0, 1.0 - (h - 0.75) * 2, (h - 0.75) * 4);
          }
          colorArr[colorOffset] = cTemp.r;
          colorArr[colorOffset + 1] = cTemp.g;
          colorArr[colorOffset + 2] = cTemp.b;
        } else if (viewportMode === 'slope_overlay') {
          const slope = terrainData.slopeMask[gridIdx];
          // Green = flat, Yellow = moderate, Red = cliff
          if (slope < 0.3) {
            cTemp.setRGB(0.1, 0.8, 0.2);
          } else if (slope < 0.7) {
            cTemp.setRGB(0.9, 0.8, 0.1);
          } else {
            cTemp.setRGB(0.9, 0.2, 0.1);
          }
          colorArr[colorOffset] = cTemp.r;
          colorArr[colorOffset + 1] = cTemp.g;
          colorArr[colorOffset + 2] = cTemp.b;
        } else if (viewportMode === 'splatmap_rgb') {
          // Directly show packed splatmap RGB
          const slope = terrainData.slopeMask[gridIdx];
          const curv = terrainData.curvatureMask[gridIdx];
          const sed = Math.min(1.0, terrainData.depositedSediment[gridIdx] * 10.0);
          colorArr[colorOffset] = slope; // Red: Rock
          colorArr[colorOffset + 1] = 1.0 - slope; // Green: Grass
          colorArr[colorOffset + 2] = sed * 0.7 + curv * 0.3; // Blue: Dirt
        } else {
          // Monochrome
          colorArr[colorOffset] = h;
          colorArr[colorOffset + 1] = h;
          colorArr[colorOffset + 2] = h;
        }
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.wireframe = viewportMode === 'wireframe';
    mat.needsUpdate = true;
  }, [terrainData, viewportMode]);

  // Pointer Interaction (Camera Orbit & 3D Brush Raycasting)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    mousePrevRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 0) {
      // Left click
      if (e.altKey) {
        // Alt + Left Click = Camera Orbit
        isRightMouseDownRef.current = true;
      } else if (activeBrush) {
        // Painting with brush
        isMouseDownRef.current = true;
        castBrushRay(e.clientX, e.clientY);
      } else {
        isRightMouseDownRef.current = true;
      }
    } else if (e.button === 2) {
      // Right click = Always camera orbit
      isRightMouseDownRef.current = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const dx = e.clientX - mousePrevRef.current.x;
    const dy = e.clientY - mousePrevRef.current.y;
    mousePrevRef.current = { x: e.clientX, y: e.clientY };

    // Orbit Camera
    if (isRightMouseDownRef.current) {
      const orbit = cameraOrbitRef.current;
      orbit.theta -= dx * 0.008;
      orbit.phi = Math.max(0.1, Math.min(Math.PI * 0.48, orbit.phi - dy * 0.008));
      updateCameraPosition();
      return;
    }

    // Brush Raycast & Hover calculation
    castBrushRay(e.clientX, e.clientY);

    // Continuous Brush painting
    if (isMouseDownRef.current && activeBrush) {
      castBrushRay(e.clientX, e.clientY, true);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
    isRightMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const orbit = cameraOrbitRef.current;
    orbit.radius = Math.max(30, Math.min(500, orbit.radius + e.deltaY * 0.15));
    updateCameraPosition();
  };

  const castBrushRay = (clientX: number, clientY: number, applyStroke: boolean = false) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const mesh = terrainMeshRef.current;
    if (!container || !camera || !mesh) return;

    const rect = container.getBoundingClientRect();
    mousePosRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mousePosRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mousePosRef.current, camera);
    const intersects = raycasterRef.current.intersectObject(mesh);

    const ring = brushRingRef.current;

    if (intersects.length > 0) {
      const hit = intersects[0];
      const pt = hit.point;

      // Convert world coords (-60 to +60) to terrain grid coords (0 to R-1)
      const meshSize = 120;
      const R = terrainData.resolution;
      const gridX = ((pt.x + meshSize * 0.5) / meshSize) * R;
      const gridY = ((pt.z + meshSize * 0.5) / meshSize) * R;

      const cX = Math.max(0, Math.min(R - 1, Math.round(gridX)));
      const cY = Math.max(0, Math.min(R - 1, Math.round(gridY)));
      const idx = cY * R + cX;

      const alt = terrainData.height[idx];
      const slope = terrainData.slopeMask[idx] * 90;
      setHoverInfo({ x: cX, y: cY, alt, slope });
      onHoverCoord?.(cX, cY, alt, slope);

      // Position brush ring
      if (ring && activeBrush) {
        ring.visible = true;
        ring.position.set(pt.x, pt.y + 0.3, pt.z);
        const worldRadius = (activeBrush.radius / R) * meshSize;
        ring.scale.set(worldRadius, 1, worldRadius);
      }

      if (applyStroke) {
        onBrushStroke(gridX, gridY);
      }
    } else {
      if (ring) ring.visible = false;
      setHoverInfo(null);
    }
  };

  const handleResetCamera = () => {
    cameraOrbitRef.current = {
      theta: Math.PI * 0.25,
      phi: Math.PI * 0.35,
      radius: 180,
      target: new THREE.Vector3(0, 10, 0),
    };
    updateCameraPosition();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0c10] cursor-crosshair select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
    >
      {/* Top Left HUD: Performance & Viewport Info */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 text-xs font-mono pointer-events-none">
        <div className="bg-[#121620]/90 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-[#1e2636] flex items-center space-x-2 text-[#8b9bb4]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>{fps} FPS</span>
          <span className="text-[#3b475d]">|</span>
          <span>{terrainData.resolution}² GRID</span>
          <span className="text-[#3b475d]">|</span>
          <span className="text-[#00d2ff]">
            {((terrainData.resolution * terrainData.resolution) / 1000).toFixed(0)}k VERTS
          </span>
        </div>

        {hoverInfo && (
          <div className="bg-[#121620]/90 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-[#1e2636] text-[#8b9bb4] flex items-center space-x-2">
            <span>X:{hoverInfo.x} Y:{hoverInfo.y}</span>
            <span className="text-[#3b475d]">|</span>
            <span className="text-[#e6edf3]">ALT: {(hoverInfo.alt * 100).toFixed(1)}%</span>
            <span className="text-[#3b475d]">|</span>
            <span className="text-[#f59e0b]">SLOPE: {hoverInfo.slope.toFixed(0)}°</span>
          </div>
        )}
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#121620]/90 backdrop-blur-md p-1 rounded-md border border-[#1e2636]">
        <button
          onClick={handleResetCamera}
          title="Reset Camera (Right click + drag to orbit)"
          className="p-1.5 hover:bg-[#1a2230] text-[#8b9bb4] hover:text-[#e6edf3] rounded transition-colors"
        >
          <RefreshDuotone size={16} />
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 text-[11px] text-[#536279] pointer-events-none font-mono">
        Right-Click / Alt+Left: Orbit View • Left-Click: Sculpt Terrain • Wheel: Zoom
      </div>
    </div>
  );
};
