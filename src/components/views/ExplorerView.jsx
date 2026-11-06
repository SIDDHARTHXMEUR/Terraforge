import React, { Suspense, useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAppStore } from '../../state/useAppStore';
import { Sun } from '../Sun';
import { PlanetBody } from '../PlanetBody';
import { Starfield } from '../Starfield';
import { CameraRig } from '../CameraRig';
import { OrbitsVisualizer } from '../OrbitsVisualizer';
import { PlanetSelectorBar } from '../PlanetSelectorBar';
import { Sidebar } from '../Sidebar';
import { PlanetTelemetryHUD } from '../PlanetTelemetryHUD';
import { TransformPanel } from '../TransformPanel';
import { LoadingScreen } from '../LoadingScreen';
import { PLANETS_CONFIG, SOLAR_SYSTEM_PLANETS } from '../../data/planetsData';
import * as THREE from 'three';

// Moon component orbiting Earth
function OrbitingMoon({ earthPos = [0, 0, 0], earthRadius = 2.1, isPlaying = true, simTime = 0 }) {
  const moonRef = useRef();
  const moonAngleRef = useRef(0);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    // Lunar orbit speed ~ 27.3 times slower than Earth rotation
    moonAngleRef.current += delta * 0.25;
    if (moonRef.current) {
      const dist = earthRadius * 2.3;
      const x = earthPos[0] + Math.cos(moonAngleRef.current) * dist;
      const z = earthPos[2] + Math.sin(moonAngleRef.current) * dist;
      moonRef.current.position.set(x, 0, z);
      moonRef.current.rotation.y = -moonAngleRef.current + Math.PI / 2;
    }
  });

  return (
    <mesh ref={moonRef} position={[earthPos[0] + earthRadius * 2.3, 0, earthPos[2]]}>
      <sphereGeometry args={[earthRadius * 0.27, 32, 32]} />
      <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
    </mesh>
  );
}

// Planetary Orbit Engine advancing celestial orbital angles per frame
function SolarSystemEngine({
  isTrueScale,
  isPlaying,
  timeSpeed,
  selectedBody,
  setSelectedBody,
  showLabels,
  sim,
  onPlanetPositionsUpdate
}) {
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

  const [planetPositions, setPlanetPositions] = useState(() => {
    const initial = {};
    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const r = cfg.cinematicOrbitRadius;
      const a = cfg.initialAngle;
      initial[id] = [Math.cos(a) * r, 0, Math.sin(a) * r];
    });
    return initial;
  });

  // Advance orbital revolution each frame
  useFrame((_, delta) => {
    if (!isPlaying) return;

    const updated = {};
    const baseSpeed = delta * 0.25 * timeSpeed;

    SOLAR_SYSTEM_PLANETS.forEach((id) => {
      const cfg = PLANETS_CONFIG[id];
      const speedMult = cfg.orbitalSpeedMultiplier || 1.0;
      anglesRef.current[id] += baseSpeed * speedMult;

      const orbitRadius = isTrueScale
        ? (cfg.semiMajorAxisAU || 1.0) * 35.0
        : (cfg.cinematicOrbitRadius || 30.0);

      const a = anglesRef.current[id];
      updated[id] = [Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius];
    });

    setPlanetPositions(updated);
    if (onPlanetPositionsUpdate) {
      onPlanetPositionsUpdate(updated);
    }
  });

  return (
    <>
      {SOLAR_SYSTEM_PLANETS.map((id) => {
        const config = PLANETS_CONFIG[id];
        const pos = planetPositions[id] || [0, 0, 0];
        const radius = isTrueScale
          ? Math.max(0.2, (config.radiusKm / 6371.0) * 0.35)
          : config.cinematicRadius;

        return (
          <PlanetBody
            key={id}
            config={config}
            position={pos}
            radius={radius}
            isSelected={selectedBody === id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBody(id);
            }}
            isPlaying={isPlaying}
            showLabel={showLabels}
            sim={sim}
          />
        );
      })}

      {/* Earth's Moon */}
      {planetPositions.earth && (
        <OrbitingMoon
          earthPos={planetPositions.earth}
          earthRadius={isTrueScale ? 0.35 : PLANETS_CONFIG.earth.cinematicRadius}
          isPlaying={isPlaying}
        />
      )}
    </>
  );
}

