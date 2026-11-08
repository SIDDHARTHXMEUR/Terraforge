import React from 'react';

export function LandingHeroOverlay({ onExploreUniverse }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 text-center select-none pointer-events-none">
      {/* 1. Technical Metadata Micro-label */}
      <div className="flex items-center space-x-3 mb-6 animate-fade-in pointer-events-auto">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7AD1FF] animate-pulse" />
        <span className="font-sans text-[11px] sm:text-[12px] uppercase tracking-[0.45em] text-[#929BA8]">
          REAL-TIME 3D SIMULATION
        </span>
      </div>

      {/* 2. Main Editorial Headline: "EXPLORE THE SOLAR SYSTEM." */}
      <div className="relative flex flex-col items-center justify-center my-3 max-w-5xl">
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-[0.08em] uppercase text-[#E9EDF2] leading-none select-none">
          EXPLORE THE SOLAR SYSTEM.
        </h1>
      </div>

      {/* 3. Supporting Statement */}
      <p className="font-sans text-[13px] sm:text-[15px] md:text-[16px] leading-relaxed text-[#929BA8] max-w-2xl mt-6 px-4">
        An interactive journey through the worlds, motion and mechanics of our cosmic neighbourhood.
      </p>

      {/* 4. Action Buttons (Primary CTA + Secondary CTA) */}
      <div className="mt-10 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 z-20 pointer-events-auto">
        {/* Primary CTA */}
        <a
          href="#/sim"
          className="inline-flex items-center space-x-3 px-8 py-3.5 bg-[#E9EDF2] text-[#030508] font-sans text-xs uppercase tracking-[0.22em] font-medium transition-all hover:bg-white hover:shadow-[0_0_24px_rgba(233,237,242,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7AD1FF]"
        >
          <span>ENTER THE SIMULATOR</span>
          <span className="font-mono text-xs">&gt;</span>
        </a>

        {/* Secondary CTA */}
        <button
          onClick={onExploreUniverse}
          className="inline-flex items-center space-x-2 px-6 py-3.5 border border-space-25 text-[#E9EDF2] font-sans text-xs uppercase tracking-[0.22em] hover:border-[#E9EDF2] hover:bg-white/5 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E9EDF2]"
        >
          <span>EXPLORE THE UNIVERSE</span>
          <span className="font-mono text-xs opacity-60">&darr;</span>
        </button>
      </div>

      {/* 5. Supporting Spec Metadata */}
      <div className="mt-8 font-mono text-[10px] tracking-[0.35em] uppercase text-[#929BA8]/70 pointer-events-auto">
        8 PLANETS · NATURAL SATELLITES · ORBITAL MOTION
      </div>

      {/* 6. Subtle Scroll Cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10">
        <span className="font-sans text-[9px] tracking-[0.45em] uppercase text-[#929BA8]/60 mb-2">
          SCROLL
        </span>
        <div className="w-[1px] h-[24px] bg-[#E9EDF2] animate-scroll-cue" />
      </div>
    </div>
  );
}
