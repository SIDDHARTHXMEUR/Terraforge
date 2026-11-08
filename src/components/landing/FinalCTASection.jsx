import React from 'react';

export function FinalCTASection() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-6 text-center select-none pointer-events-none">
      <div className="max-w-2xl z-20 pointer-events-auto">
        {/* Micro-label */}
        <div className="font-sans text-[11px] uppercase tracking-[0.5em] text-[#929BA8] mb-4">
          TERRAFORGE SIMULATION PLATFORM
        </div>

        {/* Headline */}
        <h2 className="font-serif text-5xl sm:text-7xl font-light uppercase tracking-[0.08em] text-[#E9EDF2] leading-tight mb-4">
          YOUR SOLAR SYSTEM.<br />YOUR PERSPECTIVE.
        </h2>

        {/* Supporting statement */}
        <p className="font-sans text-sm sm:text-base tracking-[0.2em] text-[#929BA8] uppercase mb-10 max-w-md mx-auto">
          Begin exploring the worlds around our Sun.
        </p>

        {/* Button */}
        <div>
          <a
            href="#/sim"
            className="inline-flex items-center space-x-3 px-10 py-4 bg-[#E9EDF2] hover:bg-white text-[#030508] font-sans text-xs uppercase tracking-[0.25em] font-medium transition-all shadow-[0_0_35px_rgba(233,237,242,0.3)] hover:shadow-[0_0_50px_rgba(233,237,242,0.5)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7AD1FF]"
          >
            <span>ENTER TERRAFORGE</span>
            <span className="font-mono text-xs">&gt;</span>
          </a>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-[10px] font-mono tracking-widest text-[#929BA8]/50 uppercase">
          TERRAFORGE ENGINE // SCIENTIFIC VISUALIZATION // NASA FACTSHEET TELEMETRY
        </div>
      </div>
    </div>
  );
}
