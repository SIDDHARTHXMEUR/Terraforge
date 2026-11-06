import React from 'react';
import { useProgress } from '@react-three/drei';
import { Film } from 'lucide-react';

export function LoadingScreen() {
  const { progress, active, item } = useProgress();

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white space-y-6 font-sans">
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <Film className="w-8 h-8 text-cyan-400 absolute opacity-80" />
      </div>

      <div className="text-center space-y-2 max-w-sm px-6">
        <div className="text-[11px] font-mono tracking-[0.35em] text-cyan-400 uppercase">
          TERRAFORGE CINEMATIC ODYSSEY
        </div>
        <div className="text-xs text-gray-400 font-mono tracking-widest">
          INITIALIZING SOLAR SYSTEM SIMULATION
        </div>
        {active && (
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-3">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
