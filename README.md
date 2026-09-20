# 🪐 Terraforge 3D — Planetary Simulation Engine

> **RTU Computer Graphics & Multimedia (CGM) Lab Project**  
> An interactive, real-time 3D WebGL solar system simulation engineered to demonstrate every core topic in modern computer graphics.

[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r174-black.svg?logo=three.js)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-Hardware--Accelerated-green.svg?logo=webgl)](https://www.khronos.org/webgl/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-2.2-blueviolet.svg?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📸 Screenshots & Overview

Terraforge 3D is a state-of-the-art interactive WebGL simulation engine inspired by sci-fi planetarium software like *Solar Smash*. It models real astronomical kinematics, multi-layered GLSL programmable shaders, dynamic climate transitions, and real-time matrix transformation mechanics within an intuitive, glassmorphic UI environment.

---

## 🎨 Visual Aesthetic & Core Philosophy

- **Pure Deep Space Viewport**: Deep black (`#000000`) canvas with an $8000$-unit procedural starfield skybox.
- **Physically-Inspired Day/Night Daylighting**: Strong directional solar lighting with smooth terminator falloff and emissive night city lighting.
- **Dark-Side-Silent Atmosphere Policy**: Atmospheric Rayleigh/Mie scattering tinting baked into shader Fresnel equations, automatically silencing on the unlit night hemisphere without artificial bloom/halo artifacts.
- **Glassmorphic Left-Edge Sidebar**: Slim vertical icon rail expanding smoothly on hover with docked flyout panels for matrix transformations, climate sliders, preset selections, and camera options.

---

## 🛠️ Technology Stack

| Component | Technology / Library | Purpose |
|---|---|---|
| **Core UI Framework** | React 18 & Vite | Reactive state management & fast HMR bundling |
| **3D Rendering Engine** | Three.js (r174) & `@react-three/fiber` | Scene graph management, WebGL abstractions & frame loop |
| **Shader Pipeline** | Custom GLSL (OpenGL Shading Language) | Vertex displacement, custom lighting, procedural ice sparkle & climate textures |
| **Styling & Icons** | TailwindCSS & Lucide Icons | Minimal floating glassmorphism & SVG iconography |

---

## 📚 RTU Computer Graphics (CGM) Syllabus Topic Mapping (10/10)

This project directly implements all **10 Core Topics** of the RTU Computer Graphics & Multimedia syllabus. Below is the mapping connecting code components, mathematical equations, and GLSL implementation logic to each topic:

| # | RTU Syllabus Topic | Implementation Highlights in Code | Math & GLSL Details | Code File Pointer |
|---|---|---|---|---|
| **1** | **Overview of 3D Computer Graphics** | Hardware-accelerated 60 FPS WebGL2 rendering loop integrated into React Three Fiber `<Canvas>`. | Uses `requestAnimationFrame` loop, WebGL context creation, frame buffer swap chain. | [`src/App.jsx`](src/App.jsx#L41-L59) |
| **2** | **3D Transformations & Composite Matrices** | $4 \times 4$ Homogeneous matrix transformations: Translation ($T$), Rotation ($R$), Scale ($S$), and composite $M = T \times R \times S$ calculation with live float grid inspection. | $$M = T(\vec{p}) \cdot R_z(\theta_z) \cdot R_y(\theta_y) \cdot R_x(\theta_x) \cdot S(\vec{s})$$ Demonstrates matrix non-commutativity ($T \cdot R \neq R \cdot T$). | [`src/components/TransformPanel.jsx`](src/components/TransformPanel.jsx#L145-L173) |
| **3** | **3D Viewing & Projections** | Perspective ($FOV = 45^\circ$, frustum ratio $300,000:1$) vs. Orthographic projection modes with unconstrained $360^\circ$ `OrbitControls` camera rig. | $$P_{persp} = \begin{bmatrix} \frac{\cot(fov/2)}{aspect} & 0 & 0 & 0 \\ 0 & \cot(fov/2) & 0 & 0 \\ 0 & 0 & \frac{f+n}{n-f} & \frac{2fn}{n-f} \\ 0 & 0 & -1 & 0 \end{bmatrix}$$ | [`src/components/CameraRig.jsx`](src/components/CameraRig.jsx#L20-L80) |
| **4** | **3D Curves & Surfaces** | Parametric quad-mesh sphere representation subdivided at $96 \times 96$ resolution with procedural normal calculations. | $$S(u,v) = \begin{pmatrix} r \sin u \cos v \\ r \cos u \\ r \sin u \sin v \end{pmatrix}, \quad u \in [0, \pi], v \in [0, 2\pi]$$ | [`src/components/Planet.jsx`](src/components/Planet.jsx#L265-L270) |
| **5** | **Illumination Models & Shading** | Custom Lambertian diffuse daylighting, Blinn-Phong specular glint, and emissive night city lighting. | Diffuse: $I_d = \max(0, \vec{N} \cdot \vec{L})$<br>Specular: $I_s = (\vec{N} \cdot \vec{H})^n, \quad \vec{H} = \frac{\vec{L} + \vec{V}}{\|\vec{L} + \vec{V}\|}$ | [`src/components/Planet.jsx`](src/components/Planet.jsx#L85-L120) |
| **6** | **Color Models & Texture Mapping** | Multi-texture UV mapping blending Albedo, Normal/Bump displacement, Landmask, Cloud Alpha, and Emissive Night Lights with dynamic Lerp transitions. | $$C_{final} = \text{Lerp}(C_{earth}, C_{preset}, t) \cdot (\vec{N} \cdot \vec{L}) + C_{night} \cdot (1 - \text{dayFactor})$$ | [`src/components/Planet.jsx`](src/components/Planet.jsx#L45-L65) |
| **7** | **Visible-Surface Detection & Depth Testing** | Hardware Z-Buffer depth testing combined with dual-pass alpha blending for cloud layers (`depthWrite={false}`). | Hardware Z-buffer comparison: $Z_{new} < Z_{buffer}$. Disables depth write for transparent cloud shells to eliminate Z-sorting artifacts. | [`src/App.jsx`](src/App.jsx#L46), [`src/components/Planet.jsx`](src/components/Planet.jsx#L280-L295) |
| **8** | **Computer Animation Kinematics** | Keplerian orbital kinematics, axial tilt ($23.44^\circ$), Moon orbital inclination ($5.14^\circ$), tidal lock kinematics, and ratio-locked rotation ($27.3\times$). | $$\theta_{rot}(t) = \theta_0 + \omega_{rot} \cdot \Delta t, \quad \phi_{orbit}(t) = \phi_0 + \omega_{orbit} \cdot \Delta t$$ Tidal Lock: $\theta_{moon} = -\phi_{orbit} + \frac{\pi}{2}$ | [`src/components/Moon.jsx`](src/components/Moon.jsx#L20-L48), [`src/components/Planet.jsx`](src/components/Planet.jsx#L180-L220) |
| **9** | **Programmable Shaders (GLSL)** | Multi-stage GLSL vertex & fragment shaders (`PlanetShader`) executing directly on GPU hardware with custom uniforms (`uTemperature`, `uCloudCoverage`, `uAtmosphereIntensity`). | Atmospheric Fresnel: $\text{Fresnel} = (1 - \max(0, \vec{N} \cdot \vec{V}))^3 \cdot \text{dayFactor}$ | [`src/components/Planet.jsx`](src/components/Planet.jsx#L10-L136) |
| **10** | **GPU Hardware Acceleration** | WebGL2 direct context creation, hardware antialiasing, zero-alloc per-frame updates via pre-allocated Three.js vectors, and `logarithmicDepthBuffer: true`. | Logarithmic depth buffer formula: $$z_{log} = \frac{\ln(c \cdot z + 1)}{\ln(c \cdot far + 1)} \cdot w$$ Prevents Z-fighting across 300,000:1 depth range. | [`src/App.jsx`](src/App.jsx#L46) |

---

## 🌌 Key Features & Physical Realism

### 1. Astronomical Kinematics & Scale Modes
- **Real Astronomical Ratios**: Earth axial tilt of $23.44^\circ$, Moon orbital inclination of $5.14^\circ$, Moon-to-Earth size ratio of $0.273$, and tidal lock ratio where rotation matches orbital period ($27.3\times$).
- **Fading Moon Orbit Trail**: Dynamic rolling buffer of recent Moon positions rendered as a vertex-colored arc fading from full electric cyan at the Moon's location to transparent space.
- **Simulated Date/Time Readout**: Live calendar date & day counter readout (`Day X • DD MMM YYYY`) in the View flyout drawer driven by 1 Earth rotation = 1 Earth-day, pausing when motion is paused and resetting on view reset.
- **True Scale Mode**: Toggle between cinematic view ($12\times$ Moon orbit radius) and astronomical True Scale mode ($60.3$ Earth radii distance).

### 2. Procedural & Shader-Driven Dynamic Planets
- **Earth (Terra)**: +15°C baseline temperature with lush vegetation, ocean specular highlights, dynamic cloud cover, and golden night lights on the dark hemisphere.
- **Ice (Frostworld)**: -60°C cryogenic world with high-albedo polar ice expansion, intense specular glare, and procedural simplex ice glint sparkles.
- **Desert (Scorched Expanse)**: +60°C hyper-arid world with golden sandstorms, high-opacity atmospheric dust haze, and zero liquid oceans.

### 3. Glassmorphic Hover Sidebar & Controls
- **Slim Collapsed Rail**: Flush 64px left rail with smooth glassmorphism backdrop blur.
- **Hover & Lock Expansion**: Expands on mouse hover or can be locked open with the Pin control.
- **Docked Flyout Panels**:
  - **World**: Quick preset switcher (Keys `1`, `2`, `3`).
  - **Climate**: Temperature (-60°C to +60°C), cloud coverage, atmospheric intensity, and rotation speed sliders.
  - **Transform**: Matrix inspector with translation, rotation, scaling sliders, Local Object Axes toggle, Composite Mode toggle, and live $4 \times 4$ float matrix output.
  - **View**: Perspective/Orthographic camera mode toggle, True Scale mode, Orbit path overlays, Reset camera (`R`), and Canvas PNG Screenshot Exporter.

---

## 🕹️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause planet rotation & orbital motion |
| `1` | Apply **Earth** preset (+15°C baseline) |
| `2` | Apply **Ice** preset (-60°C cryogenic world) |
| `3` | Apply **Desert** preset (+60°C hyper-arid world) |
| `R` / `r` | Reset camera view and focus on Earth |

---

## 📁 Directory & File Structure

```
Terraforge/
├── index.html                      # HTML5 entry point & metadata
├── package.json                    # Project dependencies & npm scripts
├── vite.config.js                  # Vite bundler configuration (Server port 3000)
├── tailwind.config.js              # TailwindCSS configuration
├── PROJECT_MASTER_DOCUMENTATION.md # Exhaustive master documentation & viva guide
├── README.md                       # Repository overview & syllabus mapping
└── src/
    ├── main.jsx                    # React application root DOM mount
    ├── App.jsx                     # WebGL Canvas container & Sidebar layout
    ├── index.css                   # Custom glassmorphic CSS rules & Google Fonts
    ├── state/
    │   └── useSimState.js          # Custom React hook for simulation & matrix state
    ├── data/
    │   └── presets.js              # World climate parameters (Earth, Ice, Desert)
    └── components/
        ├── Planet.jsx              # Custom GLSL PlanetShader, mesh & cloud shell
        ├── Sun.jsx                 # Directional light source & Sun mesh
        ├── Moon.jsx                # Tidally-locked Moon mesh & orbit lines
        ├── Starfield.jsx           # 8000-unit background star skybox
        ├── CameraRig.jsx           # Perspective/Orthographic camera controller
        ├── Sidebar.jsx             # Left-edge glassmorphic sidebar & flyouts
        ├── TransformPanel.jsx      # 3D Matrix inspector & 4x4 matrix grid
        ├── SimControls.jsx         # Climate parameter sliders
        ├── FirstLoadHint.jsx       # Interactive onboarding hint badge
        └── LoadingScreen.jsx       # Texture loading fallback indicator
```

---

## ⚡ Quick Start & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/SIDDHARTHXMEUR/Terraforge.git
cd Terraforge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` directory.

---

## 🎓 Viva Voice Q&A / Technical Defense Cheat Sheet

### Q1: Why did you use custom GLSL shaders instead of standard `MeshStandardMaterial` for the planet?
> **Answer**: `MeshStandardMaterial` does not support multi-texture blending (Albedo + Landmask + Cloud Alpha + Emissive Night Lights) driven by dynamic uniform parameters like temperature in a single pass. Our custom GLSL `PlanetShader` calculates day/night lighting, specular glint, land/ocean color transitions, atmospheric Fresnel scattering, and emissive night city lights directly on the GPU in a single vertex/fragment pass.

### Q2: How is the Composite Transformation Matrix calculated?
> **Answer**: Transformations follow $M = T \times R \times S$. Because matrix multiplication is non-commutative ($A \cdot B \neq B \cdot A$), scaling ($S$) must be applied first to the local geometry, followed by rotation ($R$), and finally translation ($T$) to world position. If translation were applied first, rotation would orbit the object around the origin rather than rotating around its own center.

### Q3: How do you prevent Z-fighting when rendering objects at massive astronomical distances?
> **Answer**: We enable `logarithmicDepthBuffer: true` on the WebGL canvas renderer. Standard linear depth buffers distribute precision evenly across the frustum, causing z-fighting at large distances. Logarithmic depth buffering allocates higher depth buffer precision near the camera while exponentially distributing precision across far distances (up to 30,000 units), guaranteeing clean rendering without Z-buffer flickering.

### Q4: How is tidal locking implemented for the Moon?
> **Answer**: Tidal locking means the Moon's rotation period equals its orbital period around Earth ($1:1$ resonance). In code, we update the Moon's local Y-axis rotation relative to its orbital angle $\phi_{orbit}$:
> $$\theta_{moon} = -\phi_{orbit} + \frac{\pi}{2}$$
> This keeps the exact same hemisphere of the Moon facing Earth at all points in its orbit.

---

## 📜 License & Credits

Developed by **Siddharth** for the **RTU Computer Graphics & Multimedia (CGM)** Laboratory Evaluation.  
Engineered with React, Three.js, WebGL2, and GLSL.
