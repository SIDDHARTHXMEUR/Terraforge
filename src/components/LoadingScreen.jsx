import React from 'react';
import { Globe2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4 font-sans animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-[#00f2fe]/20 border-t-[#00f2fe] animate-spin" />
        <Globe2 className="w-7 h-7 text-[#00f2fe] absolute" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="font-outfit font-bold text-lg text-white tracking-wider uppercase">
          Terraforge <span className="text-[#00f2fe] font-mono">3D</span>
        </h2>
        <p className="text-xs text-gray-400 font-mono tracking-wide">
          Loading 4K NASA Planetary Textures...
        </p>
      </div>
    </div>
  );
}
