<div align="center">

<p align="center">
  <img src="docs/assets/logo.svg" alt="Axis Terrain Lab Logo" width="160" />
</p>

# Axis Terrain Lab

**Next-Gen GPU-Accelerated Procedural Terrain, Splatmap & Hydraulic Erosion Suite**

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11%20(x64)-0078D6?logo=windows&logoColor=white)](https://github.com/MooPuu/Axis-Terrain-Lab/releases/tag/v1.0.0)
[![Official Website](https://img.shields.io/badge/Website-moopuu.github.io%2FAxis--Terrain--Lab-10b981?logo=googlechrome&logoColor=white)](https://moopuu.github.io/Axis-Terrain-Lab/)
[![Built with: Rust](https://img.shields.io/badge/Backend-Rust-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Framework: Tauri v2](https://img.shields.io/badge/Framework-Tauri%20v2-24C8D8?logo=tauri&logoColor=white)](https://tauri.app)
[![3D Engine: Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-black?logo=three.js&logoColor=white)](https://threejs.org)
[![UI: Headless UI](https://img.shields.io/badge/UI-Headless%20UI-66C0F4?logo=headlessui&logoColor=white)](https://headlessui.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: 1.0.0](https://img.shields.io/badge/Release-v1.0.0-success.svg)](https://github.com/MooPuu/Axis-Terrain-Lab/releases/tag/v1.0.0)

<p align="center">
  <a href="https://moopuu.github.io/Axis-Terrain-Lab/" target="_blank"><strong>🌐 Visit Official Website &amp; Feature Showcase</strong></a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/MooPuu/Axis-Terrain-Lab/releases/tag/v1.0.0" target="_blank"><strong>📦 Download v1.0.0 for Windows</strong></a>
</p>

*A blazingly fast, lightweight, and modern desktop application designed for game developers, 3D artists, and environment designers. Author 16-bit/32-bit heightmaps, simulate multi-pass hydraulic and thermal erosion, generate multi-channel packed splatmaps, and export production-ready packages for Godot Terrain3D and Unreal Engine 5.*

</div>

---

## 📸 Screenshots

<div align="center">
  <p><strong>Real-time 3D Viewport with Hydraulic Shallow Water Erosion &amp; PBR Multi-Material Shading</strong></p>
  <img src="docs/screenshots/overview.png" alt="Axis Terrain Lab - 3D Viewport & Hydraulic Erosion" width="1000" />
</div>

<br/>

<div align="center">
  <table border="0">
    <tr>
      <td width="50%" align="center">
        <strong>Packed RGBA Splatmap &amp; Weightmasks</strong><br/>
        <img src="docs/screenshots/splatmaps.png" alt="Splatmaps & Biome Masks" width="480" />
      </td>
      <td width="50%" align="center">
        <strong>Game Engine Export (Godot 4 &amp; UE5)</strong><br/>
        <img src="docs/screenshots/export-hub.png" alt="Engine Export Hub" width="480" />
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <strong>Topology &amp; Dynamic Wireframe Inspection Mode</strong><br/>
        <img src="docs/screenshots/wireframe.png" alt="Wireframe Mode" width="700" />
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Overview

**Axis Terrain Lab** is part of the **Axis Tools** open-source game development ecosystem. Engineered with a native **Rust + Tauri v2** architecture and an accessible **Headless UI** interface, it replaces slow, multi-gigabyte legacy terrain software with a standalone binary under **10 MB** that starts instantaneously.

Whether sculpting alpine horns, simulating millions of cubic meters of hydrodynamic virtual-pipe erosion, or packing 4-channel biome splatmaps, Axis Terrain Lab provides an interactive, real-time 3D workflow directly on the GPU.

---

## ✨ Features

### 🌊 Physical GPU Erosion Simulation
- **Hydraulic Shallow Water (Virtual Pipes)**: Real-time simulation of hydrodynamic rainfall, outflow flux conservation, velocity vectors, bedrock dissolution ($K_s$), sediment carrying capacity ($K_c$), deposition ($K_d$), and evaporation.
- **Thermal Talus & Scree**: Angle of Repose material slip ($25^\circ - 48^\circ$) modeling realistic mechanical cliff weathering and alluvial scree fans.
- **Fluvial Dendritic River Incision**: Stream power drainage routing carving natural dendritic riverbeds and canyon networks across macro-terrains.

### 🎨 Weightmap & Splatmap Generator
- **Slope Angle Mask**: Normal dot-product gradient extraction distinguishing sheer vertical rock cliffs from gentle valley meadows.
- **Curvature Mask (Laplacian $\nabla^2 H$)**: Second-order derivative filter separating exposed convex ridge weathering from concave dirt/moisture hollows.
- **Altitude Bands**: Customizable elevation thresholds for valleys, alpine treeline, and glaciated snow fields.
- **Topographic Wetness Index (TWI)**: Combines residual water depth, fluid flow velocity, and deposited silt.
- **4-Channel RGBA Packed Splatmap**:
  - **Red**: Cliff Rock & Ridges
  - **Green**: Lowland Grass
  - **Blue**: Soil Sediment & Riverbed Silt
  - **Alpha**: Glacial Mountain Snow

### 🎮 Interactive 3D Viewport & Brushes
- **WebGL2 / Three.js Renderer**: 60 FPS continuous terrain mesh rendering with real-time soft shadows, adjustable sun azimuth ($0^\circ - 360^\circ$) and elevation ($15^\circ - 85^\circ$).
- **5 Viewport Modes**: PBR Multi-Material, Elevation Heatmap, Slope Angle Overlay, Packed Splatmap RGB, and Wireframe Topology.
- **Raycast 3D Sculpting Brushes**: Sculpt directly onto the 3D surface with continuous raycasting:
  - `Raise` & `Lower` (Smooth cosine displacement)
  - `Smooth` (Gaussian / bilateral surface blur)
  - `Flatten` (Sample-locked plateau terracing)
  - `Hydraulic Stamp` (Localized riverlet carving)

### 📦 First-Class Game Engine Bridges
- **Godot 4.x / Terrain3D**:
  - Little-Endian unsigned 16-bit RAW (`.r16`)
  - Proprietary 4-channel packed **Control Map** (`.png`) encoding texture slot indices (0-31), weight blend, roughness, and wetness flags
  - Companion `terrain3d_config.json` preset
- **Unreal Engine 5 Landscape**:
  - Clamped to Epic's recommended component resolutions (`1009x1009`, `2017x2017`, `4033x4033`)
  - 16-bit Little-Endian RAW (`.r16` / `.raw`)
  - 4x Individual 8-bit layer weightmap PNGs (`Layer_Rock`, `Layer_Grass`, `Layer_Dirt`, `Layer_Snow`)
  - World Partition tiling metadata

---

## 🚀 Downloads & Installation (v1.0.0)

| Package | Description | Download | Size | SHA-256 Checksum |
|---|---|---|---|---|
| **Standalone Portable** | Zero installation. Run directly anywhere. | [**Axis-Terrain-Lab_1.0.0_Portable.exe**](https://github.com/MooPuu/Axis-Terrain-Lab/releases/download/v1.0.0/Axis-Terrain-Lab_1.0.0_Portable.exe) | ~9.12 MB | `64085396EE9BFCE1BDC825730E80123C28D42D110C77F424B55A3DC78B3DA86F` |
| **Setup Wizard (NSIS)** | Desktop & Start Menu shortcuts, clean uninstaller. | [**Axis-Terrain-Lab_1.0.0_NSIS_Setup.exe**](https://github.com/MooPuu/Axis-Terrain-Lab/releases/download/v1.0.0/Axis-Terrain-Lab_1.0.0_NSIS_Setup.exe) | ~2.07 MB | `BFE7DA4E12C6D0FEFF6ACE97BDDB370DDF7A81613AD6F554A4FEECE6FFA752E2` |
| **Enterprise Installer (MSI)** | WiX Windows Installer package. | [**Axis-Terrain-Lab_1.0.0.msi**](https://github.com/MooPuu/Axis-Terrain-Lab/releases/download/v1.0.0/Axis-Terrain-Lab_1.0.0.msi) | ~3.00 MB | `0161AA3FE34AEC21E40C118E28B09332433DAA0297E9CBB978CFFEC0704E626F` |

> **System Requirements:** Windows 10/11 (64-bit) with Microsoft Edge WebView2 runtime (pre-installed on modern Windows 10 & 11).

---

## 🛠️ Architecture & Tech Stack

```
Axis Terrain Lab
├── Backend (Rust & Tauri v2)
│   ├── Cargo.toml (axis-terrain-lab v1.0.0)
│   ├── tauri.conf.json (Window: 1440x900, "Axis Terrain Lab , Made By Mahdi Kareem © 2026")
│   └── lib.rs (Tauri application builder)
└── Frontend (TypeScript & WebGL)
    ├── Headless UI v2 (@headlessui/react) — Accessible Tabs, Listbox, Dialog, RadioGroup, Switch
    ├── Three.js r186 (Continuous mesh displacement, raycasting, dynamic directional lighting)
    ├── Solar & Iconsax Duotone Icon Suite (Custom vector SVGs)
    ├── TerrainEngine.ts (Fast 32-bit hydraulic & thermal simulation, Laplacian curvature)
    └── ExportPipeline.ts (Godot Terrain3D packed Control Map & UE5 Landscape exporters)
```

---

## 💻 Building from Source

### Prerequisites
1. **Node.js** (v18+) and **npm**: [nodejs.org](https://nodejs.org)
2. **Rust & Cargo** (v1.77+): [rustup.rs](https://rustup.rs)
3. **Microsoft C++ Build Tools** (via Visual Studio Installer)

### Development
```bash
# 1. Clone repository
git clone https://github.com/MooPuu/Axis-Terrain-Lab.git
cd Axis-Terrain-Lab

# 2. Install dependencies
npm install

# 3. Launch local UI preview
npm run dev

# 4. Or launch native desktop Tauri application
npx @tauri-apps/cli dev
```

### Production Build
```bash
# Build frontend
npm run build

# Compile native Windows executables & bundles (Portable, NSIS, MSI)
npx @tauri-apps/cli build --bundles nsis,msi
```

---

## 📄 License

This project is open-source and released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 👤 Author & Credits

- **Creator & Lead Developer**: Mahdi Kareem ([MooPuu](https://github.com/MooPuu))
- **Organization**: [Axis Tools](https://github.com/MooPuu) &mdash; *The Open-Source Game Development Stack*
- Copyright &copy; 2026 Mahdi Kareem. All rights reserved.
