import React from 'react';

const CAPABILITIES = [
  {
    title: 'FREE CAMERA & ORBIT FOLLOW',
    desc: 'Glide freely between celestial bodies, lock onto planetary reference frames, or observe from deep space.'
  },
  {
    title: 'TIME FLOW CONTROL',
    desc: 'Manipulate simulation velocity from 1:1 real-time up to 10,000x, or reverse orbital history to inspect alignments.'
  },
  {
    title: 'PHYSICALLY GROUNDED SHADERS',
    desc: 'High-resolution NASA surface textures, dynamic Black Marble city lights, dynamic weather clouds, and Rayleigh limb scattering.'
  },
  {
    title: 'CELESTIAL TELEMETRY',
    desc: 'Inspect scientifically verified JPL/NASA planetary parameters: true radii, orbital velocities, axial inclinations, and light-times.'
  }
];

export function SimulatorPreviewSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 sm:px-12 py-16 flex flex-col justify-center select-none pointer-events-auto">
      {/* Section Micro-header */}
      <div className="mb-8 border-b border-space-14 pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7AD1FF]" />
          <span className="font-sans text-[11px] uppercase tracking-[0.45em] text-[#929BA8]">
            SECTION 05 // INTERACTIVE ENGINE
          </span>
        </div>
        <h2 className="font-serif text-4xl sm:text-6xl uppercase tracking-[0.08em] text-[#E9EDF2] leading-tight">
          NOT JUST A VIEW OF SPACE. A WORLD YOU CAN EXPLORE.
        </h2>
        <p className="font-sans text-sm sm:text-base text-[#929BA8] max-w-2xl mt-4 leading-relaxed">
          Move through the Solar System, examine individual worlds, observe planetary motion and manipulate simulation time.
        </p>
      </div>

      {/* 4 Essential Capabilities Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        {CAPABILITIES.map((cap, i) => (
          <div
            key={i}
            className="p-5 bg-[#080B10]/80 border border-space-14 rounded-sm hover:border-[#7AD1FF]/40 transition-colors"
          >
            <div className="font-mono text-[10px] text-[#7AD1FF] tracking-widest mb-3">
              0{i + 1} // CAPABILITY
            </div>
            <h3 className="font-sans text-xs uppercase tracking-wider text-[#E9EDF2] font-semibold mb-2">
              {cap.title}
            </h3>
            <p className="font-sans text-[12px] leading-relaxed text-[#929BA8]">
              {cap.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Primary CTA: "LAUNCH THE SIMULATOR" */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-space-14 pt-8">
        <div className="text-left mb-6 sm:mb-0">
          <div className="font-mono text-[11px] text-[#E9EDF2] uppercase tracking-wider">
            READY TO COMMENCE OBSERVATION
          </div>
          <div className="font-sans text-xs text-[#929BA8] mt-1">
            Zero scripted animations · Instant interactive WebGL engine
          </div>
        </div>

        <a
          href="#/sim"
          className="inline-flex items-center space-x-4 px-10 py-4 bg-[#E9EDF2] hover:bg-white text-[#030508] font-sans text-xs uppercase tracking-[0.25em] font-medium transition-all shadow-[0_0_30px_rgba(233,237,242,0.25)] hover:shadow-[0_0_40px_rgba(233,237,242,0.4)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7AD1FF]"
        >
          <span>LAUNCH THE SIMULATOR</span>
          <span className="font-mono text-sm">&gt;</span>
        </a>
      </div>
    </div>
  );
}
