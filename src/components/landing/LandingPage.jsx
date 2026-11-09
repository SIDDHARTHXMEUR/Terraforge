import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { LandingScene } from './LandingScene';
import { LandingHeroOverlay } from './LandingHeroOverlay';
import { ChapterOverlay, CHAPTERS_DATA } from './ChapterOverlay';
import { NonWebGLFallback } from './NonWebGLFallback';

function checkWebGLSupport() {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (_) {
    return false;
  }
}

/**
 * Frame-rate-independent Critically Damped Spring (smoothDamp)
 * Smooth time ~140ms, zero velocity spikes, no overshoot
 */
function smoothDamp(current, target, velRef, smoothTime, dt, maxSpeed = 1.05) {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;

  const maxChange = maxSpeed * smoothTime;
  change = Math.min(Math.max(change, -maxChange), maxChange);
  const targetActual = current - change;

  const temp = (velRef.current + omega * change) * dt;
  velRef.current = (velRef.current - omega * temp) * exp;
  let output = targetActual + (change + temp) * exp;

  if (originalTo - current > 0.0 === output > originalTo) {
    output = originalTo;
    velRef.current = (output - originalTo) / Math.max(dt, 0.0001);
  }

  // Ensure no single-frame jump larger than 2.5% of one chapter (< 3% requirement)
  const maxStep = 0.025;
  if (Math.abs(output - current) > maxStep) {
    output = current + Math.sign(output - current) * maxStep;
  }

  return output;
}

