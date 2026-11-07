import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
  const { gl, scene, camera } = useThree();

  // Warm up and pre-compile all scene shaders on GPU to eliminate first-frame hitching
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__threeScene = scene;
    }
    if (gl && scene && camera) {
      try {
        gl.compile(scene, camera);
      } catch {
        // Silently continue if headless context lacks compilation hook
      }
    }
  }, [gl, scene, camera]);

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

  // Mutable real-time world positions of planets (zero per-frame React state re-renders!)
  const positionsRef = useRef({
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
  });

  const mercuryGroupRef = useRef();
  const venusGroupRef = useRef();
  const earthGroupRef = useRef();
  const marsGroupRef = useRef();
  const ceresGroupRef = useRef();
  const jupiterGroupRef = useRef();
  const saturnGroupRef = useRef();
  const uranusGroupRef = useRef();
  const neptuneGroupRef = useRef();

  // Orbital revolution frame loop - priority 1: simulation update runs FIRST in frame
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

    const mX = Math.cos(anglesRef.current.mercury) * DISPLAY_ORBIT_RADII.mercury;
    const mZ = Math.sin(anglesRef.current.mercury) * DISPLAY_ORBIT_RADII.mercury;
    positionsRef.current.mercury[0] = mX;
    positionsRef.current.mercury[2] = mZ;
    if (mercuryGroupRef.current) mercuryGroupRef.current.position.set(mX, 0, mZ);

    const vX = Math.cos(anglesRef.current.venus) * DISPLAY_ORBIT_RADII.venus;
    const vZ = Math.sin(anglesRef.current.venus) * DISPLAY_ORBIT_RADII.venus;
    positionsRef.current.venus[0] = vX;
    positionsRef.current.venus[2] = vZ;
    if (venusGroupRef.current) venusGroupRef.current.position.set(vX, 0, vZ);

    const eX = Math.cos(anglesRef.current.earth) * DISPLAY_ORBIT_RADII.earth;
    const eZ = Math.sin(anglesRef.current.earth) * DISPLAY_ORBIT_RADII.earth;
    positionsRef.current.earth[0] = eX;
    positionsRef.current.earth[2] = eZ;
    if (earthGroupRef.current) earthGroupRef.current.position.set(eX, 0, eZ);

    const maX = Math.cos(anglesRef.current.mars) * DISPLAY_ORBIT_RADII.mars;
    const maZ = Math.sin(anglesRef.current.mars) * DISPLAY_ORBIT_RADII.mars;
    positionsRef.current.mars[0] = maX;
    positionsRef.current.mars[2] = maZ;
    if (marsGroupRef.current) marsGroupRef.current.position.set(maX, 0, maZ);

    const cX = Math.cos(anglesRef.current.asteroids) * ceresR;
    const cZ = Math.sin(anglesRef.current.asteroids) * ceresR;
    positionsRef.current.asteroids[0] = cX;
    positionsRef.current.asteroids[2] = cZ;
    if (ceresGroupRef.current) ceresGroupRef.current.position.set(cX, 0.4, cZ);

    const jX = Math.cos(anglesRef.current.jupiter) * DISPLAY_ORBIT_RADII.jupiter;
    const jZ = Math.sin(anglesRef.current.jupiter) * DISPLAY_ORBIT_RADII.jupiter;
    positionsRef.current.jupiter[0] = jX;
    positionsRef.current.jupiter[2] = jZ;
    if (jupiterGroupRef.current) jupiterGroupRef.current.position.set(jX, 0, jZ);

    const sX = Math.cos(anglesRef.current.saturn) * DISPLAY_ORBIT_RADII.saturn;
    const sZ = Math.sin(anglesRef.current.saturn) * DISPLAY_ORBIT_RADII.saturn;
    positionsRef.current.saturn[0] = sX;
    positionsRef.current.saturn[2] = sZ;
    if (saturnGroupRef.current) saturnGroupRef.current.position.set(sX, 0, sZ);

    const uX = Math.cos(anglesRef.current.uranus) * DISPLAY_ORBIT_RADII.uranus;
    const uZ = Math.sin(anglesRef.current.uranus) * DISPLAY_ORBIT_RADII.uranus;
    positionsRef.current.uranus[0] = uX;
    positionsRef.current.uranus[2] = uZ;
    if (uranusGroupRef.current) uranusGroupRef.current.position.set(uX, 0, uZ);

    const nX = Math.cos(anglesRef.current.neptune) * DISPLAY_ORBIT_RADII.neptune;
    const nZ = Math.sin(anglesRef.current.neptune) * DISPLAY_ORBIT_RADII.neptune;
    positionsRef.current.neptune[0] = nX;
    positionsRef.current.neptune[2] = nZ;
    if (neptuneGroupRef.current) neptuneGroupRef.current.position.set(nX, 0, nZ);
  });

  return (
    <>
      {/* 1. Deep Space Starfield & Cosmic Void Background */}
      <DeepSpaceSkybox />

      {/* 2. Interactive Orbit & Follow Camera */}
      <InteractiveSolarCamera
        selectedBody={selectedBody}
        viewMode={viewMode}
        bodyPositions={positionsRef.current}
        isUserInteracting={isUserInteracting}
        enabled={!isPrologueActive}
      />

      {/* 2b. Directed Nolan-Style Space Prologue Camera */}
      {isPrologueActive && (
        <CinematicPrologueDirector
          isActive={isPrologueActive}
          onComplete={onCompletePrologue}
          bodyPositions={positionsRef.current}
        />
      )}

      {/* 3. Subtle Orbital Guides */}
      <OrbitGuides
        radii={DISPLAY_ORBIT_RADII}
        visible={showOrbits}
        selectedBody={selectedBody}
        bodyPositions={positionsRef.current}
      />

      {/* 4. Planetary Billboard Text Labels */}
      <CelestialLabels
        bodyPositions={positionsRef.current}
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
      <group ref={mercuryGroupRef} position={positionsRef.current.mercury}>
        <CinematicMercury
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.mercury}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('mercury');
          }}
        />
      </group>

      {/* 7. Venus */}
      <group ref={venusGroupRef} position={positionsRef.current.venus}>
        <CinematicVenus
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.venus}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('venus');
          }}
        />
      </group>

      {/* 8. Earth & The Moon */}
      <group ref={earthGroupRef} position={positionsRef.current.earth}>
        <CinematicEarth
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.earth}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('earth');
          }}
        />
      </group>

      {/* 9. Mars */}
      <group ref={marsGroupRef} position={positionsRef.current.mars}>
        <CinematicMars
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.mars}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('mars');
          }}
        />
      </group>

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
      <group ref={jupiterGroupRef} position={positionsRef.current.jupiter}>
        <CinematicJupiter
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.jupiter}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('jupiter');
          }}
        />
      </group>

      {/* 12. Saturn & Cassini Division Rings */}
      <group ref={saturnGroupRef} position={positionsRef.current.saturn}>
        <CinematicSaturn
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.saturn}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('saturn');
          }}
        />
      </group>

      {/* 13. Uranus & Ring System */}
      <group ref={uranusGroupRef} position={positionsRef.current.uranus}>
        <CinematicUranus
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.uranus}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('uranus');
          }}
        />
      </group>

      {/* 14. Neptune */}
      <group ref={neptuneGroupRef} position={positionsRef.current.neptune}>
        <CinematicNeptune
          position={[0, 0, 0]}
          radius={DISPLAY_RADII.neptune}
          isPlaying={!isPaused}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectBody) onSelectBody('neptune');
          }}
        />
      </group>
    </>
  );
}
