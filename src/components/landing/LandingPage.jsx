import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { LandingScene } from './LandingScene';
import { LandingHeroOverlay } from './LandingHeroOverlay';
import { SolarSystemEditorial } from './SolarSystemEditorial';
import { ChapterOverlay, CHAPTERS_DATA } from './ChapterOverlay';
import { PlanetaryMotionSection } from './PlanetaryMotionSection';
import { SimulatorPreviewSection } from './SimulatorPreviewSection';
import { FinalCTASection } from './FinalCTASection';
import { NonWebGLFallback } from './NonWebGLFallback';

const TOTAL_SECTIONS_INDEX = 12;

function checkWebGLSupport() {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (_) {
    return false;
  }
}

export function LandingPage() {
  const [hasWebGL] = useState(checkWebGLSupport);
  const scrollContainerRef = useRef(null);
  const scrollProgressRef = useRef(0);
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

  // Smooth inertial scroll tracker in code (disabled under reduced motion for instant cuts)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      const progress = (container.scrollTop / maxScroll) * TOTAL_SECTIONS_INDEX;
      targetProgressRef.current = progress;
      if (reducedMotion) {
        scrollProgressRef.current = progress;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    let animationId;
    if (!reducedMotion) {
      const loop = () => {
        const current = scrollProgressRef.current;
        const target = targetProgressRef.current;
        scrollProgressRef.current = THREE.MathUtils.lerp(current, target, 0.08);
        animationId = requestAnimationFrame(loop);
      };
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [reducedMotion]);

  // Keyboard navigation: Down/PageDown/Space to next section, Up/PageUp to previous, End to last
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const viewportH = window.innerHeight;
      const sectionHeight = viewportH * 1.3; // 130vh per section
      const currentSection = Math.round(container.scrollTop / sectionHeight);
      const scrollBehavior = reducedMotion ? 'auto' : 'smooth';

      if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        const nextSection = Math.min(TOTAL_SECTIONS_INDEX, currentSection + 1);
        container.scrollTo({ top: nextSection * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        const prevSection = Math.max(0, currentSection - 1);
        container.scrollTo({ top: prevSection * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'End') {
        e.preventDefault();
        container.scrollTo({ top: TOTAL_SECTIONS_INDEX * sectionHeight, behavior: scrollBehavior });
      } else if (e.key === 'Home') {
        e.preventDefault();
        container.scrollTo({ top: 0, behavior: scrollBehavior });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reducedMotion]);

  const handleScrollToHash = (hash) => {
    if (!scrollContainerRef.current) return;
    const target = scrollContainerRef.current.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  if (!hasWebGL) {
    return <NonWebGLFallback />;
  }

  return (
    <div className="relative w-screen h-screen bg-deep-space text-[#E9EDF2] overflow-hidden select-none">
      {/* Hidden-until-focused skip link */}
      <a
        href="#/sim"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-[#080B10] border border-[#E9EDF2] text-[#E9EDF2] px-4 py-2 font-sans text-[11px] uppercase tracking-[0.2em] outline-none ring-2 ring-[#7AD1FF]"
      >
        Skip to simulator
      </a>

      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-12 py-6 pointer-events-none">
        {/* Top-left: plain text TERRAFORGE (League Gothic, soft white, 18 px, tracking 0.25em) */}
        <span className="font-wordmark text-[18px] tracking-[0.25em] text-[#E9EDF2] uppercase select-none pointer-events-auto">
          TERRAFORGE
        </span>

        {/* Top-right: a single plain text link "SIMULATOR" jumping to #/sim */}
        <a
          href="#/sim"
          className="pointer-events-auto font-sans text-[11px] uppercase tracking-[0.25em] text-[#E9EDF2] opacity-75 hover:opacity-100 hover:text-[#7AD1FF] transition-all focus:outline-none focus:ring-1 focus:ring-[#7AD1FF] py-1"
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

      {/* Scrolling document with 13 sections (min-h-[130vh] each), snap-scroll with CSS scroll-snap proximity */}
      <main
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto scroll-snap-proximity outline-none"
        tabIndex={0}
      >
        {/* SECTION 01: THE OPENING EXPERIENCE (Hero) */}
        <section
          id="hero"
          className="landing-section flex items-center justify-center"
        >
          <LandingHeroOverlay
            onExploreUniverse={() => handleScrollToHash('#solarsystem')}
          />
        </section>

        {/* SECTION 02: THE SOLAR SYSTEM (Calm Sun Emergence + 8-Planet Architectural Overview) */}
        <section
          id="solarsystem"
          className="landing-section flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
        >
          <SolarSystemEditorial
            onSelectPlanet={(planetKey) => handleScrollToHash(`#${planetKey}`)}
          />
        </section>

        {/* SECTION 03: INDIVIDUAL PLANETARY STORIES (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune) */}
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

        {/* SECTION 04: UNDERSTANDING PLANETARY MOTION (Dynamics) */}
        <section
          id="dynamics"
          className="landing-section flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <PlanetaryMotionSection />
        </section>

        {/* SECTION 05: THE SIMULATOR INTRODUCTION (Interactive Engine Preview & Capabilities) */}
        <section
          id="preview"
          className="landing-section flex items-center justify-center bg-black/50 backdrop-blur-md"
        >
          <SimulatorPreviewSection />
        </section>

        {/* SECTION 06: FINAL CALL TO ACTION */}
        <section
          id="cta"
          className="landing-section flex items-center justify-center"
        >
          <FinalCTASection />
        </section>
      </main>
    </div>
  );
}
