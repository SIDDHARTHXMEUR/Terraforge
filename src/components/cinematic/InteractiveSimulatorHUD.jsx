import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Orbit,
  Tag,
  ChevronRight
} from 'lucide-react';
import { PLANETS_CONFIG } from '../../data/planetsData';
import { useEarthSurfaceStore } from '../../state/useEarthSurfaceStore';

const CELESTIAL_LIST = [
  { id: 'overview', name: 'Overview' },
  { id: 'sun', name: 'Sol' },
  { id: 'mercury', name: 'Mercury' },
  { id: 'venus', name: 'Venus' },
  { id: 'earth', name: 'Earth' },
  { id: 'mars', name: 'Mars' },
  { id: 'jupiter', name: 'Jupiter' },
  { id: 'saturn', name: 'Saturn' },
  { id: 'uranus', name: 'Uranus' },
  { id: 'neptune', name: 'Neptune' }
];

const CELESTIAL_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
function formatDayLength(hours) {
  if (hours === undefined || hours === null) return 'N/A';
  const abs = Math.abs(hours);
  const isRet = hours < 0;
  if (abs >= 48) {
    return `${(abs / 24).toFixed(1)} DAYS${isRet ? ' (RET)' : ''}`;
  }
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${h}H ${m}M${isRet ? ' (RET)' : ''}`;
}

const SPEED_PRESETS = [1, 5, 25, 100, 500];

const PLANET_ACCENTS = {
  sun: '#FFB347',
  mercury: '#B8B2A7',
  venus: '#E8D08A',
  earth: '#5BB8FF',
  mars: '#E2673A',
  asteroids: '#C0A080',
  jupiter: '#D9A066',
  saturn: '#E8D08A',
  uranus: '#4FD1C5',
  neptune: '#5BB8FF'
};

const PLANET_MICRO_LABELS = {
  sun: '01 / HOST STAR',
  mercury: '02 / INNER SYSTEM',
  venus: '03 / SHROUDED WORLD',
  earth: '04 / HABITABLE WORLD',
  mars: '05 / RED PLANET',
  asteroids: '06 / DEBRIS BELT',
  jupiter: '07 / GAS GIANT',
  saturn: '08 / RINGED GIANT',
  uranus: '09 / ICE GIANT',
  neptune: '10 / OUTER REACHES'
};

const PLANET_TYPES = {
  sun: 'YELLOW DWARF',
  mercury: 'TERRESTRIAL',
  venus: 'TERRESTRIAL',
  earth: 'TERRESTRIAL',
  mars: 'TERRESTRIAL',
  asteroids: 'MINOR PLANET',
  jupiter: 'GAS GIANT',
  saturn: 'GAS GIANT',
  uranus: 'ICE GIANT',
  neptune: 'ICE GIANT'
};

export function InteractiveSimulatorHUD({
  selectedBody = 'overview',
  onSelectBody,
  viewMode = 'cinematic',
  setViewMode,
  isPaused = false,
  setIsPaused,
  timeMultiplier = 1.0,
  setTimeMultiplier,
  showOrbits = true,
  setShowOrbits,
  showLabels = true,
  setShowLabels,
  uiVisible = true,
  setUiVisible,
  onResetCamera,
  onReplayIntro,
  onGoHome
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetailLayer, setShowDetailLayer] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [simDate, setSimDate] = useState(() => Date.now());

  // Simulation time progression
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSimDate((prev) => prev + 1000 * timeMultiplier);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, timeMultiplier]);

  const handleResetToNow = () => {
    setSimDate(Date.now());
  };

  const formattedSimDate = new Date(simDate).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Auto-hide UI during inactivity (5 seconds)
  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, 5000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const goToPrev = () => {
    const idx = CELESTIAL_ORDER.indexOf(selectedBody);
    const prev = idx <= 0 ? CELESTIAL_ORDER[CELESTIAL_ORDER.length - 1] : CELESTIAL_ORDER[idx - 1];
    onSelectBody(prev);
  };

  const goToNext = () => {
    const idx = CELESTIAL_ORDER.indexOf(selectedBody);
    const next = idx === -1 || idx >= CELESTIAL_ORDER.length - 1 ? CELESTIAL_ORDER[0] : CELESTIAL_ORDER[idx + 1];
    onSelectBody(next);
  };

  const {
    isSurfaceMode,
    altitudeKm,
    focusedLocation,
    tier2Status,
    tier2ErrorReason,
    triggerFlyTo,
    triggerReturnToOrbit
  } = useEarthSurfaceStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__triggerFlyTo = triggerFlyTo;
      window.__triggerReturnToOrbit = triggerReturnToOrbit;
    }
  }, [triggerFlyTo, triggerReturnToOrbit]);

  const selectedData = PLANETS_CONFIG[selectedBody];

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-6 sm:p-8 font-sans transition-opacity duration-700 ${
        !uiVisible ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER: LEAGUE GOTHIC WORDMARK + NAVIGATION                     */}
      {/* --------------------------------------------------------------------- */}
      <header className="w-full flex items-center justify-between gap-6 pointer-events-auto whitespace-nowrap overflow-x-auto py-1">
        {/* Brand & Simulation Live Indicator */}
        <div className="flex items-center space-x-3 text-white/90 shrink-0">
          <button
            onClick={() => {
              if (onGoHome) onGoHome();
              else window.location.hash = '#/';
            }}
            className="font-wordmark text-3xl sm:text-4xl text-[#FFF8E7] tracking-[0.05em] uppercase leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] hover:text-white transition-colors cursor-pointer"
            title="Return to Home Landing"
          >
            TERRAFORGE
          </button>
          <span className="text-white/20">/</span>
          <button
            onClick={() => {
              if (onGoHome) onGoHome();
              else window.location.hash = '#/';
            }}
            className="text-[11px] font-sans text-white/60 hover:text-white tracking-[0.2em] uppercase transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            HOME
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-2"></span>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
            {isPaused ? 'PAUSED' : `${timeMultiplier}X LIVE`}
          </span>
        </div>

        {/* Minimalist Top Celestial Navigation Strip */}
        <nav className="flex items-center space-x-3 sm:space-x-4 text-[12px] font-sans tracking-[0.15em] uppercase shrink-0">
          {CELESTIAL_LIST.map(({ id, name }) => {
            const isActive = selectedBody === id;
            return (
              <button
                key={id}
                onClick={() => onSelectBody(id)}
                title={`Focus on ${name}`}
                className={`transition-all duration-200 cursor-pointer shrink-0 pb-0.5 border-b ${
                  isActive
                    ? 'text-white border-white font-medium'
                    : 'text-white/40 hover:text-white/80 border-transparent'
                }`}
              >
                {name}
              </button>
            );
          })}
        </nav>

        {/* View Mode (CINEMATIC / SCIENTIFIC) & Controls */}
        <div className="flex items-center space-x-4 shrink-0 text-[11px] font-mono tracking-[0.2em] uppercase">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (import.meta.env.DEV && typeof window !== 'undefined') {
                  window.__lastToggleClick = { type: 'viewMode', time: performance.now(), target: 'cinematic' };
                }
                if (setViewMode) setViewMode('cinematic');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
              title="Switch to Cinematic Camera & Scaling"
              className={`pb-0.5 border-b cursor-pointer transition-all ${
                viewMode === 'cinematic'
                  ? 'text-white border-white font-medium'
                  : 'text-white/40 hover:text-white/80 border-transparent'
              }`}
            >
              CINEMATIC
            </button>
            <button
              onClick={() => {
                if (import.meta.env.DEV && typeof window !== 'undefined') {
                  window.__lastToggleClick = { type: 'viewMode', time: performance.now(), target: 'scientific' };
                }
                if (setViewMode) setViewMode('scientific');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
              title="Switch to Scientific Scale & Proportions"
              className={`pb-0.5 border-b cursor-pointer transition-all ${
                viewMode === 'scientific'
                  ? 'text-white border-white font-medium'
                  : 'text-white/40 hover:text-white/80 border-transparent'
              }`}
            >
              SCIENTIFIC
            </button>
          </div>

          {/* Quick utility icons with descriptive tooltips */}
          <div className="flex items-center space-x-2.5 text-white/40">
            <button
              onClick={() => setUiVisible((v) => !v)}
              className="hover:text-white transition-colors cursor-pointer"
              title="Toggle Clean View / Hide UI (H)"
            >
              {uiVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. REFINED PLANETARY INFO BLOCK (No boxes / No borders / Zero pills)  */}
      {/* --------------------------------------------------------------------- */}
      {selectedData && selectedBody !== 'overview' && (() => {
        const accentColor = PLANET_ACCENTS[selectedBody] || '#4FD1C5';
        const microLabel = PLANET_MICRO_LABELS[selectedBody] || selectedData.category || 'CELESTIAL BODY';
        const distAu = selectedData.semiMajorAxisAU !== undefined
          ? selectedData.semiMajorAxisAU
          : (selectedData.semiMajorAxisAu !== undefined ? selectedData.semiMajorAxisAu : 0);
        const distStr = distAu === 0 ? '0.00 AU' : `${distAu.toFixed(2)} AU`;
        const lightTimeStr = distAu === 0 ? '0.00 S' : `${(distAu * 499.0 / 60.0).toFixed(1)} MINS`;
        const yearStr = selectedData.orbitalPeriodDays ? `${selectedData.orbitalPeriodDays} D` : 'HOST STAR';
        const typeStr = PLANET_TYPES[selectedBody] || selectedData.category || 'TERRESTRIAL';

        return (
          <main
            key={selectedBody}
            className="planet-blur-transition max-w-xl pointer-events-auto transition-all my-auto pl-2 sm:pl-4"
          >
            {/* Ambient backdrop scrim for readability over bright limb areas */}
            <div className="relative">
              <div className="absolute -inset-4 bg-black/25 backdrop-blur-[2px] rounded-2xl -z-10 pointer-events-none" />

              {/* Hierarchy Level 1: Micro-label with accent dot */}
              <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <span>{microLabel}</span>
              </div>

              {/* Hierarchy Level 2: Large serif name (Cormorant Garamond) */}
              <h1 className="font-serif text-5xl sm:text-7xl font-normal tracking-[0.14em] text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-tight">
                {selectedData.name}
              </h1>

              {/* Hierarchy Level 3: 1px accent rule */}
              <div className="w-10 h-[1px] my-3.5" style={{ backgroundColor: accentColor }} />

              {/* Hierarchy Level 4: 1 to 2 sentences of copy */}
              <p className="font-sans text-[13px] sm:text-[14px] text-white/80 leading-relaxed font-light max-w-lg mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {selectedData.description || selectedData.tagline}
              </p>

              {/* Hierarchy Level 5: SpaceX-style 4-column stats strip separated by 1px vertical hairlines */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-b border-white/10 py-3 my-4 gap-y-3 sm:gap-y-0">
                <div className="pr-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block mb-1">DISTANCE FROM SUN</span>
                  <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: accentColor }}>
                    {distStr}
                  </span>
                  <span className="font-mono text-[9px] text-white/40 block mt-0.5">{lightTimeStr}</span>
                </div>
                <div className="px-3 border-l border-white/10">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block mb-1">DIAMETER</span>
                  <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: accentColor }}>
                    {selectedData.radiusKm ? `${Math.round(selectedData.radiusKm * 2).toLocaleString()} KM` : 'N/A'}
                  </span>
                  <span className="font-mono text-[9px] text-white/40 block mt-0.5">{typeStr}</span>
                </div>
                <div className="px-3 border-l border-white/10">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block mb-1">LENGTH OF DAY</span>
                  <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: accentColor }}>
                    {formatDayLength(selectedData.rotationPeriodHours)}
                  </span>
                </div>
                <div className="pl-3 border-l border-white/10">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block mb-1">ORBITAL PERIOD</span>
                  <span className="font-mono text-xs sm:text-sm tracking-wider" style={{ color: accentColor }}>
                    {yearStr}
                  </span>
                </div>
              </div>

              {/* Hierarchy Level 6: Action buttons and Technical Specification */}
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => {
                    if (selectedBody === 'earth' && useEarthSurfaceStore.getState().openMapAtLocation) {
                      useEarthSurfaceStore.getState().openMapAtLocation(40.7128, -74.006, 'New York');
                    } else {
                      setShowDetailLayer(!showDetailLayer);
                    }
                  }}
                  className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#4FD1C5] hover:text-cyan-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                  title={`Explore ${selectedData.name}`}
                >
                  <span>{selectedBody === 'earth' ? 'SURFACE MAP >' : (showDetailLayer ? 'HIDE SPECS ▲' : 'TECH SPECS ▼')}</span>
                </button>
                <button
                  onClick={() => onSelectBody('overview')}
                  className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Return to System Overview (Esc)"
                >
                  OVERVIEW
                </button>
              </div>

              {/* SpaceX Aerospace Technical Specification Grid */}
              {showDetailLayer && (
                <div className="mt-4 p-4 border border-white/10 bg-black/60 backdrop-blur-md text-xs font-mono max-w-lg rounded-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-white/50">TECHNICAL SPECIFICATION // JPL FACT SHEET</span>
                    <button
                      onClick={() => setShowDetailLayer(false)}
                      className="text-[9px] text-white/40 hover:text-white uppercase tracking-widest cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px]">
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block mb-0.5">SURFACE GRAVITY</span>
                      <span className="text-white/90">{selectedData.gravity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block mb-0.5">MEAN TEMPERATURE</span>
                      <span className="text-white/90">{selectedData.meanTempC !== undefined ? `${selectedData.meanTempC}°C` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block mb-0.5">AXIAL TILT</span>
                      <span className="text-white/90">{selectedData.axialTiltDeg !== undefined ? `${selectedData.axialTiltDeg}°` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block mb-0.5">MASS</span>
                      <span className="text-white/90 truncate block">{selectedData.mass || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-white/10">
                      <span className="text-[9px] text-white/40 uppercase block mb-0.5">ATMOSPHERIC COMPOSITION</span>
                      <span className="text-white/80 text-[10px] leading-relaxed block">{selectedData.atmosphereComposition || 'Trace exosphere / vacuum'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        );
      })()}

      {/* Surface Mode Attribution Centered Above Bottom Controls */}
      {selectedBody === 'earth' && isSurfaceMode && (
        <div className="w-full text-center text-[10px] font-mono tracking-widest text-white/45 mb-2 pointer-events-none">
          Imagery: NASA GIBS · Sentinel-2 cloudless by EOX · 3D Tiles: Google via Cesium ion
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. BOTTOM TRANSPORT & CONTROLS (Tooltips, Sim Time + "Now" Button)   */}
      {/* --------------------------------------------------------------------- */}
      <footer className="w-full flex items-center justify-between gap-4 pointer-events-auto flex-wrap sm:flex-nowrap">
        {/* Playback, Multiplier & Live Simulation Clock */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title="Pause / Resume (Space)"
            className="flex items-center space-x-1.5 text-white/80 hover:text-white transition-colors cursor-pointer tracking-wider"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="uppercase text-[10px]">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Speed Presets with Tooltips */}
          <div className="flex items-center space-x-2 text-[10px] tracking-wider text-white/40">
            {SPEED_PRESETS.map((multiplier) => {
              const isActive = timeMultiplier === multiplier && !isPaused;
              return (
                <button
                  key={multiplier}
                  onClick={() => {
                    setTimeMultiplier(multiplier);
                    if (isPaused) setIsPaused(false);
                  }}
                  title={`Set Simulation Speed to ${multiplier}X`}
                  className={`transition-colors cursor-pointer ${
                    isActive ? 'text-white font-medium underline' : 'hover:text-white/80'
                  }`}
                >
                  {multiplier}X
                </button>
              );
            })}
          </div>

          <span className="text-white/20 hidden md:inline">|</span>

          {/* Simulation Date and Time with "Now" button */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">SIM TIME</span>
            <span className="font-mono text-white/95 text-[11px] tracking-wider">{formattedSimDate}</span>
            <button
              onClick={handleResetToNow}
              className="text-[10px] font-mono tracking-wider uppercase text-cyan-400 hover:text-cyan-200 border border-cyan-400/40 hover:border-cyan-400 px-1.5 py-0.5 transition-colors cursor-pointer"
              title="Reset simulation time to current live date/time (Now)"
            >
              NOW
            </button>
          </div>
        </div>

        {/* View Toggles & Reset with Tooltips */}
        <div className="flex items-center space-x-4 text-[10px] font-mono tracking-wider text-white/40">
          <button
            onClick={() => {
              if (import.meta.env.DEV && typeof window !== 'undefined') {
                window.__lastToggleClick = { type: 'orbits', time: performance.now(), target: !showOrbits };
              }
              setShowOrbits(!showOrbits);
            }}
            title="Toggle Orbital Trajectories (O)"
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showOrbits ? 'text-white/90' : 'hover:text-white/70'
            }`}
          >
            <Orbit className="w-3 h-3 text-cyan-400/80" />
            <span className="uppercase">ORBITS ({showOrbits ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={() => {
              if (import.meta.env.DEV && typeof window !== 'undefined') {
                window.__lastToggleClick = { type: 'labels', time: performance.now(), target: !showLabels };
              }
              setShowLabels(!showLabels);
            }}
            title="Toggle Celestial Labels (L)"
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showLabels ? 'text-white/90' : 'hover:text-white/70'
            }`}
          >
            <Tag className="w-3 h-3 text-amber-400/80" />
            <span className="uppercase">LABELS ({showLabels ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={onResetCamera}
            title="Reset Camera to Overview (Esc or R)"
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="uppercase">RESET CAMERA</span>
          </button>

          <a
            href="#/"
            title="Return to Landing Page"
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span className="uppercase">HOME</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
