/**
 * Axis Terrain Lab - Core Geomorphology & Simulation Engine
 * Procedural generation, fast multi-pass hydraulic & thermal erosion,
 * derivative masks (slope, curvature, wetness, flow), and splatmap generation.
 * 
 * Made By Mahdi Kareem © 2026
 */

export interface GeneratorParams {
  seed: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  heightMultiplier: number;
  ridgeWeight: number; // 0 = standard fBm, 1 = razor ridge multifractal
  terraceSteps: number; // 0 = none, >0 = stratified terracing
  terraceSmoothness: number;
  calderaRadius: number; // 0 = none, >0 = crater depression
}

export interface HydraulicParams {
  iterations: number;
  rainRate: number;
  evaporationRate: number;
  sedimentCapacity: number; // Kc
  dissolutionRate: number;  // Ks (erosion)
  depositionRate: number;   // Kd (settling)
  gravity: number;
}

export interface ThermalParams {
  iterations: number;
  reposeAngleDeg: number; // ~32 - 45 degrees
  transportRate: number;
}

export interface MaskConfig {
  slopeMin: number; // in degrees
  slopeMax: number;
  slopeFalloff: number;
  altitudeMin: number; // 0 - 1
  altitudeMax: number;
  altitudeFalloff: number;
  curvatureContrast: number;
  wetnessMultiplier: number;
}

export type BrushMode = 'raise' | 'lower' | 'smooth' | 'flatten' | 'hydraulic_stamp' | 'noise_stamp';

export interface BrushParams {
  mode: BrushMode;
  radius: number; // in grid cells
  strength: number; // 0.0 - 1.0
  targetHeight?: number; // for flatten
}

/**
 * 2D Simplex / Perlin noise implementation for deterministic procedural generation
 */
class FastNoise {
  private p: Uint8Array = new Uint8Array(512);

  constructor(seed: number = 1337) {
    this.reseed(seed);
  }

  public reseed(seed: number) {
    const permutation = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }
    // LCG pseudo-random shuffle
    let s = (seed ^ 0x6a09e667) >>> 0;
    for (let i = 255; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      const tmp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    const g00 = this.grad(this.p[A], xf, yf);
    const g10 = this.grad(this.p[B], xf - 1, yf);
    const g01 = this.grad(this.p[A + 1], xf, yf - 1);
    const g11 = this.grad(this.p[B + 1], xf - 1, yf - 1);

    const x1 = this.lerp(g00, g10, u);
    const x2 = this.lerp(g01, g11, u);
    return this.lerp(x1, x2, v);
  }

  public fbm2D(
    x: number,
    y: number,
    octaves: number,
    lacunarity: number,
    persistence: number,
    ridgeWeight: number = 0
  ): number {
    let total = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxVal = 0;

    for (let o = 0; o < octaves; o++) {
      let n = this.noise2D(x * frequency, y * frequency);
      if (ridgeWeight > 0.001) {
        // Ridged noise: sharp mountain arêtes
        const ridged = 1.0 - Math.abs(n);
        const ridgedSq = ridged * ridged;
        n = (1.0 - ridgeWeight) * (n * 0.5 + 0.5) + ridgeWeight * ridgedSq;
      } else {
        n = n * 0.5 + 0.5;
      }

      total += n * amplitude;
      maxVal += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxVal;
  }
}

export class TerrainData {
  public resolution: number;
  public height: Float32Array;
  public water: Float32Array;
  public sediment: Float32Array;
  public flow: Float32Array; // flow accumulation / velocity
  public depositedSediment: Float32Array; // net positive sediment accumulation

  // Derivative masks
  public slopeMask: Float32Array;
  public curvatureMask: Float32Array;
  public altitudeMask: Float32Array;
  public wetnessMask: Float32Array;

  private noise = new FastNoise();

  constructor(resolution: number = 512) {
    this.resolution = resolution;
    const len = resolution * resolution;
    this.height = new Float32Array(len);
    this.water = new Float32Array(len);
    this.sediment = new Float32Array(len);
    this.flow = new Float32Array(len);
    this.depositedSediment = new Float32Array(len);

    this.slopeMask = new Float32Array(len);
    this.curvatureMask = new Float32Array(len);
    this.altitudeMask = new Float32Array(len);
    this.wetnessMask = new Float32Array(len);
  }

