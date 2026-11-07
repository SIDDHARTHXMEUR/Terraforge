// =============================================================================
// TERRAFORGE: DISPLAY SCALE & PRESENTATION ARCHITECTURE
// Calibrated presentation scaling separate from scientific orbital mechanics.
//
// DESIGN PRINCIPLES:
// 1. Size Ranking Strictly Preserved:
//    Sun > Jupiter > Saturn > Uranus > Neptune > Earth > Venus > Mars > Mercury > Moon > Ceres
// 2. Sun Dominance: Display radius (54.0) is at least ~4x Jupiter's diameter (13.5).
// 3. Gas Giant Scale: Jupiter (13.5) and Saturn (11.5) clearly dwarf terrestrial planets (~3.8x Earth).
// 4. Terrestrial Disc Clarity: Every terrestrial planet resolves as a clear visible disc (>= 25 px in 1080p overview).
// 5. Orbital Spacing: Distances compressed via power-law scaling so no planet overlaps the Sun's surface
//    or neighbor orbits, while keeping the entire system filling the frame majestically.
// 6. Scientific Separation: Scientific data (radii in km, distances in AU, periods, tilts) remains untouched.
// =============================================================================

/**
 * ASTRONOMICAL GROUND TRUTH VS. PRESENTATION DISPLAY VALUES
 *
 * | Body       | True Radius (km) | True Orbit (AU) | Display Radius (units) | Display Orbit (units) | Display/True Scale Ratio | Overview Apparent Diam (@ 1080p) |
 * | :--------- | :--------------- | :-------------- | :--------------------- | :-------------------- | :----------------------- | :-------------------------------- |
 * | **Sun**    | 696,340          | 0.000           | 54.00                  | 0.0                   | 7.75e-5                  | ~368 px (Dominating Star >= 120px)|
 * | **Mercury**| 2,439.7          | 0.387           | 4.80                   | 82.0                  | 1.97e-3                  | ~33 px (Clear Disc >= 25px)       |
 * | **Venus**  | 6,051.8          | 0.723           | 5.40                   | 116.0                 | 8.92e-4                  | ~37 px (Clear Disc >= 25px)       |
 * | **Earth**  | 6,371.0          | 1.000           | 5.80                   | 156.0                 | 9.10e-4                  | ~40 px (Clear Disc >= 25px)       |
 * | **Moon**   | 1,737.4          | 0.00257 (Earth) | 1.50                   | 8.5 (from Earth)      | 8.63e-4                  | ~10 px (Satellite)                |
 * | **Mars**   | 3,389.5          | 1.524           | 4.80                   | 202.0                 | 1.42e-3                  | ~33 px (Clear Disc >= 25px)       |
 * | **Ceres**  | 473.0            | 2.767           | 1.10                   | 246.0                 | 2.33e-3                  | ~8 px (Asteroid Belt)             |
 * | **Jupiter**| 69,911.0         | 5.204           | 18.00                  | 306.0                 | 2.57e-4                  | ~123 px (Gas Giant >= 60px)       |
 * | **Saturn** | 58,232.0         | 9.582           | 15.00 (Rings: 35.0)    | 394.0                 | 2.58e-4                  | ~102 px (Rings: ~240 px >= 60px)  |
 * | **Uranus** | 25,362.0         | 19.20           | 9.20                   | 484.0                 | 3.63e-4                  | ~63 px (Ice Giant >= 60px)        |
 * | **Neptune**| 24,622.0         | 30.05           | 8.80                   | 572.0                 | 3.57e-4                  | ~60 px (Ice Giant >= 60px)        |
 */

export const DISPLAY_RADII = {
  sun: 54.0,
  mercury: 4.8,
  venus: 5.4,
  earth: 5.8,
  moon: 1.5,
  mars: 4.8,
  ceres: 1.1,
  jupiter: 18.0,
  saturn: 15.0,
  saturnRingsInner: 19.5,
  saturnRingsOuter: 35.0,
  uranus: 9.2,
  uranusRingsInner: 12.0,
  uranusRingsOuter: 18.5,
  neptune: 8.8,
  pluto: 2.2
};

export const DISPLAY_ORBIT_RADII = {
  sun: 0,
  mercury: 82,
  venus: 116,
  earth: 156,
  mars: 202,
  asteroidsInner: 232,
  asteroidsOuter: 260,
  ceres: 246,
  jupiter: 306,
  saturn: 394,
  uranus: 484,
  neptune: 572,
  pluto: 648
};

export const ORBIT_SPEEDS = {
  mercury: 4.15,
  venus: 1.62,
  earth: 1.00,
  mars: 0.53,
  asteroids: 0.35,
  jupiter: 0.22,
  saturn: 0.14,
  uranus: 0.08,
  neptune: 0.05,
  pluto: 0.035
};

// Camera framing limits tailored to display radii
export const DISPLAY_CAMERA_LIMITS = {
  overview: {
    cinematicOffset: [-320, 110, 310],
    cinematicTarget: [-65, 0, 48],
    scientificOffset: [0, 850, 0.01],
    scientificTarget: [0, 0, 0],
    minDist: 50,
    maxDist: 3200
  },
  sun: {
    distance: 125,
    minDist: 60,
    maxDist: 1200
  },
  mercury: {
    distance: 10.8,
    terminatorAngle: -28,
    elevAngle: 16,
    minDist: 4.8,
    maxDist: 220
  },
  venus: {
    distance: 14.5,
    terminatorAngle: -30,
    elevAngle: 16,
    minDist: 6.2,
    maxDist: 260
  },
  earth: {
    distance: 15.6,
    terminatorAngle: -28,
    elevAngle: 18,
    minDist: 5.2002,
    maxDist: 280
  },
  mars: {
    distance: 12.0,
    terminatorAngle: -30,
    elevAngle: 16,
    minDist: 5.2,
    maxDist: 240
  },
  asteroids: {
    distance: 8.5,
    terminatorAngle: -35,
    elevAngle: 20,
    minDist: 2.8,
    maxDist: 150
  },
  jupiter: {
    distance: 46.0,
    terminatorAngle: -26,
    elevAngle: 18,
    minDist: 21.0,
    maxDist: 750
  },
  saturn: {
    distance: 48.0,
    terminatorAngle: -32,
    elevAngle: 22,
    minDist: 22.0,
    maxDist: 850
  },
  uranus: {
    distance: 25.5,
    terminatorAngle: -26,
    elevAngle: 20,
    minDist: 11.5,
    maxDist: 500
  },
  neptune: {
    distance: 24.5,
    terminatorAngle: -26,
    elevAngle: 18,
    minDist: 11.0,
    maxDist: 500
  },
  pluto: {
    distance: 9.2,
    terminatorAngle: -28,
    elevAngle: 18,
    minDist: 3.5,
    maxDist: 180
  },
  lineup: {
    cinematicOffset: [20, 22, 220],
    cinematicTarget: [20, 0, 0],
    minDist: 30,
    maxDist: 900
  }
};

