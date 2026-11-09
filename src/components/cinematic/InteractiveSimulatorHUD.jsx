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
import { Wordmark } from '../common/Wordmark';

const CELESTIAL_LIST = [
  { id: 'overview', name: 'Overview' },
  { id: 'sun', name: 'Sol' },
  { id: 'mercury', name: 'Mercury' },
  { id: 'venus', name: 'Venus' },
  { id: 'earth', name: 'Earth' },
  { id: 'mars', name: 'Mars' },
  { id: 'asteroids', name: 'Ceres' },
  { id: 'jupiter', name: 'Jupiter' },
  { id: 'saturn', name: 'Saturn' },
  { id: 'uranus', name: 'Uranus' },
  { id: 'neptune', name: 'Neptune' }
];

const CELESTIAL_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'asteroids', 'jupiter', 'saturn', 'uranus', 'neptune'];
const SPEED_PRESETS = [1, 5, 25, 100, 500];

// Exact accent colors per celestial body
const BODY_ACCENTS = {
  sun: '#FFB347',
  mercury: '#B8B2A7',
  venus: '#FFE5A3',
  earth: '#5BB8FF',
  mars: '#E2673A',
  asteroids: '#E0D8B0',
  ceres: '#E0D8B0',
  jupiter: '#D9A066',
  saturn: '#E8D08A',
  uranus: '#7DE8DA',
  neptune: '#4D8BFF',
  overview: '#5BB8FF'
};

const PLANET_STATS = {
  sun: { distance: '0 KM (CENTRE)', diameter: '1,392,700 KM', period: '230M YRS' },
  mercury: { distance: '57.9M KM', diameter: '4,879 KM', period: '88.0 DAYS' },
  venus: { distance: '108.2M KM', diameter: '12,104 KM', period: '224.7 DAYS' },
  earth: { distance: '149.6M KM', diameter: '12,742 KM', period: '365.25 DAYS' },
  mars: { distance: '227.9M KM', diameter: '6,779 KM', period: '687.0 DAYS' },
  asteroids: { distance: '414.0M KM', diameter: '946 KM', period: '1,682 DAYS' },
  ceres: { distance: '414.0M KM', diameter: '946 KM', period: '1,682 DAYS' },
  jupiter: { distance: '778.5M KM', diameter: '139,820 KM', period: '4,333 DAYS' },
  saturn: { distance: '1,434.0M KM', diameter: '116,460 KM', period: '10,759 DAYS' },
  uranus: { distance: '2,871.0M KM', diameter: '50,724 KM', period: '30,687 DAYS' },
  neptune: { distance: '4,495.0M KM', diameter: '49,244 KM', period: '60,190 DAYS' }
};

