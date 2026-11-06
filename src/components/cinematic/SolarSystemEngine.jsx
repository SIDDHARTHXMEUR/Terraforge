import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../../state/useAppStore';
import { CinematicSun } from './CinematicSun';
import { CinematicEarth } from './CinematicEarth';
import { CinematicSaturn } from './CinematicSaturn';
import { CinematicPlanet } from './CinematicPlanet';
import { AsteroidBelt } from './AsteroidBelt';
import { DeepSpaceSkybox } from './DeepSpaceSkybox';
import { CinematicCamera } from './CinematicCamera';
import { OrbitsVisualizer } from '../OrbitsVisualizer';
import { PLANETS_CONFIG, SOLAR_SYSTEM_PLANETS, ALL_CELESTIAL_BODIES } from '../../data/planetsData';
import * as THREE from 'three';

export function SolarSystemEngine({
  isCinematicTour = false,
  showOrbits = false
}) {
  const {
    selectedBody,
    setSelectedBody,
    sim,
    timeSpeed,
    cameraResetCount
  } = useAppStore();

  // Planetary orbital angles state
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
    const init = { sun: [0, 0, 0] };
    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const r = cfg.cinematicOrbitRadius;
      const a = cfg.initialAngle;
      init[id] = [Math.cos(a) * r, 0, Math.sin(a) * r];
    });
    return init;
  });

  // Cinematic Tour sequence manager
  const tourIndexRef = useRef(0);
  const tourTimerRef = useRef(0);
  const tourSequence = useMemo(() => [
    'overview',
    'sun',
    'mercury',
    'venus',
    'earth',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune'
  ], []);

  // Frame animation for orbital revolution & cinematic tour stepping
  useFrame((_, delta) => {
    const advance = sim.isPlaying ? delta * 0.22 * timeSpeed : 0;
    const updated = { sun: [0, 0, 0] };

    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const speed = cfg.orbitalSpeedMultiplier || 1.0;
      anglesRef.current[id] += advance * speed;

      const r = cfg.cinematicOrbitRadius;
      const a = anglesRef.current[id];
      updated[id] = [Math.cos(a) * r, 0, Math.sin(a) * r];
    });

    setPositions(updated);

    // Cinematic Tour auto-advancing every 9 seconds
    if (isCinematicTour) {
      tourTimerRef.current += delta;
      if (tourTimerRef.current > 9.0) {
        tourTimerRef.current = 0;
        tourIndexRef.current = (tourIndexRef.current + 1) % tourSequence.length;
        setSelectedBody(tourSequence[tourIndexRef.current]);
      }
    } else {
      tourTimerRef.current = 0;
    }
  });

  // Current focus target position and radius for camera
  const { currentTargetPos, currentTargetRadius } = useMemo(() => {
    if (selectedBody === 'overview' || selectedBody === 'sun') {
      return { currentTargetPos: [0, 0, 0], currentTargetRadius: PLANETS_CONFIG.sun.cinematicRadius };
    }
    const pos = positions[selectedBody] || [
      PLANETS_CONFIG[selectedBody]?.cinematicOrbitRadius || 40,
      0,
      0
    ];
    const r = PLANETS_CONFIG[selectedBody]?.cinematicRadius || 2.0;
    return { currentTargetPos: pos, currentTargetRadius: r };
  }, [selectedBody, positions]);

  return (
    <>
      {/* High-Fidelity Cinematic Camera Rig */}
      <CinematicCamera
        selectedBody={selectedBody}
        targetPosition={currentTargetPos}
        targetRadius={currentTargetRadius}
        cameraResetCount={cameraResetCount}
      />

      {/* Deep Space Point Stars Skybox */}
      <DeepSpaceSkybox />

      {/* Central Luminous Sun at [0, 0, 0] */}
      <CinematicSun
        radius={PLANETS_CONFIG.sun.cinematicRadius}
        isSelected={selectedBody === 'sun'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('sun');
        }}
      />

      {/* Orbits Visualizer (Off by default for pure cinematic cleanliness) */}
      <OrbitsVisualizer
        showOrbits={showOrbits}
        selectedPlanet={selectedBody}
        isTrueScale={false}
        onSelectPlanet={setSelectedBody}
      />

      {/* Realistic Rocky Asteroid Belt between Mars & Jupiter */}
      <AsteroidBelt
        innerRadius={61.0}
        outerRadius={68.0}
        isPlaying={sim.isPlaying}
        timeSpeed={timeSpeed}
      />

      {/* Mercury */}
      <CinematicPlanet
        config={PLANETS_CONFIG.mercury}
        position={positions.mercury}
        radius={PLANETS_CONFIG.mercury.cinematicRadius}
        isSelected={selectedBody === 'mercury'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('mercury');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Venus */}
      <CinematicPlanet
        config={PLANETS_CONFIG.venus}
        position={positions.venus}
        radius={PLANETS_CONFIG.venus.cinematicRadius}
        isSelected={selectedBody === 'venus'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('venus');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Earth (with Version 1 Enhanced Multi-Texture Shader & Moon) */}
      <CinematicEarth
        position={positions.earth}
        radius={PLANETS_CONFIG.earth.cinematicRadius}
        isSelected={selectedBody === 'earth'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('earth');
        }}
        isPlaying={sim.isPlaying}
        sim={sim}
      />

      {/* Mars */}
      <CinematicPlanet
        config={PLANETS_CONFIG.mars}
        position={positions.mars}
        radius={PLANETS_CONFIG.mars.cinematicRadius}
        isSelected={selectedBody === 'mars'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('mars');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Jupiter */}
      <CinematicPlanet
        config={PLANETS_CONFIG.jupiter}
        position={positions.jupiter}
        radius={PLANETS_CONFIG.jupiter.cinematicRadius}
        isSelected={selectedBody === 'jupiter'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('jupiter');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Saturn (with multi-division rings and transparency) */}
      <CinematicSaturn
        position={positions.saturn}
        radius={PLANETS_CONFIG.saturn.cinematicRadius}
        isSelected={selectedBody === 'saturn'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('saturn');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Uranus (with tilted rings) */}
      <CinematicPlanet
        config={PLANETS_CONFIG.uranus}
        position={positions.uranus}
        radius={PLANETS_CONFIG.uranus.cinematicRadius}
        isSelected={selectedBody === 'uranus'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('uranus');
        }}
        isPlaying={sim.isPlaying}
      />

      {/* Neptune */}
      <CinematicPlanet
        config={PLANETS_CONFIG.neptune}
        position={positions.neptune}
        radius={PLANETS_CONFIG.neptune.cinematicRadius}
        isSelected={selectedBody === 'neptune'}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBody('neptune');
        }}
        isPlaying={sim.isPlaying}
      />
    </>
  );
}
