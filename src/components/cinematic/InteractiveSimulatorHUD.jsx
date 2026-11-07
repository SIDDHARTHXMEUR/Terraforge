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

const CELESTIAL_LIST = [
  { id: 'overview', name: 'Overview', num: '0' },
  { id: 'sun', name: 'Sol', num: '1' },
  { id: 'mercury', name: 'Mercury', num: '2' },
  { id: 'venus', name: 'Venus', num: '3' },
  { id: 'earth', name: 'Earth', num: '4' },
  { id: 'mars', name: 'Mars', num: '5' },
  { id: 'asteroids', name: 'Ceres', num: '6' },
  { id: 'jupiter', name: 'Jupiter', num: '7' },
  { id: 'saturn', name: 'Saturn', num: '8' },
  { id: 'uranus', name: 'Uranus', num: '9' },
  { id: 'neptune', name: 'Neptune', num: '0' }
];

const SPEED_PRESETS = [1, 5, 25, 100, 500];

export function InteractiveSimulatorHUD({
  selectedBody = 'overview',
  onSelectBody,
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
  onResetCamera
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // Auto-hide UI during mouse inactivity (4 seconds)
  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, 4000);
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

  const selectedData = PLANETS_CONFIG[selectedBody] || (selectedBody === 'asteroids' ? {
    id: 'asteroids',
    name: 'Asteroid Belt & Ceres',
    category: 'Circumstellar Torus',
    tagline: 'Proto-planetary accretion remnants anchored by dwarf planet Ceres',
    radiusKm: 473,
    gravity: '0.28 m/s²',
    meanTempC: -106,
    orbitalPeriodDays: 1682,
    atmosphereComposition: 'Vacuum / Trace water-vapor plumes on Ceres',
    description: 'A vast circumstellar torus of rocky carbonaceous chondrites and metal fragments extending between 2.2 and 3.2 AU, gravitationally bounded by Jupiter and the Sun.'
  } : null);

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-6 sm:p-10 transition-opacity duration-700 ${
        !uiVisible || isIdle ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & CELESTIAL NAV BAR (Swiss Editorial Typography)         */}
      {/* --------------------------------------------------------------------- */}
      <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto">
        {/* Brand & Simulation Telemetry */}
        <div className="flex items-center space-x-3 text-white/90">
          <span className="text-xs font-light tracking-[0.3em] uppercase">
            TERRAFORGE
          </span>
          <span className="text-white/20">/</span>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/60 uppercase">
            SOLAR SYSTEM SIMULATOR
          </span>
          <span className="w-1 h-1 rounded-full bg-emerald-400/80 animate-pulse"></span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-400/90 uppercase">
            {isPaused ? 'PAUSED' : `${timeMultiplier}X LIVE`}
          </span>
        </div>

        {/* Minimalist Top Celestial Strip (Typography Over Scene) */}
        <nav className="flex items-center space-x-3 sm:space-x-5 text-[11px] font-mono tracking-[0.18em] uppercase overflow-x-auto max-w-full py-1">
          {CELESTIAL_LIST.map(({ id, name }) => {
            const isActive = selectedBody === id;
            return (
              <button
                key={id}
                onClick={() => onSelectBody(id)}
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

        {/* View Mode Icons */}
        <div className="hidden sm:flex items-center space-x-3 text-white/40">
          <button
            onClick={() => setUiVisible((v) => !v)}
            className="hover:text-white transition-colors cursor-pointer"
            title="Toggle UI (H)"
          >
            {uiVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="hover:text-white transition-colors cursor-pointer"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. HERO PLANETARY TYPOGRAPHY (Zero Boxes / Zero Cards)                 */}
      {/* --------------------------------------------------------------------- */}
      {selectedData && selectedBody !== 'overview' && (
        <main className="max-w-md sm:max-w-lg pointer-events-auto transition-all duration-500 my-auto">
          {/* Celestial Classification */}
          <div className="text-[10px] font-mono tracking-[0.28em] text-white/50 uppercase mb-1.5 flex items-center space-x-2">
            <span>{selectedData.category || 'CELESTIAL BODY'}</span>
            <span className="text-white/20">·</span>
            <span>TARGET 0{CELESTIAL_LIST.find((c) => c.id === selectedBody)?.num || '1'}</span>
          </div>

          {/* Monumental Planet Title */}
          <h1 className="text-4xl sm:text-6xl font-extralight tracking-[0.32em] text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            {selectedData.name}
          </h1>

          {/* Tagline */}
          <p className="text-xs font-mono tracking-[0.16em] text-white/60 uppercase mt-2 mb-6">
            {selectedData.tagline}
          </p>

          {/* Astrophysical Telemetry Grid (Typographic List) */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono border-t border-b border-white/10 py-4 mb-5">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">MEAN RADIUS</div>
              <div className="text-white/90 text-sm font-light mt-0.5 tracking-wider">
                {selectedData.radiusKm ? `${selectedData.radiusKm.toLocaleString()} KM` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">SURFACE GRAVITY</div>
              <div className="text-white/90 text-sm font-light mt-0.5 tracking-wider">
                {selectedData.gravity || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">MEAN TEMPERATURE</div>
              <div className="text-white/90 text-sm font-light mt-0.5 tracking-wider">
                {selectedData.meanTempC !== undefined ? `${selectedData.meanTempC}°C` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">ORBITAL PERIOD</div>
              <div className="text-white/90 text-sm font-light mt-0.5 tracking-wider">
                {selectedData.orbitalPeriodDays ? `${selectedData.orbitalPeriodDays} D` : 'CENTER'}
              </div>
            </div>
          </div>

          {/* Atmospheric Composition */}
          {selectedData.atmosphereComposition && (
            <div className="text-[10px] font-mono tracking-wider text-white/70 mb-4">
              <span className="text-white/40 uppercase tracking-[0.2em] block text-[9px] mb-1">ATMOSPHERE</span>
              <span className="leading-relaxed">{selectedData.atmosphereComposition}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs font-light text-white/50 leading-relaxed max-w-sm hidden sm:block mb-5">
            {selectedData.description}
          </p>

          {/* Return Action */}
          <button
            onClick={() => onSelectBody('overview')}
            className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <span>RETURN TO OVERVIEW</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </main>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. BOTTOM TRANSPORT & DISPLAY TOGGLES (Quiet Edge Controls)           */}
      {/* --------------------------------------------------------------------- */}
      <footer className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-auto">
        {/* Playback & Multiplier Strip */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center space-x-1.5 text-white/80 hover:text-white transition-colors cursor-pointer tracking-wider"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="uppercase text-[10px]">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          <span className="text-white/20">|</span>

          {/* Speeds */}
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
                  className={`transition-colors cursor-pointer ${
                    isActive ? 'text-white font-medium underline' : 'hover:text-white/80'
                  }`}
                >
                  {multiplier}X
                </button>
              );
            })}
          </div>
        </div>

        {/* View Toggles & Reset */}
        <div className="flex items-center space-x-4 text-[10px] font-mono tracking-wider text-white/40">
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showOrbits ? 'text-white/90' : 'hover:text-white/70'
            }`}
          >
            <Orbit className="w-3 h-3 text-cyan-400/80" />
            <span className="uppercase">ORBITS ({showOrbits ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showLabels ? 'text-white/90' : 'hover:text-white/70'
            }`}
          >
            <Tag className="w-3 h-3 text-amber-400/80" />
            <span className="uppercase">LABELS ({showLabels ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={onResetCamera}
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="uppercase">RESET CAMERA</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
