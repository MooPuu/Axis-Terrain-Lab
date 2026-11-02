import React, { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import {
  Tab,
  TabGroup,
  TabList,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  RadioGroup,
  Radio,
  Switch,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { TerrainData } from './engine/TerrainEngine';
import type {
  GeneratorParams,
  HydraulicParams,
  ThermalParams,
  BrushParams,
  BrushMode,
} from './engine/TerrainEngine';
import { TerrainViewport } from './components/viewport/TerrainViewport';
import type { ViewportMode } from './components/viewport/TerrainViewport';
import {
  AxisTerrainLabLogo,
  MountainDuotone,
  WaterDropDuotone,
  FlameDuotone,
  BrushDuotone,
  PaletteDuotone,
  ExportDuotone,
  PlayDuotone,
  StepForwardDuotone,
  RefreshDuotone,
  SunDuotone,
  GridDuotone,
  WaveDuotone,
  Cube3DDuotone,
  GodotDuotone,
  UnrealDuotone,
  DownloadDuotone,
  SparklesDuotone,
  CheckCircleDuotone,
  ChevronDownDuotone,
  CloseDuotone,
  InfoCircleDuotone,
} from './components/icons/DuotoneIcons';
import {
  exportRaw16Heightmap,
  exportSplatmapPNG,
  exportGodotTerrain3D,
  exportUnrealEngine5,
  exportLayerWeightmap,
} from './engine/ExportPipeline';

interface ResolutionOption {
  value: number;
  label: string;
  badge?: string;
}

const RESOLUTIONS: ResolutionOption[] = [
  { value: 256, label: '256 x 256', badge: 'Fast Preview' },
  { value: 512, label: '512 x 512', badge: 'Standard' },
  { value: 1009, label: '1009 x 1009', badge: 'UE5 1km²' },
  { value: 1024, label: '1024 x 1024', badge: '1K Standard' },
  { value: 2017, label: '2017 x 2017', badge: 'UE5 2km²' },
];

interface ViewportOption {
  mode: ViewportMode;
  label: string;
  desc: string;
}

const VIEWPORT_OPTIONS: ViewportOption[] = [
  { mode: 'textured', label: 'PBR Shaded', desc: 'Full multi-material landscape' },
  { mode: 'height_heatmap', label: 'Elevation Heatmap', desc: 'False-color height gradient' },
  { mode: 'slope_overlay', label: 'Slope Analysis', desc: 'Flat vs cliff angle mask' },
  { mode: 'splatmap_rgb', label: 'Packed Splatmap', desc: 'Direct 4-channel weights' },
  { mode: 'wireframe', label: 'Wireframe Grid', desc: 'Mesh quad topology inspect' },
];

export const App: React.FC = () => {
  // Current Resolution & Terrain instance
  const [resolution, setResolution] = useState<number>(512);
  const [terrain, setTerrain] = useState<TerrainData>(() => {
    const t = new TerrainData(512);
    t.generateProcedural({
      seed: 42,
      scale: 3.5,
      octaves: 6,
      persistence: 0.5,
      lacunarity: 2.0,
      heightMultiplier: 1.0,
      ridgeWeight: 0.45,
      terraceSteps: 0,
      terraceSmoothness: 2.0,
      calderaRadius: 0,
    });
    return t;
  });

  // Generator Parameters
  const [genParams, setGenParams] = useState<GeneratorParams>({
    seed: 42,
    scale: 3.5,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.0,
    heightMultiplier: 1.0,
    ridgeWeight: 0.45,
    terraceSteps: 0,
    terraceSmoothness: 2.0,
    calderaRadius: 0,
  });

  // Erosion & Simulation Parameters
  const [hydraulicParams, setHydraulicParams] = useState<HydraulicParams>({
    iterations: 15,
    rainRate: 0.015,
    evaporationRate: 0.015,
    sedimentCapacity: 0.08,
    dissolutionRate: 0.04,
    depositionRate: 0.03,
    gravity: 9.8,
  });

  const [thermalParams, setThermalParams] = useState<ThermalParams>({
    iterations: 8,
    reposeAngleDeg: 36,
    transportRate: 0.5,
  });

  // Headless UI Radio Tool & Brush State
  const [brushMode, setBrushMode] = useState<BrushMode | 'orbit'>('orbit');
  const [brushRadius, setBrushRadius] = useState<number>(24);
  const [brushStrength, setBrushStrength] = useState<number>(0.5);

  const activeBrush = useMemo<BrushParams | null>(() => {
    if (brushMode === 'orbit') return null;
    return {
      mode: brushMode,
      radius: brushRadius,
      strength: brushStrength,
    };
  }, [brushMode, brushRadius, brushStrength]);

  // Viewport Settings
  const [viewportMode, setViewportMode] = useState<ViewportMode>('textured');
  const [waterLevel, setWaterLevel] = useState<number>(0.12);
  const [showWater, setShowWater] = useState<boolean>(true);
  const [sunElevation, setSunElevation] = useState<number>(45);
  const [sunAzimuth, setSunAzimuth] = useState<number>(135);

  // Active Tab Index (0: erosion, 1: splatmap, 2: export)
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

  // Read URL query params on load for direct view/tab linking
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'splatmap') setSelectedTabIndex(1);
      else if (tab === 'export') setSelectedTabIndex(2);
      const view = params.get('view');
      if (view && ['textured', 'height_heatmap', 'slope_overlay', 'splatmap_rgb', 'wireframe'].includes(view)) {
        setViewportMode(view as ViewportMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Splatmap Mask Settings
  const [slopeMin, setSlopeMin] = useState<number>(25);
  const [slopeMax, setSlopeMax] = useState<number>(65);
  const [curvatureContrast, setCurvatureContrast] = useState<number>(3.0);

  // Export switches
  const [exportGodotControlMap, setExportGodotControlMap] = useState<boolean>(true);
  const [exportUE5Weightmaps, setExportUE5Weightmaps] = useState<boolean>(true);

  // Guide Dialog state
  const [dialogTarget, setDialogTarget] = useState<'godot' | 'ue5' | null>(null);

  // Status message notification
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Regeneration Handler
  const handleRegenerate = useCallback((newParams?: Partial<GeneratorParams>) => {
    const updated = { ...genParams, ...newParams };
    setGenParams(updated);
    const newTerrain = new TerrainData(resolution);
    newTerrain.generateProcedural(updated);
    setTerrain(newTerrain);
    showNotification('Base procedural terrain generated.');
  }, [genParams, resolution]);

  // Change Resolution
  const handleResolutionChange = (newRes: number) => {
    setResolution(newRes);
    const newTerrain = new TerrainData(newRes);
    newTerrain.generateProcedural(genParams);
    setTerrain(newTerrain);
    showNotification(`Resolution set to ${newRes}x${newRes}`);
  };

  // Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'alpine':
        handleRegenerate({
          scale: 4.2,
          octaves: 7,
          ridgeWeight: 0.75,
          terraceSteps: 0,
          calderaRadius: 0,
        });
        break;
      case 'mesa':
        handleRegenerate({
          scale: 2.8,
          octaves: 5,
          ridgeWeight: 0.1,
          terraceSteps: 6,
          terraceSmoothness: 3.5,
          calderaRadius: 0,
        });
        break;
      case 'caldera':
        handleRegenerate({
          scale: 3.0,
          octaves: 6,
          ridgeWeight: 0.3,
          terraceSteps: 0,
          calderaRadius: 0.45,
        });
        break;
      case 'foothills':
        handleRegenerate({
          scale: 2.2,
          octaves: 5,
          ridgeWeight: 0.05,
          terraceSteps: 0,
          calderaRadius: 0,
        });
        break;
    }
  };

  // Run Hydraulic Erosion
  const handleHydraulicPass = () => {
    const cloned = terrain.clone();
    cloned.runHydraulicErosion(hydraulicParams, hydraulicParams.iterations);
    setTerrain(cloned);
    showNotification(`Executed ${hydraulicParams.iterations} hydraulic erosion steps.`);
  };

  // Run Thermal Talus Pass
  const handleThermalPass = () => {
    const cloned = terrain.clone();
    cloned.runThermalErosion(thermalParams, thermalParams.iterations);
    setTerrain(cloned);
    showNotification(`Applied thermal talus scree slip (${thermalParams.reposeAngleDeg}° repose).`);
  };

  // Run Fluvial Incision Carving
  const handleFluvialIncision = () => {
    const cloned = terrain.clone();
    cloned.runFluvialIncision(0.6, 4);
    setTerrain(cloned);
    showNotification('Carved dendritic stream drainage channels.');
  };

  // Brush Stroke Action
  const handleBrushStroke = useCallback((x: number, y: number) => {
    if (!activeBrush) return;
    const cloned = terrain.clone();
    cloned.applyBrush(x, y, activeBrush);
    setTerrain(cloned);
  }, [terrain, activeBrush]);

  // Mask slider updates
  const handleMaskConfigChange = (sMin: number, sMax: number, cContrast: number) => {
    setSlopeMin(sMin);
    setSlopeMax(sMax);
    setCurvatureContrast(cContrast);
    const cloned = terrain.clone();
    cloned.updateAllMasks({ slopeMin: sMin, slopeMax: sMax, curvatureContrast: cContrast });
    setTerrain(cloned);
  };

  const selectedResObj = RESOLUTIONS.find((r) => r.value === resolution) || RESOLUTIONS[1];
  const selectedViewportObj = VIEWPORT_OPTIONS.find((v) => v.mode === viewportMode) || VIEWPORT_OPTIONS[0];

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0a0c10] text-[#e6edf3] select-none font-sans overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          TOP STUDIO HEADER (HEADLESS UI INTEGRATED)
      ───────────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-[#10141d] border-b border-[#1e2636] flex items-center justify-between px-4 z-20 shrink-0">
        {/* App Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(0,210,255,0.25)] border border-[#1b2333]">
            <AxisTerrainLabLogo size={36} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-wide text-[#f0f6fc]">
                Axis Terrain Lab
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161f30] text-[#00d2ff] border border-[#00d2ff]/30">
                PRO 2026
              </span>
            </div>
            <p className="text-[10px] text-[#536279] tracking-tight">
              Made By Mahdi Kareem © 2026
            </p>
          </div>
        </div>

        {/* Center Mode Tabs (Headless UI TabList) */}
        <TabGroup selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <TabList className="flex items-center bg-[#0d1017] p-1 rounded-lg border border-[#1e2636] space-x-1">
            <Tab
              className={({ selected }) =>
                `flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all outline-none cursor-pointer ${
                  selected
                    ? 'bg-[#182030] text-[#00d2ff] shadow-sm border border-[#00d2ff]/30'
                    : 'text-[#8b9bb4] hover:text-[#e6edf3] border border-transparent'
                }`
              }
            >
              <MountainDuotone size={16} />
              <span>Terrain & Erosion</span>
            </Tab>

            <Tab
              className={({ selected }) =>
                `flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all outline-none cursor-pointer ${
                  selected
                    ? 'bg-[#182030] text-[#10b981] shadow-sm border border-[#10b981]/30'
                    : 'text-[#8b9bb4] hover:text-[#e6edf3] border border-transparent'
                }`
              }
            >
              <PaletteDuotone size={16} />
              <span>Weightmaps & Masks</span>
            </Tab>

            <Tab
              className={({ selected }) =>
                `flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all outline-none cursor-pointer ${
                  selected
                    ? 'bg-[#182030] text-[#8b5cf6] shadow-sm border border-[#8b5cf6]/30'
                    : 'text-[#8b9bb4] hover:text-[#e6edf3] border border-transparent'
                }`
              }
            >
              <ExportDuotone size={16} />
              <span>Engine Export Hub</span>
            </Tab>
          </TabList>
        </TabGroup>

        {/* Right Section: Resolution Listbox & Viewport Listbox (Headless UI) */}
        <div className="flex items-center space-x-2.5">
          {/* Resolution Picker (Headless UI Listbox) */}
          <div className="relative">
            <Listbox value={resolution} onChange={handleResolutionChange}>
              <ListboxButton className="flex items-center space-x-2 bg-[#0d1017] hover:bg-[#141924] px-2.5 py-1.5 rounded-md border border-[#1e2636] text-xs font-mono text-[#e6edf3] transition-colors outline-none cursor-pointer">
                <span className="text-[#536279]">GRID:</span>
                <span className="text-[#00d2ff] font-semibold">{selectedResObj.label}</span>
                <ChevronDownDuotone size={14} className="text-[#8b9bb4]" />
              </ListboxButton>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute right-0 mt-1.5 w-52 bg-[#121620] border border-[#1e2636] rounded-lg shadow-2xl py-1 z-50 text-xs outline-none">
                  {RESOLUTIONS.map((res) => (
                    <ListboxOption
                      key={res.value}
                      value={res.value}
                      className={({ focus, selected }) =>
                        `flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                          focus ? 'bg-[#1a2233] text-[#00d2ff]' : 'text-[#e6edf3]'
                        } ${selected ? 'font-semibold text-[#00d2ff]' : ''}`
                      }
                    >
                      <div className="flex flex-col">
                        <span className="font-mono">{res.label}</span>
                        <span className="text-[10px] text-[#536279]">{res.badge}</span>
                      </div>
                      {res.value === resolution && (
                        <CheckCircleDuotone size={14} className="text-[#00d2ff]" />
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </Listbox>
          </div>

          {/* Viewport Render Mode (Headless UI Listbox) */}
          <div className="relative">
            <Listbox value={viewportMode} onChange={setViewportMode}>
              <ListboxButton className="flex items-center space-x-2 bg-[#0d1017] hover:bg-[#141924] px-2.5 py-1.5 rounded-md border border-[#1e2636] text-xs text-[#e6edf3] transition-colors outline-none cursor-pointer">
                <span className="text-[#536279]">VIEW:</span>
                <span className="text-[#10b981] font-medium">{selectedViewportObj.label}</span>
                <ChevronDownDuotone size={14} className="text-[#8b9bb4]" />
              </ListboxButton>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute right-0 mt-1.5 w-56 bg-[#121620] border border-[#1e2636] rounded-lg shadow-2xl py-1 z-50 text-xs outline-none">
                  {VIEWPORT_OPTIONS.map((opt) => (
                    <ListboxOption
                      key={opt.mode}
                      value={opt.mode}
                      className={({ focus, selected }) =>
                        `flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                          focus ? 'bg-[#1a2233] text-[#10b981]' : 'text-[#e6edf3]'
                        } ${selected ? 'font-semibold text-[#10b981]' : ''}`
                      }
                    >
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-[#536279]">{opt.desc}</span>
                      </div>
                      {opt.mode === viewportMode && (
                        <CheckCircleDuotone size={14} className="text-[#10b981]" />
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </Listbox>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN WORKSPACE
      ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOLBAR: HEADLESS UI RADIO GROUP & DISCLOSURES */}
        <aside className="w-60 bg-[#10141d] border-r border-[#1e2636] flex flex-col shrink-0 overflow-y-auto">
          {/* Tool Selection (Headless UI RadioGroup) */}
          <div className="p-3 border-b border-[#1e2636]">
            <h3 className="text-[11px] font-semibold text-[#536279] uppercase tracking-wider mb-2">
              Interaction Tool
            </h3>
            <RadioGroup value={brushMode} onChange={setBrushMode} className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'orbit', label: 'Orbit View', icon: <Cube3DDuotone size={16} /> },
                { value: 'raise', label: 'Raise', icon: <BrushDuotone size={16} /> },
                { value: 'lower', label: 'Lower', icon: <BrushDuotone size={16} className="rotate-180" /> },
                { value: 'smooth', label: 'Smooth', icon: <WaveDuotone size={16} /> },
                { value: 'flatten', label: 'Flatten', icon: <GridDuotone size={16} /> },
                { value: 'hydraulic_stamp', label: 'Erode Stamp', icon: <WaterDropDuotone size={16} /> },
              ].map((tool) => (
                <Radio
                  key={tool.value}
                  value={tool.value}
                  className={({ checked }) =>
                    `flex items-center space-x-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer outline-none ${
                      checked
                        ? 'bg-[#00d2ff]/15 text-[#00d2ff] border border-[#00d2ff]/40 shadow-sm'
                        : 'bg-[#141924] text-[#8b9bb4] hover:bg-[#1a2130] hover:text-[#e6edf3] border border-transparent'
                    }`
                  }
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                </Radio>
              ))}
            </RadioGroup>

            {/* Brush Controls (Headless UI Disclosure) */}
            {brushMode !== 'orbit' && (
              <div className="mt-3 space-y-2.5 bg-[#0c0f16] p-2.5 rounded-md border border-[#1e2636]">
                <div>
                  <div className="flex justify-between text-[11px] text-[#8b9bb4] mb-1">
                    <span>Radius</span>
                    <span className="font-mono text-[#00d2ff]">{brushRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={brushRadius}
                    onChange={(e) => setBrushRadius(Number(e.target.value))}
                    aria-label="Brush Radius"
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#8b9bb4] mb-1">
                    <span>Strength</span>
                    <span className="font-mono text-[#00d2ff]">
                      {(brushStrength * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={brushStrength}
                    onChange={(e) => setBrushStrength(Number(e.target.value))}
                    aria-label="Brush Strength"
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Geological Presets (Headless UI Disclosure) */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <div className="border-b border-[#1e2636]">
                <DisclosureButton className="w-full p-3 flex items-center justify-between text-left text-[11px] font-semibold text-[#536279] uppercase tracking-wider hover:text-[#e6edf3] transition-colors outline-none cursor-pointer">
                  <span>Geomorphology Presets</span>
                  <ChevronDownDuotone
                    size={14}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="px-3 pb-3 space-y-1.5">
                  {[
                    { id: 'alpine', name: 'Alpine Glaciated Ridges', desc: 'Sharp arêtes & peaks' },
                    { id: 'mesa', name: 'Desert Mesa & Terraces', desc: 'Steep stratified cliffs' },
                    { id: 'caldera', name: 'Volcanic Caldera Basin', desc: 'Rimmed crater formation' },
                    { id: 'foothills', name: 'Rolling Green Highlands', desc: 'Gentle grassy slopes' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className="w-full text-left p-2 rounded-md bg-[#141924] hover:bg-[#1c2333] border border-transparent hover:border-[#2a354a] transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-medium text-[#e6edf3] group-hover:text-[#00d2ff]">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[#536279]">{p.desc}</div>
                    </button>
                  ))}
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>

          {/* Base Procedural Parameters (Headless UI Disclosure) */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <div className="p-3">
                <DisclosureButton className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-[#536279] uppercase tracking-wider hover:text-[#e6edf3] transition-colors mb-2 outline-none cursor-pointer">
                  <span>Base Fractal Noise</span>
                  <ChevronDownDuotone
                    size={14}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#8b9bb4] mb-1">
                      <span>Scale</span>
                      <span className="font-mono">{genParams.scale.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={8.0}
                      step={0.1}
                      value={genParams.scale}
                      onChange={(e) => handleRegenerate({ scale: Number(e.target.value) })}
                      aria-label="Fractal Noise Scale"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8b9bb4] mb-1">
                      <span>Ridge Multifractal</span>
                      <span className="font-mono">{(genParams.ridgeWeight * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={genParams.ridgeWeight}
                      onChange={(e) => handleRegenerate({ ridgeWeight: Number(e.target.value) })}
                      aria-label="Ridge Multifractal Weight"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#8b9bb4] mb-1">
                      <span>Stratified Terraces</span>
                      <span className="font-mono">{genParams.terraceSteps}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={1}
                      value={genParams.terraceSteps}
                      onChange={(e) => handleRegenerate({ terraceSteps: Number(e.target.value) })}
                      aria-label="Stratified Terraces Count"
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() => handleRegenerate({ seed: Math.floor(Math.random() * 99999) })}
                    className="w-full py-2 bg-[#17202e] hover:bg-[#202c40] text-[#00d2ff] rounded-md text-xs font-medium border border-[#00d2ff]/30 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshDuotone size={14} />
                    <span>Re-Seed Terrain</span>
                  </button>
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        </aside>

        {/* CENTER 3D VIEWPORT CONTAINER */}
        <main className="flex-1 relative flex flex-col">
          <TerrainViewport
            terrainData={terrain}
            activeBrush={activeBrush}
            viewportMode={viewportMode}
            waterLevel={waterLevel}
            showWater={showWater}
            sunElevation={sunElevation}
            sunAzimuth={sunAzimuth}
            onBrushStroke={handleBrushStroke}
          />

          {/* Floating Viewport Overlay: Headless UI Switch & Controls */}
          <div className="absolute bottom-4 right-4 bg-[#10141d]/90 backdrop-blur-md p-2.5 rounded-lg border border-[#1e2636] flex items-center space-x-4 text-xs z-10">
            {/* Water Plane (Headless UI Switch) */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#8b9bb4]">Ocean:</span>
              <Switch
                checked={showWater}
                onChange={setShowWater}
                className={`${
                  showWater ? 'bg-[#00d2ff]' : 'bg-[#1e2636]'
                } relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    showWater ? 'translate-x-4' : 'translate-x-0'
                  } pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#0a0c10] shadow-lg ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
              {showWater && (
                <input
                  type="range"
                  min={0.0}
                  max={0.5}
                  step={0.01}
                  value={waterLevel}
                  onChange={(e) => setWaterLevel(Number(e.target.value))}
                  aria-label="Water Sea Level"
                  className="w-16"
                  title="Sea Level"
                />
              )}
            </div>

            <span className="text-[#1e2636]">|</span>

            {/* Sun Azimuth & Elevation */}
            <div className="flex items-center space-x-2 text-[#8b9bb4]">
              <SunDuotone size={16} className="text-[#f59e0b]" />
              <input
                type="range"
                min={15}
                max={85}
                value={sunElevation}
                onChange={(e) => setSunElevation(Number(e.target.value))}
                aria-label="Sun Elevation Angle"
                className="w-16"
                title={`Sun Elevation (${sunElevation}°)`}
              />
              <input
                type="range"
                min={0}
                max={360}
                value={sunAzimuth}
                onChange={(e) => setSunAzimuth(Number(e.target.value))}
                aria-label="Sun Azimuth Angle"
                className="w-16"
                title={`Sun Azimuth (${sunAzimuth}°)`}
              />
            </div>
          </div>
        </main>

        {/* RIGHT INSPECTOR PANEL (HEADLESS UI TAB PANELS) */}
        <aside className="w-84 bg-[#10141d] border-l border-[#1e2636] flex flex-col shrink-0 overflow-y-auto">
          {/* TAB 1: EROSION & SIMULATION PASSES */}
          {selectedTabIndex === 0 && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <WaterDropDuotone size={18} className="text-[#00d2ff]" />
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">
                    Hydraulic Erosion Pass
                  </h2>
                </div>
                <p className="text-[11px] text-[#536279]">
                  Fast GPU Shallow Water simulation via Virtual Pipes (precipitation, velocity vectors, capacity, dissolution & settling).
                </p>
              </div>

              {/* Hydraulic Controls (Headless UI Disclosure) */}
              <div className="space-y-3 bg-[#0c0f16] p-3 rounded-lg border border-[#1e2636]">
                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Iterations per Dispatch</span>
                    <span className="font-mono text-[#00d2ff]">{hydraulicParams.iterations}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={hydraulicParams.iterations}
                    onChange={(e) =>
                      setHydraulicParams({ ...hydraulicParams, iterations: Number(e.target.value) })
                    }
                    aria-label="Hydraulic Iterations"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Rainfall Rate</span>
                    <span className="font-mono">{hydraulicParams.rainRate.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.005}
                    max={0.04}
                    step={0.002}
                    value={hydraulicParams.rainRate}
                    onChange={(e) =>
                      setHydraulicParams({ ...hydraulicParams, rainRate: Number(e.target.value) })
                    }
                    aria-label="Rainfall Rate"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Sediment Carrying Capacity (Kc)</span>
                    <span className="font-mono">{hydraulicParams.sedimentCapacity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.2}
                    step={0.01}
                    value={hydraulicParams.sedimentCapacity}
                    onChange={(e) =>
                      setHydraulicParams({
                        ...hydraulicParams,
                        sedimentCapacity: Number(e.target.value),
                      })
                    }
                    aria-label="Sediment Carrying Capacity"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Bedrock Dissolution Rate (Ks)</span>
                    <span className="font-mono">{hydraulicParams.dissolutionRate.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.1}
                    step={0.005}
                    value={hydraulicParams.dissolutionRate}
                    onChange={(e) =>
                      setHydraulicParams({
                        ...hydraulicParams,
                        dissolutionRate: Number(e.target.value),
                      })
                    }
                    aria-label="Bedrock Dissolution Rate"
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleHydraulicPass}
                  className="w-full py-2.5 bg-[#00d2ff] hover:bg-[#00c0eb] text-[#0a0c10] font-semibold text-xs rounded-md shadow-[0_0_15px_rgba(0,210,255,0.3)] flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <PlayDuotone size={16} />
                  <span>Simulate Hydraulic Erosion</span>
                </button>
              </div>

              {/* Thermal Talus Scree Pass */}
              <div className="pt-2 border-t border-[#1e2636]">
                <div className="flex items-center space-x-2 mb-1">
                  <FlameDuotone size={18} className="text-[#f59e0b]" />
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">
                    Thermal Talus & Scree Pass
                  </h2>
                </div>
                <p className="text-[11px] text-[#536279] mb-3">
                  Angle of Repose material slip: cliff rock slips downhill creating natural alluvial scree slopes.
                </p>

                <div className="space-y-3 bg-[#0c0f16] p-3 rounded-lg border border-[#1e2636]">
                  <div>
                    <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                      <span>Angle of Repose</span>
                      <span className="font-mono text-[#f59e0b]">
                        {thermalParams.reposeAngleDeg}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={48}
                      value={thermalParams.reposeAngleDeg}
                      onChange={(e) =>
                        setThermalParams({ ...thermalParams, reposeAngleDeg: Number(e.target.value) })
                      }
                      aria-label="Angle of Repose"
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleThermalPass}
                    className="w-full py-2 bg-[#1a2333] hover:bg-[#232f45] text-[#f59e0b] font-medium text-xs rounded-md border border-[#f59e0b]/40 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <StepForwardDuotone size={16} />
                    <span>Apply Talus Scree Pass</span>
                  </button>
                </div>
              </div>

              {/* Fluvial Stream Incision */}
              <div className="pt-2 border-t border-[#1e2636]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#e6edf3]">
                    Fluvial River Incision
                  </span>
                  <span className="text-[10px] text-[#536279] font-mono">WILBUR MODEL</span>
                </div>
                <button
                  onClick={handleFluvialIncision}
                  className="w-full py-2 bg-[#141924] hover:bg-[#1a2130] text-[#00d2ff] font-medium text-xs rounded-md border border-[#00d2ff]/30 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <SparklesDuotone size={16} />
                  <span>Carve Dendritic Stream Networks</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WEIGHTMAP & SPLATMAP ENGINE */}
          {selectedTabIndex === 1 && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <PaletteDuotone size={18} className="text-[#10b981]" />
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">
                    Weightmap & Splatmap Setup
                  </h2>
                </div>
                <p className="text-[11px] text-[#536279]">
                  Procedural surface masks derived from slope, curvature, elevation bands, and hydraulic wetness.
                </p>
              </div>

              {/* Mask Controls */}
              <div className="space-y-3 bg-[#0c0f16] p-3 rounded-lg border border-[#1e2636]">
                <h3 className="text-xs font-semibold text-[#8b9bb4] uppercase tracking-wider">
                  Derivative Mask Filters
                </h3>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Cliff Rock Slope Min</span>
                    <span className="font-mono text-[#10b981]">{slopeMin}°</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={slopeMin}
                    onChange={(e) =>
                      handleMaskConfigChange(Number(e.target.value), slopeMax, curvatureContrast)
                    }
                    aria-label="Cliff Rock Slope Minimum"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Vertical Rock Cliff Max</span>
                    <span className="font-mono text-[#10b981]">{slopeMax}°</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={85}
                    value={slopeMax}
                    onChange={(e) =>
                      handleMaskConfigChange(slopeMin, Number(e.target.value), curvatureContrast)
                    }
                    aria-label="Vertical Rock Cliff Maximum"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#8b9bb4] mb-1">
                    <span>Curvature Laplacian Contrast</span>
                    <span className="font-mono text-[#10b981]">{curvatureContrast.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={8.0}
                    step={0.5}
                    value={curvatureContrast}
                    onChange={(e) =>
                      handleMaskConfigChange(slopeMin, slopeMax, Number(e.target.value))
                    }
                    aria-label="Curvature Laplacian Contrast"
                    className="w-full"
                  />
                </div>
              </div>

              {/* 4-Channel Splatmap Packing Breakdown */}
              <div className="space-y-2 bg-[#0c0f16] p-3 rounded-lg border border-[#1e2636]">
                <h3 className="text-xs font-semibold text-[#8b9bb4] uppercase tracking-wider mb-2">
                  Packed Splatmap Channels
                </h3>

                <div className="flex items-center justify-between p-2 rounded bg-[#10141d] border-l-3 border-[#ef4444]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="text-xs font-medium text-[#e6edf3]">Channel R (Red)</span>
                  </div>
                  <span className="text-[11px] text-[#8b9bb4]">Cliff Rock & Ridges</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#10141d] border-l-3 border-[#10b981]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-xs font-medium text-[#e6edf3]">Channel G (Green)</span>
                  </div>
                  <span className="text-[11px] text-[#8b9bb4]">Lowland Alpine Grass</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#10141d] border-l-3 border-[#3b82f6]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="text-xs font-medium text-[#e6edf3]">Channel B (Blue)</span>
                  </div>
                  <span className="text-[11px] text-[#8b9bb4]">Crevices & Riverbed Silt</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#10141d] border-l-3 border-[#f8fafc]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f8fafc]" />
                    <span className="text-xs font-medium text-[#e6edf3]">Channel A (Alpha)</span>
                  </div>
                  <span className="text-[11px] text-[#8b9bb4]">Glacial Snow & Peaks</span>
                </div>
              </div>

              {/* Quick Individual Layer Weightmap Downloads */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-[#536279] uppercase tracking-wider block">
                  Quick Export Weightmap PNGs
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['rock', 'grass', 'dirt', 'snow'] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() =>
                        exportLayerWeightmap(terrain, layer, `Weightmap_${layer.toUpperCase()}.png`)
                      }
                      className="py-1.5 px-2 bg-[#141924] hover:bg-[#1c2333] text-xs font-medium text-[#8b9bb4] hover:text-[#e6edf3] rounded border border-[#1e2636] capitalize flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{layer} PNG</span>
                      <DownloadDuotone size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINE EXPORT HUB */}
          {selectedTabIndex === 2 && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <ExportDuotone size={18} className="text-[#8b5cf6]" />
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">
                    Game Engine Export Targets
                  </h2>
                </div>
                <p className="text-[11px] text-[#536279]">
                  Production-ready packages with correct bit-depth, component formulas, and config files.
                </p>
              </div>

              {/* Godot 4 / Terrain3D Preset Card (Headless UI Switch Included) */}
              <div className="p-3 bg-[#0c0f16] rounded-lg border border-[#1e2636] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#00d2ff]">
                    <GodotDuotone size={20} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Godot 4.x / Terrain3D
                    </span>
                  </div>
                  <button
                    onClick={() => setDialogTarget('godot')}
                    className="text-[11px] text-[#00d2ff] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <InfoCircleDuotone size={14} />
                    <span>Guide</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#8b9bb4]">
                  Exports 16-bit Raw heightmap (`.r16`), proprietary packed Control Map (texture slots 0-31 + roughness/wetness), and companion JSON configuration.
                </p>

                {/* Headless UI Switch for Control Map */}
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#10141d]">
                  <span className="text-[#8b9bb4]">Include Packed Control Map:</span>
                  <Switch
                    checked={exportGodotControlMap}
                    onChange={setExportGodotControlMap}
                    className={`${
                      exportGodotControlMap ? 'bg-[#00d2ff]' : 'bg-[#1e2636]'
                    } relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        exportGodotControlMap ? 'translate-x-4' : 'translate-x-0'
                      } pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#0a0c10] shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </div>

                <button
                  onClick={() => {
                    exportGodotTerrain3D(terrain, {
                      terrainName: 'Axis_Godot_Terrain',
                      regionSize: resolution,
                      heightScale: 40.0,
                      exportControlMap: exportGodotControlMap,
                    });
                    showNotification('Godot Terrain3D package exported.');
                  }}
                  className="w-full py-2 bg-[#00d2ff]/15 hover:bg-[#00d2ff]/25 text-[#00d2ff] font-medium text-xs rounded border border-[#00d2ff]/40 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <DownloadDuotone size={14} />
                  <span>Export Godot Terrain3D Package</span>
                </button>
              </div>

              {/* Unreal Engine 5 Landscape Preset Card (Headless UI Switch Included) */}
              <div className="p-3 bg-[#0c0f16] rounded-lg border border-[#1e2636] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#8b5cf6]">
                    <UnrealDuotone size={20} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Unreal Engine 5 Landscape
                    </span>
                  </div>
                  <button
                    onClick={() => setDialogTarget('ue5')}
                    className="text-[11px] text-[#8b5cf6] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <InfoCircleDuotone size={14} />
                    <span>Guide</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#8b9bb4]">
                  Formatted for UE5 Landscape & World Partition. Exports Little-Endian unsigned 16-bit `.r16`, 4 individual layer weightmaps, and UE5 import config.
                </p>

                <div className="text-[11px] font-mono text-[#536279] bg-[#10141d] p-2 rounded">
                  Current: {resolution}x{resolution}
                  {[1009, 2017, 4033, 8129].includes(resolution) ? (
                    <span className="text-[#10b981] ml-2">✓ UE5 Component Recommended</span>
                  ) : (
                    <span className="text-[#f59e0b] ml-2">⚠️ Recommended: 1009² or 2017²</span>
                  )}
                </div>

                {/* Headless UI Switch for Weightmaps */}
                <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#10141d]">
                  <span className="text-[#8b9bb4]">Export 4x Layer Weightmaps:</span>
                  <Switch
                    checked={exportUE5Weightmaps}
                    onChange={setExportUE5Weightmaps}
                    className={`${
                      exportUE5Weightmaps ? 'bg-[#8b5cf6]' : 'bg-[#1e2636]'
                    } relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        exportUE5Weightmaps ? 'translate-x-4' : 'translate-x-0'
                      } pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#0a0c10] shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                </div>

                <button
                  onClick={() => {
                    exportUnrealEngine5(terrain, {
                      landscapeName: 'Axis_UE5_Landscape',
                      targetResolution: resolution,
                      tileGrid: 2,
                      zScalePercent: 100,
                      exportWeightmaps: exportUE5Weightmaps,
                    });
                    showNotification('Unreal Engine 5 Landscape package exported.');
                  }}
                  className="w-full py-2 bg-[#8b5cf6]/15 hover:bg-[#8b5cf6]/25 text-[#8b5cf6] font-medium text-xs rounded border border-[#8b5cf6]/40 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <DownloadDuotone size={14} />
                  <span>Export UE5 Landscape Package</span>
                </button>
              </div>

              {/* Standard Universal Formats */}
              <div className="p-3 bg-[#0c0f16] rounded-lg border border-[#1e2636] space-y-2">
                <span className="text-xs font-semibold text-[#8b9bb4] uppercase tracking-wide block">
                  Standard Universal Assets
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      exportRaw16Heightmap(terrain, `Axis_Height_${resolution}x${resolution}.r16`);
                      showNotification('Raw 16-bit heightmap downloaded.');
                    }}
                    className="w-full py-1.5 px-3 bg-[#141924] hover:bg-[#1a2130] text-xs font-medium text-[#e6edf3] rounded border border-[#1e2636] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Raw 16-bit Little-Endian (.r16)</span>
                    <DownloadDuotone size={14} />
                  </button>

                  <button
                    onClick={() => {
                      exportSplatmapPNG(terrain, `Axis_Splatmap_${resolution}x${resolution}.png`);
                      showNotification('Packed RGBA Splatmap downloaded.');
                    }}
                    className="w-full py-1.5 px-3 bg-[#141924] hover:bg-[#1a2130] text-xs font-medium text-[#e6edf3] rounded border border-[#1e2636] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Packed RGBA Splatmap PNG</span>
                    <DownloadDuotone size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          BOTTOM STATUS FOOTER
      ───────────────────────────────────────────────────────────────── */}
      <footer className="h-7 bg-[#0d1017] border-t border-[#1e2636] px-4 flex items-center justify-between text-[11px] text-[#536279] font-mono z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="text-[#8b9bb4]">Headless UI • WebGL2 Accelerated</span>
          </div>
          <span>•</span>
          <span>Buffer: Float32 (32-bit elevation)</span>
          <span>•</span>
          <span>Export: 16-bit Unsigned Little-Endian</span>
        </div>

        {/* Live Notification */}
        {statusNotice && (
          <div className="flex items-center space-x-1.5 text-[#00d2ff] bg-[#00d2ff]/10 px-2 py-0.5 rounded border border-[#00d2ff]/30">
            <CheckCircleDuotone size={13} />
            <span>{statusNotice}</span>
          </div>
        )}

        <div className="text-[#8b9bb4]">
          Axis Terrain Lab , Made By Mahdi Kareem © 2026
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────
          HEADLESS UI ACCESSIBLE MODAL DIALOG FOR ENGINE GUIDES
      ───────────────────────────────────────────────────────────────── */}
      <Transition appear show={dialogTarget !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDialogTarget(null)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-[#121620] border border-[#1e2636] p-5 shadow-2xl transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2636]">
                    <DialogTitle as="h3" className="text-sm font-semibold text-[#f0f6fc] flex items-center space-x-2">
                      {dialogTarget === 'godot' ? (
                        <>
                          <GodotDuotone size={18} className="text-[#00d2ff]" />
                          <span>Godot 4.x / Terrain3D Import Guide</span>
                        </>
                      ) : (
                        <>
                          <UnrealDuotone size={18} className="text-[#8b5cf6]" />
                          <span>Unreal Engine 5 Landscape Import Guide</span>
                        </>
                      )}
                    </DialogTitle>
                    <button
                      onClick={() => setDialogTarget(null)}
                      className="p-1 rounded text-[#8b9bb4] hover:text-[#e6edf3] hover:bg-[#1a2233] transition-colors cursor-pointer"
                    >
                      <CloseDuotone size={16} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-xs text-[#8b9bb4] leading-relaxed">
                    {dialogTarget === 'godot' ? (
                      <>
                        <div className="p-3 bg-[#0c0f16] rounded-lg border border-[#1e2636] font-mono text-[11px] text-[#00d2ff]">
                          Format: 16-bit Raw Little-Endian (.r16) + Packed Control Map
                        </div>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[#e6edf3]">
                          <li>Place exported <code className="text-[#00d2ff]">.r16</code> and <code className="text-[#00d2ff]">control_map.png</code> in your Godot project folder.</li>
                          <li>In your scene, select your <strong className="text-white">Terrain3D</strong> node and navigate to Storage in the Inspector.</li>
                          <li>Click <strong className="text-white">Import Heightmap</strong> and select your <code className="text-[#00d2ff]">.r16</code> file. Set scale to 40.0.</li>
                          <li>Assign <code className="text-[#00d2ff]">control_map.png</code> to the Control Map slot to restore rock, grass, and sediment texturing.</li>
                        </ol>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-[#0c0f16] rounded-lg border border-[#1e2636] font-mono text-[11px] text-[#8b5cf6]">
                          Format: 16-bit RAW Little-Endian + 8-bit PNG Layer Weightmaps
                        </div>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[#e6edf3]">
                          <li>Open your Unreal Engine 5 level and switch to <strong className="text-white">Landscape Mode (Shift+2)</strong>.</li>
                          <li>Select <strong className="text-white">Import from File</strong> and pick the exported <code className="text-[#8b5cf6]">.r16</code> file.</li>
                          <li>UE5 automatically detects the recommended component quads ({resolution}x{resolution}).</li>
                          <li>Under Target Layers, create <strong className="text-white">Weight-Blended Layer Infos</strong> and assign the exported <code className="text-[#8b5cf6]">Layer_Rock.png</code>, <code className="text-[#8b5cf6]">Layer_Grass.png</code>, etc.</li>
                        </ol>
                      </>
                    )}
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#1a2233] hover:bg-[#222c42] text-xs font-medium text-[#e6edf3] rounded-md border border-[#2e3b52] transition-colors cursor-pointer"
                      onClick={() => setDialogTarget(null)}
                    >
                      Got it
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default App;
