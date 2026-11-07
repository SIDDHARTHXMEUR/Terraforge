import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SolarSystemEngine } from './components/cinematic/SolarSystemEngine';
import { InteractiveSimulatorHUD } from './components/cinematic/InteractiveSimulatorHUD';
import { CinematicPrologueOverlay } from './components/cinematic/CinematicPrologueOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { EarthBaselineComparator } from './components/test/EarthBaselineComparator';
import { DeepSpaceSkybox } from './components/cinematic/DeepSpaceSkybox';
import { OrbitControls } from '@react-three/drei';

const KEY_TO_BODY = {
  '1': 'sun',
  '2': 'mercury',
  '3': 'venus',
  '4': 'earth',
  '5': 'mars',
  '6': 'asteroids',
  '7': 'jupiter',
  '8': 'saturn',
  '9': 'uranus',
  '0': 'neptune'
};

export default function App() {
  const [selectedBody, setSelectedBody] = useState('overview');
  const [viewMode, setViewMode] = useState('cinematic'); // 'cinematic' or 'scientific'
  const [isPaused, setIsPaused] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1.0);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isPrologueActive, setIsPrologueActive] = useState(true);

  // Check URL query parameters for Earth visual benchmark
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const benchmarkMode = queryParams?.get('benchmark'); // 'v1' or 'enhanced'

  // Global Keyboard Shortcuts for interactive navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        setSelectedBody('overview');
      } else if (e.key === 'o' || e.key === 'O') {
        setShowOrbits((v) => !v);
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLabels((v) => !v);
      } else if (e.key === 'h' || e.key === 'H') {
        setUiVisible((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'r' || e.key === 'R') {
        setSelectedBody('overview');
      } else if (KEY_TO_BODY[e.key]) {
        setSelectedBody(KEY_TO_BODY[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetCamera = () => {
    setSelectedBody('overview');
  };

  // Dedicated Fixed-Camera Benchmark Test Harness for Quality Gate Phase 1
  if (benchmarkMode) {
    return (
      <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
        <div className="absolute top-4 left-6 z-30 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 font-mono text-xs text-white">
          <span>BENCHMARK MODE: </span>
          <span className="text-cyan-400 font-bold uppercase">{benchmarkMode === 'v1' ? 'Version 1.0 Baseline' : 'Enhanced Cinematic Earth'}</span>
        </div>
        <Canvas
          className="w-full h-full bg-black"
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15
          }}
          camera={{ fov: 42, near: 0.1, far: 20000, position: [0, 1.2, 5.2] }}
        >
          <Suspense fallback={null}>
            <DeepSpaceSkybox />
            <EarthBaselineComparator mode={benchmarkMode === 'v1' ? 'version1' : 'enhanced'} />
            <OrbitControls enableDamping dampingFactor={0.05} />
          </Suspense>
        </Canvas>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* 1. Interactive 3D WebGL Solar System Canvas */}
      <Canvas
        className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
        style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
        gl={{
          antialias: true,
          alpha: false,
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 25000,
          position: [0, 140, 220]
        }}
        onPointerDown={() => setIsUserInteracting(true)}
        onPointerUp={() => setIsUserInteracting(false)}
      >
        <Suspense fallback={null}>
          <SolarSystemEngine
            selectedBody={selectedBody}
            viewMode={viewMode}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            showOrbits={!isPrologueActive && showOrbits}
            showLabels={!isPrologueActive && showLabels}
            onSelectBody={setSelectedBody}
            isUserInteracting={isUserInteracting}
            isPrologueActive={isPrologueActive}
            onCompletePrologue={() => setIsPrologueActive(false)}
          />
        </Suspense>
      </Canvas>

      {/* 2. Directed Christopher Nolan Prologue Overlay (Letterbox + Anamorphic Flare + Title) */}
      <CinematicPrologueOverlay
        isActive={isPrologueActive}
        onSkip={() => setIsPrologueActive(false)}
      />

      {/* 3. Loading Gate */}
      <Suspense fallback={<LoadingScreen />}>
        {/* Drei texture preloader hook fallback */}
      </Suspense>

      {/* 4. Interactive Solar Simulator HUD */}
      <InteractiveSimulatorHUD
        selectedBody={selectedBody}
        onSelectBody={setSelectedBody}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        timeMultiplier={timeMultiplier}
        setTimeMultiplier={setTimeMultiplier}
        showOrbits={showOrbits}
        setShowOrbits={setShowOrbits}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        uiVisible={!isPrologueActive && uiVisible}
        setUiVisible={setUiVisible}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
}
