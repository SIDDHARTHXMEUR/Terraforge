import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSimState } from './state/useSimState';
import { Planet } from './components/Planet';
import { Sun } from './components/Sun';
import { Moon } from './components/Moon';
import { Starfield } from './components/Starfield';
import { CameraRig } from './components/CameraRig';
import { Sidebar } from './components/Sidebar';
import { FirstLoadHint } from './components/FirstLoadHint';
import { LoadingScreen } from './components/LoadingScreen';

// Helper component to track elapsed simulation days per frame
function SimTimeTracker({ sim, setElapsedDays, cameraResetCount }) {
  const accumRef = useRef(0);
  const lastFlushRef = useRef(0);

  useEffect(() => {
    accumRef.current = 0;
  }, [cameraResetCount]);

  useFrame((_, delta) => {
    if (!sim.isPlaying) return;
    // 1 full Earth rotation = 2 * PI radians
    // baseSpeed = sim.rotationSpeed * delta * 0.4
    const deltaDays = (sim.rotationSpeed * delta * 0.4) / (2 * Math.PI);
    accumRef.current += deltaDays;

    const now = performance.now();
    if (now - lastFlushRef.current > 100) {
      lastFlushRef.current = now;
      setElapsedDays(accumRef.current);
    }
  });

  return null;
}

export default function App() {
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
    cameraPunchCount,
    elapsedDays,
    setElapsedDays
  } = useSimState();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* First-load Interactive Hint Badge */}
      <FirstLoadHint />

      {/* 3D WebGL Canvas Viewport with Suspense Texture Loading Fallback */}
      <Suspense fallback={<LoadingScreen />}>
        {/* SYLLABUS: Topic 1 - Overview of 3D Computer Graphics (WebGL2 Hardware Rendering Loop) */}
        {/* SYLLABUS: Topic 10 - GPU Hardware Acceleration (logarithmicDepthBuffer prevents Z-fighting across 300,000:1 frustum) */}
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          gl={{ antialias: true, alpha: false, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
        >
          <CameraRig
            cameraMode={cameraMode}
            cameraResetCount={cameraResetCount}
            cameraPunchCount={cameraPunchCount}
            isTrueScale={isTrueScale}
          />
          <SimTimeTracker sim={sim} setElapsedDays={setElapsedDays} cameraResetCount={cameraResetCount} />
          <Starfield />
          <Sun isTrueScale={isTrueScale} />
          <Planet transform={transform} sim={sim} showOrbits={showOrbits} />
          <Moon planetTransform={transform} sim={sim} isTrueScale={isTrueScale} showOrbits={showOrbits} cameraResetCount={cameraResetCount} />
        </Canvas>
      </Suspense>

      {/* Left-Edge Glassmorphic Sidebar Navigation & Docked Flyout Panels */}
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
    </div>
  );
}
