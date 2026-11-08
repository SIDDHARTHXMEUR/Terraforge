import React, { useState, useEffect, useRef } from 'react';

export function CinematicPrologueOverlay({
  isActive = true,
  onSkip
}) {
  const [elapsed, setElapsed] = useState(0);
  const animFrameRef = useRef();
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = performance.now();

    const loop = (now) => {
      const dt = (now - startTimeRef.current) / 1000.0;
      setElapsed(dt);

      if (dt < 16.0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        if (onSkip) onSkip();
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Skip on user interaction: click, key, or wheel
    const handleUserInterrupt = () => {
      if (onSkip) onSkip();
    };

    window.addEventListener('keydown', handleUserInterrupt);
    window.addEventListener('wheel', handleUserInterrupt, { passive: true });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleUserInterrupt);
      window.removeEventListener('wheel', handleUserInterrupt);
    };
  }, [isActive, onSkip]);

  if (!isActive) return null;

  // ---------------------------------------------------------------------------
  // TIMING & OPACITY CHOREOGRAPHY
  // ---------------------------------------------------------------------------

  // 1. Black Curtain Opacity
  // 0.0 - 1.0s: 1.0 -> 0.0 (revealing real star skybox)
  // 1.0 - 11.5s: 0.0 (transparent to live 3D scene)
  // 11.5 - 12.0s: 0.0 -> 1.0 (dip to black)
  // 12.0 - 13.5s: 1.0 (black background behind wordmark)
  // 13.5 - 14.5s: 1.0 -> 0.0 (revealing live solar overview)
  let blackCurtainOpacity = 0.0;
  if (elapsed < 1.0) {
    blackCurtainOpacity = Math.max(0.0, 1.0 - elapsed / 1.0);
  } else if (elapsed >= 11.5 && elapsed < 12.0) {
    blackCurtainOpacity = Math.min(1.0, (elapsed - 11.5) / 0.5);
  } else if (elapsed >= 12.0 && elapsed < 13.5) {
    blackCurtainOpacity = 1.0;
  } else if (elapsed >= 13.5 && elapsed <= 14.5) {
    blackCurtainOpacity = Math.max(0.0, 1.0 - (elapsed - 13.5) / 1.0);
  }

  // 2. 2.39:1 Letterbox Bars Slide In & Retract
  // 0.0 - 1.0s: height slides in from 0vh to 12.5vh
  // 1.0 - 13.5s: holds steady at 12.5vh
  // 13.5 - 14.5s: height retracts from 12.5vh to 0vh
  let letterboxHeightVh = 12.5;
  if (elapsed < 1.0) {
    letterboxHeightVh = (elapsed / 1.0) * 12.5;
  } else if (elapsed >= 13.5) {
    letterboxHeightVh = Math.max(0.0, (1.0 - (elapsed - 13.5) / 1.0) * 12.5);
  }

  // 3. TERRAFORGE Wordmark Card (12.0s - 14.5s)
  // Fades in at 12.0s, letter spacing expands 0.15em -> 0.35em over 1.5s, dissolves at 13.5 - 14.5s
  const isWordmarkStage = elapsed >= 12.0 && elapsed <= 14.5;
  let wordmarkAlpha = 0.0;
  let wordmarkSpacingEm = 0.15;

  if (isWordmarkStage) {
    if (elapsed < 12.4) {
      wordmarkAlpha = (elapsed - 12.0) / 0.4;
    } else if (elapsed <= 13.5) {
      wordmarkAlpha = 1.0;
    } else {
      wordmarkAlpha = Math.max(0.0, 1.0 - (elapsed - 13.5) / 0.9);
    }

    // Expand letter-spacing smoothly from 0.15em to 0.35em over 1.5s (12.0s to 13.5s)
    const spacingProgress = Math.min(1.0, (elapsed - 12.0) / 1.5);
    wordmarkSpacingEm = 0.15 + spacingProgress * 0.20;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden font-sans"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${blackCurtainOpacity.toFixed(3)})`
      }}
    >
      {/* 1. TERRAFORGE Wordmark Card (Centered within 2% of screen center) */}
      {isWordmarkStage && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center pointer-events-none px-4"
          style={{
            opacity: wordmarkAlpha,
            transition: 'opacity 0.1s linear'
          }}
        >
          <h1
            className="text-7xl sm:text-9xl md:text-[10rem] text-[#FFF8E7] uppercase leading-none drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]"
            style={{
              fontFamily: "'League Gothic', sans-serif",
              letterSpacing: `${wordmarkSpacingEm.toFixed(4)}em`
            }}
          >
            TERRAFORGE
          </h1>
          <p
            className="text-xs sm:text-sm font-sans tracking-[0.35em] uppercase text-[#D4AF37] mt-4 select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            REAL-TIME SOLAR SYSTEM SIMULATOR
          </p>
        </div>
      )}

      {/* 2. 2.39:1 Letterbox Bars (Top & Bottom) */}
      <div
        className="absolute top-0 inset-x-0 bg-black z-30 pointer-events-none"
        style={{ height: `${letterboxHeightVh.toFixed(2)}vh` }}
      />
      <div
        className="absolute bottom-0 inset-x-0 bg-black z-30 pointer-events-none"
        style={{ height: `${letterboxHeightVh.toFixed(2)}vh` }}
      />

      {/* 3. Plain-Text Accessible SKIP Button (Top-Right) */}
      <div className="absolute top-6 right-8 z-50 pointer-events-auto">
        <button
          onClick={onSkip}
          className="text-white/50 hover:text-white transition-colors cursor-pointer font-mono text-[11px] tracking-[0.25em] uppercase px-3 py-1.5 focus:outline-none"
          title="Skip Prologue"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}
