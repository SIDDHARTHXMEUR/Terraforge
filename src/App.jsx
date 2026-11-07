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
import { EarthMapLibreViewer } from './components/cinematic/EarthMapLibreViewer';
import { useEarthSurfaceStore } from './state/useEarthSurfaceStore';

const CELESTIAL_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

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

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Terraforge Scene Error]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-6 z-50 font-mono text-center">
          <div className="text-amber-400 text-sm tracking-widest uppercase mb-2">Graphics Engine Notice</div>
          <div className="text-white/60 text-xs max-w-md mb-6">{this.state.error?.message || 'Rendering error encountered in 3D scene.'}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-white/30 text-xs tracking-widest uppercase hover:bg-white/10 transition-colors"
          >
            Reload Simulator
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [selectedBody, setSelectedBody] = useState('overview');
  const [viewMode, setViewMode] = useState('cinematic'); // 'cinematic' or 'scientific'
  const [isPaused, setIsPaused] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1.0);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const isMapLibreActive = useEarthSurfaceStore((s) => s.isMapLibreActive);
  const setIsMapLibreActive = useEarthSurfaceStore((s) => s.setIsMapLibreActive);

  // Check URL query parameters for benchmark mode
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const benchmarkMode = queryParams?.get('benchmark'); // 'v1' or 'enhanced'

  // Prologue plays on first visit only (localStorage)
  const [isPrologueActive, setIsPrologueActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    const seen = localStorage.getItem('terraforge_prologue_seen');
    return seen !== 'true';
  });

  const handleCompletePrologue = () => {
    setIsPrologueActive(false);
    try {
      localStorage.setItem('terraforge_prologue_seen', 'true');
    } catch (_) {}
  };

  const handleReplayIntro = () => {
    setIsPrologueActive(true);
  };

  // 15s maximum watchdog forces end state on any error or timeout
  useEffect(() => {
    if (!isPrologueActive) return;
    const watchdog = setTimeout(() => {
      console.warn('[Terraforge Watchdog] 15s timeout reached, forcing prologue end state.');
      handleCompletePrologue();
    }, 15000);
    return () => clearTimeout(watchdog);
  }, [isPrologueActive]);

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
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedBody((current) => {
          const idx = CELESTIAL_ORDER.indexOf(current);
          if (idx === -1 || idx === 0) return CELESTIAL_ORDER[CELESTIAL_ORDER.length - 1];
          return CELESTIAL_ORDER[idx - 1];
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedBody((current) => {
          const idx = CELESTIAL_ORDER.indexOf(current);
          if (idx === -1 || idx === CELESTIAL_ORDER.length - 1) return CELESTIAL_ORDER[0];
          return CELESTIAL_ORDER[idx + 1];
        });
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
      {/* 1. Interactive 3D WebGL Solar System Canvas with Error Boundary */}
      <SceneErrorBoundary>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-black"
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
          dpr={[1, 1.5]}
          frameloop={isMapLibreActive ? 'never' : 'always'}
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
              isPaused={isPaused || isMapLibreActive}
              showOrbits={!isPrologueActive && !isMapLibreActive && showOrbits}
              showLabels={!isPrologueActive && !isMapLibreActive && showLabels}
              onSelectBody={setSelectedBody}
              isUserInteracting={isUserInteracting}
              isPrologueActive={isPrologueActive}
              onCompletePrologue={handleCompletePrologue}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* 2. Fullscreen MapLibre 3D Vector Map & Mapillary Street View */}
      <EarthMapLibreViewer
        isActive={isMapLibreActive}
        onClose={() => setIsMapLibreActive(false)}
      />

      {/* 3. Directed Christopher Nolan Prologue Overlay (Letterbox + Anamorphic Flare + Title) */}
      <CinematicPrologueOverlay
        isActive={isPrologueActive}
        onSkip={handleCompletePrologue}
      />

      {/* 3. Loading Gate */}
      <Suspense fallback={<div className="absolute inset-0 bg-black flex items-center justify-center text-white/50 font-mono text-xs tracking-[0.3em]">INITIALIZING SIMULATION...</div>}>
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
        uiVisible={!isPrologueActive && !isMapLibreActive && uiVisible}
        setUiVisible={setUiVisible}
        onResetCamera={handleResetCamera}
        onReplayIntro={handleReplayIntro}
      />
    </div>
  );
}