  public clone(): TerrainData {
    const copy = new TerrainData(this.resolution);
    copy.height.set(this.height);
    copy.water.set(this.water);
    copy.sediment.set(this.sediment);
    copy.flow.set(this.flow);
    copy.depositedSediment.set(this.depositedSediment);
    copy.slopeMask.set(this.slopeMask);
    copy.curvatureMask.set(this.curvatureMask);
    copy.altitudeMask.set(this.altitudeMask);
    copy.wetnessMask.set(this.wetnessMask);
    return copy;
  }

  public getIndex(x: number, y: number): number {
    return y * this.resolution + x;
  }

  /**
   * Procedural terrain generator with multi-octave fBm, ridged arêtes, terracing, and caldera options
   */
  public generateProcedural(params: GeneratorParams) {
    this.noise.reseed(params.seed);
    const R = this.resolution;
    const invR = 1.0 / R;
    const halfR = R * 0.5;

    let minH = Infinity;
    let maxH = -Infinity;

    for (let y = 0; y < R; y++) {
      const ny = (y - halfR) * invR * params.scale;
      for (let x = 0; x < R; x++) {
        const nx = (x - halfR) * invR * params.scale;
        const idx = y * R + x;

        // Base multi-fractal noise
        let h = this.noise.fbm2D(
          nx,
          ny,
          params.octaves,
          params.lacunarity,
          params.persistence,
          params.ridgeWeight
        );

        // Continental island / mountain mask (radial falloff)
        const dx = (x - halfR) / halfR;
        const dy = (y - halfR) / halfR;
        const distSq = dx * dx + dy * dy;
        const islandMask = Math.max(0.0, 1.0 - Math.pow(distSq, 1.2));
        h = h * (0.3 + 0.7 * islandMask);

        // Stratified terracing / sedimentary geological layering
        if (params.terraceSteps > 1) {
          const stepSize = 1.0 / params.terraceSteps;
          const s = h / stepSize;
          const baseStep = Math.floor(s);
          const fraction = s - baseStep;
          const smoothFraction = Math.pow(fraction, params.terraceSmoothness);
          h = (baseStep + smoothFraction) * stepSize;
        }

        // Caldera / crater depression
        if (params.calderaRadius > 0.01) {
          const d = Math.sqrt(distSq);
          const craterDist = Math.abs(d - params.calderaRadius);
          if (d < params.calderaRadius) {
            h *= 0.4 + 0.6 * (d / params.calderaRadius);
          } else if (craterDist < 0.15) {
            // Raised caldera rim
            h += (1.0 - craterDist / 0.15) * 0.15;
          }
        }

        h *= params.heightMultiplier;
        this.height[idx] = h;

        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
    }

    // Normalize to 0.0 - 1.0 range
    const range = maxH - minH;
    if (range > 0.0001) {
      const invRange = 1.0 / range;
      for (let i = 0; i < R * R; i++) {
        this.height[i] = (this.height[i] - minH) * invRange;
        this.water[i] = 0;
        this.sediment[i] = 0;
        this.flow[i] = 0;
        this.depositedSediment[i] = 0;
      }
    }

    this.updateAllMasks();
  }

  /**
   * Fast GPU/Multi-pass style 2D Hydraulic Shallow Water & Virtual Pipes Erosion
   */
  public runHydraulicErosion(params: HydraulicParams, steps: number = 10) {
    const R = this.resolution;
    const invR = 1.0 / R;
    const totalCells = R * R;

    // Temporary outflow flux buffers: left, right, up, down
    const fluxL = new Float32Array(totalCells);
    const fluxR = new Float32Array(totalCells);
    const fluxU = new Float32Array(totalCells);
    const fluxD = new Float32Array(totalCells);

    const dt = 0.12;
    const pipeLength = invR * 100.0;
    const pipeCrossSection = 1.0;

    for (let step = 0; step < steps; step++) {
      // 1. Precipitation: add rain water
      for (let i = 0; i < totalCells; i++) {
        this.water[i] += params.rainRate * dt;
      }

      // 2. Outflow Flux calculation (Virtual Pipes model)
      for (let y = 1; y < R - 1; y++) {
        const row = y * R;
        for (let x = 1; x < R - 1; x++) {
          const idx = row + x;
          const hCenter = this.height[idx] + this.water[idx];

          const hL = this.height[idx - 1] + this.water[idx - 1];
          const hR = this.height[idx + 1] + this.water[idx + 1];
          const hU = this.height[idx - R] + this.water[idx - R];
          const hD = this.height[idx + R] + this.water[idx + R];

          const factor = dt * params.gravity * pipeCrossSection / pipeLength;

          // Outflow flux in each direction
          let fL = Math.max(0, fluxL[idx] + factor * (hCenter - hL));
          let fR = Math.max(0, fluxR[idx] + factor * (hCenter - hR));
          let fU = Math.max(0, fluxU[idx] + factor * (hCenter - hU));
          let fD = Math.max(0, fluxD[idx] + factor * (hCenter - hD));

          // Clamp fluxes so water volume doesn't go below 0
          const sumFlux = (fL + fR + fU + fD) * dt;
          if (sumFlux > 0.0001) {
            const availWater = this.water[idx] * pipeLength * pipeLength;
            const k = Math.min(1.0, availWater / sumFlux);
            fL *= k;
            fR *= k;
            fU *= k;
            fD *= k;
          }

          fluxL[idx] = fL;
          fluxR[idx] = fR;
          fluxU[idx] = fU;
          fluxD[idx] = fD;
        }
      }

      // 3. Water Volume & Velocity Update
      for (let y = 1; y < R - 1; y++) {
        const row = y * R;
        for (let x = 1; x < R - 1; x++) {
          const idx = row + x;

          // Inflow from 4 neighbors
          const inL = fluxR[idx - 1];
          const inR = fluxL[idx + 1];
          const inU = fluxD[idx - R];
          const inD = fluxU[idx + R];

          const outflow = fluxL[idx] + fluxR[idx] + fluxU[idx] + fluxD[idx];
          const inflow = inL + inR + inU + inD;

          const deltaVolume = (inflow - outflow) * dt;
          const newWater = Math.max(0, this.water[idx] + deltaVolume / (pipeLength * pipeLength));
          this.water[idx] = newWater;

          // Velocity vector (average net flow)
          const vx = (fluxR[idx] - fluxL[idx] + inL - inR) * 0.5;
          const vy = (fluxD[idx] - fluxU[idx] + inU - inD) * 0.5;
          const speed = Math.sqrt(vx * vx + vy * vy);
          this.flow[idx] = speed;

          if (newWater < 0.0001) continue;

          // 4. Erosion and Deposition based on sediment capacity
          // Local slope estimation
          const dhdx = (this.height[idx + 1] - this.height[idx - 1]) * 0.5;
          const dhdy = (this.height[idx + R] - this.height[idx - R]) * 0.5;
          const slope = Math.min(1.0, Math.sqrt(dhdx * dhdx + dhdy * dhdy) * 2.5);

          // Capacity C is proportional to slope and flow speed
          const capacity = Math.max(0.0001, params.sedimentCapacity * slope * speed);
          const currentSediment = this.sediment[idx];

          if (currentSediment < capacity) {
            // Erode bedrock
            const amountToErode = params.dissolutionRate * (capacity - currentSediment) * dt;
            const actualErode = Math.min(this.height[idx] * 0.5, amountToErode);
            this.height[idx] -= actualErode;
            this.sediment[idx] += actualErode;
          } else {
            // Deposit sediment
            const amountToDeposit = params.depositionRate * (currentSediment - capacity) * dt;
            this.height[idx] += amountToDeposit;
            this.sediment[idx] -= amountToDeposit;
            this.depositedSediment[idx] += amountToDeposit;
          }

          // 5. Evaporation
          this.water[idx] *= 1.0 - params.evaporationRate * dt;
        }
      }
    }

    this.updateAllMasks();
  }

  /**
   * Thermal / Talus scree erosion (Angle of Repose material slip)
   */
  public runThermalErosion(params: ThermalParams, steps: number = 5) {
    const R = this.resolution;
    const invR = 1.0 / R;
    const totalCells = R * R;
    const cellSize = invR * 100.0;

    // Critical tangent = tan(repose angle)
    const reposeAngleRad = (params.reposeAngleDeg * Math.PI) / 180.0;
    const maxSlope = Math.tan(reposeAngleRad) * cellSize;

    const deltaH = new Float32Array(totalCells);

    for (let step = 0; step < steps; step++) {
      deltaH.fill(0);

      for (let y = 1; y < R - 1; y++) {
        const row = y * R;
        for (let x = 1; x < R - 1; x++) {
          const idx = row + x;
          const h = this.height[idx];

          // 4 neighbors
          const neighbors = [idx - 1, idx + 1, idx - R, idx + R];
          let maxDiff = 0;
          let totalDiff = 0;
          const diffs = [0, 0, 0, 0];

          for (let n = 0; n < 4; n++) {
            const nIdx = neighbors[n];
            const diff = h - this.height[nIdx];
            if (diff > maxSlope) {
              const excess = diff - maxSlope;
              diffs[n] = excess;
              totalDiff += excess;
              if (excess > maxDiff) maxDiff = excess;
            }
          }

          if (totalDiff > 0) {
            // Distribute sliding rock/talus downhill
            const transportAmount = (maxDiff * 0.5) * params.transportRate;
            deltaH[idx] -= transportAmount;

            for (let n = 0; n < 4; n++) {
              if (diffs[n] > 0) {
                const fraction = diffs[n] / totalDiff;
                const deposit = transportAmount * fraction;
                deltaH[neighbors[n]] += deposit;
                this.depositedSediment[neighbors[n]] += deposit;
              }
            }
          }
        }
      }

      // Apply displacement
      for (let i = 0; i < totalCells; i++) {
        this.height[i] += deltaH[i];
      }
    }

    this.updateAllMasks();
  }

  /**
   * Fluvial incision (Wilbur stream power dendritic riverbed carving)
   */
  public runFluvialIncision(intensity: number = 0.5, steps: number = 3) {
    const R = this.resolution;
    const totalCells = R * R;
    const flowAcc = new Float32Array(totalCells);
    flowAcc.fill(1.0); // Baseline precipitation

    // Simple multi-flow drainage routing
    for (let s = 0; s < steps; s++) {
      for (let y = 1; y < R - 1; y++) {
        const row = y * R;
        for (let x = 1; x < R - 1; x++) {
          const idx = row + x;
          const h = this.height[idx];

          const nLeft = idx - 1;
          const nRight = idx + 1;
          const nUp = idx - R;
          const nDown = idx + R;

          let lowest = idx;
          let lowestH = h;

          for (const nIdx of [nLeft, nRight, nUp, nDown]) {
            if (this.height[nIdx] < lowestH) {
              lowestH = this.height[nIdx];
              lowest = nIdx;
            }
          }

          if (lowest !== idx) {
            flowAcc[lowest] += flowAcc[idx] * 0.95;
          }
        }
      }

      // Carve height proportional to stream power
      for (let i = 0; i < totalCells; i++) {
        const streamPower = Math.log10(flowAcc[i]) * 0.003 * intensity;
        this.height[i] = Math.max(0, this.height[i] - streamPower);
        this.flow[i] = Math.max(this.flow[i], flowAcc[i] * 0.05);
      }
    }

    this.updateAllMasks();
  }

  /**
   * Interactive real-time GPU brush sculpting
   */
  public applyBrush(centerX: number, centerY: number, params: BrushParams) {
    const R = this.resolution;
    const radius = params.radius;
    const radiusSq = radius * radius;
    const str = params.strength;

    const minX = Math.max(1, Math.floor(centerX - radius));
    const maxX = Math.min(R - 2, Math.ceil(centerX + radius));
    const minY = Math.max(1, Math.floor(centerY - radius));
    const maxY = Math.min(R - 2, Math.ceil(centerY + radius));

    if (params.mode === 'flatten' && params.targetHeight === undefined) {
      // Sample height under center
      const cIdx = Math.floor(centerY) * R + Math.floor(centerX);
      params.targetHeight = this.height[cIdx];
    }

    for (let y = minY; y <= maxY; y++) {
      const dy = y - centerY;
      const row = y * R;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerX;
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusSq) continue;

        // Smooth cosine falloff
        const dist = Math.sqrt(distSq);
        const falloff = 0.5 * (1.0 + Math.cos((dist / radius) * Math.PI));
        const idx = row + x;
        const effect = str * falloff;

        switch (params.mode) {
          case 'raise':
            this.height[idx] += 0.04 * effect;
            break;
          case 'lower':
            this.height[idx] = Math.max(0, this.height[idx] - 0.04 * effect);
            break;
          case 'smooth': {
            // 3x3 local average
            let avg = 0;
            for (let sy = -1; sy <= 1; sy++) {
              for (let sx = -1; sx <= 1; sx++) {
                avg += this.height[(y + sy) * R + (x + sx)];
              }
            }
            avg /= 9.0;
            this.height[idx] = this.height[idx] * (1.0 - effect) + avg * effect;
            break;
          }
          case 'flatten': {
            const target = params.targetHeight ?? 0.5;
            this.height[idx] = this.height[idx] * (1.0 - effect) + target * effect;
            break;
          }
          case 'hydraulic_stamp': {
            // Local localized hydraulic carve
            this.water[idx] += 0.2 * effect;
            this.height[idx] -= 0.02 * effect;
            this.depositedSediment[idx] += 0.01 * effect;
            break;
          }
          case 'noise_stamp': {
            const n = (this.noise.noise2D(x * 0.1, y * 0.1) * 2 - 1) * 0.03;
            this.height[idx] = Math.max(0, this.height[idx] + n * effect);
            break;
          }
        }
      }
    }

