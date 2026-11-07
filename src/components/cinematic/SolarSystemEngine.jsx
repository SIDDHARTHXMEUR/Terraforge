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
import { CinematicPrologueDirector } from './CinematicPrologueDirector';
import { DISPLAY_RADII, DISPLAY_ORBIT_RADII, ORBIT_SPEEDS } from '../../data/displayScale';

export function SolarSystemEngine({
  selectedBody = 'overview',
  viewMode = 'cinematic',
  timeMultiplier = 1.0,
  isPaused = false,
  showOrbits = true,
  showLabels = true,
  onSelectBody,
  isUserInteracting = false,
  isPrologueActive = false,
  onCompletePrologue
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
    mercury: [Math.cos(0.4) * DISPLAY_ORBIT_RADII.mercury, 0, Math.sin(0.4) * DISPLAY_ORBIT_RADII.mercury],
    venus: [Math.cos(1.8) * DISPLAY_ORBIT_RADII.venus, 0, Math.sin(1.8) * DISPLAY_ORBIT_RADII.venus],
    earth: [Math.cos(3.2) * DISPLAY_ORBIT_RADII.earth, 0, Math.sin(3.2) * DISPLAY_ORBIT_RADII.earth],
    mars: [Math.cos(4.6) * DISPLAY_ORBIT_RADII.mars, 0, Math.sin(4.6) * DISPLAY_ORBIT_RADII.mars],
    asteroids: [Math.cos(1.2) * DISPLAY_ORBIT_RADII.ceres, 0.4, Math.sin(1.2) * DISPLAY_ORBIT_RADII.ceres],
    jupiter: [Math.cos(0.9) * DISPLAY_ORBIT_RADII.jupiter, 0, Math.sin(0.9) * DISPLAY_ORBIT_RADII.jupiter],
    saturn: [Math.cos(2.5) * DISPLAY_ORBIT_RADII.saturn, 0, Math.sin(2.5) * DISPLAY_ORBIT_RADII.saturn],
    uranus: [Math.cos(5.1) * DISPLAY_ORBIT_RADII.uranus, 0, Math.sin(5.1) * DISPLAY_ORBIT_RADII.uranus],
    neptune: [Math.cos(3.8) * DISPLAY_ORBIT_RADII.neptune, 0, Math.sin(3.8) * DISPLAY_ORBIT_RADII.neptune]
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

    const ceresR = DISPLAY_ORBIT_RADII.ceres;

    setPositions({
      sun: [0, 0, 0],
      overview: [0, 0, 0],
      mercury: [
        Math.cos(anglesRef.current.mercury) * DISPLAY_ORBIT_RADII.mercury,
        0,
        Math.sin(anglesRef.current.mercury) * DISPLAY_ORBIT_RADII.mercury
      ],
      venus: [
        Math.cos(anglesRef.current.venus) * DISPLAY_ORBIT_RADII.venus,
        0,
        Math.sin(anglesRef.current.venus) * DISPLAY_ORBIT_RADII.venus
      ],
      earth: [
        Math.cos(anglesRef.current.earth) * DISPLAY_ORBIT_RADII.earth,
        0,
        Math.sin(anglesRef.current.earth) * DISPLAY_ORBIT_RADII.earth
      ],
      mars: [
        Math.cos(anglesRef.current.mars) * DISPLAY_ORBIT_RADII.mars,
        0,
        Math.sin(anglesRef.current.mars) * DISPLAY_ORBIT_RADII.mars
      ],
      asteroids: [
        Math.cos(anglesRef.current.asteroids) * ceresR,
        0.4,
        Math.sin(anglesRef.current.asteroids) * ceresR
      ],
      jupiter: [
        Math.cos(anglesRef.current.jupiter) * DISPLAY_ORBIT_RADII.jupiter,
        0,
        Math.sin(anglesRef.current.jupiter) * DISPLAY_ORBIT_RADII.jupiter
      ],
      saturn: [
        Math.cos(anglesRef.current.saturn) * DISPLAY_ORBIT_RADII.saturn,
        0,
        Math.sin(anglesRef.current.saturn) * DISPLAY_ORBIT_RADII.saturn
      ],
      uranus: [
        Math.cos(anglesRef.current.uranus) * DISPLAY_ORBIT_RADII.uranus,
        0,
        Math.sin(anglesRef.current.uranus) * DISPLAY_ORBIT_RADII.uranus
      ],
      neptune: [
        Math.cos(anglesRef.current.neptune) * DISPLAY_ORBIT_RADII.neptune,
        0,
        Math.sin(anglesRef.current.neptune) * DISPLAY_ORBIT_RADII.neptune
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
        viewMode={viewMode}
        bodyPositions={positions}
        isUserInteracting={isUserInteracting}
        enabled={!isPrologueActive}
      />

      {/* 2b. Directed Nolan-Style Space Prologue Camera */}
      {isPrologueActive && (
        <CinematicPrologueDirector
          isActive={isPrologueActive}
          onComplete={onCompletePrologue}
          bodyPositions={positions}
        />
      )}

      {/* 3. Subtle Orbital Guides */}
      <OrbitGuides
        radii={DISPLAY_ORBIT_RADII}
        visible={showOrbits}
        selectedBody={selectedBody}
        bodyPositions={positions}
      />

      {/* 4. Planetary Billboard Text Labels */}
      <CelestialLabels
        bodyPositions={positions}
        selectedBody={selectedBody}
        visible={showLabels}
        onSelectBody={onSelectBody}
      />

      {/* 5. The Central Thermonuclear Sun */}
      <CinematicSun
        radius={DISPLAY_RADII.sun}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('sun');
        }}
      />

      {/* 6. Mercury */}
      <CinematicMercury
        position={positions.mercury}
        radius={DISPLAY_RADII.mercury}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('mercury');
        }}
      />

      {/* 7. Venus */}
      <CinematicVenus
        position={positions.venus}
        radius={DISPLAY_RADII.venus}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('venus');
        }}
      />

      {/* 8. Earth & The Moon */}
      <CinematicEarth
        position={positions.earth}
        radius={DISPLAY_RADII.earth}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('earth');
        }}
      />

      {/* 9. Mars */}
      <CinematicMars
        position={positions.mars}
        radius={DISPLAY_RADII.mars}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('mars');
        }}
      />

      {/* 10. Asteroid Belt & Ceres */}
      <AsteroidBelt
        innerRadius={DISPLAY_ORBIT_RADII.asteroidsInner}
        outerRadius={DISPLAY_ORBIT_RADII.asteroidsOuter}
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
        radius={DISPLAY_RADII.jupiter}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('jupiter');
        }}
      />

      {/* 12. Saturn & Cassini Division Rings */}
      <CinematicSaturn
        position={positions.saturn}
        radius={DISPLAY_RADII.saturn}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('saturn');
        }}
      />

      {/* 13. Uranus & Ring System */}
      <CinematicUranus
        position={positions.uranus}
        radius={DISPLAY_RADII.uranus}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('uranus');
        }}
      />

      {/* 14. Neptune */}
      <CinematicNeptune
        position={positions.neptune}
        radius={DISPLAY_RADII.neptune}
        isPlaying={!isPaused}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectBody) onSelectBody('neptune');
        }}
      />
    </>
  );
}
