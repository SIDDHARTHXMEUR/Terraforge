import React from 'react';
import { PRESETS } from '../data/presets';
import { Globe, Snowflake, SunMedium, Sparkles } from 'lucide-react';

export function Presets({ activePreset, applyPreset }) {
  const presetIcons = {
    earth: Globe,
    ice: Snowflake,
    desert: SunMedium
  };

  const presetColors = {
    earth: 'from-blue-600/30 to-emerald-600/30 border-blue-500/50 text-blue-300',
    ice: 'from-sky-600/30 to-cyan-600/30 border-cyan-400/50 text-cyan-200',
    desert: 'from-amber-600/30 to-orange-600/30 border-amber-500/50 text-amber-300'
  };

  return (
    <div className="glass-panel p-3 rounded-xl text-white space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets & Tween Interpolation (~1.5s Lerp)
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.keys(PRESETS).map((key) => {
          const preset = PRESETS[key];
          const Icon = presetIcons[key];
          const isActive = activePreset === key;

          return (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-center ${
                isActive
                  ? `bg-gradient-to-b ${presetColors[key]} shadow-lg scale-[1.02] ring-1 ring-white/30`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold">{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