    this.updateAllMasks();
  }

  /**
   * Updates all derivative masks (Slope, Curvature, Altitude, Wetness)
   */
  public updateAllMasks(config: Partial<MaskConfig> = {}) {
    const R = this.resolution;

    const slopeMin = config.slopeMin ?? 25; // degrees
    const slopeMax = config.slopeMax ?? 65;
    const curvatureContrast = config.curvatureContrast ?? 3.0;

    for (let y = 1; y < R - 1; y++) {
      const row = y * R;
      for (let x = 1; x < R - 1; x++) {
        const idx = row + x;
        const h = this.height[idx];

        // Central differences for gradient
        const dhdx = (this.height[idx + 1] - this.height[idx - 1]) * 0.5 * R;
        const dhdy = (this.height[idx + R] - this.height[idx - R]) * 0.5 * R;
        const gradMag = Math.sqrt(dhdx * dhdx + dhdy * dhdy);
        const slopeDeg = (Math.atan(gradMag * 0.05) * 180.0) / Math.PI;

        // Slope mask (normalized between slopeMin and slopeMax)
        let sMask = (slopeDeg - slopeMin) / Math.max(1.0, slopeMax - slopeMin);
        sMask = Math.max(0.0, Math.min(1.0, sMask));
        this.slopeMask[idx] = sMask;

        // Laplacian curvature: d2h/dx2 + d2h/dy2
        const hL = this.height[idx - 1];
        const hR = this.height[idx + 1];
        const hU = this.height[idx - R];
        const hD = this.height[idx + R];
        const laplacian = (hL + hR + hU + hD - 4.0 * h) * curvatureContrast * 20.0;
        // Clamp to 0..1 where >0.5 is concave hollow, <0.5 is convex ridge
        this.curvatureMask[idx] = Math.max(0.0, Math.min(1.0, 0.5 + laplacian * 0.5));

        // Altitude mask (raw normalized height)
        this.altitudeMask[idx] = Math.max(0.0, Math.min(1.0, h));

        // Wetness mask: combination of residual water, flow accumulation, and sediment depression
        const flowVal = Math.min(1.0, this.flow[idx] * 2.0);
        const waterVal = Math.min(1.0, this.water[idx] * 5.0);
        const sedVal = Math.min(1.0, this.depositedSediment[idx] * 8.0);
        const wetness = Math.max(0.0, Math.min(1.0, waterVal * 0.4 + flowVal * 0.4 + sedVal * 0.2));
        this.wetnessMask[idx] = wetness;
      }
    }
  }