export function ExplorerView() {
  const {
    selectedBody,
    setSelectedBody,
    isTrueScale,
    toggleTrueScale,
    showOrbits,
    toggleShowOrbits,
    cameraMode,
    cameraResetCount,
    triggerCameraReset,
    sim,
    updateSim,
    transform,
    updateTransform,
    resetTransform,
    activePreset,
    applyPreset,
    activeDrawer,
    toggleDrawer,
    elapsedDays,
    timeSpeed
  } = useAppStore();

  const [showLabels, setShowLabels] = useState(true);
  const [currentPlanetPositions, setCurrentPlanetPositions] = useState({});

  // Compute camera focus target position and distance
  const { targetPos, targetDistance } = useMemo(() => {
    if (selectedBody === 'overview') {
      return { targetPos: [0, 0, 0], targetDistance: isTrueScale ? 350 : 140 };
    }
    if (selectedBody === 'sun') {
      return { targetPos: [0, 0, 0], targetDistance: 24 };
    }

    const pos = currentPlanetPositions[selectedBody] || [
      PLANETS_CONFIG[selectedBody]?.cinematicOrbitRadius || 40,
      0,
      0
    ];

    const config = PLANETS_CONFIG[selectedBody];
    const r = isTrueScale ? 0.5 : (config?.cinematicRadius || 2.0);
    const dist = selectedBody === 'saturn' ? r * 4.2 : r * 3.2;

    return { targetPos: pos, targetDistance: Math.max(4.0, dist) };
  }, [selectedBody, currentPlanetPositions, isTrueScale]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          gl={{
            antialias: true,
            alpha: false,
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance'
          }}
        >
          {/* Dynamic Smooth Camera Rig with Auto-framing */}
          <CameraRig
            cameraMode={cameraMode}
            cameraResetCount={cameraResetCount}
            targetPosition={targetPos}
            targetDistance={targetDistance}
            selectedBody={selectedBody}
            isTrueScale={isTrueScale}
          />

          {/* Deep Space Procedural Starfield */}
          <Starfield />

          {/* Central Sun at [0, 0, 0] with Omnidirectional Sunlight */}
          <Sun
            isTrueScale={isTrueScale}
            radius={PLANETS_CONFIG.sun.cinematicRadius}
            isSelected={selectedBody === 'sun'}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBody('sun');
            }}
          />

          {/* Keplerian Orbit Lines centered at Sun */}
          <OrbitsVisualizer
            showOrbits={showOrbits}
            selectedPlanet={selectedBody}
            isTrueScale={isTrueScale}
            onSelectPlanet={setSelectedBody}
          />

          {/* All 8 Revolving Planets */}
          <SolarSystemEngine
            isTrueScale={isTrueScale}
            isPlaying={sim.isPlaying}
            timeSpeed={timeSpeed}
            selectedBody={selectedBody}
            setSelectedBody={setSelectedBody}
            showLabels={showLabels}
            sim={sim}
            onPlanetPositionsUpdate={setCurrentPlanetPositions}
          />
        </Canvas>
      </Suspense>

      {/* Top Secondary Planet Selection Toolstrip */}
      <PlanetSelectorBar showLabels={showLabels} setShowLabels={setShowLabels} />

      {/* Preserved Left Sidebar Navigation (Can be toggled or hovered) */}
      <Sidebar
        sim={sim}
        updateSim={updateSim}
        transform={transform}
        updateTransform={updateTransform}
        resetTransform={resetTransform}
        activePreset={activePreset}
        applyPreset={applyPreset}
        isTrueScale={isTrueScale}
        toggleTrueScale={toggleTrueScale}
        showOrbits={showOrbits}
        toggleShowOrbits={toggleShowOrbits}
        cameraMode={cameraMode}
        toggleCameraMode={() => {}}
        triggerCameraReset={triggerCameraReset}
        activeDrawer={activeDrawer}
        toggleDrawer={toggleDrawer}
        elapsedDays={elapsedDays}
      />

      {/* Preserved Bottom-Right Telemetry HUD */}
      <PlanetTelemetryHUD sim={sim} />

      {/* Transform Drawer flyout when opened */}
      {activeDrawer === 'transform' && (
        <div className="absolute top-24 right-4 z-40">
          <TransformPanel
            transform={transform}
            updateTransform={updateTransform}
            resetTransform={resetTransform}
            isOpen={true}
            onClose={() => toggleDrawer('transform')}
          />
        </div>
      )}
    </div>
  );
}
