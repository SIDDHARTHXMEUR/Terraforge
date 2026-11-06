import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Compass,
  Info,
  X,
  ChevronRight,
  Globe2,
  Orbit
} from 'lucide-react';
import { PLANETS_CONFIG } from '../../data/planetsData';

const CELESTIAL_LIST = [
  { id: 'overview', name: 'Overview', color: '#38bdf8', icon: '🌌' },
  { id: 'sun', name: 'Sol', color: '#ffaa00', icon: '☀️' },
  { id: 'mercury', name: 'Mercury', color: '#9ca3af', icon: '☿' },
  { id: 'venus', name: 'Venus', color: '#fbbf24', icon: '♀' },
  { id: 'earth', name: 'Earth', color: '#38bdf8', icon: '🌍' },
  { id: 'mars', name: 'Mars', color: '#ea580c', icon: '♂' },
  { id: 'asteroids', name: 'Asteroids', color: '#a8a29e', icon: '🪐' },
  { id: 'jupiter', name: 'Jupiter', color: '#facc15', icon: '♃' },
  { id: 'saturn', name: 'Saturn', color: '#fef08a', icon: '♄' },
  { id: 'uranus', name: 'Uranus', color: '#67e8f9', icon: '♅' },
  { id: 'neptune', name: 'Neptune', color: '#60a5fa', icon: '♆' }
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
  onResetCamera
}) {
  const [uiVisible, setUiVisible] = useState(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close or open telemetry card automatically when body selection changes
  useEffect(() => {
    if (selectedBody && selectedBody !== 'overview') {
      setIsTelemetryOpen(true);
    }
  }, [selectedBody]);

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
    category: 'Circumstellar Debris Ring',
    tagline: 'Remnants of Early Solar System Accretion',
    radiusKm: 473, // Ceres mean radius
    mass: '3.0 × 10²¹ kg (~4% of the Moon)',
    gravity: '0.28 m/s² (Ceres)',
    meanTempC: -106,
    rotationPeriodHours: 9.07,
    orbitalPeriodDays: 1682,
    atmosphereComposition: 'Vacuum / Trace water-vapor plumes on Ceres',
    description: 'A vast circumstellar disc located between the orbits of Mars and Jupiter. Occupied by hundreds of thousands of irregular rocky asteroids, and anchored by dwarf planet Ceres.'
  } : null);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between overflow-hidden">
      {/* 1. TOP HEADER & CELESTIAL QUICK-PICKER BAR */}
      <header
        className={`w-full pt-3 px-4 sm:px-6 flex flex-col items-center transition-all duration-500 pointer-events-auto ${
          uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-6xl flex items-center justify-between pb-2">
          {/* Brand & System Status */}
          <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <Globe2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.25em] font-mono font-semibold text-white/90">
              TERRAFORGE <span className="text-white/40">|</span> SOLAR SIMULATOR
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">
              REAL-TIME
            </span>
          </div>

          {/* Quick HUD Visibility & Fullscreen Toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUiVisible((v) => !v)}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white p-2 rounded-full border border-white/10 transition-all text-xs flex items-center space-x-1"
              title="Toggle HUD (H)"
            >
              {uiVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white p-2 rounded-full border border-white/10 transition-all text-xs"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Celestial Body Navigation Tabs */}
        <nav className="w-full max-w-5xl flex items-center justify-center overflow-x-auto py-1 px-2">
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-black/75 backdrop-blur-xl p-1.5 rounded-2xl border border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
            {CELESTIAL_LIST.map(({ id, name, color, icon }) => {
              const isActive = selectedBody === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectBody(id)}
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-medium tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/30 scale-105'
                      : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span className="text-xs">{icon}</span>
                  <span className="hidden sm:inline uppercase">{name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* 2. ASTROPHYSICAL TELEMETRY CARD (FLOATING DRAWER) */}
      {selectedData && selectedBody !== 'overview' && (
        <div
          className={`absolute left-4 sm:left-6 bottom-24 sm:bottom-28 w-80 sm:w-96 transition-all duration-500 pointer-events-auto z-20 ${
            uiVisible && isTelemetryOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-black/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-light tracking-wider text-white uppercase">
                    {selectedData.name}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase">
                    {selectedData.category || 'Body'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/50 tracking-wide mt-0.5">
                  {selectedData.tagline || 'Solar System Explorer'}
                </p>
              </div>
              <button
                onClick={() => setIsTelemetryOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Dismiss Telemetry"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scientific Parameters Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-3 text-xs font-mono">
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Mean Radius</div>
                <div className="text-white font-medium">
                  {selectedData.radiusKm ? `${selectedData.radiusKm.toLocaleString()} km` : 'N/A'}
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Surface Gravity</div>
                <div className="text-white font-medium">{selectedData.gravity || 'N/A'}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Surface Temp</div>
                <div className="text-white font-medium">
                  {selectedData.meanTempC !== undefined ? `${selectedData.meanTempC}°C` : 'N/A'}
                </div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Orbital Period</div>
                <div className="text-white font-medium">
                  {selectedData.orbitalPeriodDays ? `${selectedData.orbitalPeriodDays} d` : 'Center'}
                </div>
              </div>
            </div>

            {/* Atmosphere Composition */}
            {selectedData.atmosphereComposition && (
              <div className="mb-3 text-[10px] font-mono bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-white/40 uppercase tracking-wider block mb-0.5">Atmosphere</span>
                <span className="text-white/80">{selectedData.atmosphereComposition}</span>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-white/70 font-light leading-relaxed mb-4 line-clamp-3">
              {selectedData.description}
            </p>

            {/* Return to Overview Action */}
            <button
              onClick={() => onSelectBody('overview')}
              className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
            >
              <span>Return to Solar Overview</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating telemetry button when drawer closed */}
      {selectedData && selectedBody !== 'overview' && !isTelemetryOpen && uiVisible && (
        <button
          onClick={() => setIsTelemetryOpen(true)}
          className="absolute left-6 bottom-28 bg-black/80 hover:bg-black backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-full pointer-events-auto flex items-center space-x-2 text-xs font-mono uppercase tracking-wider shadow-xl transition-all"
        >
          <Info className="w-4 h-4 text-cyan-400" />
          <span>{selectedData.name} Telemetry</span>
        </button>
      )}

      {/* 3. BOTTOM CONTROL BAR: SIMULATION TRANSPORT & DISPLAY TOGGLES */}
      <footer
        className={`w-full pb-4 px-4 sm:px-6 flex flex-col items-center pointer-events-auto transition-all duration-500 ${
          uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-3xl bg-black/80 backdrop-blur-2xl border border-white/12 rounded-2xl p-2.5 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between gap-3">
          {/* Left: Play / Pause & Time Multipliers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl font-mono text-xs flex items-center space-x-1.5 transition-all ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
              title="Toggle Play / Pause (Space)"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-semibold">{isPaused ? 'PAUSED' : 'REAL-TIME'}</span>
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {SPEED_PRESETS.map((multiplier) => {
                const isActive = timeMultiplier === multiplier && !isPaused;
                return (
                  <button
                    key={multiplier}
                    onClick={() => {
                      setTimeMultiplier(multiplier);
                      if (isPaused) setIsPaused(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono tracking-wider transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {multiplier}x
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: View Toggles & Reset */}
          <div className="flex items-center space-x-1.5">
            {/* Orbits Toggle */}
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all border ${
                showOrbits
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-transparent text-white/40 border-white/10 hover:text-white/70'
              }`}
              title="Toggle Orbits (O)"
            >
              <Orbit className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Orbits</span>
            </button>

            {/* Labels Toggle */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all border ${
                showLabels
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-transparent text-white/40 border-white/10 hover:text-white/70'
              }`}
              title="Toggle Planet Labels (L)"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Labels</span>
            </button>

            {/* Reset Camera */}
            <button
              onClick={onResetCamera}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/10 border border-white/10 flex items-center space-x-1.5 transition-all"
              title="Reset Overview Camera (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="text-[10px] font-mono text-white/40 tracking-wider mt-1.5 hidden sm:flex items-center space-x-3">
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">Space</kbd> Pause</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">O</kbd> Orbits</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">L</kbd> Labels</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">R</kbd> Reset</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">Esc</kbd> Overview</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70">1-9</kbd> Select Planet</span>
        </div>
      </footer>
    </div>
  );
}
