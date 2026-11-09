import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  window.THREE = THREE;
}
import { InteractiveSimulatorHUD } from './components/cinematic/InteractiveSimulatorHUD';
import { CinematicPrologueOverlay } from './components/cinematic/CinematicPrologueOverlay';
import { EarthBaselineComparator } from './components/test/EarthBaselineComparator';
import { DeepSpaceSkybox } from './components/cinematic/DeepSpaceSkybox';
import { OrbitControls } from '@react-three/drei';
import { EarthMapLibreViewer } from './components/cinematic/EarthMapLibreViewer';
import { useEarthSurfaceStore } from './state/useEarthSurfaceStore';
import { LandingPage } from './components/landing/LandingPage';
import { UnifiedSolarEngine } from './components/cinematic/UnifiedSolarEngine';
import { RefinedPreloader } from './components/common/RefinedPreloader';

const CELESTIAL_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

function parseHashRoute() {
  if (typeof window === 'undefined') return { mode: 'landing', planet: null };
  const hash = window.location.hash || '';
  if (hash.startsWith('#/sim')) {
    const raw = hash.slice(5).replace(/^\//, '').toLowerCase().trim();
    return {
      mode: 'sim',
      planet: raw || 'overview'
    };
  }
  return { mode: 'landing', planet: null };
}

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
  const [route, setRoute] = useState(parseHashRoute);
  const [selectedBody, setSelectedBody] = useState(() => {
    const init = parseHashRoute();
    return init.mode === 'sim' && init.planet ? init.planet : 'overview';
  });
  const [viewMode, setViewMode] = useState('cinematic'); // 'cinematic' or 'scientific'
  const [isPaused, setIsPaused] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1.0);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const isMapLibreActive = useEarthSurfaceStore((s) => s.isMapLibreActive);
  const setIsMapLibreActive = useEarthSurfaceStore((s) => s.setIsMapLibreActive);

  // Landing page scroll tracking & persistent asset warmer state
  const scrollProgressRef = useRef(0);
  const [preloaderProgress, setPreloaderProgress] = useState(25);
  const [isPreloaderReady, setIsPreloaderReady] = useState(false);

  // Fail-safe preloader dismiss: guaranteed never to block screen longer than 800ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreloaderReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Sync hash routing changes
  useEffect(() => {
    const handleHash = () => {
      const r = parseHashRoute();
      setRoute(r);
      if (r.mode === 'sim') {
        setSelectedBody(r.planet || 'overview');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectBody = (body) => {
    setSelectedBody(body);
    if (typeof window !== 'undefined' && route.mode === 'sim') {
      const targetHash = body === 'overview' ? '#/sim' : `#/sim/${body}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }
  };

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
    <div className="relative w-screen h-screen bg-[#04060B] overflow-hidden font-sans select-none">
      {/* 1. Refined Preloader: League Gothic wordmark + 1px progress line */}
      <RefinedPreloader progress={preloaderProgress} isReady={isPreloaderReady} />

      {/* 2. Persistent 3D WebGL Solar System Canvas (Lives continuously through #/ and #/sim) */}
      <SceneErrorBoundary>
        <Canvas
          className="w-full h-full cursor-grab active:cursor-grabbing bg-[#04060B]"
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
            position: route.mode === 'sim' ? [-300, 165, 290] : [0, 1.2, 5.0]
          }}
          onPointerDown={() => setIsUserInteracting(true)}
          onPointerUp={() => setIsUserInteracting(false)}
        >
          <Suspense fallback={null}>
            <UnifiedSolarEngine
              route={route}
              selectedBody={selectedBody}
              viewMode={viewMode}
              timeMultiplier={timeMultiplier}
              isPaused={isPaused || isMapLibreActive}
              showOrbits={!isMapLibreActive && showOrbits}
              showLabels={!isPrologueActive && !isMapLibreActive && showLabels}
              onSelectBody={handleSelectBody}
              isUserInteracting={isUserInteracting}
              scrollProgressRef={scrollProgressRef}
              onWarmupProgress={(pct) => setPreloaderProgress(pct)}
              onFirstRender={() => setIsPreloaderReady(true)}
            />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* 3. Landing Page DOM Overlay (Active when route.mode === 'landing') */}
      <LandingPage
        scrollProgressRef={scrollProgressRef}
        visible={route.mode === 'landing'}
        onNavigateSim={(hash) => {
          window.location.hash = hash;
        }}
      />

      {/* 4. Fullscreen MapLibre 3D Vector Map & Mapillary Street View */}
      <EarthMapLibreViewer
        isActive={isMapLibreActive}
        onClose={() => setIsMapLibreActive(false)}
      />

      {/* 5. Directed Christopher Nolan Prologue Overlay (Letterbox + Anamorphic Flare + Title) */}
      <CinematicPrologueOverlay
        isActive={route.mode === 'sim' && isPrologueActive}
        onSkip={handleCompletePrologue}
      />

      {/* 6. Interactive Solar Simulator HUD (Active when route.mode === 'sim') */}
      <InteractiveSimulatorHUD
        selectedBody={selectedBody}
        onSelectBody={handleSelectBody}
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
        uiVisible={route.mode === 'sim' && !isPrologueActive && !isMapLibreActive && uiVisible}
        setUiVisible={setUiVisible}
        onResetCamera={handleResetCamera}
        onReplayIntro={handleReplayIntro}
      />
    </div>
  );
}
