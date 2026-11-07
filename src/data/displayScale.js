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
 * | Body       | True Radius (km) | True Orbit (AU) | Display Radius (units) | Display Orbit (units) | Apparent Diameter at Overview (px @ 1080p) |
 * | :--------- | :--------------- | :-------------- | :--------------------- | :-------------------- | :----------------------------------------- |
 * | **Sun**    | 696,340          | 0.000           | 54.00                  | 0.0                   | ~480 px (Dominating Star)                  |
 * | **Mercury**| 2,439.7          | 0.387           | 2.40                   | 82.0                  | ~26 px (Clear Disc)                        |
 * | **Venus**  | 6,051.8          | 0.723           | 3.30                   | 116.0                 | ~34 px (Clear Disc)                        |
 * | **Earth**  | 6,371.0          | 1.000           | 3.50                   | 156.0                 | ~36 px (Clear Disc)                        |
 * | **Moon**   | 1,737.4          | 0.00257 (Earth) | 0.95                   | 8.5 (from Earth)      | ~10 px (Visibly Small Satellite)           |
 * | **Mars**   | 3,389.5          | 1.524           | 2.70                   | 202.0                 | ~28 px (Clear Disc)                        |
 * | **Ceres**  | 473.0            | 2.767           | 0.65                   | 246.0                 | ~7 px (Small Asteroid)                     |
 * | **Jupiter**| 69,911.0         | 5.204           | 13.50                  | 306.0                 | ~130 px (Massive Gas Giant)                |
 * | **Saturn** | 58,232.0         | 9.582           | 11.50 (Rings: 26.5)    | 394.0                 | ~115 px (Rings: ~255 px)                   |
 * | **Uranus** | 25,362.0         | 19.20           | 6.60                   | 484.0                 | ~64 px (Ice Giant)                         |
 * | **Neptune**| 24,622.0         | 30.05           | 6.30                   | 572.0                 | ~60 px (Ice Giant)                         |
 */

export const DISPLAY_RADII = {
  sun: 54.0,
  mercury: 2.4,
  venus: 3.3,
  earth: 3.5,
  moon: 0.95,
  mars: 2.7,
  ceres: 0.65,
  jupiter: 13.5,
  saturn: 11.5,
  saturnRingsInner: 14.8,
  saturnRingsOuter: 26.8,
  uranus: 6.6,
  uranusRingsInner: 8.5,
  uranusRingsOuter: 13.2,
  neptune: 6.3
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
  neptune: 572
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
  neptune: 0.05
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
    distance: 7.2,
    terminatorAngle: -28,
    elevAngle: 16,
    minDist: 3.2,
    maxDist: 180
  },
  venus: {
    distance: 9.5,
    terminatorAngle: -30,
    elevAngle: 16,
    minDist: 4.2,
    maxDist: 220
  },
  earth: {
    distance: 10.2,
    terminatorAngle: -28,
    elevAngle: 18,
    minDist: 4.5,
    maxDist: 240
  },
  mars: {
    distance: 7.8,
    terminatorAngle: -30,
    elevAngle: 16,
    minDist: 3.5,
    maxDist: 200
  },
  asteroids: {
    distance: 6.5,
    terminatorAngle: -35,
    elevAngle: 20,
    minDist: 2.2,
    maxDist: 120
  },
  jupiter: {
    distance: 36.0,
    terminatorAngle: -26,
    elevAngle: 18,
    minDist: 16.0,
    maxDist: 650
  },
  saturn: {
    distance: 38.0,
    terminatorAngle: -32,
    elevAngle: 22,
    minDist: 18.0,
    maxDist: 750
  },
  uranus: {
    distance: 19.5,
    terminatorAngle: -26,
    elevAngle: 20,
    minDist: 8.5,
    maxDist: 450
  },
  neptune: {
    distance: 18.5,
    terminatorAngle: -26,
    elevAngle: 18,
    minDist: 8.2,
    maxDist: 450
  }
};
