# 🪐 TERRAFORGE — Cinematic 3D Solar System Experience

> **A Photorealistic, Cinematic 3D Astronomical Solar System Platform**  
> Engineered with Three.js, WebGL2 hardware shaders, filmic tone mapping, and NASA planetary observations.  
> **🚀 Live Experience**: [http://localhost:3000/](http://localhost:3000/)

[![Three.js](https://img.shields.io/badge/Three.js-r162-black.svg?logo=three.js)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-Hardware--Accelerated-green.svg?logo=webgl)](https://www.khronos.org/webgl/)
[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![Unit Tests](https://img.shields.io/badge/Tests-16%2F16%20Passed-brightgreen.svg?logo=node.js)](package.json)

---

## 🌟 Visual Core & Cinematic Architecture

Terraforge is a cinematic, photorealistic 3D astronomical simulation designed to capture the visual grandeur of our Solar System. 

```
                                  [ THE SUN ]
                  • Convective Plasma Granulation (GLSL Simplex Noise)
                  • Eddington Solar Limb Darkening Law
                  • Multi-Layered Coronal Glow & Atmospheric Scattering
                  • Omnidirectional PointLight (Intensity: 5.0)
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
    [ MERCURY ]    [ VENUS ]       [ EARTH ]        [ MARS ]   [ ASTEROID BELT ]
    • Cratered     • Sulfuric      • Multi-Texture  • Oxidized • 1,200 Rocky
      Regolith       Clouds          GLSL Shader      Iron       Boulders
    • High         • Dense Amber   • Ocean Glint      Oxide    • Irregular
      Contrast       Atmosphere    • City Lights    • Polar      Geometry
                                   • Cloud Sphere     Caps     • InstancedMesh
                                   • Tidal Moon
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
   [ JUPITER ]                    [ SATURN ]                     [ URANUS & NEPTUNE ]
   • Zonal Bands                  • Multi-Division Cassini Rings  • Methane Ice Giants
   • Great Red Spot                 (A, B, C Rings with Alpha)   • Uranus 97.8° Sideways Tilt
   • Atmospheric Depth            • Realistic Ring Transparency  • Deep Azure Windswept Storms
```

---

## 🪐 The Celestial Bodies

1. **The Sun (Centerpiece)**:
   - Large apparent scale ($R = 12.0$) at the origin $[0, 0, 0]$.
   - Procedural cellular simplex noise simulating convective boiling plasma granules.
   - Realistic solar limb darkening according to Eddington's radiation law ($I(\mu) = I_0(1 - u(1 - \cos\theta))$).
   - Multi-layered coronal glow spheres with additive blending.
   - High-intensity omnidirectional solar point light illuminating all planetary bodies with deep space shadows.

2. **Earth & The Moon (Version 1 Preserved & Enhanced)**:
   - Full multi-texture programmable GLSL shader combining Albedo, Bump map, Landmask, and Night lights.
   - Dynamic day/night terminator with emissive city lights on the nocturnal hemisphere.
   - Specular ocean reflection with dynamic Fresnel falloff.
   - Climate-driven temperature color ramps (cryo-ice $-60^\circ\text{C}$ with procedural sparkling crystals to scorched desert $+60^\circ\text{C}$).
   - Independent rotating cloud sphere layer (`earth_clouds.png`).
   - Orbiting Moon with NASA albedo and bump mapping, maintaining an exact $27.32:1$ kinematic tidal lock.

3. **Saturn**:
   - High-resolution atmospheric cloud deck (`saturn.jpg`).
   - Detailed Cassini-division ring system (`RingGeometry` with radial UV mapping and `saturn_ring.png` alpha transparency).
   - Tilted to Saturn's real $26.73^\circ$ axial inclination.

4. **Jupiter**:
   - High-resolution banded gas giant atmosphere (`jupiter.jpg`) with Great Red Spot anticyclonic storm and atmospheric limb scattering.

5. **Mars**:
   - High-resolution iron oxide surface (`mars.jpg`), polar ice caps, Valles Marineris topography, and thin dusty amber atmosphere.

6. **Venus**:
   - Opaque sulfuric acid cloud deck (`venus.jpg`) with smooth amber atmospheric limb glow and retrograde rotation.

7. **Mercury**:
   - Cratered rocky regolith (`mercury.jpg`) with sharp terminator shadow contrast.

8. **Uranus & Neptune**:
   - Pale cyan methane ice giant with extreme $97.8^\circ$ sideways tilt and rings.
   - Deep azure windswept atmosphere (`neptune.jpg`) with high-altitude storm structures.

9. **Main Asteroid Belt (Between Mars & Jupiter)**:
   - 1,200 unique rocky asteroids distributed in a toroidal belt between $R = 61$ and $R = 68$.
   - Irregular 3D polyhedron geometries with vertex displacement, random tumble axes, and Keplerian orbital speeds.
   - Hardware-accelerated using Three.js `InstancedMesh` (1 draw call for 60 FPS performance).

---

## 🎥 Cinematic Camera System

- **Clean Viewport**: Thin circular orbit outlines and cyan rings are **disabled by default**, presenting deep space with unblemished cinematic realism.
- **Solar System Establishing Shot**: Elevated panoramic view at $[0, 95, 145]$ framing the glowing Sun and revolving planets.
- **Planetary Flythrough**: Smooth cubic ease-out camera dolly directly into any planet's orbit, automatically framing the planet to fill 35–50% of the viewport.
- **Saturn Ring Experience**: Automatically angles the camera to $32^\circ$ elevation so Saturn's rings and divisions are showcased in dramatic perspective.
- **Cinematic Tour**: Click **"CINEMATIC TOUR"** to let the camera automatically glide from body to body on a continuous documentary-style space tour!
- **Interactive OrbitControls**: Free 360° rotation and zoom around any focused planet with inertia damping.

---

## ⌨️ Controls & Shortcuts

| Key / Control | Action |
|---|---|
| <kbd>Space</kbd> | Pause / Resume orbital revolution and planetary spin |
| <kbd>0</kbd> | Return to Solar System Overview |
| <kbd>1</kbd> - <kbd>9</kbd> | Quick fly-to: Sun (1), Mercury (2), Venus (3), Earth (4), Mars (5), Jupiter (6), Saturn (7), Uranus (8), Neptune (9) |
| <kbd>O</kbd> | Toggle Keplerian orbit paths on/off (off by default) |
| <kbd>H</kbd> | Hide/Show all UI overlays for pure cinema mode |
| <kbd>R</kbd> | Reset camera framing |
| **Mouse Drag** | Rotate 360° around focused celestial body |
| **Mouse Wheel** | Zoom in / out |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run automated mathematical test suite (16/16 tests)
npm test

# Start local development server
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## 🛰️ Credits & Planetary Telemetry Sources

- **Sun**: NASA / SDO AIA 304 Å Telemetry ([https://sdo.gsfc.nasa.gov/](https://sdo.gsfc.nasa.gov/))
- **Earth**: NASA Earth Observatory / ISS Expedition Crew ([https://earthobservatory.nasa.gov/](https://earthobservatory.nasa.gov/))
- **Mars**: NASA / JPL-Caltech / MSSS / Mars Global Surveyor ([https://mars.nasa.gov/](https://mars.nasa.gov/))
- **Jupiter**: NASA / JPL-Caltech / SwRI / MSSS / JunoCam ([https://www.missionjuno.swri.edu/](https://www.missionjuno.swri.edu/))
- **Saturn**: NASA / JPL-Caltech / Space Science Institute / Cassini-Huygens ([https://solarsystem.nasa.gov/missions/cassini/](https://solarsystem.nasa.gov/missions/cassini/))

*Note: Imagery and scientific data courtesy of NASA / JPL-Caltech / USGS. Not affiliated with or endorsed by NASA.*

