import React from 'react';
import {
  Globe,
  Compass,
  Database,
  FlaskConical,
  Radio,
  Bot,
  LayoutDashboard,
  Settings,
  Info,
  Play,
  Pause,
  FastForward,
  Maximize2
} from 'lucide-react';
import { useAppStore } from '../state/useAppStore';

export function Navigation() {
  const {
    activeView,
    setActiveView,
    sim,
    updateSim,
    timeSpeed,
    setTimeSpeed,
    units,
    toggleUnits
  } = useAppStore();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'explorer', label: 'Explorer', icon: Compass },
    { id: 'intelligence', label: 'Intelligence', icon: Database },
    { id: 'simlab', label: 'Simulation Lab', icon: FlaskConical },
    { id: 'missioncontrol', label: 'Mission Control', icon: Radio },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between text-xs font-mono select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('overview')}>
          <div className="w-8 h-8 rounded-sm bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.3)]">
            <Globe className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-bold tracking-widest text-sm text-white">TERRAFORGE</span>
              <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30 font-sans font-semibold">2.0</span>
            </div>
            <div className="text-[9px] text-gray-400 tracking-wider">PLANETARY INTELLIGENCE</div>
          </div>
        </div>

        {/* Live System Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-gray-300">TELEMETRY LOCK</span>
        </div>
      </div>

      {/* Primary Center Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-md border border-white/5 overflow-x-auto max-w-[55vw]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.2)] font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Sim Playback, Speed, Units, Fullscreen */}
      <div className="flex items-center gap-2 text-[11px]">
        {/* Play/Pause Button */}
        <button
          onClick={() => updateSim('isPlaying', !sim.isPlaying)}
          title="Toggle Simulation (Space)"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded border transition-all ${
            sim.isPlaying
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
          }`}
        >
          {sim.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{sim.isPlaying ? 'RUNNING' : 'PAUSED'}</span>
        </button>

        {/* Time Acceleration Multiplier */}
        <div className="hidden md:flex items-center bg-black/60 border border-white/10 rounded px-1.5 py-1 text-gray-300">
          <FastForward className="w-3 h-3 text-cyan-400 mr-1" />
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setTimeSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                timeSpeed === s
                  ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                  : 'hover:text-white text-gray-400'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Metric / Imperial Unit Toggle */}
        <button
          onClick={toggleUnits}
          title="Toggle Measurement Units"
          className="px-2 py-1.5 rounded border border-white/10 bg-white/5 text-gray-300 hover:text-white text-[10px]"
        >
          {units === 'metric' ? 'METRIC (SI)' : 'IMPERIAL'}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreenToggle}
          title="Toggle Fullscreen"
          className="p-1.5 rounded border border-white/10 bg-white/5 text-gray-300 hover:text-cyan-400"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
