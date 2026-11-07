import React, { useState, useEffect } from 'react';

export function CinematicPrologueOverlay({
  isActive = true,
  onSkip
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const start = performance.now();
    const interval = setInterval(() => {
      const sec = (performance.now() - start) / 1000;
      setElapsed(sec);
      if (sec >= 26.0 && onSkip) {
        onSkip();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, onSkip]);

  if (!isActive) return null;

  // Anamorphic horizontal flare opacity during solar dawn (7s - 15s)
  const isSolarDawn = elapsed >= 7.0 && elapsed < 15.0;
  const flareIntensity = isSolarDawn
    ? Math.sin(((elapsed - 7.0) / 8.0) * Math.PI) * 0.75
    : 0.0;

  // Title opacity during stage 4 (18.5s - 25.5s)
  const isTitleStage = elapsed >= 18.5 && elapsed < 25.5;
  const titleOpacity = isTitleStage
    ? (elapsed < 20.5
        ? (elapsed - 18.5) / 2.0
        : (elapsed > 23.5
            ? Math.max(0, 1.0 - (elapsed - 23.5) / 2.0)
            : 1.0))
    : 0.0;

  // Letterbox retracts smoothly in final stage (24s+)
  const isRetracting = elapsed >= 24.0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden">
      {/* 1. 2.39:1 Anamorphic Letterbox Bars (Top & Bottom) with smooth retraction */}
      <div
        className={`absolute top-0 left-0 right-0 h-[8vh] sm:h-[10vh] bg-black transition-transform duration-1000 ease-in-out z-50 ${
          isRetracting ? '-translate-y-full' : 'translate-y-0'
        }`}
      ></div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-[8vh] sm:h-[10vh] bg-black transition-transform duration-1000 ease-in-out z-50 ${
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
        className="absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 z-50 pointer-events-none"
        style={{ opacity: titleOpacity }}
      >
        <div className="text-[12px] font-mono tracking-[0.55em] text-white/70 uppercase mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          A DEEPMIND ADVANCED SIMULATION
        </div>
        <h1 className="text-5xl sm:text-8xl font-normal tracking-[0.45em] text-white uppercase drop-shadow-[0_0_35px_rgba(255,255,255,0.7)] pl-4">
          TERRAFORGE
        </h1>
        <div className="text-xs font-mono tracking-[0.40em] text-white/80 uppercase mt-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          A HIGH-FIDELITY ASTRONOMICAL EXPEDITION
        </div>
      </div>

      {/* 4. Film Grain & Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]"></div>

      {/* 5. Skip Prologue Action */}
      <div className="absolute bottom-[11vh] right-8 z-50 pointer-events-auto">
        <button
          onClick={onSkip}
          className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors cursor-pointer border border-white/20 px-3 py-1 rounded-sm bg-black/40 backdrop-blur-md"
        >
          SKIP PROLOGUE &gt;
        </button>
      </div>
    </div>
  );
}
