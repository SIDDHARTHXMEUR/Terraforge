import React, { useState } from 'react';
import {
  ALL_CELESTIAL_BODIES,
  PLANETS_CONFIG
} from '../../data/planetsData';
import { useAppStore } from '../../state/useAppStore';
import {
  Sparkles,
  Play,
  Pause,
  ArrowLeft,
  Eye,
  EyeOff,
  Maximize2,
  Compass,
  Orbit,
  FastForward,
  RotateCcw
} from 'lucide-react';

export function CinematicUI({
  isCinematicTour,
  setIsCinematicTour,
  showOrbits,
  setShowOrbits
}) {
  const {
    selectedBody,
    setSelectedBody,
    sim,
    updateSim,
    timeSpeed,
    setTimeSpeed,
    triggerCameraReset
  } = useAppStore();

  const [uiHidden, setUiHidden] = useState(false);
  const isOverview = selectedBody === 'overview';
  const currentPlanet = PLANETS_CONFIG[selectedBody];

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      {/* Floating Hide/Show UI Button (Always accessible at bottom-right) */}
      <button
        onClick={() => setUiHidden(!uiHidden)}
        title={uiHidden ? 'Show Interface (H)' : 'Hide Interface for Cinema View (H)'}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-gray-300 hover:text-cyan-400 backdrop-blur-md shadow-2xl transition-all"
      >
        {uiHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Main UI Overlay (Hidden when uiHidden is true) */}
      {!uiHidden && (
        <>
          {/* Minimal Top Navigation Bar */}
          <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between bg-black/75 backdrop-blur-md border-b border-white/10 font-mono text-xs select-none">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setSelectedBody('overview')}
            >
              <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,242,254,0.3)]">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-widest text-white font-sans">TERRAFORGE</span>
                <span className="text-[10px] text-cyan-400 tracking-wider">CINEMATIC</span>
              </div>
            </div>

            {/* Center: Planetary Selection Pills */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/5 overflow-x-auto max-w-[55vw]">
              <button
                onClick={() => setSelectedBody('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap font-bold ${
                  isOverview
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>SOLAR SYSTEM</span>
              </button>

              <span className="w-[1px] h-3.5 bg-white/10 mx-1" />

              {ALL_CELESTIAL_BODIES.map((id) => {
                const p = PLANETS_CONFIG[id];
                const isSelected = selectedBody === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setIsCinematicTour(false);
                      setSelectedBody(id);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all whitespace-nowrap text-[11px] ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: p.color || p.fallbackColor }}
                    />
                    <span className="uppercase">{p.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Cinematic Tour, Playback, Speed, Orbits Toggle, Fullscreen */}
            <div className="flex items-center gap-2 text-xs">
              {/* Cinematic Tour Toggle */}
              <button
                onClick={() => {
                  setIsCinematicTour(!isCinematicTour);
                  if (!isCinematicTour) setSelectedBody('overview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all font-bold ${
                  isCinematicTour
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(0,242,254,0.3)] animate-pulse'
                    : 'bg-white/5 text-gray-300 hover:text-white border-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">CINEMATIC TOUR</span>
              </button>

              {/* Play/Pause */}
              <button
                onClick={() => updateSim('isPlaying', !sim.isPlaying)}
                title="Pause/Resume Simulation (Space)"
                className="p-1.5 rounded bg-white/5 border border-white/10 text-gray-300 hover:text-white"
              >
                {sim.isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              {/* Speed Multipliers */}
              <div className="hidden sm:flex items-center bg-black/60 border border-white/10 rounded px-1.5 py-1 text-gray-300 text-[10px]">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTimeSpeed(s)}
                    className={`px-1.5 py-0.5 rounded ${
                      timeSpeed === s
                        ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Orbits Toggle (Off by default as instructed) */}
              <button
                onClick={() => setShowOrbits(!showOrbits)}
                title={showOrbits ? 'Hide Orbit Paths' : 'Show Orbit Paths (O)'}
                className={`p-1.5 rounded border ${
                  showOrbits
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'border-white/10 text-gray-500 hover:text-white'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
              </button>

              {/* Reset Camera */}
              <button
                onClick={triggerCameraReset}
                title="Reset Camera Framing (R)"
                className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-cyan-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreenToggle}
                title="Toggle Fullscreen"
                className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Compact Celestial Information Card (When a planet is focused) */}
          {!isOverview && currentPlanet && (
            <div className="fixed bottom-6 left-6 z-30 w-80 max-h-[70vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 font-mono text-xs text-gray-300 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <div>
                  <div className="text-[10px] text-cyan-400 tracking-wider uppercase">{currentPlanet.category}</div>
                  <h2 className="text-xl font-bold text-white tracking-wide font-sans">{currentPlanet.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedBody('overview')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-cyan-300 hover:bg-cyan-950/60 text-[10px]"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>OVERVIEW</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed font-sans mb-3">
                {currentPlanet.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2 rounded border border-white/5 mb-2">
                <div>
                  <span className="text-gray-500 text-[10px] block">EQUATORIAL RADIUS</span>
                  <span className="font-semibold text-white">{currentPlanet.radiusKm.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">MASS</span>
                  <span className="font-semibold text-white">{currentPlanet.mass}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">SURFACE GRAVITY</span>
                  <span className="font-semibold text-cyan-300">{currentPlanet.gravity}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">MEAN TEMPERATURE</span>
                  <span className="font-semibold text-amber-300">{currentPlanet.meanTempC}°C</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">DAY LENGTH</span>
                  <span className="font-semibold text-white">
                    {currentPlanet.rotationPeriodHours ? `${Math.abs(currentPlanet.rotationPeriodHours)} hrs` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">ORBITAL PERIOD</span>
                  <span className="font-semibold text-white">
                    {currentPlanet.orbitalPeriodDays ? `${currentPlanet.orbitalPeriodDays} d` : 'Center'}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 text-[10px]">
                <span className="text-cyan-400 font-semibold block mb-0.5">ATMOSPHERE:</span>
                <span className="text-gray-400 block leading-tight">{currentPlanet.atmosphereComposition}</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

