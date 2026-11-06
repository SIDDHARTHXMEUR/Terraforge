import React from 'react';
import {
  ALL_CELESTIAL_BODIES,
  PLANETS_CONFIG
} from '../data/planetsData';
import { useAppStore } from '../state/useAppStore';
import {
  Orbit,
  Maximize,
  RotateCcw,
  Sparkles,
  Sliders,
  ArrowLeft,
  Eye,
  Tag
} from 'lucide-react';

export function PlanetSelectorBar({ showLabels, setShowLabels }) {
  const {
    selectedBody,
    setSelectedBody,
    isTrueScale,
    toggleTrueScale,
    showOrbits,
    toggleShowOrbits,
    triggerCameraReset,
    activeDrawer,
    toggleDrawer
  } = useAppStore();

  const isOverview = selectedBody === 'overview';
  const currentBodyData = PLANETS_CONFIG[selectedBody];

  return (
    <>
      {/* Top Aerospace Secondary Toolstrip (Cleanly positioned below top header) */}
      <div className="absolute top-16 left-0 right-0 z-30 px-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-xs font-mono">
        {/* Left / Center: Celestial Body Selection Rail */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg shadow-xl max-w-full overflow-x-auto pointer-events-auto">
          {/* Solar System Overview Button */}
          <button
            onClick={() => setSelectedBody('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all whitespace-nowrap font-bold ${
              isOverview
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SOLAR SYSTEM</span>
          </button>

          <span className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Individual Celestial Bodies */}
          {ALL_CELESTIAL_BODIES.map((id) => {
            const planet = PLANETS_CONFIG[id];
            const isSelected = selectedBody === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedBody(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,254,0.25)] font-bold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: planet.color || planet.fallbackColor }}
                />
                <span className="uppercase text-[11px]">{planet.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Toolstrip: Scale Toggle, Orbit Lines, Labels, Reset */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 backdrop-blur-md border border-white/10 rounded-lg shadow-xl pointer-events-auto">
          {/* Mode Switch: Cinematic vs Scientific Scale */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/5 text-[10px]">
            <button
              onClick={() => { if (isTrueScale) toggleTrueScale(); }}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                !isTrueScale
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CINEMATIC
            </button>
            <button
              onClick={() => { if (!isTrueScale) toggleTrueScale(); }}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                isTrueScale
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              TRUE SCALE
            </button>
          </div>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle 3D Planetary Labels"
            className={`p-1.5 rounded border transition-all ${
              showLabels
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                : 'border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          {/* Orbit Lines Toggle */}
          <button
            onClick={toggleShowOrbits}
            title="Toggle Keplerian Orbit Paths"
            className={`p-1.5 rounded border transition-all ${
              showOrbits
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                : 'border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
          </button>

          {/* Camera Reset */}
          <button
            onClick={triggerCameraReset}
            title="Reset Camera Framing (R)"
            className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-cyan-400 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Consistent Left Planetary Dossier HUD (When a body is focused) */}
      {!isOverview && currentBodyData && (
        <div className="absolute top-28 left-4 z-20 w-80 max-h-[calc(100vh-140px)] overflow-y-auto bg-black/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 font-mono text-xs shadow-2xl text-gray-300 pointer-events-auto select-text">
          {/* Header & Return Button */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-400">CELESTIAL DOSSIER</div>
              <div className="text-lg font-bold text-white tracking-wide">{currentBodyData.name}</div>
            </div>
            <button
              onClick={() => setSelectedBody('overview')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-cyan-300 hover:bg-cyan-950/60"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>OVERVIEW</span>
            </button>
          </div>

          <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
            {currentBodyData.category}
          </div>

          <p className="text-[11px] text-gray-300 leading-relaxed font-sans mb-3">
            {currentBodyData.description}
          </p>

          {/* Key Astronomical Parameters Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 bg-white/[0.02] p-2.5 rounded border border-white/5">
            <div>
              <span className="text-gray-500 text-[10px] block">EQUATORIAL RADIUS</span>
              <span className="font-semibold text-white">{currentBodyData.radiusKm.toLocaleString()} km</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">MASS</span>
              <span className="font-semibold text-white">{currentBodyData.mass}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">SURFACE GRAVITY</span>
              <span className="font-semibold text-cyan-300">{currentBodyData.gravity}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">MEAN TEMPERATURE</span>
              <span className="font-semibold text-amber-300">{currentBodyData.meanTempC}°C</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">ROTATION PERIOD</span>
              <span className="font-semibold text-white">
                {currentBodyData.rotationPeriodHours ? `${Math.abs(currentBodyData.rotationPeriodHours)} hrs` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">ORBITAL PERIOD</span>
              <span className="font-semibold text-white">
                {currentBodyData.orbitalPeriodDays ? `${currentBodyData.orbitalPeriodDays} d` : 'Center'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">AXIAL TILT</span>
              <span className="font-semibold text-white">{currentBodyData.axialTiltDeg}°</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">SEMI-MAJOR AXIS</span>
              <span className="font-semibold text-white">
                {currentBodyData.semiMajorAxisAU ? `${currentBodyData.semiMajorAxisAU} AU` : '0 AU'}
              </span>
            </div>
          </div>

          {/* Atmospheric Breakdown */}
          <div className="border-t border-white/10 pt-2 text-[10px]">
            <span className="text-cyan-400 font-semibold block mb-0.5">ATMOSPHERE / VOLATILES:</span>
            <span className="text-gray-400 block">{currentBodyData.atmosphereComposition}</span>
          </div>

          {/* Quick Click Hint */}
          <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-gray-500 flex justify-between items-center">
            <span>Left-click + drag to rotate view</span>
            <span>Scroll to zoom</span>
          </div>
        </div>
      )}
    </>
  );
}
