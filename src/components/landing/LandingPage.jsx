import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { LandingScene } from './LandingScene';
import { LandingHeroOverlay } from './LandingHeroOverlay';

export function LandingPage() {
  const scrollContainerRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const targetProgressRef = useRef(0);

  // Smooth inertial scroll tracker in code (no external library, ref-based, zero React re-renders)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const progress = (container.scrollTop / maxScroll) * 8.0;
      targetProgressRef.current = progress;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    let animationId;
    const loop = () => {
      const current = scrollProgressRef.current;
      const target = targetProgressRef.current;
      scrollProgressRef.current = THREE.MathUtils.lerp(current, target, 0.08);
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Keyboard navigation: Down/PageDown/Space to next section, Up/PageUp to previous, End to last
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const viewportH = window.innerHeight;
      const sectionHeight = viewportH * 1.3; // 130vh per section
      const currentSection = Math.round(container.scrollTop / sectionHeight);

      if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const nextSection = Math.min(8, currentSection + 1);
        container.scrollTo({ top: nextSection * sectionHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const prevSection = Math.max(0, currentSection - 1);
        container.scrollTo({ top: prevSection * sectionHeight, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        container.scrollTo({ top: 8 * sectionHeight, behavior: 'smooth' });
      } else if (e.key === 'Home') {
        e.preventDefault();
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-deep-space text-cream overflow-hidden select-none">
      {/* Hidden-until-focused skip link */}
      <a
        href="#/sim"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-deep-space border border-cream text-cream px-4 py-2 font-sans text-[11px] uppercase tracking-[0.2em] outline-none ring-2 ring-white"
      >
        Skip to simulator
      </a>

      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-12 py-6 pointer-events-none">
        {/* Top-left: plain text TERRAFORGE (League Gothic, cream, 18 px, tracking 0.25em) */}
        <span className="font-wordmark text-[18px] tracking-[0.25em] text-cream uppercase select-none pointer-events-auto">
          TERRAFORGE
        </span>

        {/* Top-right: a single plain text link "SIMULATOR" jumping to #/sim */}
        <a
          href="#/sim"
          className="pointer-events-auto font-sans text-[11px] uppercase tracking-[0.25em] text-cream opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-white py-1"
        >
          SIMULATOR
        </a>
      </header>

      {/* Single 3D Canvas fixed behind the document */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          className="w-full h-full bg-deep-space"
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15
          }}
          camera={{
            fov: 44,
            near: 0.1,
            far: 3000,
            position: [0, 1.2, 5.0]
          }}
        >
          <Suspense fallback={null}>
            <LandingScene scrollProgressRef={scrollProgressRef} />
          </Suspense>
        </Canvas>
      </div>

      {/* Scrolling document with 9 sections, each 130vh, snap-scroll with CSS scroll-snap proximity */}
      <main
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto scroll-snap-proximity outline-none"
        tabIndex={0}
      >
        {/* SECTION 1: HERO */}
        <section
          id="hero"
          className="landing-section flex items-center justify-center"
        >
          <LandingHeroOverlay />
        </section>

        {/* SECTION 2: SOL (Placeholder for Stage 2) */}
        <section
          id="sol"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#FFB347] uppercase tracking-widest">01 / STAR</span>
            <h2 className="font-serif text-4xl text-cream mt-1">SOL</h2>
          </div>
        </section>

        {/* SECTION 3: MERCURY (Placeholder for Stage 2) */}
        <section
          id="mercury"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#B8B2A7] uppercase tracking-widest">02 / INNER SYSTEM</span>
            <h2 className="font-serif text-4xl text-cream mt-1">MERCURY</h2>
          </div>
        </section>

        {/* SECTION 4: EARTH (Placeholder for Stage 2) */}
        <section
          id="earth"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#5BB8FF] uppercase tracking-widest">03 / HABITABLE WORLD</span>
            <h2 className="font-serif text-4xl text-cream mt-1">EARTH</h2>
          </div>
        </section>

        {/* SECTION 5: MARS (Placeholder for Stage 2) */}
        <section
          id="mars"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#E2673A] uppercase tracking-widest">04 / THE RED PLANET</span>
            <h2 className="font-serif text-4xl text-cream mt-1">MARS</h2>
          </div>
        </section>

        {/* SECTION 6: JUPITER (Placeholder for Stage 2) */}
        <section
          id="jupiter"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#D9A066] uppercase tracking-widest">05 / GAS GIANT</span>
            <h2 className="font-serif text-4xl text-cream mt-1">JUPITER</h2>
          </div>
        </section>

        {/* SECTION 7: SATURN (Placeholder for Stage 2) */}
        <section
          id="saturn"
          className="landing-section flex items-center justify-start px-6 sm:px-16"
        >
          <div className="max-w-md opacity-40">
            <span className="font-mono text-[10px] text-[#E8D08A] uppercase tracking-widest">06 / RINGED MONARCH</span>
            <h2 className="font-serif text-4xl text-cream mt-1">SATURN</h2>
          </div>
        </section>

        {/* SECTION 8: LINEUP (Placeholder for Stage 3) */}
        <section
          id="lineup"
          className="landing-section flex items-center justify-center px-6"
        >
          <div className="text-center opacity-40">
            <span className="font-mono text-[10px] text-[#5BB8FF] uppercase tracking-widest">07 / SCALE</span>
            <h2 className="font-serif text-4xl text-cream mt-1">THE SYSTEM, TO SCALE</h2>
          </div>
        </section>

        {/* SECTION 9: THE SYSTEM & CTA (Placeholder for Stage 3) */}
        <section
          id="system"
          className="landing-section flex flex-col items-center justify-center px-6 text-center"
        >
          <div className="max-w-md">
            <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-cream-60 mb-2 block">
              THE SIMULATOR
            </span>
            <h2 className="font-serif text-4xl text-cream mb-4">NINE WORLDS</h2>
            <p className="font-sans text-[13px] text-cream-85 mb-6">
              Keplerian orbits. 1:1 astronomical time or up to 10,000x.
            </p>
            <a
              href="#/sim"
              className="inline-block px-6 py-3 border border-cream-30 hover:border-cream font-sans text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/10"
            >
              ENTER THE SIMULATOR &gt;
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