  /**
   * Generates a 4-channel packed RGBA splatmap:
   * Red = Rock (driven by slope & convex ridges)
   * Green = Grass (gentle slopes & lowlands)
   * Blue = Dirt / Sediment (crevices, depressions, deposited silt)
   * Alpha = Snow / High Altitude
   */
  public generatePackedSplatmap(): Uint8ClampedArray {
    const R = this.resolution;
    const totalCells = R * R;
    const splatData = new Uint8ClampedArray(totalCells * 4);

    for (let i = 0; i < totalCells; i++) {
      const slope = this.slopeMask[i];
      const alt = this.altitudeMask[i];
      const curv = this.curvatureMask[i];
      const sediment = Math.min(1.0, this.depositedSediment[i] * 10.0);
      const wetness = this.wetnessMask[i];

      // Red: Rock (steep slopes, exposed sharp ridges)
      let rock = slope * 1.3 + (1.0 - curv) * 0.4;
      rock = Math.max(0, Math.min(1, rock));

      // Alpha: Snow (high altitudes, modified by slope)
      let snow = alt > 0.65 ? (alt - 0.65) / 0.35 : 0;
      snow *= 1.0 - slope * 0.6; // Snow slides off vertical cliffs
      snow = Math.max(0, Math.min(1, snow));

      // Blue: Dirt / Soil / Wetness (valleys, crevices, sediment, lowlands)
      let dirt = (curv * 0.5 + sediment * 0.6 + wetness * 0.3) * (1.0 - rock);
      dirt = Math.max(0, Math.min(1, dirt));

      // Green: Grass (everywhere else on moderate flat terrain)
      let grass = (1.0 - rock) * (1.0 - snow) * (1.0 - dirt * 0.7);
      grass = Math.max(0, Math.min(1, grass));

      // Normalize weights so sum is 1.0
      const sum = rock + grass + dirt + snow;
      const invSum = sum > 0.001 ? 255.0 / sum : 255.0;

      const p = i * 4;
      splatData[p] = Math.round(rock * invSum);
      splatData[p + 1] = Math.round(grass * invSum);
      splatData[p + 2] = Math.round(dirt * invSum);
      splatData[p + 3] = Math.round(snow * invSum);
    }

    return splatData;
  }

