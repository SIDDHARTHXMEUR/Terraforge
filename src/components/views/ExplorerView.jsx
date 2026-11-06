import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAppStore } from '../../state/useAppStore';
import { Planet } from '../Planet';
import { Sun } from '../Sun';
import { Moon } from '../Moon';
import { Starfield } from '../Starfield';
import { CameraRig } from '../CameraRig';
import { UniversalPlanetMesh } from '../UniversalPlanet';
import { OrbitsVisualizer } from '../OrbitsVisualizer';
import { PlanetSelectorBar } from '../PlanetSelectorBar';
import { Sidebar } from '../Sidebar';
import { PlanetTelemetryHUD } from '../PlanetTelemetryHUD';
import { TransformPanel } from '../TransformPanel';
import { LoadingScreen } from '../LoadingScreen';
import { PLANETS_DATA, CELESTIAL_ORDER } from '../../data/planetsData';
import * as THREE from 'three';

// Sim Time Tracker tracking elapsed days
function SimTimeTracker() {
  const { sim, timeSpeed, setElapsedDays, cameraResetCount } = useAppStore();
  const accumRef = useRef(0);
  const lastFlushRef = useRef(0);

  useEffect(() => {
    accumRef.current = 0;
  }, [cameraResetCount]);

  useFrame((_, delta) => {
    if (!sim.isPlaying) return;
    const deltaDays = (sim.rotationSpeed * delta * 0.4 * timeSpeed) / (2 * Math.PI);
    accumRef.current += deltaDays;

    const now = performance.now();
    if (now - lastFlushRef.current > 100) {
      lastFlushRef.current = now;
      setElapsedDays(accumRef.current);
    }
  });

  return null;
}

// Camera Focus Controller for Planetary Selection
function PlanetaryFocusController() {
  const { selectedBody, cameraResetCount } = useAppStore();
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }, delta) => {
    const planetData = PLANETS_DATA[selectedBody];
    if (!planetData) return;

    let targetX = 0;
    let targetZ = 0;

    if (selectedBody !== 'earth' && selectedBody !== 'moon') {
      const radius = planetData.orbitRadiusDisplay || 50;
      targetX = radius;
    }

    targetPosRef.current.lerp(new THREE.Vector3(targetX, 0, targetZ), Math.min(1, delta * 3.0));
  });

  return null;
}

export function ExplorerView() {
  const {
    transform,
    updateTransform,
    resetTransform,
    sim,
    updateSim,
    activePreset,
    applyPreset,
    activeDrawer,
    toggleDrawer,
    isTrueScale,
    toggleTrueScale,
    showOrbits,
    toggleShowOrbits,
    cameraMode,
    toggleCameraMode,
    cameraResetCount,
    triggerCameraReset,
    elapsedDays,
    selectedBody,
    setSelectedBody,
    timeSpeed
  } = useAppStore();

  // Celestial planets positioned along their orbital distances
  const celestialPlanets = useMemo(() => {
    return CELESTIAL_ORDER.filter(id => id !== 'earth' && id !== 'moon').map((id) => {
      const data = PLANETS_DATA[id];
      const radius = data.orbitRadiusDisplay || 40;
      return {
        id,
        name: data.name,
        scale: (data.scaleRadius || 1.0) * (isTrueScale ? 1.0 : 1.2),
        position: [radius, 0, 0],
        orbitRadius: radius
      };
    });
  }, [isTrueScale]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas */}
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          gl={{ antialias: true, alpha: false, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
        >
          <CameraRig
            cameraMode={cameraMode}
            cameraResetCount={cameraResetCount}
            cameraPunchCount={0}
            isTrueScale={isTrueScale}
          />
          <SimTimeTracker />
          <PlanetaryFocusController />
          <Starfield />
          <Sun isTrueScale={isTrueScale} />

          {/* Orbits Visualizer */}
          <OrbitsVisualizer
            showOrbits={showOrbits}
            selectedPlanet={selectedBody}
            onSelectPlanet={setSelectedBody}
          />

          {/* Earth rendered with original multi-texture GLSL shader */}
          <Planet
            transform={transform}
            updateTransform={updateTransform}
            sim={sim}
            showOrbits={false}
            activeDrawer={activeDrawer}
          />

          {/* Moon rendered with original kinematic lunar orbit & tidal lock */}
          <Moon
            planetTransform={transform}
            sim={sim}
            isTrueScale={isTrueScale}
            showOrbits={false}
            cameraResetCount={cameraResetCount}
          />

          {/* Other Solar System Planets (Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune) */}
          {celestialPlanets.map((p) => (
            <UniversalPlanetMesh
              key={p.id}
              planetId={p.id}
              position={p.position}
              scale={p.scale}
              isPlaying={sim.isPlaying}
              isSelected={selectedBody === p.id}
              onClick={() => setSelectedBody(p.id)}
            />
          ))}
        </Canvas>
      </Suspense>

      {/* Top Floating Planetary Strip & HUD Tools */}
      <PlanetSelectorBar />

      {/* Preserved Left Sidebar Navigation */}
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
        toggleCameraMode={toggleCameraMode}
        triggerCameraReset={triggerCameraReset}
        activeDrawer={activeDrawer}
        toggleDrawer={toggleDrawer}
        elapsedDays={elapsedDays}
      />

      {/* Preserved Bottom-Right Telemetry HUD */}
      <PlanetTelemetryHUD sim={sim} />

      {/* Floating Transform Inspector Flyout Drawer when activated */}
      {activeDrawer === 'transform' && (
        <div className="absolute top-20 right-4 z-40">
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
