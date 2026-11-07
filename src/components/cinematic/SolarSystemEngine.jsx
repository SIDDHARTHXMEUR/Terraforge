import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CinematicSun } from './CinematicSun';
import { CinematicMercury } from './CinematicMercury';
import { CinematicVenus } from './CinematicVenus';
import { CinematicEarth } from './CinematicEarth';
import { CinematicMars } from './CinematicMars';
import { CinematicJupiter } from './CinematicJupiter';
import { CinematicSaturn } from './CinematicSaturn';
import { CinematicUranus } from './CinematicUranus';
import { CinematicNeptune } from './CinematicNeptune';
import { AsteroidBelt } from './AsteroidBelt';
import { DeepSpaceSkybox } from './DeepSpaceSkybox';
import { InteractiveSolarCamera } from './InteractiveSolarCamera';
import { OrbitGuides } from './OrbitGuides';
import { CelestialLabels } from './CelestialLabels';

// Calibrated Astronomical Scale & Relative Speeds
const ORBIT_RADII = {
  mercury: 24,
  venus: 36,
  earth: 50,
  mars: 66,
  asteroidsInner: 78,
  asteroidsOuter: 94,
  jupiter: 122,
  saturn: 165,
  uranus: 208,
  neptune: 250
};

const ORBIT_SPEEDS = {
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

export function SolarSystemEngine({
  selectedBody = 'overview',
  timeMultiplier = 1.0,
  isPaused = false,
  showOrbits = true,
  showLabels = true,
  onSelectBody,
  isUserInteracting = false
}) {
  // Real-time planetary orbital angles
  const anglesRef = useRef({
    mercury: 0.4,
    venus: 1.8,
    earth: 3.2,
    mars: 4.6,
    asteroids: 1.2,
    jupiter: 0.9,
    saturn: 2.5,
    uranus: 5.1,
    neptune: 3.8
  });

  // Current real-time world positions of planets
  const [positions, setPositions] = useState(() => ({
    sun: [0, 0, 0],
    overview: [0, 0, 0],
    mercury: [Math.cos(0.4) * ORBIT_RADII.mercury, 0, Math.sin(0.4) * ORBIT_RADII.mercury],
    venus: [Math.cos(1.8) * ORBIT_RADII.venus, 0, Math.sin(1.8) * ORBIT_RADII.venus],
    earth: [Math.cos(3.2) * ORBIT_RADII.earth, 0, Math.sin(3.2) * ORBIT_RADII.earth],
    mars: [Math.cos(4.6) * ORBIT_RADII.mars, 0, Math.sin(4.6) * ORBIT_RADII.mars],
    asteroids: [Math.cos(1.2) * 86, 0, Math.sin(1.2) * 86],
    jupiter: [Math.cos(0.9) * ORBIT_RADII.jupiter, 0, Math.sin(0.9) * ORBIT_RADII.jupiter],
    saturn: [Math.cos(2.5) * ORBIT_RADII.saturn, 0, Math.sin(2.5) * ORBIT_RADII.saturn],
    uranus: [Math.cos(5.1) * ORBIT_RADII.uranus, 0, Math.sin(5.1) * ORBIT_RADII.uranus],
    neptune: [Math.cos(3.8) * ORBIT_RADII.neptune, 0, Math.sin(3.8) * ORBIT_RADII.neptune]
  }));

  // Orbital revolution frame loop
  useFrame((_, delta) => {
    if (isPaused) return;

    // Base orbital speed scaled by user-selected time multiplier
    const advance = delta * 0.12 * timeMultiplier;

    anglesRef.current.mercury += advance * ORBIT_SPEEDS.mercury;
    anglesRef.current.venus += advance * ORBIT_SPEEDS.venus;
    anglesRef.current.earth += advance * ORBIT_SPEEDS.earth;
    anglesRef.current.mars += advance * ORBIT_SPEEDS.mars;
    anglesRef.current.asteroids += advance * ORBIT_SPEEDS.asteroids;
    anglesRef.current.jupiter += advance * ORBIT_SPEEDS.jupiter;
    anglesRef.current.saturn += advance * ORBIT_SPEEDS.saturn;
    anglesRef.current.uranus += advance * ORBIT_SPEEDS.uranus;
    anglesRef.current.neptune += advance * ORBIT_SPEEDS.neptune;

    const ceresR = (ORBIT_RADII.asteroidsInner + ORBIT_RADII.asteroidsOuter) * 0.5;

    setPositions({
      sun: [0, 0, 0],
      overview: [0, 0, 0],
      mercury: [
        Math.cos(anglesRef.current.mercury) * ORBIT_RADII.mercury,
        0,
        Math.sin(anglesRef.current.mercury) * ORBIT_RADII.mercury
      ],
      venus: [
        Math.cos(anglesRef.current.venus) * ORBIT_RADII.venus,
        0,
        Math.sin(anglesRef.current.venus) * ORBIT_RADII.venus
      ],
      earth: [
        Math.cos(anglesRef.current.earth) * ORBIT_RADII.earth,
        0,
        Math.sin(anglesRef.current.earth) * ORBIT_RADII.earth
      ],
      mars: [
        Math.cos(anglesRef.current.mars) * ORBIT_RADII.mars,
        0,
        Math.sin(anglesRef.current.mars) * ORBIT_RADII.mars
      ],
      asteroids: [
        Math.cos(anglesRef.current.asteroids) * ceresR,
        0.4,
        Math.sin(anglesRef.current.asteroids) * ceresR
      ],
      jupiter: [
        Math.cos(anglesRef.current.jupiter) * ORBIT_RADII.jupiter,
        0,
        Math.sin(anglesRef.current.jupiter) * ORBIT_RADII.jupiter
      ],
      saturn: [
        Math.cos(anglesRef.current.saturn) * ORBIT_RADII.saturn,
        0,
        Math.sin(anglesRef.current.saturn) * ORBIT_RADII.saturn
      ],
      uranus: [
        Math.cos(anglesRef.current.uranus) * ORBIT_RADII.uranus,
        0,
        Math.sin(anglesRef.current.uranus) * ORBIT_RADII.uranus
      ],
      neptune: [
        Math.cos(anglesRef.current.neptune) * ORBIT_RADII.neptune,
        0,
        Math.sin(anglesRef.current.neptune) * ORBIT_RADII.neptune
      ]
    });
  });

  return (
    <>
      {/* 1. Deep Space Starfield & Cosmic Void Background */}
      <DeepSpaceSkybox />

      {/* 2. Interactive Orbit & Follow Camera */}
      <InteractiveSolarCamera
        selectedBody={selectedBody}
        bodyPositions={positions}
        isUserInteracting={isUserInteracting}
      />

      {/* 3. Subtle Orbital Guides */}
      <OrbitGuides radii={ORBIT_RADII} visible={showOrbits} />

      {/* 4. Planetary Billboard Text Labels */}
      <CelestialLabels
        bodyPositions={positions}
        selectedBody={selectedBody}
        visible={showLabels}
        onSelectBody={onSelectBody}
      />

      {/* 5. The Central Thermonuclear Sun */}
      <CinematicSun
        radius={12.0}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('sun');
        }}
      />

      {/* 6. Mercury */}
      <CinematicMercury
        position={positions.mercury}
        radius={1.0}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('mercury');
        }}
      />

      {/* 7. Venus */}
      <CinematicVenus
        position={positions.venus}
        radius={1.8}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('venus');
        }}
      />

      {/* 8. Earth & The Moon */}
      <CinematicEarth
        position={positions.earth}
        radius={2.0}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('earth');
        }}
      />

      {/* 9. Mars */}
      <CinematicMars
        position={positions.mars}
        radius={1.3}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('mars');
        }}
      />

      {/* 10. Asteroid Belt & Ceres */}
      <AsteroidBelt
        innerRadius={ORBIT_RADII.asteroidsInner}
        outerRadius={ORBIT_RADII.asteroidsOuter}
        count={950}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('asteroids');
        }}
      />

      {/* 11. Jupiter & Galilean Moons (Io & Europa) */}
      <CinematicJupiter
        position={positions.jupiter}
        radius={5.5}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('jupiter');
        }}
      />

      {/* 12. Saturn & Cassini Division Rings */}
      <CinematicSaturn
        position={positions.saturn}
        radius={4.2}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('saturn');
        }}
      />

      {/* 13. Uranus & Ring System */}
      <CinematicUranus
        position={positions.uranus}
        radius={2.8}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('uranus');
        }}
      />

      {/* 14. Neptune */}
      <CinematicNeptune
        position={positions.neptune}
        radius={2.7}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('neptune');
        }}
      />
    </>
  );
}