  /**
   * Generates a 16-bit unsigned little-endian raw heightmap buffer (.r16 / .raw)
   * Suitable for Unreal Engine 5 and Godot Terrain3D
   */
  public exportRaw16Bit(): Uint8Array {
    const R = this.resolution;
    const totalCells = R * R;
    const buffer = new ArrayBuffer(totalCells * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < totalCells; i++) {
      const hClamped = Math.max(0.0, Math.min(1.0, this.height[i]));
      const val16 = Math.round(hClamped * 65535.0);
      view.setUint16(i * 2, val16, true); // true = Little-Endian
    }

    return new Uint8Array(buffer);
  }

  /**
   * Generates Godot Terrain3D Packed Control Map:
   * Channel R: Primary Texture Index (0-31)
   * Channel G: Secondary Texture Index (0-31)
   * Channel B: Blend Weight between Primary and Secondary
   * Channel A: Packed flags (bit 0-3: roughness modulation, bit 4-7: wetness)
   */
  public exportGodotTerrain3DControlMap(): Uint8ClampedArray {
    const R = this.resolution;
    const totalCells = R * R;
    const controlMap = new Uint8ClampedArray(totalCells * 4);

    for (let i = 0; i < totalCells; i++) {
      const slope = this.slopeMask[i];
      const alt = this.altitudeMask[i];
      const wet = this.wetnessMask[i];

      // Slot 0 = Grass, Slot 1 = Rock, Slot 2 = Dirt, Slot 3 = Snow
      let primaryIdx = 0;
      let secondaryIdx = 1;
      let blendWeight = 0;

      if (alt > 0.7) {
        primaryIdx = 3; // Snow
        secondaryIdx = 1; // Rock
        blendWeight = Math.round(slope * 255);
      } else if (slope > 0.4) {
        primaryIdx = 1; // Rock
        secondaryIdx = 2; // Scree / Dirt
        blendWeight = Math.round((1.0 - slope) * 255);
      } else {
        primaryIdx = 0; // Grass
        secondaryIdx = 2; // Dirt
        blendWeight = Math.round(this.curvatureMask[i] * 255);
      }

      const p = i * 4;
      controlMap[p] = primaryIdx & 0x1f;
      controlMap[p + 1] = secondaryIdx & 0x1f;
      controlMap[p + 2] = blendWeight;
      // Roughness + Wetness in Alpha
      const packedWet = Math.round(wet * 15) & 0x0f;
      const packedRough = Math.round((1.0 - wet) * 15) & 0x0f;
      controlMap[p + 3] = (packedWet << 4) | packedRough;
    }

    return controlMap;
  }
}
