import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  X,
  Orbit,
  Tag,
  ChevronRight
} from 'lucide-react';
import { PLANETS_CONFIG } from '../../data/planetsData';

const CELESTIAL_LIST = [
  { id: 'overview', name: 'Overview', dot: '#ffffff' },
  { id: 'sun', name: 'Sol', dot: '#ffb703' },
  { id: 'mercury', name: 'Mercury', dot: '#94a3b8' },
  { id: 'venus', name: 'Venus', dot: '#fef08a' },
  { id: 'earth', name: 'Earth', dot: '#38bdf8' },
  { id: 'mars', name: 'Mars', dot: '#fb923c' },
  { id: 'asteroids', name: 'Asteroids', dot: '#a8a29e' },
  { id: 'jupiter', name: 'Jupiter', dot: '#eab308' },
  { id: 'saturn', name: 'Saturn', dot: '#fde047' },
  { id: 'uranus', name: 'Uranus', dot: '#67e8f9' },
  { id: 'neptune', name: 'Neptune', dot: '#60a5fa' }
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
  const [isIdle, setIsIdle] = useState(false);

  // Auto-dim UI during prolonged inactivity
  useEffect(() => {
    let timeout;
    const handleActivity = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, 6000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  // Re-open inspector when selecting a different celestial body
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
    category: 'Circumstellar Debris Belt',
    tagline: 'Remnants of Early Solar System Planetary Accretion',
    radiusKm: 473,
    mass: '3.0 × 10²¹ kg',
    gravity: '0.28 m/s²',
    meanTempC: -106,
    orbitalPeriodDays: 1682,
    atmosphereComposition: 'Vacuum / Trace water-vapor plumes on Ceres',
    description: 'A vast circumstellar torus orbiting between Mars and Jupiter. Occupied by hundreds of thousands of rocky chondrite bodies and anchored by dwarf planet Ceres.'
  } : null);

  return (
    <div className={`absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between overflow-hidden transition-opacity duration-700 ${
      isIdle ? 'opacity-35 hover:opacity-100' : 'opacity-100'
    }`}>
      {/* 1. TOP HEADER & CELESTIAL NAV BAR (Swiss Editorial Minimalism) */}
      <header
        className={`w-full pt-4 px-6 flex flex-col items-center transition-all duration-500 pointer-events-auto ${
          uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-6xl flex items-center justify-between pb-2.5">
          {/* Brand & Real-Time Indicator */}
          <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/[0.08]">
            <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-medium text-white/90">
              TERRAFORGE <span className="text-white/30">|</span> SOLAR SYSTEM
            </span>
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            <span className="text-[9px] font-mono tracking-widest text-emerald-400/90 uppercase">
              {isPaused ? 'SIMULATION PAUSED' : 'REAL-TIME'}
            </span>
          </div>

          {/* Quick HUD Visibility & Fullscreen Toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUiVisible((v) => !v)}
              className="bg-black/50 hover:bg-black/80 backdrop-blur-xl text-white/60 hover:text-white p-2 rounded-full border border-white/[0.08] transition-all text-xs"
              title="Toggle HUD (H)"
            >
              {uiVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/80 backdrop-blur-xl text-white/60 hover:text-white p-2 rounded-full border border-white/[0.08] transition-all text-xs"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Minimalist Celestial Selection Bar */}
        <nav className="w-full max-w-5xl flex items-center justify-center overflow-x-auto py-1 px-2">
          <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-2xl p-1 rounded-full border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            {CELESTIAL_LIST.map(({ id, name, dot }) => {
              const isActive = selectedBody === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelectBody(id)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/25 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="uppercase text-[10px]">{name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* 2. CONTEXTUAL PLANETARY INSPECTOR DRAWER (Aerospace Elegance) */}
      {selectedData && selectedBody !== 'overview' && (
        <aside
          className={`absolute left-6 bottom-24 w-84 sm:w-96 transition-all duration-500 pointer-events-auto z-20 ${
            uiVisible && isTelemetryOpen
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-black/75 backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-5 shadow-[0_24px_64px_rgba(0,0,0,0.95)]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3 mb-3.5">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-light tracking-[0.12em] text-white uppercase">
                    {selectedData.name}
                  </h2>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70 border border-white/10 uppercase tracking-widest">
                    {selectedData.category || 'Celestial Body'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-white/40 tracking-wider mt-1">
                  {selectedData.tagline || 'Astronomical Observation Target'}
                </p>
              </div>
              <button
                onClick={() => setIsTelemetryOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Dismiss Telemetry"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scientific Parameters Matrix */}
            <div className="grid grid-cols-2 gap-2 mb-3.5 text-xs font-mono">
              <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Mean Radius</div>
                <div className="text-white/90 font-medium text-xs mt-0.5">
                  {selectedData.radiusKm ? `${selectedData.radiusKm.toLocaleString()} km` : 'N/A'}
                </div>
              </div>
              <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Surface Gravity</div>
                <div className="text-white/90 font-medium text-xs mt-0.5">{selectedData.gravity || 'N/A'}</div>
              </div>
              <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Mean Temperature</div>
                <div className="text-white/90 font-medium text-xs mt-0.5">
                  {selectedData.meanTempC !== undefined ? `${selectedData.meanTempC}°C` : 'N/A'}
                </div>
              </div>
              <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Orbital Period</div>
                <div className="text-white/90 font-medium text-xs mt-0.5">
                  {selectedData.orbitalPeriodDays ? `${selectedData.orbitalPeriodDays} d` : 'Center'}
                </div>
              </div>
            </div>

            {/* Atmosphere Summary */}
            {selectedData.atmosphereComposition && (
              <div className="mb-3.5 text-[10px] font-mono bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.05]">
                <span className="text-white/40 uppercase tracking-wider block mb-0.5">Atmosphere</span>
                <span className="text-white/80 leading-relaxed">{selectedData.atmosphereComposition}</span>
              </div>
            )}

            {/* Concise Scientific Description */}
            <p className="text-xs text-white/60 font-light leading-relaxed mb-4">
              {selectedData.description}
            </p>

            {/* Return to Overview Action */}
            <button
              onClick={() => onSelectBody('overview')}
              className="w-full flex items-center justify-center space-x-2 bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
            >
              <span>Return to Solar Overview</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
        </aside>
      )}

      {/* 3. BOTTOM TRANSPORT BAR & DISPLAY TOGGLES (Restrained Control Dock) */}
      <footer
        className={`w-full pb-4 px-6 flex flex-col items-center pointer-events-auto transition-all duration-500 ${
          uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-2xl bg-black/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-2 px-3 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3">
          {/* Simulation Playback & Speed Multipliers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 px-3 rounded-xl font-mono text-[11px] flex items-center space-x-1.5 transition-all ${
                isPaused
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}
              title="Toggle Play / Pause (Space)"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              <span className="uppercase tracking-wider">{isPaused ? 'Paused' : '1x Active'}</span>
            </button>

            {/* Stepped Multipliers */}
            <div className="flex items-center space-x-0.5 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.05]">
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
                        ? 'bg-white/20 text-white font-medium border border-white/30'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {multiplier}x
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Toggles & Camera Reset */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center space-x-1.5 transition-all border ${
                showOrbits
                  ? 'bg-white/15 text-white border-white/25'
                  : 'bg-transparent text-white/40 border-white/[0.06] hover:text-white/70'
              }`}
              title="Toggle Orbits (O)"
            >
              <Orbit className="w-3 h-3 text-cyan-400" />
              <span>Orbits</span>
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center space-x-1.5 transition-all border ${
                showLabels
                  ? 'bg-white/15 text-white border-white/25'
                  : 'bg-transparent text-white/40 border-white/[0.06] hover:text-white/70'
              }`}
              title="Toggle Labels (L)"
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Labels</span>
            </button>

            <button
              onClick={onResetCamera}
              className="px-2.5 py-1 rounded-xl text-[11px] font-mono text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06] flex items-center space-x-1 transition-all"
              title="Reset Overview Camera (R)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Minimal Editorial Shortcuts Footer */}
        <div className="text-[9px] font-mono text-white/30 tracking-[0.18em] mt-2 hidden sm:flex items-center space-x-4">
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">SPACE</kbd> PAUSE</span>
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">O</kbd> ORBITS</span>
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">L</kbd> LABELS</span>
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">R</kbd> RESET</span>
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">ESC</kbd> OVERVIEW</span>
          <span><kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/60">1-9</kbd> SELECT BODY</span>
        </div>
      </footer>
    </div>
  );
}
