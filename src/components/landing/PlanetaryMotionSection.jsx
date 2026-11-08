import React from 'react';

export function PlanetaryMotionSection() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-6 text-center select-none pointer-events-none">
      <div className="max-w-3xl z-20 pointer-events-auto">
        {/* Micro-label */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7AD1FF] animate-ping" />
          <span className="font-sans text-[11px] uppercase tracking-[0.45em] text-[#929BA8]">
            SECTION 04 // DYNAMICS
          </span>
        </div>

        {/* Headline */}
        <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light uppercase tracking-[0.08em] text-[#E9EDF2] leading-tight mb-6">
          THE SOLAR SYSTEM IS NEVER STILL.
        </h2>

        {/* Supporting statement */}
        <p className="font-sans text-sm sm:text-base md:text-lg leading-relaxed text-[#929BA8] max-w-2xl mx-auto mb-10">
          Every planet rotates, every world follows its orbit, and every moment creates a different configuration.
        </p>

        {/* Clear CTA to enter real simulator */}
        <div>
          <a
            href="#/sim"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-transparent border border-space-25 hover:border-[#7AD1FF] text-[#E9EDF2] hover:text-[#7AD1FF] font-sans text-xs uppercase tracking-[0.25em] transition-all hover:bg-[#7AD1FF]/10 cursor-pointer shadow-lg focus:outline-none focus:ring-1 focus:ring-[#7AD1FF]"
          >
            <span>EXPERIENCE IT IN REAL TIME</span>
            <span className="font-mono text-xs">&gt;</span>
          </a>
        </div>

        {/* Technical metadata footnote */}
        <div className="mt-12 flex items-center justify-center space-x-6 text-[10px] font-mono tracking-widest text-[#929BA8]/60 uppercase">
          <span>KEPLERIAN HARMONICS</span>
          <span>•</span>
          <span>1:1 ASTRONOMICAL TIME</span>
          <span>•</span>
          <span>N-BODY STABILITY</span>
        </div>
      </div>
    </div>
  );
}
