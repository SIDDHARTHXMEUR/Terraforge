import React from 'react';
import {
  CELESTIAL_ORDER,
  PLANETS_DATA
} from '../data/planetsData';
import { useAppStore } from '../state/useAppStore';
import {
  Orbit,
  Eye,
  Info,
  Maximize,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';

export function PlanetSelectorBar() {
  const {
    selectedBody,
    setSelectedBody,
    viewMode,
    setViewMode,
    showOrbits,
    toggleShowOrbits,
    isTrueScale,
    toggleTrueScale,
    triggerCameraReset,
    activeDrawer,
    toggleDrawer
  } = useAppStore();

  const currentPlanet = PLANETS_DATA[selectedBody] || PLANETS_DATA.earth;

  const viewModes = [
    { id: 'cinematic', label: 'CINEMATIC' },
    { id: 'scientific', label: 'SCIENTIFIC' },
    { id: 'educational', label: 'EDUCATIONAL' },
    { id: 'mission', label: 'MISSION' }
  ];

  return (
    <>
      {/* Top Floating Planetary Strip (Under Navigation Bar) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-w-[95vw] overflow-x-auto text-xs font-mono">
        {CELESTIAL_ORDER.map((id) => {
          const planet = PLANETS_DATA[id];
          const isSelected = selectedBody === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedBody(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.3)] font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: planet.fallbackColor || planet.surfaceColor }}
              />
              <span>{planet.name}</span>
            </button>
          );
        })}
      </div>

      {/* Top-Right Viewing Mode & Display Toolstrip */}
      <div className="absolute top-16 right-4 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-md p-1 text-xs font-mono text-gray-300">
        {/* Viewing Modes */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/5">
          {viewModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                viewMode === m.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Orbit Lines Toggle */}
        <button
          onClick={toggleShowOrbits}
          title="Toggle Keplerian Orbit Paths"
          className={`p-1.5 rounded border ${
            showOrbits
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              : 'border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Orbit className="w-3.5 h-3.5" />
        </button>

        {/* Astronomical True Scale Toggle */}
        <button
          onClick={toggleTrueScale}
          title="Toggle Astronomical Scale vs Visual Exploration Scale"
          className={`p-1.5 rounded border ${
            isTrueScale
              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              : 'border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        {/* Camera Reset */}
        <button
          onClick={triggerCameraReset}
          title="Reset Camera Framing (R)"
          className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-cyan-400"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Transform Drawer Toggle */}
        <button
          onClick={() => toggleDrawer('transform')}
          title="Toggle Transform Inspector"
          className={`p-1.5 rounded border ${
            activeDrawer === 'transform'
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              : 'border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Scientific Dossier HUD (Top Left when in Scientific/Educational mode) */}
      {(viewMode === 'scientific' || viewMode === 'educational') && (
        <div className="absolute top-28 left-4 z-20 w-80 bg-black/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 font-mono text-xs shadow-[0_15px_35px_rgba(0,0,0,0.8)] text-gray-300 pointer-events-auto select-text">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-400">TARGET CELESTIAL BODY</div>
              <div className="text-base font-bold text-white tracking-wide">{currentPlanet.name}</div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-400">
              {currentPlanet.category}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
            {currentPlanet.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 bg-white/[0.02] p-2 rounded border border-white/5">
            <div>
              <span className="text-gray-500 text-[10px] block">EQUATORIAL RADIUS</span>
              <span className="font-semibold text-gray-200">{currentPlanet.radiusKm.toLocaleString()} km</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">MASS</span>
              <span className="font-semibold text-gray-200">{currentPlanet.mass}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">SURFACE GRAVITY</span>
              <span className="font-semibold text-gray-200">{currentPlanet.gravity}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">MEAN TEMPERATURE</span>
              <span className="font-semibold text-gray-200">{currentPlanet.meanTempC}°C</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">SEMI-MAJOR AXIS</span>
              <span className="font-semibold text-gray-200">{currentPlanet.semiMajorAxisAU} AU</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">ORBITAL PERIOD</span>
              <span className="font-semibold text-gray-200">{currentPlanet.orbitalPeriodDays} d</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 text-[10px]">
            <span className="text-cyan-400 font-semibold block mb-0.5">ATMOSPHERIC COMPOSITION:</span>
            <span className="text-gray-400 block">{currentPlanet.atmosphereComposition}</span>
          </div>
        </div>
      )}
    </>
  );
}
