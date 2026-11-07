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

const SPEED_PRESETS = [1, 5, 25, 100, 500];

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
  onResetCamera
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // Auto-hide UI during inactivity (4 seconds)
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

  const selectedData = PLANETS_CONFIG[selectedBody];

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-6 sm:p-8 transition-opacity duration-700 ${
        !uiVisible || isIdle ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER: STRICTLY ONE LINE AT ALL SCREEN SIZES                   */}
      {/* --------------------------------------------------------------------- */}
      <header className="w-full flex items-center justify-between gap-4 pointer-events-auto whitespace-nowrap overflow-x-auto py-1">
        {/* Brand & Simulation Live Indicator */}
        <div className="flex items-center space-x-2.5 text-white/90 shrink-0">
          <span className="text-xs font-light tracking-[0.3em] uppercase">
            TERRAFORGE
          </span>
          <span className="text-white/20">/</span>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase hidden md:inline">
            SOLAR SYSTEM SIMULATOR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">
            {isPaused ? 'PAUSED' : `${timeMultiplier}X LIVE`}
          </span>
        </div>

        {/* Minimalist Top Celestial Navigation Strip */}
        <nav className="flex items-center space-x-3 sm:space-x-4 text-[11px] font-mono tracking-[0.18em] uppercase shrink-0">
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

        {/* View Mode (CINEMATIC / SCIENTIFIC) & Controls (Strictly One Line) */}
        <div className="flex items-center space-x-4 shrink-0 text-[11px] font-mono tracking-[0.2em] uppercase">
          {/* Two plain text options, active underlined (no pill) */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (setViewMode) setViewMode('cinematic');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
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
                if (setViewMode) setViewMode('scientific');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
              className={`pb-0.5 border-b cursor-pointer transition-all ${
                viewMode === 'scientific'
                  ? 'text-white border-white font-medium'
                  : 'text-white/40 hover:text-white/80 border-transparent'
              }`}
            >
              SCIENTIFIC
            </button>
          </div>

          <span className="text-white/20">|</span>

          {/* Quick utility icons */}
          <div className="flex items-center space-x-2.5 text-white/40">
            <button
              onClick={() => setUiVisible((v) => !v)}
              className="hover:text-white transition-colors cursor-pointer"
              title="Toggle Clean View (H)"
            >
              {uiVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="hover:text-white transition-colors cursor-pointer"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. REFINED PLANETARY TYPOGRAPHY (Zero Boxes / Zero Grids / Zero Lines) */}
      {/* --------------------------------------------------------------------- */}
      {selectedData && selectedBody !== 'overview' && (
        <main className="max-w-xl pointer-events-auto transition-all duration-700 my-auto pl-2">
          {/* Celestial Classification */}
          <div className="text-[10px] font-mono tracking-[0.32em] text-white/50 uppercase mb-2">
            {selectedData.category || 'CELESTIAL BODY'}
          </div>

          {/* Large Refined Planet Name */}
          <h1 className="text-5xl sm:text-7xl font-extralight tracking-[0.25em] text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            {selectedData.name}
          </h1>

          {/* One-line Descriptor */}
          <p className="text-xs font-mono tracking-[0.18em] text-white/70 uppercase mt-2 mb-8">
            {selectedData.tagline}
          </p>

          {/* 3 to 4 Key Figures in a Quiet Row (No divider lines, no grid, no boxes) */}
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 text-xs font-mono mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">RADIUS</span>
              <span className="text-white/90 text-sm font-light tracking-wider">
                {selectedData.radiusKm ? `${selectedData.radiusKm.toLocaleString()} KM` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">GRAVITY</span>
              <span className="text-white/90 text-sm font-light tracking-wider">
                {selectedData.gravity || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">TEMP</span>
              <span className="text-white/90 text-sm font-light tracking-wider">
                {selectedData.meanTempC !== undefined ? `${selectedData.meanTempC}°C` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">ORBIT</span>
              <span className="text-white/90 text-sm font-light tracking-wider">
                {selectedData.orbitalPeriodDays ? `${selectedData.orbitalPeriodDays} D` : 'CENTER'}
              </span>
            </div>
          </div>

          {/* Atmosphere Composition as a Small Caption */}
          {selectedData.atmosphereComposition && (
            <div className="text-[10px] font-mono tracking-wider text-white/60 mb-6 max-w-md">
              <span className="text-white/40 uppercase tracking-[0.2em] mr-2">ATMOSPHERE:</span>
              <span>{selectedData.atmosphereComposition}</span>
            </div>
          )}

          {/* Return Action */}
          <button
            onClick={() => onSelectBody('overview')}
            className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <span>RETURN TO OVERVIEW</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </main>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. BOTTOM TRANSPORT & DISPLAY TOGGLES (Quiet Edge Controls)           */}
      {/* --------------------------------------------------------------------- */}
      <footer className="w-full flex items-center justify-between gap-3 pointer-events-auto">
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
          <div className="flex items-center space-x-2.5 text-[10px] tracking-wider text-white/40">
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
        <div className="flex items-center space-x-5 text-[10px] font-mono tracking-wider text-white/40">
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
