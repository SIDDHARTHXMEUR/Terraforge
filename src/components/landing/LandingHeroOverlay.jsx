import React from 'react';

export function LandingHeroOverlay({ progress = 0 }) {
  // Hero wordmark parallaxes upward slowly (0.5x scroll speed) and fades out by 35% of hero (progress 0.35)
  // Never clipped by top edge while visible, no scaling
  const isVisible = progress <= 0.35;
  const opacity = Math.max(0, 1 - progress / 0.35);
  const translateY = -progress * 120; // 0.5x slow upward drift

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center select-none pointer-events-none"
      style={{
        opacity: isVisible ? opacity : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transform: `translate3d(0, ${translateY}px, 0)`
      }}
    >
      {/* 1. Micro-label: Inter 11px uppercase tracking 0.5em 60% opacity */}
      <div className="micro-label-text mb-6">
        REAL-TIME SOLAR SYSTEM SIMULATOR
      </div>

      {/* 2. Huge wordmark TERRAFORGE in League Gothic, cream, with a faint outline echo 6px above it at 25% opacity */}
      <div className="relative flex flex-col items-center justify-center my-4">
        {/* Outline echo 6px above at 25% opacity */}
        <span
          className="absolute hero-wordmark-echo select-none pointer-events-none"
          style={{ opacity: 0.25 }}
          aria-hidden="true"
        >
          TERRAFORGE
        </span>

        {/* Primary cream wordmark */}
        <h1 className="hero-wordmark-title text-cream z-10 select-none">
          TERRAFORGE
        </h1>
      </div>

      {/* 3. Tagline: Inter max 34 chars per line, tracking 0.22em, 80% opacity */}
      <p className="tagline-body-text mt-4">
        EVERY ORBIT. EVERY WORLD. IN REAL TIME.
      </p>

      {/* 4. Plain text link: ENTER THE SIMULATOR > */}
      <div className="mt-8 z-20 pointer-events-auto">
        <a
          href="#/sim"
          className="inline-flex items-center space-x-2 font-sans text-xs tracking-[0.2em] uppercase text-cream opacity-80 hover:opacity-100 transition-opacity border-b border-transparent hover:border-cream-30 pb-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
        >
          <span>ENTER THE SIMULATOR</span>
          <span className="ml-1 text-[11px]">&gt;</span>
        </a>
      </div>

      {/* 5. Subtle SCROLL cue with a 1px by 24px cream line pulsing slowly at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10">
        <span className="font-sans text-[10px] tracking-[0.45em] uppercase text-cream-60 mb-2">
          SCROLL
        </span>
        <div className="w-[1px] h-[24px] bg-[#FFF8E7] animate-scroll-cue" />
      </div>
    </div>
  );
}
