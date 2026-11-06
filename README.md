# 🪐 TERRAFORGE 2.0 — Planetary Intelligence & Scientific Simulation Platform

> **Category**: Enterprise Planetary Intelligence & Astrophysical Simulation Platform  
> **Tagline**: **EXPLORE. ANALYZE. SIMULATE.**  
> **🚀 Live Demonstration**: [terraforge-theta.vercel.app](https://terraforge-theta.vercel.app/)  
> Engineered for national-level hackathons, academic research demonstrations, technical evaluations, and software engineering portfolios.

[![Live Demo](https://img.shields.io/badge/Live%20Platform-terraforge--theta.vercel.app-00f2fe?style=for-the-badge&logo=vercel)](https://terraforge-theta.vercel.app/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r162-black.svg?logo=three.js)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-Hardware--Accelerated-green.svg?logo=webgl)](https://www.khronos.org/webgl/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Node.js Tests](https://img.shields.io/badge/Unit%20Tests-16%2F16%20Passed-brightgreen.svg?logo=node.js)](package.json)
[![NASA APIs](https://img.shields.io/badge/NASA%20Open%20Data-EONET%20%7C%20NeoWs%20%7C%20JPL-red.svg?logo=nasa)](https://api.nasa.gov/)
[![Gemini AI](https://img.shields.io/badge/AI%20Assistant-Gemini%20API-orange.svg?logo=google)](https://ai.google.dev/)

---

## 🏛️ Product Identity & The Four Architectural Pillars

Terraforge 2.0 is built around four core pillars designed to deliver exceptional visual quality, genuine scientific functionality, and deep systems engineering:

```
                            ┌──────────────────────────────────────────────┐
                            │               TERRAFORGE 2.0                 │
                            │      EXPLORE  •  ANALYZE  •  SIMULATE        │
                            └──────────────────────┬───────────────────────┘
                                                   │
         ┌───────────────────────────┬─────────────┴─────────────┬───────────────────────────┐
         │                           │                           │                           │
         ▼                           ▼                           ▼                           ▼
  1. EXPLORE                  2. ANALYZE                  3. SIMULATE                  4. ASSIST
  • 9 Celestial Bodies        • NASA EONET v3 Feed        • Energy Balance Climate     • Gemini AI Reasoning
  • Custom GLSL Shaders       • NASA NeoWs Asteroids      • Asteroid Impact Cratering  • Deterministic Solvers
  • Planetary Rings (Saturn)  • JPL Horizons Ephemerides  • Two-Body Keplerian Orbit   • Real Context Awareness
  • Cinematic/Sci/Edu Modes   • Real-Time Telemetry       • Numerical Trajectories     • No Hallucinations
```

1. **EXPLORE** — Immersive 3D planetary exploration environment supporting Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn (with rings), Uranus (sideways tilt & rings), and Neptune with custom GLSL atmospheric shaders, real axial tilts, day/night terminators, and Keplerian orbit visualizers.
2. **ANALYZE** — Direct synchronization with real scientific datasets: NASA EONET v3 (Earth Observatory Natural Event Tracker for active wildfires, severe storms, volcanoes, sea ice), NASA NeoWs (Near-Earth Object radar tracking), APOD, and JPL Horizons telemetry.
3. **SIMULATE** — Independent, unit-tested scientific computing lab featuring deterministic models for thermodynamic climate radiative forcing, asteroid impact cratering physics, and Keplerian orbital velocity propagation.
4. **ASSIST** — AI scientific assistant powered by Google Gemini API with function calling, context-aware state analysis, and direct execution of deterministic mathematical engines.

---

## 🔬 Scientific Methodology & Mathematical Foundations

### 1. Two-Body Keplerian Astrodynamics
Implemented in [`src/math/orbitalMechanics.js`](src/math/orbitalMechanics.js) and verified by 6 automated unit tests.

- **Vis-Viva Equation**:
  $$v = \sqrt{\mu \left( \frac{2}{r} - \frac{1}{a} \right)}$$
  Where standard gravitational parameter $\mu = G \times M_{central}$.
- **Kepler's Third Law (Harmonic Law)**:
  $$T = 2\pi \sqrt{\frac{a^3}{\mu}}$$
- **Escape Velocity**:
  $$v_{esc} = \sqrt{\frac{2\mu}{r}} = \sqrt{2} \cdot v_{circ}$$
- **Apsides**:
  $$r_{periapsis} = a(1 - e), \quad r_{apoapsis} = a(1 + e)$$
- **Specific Orbital Energy**:
  $$\varepsilon = -\frac{\mu}{2a} \quad (\text{strictly } < 0 \text{ for bound elliptic orbits})$$
- **Kinematic Lunar Tidal Lock**: Speed ratio strictly locked to $27.32:1$ relative to Earth's rotation, maintaining synchronous rotation where the same lunar hemisphere faces Earth.

### 2. Asteroid Impact Cratering Physics
Implemented in [`src/math/asteroidImpact.js`](src/math/asteroidImpact.js) based on Collins, Melosh & Marcus (2005) dimensionless $\pi$-group scaling:

- **Spherical Volume & Impactor Mass**:
  $$V = \frac{4}{3}\pi r^3, \quad M = \rho V$$
- **Kinetic Energy Release**:
  $$E_k = \frac{1}{2} M v^2 \quad (\text{Megatons TNT} = E_k / 4.184 \times 10^{15})$$
- **Transient Crater Scaling**:
  $$D_{tc} = 1.161 \left(\frac{\rho_i}{\rho_t}\right)^{1/3} L^{0.78} v^{0.44} g^{-0.22} \sin^{1/3}(\theta)$$
- **Simple-to-Complex Crater Collapse Threshold** ($D_c \approx 3,200\text{ m}$ on Earth):
  $$D_{final} = \begin{cases} 1.25 D_{tc} & D_{tc} < 3200\text{ m (Simple Bowl)} \\ 1.17 \frac{D_{tc}^{1.13}}{D_c^{0.13}} & D_{tc} \ge 3200\text{ m (Complex Central Peak)} \end{cases}$$
- **Equivalent Seismic Magnitude**:
  $$M_w = 0.67 \log_{10}(E_{joules}) - 5.87$$

### 3. Thermodynamic Energy Balance Climate Model (EBM)
Implemented in [`src/math/climateModel.js`](src/math/climateModel.js):

- **Zero-Dimensional Energy Balance**:
  $$C_{ocean} \frac{dT}{dt} = \frac{S_0 (1 - \alpha(T))}{4} + \Delta F_{CO_2} - \varepsilon \sigma T^4$$
- **$CO_2$ Radiative Forcing** (Myhre et al. 1998):
  $$\Delta F = 5.35 \ln\left(\frac{C}{C_0}\right) \quad (\text{yields } +3.71\text{ W/m}^2 \text{ for } 2\times CO_2)$$
- **Dynamic Budyko Ice-Albedo Positive Feedback**:
  $$\alpha(T) = \text{clamp}\left(0.18, 0.65, 0.30 - 0.007(T - 15)\right) + \Delta \alpha_{clouds}$$

---

## 🎨 Computer Graphics & WebGL2 Rendering Architecture

This system implements a comprehensive 3D computer graphics curriculum (10/10 Topics):

| # | Topic | Technical Implementation | Math & GLSL Details | Code File Pointer |
|---|---|---|---|---|
| **1** | **Overview of 3D Computer Graphics** | 60 FPS WebGL2 hardware rendering loop with `logarithmicDepthBuffer` preventing z-fighting across a $300,000:1$ frustum. | Frame buffer swap chain, double buffering, hardware depth-sorting. | [`src/components/views/ExplorerView.jsx`](src/components/views/ExplorerView.jsx) |
| **2** | **3D Transformations & Matrices** | $4 \times 4$ Homogeneous matrix transforms: Translation ($T$), Rotation ($R$), Scale ($S$), and composite $M = T \cdot R \cdot S$. | $$M = T(\vec{p}) \cdot R_z \cdot R_y \cdot R_x \cdot S(\vec{s})$$ Demonstrates matrix non-commutativity ($T \cdot R \neq R \cdot T$). | [`src/components/TransformPanel.jsx`](src/components/TransformPanel.jsx) |
| **3** | **Viewing & Projections** | Real-time switching between Perspective ($FOV = 45^\circ$) and Orthographic camera rigs with $360^\circ$ `OrbitControls`. | $$P_{persp} = \begin{bmatrix} \frac{\cot(fov/2)}{aspect} & 0 & 0 & 0 \\ 0 & \cot(fov/2) & 0 & 0 \\ 0 & 0 & \frac{f+n}{n-f} & \frac{2fn}{n-f} \\ 0 & 0 & -1 & 0 \end{bmatrix}$$ | [`src/components/CameraRig.jsx`](src/components/CameraRig.jsx) |
| **4** | **Custom GLSL Shaders** | Multi-texture programmable vertex and fragment shaders (albedo, bump, landmask, nightlights, clouds). | Custom GLSL uniforms: `uTemperature`, `uSunDirection`, `uAtmosphereIntensity`, procedural noise sparkle. | [`src/components/Planet.jsx`](src/components/Planet.jsx#L10-L150) |
| **5** | **Illumination & Atmospheric Scattering** | Directional sunlight with smooth day/night terminator and view-dependent Fresnel limb glow. | $$I_{limb} = I_0 \cdot \left(1.0 - \max(0.0, \vec{v} \cdot \vec{n})\right)^{3.5} \cdot (\vec{n} \cdot \vec{l})$$ | [`src/components/UniversalPlanet.jsx`](src/components/UniversalPlanet.jsx) |
| **6** | **Planetary Ring Systems** | Double-sided geometry with alpha transparency and shadow attenuation for Saturn & Uranus. | Tilted ring plane matching axial tilts (Saturn: $26.73^\circ$, Uranus: $97.77^\circ$). | [`src/components/UniversalPlanet.jsx`](src/components/UniversalPlanet.jsx) |
| **7** | **Astronomical vs Visual Scaling** | Toggleable True Scale mode ($109.3\times$ Sun, $60.3\times$ lunar distance) vs normalized exploration scale. | Preserves camera visibility through smooth lerped frustum expansion. | [`src/components/CameraRig.jsx`](src/components/CameraRig.jsx) |

---

## 🛰️ Real Scientific Data Integrations

Terraforge 2.0 integrates directly with official scientific providers via [`src/services/nasaApi.js`](src/services/nasaApi.js):

- **NASA EONET v3**: Live monitoring of natural disasters (wildfires, severe storms, volcanoes, sea ice) with geographic coordinates and satellite sensor attribution.
- **NASA NeoWs (Near-Earth Object Web Service)**: Asteroid radar feed tracking relative velocities (km/s), miss distances (Lunar Distances & km), and hazardous flags.
- **NASA APOD**: Daily high-resolution astrophysical imagery with verified astronomical metadata.
- **JPL Horizons Ephemerides**: Reference orbital state vectors and physical parameters.
- **Resilience & Provenance**: Client-side `localStorage` caching with automatic TTL, clear fallback datasets for offline usage, and explicit source labels (no mock or fabricated data).

---

## 🚀 Aerospace Mission Control Operations

Track active human space exploration missions in real-time ([`src/components/views/MissionControlView.jsx`](src/components/views/MissionControlView.jsx)):

- **Artemis II** — Crewed lunar free-return trajectory tracking, SLS Block 1 telemetry, and translunar injection checkpoints.
- **Mars 2020 Perseverance** — Jezero Crater astrobiology rover telemetry, Sol count, MOXIE $O_2$ generation, and sample caching status.
- **James Webb Space Telescope (JWST)** — Sun-Earth $L_2$ halo orbit monitoring, sunshield cryogenic temperatures ($37\text{ K}$), and instrument status.
- **Voyager 1** — The most distant human-made artifact ($163+\text{ AU}$ from Earth in interstellar space), tracking RTG power and round-trip light travel delays ($>45\text{ hours}$).

---

## 🤖 Gemini AI Scientific Assistant

Located in [`src/components/views/AIAssistantView.jsx`](src/components/views/AIAssistantView.jsx):
- Understands natural-language queries regarding planetary physics and mission parameters.
- Connects directly to Terraforge's deterministic mathematical engines (Vis-Viva, Collins cratering, Myhre climate).
- Never hallucinates figures: calculates exact numbers using verified physics functions.
- Supports user-provided Google Gemini API keys stored safely in browser local storage.

---

## 💻 Tech Stack & Architecture

- **Frontend**:
  - React 18, Vite 5, TypeScript-ready ESM architecture.
  - Three.js (r162), `@react-three/fiber`, `@react-three/drei`.
  - Custom GLSL Shaders (OpenGL Shading Language).
  - Zustand for unified reactive state management.
  - Tailwind CSS for Swiss aerospace UI design tokens.
  - Lucide React iconography.
- **Backend**:
  - Python 3.10+, FastAPI, Pydantic v2.
  - Uvicorn ASGI server.
  - RESTful endpoints for `/api/sim/climate`, `/api/sim/impact`, `/api/sim/orbit`, and `/api/health`.
  - Docker containerization ready.
- **Testing**:
  - Node.js native test runner (`node --test`).
  - 16 unit tests covering all mathematical formulas.

---

## ⚡ Installation & Local Setup

### 1. Clone Repository & Checkout v2 Branch
```bash
git clone https://github.com/SIDDHARTHXMEUR/Terraforge.git
cd Terraforge
git checkout terraforge-v2
```

### 2. Frontend Setup (React + Three.js + Vite)
```bash
# Install dependencies
npm install

# Run automated mathematical test suite (16/16 tests)
npm test

# Launch Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

### 4. Optional Python FastAPI Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🔒 Version 1 Rollback Guarantee

Your original baseline project has been preserved and pushed to GitHub:
- **Tags**: `v1`, `v1.0`
- **Branch**: `version-1`
- **Commit**: `09004ee`

To rollback at any time:
```bash
git checkout version-1
```
Or simply request in chat: *"Rollback to version 1"*.

---

## 📄 License & Attribution

Developed by **Siddharth** for academic research and portfolio demonstration.  
Observational planetary and orbital data courtesy of **NASA Open Data**, **NASA EONET**, and **NASA JPL Horizons**.