export function LandingPage({
  externalCanvas = false,
  scrollProgressRef: externalProgressRef,
  onEnterSim
}) {
  const [hasWebGL] = useState(checkWebGLSupport);
  const containerRef = useRef(null);
  const localScrollProgressRef = useRef(0);
  const scrollProgressRef = externalProgressRef || localScrollProgressRef;
  const targetProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const [warmupProgress, setWarmupProgress] = useState(() => (typeof window !== 'undefined' ? window.__terraforgeWarmupProgress || 0 : 0));

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.__terraforgeWarmupProgress !== undefined) {
        setWarmupProgress(window.__terraforgeWarmupProgress);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // DOM Overlay Refs for compositor-level zero-render animation
  const heroRef = useRef(null);
  const chapterRefs = useRef([]);
  const statsRefs = useRef([]);
  const lineupRef = useRef(null);
  const systemRef = useRef(null);

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

  // Shared DOM Update Function: One source of truth for text layers
  const updateOverlays = (p) => {
    // Expose for testing
    window.__terraforgeLandingProgress = p;

    // 1. Hero Overlay: Parallaxes upward slowly (0.5x) and fades out completely by p = 0.35
    if (heroRef.current) {
      if (p <= 0.35) {
        const op = Math.max(0, 1 - p / 0.35);
        const ty = -p * 120;
        heroRef.current.style.opacity = op;
        heroRef.current.style.visibility = 'visible';
        heroRef.current.style.transform = `translate3d(0, ${ty}px, 0)`;
      } else {
        heroRef.current.style.opacity = 0;
        heroRef.current.style.visibility = 'hidden';
      }
    }

    // 2. Chapters (k = 1 to 6)
    const dominantIndex = Math.round(p);
    CHAPTERS_DATA.forEach((ch, idx) => {
      const k = ch.progressKey; // 1, 2, 3, 4, 5, 6
      const el = chapterRefs.current[idx];
      const statsEl = statsRefs.current[idx];
      if (!el) return;

      const delta = p - k;
      if (Math.abs(delta) < 0.5) {
        // Crossfade: opacity = 1 - 2 * |delta|
        const op = Math.max(0, 1 - 2 * Math.abs(delta));
        const ty = delta * 24;
        el.style.opacity = op;
        el.style.visibility = 'visible';
        el.style.transform = `translate3d(0, ${ty}px, 0)`;

        // Stats strip belongs to exactly ONE chapter at a time
        if (statsEl) {
          const isDom = dominantIndex === k;
          statsEl.style.opacity = isDom ? 1 : 0;
          statsEl.style.visibility = isDom ? 'visible' : 'hidden';
        }
      } else {
        el.style.opacity = 0;
        el.style.visibility = 'hidden';
        if (statsEl) {
          statsEl.style.opacity = 0;
          statsEl.style.visibility = 'hidden';
        }
      }
    });

    // 3. Section 8: Lineup (k = 7)
    if (lineupRef.current) {
      const delta = p - 7;
      if (Math.abs(delta) < 0.5) {
        const op = Math.max(0, 1 - 2 * Math.abs(delta));
        const ty = delta * 24;
        lineupRef.current.style.opacity = op;
        lineupRef.current.style.visibility = 'visible';
        lineupRef.current.style.transform = `translate3d(0, ${ty}px, 0)`;
      } else {
        lineupRef.current.style.opacity = 0;
        lineupRef.current.style.visibility = 'hidden';
      }
    }

    // 4. Section 9: The System & CTA (k = 8)
    if (systemRef.current) {
      const delta = p - 8;
      if (Math.abs(delta) < 0.5) {
        const op = Math.max(0, 1 - 2 * Math.abs(delta));
        const ty = delta * 24;
        systemRef.current.style.opacity = op;
        systemRef.current.style.visibility = 'visible';
        systemRef.current.style.transform = `translate3d(0, ${ty}px, 0)`;
      } else {
        systemRef.current.style.opacity = 0;
        systemRef.current.style.visibility = 'hidden';
      }
    }
  };

  // Main Render Loop: Critically damped spring smoothing (frame-rate independent)
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // clamp max dt to 50ms
      lastTime = now;

      if (reducedMotion) {
        scrollProgressRef.current = targetProgressRef.current;
        velocityRef.current = 0;
      } else {
        scrollProgressRef.current = smoothDamp(
          scrollProgressRef.current,
          targetProgressRef.current,
          velocityRef,
          0.14, // 140ms time constant
          dt
        );
      }

      window.__terraforgeLandingVelocity = velocityRef.current;

      updateOverlays(scrollProgressRef.current);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [reducedMotion]);

  // Normalized Wheel Handler (Passive, zero layout reads, eliminates velocity spikes)
  useEffect(() => {
    const handleWheel = (e) => {
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 36;
      else if (e.deltaMode === 2) delta *= 600;

      // Clamp wheel notch impulses to prevent spikes
      const clamped = Math.sign(delta) * Math.min(Math.abs(delta), 80);
      const deltaUnits = clamped / 1500; // normalized smooth input mapping

      targetProgressRef.current = THREE.MathUtils.clamp(
        targetProgressRef.current + deltaUnits,
        0,
        8
      );
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      touchStartY = currentY;
      const clamped = Math.sign(deltaY) * Math.min(Math.abs(deltaY), 60);
      targetProgressRef.current = THREE.MathUtils.clamp(
        targetProgressRef.current + clamped / 400,
        0,
        8
      );
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const onSetProgress = (e) => {
      if (typeof e.detail === 'number') {
        targetProgressRef.current = e.detail;
        scrollProgressRef.current = e.detail;
        updateOverlays(e.detail);
      }
    };
    window.addEventListener('terraforge-set-progress', onSetProgress);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('terraforge-set-progress', onSetProgress);
    };
  }, []);

  // Keyboard navigation: Space/Down/PageDown/Up/PageUp/End/Home
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        targetProgressRef.current = Math.min(8, Math.floor(targetProgressRef.current + 0.05) + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, Math.ceil(targetProgressRef.current - 0.05) - 1);
      } else if (e.key === 'End') {
        e.preventDefault();
        targetProgressRef.current = 8;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetProgressRef.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToChapter = (targetP) => {
    targetProgressRef.current = THREE.MathUtils.clamp(targetP, 0, 8);
  };

  if (!hasWebGL) {
    return <NonWebGLFallback />;
  }

  return (
    <div
      ref={containerRef}
      className="landing-viewport bg-deep-space text-cream select-none"
      tabIndex={0}
    >
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

      {/* Single 3D Canvas fixed behind the document (rendered internally only if not hosted in unified App canvas) */}
      {!externalCanvas && (
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
      )}

      {/* Viewport Overlay Layers: All positioned and faded from smoothProgress */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {/* SECTION 1: HERO (progress ~ 0.0) */}
        <div ref={heroRef} className="absolute inset-0">
          <LandingHeroOverlay />
        </div>

        {/* SECTIONS 2 to 7: PLANET CHAPTERS (Sol, Mercury, Earth, Mars, Jupiter, Saturn) */}
        {CHAPTERS_DATA.map((chapter, idx) => (
          <ChapterOverlay
            key={chapter.id}
            chapter={chapter}
            ref={(el) => (chapterRefs.current[idx] = el)}
            statsRef={(el) => (statsRefs.current[idx] = el)}
            onNext={navigateToChapter}
          />
        ))}

        {/* SECTION 8: LINEUP (progress ~ 7.0) */}
        <div
          ref={lineupRef}
          id="lineup"
          className="absolute inset-0 flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-16 md:pt-24 pb-4 md:pb-8 select-none pointer-events-none transition-none"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
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
              onClick={() => navigateToChapter(8)}
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

          {/* Bottom Radius Readouts linking to datum line ticks */}
          <div className="w-full flex items-center justify-between border-t border-cream-14 pt-4 pb-2 z-20 pointer-events-auto bg-black/40 backdrop-blur-sm overflow-x-auto text-[10px] sm:text-xs">
            <div className="text-center px-2">
              <span className="font-mono text-amber-400 block">696,340 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">SOL</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#B8B2A7] block">2,440 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">MERCURY</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#E8D08A] block">6,052 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">VENUS</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#5BB8FF] block">6,371 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">EARTH</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#E2673A] block">3,390 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">MARS</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#D9A066] block">69,911 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">JUPITER</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-[#E8D08A] block">58,232 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">SATURN</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-cyan-300 block">25,362 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">URANUS</span>
            </div>
            <div className="text-center px-2">
              <span className="font-mono text-blue-400 block">24,622 KM</span>
              <span className="font-sans text-cream-60 uppercase tracking-widest text-[9px]">NEPTUNE</span>
            </div>
          </div>
        </div>

        {/* SECTION 9: THE SYSTEM & CTA (progress ~ 8.0) */}
        <div
          ref={systemRef}
          id="system"
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center select-none pointer-events-none transition-none"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <div className="max-w-xl z-20 pointer-events-auto">
            <span className="font-sans text-[11px] uppercase tracking-[0.5em] text-cream-60 mb-4 block">
              THE SIMULATOR
            </span>
            <h2 className="font-serif text-5xl sm:text-7xl font-normal uppercase tracking-[0.12em] text-cream mb-4">
              EIGHT WORLDS, ONE STAR.
            </h2>
            <p className="font-sans text-[14px] sm:text-[15px] leading-[1.6] text-cream-85 mb-8 max-w-[34ch] mx-auto">
              Eight worlds. Keplerian orbits. 1:1 astronomical time or up to 10,000x.
            </p>
            <button
              onClick={() => {
                if (onEnterSim) onEnterSim();
                else window.location.hash = '#/sim';
              }}
              className="relative inline-flex items-center space-x-3 px-8 py-4 border border-cream-30 hover:border-cream text-cream font-sans text-xs uppercase tracking-[0.25em] transition-all hover:bg-white/10 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white overflow-hidden group"
            >
              {warmupProgress < 1.0 ? (
                <>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] bg-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.round(warmupProgress * 100)}%` }}
                  />
                  <span>PREPARING {Math.round(warmupProgress * 100)}%</span>
                </>
              ) : (
                <>
                  <span>ENTER THE SIMULATOR</span>
                  <span className="text-sm font-mono">&gt;</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Status Readout */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 text-[10px] font-mono tracking-widest text-cream-40 uppercase pointer-events-none">
            <span>ORBIT IGNITION 100%</span>
            <span>•</span>
            <span>STANDBY AT STARTING POSE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
