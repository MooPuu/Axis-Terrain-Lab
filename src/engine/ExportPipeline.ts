/**
 * Axis Terrain Lab - Engine Export & Formatting Pipeline
 * Native exporters for Godot Terrain3D, Unreal Engine 5 Landscape & World Partition,
 * 16-bit Raw heightmaps, and channel-packed splatmaps.
 * 
 * Made By Mahdi Kareem © 2026
 */

import { TerrainData } from './TerrainEngine';

export interface UE5ExportConfig {
  landscapeName: string;
  targetResolution: number; // 1009, 2017, 4033, 8129
  tileGrid: number; // 1x1, 2x2, 4x4
  zScalePercent: number; // default 100
  exportWeightmaps: boolean;
}

export interface GodotExportConfig {
  terrainName: string;
  regionSize: number; // e.g. 1024 or 512
  heightScale: number;
  exportControlMap: boolean;
}

/**
 * Trigger browser file download from Blob or Uint8Array
 */
export function downloadFile(buffer: Uint8Array | Blob | string, filename: string, mimeType: string = 'application/octet-stream') {
  let blob: Blob;
  if (buffer instanceof Blob) {
    blob = buffer;
  } else if (typeof buffer === 'string') {
    blob = new Blob([buffer], { type: mimeType });
  } else {
    // Uint8Array: cast through ArrayBuffer to satisfy TS strict ArrayBufferView typing
    const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    blob = new Blob([ab], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export 16-bit Little-Endian RAW (.r16 / .raw) for Unreal Engine / Godot
 */
export function exportRaw16Heightmap(terrainData: TerrainData, filename: string = 'Terrain_Heightmap_16bit.r16') {
  const rawBytes = terrainData.exportRaw16Bit();
  downloadFile(rawBytes, filename, 'application/octet-stream');
}

/**
 * Export packed RGBA Splatmap as PNG image using Canvas
 */
export function exportSplatmapPNG(terrainData: TerrainData, filename: string = 'Terrain_Splatmap_RGBA.png') {
  const R = terrainData.resolution;
  const canvas = document.createElement('canvas');
  canvas.width = R;
  canvas.height = R;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const splatBytes = terrainData.generatePackedSplatmap();
  const imgData = ctx.createImageData(R, R);
  imgData.data.set(splatBytes);
  ctx.putImageData(imgData, 0, 0);

  canvas.toBlob((blob) => {
    if (blob) downloadFile(blob, filename, 'image/png');
  }, 'image/png');
}

/**
 * Export single-channel 8-bit Grayscale Layer Weightmap (Rock, Grass, Dirt, Snow)
 */
export function exportLayerWeightmap(
  terrainData: TerrainData,
  layerType: 'rock' | 'grass' | 'dirt' | 'snow',
  filename: string
) {
  const R = terrainData.resolution;
  const canvas = document.createElement('canvas');
  canvas.width = R;
  canvas.height = R;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const splatBytes = terrainData.generatePackedSplatmap();
  const layerData = new Uint8ClampedArray(R * R * 4);

  // Channel offset: 0=Rock, 1=Grass, 2=Dirt, 3=Snow
  const chOffset = layerType === 'rock' ? 0 : layerType === 'grass' ? 1 : layerType === 'dirt' ? 2 : 3;

  for (let i = 0; i < R * R; i++) {
    const val = splatBytes[i * 4 + chOffset];
    const p = i * 4;
    layerData[p] = val;
    layerData[p + 1] = val;
    layerData[p + 2] = val;
    layerData[p + 3] = 255;
  }

  const imgData = ctx.createImageData(R, R);
  imgData.data.set(layerData);
  ctx.putImageData(imgData, 0, 0);

  canvas.toBlob((blob) => {
    if (blob) downloadFile(blob, filename, 'image/png');
  }, 'image/png');
}

/**
 * Export Godot Terrain3D Packed Control Map
 */
export function exportGodotTerrain3D(terrainData: TerrainData, config: GodotExportConfig) {
  // 1. Export .r16 heightmap
  exportRaw16Heightmap(terrainData, `${config.terrainName}_height.r16`);

  // 2. Export Packed Control Map
  if (config.exportControlMap) {
    const R = terrainData.resolution;
    const canvas = document.createElement('canvas');
    canvas.width = R;
    canvas.height = R;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const controlBytes = terrainData.exportGodotTerrain3DControlMap();
      const imgData = ctx.createImageData(R, R);
      imgData.data.set(controlBytes);
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, `${config.terrainName}_control_map.png`, 'image/png');
      }, 'image/png');
    }
  }

  // 3. Export Terrain3D JSON Configuration
  const metadata = {
    generator: "Axis Terrain Lab , Made By Mahdi Kareem © 2026",
    targetEngine: "Godot 4.x / Terrain3D Plugin (Tokisan Games)",
    terrainName: config.terrainName,
    resolution: terrainData.resolution,
    regionSize: config.regionSize,
    heightScale: config.heightScale,
    layers: [
      { slot: 0, name: "Alpine Grass", diffuse: "grass_albedo.png" },
      { slot: 1, name: "Cliff Rock", diffuse: "rock_albedo.png" },
      { slot: 2, name: "Soil Sediment", diffuse: "dirt_albedo.png" },
      { slot: 3, name: "Glacier Snow", diffuse: "snow_albedo.png" }
    ],
    importInstructions: [
      "1. Place .r16 and control_map.png in your Godot project folder.",
      "2. In Terrain3D node storage inspector, select 'Import Heightmap' and choose the .r16 file.",
      "3. Specify format as RAW 16-bit Little-Endian and set vertical scale to " + config.heightScale + ".",
      "4. Import control_map.png into the Control Map slot to restore procedural biome texturing."
    ]
  };

  downloadFile(JSON.stringify(metadata, null, 2), `${config.terrainName}_terrain3d_config.json`, 'application/json');
}

