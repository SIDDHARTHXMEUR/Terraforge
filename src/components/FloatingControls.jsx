import React from 'react';
import {
  Globe,
  Snowflake,
  SunMedium,
  Play,
  Pause,
  Move,
  Sliders,
  Camera,
  RotateCcw,
  BookOpen,
  Maximize2,
  Compass
} from 'lucide-react';

export function FloatingControls({
  activePreset,
  applyPreset,
  isPlaying,
  togglePlay,
  activeDrawer,
  toggleDrawer,
  isTrueScale,
  toggleTrueScale,
  showOrbits,
  toggleShowOrbits,
  cameraMode,
  toggleCameraMode,
  triggerCameraReset
}) {
  return (
    <div className="solar-floating-bar px-3 py-2 rounded-2xl flex items-center gap-2 pointer-events-auto shadow-2xl">
      {/* Preset Quick Toggles */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-2">
        <button
          onClick={() => applyPreset('earth')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activePreset === 'earth'
              ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Earth Preset (1.5s Lerp)"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">Earth</span>
        </button>

        <button
          onClick={() => applyPreset('ice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activePreset === 'ice'
              ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Ice World Preset (1.5s Lerp)"
        >
          <Snowflake className="w-4 h-4" />
          <span className="hidden sm:inline">Ice</span>
        </button>

        <button
          onClick={() => applyPreset('desert')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activePreset === 'desert'
              ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Desert World Preset (1.5s Lerp)"
        >
          <SunMedium className="w-4 h-4" />
          <span className="hidden sm:inline">Desert</span>
        </button>
      </div>

      {/* Play / Pause Toggle */}
      <button
        onClick={togglePlay}
        className={`p-2 rounded-xl transition ${
          isPlaying
            ? 'text-[#00f2fe] bg-cyan-500/10 border border-[#00f2fe]/40'
            : 'text-gray-400 hover:text-white bg-white/5'
        }`}
        title={isPlaying ? 'Pause Rotation' : 'Play Rotation'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </button>

      {/* True Scale Toggle */}
      <button
        onClick={toggleTrueScale}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
          isTrueScale
            ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        title="Toggle Astronomical True Scale (60.3 Earth Radii Moon Orbit)"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="hidden md:inline">True Scale</span>
      </button>

      {/* Show Orbits & Axis Toggle */}
      <button
        onClick={toggleShowOrbits}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
          showOrbits
            ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        title="Toggle Orbits & Earth Rotation Axis Line Overlay"
      >
        <Compass className="w-4 h-4" />
        <span className="hidden md:inline">Orbits & Axis</span>
      </button>

      {/* Drawer Toggles */}
      <div className="flex items-center gap-1 border-l border-r border-white/10 px-2">
        {/* Transform Drawer Toggle */}
        <button
          onClick={() => toggleDrawer('transform')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeDrawer === 'transform'
              ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Transform Panel Sliders"
        >
          <Move className="w-4 h-4" />
          <span className="hidden md:inline">Transform</span>
        </button>

        {/* Simulation Sliders Drawer Toggle */}
        <button
          onClick={() => toggleDrawer('sim')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeDrawer === 'sim'
              ? 'bg-cyan-500/20 text-[#00f2fe] border border-[#00f2fe]/50 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          title="Simulation Parameters Sliders"
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden md:inline">Sliders</span>
        </button>
      </div>

      {/* Camera & Viva Guide Controls */}
      <div className="flex items-center gap-1">
        {/* Projection Switch */}
        <button
          onClick={toggleCameraMode}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition flex items-center gap-1"
          title={`Switch Projection (Current: ${cameraMode})`}
        >
          <Camera className="w-4 h-4 text-gray-300" />
          <span className="text-[10px] font-mono font-bold uppercase text-[#00f2fe] hidden lg:inline">
            {cameraMode.slice(0, 4)}
          </span>
        </button>

        {/* Camera Reset */}
        <button
          onClick={triggerCameraReset}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
