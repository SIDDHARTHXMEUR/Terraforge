# 🪐 Terraforge — Cinematic Astronomical Simulator

Terraforge is a real-time, interactive 3D Solar System simulator engineered with Three.js, React, and WebGL2. Grounded in NASA astronomical observations, it combines scientific Keplerian simulation with cinematic presentation.

![Terraforge Overview](https://img.shields.io/badge/Terraforge-Solar%20System%20Simulator-cyan)
![WebGL2](https://img.shields.io/badge/WebGL2-Hardware--Accelerated-emerald)
![Three.js](https://img.shields.io/badge/Three.js-r167-black)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)

---

## 🌟 Core Features

- **Live 3D Directed Prologue (~12s)**:
  - Beat 1 (0–3s): Saturn’s sunlit crescent, backlit ring system, and shadow cast across the globe.
  - Beat 2 (3–6s): Asteroid belt drift and Jupiter crossing with Great Red Spot visible.
  - Beat 3 (6–10.5s): SDO Sun dawn rising massive (50–60% frame height), convective plasma boiling, limb prominences, and smooth coronal falloff with zero hard rims or boxes.
  - Beat 4 (10.5–12s): Deceleration into Solar System master overview, title reveal, and anamorphic letterbox opening.
  - Instant skip via `Esc` key or on-screen "Skip Prologue" button.

- **SDO AIA 304 Å Thermonuclear Sun**:
  - Live convective plasma boiling via multi-scale domain-warped procedural noise.
  - Searing active regions with optical cross-diffraction flare.
  - True 3D BackSide ray-traced spherical chromosphere with limb prominences protruding into deep space.

- **Planetary Bodies & Moons**:
  - **Terrestrial Worlds**: Mercury (cratered terminator), Venus (opaque golden cloud deck), Earth (multi-layer albedo, landmask, night lights, clouds, atmosphere), Mars (iron oxide, polar caps).
  - **Earth's Moon**: Cratered lunar texture with 27.3-day synchronous tidal locking.
  - **Gas & Ice Giants**: Jupiter with Great Red Spot, Saturn with oblate globe and double-sided anisotropic Cassini Division rings, Uranus (97.8° tilt), Neptune (supersonic methane wind banding).
  - **Major Moons**: Galilean moons (Io, Europa, Ganymede, Callisto) orbiting Jupiter; Titan orbiting Saturn.
  - **Pluto & Dwarf Planets**: Inclined 17.16° eccentric orbit in the Kuiper Belt; Asteroid Belt with 950 procedural tumbling asteroids.

- **Display Scale & Scientific Accuracy**:
  - `src/data/displayScale.js` provides single source of truth separating display presentation from scientific Keplerian orbits, periods, and tilts.
  - Preserved size hierarchy: Sun (54) > Jupiter (18) > Saturn (15) > Uranus (9.2) > Neptune (8.8) > Earth (5.8) > Venus (5.4) > Mars (4.8) = Mercury (4.8) > Pluto (2.2) > Moon (1.5).

- **View Modes**:
  - **Cinematic**: Orbiting camera with sunlit terminator framing and smooth transitions.
  - **Scientific**: True top-down Keplerian orbital planes.
  - **Scale Lineup**: Linear side-by-side arrangement of all bodies on a flat surface with comparative scale bar to visualize true scale differences.

- **Astrophotography Photo Mode (`P` key)**:
  - Clean screen with rule-of-thirds composition grid.
  - Live FOV (15°–90°) and exposure sliders.
  - One-click high-resolution photo download.

- **Earth Street View (MapLibre + Mapillary)**:
  - OpenFreeMap OSM vector tiles with 3D extruded buildings and satellite imagery toggle.
  - Interactive Mapillary street coverage layer with token authentication.
  - 360-degree street-level viewer with smooth return to orbit.
  - Fallback notification with quick-jump exploration links (Tokyo, NYC, London).

---

## 🎮 Interactive Controls & Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause Simulation |
| `1` – `9` | Select celestial bodies in order (Sol, Mercury, Venus, Earth, Mars, Asteroids, Jupiter, Saturn, Uranus, Neptune) |
| `Esc` | Return to Master Overview / Skip Prologue / Close Active Modal |
| `[` / `]` | Time warp speed down / up (1X, 5X, 25X, 100X, 500X) |
| `H` | Toggle Cinematic Clean UI mode (Hide / Show) |
| `F` | Toggle Fullscreen view |
| `P` | Toggle Astrophotography Photo Mode |
| `O` | Toggle Keplerian orbital ribbon paths |
| `L` | Toggle celestial name labels |
| `?` | Open Keyboard Shortcuts cheat sheet |
| **Mouse / Touch** | Single finger / Left click drag to rotate; Two fingers pinch / Scroll wheel to zoom |

---

## 📡 Deep Links

You can link directly to specific simulation states via URL query parameters:
- `?body=mars` — Opens directly focusing Mars.
- `?view=lineup` — Opens directly in Scale Lineup mode.
- `?view=scientific` — Opens directly in top-down Scientific mode.
- `?time=paused` or `?time=25` — Sets initial playback state or time multiplier.
- `?street=1` — Opens Earth MapLibre / Mapillary Street View.
- `?safe=1` — Launches Safe Mode (minimal 3D scene with tile engine disabled).

---

## 🚀 Setup & Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Simulator

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and provide your Mapillary API token:
```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_MAPILLARY_TOKEN="your_mapillary_token_here"
```

### Run Locally
```bash
# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📜 Credits & Citations

- **NASA Solar Dynamics Observatory (SDO)**: AIA 304 Å and HMI observations providing ground truth for solar chromosphere, convection, active regions, and limb prominences.
- **NASA JPL Solar System Dynamics**: Planetary physical characteristics, orbital periods, semi-major axes, eccentricities, and axial tilts.
- **OpenFreeMap & OpenStreetMap**: Free vector tiles and base map data.
- **Mapillary**: Community-sourced street-level 360-degree imagery.
- **Esri**: World Imagery high-resolution satellite tiles.
