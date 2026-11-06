# TERRAFORGE 2.0 — Deep Technical Architecture Documentation

## 1. System Architecture Overview

```
TERRAFORGE 2.0 CLIENT-SERVER ARCHITECTURE
========================================================================================

           [ CLIENT (React 18 + Three.js + Zustand + Tailwind) ]
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
[ 3D WebGL Rendering Engine ]                     [ Aerospace UI & Analytics ]
• Canvas (WebGL2 Hardware Loop)                   • Top Navigation Bar (8 Views)
• Custom GLSL Programmable Shaders                • Planetary Selector & Inspector HUD
• Universal Celestial Bodies (9 bodies)           • Simulation Lab Interactive Controls
• Kinematic Moon Orbit (27.3:1)                   • EONET Disaster Feed & NeoWs Radar
• Keplerian Orbits Visualizer                     • Mission Control Telemetry Inspector
• View Modes (Cinematic/Sci/Edu/Mission)          • Gemini AI Scientific Assistant
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    │
                         [ Data & Computation ]
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
[ Pure Math Engines ]      [ NASA Data Services ]      [ Backend (Optional) ]
• orbitalMechanics.js      • NASA EONET v3             • Python 3.10+ FastAPI
• asteroidImpact.js        • NASA NeoWs Asteroids      • Pydantic v2 Models
• climateModel.js          • NASA APOD                 • Uvicorn ASGI Server
• (16/16 Unit Tested)      • LocalStorage Cache Layer  • REST endpoints
```

---

## 2. Computer Graphics & WebGL Pipeline

### 2.1 WebGL2 Context & Frustum Depth Management
In interplanetary 3D simulations, distance scales range from celestial radii (~$1.7 \times 10^3 \text{ km}$) to astronomical unit distances (~$1.5 \times 10^8 \text{ km}$). Standard 16-bit or 24-bit depth buffers suffer from severe z-fighting (polygon flickering) at these extreme frustum ratios ($300,000:1$).
Terraforge 2.0 mitigates this by enforcing hardware `logarithmicDepthBuffer: true`:
$$z_{log} = \frac{\log(C \cdot w + 1)}{\log(C \cdot f + 1)} \cdot w$$
This dynamically redistributes depth precision exponentially toward the camera near plane while maintaining depth separation across millions of units in the distance.

### 2.2 $4 \times 4$ Affine Homogeneous Transformations
All planetary and camera positions are governed by $4 \times 4$ homogeneous matrix transformations:
$$M = T(\vec{p}) \cdot R_z(\theta_z) \cdot R_y(\theta_y) \cdot R_x(\theta_x) \cdot S(\vec{s})$$

Matrix components:
$$T(\vec{p}) = \begin{bmatrix} 1 & 0 & 0 & p_x \\ 0 & 1 & 0 & p_y \\ 0 & 0 & 1 & p_z \\ 0 & 0 & 0 & 1 \end{bmatrix}, \quad
S(\vec{s}) = \begin{bmatrix} s_x & 0 & 0 & 0 \\ 0 & s_y & 0 & 0 \\ 0 & 0 & s_z & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

Rotation around the planetary axial tilt is applied before orbital translation, preserving physically accurate seasonal and rotational kinematics.

### 2.3 Custom GLSL Multi-Texture Shader Pipeline
Earth is rendered via a custom GLSL `ShaderMaterial` combining 5 photographic texture channels:
1. `uAlbedo`: Surface land and ocean diffuse reflection
2. `uBumpMap`: Topographic elevation and mountain ridges
3. `uLandmask`: Ocean vs. continental shelf binary mask
4. `uNightLights`: High-resolution nocturnal anthropic emission map
5. `uClouds`: Dynamic atmospheric vapor layer

The fragment shader dynamically blends surface color ramps based on the `uTemperature` uniform:
- At $\le -50^\circ\text{C}$: Glacial snow shelves and frozen ocean crevasse textures expand toward the equator with procedural sparkling crystals.
- At $+15^\circ\text{C}$: Temperate blue oceans and green continental biomes.
- At $\ge +45^\circ\text{C}$: Terracotta desert dunes and evaporated basaltic ocean basins with volcanic nocturnal emissions.

---

## 3. Scientific Computing Engines

### 3.1 Two-Body Keplerian Astrodynamics (`src/math/orbitalMechanics.js`)
- **Standard Gravitational Parameter**:
  $$\mu = G \times M_{central}$$
- **Vis-Viva Equation**:
  $$v(r) = \sqrt{\mu \left( \frac{2}{r} - \frac{1}{a} \right)}$$
- **Kepler's Third Law**:
  $$T = 2\pi \sqrt{\frac{a^3}{\mu}}$$
- **Eccentric Radius**:
  $$r(\nu) = \frac{a(1 - e^2)}{1 + e \cos(\nu)}$$

### 3.2 Asteroid Impact Physics (`src/math/asteroidImpact.js`)
Calculated via Collins, Melosh & Marcus (2005) dimensionless $\pi$-group scaling:
- Kinetic energy:
  $$E_k = \frac{1}{2} M v^2$$
- Transient crater diameter:
  $$D_{tc} = 1.161 \left(\frac{\rho_i}{\rho_t}\right)^{1/3} L^{0.78} v^{0.44} g^{-0.22} \sin^{1/3}(\theta)$$
- Transition from simple bowl craters to complex central-peak structures at $D_c \approx 3.2\text{ km}$ on Earth.

### 3.3 Energy Balance Climate Model (`src/math/climateModel.js`)
- Zero-dimensional global thermodynamic balance:
  $$C_{ocean} \frac{dT}{dt} = \frac{S_0 (1 - \alpha(T))}{4} + \Delta F_{CO_2} - \varepsilon \sigma T^4$$
- $CO_2$ radiative forcing (Myhre et al. 1998):
  $$\Delta F = 5.35 \ln\left(\frac{C}{C_0}\right)$$

---

## 4. Testing & Verification

Automated test execution via Node.js native test runner:
```bash
npm test
```
- **16/16 Unit Tests Passed** (0 failures).
- Covers all astrodynamic velocities, crater scaling bounds, and thermodynamic albedo feedbacks.
