import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CinematicSun } from './CinematicSun';
import { CinematicEarth } from './CinematicEarth';
import { CinematicSaturn } from './CinematicSaturn';
import { CinematicJupiter } from './CinematicJupiter';
import { CinematicPlanet } from './CinematicPlanet';
import { AsteroidBelt } from './AsteroidBelt';
import { DeepSpaceSkybox } from './DeepSpaceSkybox';
import { CinematicDirectorCamera } from './CinematicDirectorCamera';
import { PLANETS_CONFIG, SOLAR_SYSTEM_PLANETS } from '../../data/planetsData';

export function SolarSystemEngine({
  isFilmPlaying = true,
  currentSceneIndex = 0,
  sceneProgress = 0,
  isUserInteracting = false,
  showOrbits = false
}) {
  // Planetary orbital angles
  const anglesRef = useRef({
    mercury: PLANETS_CONFIG.mercury.initialAngle,
    venus: PLANETS_CONFIG.venus.initialAngle,
    earth: PLANETS_CONFIG.earth.initialAngle,
    mars: PLANETS_CONFIG.mars.initialAngle,
    jupiter: PLANETS_CONFIG.jupiter.initialAngle,
    saturn: PLANETS_CONFIG.saturn.initialAngle,
    uranus: PLANETS_CONFIG.uranus.initialAngle,
    neptune: PLANETS_CONFIG.neptune.initialAngle
  });

  // Current real-time world positions of planets
  const [positions, setPositions] = useState(() => {
    const init = {
      sun: [0, 0, 0],
      void: [0, 0, 0],
      asteroids: [48, 0, 32],
      overview: [0, 0, 0]
    };
    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const r = cfg.cinematicOrbitRadius;
      const a = cfg.initialAngle;
      init[id] = [Math.cos(a) * r, 0, Math.sin(a) * r];
    });
    return init;
  });

  // Orbital revolution frame loop
  useFrame((_, delta) => {
    const advance = delta * 0.15;
    const updated = {
      sun: [0, 0, 0],
      void: [0, 0, 0],
      asteroids: [48, 0, 32],
      overview: [0, 0, 0]
    };

    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const speed = cfg.orbitalSpeedMultiplier || 1.0;
      anglesRef.current[id] += advance * speed;

      const r = cfg.cinematicOrbitRadius;
      const a = anglesRef.current[id];
      updated[id] = [Math.cos(a) * r, 0, Math.sin(a) * r];
    });

    setPositions(updated);
  });

  return (
    <>
      {/* 1. Deep Space Starfield & Cosmic Void Background */}
      <DeepSpaceSkybox count={3200} />

      {/* 2. IMAX Director Camera */}
      <CinematicDirectorCamera
        isFilmPlaying={isFilmPlaying}
        currentSceneIndex={currentSceneIndex}
        sceneProgress={sceneProgress}
        bodyPositions={positions}
        isUserInteracting={isUserInteracting}
      />

      {/* 3. The Central Thermonuclear Sun */}
      <CinematicSun radius={15.0} />

      {/* 4. Mercury */}
      <CinematicPlanet
        id="mercury"
        position={positions.mercury}
        radius={0.85}
        axialTilt={(0.03 * Math.PI) / 180}
        texturePath="/assets/planets/mercury/mercury.jpg"
        atmosphereIntensity={0.0}
        isPlaying={isFilmPlaying}
      />

      {/* 5. Venus */}
      <CinematicPlanet
        id="venus"
        position={positions.venus}
        radius={1.75}
        axialTilt={(177.3 * Math.PI) / 180}
        texturePath="/assets/planets/venus/venus_surface.jpg"
        atmosphereColor="#ffd180"
        atmosphereIntensity={0.16}
        isPlaying={isFilmPlaying}
      />

      {/* 6. Earth & The Moon */}
      <CinematicEarth
        position={positions.earth}
        radius={1.85}
        isPlaying={isFilmPlaying}
      />

      {/* 7. Mars */}
      <CinematicPlanet
        id="mars"
        position={positions.mars}
        radius={1.15}
        axialTilt={(25.19 * Math.PI) / 180}
        texturePath="/assets/planets/mars/mars.jpg"
        atmosphereColor="#d97543"
        atmosphereIntensity={0.06}
        isPlaying={isFilmPlaying}
      />

      {/* 8. Asteroid Belt & Ceres */}
      <AsteroidBelt
        innerRadius={36}
        outerRadius={50}
        count={850}
        isPlaying={isFilmPlaying}
      />

      {/* 9. Jupiter & Galilean Moons (Io & Europa) */}
      <CinematicJupiter
        position={positions.jupiter}
        radius={5.2}
        isPlaying={isFilmPlaying}
      />

      {/* 10. Saturn & Cassini Division Rings */}
      <CinematicSaturn
        position={positions.saturn}
        radius={3.8}
        isPlaying={isFilmPlaying}
      />

      {/* 11. Uranus */}
      <CinematicPlanet
        id="uranus"
        position={positions.uranus}
        radius={2.7}
        axialTilt={(97.77 * Math.PI) / 180}
        texturePath="/assets/planets/uranus/uranus.jpg"
        atmosphereColor="#a6e3e9"
        atmosphereIntensity={0.10}
        hasRings={true}
        isPlaying={isFilmPlaying}
      />

      {/* 12. Neptune */}
      <CinematicPlanet
        id="neptune"
        position={positions.neptune}
        radius={2.6}
        axialTilt={(28.32 * Math.PI) / 180}
        texturePath="/assets/planets/neptune/neptune.jpg"
        atmosphereColor="#3b69ff"
        atmosphereIntensity={0.12}
        isPlaying={isFilmPlaying}
      />
    </>
  );
}
