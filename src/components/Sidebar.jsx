import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe2,
  Play,
  Pause,
  Globe,
  Thermometer,
  Move,
  Eye,
  BookOpen,
  Pin,
  PinOff,
  RotateCcw,
  Camera,
  Layers,
  Sparkles,
  Sun,
  Snowflake,
  Flame,
  Check,
  Calendar
} from 'lucide-react';
import { PRESETS } from '../data/presets';
import { TransformPanel } from './TransformPanel';
import { SimControls } from './SimControls';

export function Sidebar({
  sim,
  updateSim,
  transform,
  updateTransform,
  resetTransform,
  activePreset,
  applyPreset,
  isTrueScale,
  toggleTrueScale,
  showOrbits,
  toggleShowOrbits,
  cameraMode,
  toggleCameraMode,
  triggerCameraReset,
  activeDrawer,
  toggleDrawer,
  elapsedDays
}) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [screenshotStatus, setScreenshotStatus] = useState(false);

  // Active flyout drawer state: 'world' | 'climate' | 'transform' | 'view' | null
  const activeFlyout = activeDrawer;

  // Keyboard Shortcuts Handler: Space (Play/Pause), 1-3 (Presets), R (Camera Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        updateSim('isPlaying', !sim.isPlaying);
      } else if (e.key === '1') {
        applyPreset('earth');
      } else if (e.key === '2') {
        applyPreset('ice');
      } else if (e.key === '3') {
        applyPreset('desert');
      } else if (e.key === 'r' || e.key === 'R') {
        triggerCameraReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sim.isPlaying, updateSim, applyPreset, triggerCameraReset]);

  // Canvas Screenshot Exporter (Captures WebGL Canvas to PNG)
  const handleTakeScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `terraforge-3d-snapshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setScreenshotStatus(true);
      setTimeout(() => setScreenshotStatus(false), 2500);
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  }, []);

  // Calculate simulated calendar date from elapsedDays
  const formattedSimDate = useMemo(() => {
    const days = elapsedDays || 0;
    const startDate = new Date(2026, 0, 1);
    const currDate = new Date(startDate.getTime() + days * 86400000);
    const dayNum = Math.floor(days) + 1;
    const monthStr = currDate.toLocaleDateString('en-US', { month: 'short' });
    const dayStr = String(currDate.getDate()).padStart(2, '0');
    const yearStr = currDate.getFullYear();
    return {
      dayNum,
      dateStr: `${dayStr} ${monthStr} ${yearStr}`,
      display: `Day ${dayNum} • ${dayStr} ${monthStr} ${yearStr}`
    };
  }, [elapsedDays]);

  const expanded = isPinned || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out flex flex-col justify-between bg-[#0f1115]/75 backdrop-blur-2xl border-r border-white/10 shadow-2xl ${
        expanded ? 'w-56' : 'w-16'
      }`}
    >
      {/* TOP SECTION: Logo + Play/Pause */}
      <div className="p-3 space-y-4">
        {/* 1. Brand Mark & Reset View Target */}
        <button
          onClick={triggerCameraReset}
          title="Reset to Default View (Key R)"
          className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-[#00f2fe]/15 text-[#00f2fe] border border-white/10 transition group"
        >
          <div className="p-1.5 rounded-lg bg-[#00f2fe]/20 text-[#00f2fe] shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          {expanded && (
            <div className="text-left overflow-hidden whitespace-nowrap animate-fade-in">
              <div className="font-outfit font-bold text-xs text-white tracking-wider uppercase">
                Terraforge <span className="text-[#00f2fe] font-mono text-[10px]">3D</span>
              </div>
              <div className="text-[9px] font-mono text-gray-400">Planetary Engine</div>
            </div>
          )}
        </button>

        {/* 2. Play / Pause Toggle (Always Visible Top Rail Control) */}
        <button
          onClick={() => updateSim('isPlaying', !sim.isPlaying)}
          title={sim.isPlaying ? 'Pause Simulation (Space)' : 'Play Simulation (Space)'}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
            sim.isPlaying
              ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          <div className="shrink-0 mx-auto">
            {sim.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </div>
          {expanded && (
            <span className="text-xs font-semibold overflow-hidden whitespace-nowrap animate-fade-in">
              {sim.isPlaying ? 'Pause Motion' : 'Play Motion'}
            </span>
          )}
        </button>

        <div className="h-[1px] bg-white/10 my-2" />

        {/* MAIN NAVIGATION ITEMS */}
        <nav className="space-y-1.5">
          {/* 3. World (Preset Switcher) */}
          <button
            onClick={() => toggleDrawer('world')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
              activeFlyout === 'world'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
            title="World Climate Presets (Keys 1-3)"
          >
            <Globe className="w-5 h-5 shrink-0 mx-auto" />
            {expanded && (
              <div className="flex items-center justify-between w-full overflow-hidden whitespace-nowrap animate-fade-in text-xs font-medium">
                <span>World</span>
                <span className="text-[10px] uppercase font-mono text-[#00f2fe]">{activePreset}</span>
              </div>
            )}
          </button>

          {/* 4. Climate (Simulation Parameters) */}
          <button
            onClick={() => toggleDrawer('sim')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
              activeFlyout === 'sim'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
            title="Climate Parameters (Temp, Clouds, Speed)"
          >
            <Thermometer className="w-5 h-5 shrink-0 mx-auto" />
            {expanded && (
              <span className="text-xs font-medium overflow-hidden whitespace-nowrap animate-fade-in">
                Climate
              </span>
            )}
          </button>

          {/* 5. Transform (Matrix Inspector) */}
          <button
            onClick={() => toggleDrawer('transform')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
              activeFlyout === 'transform'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
            title="Transform Matrix & Local Axes"
          >
            <Move className="w-5 h-5 shrink-0 mx-auto" />
            {expanded && (
              <span className="text-xs font-medium overflow-hidden whitespace-nowrap animate-fade-in">
                Transform
              </span>
            )}
          </button>

          {/* 6. View (Camera & Overlay Options) */}
          <button
            onClick={() => toggleDrawer('view')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition ${
              activeFlyout === 'view'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
            title="View Options (Projections, Orbits, True Scale)"
          >
            <Eye className="w-5 h-5 shrink-0 mx-auto" />
            {expanded && (
              <span className="text-xs font-medium overflow-hidden whitespace-nowrap animate-fade-in">
                View
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* BOTTOM SECTION: Lock Pin */}
      <div className="p-3 border-t border-white/10">
        {/* Pin / Lock Sidebar Toggle */}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition ${
            isPinned
              ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
          title={isPinned ? 'Unlock Sidebar Auto-collapse' : 'Lock Sidebar Open'}
        >
          <div className="shrink-0 mx-auto">
            {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
          </div>
          {expanded && (
            <span className="text-[11px] font-mono overflow-hidden whitespace-nowrap animate-fade-in">
              {isPinned ? 'Sidebar Locked' : 'Lock Sidebar'}
            </span>
          )}
        </button>
      </div>

      {/* DOCKED FLYOUT PANELS (Slide in directly to the right of the sidebar) */}

      {/* FLYOUT 1: WORLD (PRESETS) */}
      {activeFlyout === 'world' && (
        <div className="absolute top-16 left-full ml-3 z-40 solar-drawer p-4 rounded-2xl w-64 border border-white/15 text-white shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <h4 className="font-outfit font-semibold text-xs text-[#00f2fe] uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" /> World Climate Presets
            </h4>
            <span className="text-[10px] font-mono text-gray-400">Keys 1-3</span>
          </div>

          <div className="space-y-2">
            {/* Earth */}
            <button
              onClick={() => applyPreset('earth')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                activePreset === 'earth'
                  ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-white'
                  : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-xs font-semibold">Earth</div>
                  <div className="text-[10px] text-gray-400">Terra (+15°C)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">1</span>
            </button>

            {/* Ice */}
            <button
              onClick={() => applyPreset('ice')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                activePreset === 'ice'
                  ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-white'
                  : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Snowflake className="w-4 h-4 text-cyan-300" />
                <div className="text-left">
                  <div className="text-xs font-semibold">Ice</div>
                  <div className="text-[10px] text-gray-400">Frostworld (-60°C)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">2</span>
            </button>

            {/* Desert */}
            <button
              onClick={() => applyPreset('desert')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                activePreset === 'desert'
                  ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-white'
                  : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <div className="text-xs font-semibold">Desert</div>
                  <div className="text-[10px] text-gray-400">Scorched Expanse (+60°C)</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">3</span>
            </button>
          </div>
        </div>
      )}

      {/* FLYOUT 2: CLIMATE (SIMULATION PARAMETERS) */}
      {activeFlyout === 'sim' && (
        <div className="absolute top-24 left-full ml-3 z-40">
          <SimControls sim={sim} updateSim={updateSim} onClose={() => toggleDrawer('sim')} />
        </div>
      )}

      {/* FLYOUT 3: TRANSFORM MATRIX */}
      {activeFlyout === 'transform' && (
        <div className="absolute top-32 left-full ml-3 z-40">
          <TransformPanel
            transform={transform}
            updateTransform={updateTransform}
            resetTransform={resetTransform}
            onClose={() => toggleDrawer('transform')}
          />
        </div>
      )}

      {/* FLYOUT 4: VIEW OPTIONS (CONSOLIDATED) */}
      {activeFlyout === 'view' && (
        <div className="absolute top-40 left-full ml-3 z-40 solar-drawer p-4 rounded-2xl w-72 border border-white/15 text-white shadow-2xl animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-outfit font-semibold text-xs text-[#00f2fe] uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" /> View & Camera Controls
            </h4>
          </div>

          {/* Simulated Date / Time Readout */}
          <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00f2fe]/20 text-[#00f2fe]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Simulated Date</div>
                <div className="text-xs font-mono font-bold text-[#00f2fe]">
                  {formattedSimDate.display}
                </div>
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
              sim.isPlaying ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {sim.isPlaying ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          {/* Perspective / Orthographic Toggle */}
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold">Projection Mode</div>
              <div className="text-[10px] text-gray-400">
                {cameraMode === 'perspective' ? 'Perspective Projection (45° FOV)' : 'Orthographic Projection'}
              </div>
            </div>
            <button
              onClick={toggleCameraMode}
              className="px-2.5 py-1 rounded-lg bg-[#00f2fe]/20 text-[#00f2fe] text-xs font-mono border border-[#00f2fe]/40 hover:bg-[#00f2fe]/30 transition"
              title={cameraMode === 'perspective' ? 'Switch to Orthographic Projection' : 'Switch to Perspective Projection'}
            >
              {cameraMode === 'perspective' ? 'PERS' : 'ORTH'}
            </button>
          </div>

          {/* True Scale Mode Toggle */}
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold">True Scale Mode</div>
              <div className="text-[10px] text-gray-400">Real Sun radius & distance</div>
            </div>
            <button
              onClick={toggleTrueScale}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                isTrueScale ? 'bg-[#00f2fe]' : 'bg-gray-800'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                  isTrueScale ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Orbit Paths Toggle */}
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold">Orbit Paths</div>
              <div className="text-[10px] text-gray-400">Earth tilt axis, Moon & Sun orbits</div>
            </div>
            <button
              onClick={toggleShowOrbits}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                showOrbits ? 'bg-[#00f2fe]' : 'bg-gray-800'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                  showOrbits ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions: Reset Camera & Screenshot */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={triggerCameraReset}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-gray-300 hover:text-white border border-white/10 transition"
              title="Reset Camera Position (Key R)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#00f2fe]" /> Reset View
            </button>
            <button
              onClick={handleTakeScreenshot}
              className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs border transition ${
                screenshotStatus
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#00f2fe]/15 text-[#00f2fe] hover:bg-[#00f2fe]/25 border-[#00f2fe]/30'
              }`}
              title="Export Current View as PNG image"
            >
              {screenshotStatus ? <Check className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              {screenshotStatus ? 'Saved PNG' : 'Export PNG'}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
