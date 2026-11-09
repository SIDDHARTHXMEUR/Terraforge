import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { LandingHeroOverlay } from './LandingHeroOverlay';
import { ChapterOverlay, CHAPTERS_DATA } from './ChapterOverlay';

export function LandingPage({
  scrollProgressRef,
  visible = true,
  onNavigateSim
}) {
  const scrollContainerRef = useRef(null);
  const targetProgressRef = useRef(0);

  // Detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  // Smooth inertial scroll tracker in code (no external library, ref-based, zero React re-renders)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const progress = (container.scrollTop / maxScroll) * 8.0;
      targetProgressRef.current = progress;
      if (reducedMotion && scrollProgressRef) {
        scrollProgressRef.current = progress;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    let animationId;
    let lastTime = performance.now();
    if (!reducedMotion) {
      const loop = (now) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        if (scrollProgressRef) {
          const current = scrollProgressRef.current || 0;
          const target = targetProgressRef.current;
          // Exact critically damped (~140ms) smoothing
          const alpha = 1.0 - Math.exp(-dt / 0.14);
          scrollProgressRef.current = current + (target - current) * alpha;
        }
        animationId = requestAnimationFrame(loop);
      };
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [reducedMotion, scrollProgressRef]);

  // Keyboard navigation: Down/PageDown/Space to next section, Up/PageUp to previous, End to last
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !visible) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const viewportH = window.innerHeight;
      const sectionHeight = viewportH * 1.3; // 130vh per section
      const currentSection = Math.round(container.scrollTop / sectionHeight);
      const scrollBehavior = reducedMotion ? 'auto' : 'smooth';

      if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const nextSection = Math.min(8, currentSection + 1);
        container.scrollTo({ top: nextSection * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const prevSection = Math.max(0, currentSection - 1);
        container.scrollTo({ top: prevSection * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'End') {
        e.preventDefault();
        container.scrollTo({ top: 8 * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'Home') {
        e.preventDefault();
        container.scrollTo({ top: 0, behavior: scrollBehavior });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reducedMotion, visible]);

  const handleScrollToHash = (hash) => {
    if (!scrollContainerRef.current) return;
    const target = scrollContainerRef.current.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div
      className="absolute inset-0 z-10 text-cream overflow-hidden select-none transition-opacity duration-600"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transitionDuration: '600ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {/* Hidden-until-focused skip link */}
      <a
        href="#/sim"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-[#04060B] border border-cream text-cream px-4 py-2 font-sans text-[11px] uppercase tracking-[0.2em] outline-none ring-2 ring-white"
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
          onClick={() => onNavigateSim && onNavigateSim('#/sim')}
          className="pointer-events-auto font-sans text-[11px] uppercase tracking-[0.25em] text-cream opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-white py-1"
        >
          SIMULATOR
        </a>
      </header>

      {/* Scrolling document with 9 sections, each 130vh, smooth inertial scroll */}
      <main
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto outline-none"
        tabIndex={0}
      >
        {/* SECTION 1: HERO */}
        <section
          id="hero"
          className="landing-section flex items-center justify-center"
        >
          <LandingHeroOverlay />
        </section>

        {/* SECTIONS 2 to 7: PLANET CHAPTERS (Sol, Mercury, Earth, Mars, Jupiter, Saturn) */}
        {CHAPTERS_DATA.map((chapter) => (
          <section
            key={chapter.id}
            id={chapter.id}
            className="landing-section flex flex-col justify-between"
          >
            <ChapterOverlay
              chapter={chapter}
              onNext={handleScrollToHash}
            />
          </section>
        ))}

        {/* SECTION 8: LINEUP (To Scale - Sizes Only) */}
        <section
          id="lineup"
          className="landing-section relative flex flex-col justify-between"
        >
          <div className="sticky top-0 w-full h-screen flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-24 pb-8 select-none pointer-events-none">
            {/* Header / Title block */}
            <div className="z-20 pointer-events-auto max-w-2xl">
              <div className="flex items-center space-x-3 mb-3">
                <span className="inline-block w-[2px] h-[14px] bg-[#5BB8FF]" />
                <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-cream-60">
                  07 / SCALE
                </span>
              </div>
              <h2 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal uppercase tracking-[0.12em] text-cream leading-tight">
                THE SYSTEM, TO SCALE
              </h2>
              <p className="font-sans text-xs tracking-[0.2em] text-cream-60 uppercase mt-2">
                PHYSICAL RADII PRESERVED // JUPITER IS VISIBLY 11X EARTH // SOL DWARFS ALL
              </p>
            </div>

            {/* Right-edge Pager */}
            <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 flex flex-col items-end z-20 pointer-events-auto">
              <div className="font-mono text-xs sm:text-sm tracking-widest text-cream-60 mb-4">
                08 / 09
              </div>
              <button
                onClick={() => handleScrollToHash('#system')}
                className="group flex items-center space-x-2 text-right cursor-pointer focus:outline-none"
              >
                <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream-40 group-hover:text-cream transition-colors">
                  NEXT: THE SYSTEM
                </span>
                <span className="text-cream-40 group-hover:text-cream transition-colors font-mono text-xs">
                  &gt;
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 9: THE SYSTEM & CTA */}
        <section
          id="system"
          className="landing-section relative flex flex-col justify-between"
        >
          <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center px-6 text-center select-none">
            <div className="max-w-xl z-20">
              <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-cream-60 mb-4 block">
                THE SIMULATOR
              </span>
              <h2 className="font-serif text-5xl sm:text-7xl font-normal uppercase tracking-[0.12em] text-cream mb-4">
                EIGHT WORLDS, ONE STAR.
              </h2>
              <p className="font-sans text-[14px] sm:text-[15px] leading-[1.6] text-cream-85 mb-8 max-w-[34ch] mx-auto">
                Eight worlds, one star. True Keplerian mechanics across deep space.
              </p>
              <a
                href="#/sim"
                onClick={() => onNavigateSim && onNavigateSim('#/sim')}
                className="inline-flex items-center space-x-3 px-8 py-4 border border-cream-30 hover:border-cream text-cream font-sans text-xs uppercase tracking-[0.25em] transition-all hover:bg-white/10 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span>ENTER THE SIMULATOR</span>
                <span className="text-sm font-mono">&gt;</span>
              </a>
            </div>

            {/* Bottom Status Readout */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 text-[10px] font-mono tracking-widest text-cream-40 uppercase pointer-events-none">
              <span>ORBIT IGNITION 100%</span>
              <span>•</span>
              <span>STANDBY AT STARTING POSE</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