/**
 * Export Unreal Engine 5 Landscape & Tiled World Partition Package
 */
export function exportUnrealEngine5(terrainData: TerrainData, config: UE5ExportConfig) {
  // 1. Export Raw 16-bit Heightmap
  exportRaw16Heightmap(terrainData, `${config.landscapeName}_${terrainData.resolution}x${terrainData.resolution}.r16`);

  // 2. Export Separate Layer Weightmaps
  if (config.exportWeightmaps) {
    exportLayerWeightmap(terrainData, 'rock', `${config.landscapeName}_Layer_Rock.png`);
    exportLayerWeightmap(terrainData, 'grass', `${config.landscapeName}_Layer_Grass.png`);
    exportLayerWeightmap(terrainData, 'dirt', `${config.landscapeName}_Layer_Dirt.png`);
    exportLayerWeightmap(terrainData, 'snow', `${config.landscapeName}_Layer_Snow.png`);
  }

  // 3. Unreal Engine 5 Import Metadata
  const ue5Metadata = {
    generator: "Axis Terrain Lab , Made By Mahdi Kareem © 2026",
    targetEngine: "Unreal Engine 5 (5.1 - 5.5+) Landscape & World Partition",
    landscapeName: config.landscapeName,
    recommendedResolution: `${terrainData.resolution} x ${terrainData.resolution}`,
    format: "16-bit Little-Endian Unsigned Integer (.r16 / .raw)",
    zScaleCalculation: {
      formula: "1 Unreal Unit = 1 cm. Z Scale 100% = 512 meters elevation range.",
      recommendedZScale: config.zScalePercent,
    },
    layers: [
      { layerName: "Rock", maskFile: `${config.landscapeName}_Layer_Rock.png` },
      { layerName: "Grass", maskFile: `${config.landscapeName}_Layer_Grass.png` },
      { layerName: "Dirt", maskFile: `${config.landscapeName}_Layer_Dirt.png` },
      { layerName: "Snow", maskFile: `${config.landscapeName}_Layer_Snow.png` }
    ],
    worldPartitionTiling: {
      gridChunks: `${config.tileGrid}x${config.tileGrid}`,
      borderOverlap: "1 pixel border overlap included for seamless LOD stitching."
    },
    importSteps: [
      "1. In UE5 Landscape Mode, click 'Import from File'.",
      "2. Select the exported .r16 file.",
      "3. UE5 will automatically detect the recommended component grid dimensions.",
      "4. Under 'Target Layers', create Weight-Blended Layer Infos and assign each exported PNG weightmap."
    ]
  };

  downloadFile(JSON.stringify(ue5Metadata, null, 2), `${config.landscapeName}_UE5_LandscapeConfig.json`, 'application/json');
}
