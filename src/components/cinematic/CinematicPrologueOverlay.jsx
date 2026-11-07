import React, { useState, useEffect } from 'react';

export function CinematicPrologueOverlay({
  isActive = true,
  onSkip
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__skipPrologue = onSkip;
    }
  }, [onSkip]);

  // Click, key or scroll also skip immediately
  useEffect(() => {
    if (!isActive) return;

    const handleSkipTrigger = () => {
      if (onSkip) onSkip();
    };

    window.addEventListener('pointerdown', handleSkipTrigger);
    window.addEventListener('keydown', handleSkipTrigger);
    window.addEventListener('wheel', handleSkipTrigger, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleSkipTrigger);
      window.removeEventListener('keydown', handleSkipTrigger);
      window.removeEventListener('wheel', handleSkipTrigger);
    };
  }, [isActive, onSkip]);

  // Max 14.5s timer (under 15s hard ceiling)
  useEffect(() => {
    if (!isActive) return;

    const start = performance.now();
    const interval = setInterval(() => {
      const sec = (performance.now() - start) / 1000;
      setElapsed(sec);
      if (sec >= 14.5 && onSkip) {
        onSkip();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, onSkip]);

  if (!isActive) return null;

  // Anamorphic horizontal flare opacity during solar dawn (9s - 13s)
  const isSolarDawn = elapsed >= 9.0 && elapsed < 13.0;
  const flareIntensity = isSolarDawn
    ? Math.sin(((elapsed - 9.0) / 4.0) * Math.PI) * 0.70
    : 0.0;

  // Title opacity during stage 5 (12.5s - 14.5s)
  const isTitleStage = elapsed >= 12.0 && elapsed < 14.5;
  const titleOpacity = isTitleStage
    ? (elapsed < 13.2
        ? (elapsed - 12.0) / 1.2
        : Math.max(0, 1.0 - (elapsed - 13.2) / 1.3))
    : 0.0;

  // Letterbox retracts between 13.0s and 14.5s
  const isRetracting = elapsed >= 13.0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden">
      {/* 1. 2.39:1 Anamorphic Letterbox Bars (Top & Bottom) */}
      <div
        className={`absolute top-0 left-0 right-0 h-[8vh] sm:h-[10vh] bg-black transition-transform duration-1000 ease-out z-50 ${
          isRetracting ? '-translate-y-full' : 'translate-y-0'
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-[8vh] sm:h-[10vh] bg-black transition-transform duration-1000 ease-out z-50 ${
          isRetracting ? 'translate-y-full' : 'translate-y-0'
        }`}
      ></div>

      {/* 2. Restrained Anamorphic Horizontal Lens Flare Streak during Solar Dawn */}
      {flareIntensity > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center"
          style={{ opacity: flareIntensity }}
        >
          {/* Thin horizontal anamorphic light line */}
          <div
            className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent blur-[1px]"
            style={{ transform: 'translateY(-6vh)' }}
          ></div>
          <div
            className="w-full h-[8px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent blur-[6px]"
            style={{ transform: 'translateY(-6vh)' }}
          ></div>
          {/* Radial solar burst behind horizon */}
          <div
            className="w-[30vw] h-[30vw] rounded-full bg-radial from-amber-500/20 via-orange-600/10 to-transparent blur-[40px]"
            style={{ transform: 'translateY(-6vh)' }}
          ></div>
        </div>
      )}

      {/* 3. Monumental Christopher Nolan Title Reveal (Stage 4) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-1000 z-50 pointer-events-none"
        style={{ opacity: titleOpacity }}
      >
        <div className="text-[11px] font-mono tracking-[0.45em] text-white/40 uppercase mb-3">
          A DEEPMIND ADVANCED SIMULATION
        </div>
        <h1 className="text-5xl sm:text-8xl font-extralight tracking-[0.42em] text-white uppercase drop-shadow-[0_0_40px_rgba(255,255,255,0.35)] pl-4">
          TERRAFORGE
        </h1>
        <div className="text-xs font-mono tracking-[0.35em] text-white/60 uppercase mt-4">
          A HIGH-FIDELITY ASTRONOMICAL EXPEDITION
        </div>
      </div>

      {/* 4. Film Grain & Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]"></div>

      {/* 5. Skip Prologue Action (Plain text at top-right) */}
      <div className="absolute top-6 right-8 z-50 pointer-events-auto">
        <button
          onClick={onSkip}
          className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/50 hover:text-white transition-colors cursor-pointer p-0 bg-transparent border-0 outline-none"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}