// 4 pure typographic sentences for each world (no table, no cards, max 38ch)
const PLANET_EXPLORE_TEXTS = {
  sun: "Sol accounts for 99.86 percent of the mass in the Solar System, converting 600 million tons of hydrogen into helium every second in its core. Its intense magnetic field drives violent solar flares and coronal mass ejections that sweep outward through interplanetary space. Light leaving the searing photosphere travels outward across the void for eight minutes before striking Earth's atmosphere. Immense plasma prominences arc along invisible magnetic lines thousands of kilometers into the corona.",
  mercury: "Mercury is a dense, heavily cratered iron core shrouded in an ultra-thin exosphere. With no substantial atmosphere to retain warmth, surface temperatures plunge from 430 degrees Celsius at high noon to minus 180 degrees during the night. Deep inside permanently shadowed polar craters, reservoirs of pristine water ice have remained frozen for billions of years. Its eccentric orbit precesses across spacetime in precise accordance with general relativity.",
  venus: "Venus is a runaway greenhouse inferno shrouded beneath impenetrable clouds of concentrated sulfuric acid. A surface atmospheric pressure ninety times that of Earth produces crushing ambient conditions hotter than the melting point of lead. Slow retrograde rotation turns its day longer than its year, causing the Sun to rise in the west and set in the east. Vast volcanic basalt plains cover its geology, unmarred by water or seasonal weather.",
  earth: "Earth is the dynamic sanctuary of the solar system, holding vast liquid oceans and an oxygen-rich nitrogen atmosphere. Plate tectonics and an active geodynamo shield surface biology from solar wind and cosmic radiation. Dynamic water-vapor weather systems continuously sculpt continents and balance climate equilibrium across the biosphere. From high orbit, cities illuminate the night hemisphere while the thin blue veil of atmosphere marks the boundary with the void.",
  mars: "Mars is a cold, desert world preserving the fossilized riverbeds and flood channels of an ancient warmer climate. Its surface features Olympus Mons, the largest volcano in the Solar System, and the vast canyon network of Valles Marineris. Fine ferric oxide dust suspended across its thin carbon dioxide atmosphere gives the sky a subtle butterscotch hue. At its poles, layered sheets of water ice and dry ice advance and retreat with the Martian seasons.",
  asteroids: "Ceres is the queen of the asteroid belt, a spherical dwarf planet containing nearly a third of the belt's total mass. Beneath its cratered crust lies a vast mantle of water ice and brine reservoirs that once fed active cryovolcanoes. Ahuna Mons rises as an isolated cryovolcanic dome above the surrounding impact plains. In Occator Crater, bright sodium carbonate evaporites gleam like beacons against the dark regolith.",
  ceres: "Ceres is the queen of the asteroid belt, a spherical dwarf planet containing nearly a third of the belt's total mass. Beneath its cratered crust lies a vast mantle of water ice and brine reservoirs that once fed active cryovolcanoes. Ahuna Mons rises as an isolated cryovolcanic dome above the surrounding impact plains. In Occator Crater, bright sodium carbonate evaporites gleam like beacons against the dark regolith.",
  jupiter: "Jupiter is the undisputed titan of the system, with more mass than all other planets combined. Vast atmospheric jet streams shear into contrasting counter-rotating belts and zones whipped by thousand-kilometer winds. The Great Red Spot, an anticyclonic storm larger than Earth, has raged across the southern hemisphere for centuries. Deep within, crushing pressures transition molecular hydrogen into an exotic ocean of liquid metallic hydrogen.",
  saturn: "Saturn is famed for its ring system, an exquisite disc of water ice particles and boulders extending hundreds of thousands of kilometers yet only meters thick. Complex gravitational resonances from shepherd moons sculpt the sharp edges of the Cassini and Encke divisions. Its churning gold-tinted atmosphere exhibits a persistent hexagonal jet stream locked around the north pole. Dozens of icy moons accompany its journey, including hydrocarbon-rich Titan and cryo-geyser world Enceladus.",
  uranus: "Uranus is an ice giant uniquely tipped on its side with an axial tilt of 98 degrees, rolling through its orbit like an orbital wheel. Its pale aquamarine color stems from methane absorption in an atmosphere composed primarily of hydrogen and helium. Deep inside, a dense slush of water, ammonia, and methane mantle surrounds a small rocky core. Faint dark charcoal rings and twenty-seven diminutive moons orbit in its equatorial plane.",
  neptune: "Neptune is the storm-swept outpost of the major planets, driven by the fastest supersonic winds in the Solar System reaching over 2,000 kilometers per hour. Its deep azure coloration reflects methane in the upper atmosphere, marked by ephemeral high-altitude methane ice clouds. Geologically active Triton orbits in retrograde, ejecting geysers of nitrogen gas into the near-vacuum of space. It marks the inner shoreline of the icy Kuiper Belt."
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
  onReplayIntro
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [simDate, setSimDate] = useState(() => Date.now());
  const [isExploreOpen, setIsExploreOpen] = useState(false);

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

  // Reset explore open state on body change
  useEffect(() => {
    setIsExploreOpen(false);
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

  const goToPrev = () => {
    const idx = CELESTIAL_ORDER.indexOf(selectedBody);
    if (idx === -1 || idx === 0) {
      onSelectBody(CELESTIAL_ORDER[CELESTIAL_ORDER.length - 1]);
    } else {
      onSelectBody(CELESTIAL_ORDER[idx - 1]);
    }
  };

  const goToNext = () => {
    const idx = CELESTIAL_ORDER.indexOf(selectedBody);
    if (idx === -1 || idx === CELESTIAL_ORDER.length - 1) {
      onSelectBody(CELESTIAL_ORDER[0]);
    } else {
      onSelectBody(CELESTIAL_ORDER[idx + 1]);
    }
  };

  const {
    isSurfaceMode,
    triggerFlyTo,
    triggerReturnToOrbit
  } = useEarthSurfaceStore();

  const selectedData = PLANETS_CONFIG[selectedBody];
  const accentColor = BODY_ACCENTS[selectedBody] || '#5BB8FF';
  const stats = PLANET_STATS[selectedBody] || { distance: 'N/A', diameter: 'N/A', period: 'N/A' };
  const exploreCopy = PLANET_EXPLORE_TEXTS[selectedBody] || selectedData?.description || '';

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-6 sm:p-8 font-sans transition-opacity duration-600 ${
        !uiVisible || isIdle ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP HEADER: SHARED WORDMARK + INTER 12PX TRACKING 0.24EM NAV        */}
      {/* --------------------------------------------------------------------- */}
      <header className="w-full flex items-center justify-between gap-6 pointer-events-auto whitespace-nowrap overflow-x-auto py-1">
        {/* Brand & Simulation Live Indicator */}
        <div className="flex items-center space-x-3 text-white/90 shrink-0">
          <Wordmark href="#/" />
          <span className="text-white/20">/</span>
          <span className="text-[12px] font-sans text-white/50 tracking-[0.24em] uppercase hidden md:inline">
            SIMULATOR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
            {isPaused ? 'PAUSED' : `${timeMultiplier}X LIVE`}
          </span>
        </div>

        {/* Minimalist Top Celestial Navigation Strip in Inter 12px uppercase tracking 0.24em */}
        <nav className="flex items-center space-x-3 sm:space-x-4 text-[12px] font-sans tracking-[0.24em] uppercase shrink-0">
          {CELESTIAL_LIST.map(({ id, name }) => {
            const isActive = selectedBody === id;
            return (
              <button
                key={id}
                onClick={() => onSelectBody(id)}
                title={`Focus on ${name}`}
                className={`transition-all duration-200 cursor-pointer shrink-0 pb-0.5 border-b ${
                  isActive
                    ? 'text-[#FFF8E7] border-[#FFF8E7] font-medium'
                    : 'text-[#FFF8E7]/40 hover:text-[#FFF8E7]/80 border-transparent'
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
                if (setViewMode) setViewMode('cinematic');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
              title="Switch to Cinematic Camera & Scaling"
              className={`pb-0.5 border-b cursor-pointer transition-all ${
                viewMode === 'cinematic'
                  ? 'text-[#FFF8E7] border-[#FFF8E7] font-medium'
                  : 'text-[#FFF8E7]/40 hover:text-[#FFF8E7]/80 border-transparent'
              }`}
            >
              CINEMATIC
            </button>
            <button
              onClick={() => {
                if (setViewMode) setViewMode('scientific');
                if (selectedBody !== 'overview') onSelectBody('overview');
              }}
              title="Switch to Scientific Scale & Proportions"
              className={`pb-0.5 border-b cursor-pointer transition-all ${
                viewMode === 'scientific'
                  ? 'text-[#FFF8E7] border-[#FFF8E7] font-medium'
                  : 'text-[#FFF8E7]/40 hover:text-[#FFF8E7]/80 border-transparent'
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
      {/* 2. REFINED INFO BLOCK (Zero tables, zero grids, zero hairlines/boxes) */}
      {/* --------------------------------------------------------------------- */}
      {selectedData && selectedBody !== 'overview' && (
        <aside
          id="planet-info-block"
          data-testid="planet-info-block"
          key={selectedBody}
          className="max-w-md pointer-events-auto my-auto pl-2 sm:pl-4 select-none"
        >
          {/* Micro-label with 2x14px accent-colored vertical bar */}
          <div className="flex items-center space-x-2.5 mb-2.5">
            <span
              className="inline-block w-[2px] h-[14px]"
              style={{ backgroundColor: accentColor }}
            />
            <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-[#FFF8E7]/60">
              {selectedData.category || 'CELESTIAL BODY'}
            </span>
            <span className="text-[#FFF8E7]/20">/</span>
            <button
              onClick={goToPrev}
              className="font-sans text-[10px] tracking-[0.16em] uppercase text-[#FFF8E7]/40 hover:text-[#FFF8E7] transition-colors cursor-pointer"
            >
              PREV
            </button>
            <span className="text-[#FFF8E7]/20">/</span>
            <button
              onClick={goToNext}
              className="font-sans text-[10px] tracking-[0.16em] uppercase text-[#FFF8E7]/40 hover:text-[#FFF8E7] transition-colors cursor-pointer"
            >
              NEXT
            </button>
          </div>

          {/* Serif Planet Name (Cormorant Garamond, uppercase, wide tracking) */}
          <h1 className="font-serif text-5xl sm:text-6xl font-normal tracking-[0.12em] text-[#FFF8E7] uppercase leading-none mb-3">
            {selectedData.name}
          </h1>

          {/* 1 to 2 short sentences of description */}
          <p className="font-sans font-light text-[14px] text-[#FFF8E7]/80 leading-relaxed max-w-sm mb-5">
            {selectedData.tagline || selectedData.description}
          </p>

          {/* Three plain typographic lines in Inter 300 15px (cream) with stat numerals tinted in accent */}
          <div className="space-y-1.5 font-sans font-light text-[15px] text-[#FFF8E7] mb-5">
            <div className="flex items-baseline space-x-2">
              <span className="text-[#FFF8E7]/60">Distance from Sun:</span>
              <span className="font-normal tracking-wide" style={{ color: accentColor }}>
                {stats.distance}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-[#FFF8E7]/60">Diameter:</span>
              <span className="font-normal tracking-wide" style={{ color: accentColor }}>
                {stats.diameter}
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-[#FFF8E7]/60">Orbital period:</span>
              <span className="font-normal tracking-wide" style={{ color: accentColor }}>
                {stats.period}
              </span>
            </div>
          </div>

          {/* EXPLORE action button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExploreOpen((prev) => !prev)}
              className="font-sans text-[12px] uppercase tracking-[0.24em] cursor-pointer flex items-center space-x-2 transition-colors hover:text-white"
              style={{ color: accentColor }}
            >
              <span>{isExploreOpen ? 'CLOSE READING' : 'EXPLORE'}</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* EXPLORE Text Layer: Pure typographic reading view of 4 sentences (max 38ch, zero table, zero card) */}
          {isExploreOpen && (
            <div className="mt-4 font-sans font-light text-[15px] text-[#FFF8E7]/90 leading-relaxed max-w-[38ch] transition-opacity duration-300">
              <p>{exploreCopy}</p>
            </div>
          )}
        </aside>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. BOTTOM FOOTER CONTROLS IN INTER 12-13PX, "LANDING" LINK            */}
      {/* --------------------------------------------------------------------- */}
      <footer className="w-full flex flex-wrap items-center justify-between gap-4 pointer-events-auto py-1 font-sans text-[12px] sm:text-[13px] tracking-[0.16em]">
        {/* Play/Pause & Speed Controls */}
        <div className="flex items-center space-x-4 text-white/90">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Simulation (Space)' : 'Pause Simulation (Space)'}
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="uppercase">{isPaused ? 'PLAY' : 'PAUSE'}</span>
          </button>

          <span className="text-white/20">|</span>

          {/* Speed Presets */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            {SPEED_PRESETS.map((speed) => (
              <button
                key={speed}
                onClick={() => setTimeMultiplier(speed)}
                className={`transition-colors cursor-pointer pb-0.5 ${
                  timeMultiplier === speed && !isPaused
                    ? 'text-emerald-400 font-bold border-b border-emerald-400'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {speed}X
              </button>
            ))}
          </div>

          <span className="text-white/20">|</span>

          {/* Live Astronomical Date & Time */}
          <div className="flex items-center space-x-2 text-[11px] font-mono text-white/60">
            <span>{formattedSimDate}</span>
            <button
              onClick={handleResetToNow}
              className="text-[10px] font-mono uppercase text-cyan-400 hover:text-cyan-200 border border-cyan-400/40 hover:border-cyan-400 px-1 py-0.5 transition-colors cursor-pointer"
              title="Reset simulation time to current date/time"
            >
              NOW
            </button>
          </div>
        </div>

        {/* View Toggles & Reset with Tooltips */}
        <div className="flex items-center space-x-4 text-white/40">
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            title="Toggle Orbital Trajectories (O)"
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showOrbits ? 'text-[#FFF8E7]' : 'hover:text-[#FFF8E7]/70'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-cyan-400/80" />
            <span className="uppercase">ORBITS ({showOrbits ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle Celestial Labels (L)"
            className={`transition-colors cursor-pointer flex items-center space-x-1 ${
              showLabels ? 'text-[#FFF8E7]' : 'hover:text-[#FFF8E7]/70'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="uppercase">LABELS ({showLabels ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={onResetCamera}
            title="Reset Camera to Overview (Esc or R)"
            className="hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="uppercase">RESET CAMERA</span>
          </button>

          {/* Renamed "HOME" to "LANDING" */}
          <a
            href="#/"
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
