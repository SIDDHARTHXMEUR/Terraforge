# Terraforge 3D — Complete Master Technical Documentation & Lab Manual

**Project Name**: **Terraforge 3D** (Planetary Simulation Engine)  
**Course / Lab Project**: RTU Computer Graphics & Multimedia (CGM) Lab  
**Tech Stack**: React 18, Three.js, React Three Fiber (R3F), GLSL (OpenGL Shading Language), Vite, TailwindCSS  
**Design Aesthetic**: Solar Smash-inspired high-contrast cinematic viewport with left-edge glassmorphic sidebar  

---

## Table of Contents
1. [Executive Summary & Core Mission](#1-executive-summary--core-mission)
2. [Project File Structure & Architecture](#2-project-file-structure--architecture)
3. [RTU Computer Graphics Syllabus Mapping (10/10)](#3-rtu-computer-graphics-syllabus-mapping-1010)
4. [Astronomical & Kinematic Constants](#4-astronomical--kinematic-constants)
5. [Mathematics of 3D Homogeneous Transformations](#5-mathematics-of-3d-homogeneous-transformations)
6. [High-Definition Custom GLSL Shader Pipeline (`PlanetShader`)](#6-high-definition-custom-glsl-shader-pipeline-planetshader)
7. [Detailed Component Architecture & Reference](#7-detailed-component-architecture--reference)
8. [Lighting, Camera & Frustum Architecture](#8-lighting-camera--frustum-architecture)
9. [Build, Execution & Deployment Guide](#9-build-execution--deployment-guide)
10. [Lab Viva Voce Examiner Q&A Cheat Sheet](#10-lab-viva-voce-examiner-qa-cheat-sheet)

---

## 1. Executive Summary & Core Mission

The **Terraforge 3D Planetary Simulation Engine** is a real-time, interactive WebGL web application engineered to demonstrate every core fundamental topic in modern Computer Graphics & Multimedia. Designed with a **Solar Smash-inspired aesthetic**, it features a pure `#000000` deep-space background, hard-contrast directional daylighting, and a left-edge glassmorphic hover sidebar.

### Key Highlights
- **Left-Edge Glassmorphic Sidebar**: 64px vertical icon rail expanding to 224px on hover or when pinned open. Docked flyout panels for World Presets, Climate, Transform Matrix, View Controls, and Viva Guide.
- **High-Definition Procedural Shader**: Advanced surface remapping for Ice (-60°C), Earth (+15°C), and Desert (+60°C) climate presets preserving 4K continental mountain topography, canyon ridges, procedural polar frost caps, and volcanic lava night lights.
- **Asymmetric Specular & Shimmer Physics**: Specular glare boost on icy glaciers, specular fade on dry sand dunes, paired with time-varying procedural noise ice sparkle shimmer.
- **Logarithmic Depth Buffer**: WebGL renderer enabled with `logarithmicDepthBuffer: true` preventing Z-fighting across $300,000 : 1$ frustum ratios ($0.1$ to $30000$ distance units).
- **Keyboard Shortcuts**: `Space` (Play/Pause), `1-3` (Presets), `R` (Camera Reset).
- **Canvas PNG Export**: One-click high-resolution WebGL canvas image export.

---

## 2. Project File Structure & Architecture

```
c:\Users\siddh\Simulator\
├── README.md                      # Quick-start guide & syllabus code index
├── PROJECT_MASTER_DOCUMENTATION.md # Comprehensive Technical & Lab Manual
├── index.html                     # HTML5 Entry point (Terraforge 3D branding)
├── package.json                   # Vite + R3F dependencies & build scripts
├── vite.config.js                 # Vite bundler configuration
├── public/
│   └── textures/                  # High-Resolution NASA Texture Maps
│       ├── earth/
│       │   ├── earth_albedo.jpg       # 4K Surface Color Albedo
│       │   ├── earth_bump.jpg         # Topographic Elevation Bump Map
│       │   ├── earth_clouds.png       # Cloud Layer Alpha Texture
│       │   ├── earth_landmask.png     # Grayscale Land vs Ocean Binary Mask
│       │   └── earth_nightlights.jpg  # Nighttime City Emissive Map
│       ├── moon/
│       │   ├── moon_albedo.jpg        # Lunar Surface Color Map
│       │   └── moon_bump.jpg          # Lunar Crater Elevation Map
│       └── sun/
│           ├── sun_surface.jpg        # Solar Photosphere Surface Map
│           └── starfield_skybox.jpg   # Deep Space High-Res Photographic Skybox
└── src/
    ├── main.jsx                   # React DOM root render
    ├── App.jsx                    # Viewport Shell (Canvas, Sidebar, Hint, LoadingScreen)
    ├── index.css                  # Tailwind CSS & Glassmorphism styles
    ├── components/
    │   ├── Sidebar.jsx            # Left-Edge Hover Navigation Rail & Flyout Panels
    │   ├── FirstLoadHint.jsx      # Auto-fading Interaction Badge
    │   ├── LoadingScreen.jsx       # Texture Loading Progress Fallback
    │   ├── Planet.jsx             # ShaderMesh, Cloud Layer, Tilt, Sparkle & Revolution
    │   ├── Moon.jsx               # Lunar Mesh, Kinematic Orbit & Tidal Lock
    │   ├── Sun.jsx                # Directional Light & Sun Body Mesh
    │   ├── Starfield.jsx          # Camera-tracked Deep Space Skybox Sphere
    │   ├── CameraRig.jsx          # 360° OrbitControls & View Switcher
    │   ├── TransformPanel.jsx     # Matrix Sliders & Live 4x4 Grid Display
    │   ├── SimControls.jsx        # Climate, Clouds & Speed Drawers
    │   └── VivaGuide.jsx          # Interactive RTU Syllabus Viva Modal
    ├── state/
    │   └── useSimState.js         # Custom State Store & Lerp Animation Drivers
    └── data/
        └── presets.js             # Climate Preset Default Values
```

---

## 3. RTU Computer Graphics Syllabus Mapping (10/10)

| # | Syllabus Topic | Technical Implementation in Code | Code Location |
|---|---|---|---|
| **1** | **Overview of 3D Computer Graphics** | Hardware-accelerated WebGL2 rendering loop using Three.js and `@react-three/fiber` targeting 60 FPS+. | [App.jsx](file:///c:/Users/siddh/Simulator/src/App.jsx#L39-L55) |
| **2** | **3D Transformations** | Homogeneous 3D Translation ($T$), Rotation ($R_x, R_y, R_z$), and Scale ($S$) with $M = T \times R \times S$ composite matrix multiplication and live $4 \times 4$ numeric display. | [TransformPanel.jsx](file:///c:/Users/siddh/Simulator/src/components/TransformPanel.jsx#L140-L168) |
| **3** | **3D Viewing & Projections** | Dynamic camera rig supporting Perspective Projection ($FOV = 45^\circ$) and Orthographic Projection with frustum clipping (`far = 30000`). | [CameraRig.jsx](file:///c:/Users/siddh/Simulator/src/components/CameraRig.jsx#L100-L135) |
| **4** | **3D Curves & Surface Representation** | Parametric spherical mesh representation using `sphereGeometry args={[radius, 96, 96]}` (18,432 polygons). | [Planet.jsx](file:///c:/Users/siddh/Simulator/src/components/Planet.jsx#L265-L270) |
| **5** | **Illumination Models & Surface Rendering** | Asymmetric Blinn-Phong specular glint model, diffuse Lambertian daylighting, and emissive night city lights. | [Planet.jsx](file:///c:/Users/siddh/Simulator/src/components/Planet.jsx#L90-L110) |
| **6** | **Color Models & Texture Mapping** | Multi-texture UV mapping ($u, v \in [0, 1]$) blending Albedo, Bump, Landmask, Cloud Alpha, and Night Light maps. | [Planet.jsx](file:///c:/Users/siddh/Simulator/src/components/Planet.jsx#L45-L65) |
| **7** | **Visible-Surface Detection** | Hardware Z-Buffer depth testing combined with dual-pass semi-transparent cloud layer blending (`depthWrite={false}`). | [Planet.jsx](file:///c:/Users/siddh/Simulator/src/components/Planet.jsx#L280-L293) |
| **8** | **Computer Animation Kinematics** | Locked rotational period ratio ($27.3\times$), orbital revolution paths, and Moon tidal locking ($R_{moon} = \theta_{orbit}$). | [Moon.jsx](file:///c:/Users/siddh/Simulator/src/components/Moon.jsx#L20-L48) |
| **9** | **Programmable Shaders (GLSL)** | Custom GLSL Vertex and Fragment Shaders (`PlanetShader`) executing on GPU driven by `uTemperature` & `uTime` uniforms. | [Planet.jsx](file:///c:/Users/siddh/Simulator/src/components/Planet.jsx#L10-L136) |
| **10** | **GPU Hardware Acceleration** | Direct WebGL canvas context creation with hardware antialiasing and `logarithmicDepthBuffer: true`. | [App.jsx](file:///c:/Users/siddh/Simulator/src/App.jsx#L40-L45) |

---

## 4. Astronomical & Kinematic Constants

$$\text{Size Ratio}: \quad R_{Moon} = 0.273 \times R_{Earth}$$
$$\text{Axial Tilt}: \quad \theta_{axial\_tilt} = 23.44^\circ = 0.409105 \text{ rad}$$
$$\text{Lunar Orbital Inclination}: \quad \theta_{lunar\_inclination} = 5.14^\circ = 0.08971 \text{ rad}$$
$$\text{Orbital Speed Ratio}: \quad \omega_{Moon\_orbit} = \frac{\omega_{Earth\_rotation}}{27.3}$$

---

## 5. Mathematics of 3D Homogeneous Transformations

Points in 3D space are represented as homogeneous 4-element vectors $(x, y, z, 1)^T$. Matrix transformations follow strict multiplication order: **Scale first, Rotate second, Translate last**:

$$M = T(t_x, t_y, t_z) \cdot \Big( R_z(\theta_z + 23.44^\circ) \cdot R_y(\theta_y) \cdot R_x(\theta_x) \Big) \cdot S(s_x, s_y, s_z)$$

When Composite Mode is enabled in `TransformPanel.jsx`, the final vertex position $V_{world}$ is calculated via matrix vector product:
$$V_{world} = M \cdot V_{local}$$

---

## 9. Build, Execution & Deployment Guide

```bash
cd c:\Users\siddh\Simulator
npm install
npm run dev     # Starts local server at http://localhost:3000
npm run build   # Compiles production distribution bundle
```

### Keyboard Shortcuts
- `Space`: Play / Pause Motion
- `1`: Switch to Earth Preset (+15°C)
- `2`: Switch to Ice Preset (-60°C)
- `3`: Switch to Desert Preset (+60°C)
- `R`: Reset Camera View

---

## 10. Lab Viva Voce Examiner Q&A Cheat Sheet

#### Q1: What technology stack is used in Terraforge 3D?
**Answer**: React 18, Vite, Three.js, React Three Fiber (R3F), GLSL OpenGL shaders, and TailwindCSS.

#### Q2: How are 3D transformations implemented, and why is matrix order important?
**Answer**: Transformations use 3D Homogeneous Coordinates ($4 \times 4$ matrices). Matrix multiplication is non-commutative ($A \cdot B \neq B \cdot A$), so transformations must be applied in order: **Scale first, Rotate second, Translate last** ($M = T \cdot R \cdot S$) to prevent scaling along rotated axes.

#### Q3: What is the significance of Earth's $23.44^\circ$ axial tilt in your simulation?
**Answer**: Earth's rotation vector is inclined by $23.44^\circ$ ($0.4091$ rad) on the Z-axis. This tilt causes varying sunlight angles on northern and southern hemispheres as Earth revolves around the Sun, demonstrating the astronomical origin of seasons.

#### Q4: How does the left-edge glassmorphic sidebar improve user experience?
**Answer**: It consolidates 9 scattered controls into 6 organized flyout categories, freeing up bottom viewport space, providing a pin/lock toggle for live presentations, and offering instant keyboard shortcuts (`Space`, `1-3`, `R`).
