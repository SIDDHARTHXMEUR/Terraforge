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
import { SceneErrorBoundary } from './components/common/SceneErrorBoundary';
import { useQualityStore } from './state/useQualityStore';
import { CinematicPhotoMode } from './components/cinematic/CinematicPhotoMode';
import { EarthMapLibreViewer } from './components/cinematic/EarthMapLibreViewer';
import { useEarthSurfaceStore } from './state/useEarthSurfaceStore';

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

const SPEED_STEPS = [1, 5, 25, 100, 500];

export default function App() {
  // Check URL query parameters for deep linking
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const benchmarkMode = queryParams?.get('benchmark'); // 'v1' or 'enhanced'
  const isSafeMode = queryParams?.get('safe') === '1';
  const urlBody = queryParams?.get('body');
  const urlView = queryParams?.get('view');
  const urlTime = queryParams?.get('time');

  const [selectedBody, setSelectedBody] = useState(() => {
    if (urlBody && (KEY_TO_BODY[urlBody] || Object.values(KEY_TO_BODY).includes(urlBody.toLowerCase()))) {
      return urlBody.toLowerCase();
    }
    return 'overview';
  });

  const [viewMode, setViewMode] = useState(() => {
    if (urlView === 'scientific' || urlView === 'cinematic') return urlView;
    return 'cinematic';
  });

  const [isPaused, setIsPaused] = useState(() => {
    return urlTime === 'paused';
  });

  const [timeMultiplier, setTimeMultiplier] = useState(() => {
    if (urlTime && !isNaN(parseFloat(urlTime))) return parseFloat(urlTime);
    return 1.0;
  });

  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const { isSurfaceMode, setIsSurfaceMode } = useEarthSurfaceStore();

  useEffect(() => {
    if (queryParams?.get('street') === '1' || queryParams?.get('streetview') === '1') {
      setSelectedBody('earth');
      setIsSurfaceMode(true);
    }
  }, []);

  // Dynamic DPR from quality store
  const dpr = useQualityStore((s) => s.dpr);

  // LocalStorage-backed prologue state: skip on return visits or if deep link provided or in safe mode
  const [isPrologueActive, setIsPrologueActive] = useState(() => {
    if (isSafeMode || urlBody || urlView || urlTime) return false;
    try {
      return localStorage.getItem('terraforge_prologue_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const handleEndPrologue = () => {
    setIsPrologueActive(false);
    try {
      localStorage.setItem('terraforge_prologue_seen', 'true');
    } catch {}
  };

  const handleReplayIntro = () => {
    setSelectedBody('overview');
    setIsPrologueActive(true);
  };

  // Prologue Watchdog: strictly forces completion at 15s maximum
  useEffect(() => {
    if (!isPrologueActive) return;

    const watchdogTimer = setTimeout(() => {
      console.warn('[Prologue Watchdog] 15s limit reached - forcing prologue end state');
      handleEndPrologue();
    }, 15000);

    return () => clearTimeout(watchdogTimer);
  }, [isPrologueActive]);

  // Global Keyboard Shortcuts for interactive navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'Escape') {
        if (showHelpSheet) {
          setShowHelpSheet(false);
        } else {
          setSelectedBody('overview');
        }
      } else if (e.key === '?' || e.key === '/') {
        setShowHelpSheet((s) => !s);
      } else if (e.key === '[' || e.key === '{') {
        setTimeMultiplier((cur) => {
          const idx = SPEED_STEPS.indexOf(cur);
          if (idx > 0) return SPEED_STEPS[idx - 1];
          return SPEED_STEPS[0];
        });
      } else if (e.key === ']' || e.key === '}') {
        setTimeMultiplier((cur) => {
          const idx = SPEED_STEPS.indexOf(cur);
          if (idx !== -1 && idx < SPEED_STEPS.length - 1) return SPEED_STEPS[idx + 1];
          return SPEED_STEPS[SPEED_STEPS.length - 1];
        });
      } else if (e.key === 'o' || e.key === 'O') {
        setShowOrbits((v) => !v);
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLabels((v) => !v);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPhotoMode((m) => !m);
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
  }, [showHelpSheet]);

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
      {/* Safe Mode Indicator Badge */}
      {isSafeMode && (
        <div className="absolute top-4 left-6 z-50 bg-amber-500/20 border border-amber-500/50 backdrop-blur-md px-3 py-1.5 rounded-full font-mono text-[11px] text-amber-300 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>SAFE MODE ACTIVE (?safe=1) &mdash; Minimal 3D Scene</span>
        </div>
      )}

      {/* 1. Interactive 3D WebGL Solar System Canvas with Error Boundary */}
      <SceneErrorBoundary>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
          dpr={dpr}
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
            position: [-320, 110, 310]
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
              onCompletePrologue={handleEndPrologue}
              isSafeMode={isSafeMode}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* 2. Directed Christopher Nolan Prologue Overlay (Letterbox + Anamorphic Flare + Title) */}
      {!isSafeMode && (
        <CinematicPrologueOverlay
          isActive={isPrologueActive}
          onSkip={handleEndPrologue}
        />
      )}

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
        uiVisible={!isPrologueActive && !isPhotoMode && uiVisible}
        setUiVisible={setUiVisible}
        onResetCamera={handleResetCamera}
        onReplayIntro={handleReplayIntro}
        showHelpSheet={showHelpSheet}
        setShowHelpSheet={setShowHelpSheet}
      />

      {/* 5. Professional Cinematic Astrophotography Mode */}
      <CinematicPhotoMode
        isActive={isPhotoMode}
        onClose={() => setIsPhotoMode(false)}
      />

      {/* 6. MapLibre OSM Vector & Mapillary 360° Street View Overlay */}
      <EarthMapLibreViewer
        isActive={selectedBody === 'earth' && isSurfaceMode}
        onClose={() => setIsSurfaceMode(false)}
      />
    </div>
  );
}
