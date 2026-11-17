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
import { useEarthClimateStore, computeEarthSystemMetrics } from '../../state/useEarthClimateStore';
import { Wordmark } from '../common/Wordmark';
import { getUnifiedPlanetStats } from '../../utils/celestialStats';

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
    return `${(abs / 24).toFixed(1)} Earth days${isRet ? ' (retrograde)' : ''}`;
  }
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${h}h ${m}m${isRet ? ' (retrograde)' : ''}`;
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
  const [showClimateLab, setShowClimateLab] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [simDate, setSimDate] = useState(() => Date.now());

  const {
    tempAnomaly,
    seaLevelDelta,
    cityLightsFactor,
    setTempAnomaly,
    setSeaLevelDelta,
    setCityLightsFactor,
    setPreset: setClimatePreset,
    reset: resetClimate
  } = useEarthClimateStore();

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
        <div className="flex items-center space-x-2 text-white/90 shrink-0">
          <Wordmark
            onClick={() => {
              try { sessionStorage.setItem('terraforge_allow_landing', 'true'); } catch (_) {}
              if (onGoHome) onGoHome();
              else window.location.hash = '#/';
            }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <span className="text-cream/30 font-sans text-[11px]">/</span>
          <button
            onClick={() => {
              try { sessionStorage.setItem('terraforge_allow_landing', 'true'); } catch (_) {}
              if (onGoHome) onGoHome();
              else window.location.hash = '#/';
            }}
            className="font-sans text-[11px] uppercase tracking-[0.25em] text-cream opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-white py-1 cursor-pointer"
            title="Return to Landing Page"
          >
            LANDING
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-3"></span>
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
        const stats = getUnifiedPlanetStats(selectedBody);
        const accentColor = PLANET_ACCENTS[selectedBody] || '#4FD1C5';
        const microLabel = PLANET_MICRO_LABELS[selectedBody] || selectedData.category || 'CELESTIAL BODY';
        const impact = computeEarthSystemMetrics(tempAnomaly, seaLevelDelta);

        return (
          <main
            key={selectedBody}
            className={`planet-blur-transition self-start pointer-events-auto transition-all pl-4 sm:pl-8 flex flex-col lg:flex-row items-start gap-6 ${
              showClimateLab && selectedBody === 'earth' ? 'my-auto pt-0' : 'my-auto pt-16 sm:pt-20'
            }`}
            style={{ width: 'fit-content' }}
          >
            {/* Primary Body Card */}
            <div className="relative" style={{ maxWidth: '34ch' }}>
              <div className="absolute -inset-4 bg-black/35 backdrop-blur-[2px] rounded-2xl -z-10 pointer-events-none" />

              {/* Hierarchy Level 1: Micro-label with accent dot */}
              <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <span>{microLabel}</span>
              </div>

              {/* Hierarchy Level 2: Large serif name (Cormorant Garamond) */}
              <h1 className="font-serif text-5xl sm:text-7xl font-normal tracking-[0.14em] text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-tight">
                {stats.name}
              </h1>

              {/* Hierarchy Level 3: 1px accent rule */}
              <div className="w-10 h-[1px] my-3.5" style={{ backgroundColor: accentColor }} />

              {/* Hierarchy Level 4: 1 to 2 sentences of copy */}
              <p
                className="font-sans text-[14px] text-white/80 leading-relaxed font-light mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                style={{ maxWidth: '34ch' }}
              >
                {stats.description}
              </p>

              {/* Hierarchy Level 5: Stacked Plain Lines (No grid, no table, no hairlines) */}
              <div
                className="my-5 space-y-2 text-[15px] font-sans font-light text-white/85 leading-relaxed"
                style={{ maxWidth: '34ch' }}
              >
                {selectedBody !== 'sun' && (
                  <div>
                    <span>Distance from the Sun: </span>
                    <span style={{ color: accentColor }}>{stats.distSimStr}</span>
                    {stats.distAU > 0 && (
                      <span>, light takes <span style={{ color: accentColor }}>{stats.lightTimeStr}</span></span>
                    )}
                  </div>
                )}
                <div>
                  <span>Diameter: </span>
                  <span style={{ color: accentColor }}>{stats.diameterStr}</span>
                </div>
                <div>
                  <span>Length of day: </span>
                  <span style={{ color: accentColor }}>{stats.dayStr}</span>
                </div>
                {selectedBody !== 'sun' && (
                  <div>
                    <span>Orbital period: </span>
                    <span style={{ color: accentColor }}>{stats.orbitalPeriodDays ? `${stats.orbitalPeriodDays} days` : 'N/A'}</span>
                  </div>
                )}
              </div>

              {/* Hierarchy Level 6: Action buttons with Plain-Text TECH SPECS & Climate Lab toggle */}
              <div className="flex items-center space-x-6 mt-4 text-[13px] font-sans font-light flex-nowrap whitespace-nowrap">
                <button
                  onClick={() => setShowDetailLayer(!showDetailLayer)}
                  className="hover:underline transition-colors cursor-pointer text-white/70 hover:text-white"
                  style={{ color: showDetailLayer ? accentColor : undefined }}
                >
                  {showDetailLayer ? 'Hide Tech Specs' : 'Tech Specs'}
                </button>
                {selectedBody === 'earth' && !isSurfaceMode && (
                  <button
                    onClick={() => setShowClimateLab(!showClimateLab)}
                    className="hover:underline transition-colors cursor-pointer text-white/70 hover:text-white"
                    style={{ color: showClimateLab ? accentColor : undefined }}
                  >
                    {showClimateLab ? 'Close Climate' : 'Climate Lab'}
                  </button>
                )}
                <button
                  onClick={() => onSelectBody('overview')}
                  className="text-white/40 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Overview
                </button>
              </div>

              {/* Technical Specifications revealed as flowing sentences (scrolling up to 40vh) */}
              {showDetailLayer && (
                <div
                  className="mt-4 pt-3 border-t border-white/10 text-[14px] font-sans font-light text-white/75 leading-relaxed max-h-[40vh] overflow-y-auto pr-2"
                  style={{ maxWidth: '34ch' }}
                >
                  <p>
                    Surface gravity is <span style={{ color: accentColor }}>{selectedData.gravity || 'N/A'}</span>.
                    {selectedData.meanTempC !== undefined && (
                      <span> Mean temperature is <span style={{ color: accentColor }}>{selectedData.meanTempC}°C</span>.</span>
                    )}
                    {selectedData.axialTiltDeg !== undefined && (
                      <span> Axial tilt is <span style={{ color: accentColor }}>{selectedData.axialTiltDeg}°</span>.</span>
                    )}
                    {selectedData.mass && (
                      <span> Mass is <span style={{ color: accentColor }}>{selectedData.mass}</span>.</span>
                    )}
                    {selectedData.atmosphereComposition && (
                      <span> Atmosphere consists of {selectedData.atmosphereComposition}.</span>
                    )}
                  </p>
                </div>
              )}

              {/* Climate & Planetary Factors Panel (Earth-only) */}
              {showClimateLab && selectedBody === 'earth' && !isSurfaceMode && (
                <div
                  className="mt-3.5 pt-3 border-t border-white/10 space-y-2.5"
                  style={{ maxWidth: '34ch' }}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase text-white/50">
                    <span>CLIMATE & TERRAFORM</span>
                    <button
                      onClick={resetClimate}
                      className="hover:text-white transition-colors cursor-pointer text-white/40 hover:underline"
                      title="Reset to present baseline"
                    >
                      [RESET]
                    </button>
                  </div>

                  {/* Surface Temperature Anomaly */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[12px] font-sans font-light text-white/80">
                      <span>Surface Temp Anomaly</span>
                      <span className="font-mono text-[11px]" style={{ color: tempAnomaly !== 0 ? accentColor : 'rgba(255,255,255,0.6)' }}>
                        {tempAnomaly > 0 ? `+${tempAnomaly}` : tempAnomaly}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="50"
                      step="1"
                      value={tempAnomaly}
                      onChange={(e) => setTempAnomaly(parseFloat(e.target.value))}
                      onInput={(e) => setTempAnomaly(parseFloat(e.target.value))}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                      <span>-30°C (Glaciation)</span>
                      <span>+50°C (Hothouse)</span>
                    </div>
                  </div>

                  {/* Sea Level Anomaly */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[12px] font-sans font-light text-white/80">
                      <span>Sea Level Anomaly</span>
                      <span className="font-mono text-[11px]" style={{ color: seaLevelDelta !== 0 ? accentColor : 'rgba(255,255,255,0.6)' }}>
                        {seaLevelDelta > 0 ? `+${seaLevelDelta}` : seaLevelDelta} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="80"
                      step="2"
                      value={seaLevelDelta}
                      onChange={(e) => setSeaLevelDelta(parseFloat(e.target.value))}
                      onInput={(e) => setSeaLevelDelta(parseFloat(e.target.value))}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                      <span>-100m (Shelf Exposed)</span>
                      <span>+80m (All Ice Melted)</span>
                    </div>
                  </div>

                  {/* Anthropic Night Lights */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[12px] font-sans font-light text-white/80">
                      <span>Human Footprint (Night Lights)</span>
                      <span className="font-mono text-[11px]" style={{ color: cityLightsFactor !== 1.0 ? accentColor : 'rgba(255,255,255,0.6)' }}>
                        {cityLightsFactor.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={cityLightsFactor}
                      onChange={(e) => setCityLightsFactor(parseFloat(e.target.value))}
                      onInput={(e) => setCityLightsFactor(parseFloat(e.target.value))}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                      <span>0.0x (Pristine)</span>
                      <span>3.0x (Megacities)</span>
                    </div>
                  </div>

                  {/* Epoch Presets */}
                  <div className="flex items-center space-x-2 pt-0.5 text-[10px] font-mono tracking-wider">
                    <span className="text-white/40">EPOCH:</span>
                    <button
                      onClick={() => setClimatePreset('snowball')}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        tempAnomaly === -25 ? 'border-teal-400 text-teal-400' : 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                      }`}
                    >
                      ICE AGE
                    </button>
                    <button
                      onClick={() => setClimatePreset('baseline')}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        tempAnomaly === 0 && seaLevelDelta === 0 ? 'border-teal-400 text-teal-400' : 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                      }`}
                    >
                      PRESENT
                    </button>
                    <button
                      onClick={() => setClimatePreset('hothouse')}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        tempAnomaly === 35 ? 'border-teal-400 text-teal-400' : 'border-white/10 hover:border-white/30 text-white/70 hover:text-white'
                      }`}
                    >
                      HOTHOUSE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Distinct Earth System Science & Climate Telemetry Card */}
            {showClimateLab && selectedBody === 'earth' && !isSurfaceMode && (
              <div
                className="relative bg-black/45 backdrop-blur-[4px] border border-white/10 rounded-2xl p-5 text-white/90 shadow-2xl transition-all"
                style={{ maxWidth: '34ch', width: '34ch' }}
              >
                {/* Level 1: Micro header with status dot */}
                <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.25em] uppercase text-white/50 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: impact.statusColor }} />
                    <span>EARTH SYSTEM TELEMETRY</span>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: impact.statusColor }}>
                    {tempAnomaly > 0 ? `+${tempAnomaly}°C` : `${tempAnomaly}°C`}
                  </span>
                </div>

                {/* Level 2: Headline Summary */}
                <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-[0.06em] text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-snug">
                  {impact.biomeState}
                </h2>

                {/* Level 3: 1px accent rule */}
                <div className="w-8 h-[1px] my-3" style={{ backgroundColor: impact.statusColor }} />

                {/* Level 4: Stacked Planetary Parameters (Essential ESM Physics, Zero Gimmicks) */}
                <div className="space-y-2.5 text-[13px] font-sans font-light text-white/85 leading-relaxed">
                  <div>
                    <span className="text-white/50">Global Mean Temp: </span>
                    <span className="font-mono text-white/95">{impact.absTemp}°C </span>
                    <span className="font-mono text-[11px]" style={{ color: impact.statusColor }}>
                      ({tempAnomaly > 0 ? `+${tempAnomaly}` : tempAnomaly}°C)
                    </span>
                  </div>

                  <div>
                    <span className="text-white/50">Sea Level Anomaly: </span>
                    <span className="font-mono font-normal" style={{ color: impact.statusColor }}>
                      {seaLevelDelta > 0 ? `+${seaLevelDelta}` : seaLevelDelta} m
                    </span>
                  </div>

                  <div>
                    <span className="text-white/50">Planetary Albedo (α): </span>
                    <span className="font-mono text-white/95">{impact.albedo}</span>
                  </div>

                  <div>
                    <span className="text-white/50">Ocean Surface pH: </span>
                    <span className="font-mono text-white/95">{impact.oceanPh}</span>
                  </div>

                  <div>
                    <span className="text-white/50">Cryosphere Extent: </span>
                    <span className="font-mono text-white/95">{impact.cryosphereArea}</span>
                    <div className="text-[11px] text-white/50">{impact.cryosphereStatus}</div>
                  </div>

                  <div>
                    <span className="text-white/50">Biome Equilibrium: </span>
                    <div className="text-[12px] text-white/80">{impact.biomeDetail}</div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
                    <span>ATMOSPHERIC CO₂ EQUIV</span>
                    <span className="text-white/90">{impact.co2} PPM</span>
                  </div>
                </div>
              </div>
            )}
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
            onClick={() => {
              try { sessionStorage.setItem('terraforge_allow_landing', 'true'); } catch (_) {}
            }}
            title="Return to Landing Page"
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span className="uppercase">LANDING</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
